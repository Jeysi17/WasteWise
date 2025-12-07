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
  ActivityIndicator
} from 'react-native';
import colors from '../../constant/colors';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Use environment variable
const API_URL = `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/materials`;

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

export default function InfoScreen({ navigation }) {
  const [materials, setMaterials] = useState({
    slogans: [],
    otherMaterials: []
  });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlogan, setSelectedSlogan] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(1);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      console.log('Fetching from:', API_URL);
      const response = await fetch(API_URL);
      const data = await response.json();
      
      // Note: Our backend returns the array directly, not {success: true, data: [...]}
      // So we can use the data directly
      
      // Separate slogans (materials without link_url but with thumbnail)
      const slogans = data.filter(material => 
        (!material.link_url || material.link_url === '') && 
        material.thumbnail_path
      );
      
      // Other materials (articles, videos, etc.)
      const otherMaterials = data.filter(material => 
        material.link_url || (!material.link_url && !material.thumbnail_path)
      );
      
      setMaterials({
        slogans,
        otherMaterials
      });
    } catch (error) {
      console.error('Error fetching materials:', error);
      Alert.alert('Error', 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const openSloganImage = (slogan) => {
    const index = materials.slogans.findIndex(s => s.id === slogan.id);
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
    if (currentIndex < materials.slogans.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedSlogan(materials.slogans[newIndex]);
      setCurrentZoom(1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedSlogan(materials.slogans[newIndex]);
      setCurrentZoom(1);
    }
  };

  const openLink = async (url) => {
    try {
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

  // Function to get image URI - handles both local and remote images
  const getImageUri = (material) => {
    if (!material.thumbnail_path) return null;
    
    // If it's a local image path (from assets)
    if (material.thumbnail_path.includes('assets/images/')) {
      // Extract filename from path and require it
      const filename = material.thumbnail_path.split('/').pop();
      try {
        // You might need to map filenames to actual requires
        const imageMap = {
          '9-na-dahilan-para-iwasan-ang-paggamit-ng-plastik.jpg': require('../../assets/images/9-na-dahilan-para-iwasan-ang-paggamit-ng-plastik.jpg'),
          'bawasan-natin-ang-basurang-plastik.jpg': require('../../assets/images/bawasan-natin-ang-basurang-plastik.jpg'),
          'slogan-3.jpg': require('../../assets/images/slogan-3.jpg'),
        };
        return imageMap[filename];
      } catch (error) {
        return null;
      }
    }
    
    // For remote images, use the full URL
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    return { uri: `${baseUrl}/uploads/${material.thumbnail_path}` };
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.border_green} />
          <Text style={styles.loadingText}>Loading materials...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>Materials on Waste Management</Text>

        {/* Slogans from API */}
        {materials.slogans?.map((slogan, index) => {
          const imageSource = getImageUri(slogan);
          
          return (
            <View key={slogan.id} style={[
              styles.card,
              index === 0 && styles.firstSloganCard
            ]}>
              <Text style={styles.cardTitle}>{slogan.title}</Text>
              
              <View style={styles.imageCardContainer}>
                {imageSource ? (
                  <Image 
                    source={imageSource}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <ImagePlaceholder />
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.linkButton} 
                onPress={() => openSloganImage(slogan)}
              >
                <Text style={styles.linkButtonText}>
                  {slogan.button_text || 'View Slogan'} →
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Other materials from API */}
        {materials.otherMaterials?.map((item) => {
          const imageSource = getImageUri(item);
          
          return (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              
              {imageSource && (
                <View style={styles.imageCardContainer}>
                  <Image 
                    source={imageSource}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              
              {item.link_url && (
                <TouchableOpacity 
                  style={styles.linkButton} 
                  onPress={() => openLink(item.link_url)}
                >
                  <Text style={styles.linkButtonText}>
                    {item.button_text || 'Open'} →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Image Modal with Navigation and Zoom */}
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
                {selectedSlogan?.title}
              </Text>
              <Text style={styles.imageCounter}>
                {currentIndex + 1} of {materials.slogans?.length || 0}
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
            {currentIndex < (materials.slogans?.length || 0) - 1 && (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lime_green,
    paddingBottom: SCREEN_HEIGHT * 0.01,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: SCREEN_HEIGHT * 0.12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SCREEN_HEIGHT * 0.02,
    fontSize: SCREEN_WIDTH * 0.04,
    color: colors.border_green,
  },
  title: { 
    fontSize: SCREEN_WIDTH * 0.06, 
    textAlign: 'center', 
    marginTop: SCREEN_HEIGHT * 0.025,  
    fontFamily: 'PSemi-Bold',
    color: colors.border_green,
    width: SCREEN_WIDTH * 0.8,
    alignSelf: 'center',
    backgroundColor: colors.pale_green,
    borderWidth: 2,
    borderColor: colors.border_green,
    borderRadius: 20,
    marginBottom: SCREEN_HEIGHT * 0.02,
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
  },
  firstSloganCard: {
    marginTop: SCREEN_HEIGHT * 0.01,
  },
  cardTitle: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '600',
    color: colors.border_green,
    textAlign: 'center',
    marginBottom: SCREEN_HEIGHT * 0.015,
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