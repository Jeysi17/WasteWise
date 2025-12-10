import React, { useState, useEffect, useRef } from 'react';
import { 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  View, 
  ScrollView, 
  Linking, 
  SafeAreaView, 
  Dimensions,
  Modal,
  Alert,
  Image,
  Animated,
  PanResponder,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import colors from '../../constant/colors';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Use environment variable
const API_URL = `${process.env.EXPO_PUBLIC_HOST_URL}/api/materials`;

// Image Placeholder Component
const ImagePlaceholder = ({ size = SCREEN_WIDTH * 0.7 }) => (
  <View style={[styles.imagePlaceholder, { width: size, height: size * 0.6 }]}>
    <Text style={styles.placeholderText}>Image Not Available</Text>
  </View>
);

// Zoomable Image Component (if needed for slogans)
const ZoomableImage = ({ source, onZoomChange }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  const [isZoomed, setIsZoomed] = useState(false);
  const lastTap = useRef(null);
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  const IMAGE_WIDTH = SCREEN_WIDTH;
  const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.7;

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap.current && (now - lastTap.current) < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (isZoomed) {
        // Zoom out
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
            tension: 40
          }),
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 40
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 40
          }),
        ]).start();
        setIsZoomed(false);
        lastScale.current = 1;
        lastTranslateX.current = 0;
        lastTranslateY.current = 0;
        if (onZoomChange) onZoomChange(1);
      } else {
        // Zoom in to 2.5x
        Animated.spring(scale, {
          toValue: 2.5,
          useNativeDriver: true,
          friction: 8,
          tension: 40
        }).start();
        setIsZoomed(true);
        lastScale.current = 2.5;
        if (onZoomChange) onZoomChange(2.5);
      }
      lastTap.current = null;
    } else {
      lastTap.current = now;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isZoomed,
      onMoveShouldSetPanResponder: () => isZoomed,
      onPanResponderGrant: () => {
        translateX.setOffset(translateX._value);
        translateY.setOffset(translateY._value);
        translateX.setValue(0);
        translateY.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: translateX, dy: translateY }
        ],
        {
          useNativeDriver: false,
          listener: (event, gestureState) => {
            if (!isZoomed) return;

            const maxTranslateX = (IMAGE_WIDTH * (lastScale.current - 1)) / 2;
            const maxTranslateY = (IMAGE_HEIGHT * (lastScale.current - 1)) / 2;
            
            const currentX = gestureState.dx;
            const currentY = gestureState.dy;
            
            const boundedX = Math.min(Math.max(currentX, -maxTranslateX), maxTranslateX);
            const boundedY = Math.min(Math.max(currentY, -maxTranslateY), maxTranslateY);
            
            translateX.setValue(boundedX);
            translateY.setValue(boundedY);
          }
        }
      ),
      onPanResponderRelease: () => {
        if (!isZoomed) return;

        lastTranslateX.current = translateX._value + (translateX._offset || 0);
        lastTranslateY.current = translateY._value + (translateY._offset || 0);
        
        translateX.flattenOffset();
        translateY.flattenOffset();
      },
      onPanResponderTerminate: () => {
        translateX.flattenOffset();
        translateY.flattenOffset();
      },
    })
  ).current;

  return (
    <View style={styles.zoomContainer}>
      <Animated.Image
        {...panResponder.panHandlers}
        source={source}
        style={[
          styles.zoomableImage,
          {
            transform: [
              { scale: scale },
              { translateX: translateX },
              { translateY: translateY },
            ],
          },
        ]}
        resizeMode="contain"
      />
      <TouchableOpacity 
        activeOpacity={1}
        onPress={handleDoubleTap}
        style={StyleSheet.absoluteFill}
        pointerEvents="box-only"
      />
    </View>
  );
};

// Helper function to sort materials by date (newest first)
const sortByNewestDate = (materials) => {
  return [...materials].sort((a, b) => {
    // Convert date strings to Date objects for comparison
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    
    // Sort in descending order (newest first)
    return dateB.getTime() - dateA.getTime();
  });
};

