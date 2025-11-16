import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  RefreshControl, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Dimensions,
  Modal
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import colors from "../../constant/colors";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function NotificationsScreen() {
  const { userLocation, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Waste Collection');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 🧠 Function to format date in words
  const formatDateInWords = (dateString) => {
    if (!dateString) return;
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  async function loadNotifications() {
    if (!user?.$id || !userLocation) {
      setError("User information missing. Please check your profile.");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      console.log("🆔 User ID:", user.$id);
      console.log("📍 User Location:", userLocation);
      
      // Use the endpoints that exist in your routes
      const barangayUrl = `${process.env.EXPO_PUBLIC_HOST_URL}/api/notifications/by-barangay?barangay=${encodeURIComponent(userLocation)}`;
      const personalUrl = `${process.env.EXPO_PUBLIC_HOST_URL}/api/notifications/personal?user_id=${encodeURIComponent(user.$id)}`;
      
      console.log("🔗 Barangay URL:", barangayUrl);
      console.log("🔗 Personal URL:", personalUrl);

      // Fetch from both endpoints simultaneously
      const [barangayResponse, personalResponse] = await Promise.all([
        fetch(barangayUrl),
        fetch(personalUrl)
      ]);

      console.log("📡 Barangay response status:", barangayResponse.status);
      console.log("📡 Personal response status:", personalResponse.status);

      // Check both responses
      if (!barangayResponse.ok) {
        throw new Error(`Barangay endpoint error: ${barangayResponse.status}`);
      }
      if (!personalResponse.ok) {
        throw new Error(`Personal endpoint error: ${personalResponse.status}`);
      }

      // Parse both responses
      const [barangayData, personalData] = await Promise.all([
        barangayResponse.json(),
        personalResponse.json()
      ]);

      console.log("✅ Barangay notifications:", barangayData.length);
      console.log("✅ Personal notifications:", personalData.length);

      // Add notification_type to distinguish them
      const barangayWithType = barangayData.map(item => ({ ...item, notification_type: 'barangay' }));
      const personalWithType = personalData.map(item => ({ ...item, notification_type: 'personal' }));

      // Combine and sort by date (newest first)
      const combinedNotifications = [...barangayWithType, ...personalWithType]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setNotifications(combinedNotifications);
      
    } catch (err) {
      console.log("❌ Failed to load notifications:", err);
      setError(`Failed to load notifications: ${err.message}`);
      Alert.alert("Error", "Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  useEffect(() => {
    // Load notifications immediately when component mounts
    loadNotifications();

    // Set up interval to fetch every 3 seconds
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing notifications...");
      loadNotifications();
    }, 3000); // 3000ms = 3 seconds

    // Clean up interval when component unmounts
    return () => clearInterval(interval);
  }, [user?.$id, userLocation]); // Re-run effect when user ID or location changes

  // Filter notifications by type
  const wasteCollectionNotifications = notifications.filter(notification => 
    notification.data?.type?.includes('schedule') || 
    notification.title?.toLowerCase().includes('waste') ||
    notification.title?.toLowerCase().includes('collection') ||
    notification.message?.toLowerCase().includes('waste') ||
    notification.message?.toLowerCase().includes('collection') ||
    notification.message?.toLowerCase().includes('schedule')
  );

  const complaintsNotifications = notifications.filter(notification => 
    notification.data?.type?.includes('post') || 
    notification.data?.type?.includes('complaint') ||
    notification.title?.toLowerCase().includes('complaint') ||
    notification.title?.toLowerCase().includes('post') ||
    notification.message?.toLowerCase().includes('complaint') ||
    notification.message?.toLowerCase().includes('forwarded') ||
    notification.message?.toLowerCase().includes('solved') ||
    notification.message?.toLowerCase().includes('resolved')
  );

  // Get current tab notifications
  const currentNotifications = activeTab === 'Waste Collection' 
    ? wasteCollectionNotifications 
    : complaintsNotifications;

  const handleNotificationPress = (notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading your notifications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.retry} onPress={loadNotifications}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg_green }}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.border_green]}
            tintColor={colors.border_green}
          />
        }
      >
        <ImageBackground
          source={require('../../assets/images/bg-image.jpg')}
          style={{
            height: SCREEN_HEIGHT * 0.23,
            width: '100%',
            borderBottomWidth: 7,
            borderBottomColor: colors.border_green,
          }}
        />
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            height: SCREEN_HEIGHT * 0.23,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderBottomWidth: 6,
            borderColor: colors.border_green,
          }}
        />
        
        {/* Centered and Styled Header */}
       
          <Text style={styles.headerTitle}>Your Notifications</Text>


        {/* Waste Collection / Complaints Tabs */}
        <View style={styles.navbar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Waste Collection' && styles.activeTab]}
            onPress={() => setActiveTab('Waste Collection')}
          >
            <Text style={styles.tabText}>Waste Collection</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Complaints' && styles.activeTab]}
            onPress={() => setActiveTab('Complaints')}
          >
            <Text style={styles.tabText}>Complaints</Text>
          </TouchableOpacity>
        </View>
              
        {/* Notification List */}
        <View style={styles.tabContent}>
          {currentNotifications.length === 0 ? (
            <Text style={{ textAlign: 'center', marginVertical: 20, fontFamily: 'PSemi-Bold' }}>
              No {activeTab.toLowerCase()} notifications found.
            </Text>
          ) : (
            currentNotifications.map((item, index) => (
              <TouchableOpacity
                key={`${item.notification_type}-${item.id}-${index}`}
                style={[
                  styles.listItemContainer,
                  !item.is_read && styles.unreadItem
                ]}
                onPress={() => handleNotificationPress(item)}
              >
                <View style={styles.notificationHeader}>
                  <Text style={styles.listItemTitle}>
                    {item.title || 'Notification'}
                  </Text>
                  <View style={[
                    styles.typeBadge,
                    item.notification_type === 'personal' ? styles.personalBadge : styles.barangayBadge
                  ]}>
                    <Text style={styles.typeText}>
                      {item.notification_type === 'personal' ? 'Personal' : 'Barangay'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.listItemDetails}>
                  {item.message}
                </Text>
                <View style={styles.notificationFooter}>
                  <Text style={styles.listItemTime}>
                    {formatDateInWords(item.created_at)}
                  </Text>
                  {item.barangay && item.notification_type === 'barangay' && (
                    <Text style={styles.listItemLocation}>
                      {item.barangay}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal for Notification Details */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedNotification && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedNotification.title || 'Notification'}</Text>
                  <View style={[
                    styles.typeBadge,
                    selectedNotification.notification_type === 'personal' ? styles.personalBadge : styles.barangayBadge
                  ]}>
                    <Text style={styles.typeText}>
                      {selectedNotification.notification_type === 'personal' ? 'Personal' : 'Barangay'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                
                <View style={styles.modalDetails}>
                  <Text style={styles.modalText}>
                    Date: {formatDateInWords(selectedNotification.sent_at)}
                  </Text>
                  {selectedNotification.barangay && selectedNotification.notification_type === 'barangay' && (
                    <Text style={styles.modalText}>
                      Barangay: {selectedNotification.barangay}
                    </Text>
                  )}

                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // Centered Header Styles
  headerContainer: {
    width: SCREEN_WIDTH * 0.92,
    minHeight: SCREEN_HEIGHT * 0.08,
    alignSelf: 'center',
    marginTop: SCREEN_HEIGHT * 0.15,
    backgroundColor: colors.pale_green,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 50,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.border_green,
    paddingVertical: SCREEN_HEIGHT * 0.015,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SCREEN_WIDTH * 0.09,
    fontFamily: 'PSemi-Bold',
    color: '#000',
    textAlign: 'center',
    marginTop: SCREEN_HEIGHT * 0.02,
  },
  
  // Rest of your existing styles
  navbar: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 0.9,
    alignSelf: 'center',
    marginTop: SCREEN_HEIGHT * 0.03,
    backgroundColor: colors.pale_green,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border_green,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SCREEN_HEIGHT * 0.012,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.border_green,
  },
  tabText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: SCREEN_WIDTH * 0.04,
  },
  tabContent: {
    marginHorizontal: SCREEN_WIDTH * 0.05,
    backgroundColor: colors.pale_green,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.border_green,
  },
  listItemContainer: {
    paddingVertical: SCREEN_HEIGHT * 0.012,
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
    paddingHorizontal: SCREEN_WIDTH * 0.025,
  },
  unreadItem: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  listItemTitle: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: 'PSemi-Bold',
    flex: 1,
    marginRight: 8,
  },
  listItemDetails: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: '#555',
    fontFamily: 'PSemi-Bold',
    marginBottom: 5,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemTime: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: '#777',
    fontFamily: 'PSemi-Bold',
  },
  listItemLocation: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: '#777',
    fontStyle: 'italic',
    fontFamily: 'PSemi-Bold',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  personalBadge: {
    backgroundColor: '#FF6B6B',
  },
  barangayBadge: {
    backgroundColor: '#4ECDC4',
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: SCREEN_WIDTH * 0.05,
    alignItems: 'center',
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: 'bold',
    fontFamily: 'PSemi-Bold',
    flex: 1,
    marginRight: 8,
  },
  modalMessage: {
    fontSize: SCREEN_WIDTH * 0.038,
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'PSemi-Bold',
    lineHeight: 20,
  },
  modalDetails: {
    width: '100%',
    marginBottom: 15,
  },
  modalText: {
    fontSize: SCREEN_WIDTH * 0.035,
    marginBottom: 5,
    fontFamily: 'PSemi-Bold'
  },
  modalStatus: {
    fontSize: SCREEN_WIDTH * 0.035,
    marginBottom: 5,
    fontFamily: 'PSemi-Bold',
    color: '#666',
  },
  unreadStatus: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: colors.border_green,
    paddingVertical: SCREEN_HEIGHT * 0.012,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    borderRadius: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noNotifications: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  error: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginTop: 8,
    marginBottom: 16,
  },
  retry: {
    color: "#007AFF",
    marginTop: 10,
  },
});