export default function InfoScreen({ navigation }) {
  const [materials, setMaterials] = useState([]); // All materials in one array
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlogan, setSelectedSlogan] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Refs for interval
  const refreshIntervalRef = useRef(null);

  // Function to determine button text based on URL type
  const getButtonText = (material) => {
    // Use backend's button_text if available
    if (material.button_text) return material.button_text;
    
    // Determine based on link URL
    if (material.link_url) {
      const url = material.link_url.toLowerCase();
      
      // YouTube videos
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'Watch Now';
      }
      
      // PDFs
      if (url.includes('.pdf')) {
        return 'Read PDF';
      }
      
      // Articles, blogs, documentation
      if (url.includes('article') || 
          url.includes('blog') || 
          url.includes('read') ||
          url.includes('docs') ||
          url.includes('tutorial') ||
          url.includes('guide')) {
        return 'Read More';
      }
      
      // Images
      if (url.includes('.jpg') || 
          url.includes('.jpeg') || 
          url.includes('.png') ||
          url.includes('.gif')) {
        return 'View Image';
      }
      
      // Default for other URLs
      return 'Open Link';
    }
    
    // For materials without link_url but with thumbnail (slogans)
    if (material.thumbnail_path && !material.link_url) {
      return 'View Slogan';
    }
    
    // Default fallback
    return 'Read More';
  };

  useEffect(() => {
    // Initial fetch
    fetchMaterials();
    
    // Set up auto-refresh every 3 seconds
    refreshIntervalRef.current = setInterval(() => {
      console.log('🔄 Auto-refreshing materials...');
      setRefreshCount(prev => prev + 1);
      fetchMaterials();
    }, 3000); // 3 seconds
    
    // Clean up interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const fetchMaterials = async () => {
    try {
      // Don't show loading indicator on auto-refresh to avoid UI flicker
      const isInitialLoad = refreshCount === 0;
      if (isInitialLoad) {
        setLoading(true);
      }
      
      setError(null);
      console.log(`📡 Fetching materials... (Refresh #${refreshCount})`);
      
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Data received (${data.length} items)`);
      
      // Check if data is an array
      if (!Array.isArray(data)) {
        throw new Error('Expected array but got: ' + typeof data);
      }
      
      // Sort all materials by newest date first
      const sortedMaterials = sortByNewestDate(data);
      
      console.log(`📊 Total materials: ${sortedMaterials.length}`);
      console.log(`📅 Newest material date: ${sortedMaterials[0]?.created_at}`);
      
      setMaterials(sortedMaterials);
      
      // Update last successful fetch time
      setLastUpdate(new Date().toLocaleTimeString());
      
    } catch (error) {
      console.error('❌ Error fetching materials:', error);
      setError(error.message);
      // Only show alert on initial load, not on auto-refresh failures
      if (refreshCount === 0) {
        Alert.alert('Error', `Failed to load materials: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const openSloganImage = (slogan) => {
    // Get all slogans (materials without link_url)
    const slogans = materials.filter(m => !m.link_url && m.thumbnail_path);
    
    if (!slogans || slogans.length === 0) {
      Alert.alert('Error', 'No slogans available');
      return;
    }
    
    const index = slogans.findIndex(s => s.id === slogan.id);
    if (index === -1) {
      Alert.alert('Error', 'Slogan not found');
      return;
    }
    
    setCurrentIndex(index);
    setSelectedSlogan(slogan);
    setModalVisible(true);
    setCurrentZoom(1);
  };

  const closeSloganImage = () => {
    setModalVisible(false);
    setSelectedSlogan(null);
    setCurrentIndex(0);
    setCurrentZoom(1);
  };

  const goToNext = () => {
    const slogans = materials.filter(m => !m.link_url && m.thumbnail_path);
    if (!slogans || currentIndex >= slogans.length - 1) return;
    
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    setSelectedSlogan(slogans[newIndex]);
    setCurrentZoom(1);
  };

  const goToPrevious = () => {
    const slogans = materials.filter(m => !m.link_url && m.thumbnail_path);
    if (!slogans || currentIndex <= 0) return;
    
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    setSelectedSlogan(slogans[newIndex]);
    setCurrentZoom(1);
  };

  const openLink = async (url) => {
    try {
      if (!url) {
        Alert.alert('Error', 'No link available');
        return;
      }
      
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = null;
        
        if (url.includes('youtube.com/watch?v=')) {
          videoId = url.split('watch?v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1]?.split('?')[0];
        }
  
        if (videoId) {
          const youtubeAppUrl = `vnd.youtube://watch?v=${videoId}`;
          const canOpenYoutubeApp = await Linking.canOpenURL(youtubeAppUrl);
          
          if (canOpenYoutubeApp) {
            await Linking.openURL(youtubeAppUrl);
            return;
          }
        }
      }
  
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert(
        'Unable to Open Link',
        'Could not open this link. Please check your internet connection or try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  // Function to get image URI
  const getImageUri = (material) => {
    if (!material || !material.thumbnail_path) return null;
    
    // For Cloudinary URLs, use them directly
    if (material.thumbnail_path.startsWith('http')) {
      return { uri: material.thumbnail_path };
    }
    
    // For local images
    return { uri: material.thumbnail_path };
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshCount(prev => prev + 1);
    fetchMaterials();
  };

  // Render error state
  if (error && refreshCount === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Materials</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleManualRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
      >
        {/* Header with refresh info */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Materials on Waste Management</Text>
        </View>

        {/* All materials displayed together */}
        {materials?.length > 0 ? (
          materials.map((material, index) => {
            const imageSource = getImageUri(material);
            const buttonText = getButtonText(material);
            const isSlogan = !material.link_url && material.thumbnail_path;
            
            return (
              <View key={material.id} style={[
                styles.card,
                index === 0 && styles.firstCard
              ]}>
                <Text style={styles.cardTitle}>{material.title}</Text>
                
                {/* "NEW" badge for the newest item */}
                {index === 0 && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW!!!</Text>
                  </View>
                )}
                
                {/* Image display */}
                {imageSource && (
                  <View style={styles.imageCardContainer}>
                    <Image 
                      source={imageSource}
                      style={styles.cardImage}
                      resizeMode="cover"
                      onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                    />
                  </View>
                )}
                
                {/* Action button */}
                <TouchableOpacity 
                  style={styles.linkButton} 
                  onPress={() => {
                    if (isSlogan) {
                      openSloganImage(material);
                    } else if (material.link_url) {
                      openLink(material.link_url);
                    }
                  }}
                >
                  <Text style={styles.linkButtonText}>
                    {buttonText} →
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          !loading && (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>No Materials Yet</Text>
              <Text style={styles.emptyStateText}>
                Check back later for materials on waste management.
              </Text>
            </View>
          )
        )}
        
        {/* Loading indicator for auto-refresh */}
        {loading && refreshCount > 0 && (
          <View style={styles.autoRefreshIndicator}>
            <ActivityIndicator size="small" color={colors.border_green} />
            <Text style={styles.autoRefreshText}>Refreshing...</Text>
          </View>
        )}
      </ScrollView>

      {/* Image Modal with Navigation and Zoom (for slogans only) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeSloganImage}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={closeSloganImage}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selectedSlogan?.title || 'Image'}
              </Text>
              <Text style={styles.imageCounter}>
                {currentIndex + 1} of {materials.filter(m => !m.link_url && m.thumbnail_path)?.length || 0}
              </Text>
            </View>
            
            <View style={styles.placeholder} />
          </View>
          
          {/* Image Container with Navigation Buttons */}
          <View style={styles.imageContainer}>
            {/* Previous Button */}
            {currentIndex > 0 && (
              <TouchableOpacity 
                style={[styles.navButton, styles.prevButton]} 
                onPress={goToPrevious}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
            )}

            {/* Zoomable Image or Placeholder */}
            {selectedSlogan ? (
              <ZoomableImage 
                key={selectedSlogan.id}
                source={getImageUri(selectedSlogan)}
                onZoomChange={setCurrentZoom}
              />
            ) : (
              <View style={styles.modalPlaceholderContainer}>
                <ImagePlaceholder size={SCREEN_WIDTH * 0.8} />
              </View>
            )}

            {/* Next Button */}
            {currentIndex < ((materials.filter(m => !m.link_url && m.thumbnail_path)?.length || 0) - 1) && (
              <TouchableOpacity 
                style={[styles.navButton, styles.nextButton]} 
                onPress={goToNext}
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Initial loading overlay */}
      {loading && refreshCount === 0 && (
        <View style={styles.fullScreenLoading}>
          <ActivityIndicator size="large" color={colors.border_green} />
          <Text style={styles.fullScreenLoadingText}>Loading materials...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lime_green,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: SCREEN_HEIGHT * 0.12,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.025,
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  title: { 
    fontSize: SCREEN_WIDTH * 0.06, 
    textAlign: 'center', 
    fontFamily: 'PSemi-Bold',
    color: colors.border_green,
    width: SCREEN_WIDTH * 0.8,
    alignSelf: 'center',
    backgroundColor: colors.pale_green,
    borderWidth: 2,
    borderColor: colors.border_green,
    borderRadius: 20,
    paddingVertical: SCREEN_HEIGHT * 0.015,
    marginBottom: SCREEN_HEIGHT * 0.01,
  },
  refreshInfo: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.01,
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  refreshText: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: colors.border_green,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: colors.bg_green,
    marginHorizontal: SCREEN_WIDTH * 0.05,
    marginVertical: SCREEN_HEIGHT * 0.012,
    padding: SCREEN_WIDTH * 0.04,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.border_green,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    position: 'relative',
  },
  firstCard: {
    marginTop: SCREEN_HEIGHT * 0.01,
  },
  newBadge: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.01,
    right: SCREEN_WIDTH * 0.03,
    backgroundColor: '#4CAF50',
    paddingHorizontal: SCREEN_WIDTH * 0.03,
    paddingVertical: SCREEN_HEIGHT * 0.005,
    borderRadius: 15,
    zIndex: 1,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.025,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '600',
    color: colors.border_green,
    textAlign: 'center',
    marginBottom: SCREEN_HEIGHT * 0.015,
    marginTop: SCREEN_HEIGHT * 0.01,
  },
  // Image in Card Styles
  imageCardContainer: {
    alignItems: 'center',
    marginBottom: SCREEN_HEIGHT * 0.015,
  },
  cardImage: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_HEIGHT * 0.2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border_green,
  },
  // Image Placeholder Styles
  imagePlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#666',
    fontSize: SCREEN_WIDTH * 0.03,
    fontWeight: '500',
    textAlign: 'center',
    padding: 5,
  },
  linkButton: {
    marginTop: SCREEN_HEIGHT * 0.012,
    alignSelf: 'center',
    backgroundColor: colors.border_green,
    paddingVertical: SCREEN_HEIGHT * 0.007,
    paddingHorizontal: SCREEN_WIDTH * 0.03,
    borderRadius: 6,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    backgroundColor: colors.pale_green,
    marginHorizontal: SCREEN_WIDTH * 0.05,
    marginVertical: SCREEN_HEIGHT * 0.05,
    padding: SCREEN_WIDTH * 0.08,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.border_green,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: SCREEN_WIDTH * 0.06,
    color: colors.border_green,
    fontWeight: 'bold',
    marginBottom: SCREEN_HEIGHT * 0.02,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: colors.border_green,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: SCREEN_HEIGHT * 0.025,
  },
  refreshButton: {
    backgroundColor: colors.border_green,
    marginHorizontal: SCREEN_WIDTH * 0.2,
    marginVertical: SCREEN_HEIGHT * 0.03,
    paddingVertical: SCREEN_HEIGHT * 0.015,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.dark_green,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: 'bold',
  },
  autoRefreshIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SCREEN_HEIGHT * 0.01,
  },
  autoRefreshText: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: colors.border_green,
    marginLeft: SCREEN_WIDTH * 0.02,
    fontStyle: 'italic',
  },
  fullScreenLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullScreenLoadingText: {
    marginTop: SCREEN_HEIGHT * 0.02,
    fontSize: SCREEN_WIDTH * 0.045,
    color: colors.border_green,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SCREEN_WIDTH * 0.1,
  },
  errorTitle: {
    fontSize: SCREEN_WIDTH * 0.06,
    color: 'red',
    fontWeight: 'bold',
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  errorMessage: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: '#666',
    textAlign: 'center',
    marginBottom: SCREEN_HEIGHT * 0.04,
  },
  retryButton: {
    backgroundColor: colors.border_green,
    paddingVertical: SCREEN_HEIGHT * 0.015,
    paddingHorizontal: SCREEN_WIDTH * 0.1,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: SCREEN_HEIGHT * 0.06,
    paddingBottom: SCREEN_HEIGHT * 0.015,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  closeButton: {
    padding: 8,
    width: 50,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.06,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 50,
  },
  imageContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalPlaceholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  zoomableImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  // Navigation Buttons
  navButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: SCREEN_WIDTH * 0.12,
    height: SCREEN_WIDTH * 0.12,
    borderRadius: SCREEN_WIDTH * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  prevButton: {
    left: SCREEN_WIDTH * 0.05,
  },
  nextButton: {
    right: SCREEN_WIDTH * 0.05,
  },
  navButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.08,
    fontWeight: 'bold',
  },
  imageCounter: {
    color: '#ccc',
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: 'bold',
  },
});