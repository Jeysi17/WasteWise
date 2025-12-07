import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  RefreshControl, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  AppState
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import colors from "../../constant/colors";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [appState, setAppState] = useState(AppState.currentState);
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Alert Modals State
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertModalTitle, setAlertModalTitle] = useState('');
  const [alertModalMessage, setAlertModalMessage] = useState('');
  const [alertModalType, setAlertModalType] = useState('info'); // 'info', 'success', 'error'
  const [alertModalCallback, setAlertModalCallback] = useState(null);

  // 🧠 Function to format date in words
  const formatDateInWords = (dateString) => {
    if (!dateString) return 'No date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return 'Date error';
    }
  };

  // Custom Alert Modal Function
  const showAlertModal = (title, message, type = 'info', callback = null) => {
    setAlertModalTitle(title);
    setAlertModalMessage(message);
    setAlertModalType(type);
    setAlertModalCallback(() => callback);
    setAlertModalVisible(true);
  };

  // Handle Alert Modal Close
  const handleAlertModalClose = () => {
    setAlertModalVisible(false);
    if (alertModalCallback) {
      alertModalCallback();
    }
  };

  // Load read notifications from AsyncStorage
  const loadReadNotifications = useCallback(async () => {
    try {
      const storedReadIds = await AsyncStorage.getItem('read_notifications');
      
      if (storedReadIds) {
        const parsedIds = JSON.parse(storedReadIds);
        setReadNotificationIds(parsedIds);
      } else {
        setReadNotificationIds([]);
      }
      setStorageLoaded(true);
    } catch (error) {
      console.error("❌ Failed to load read notifications:", error);
      setReadNotificationIds([]);
      setStorageLoaded(true);
    }
  }, []);

  // Save read notifications to AsyncStorage
  const saveReadNotifications = useCallback(async (ids) => {
    try {
      await AsyncStorage.setItem('read_notifications', JSON.stringify(ids));
    } catch (error) {
      console.error("❌ Failed to save read notifications:", error);
      showAlertModal("Error", "Failed to save notification status. Please try again.", 'error');
    }
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!readNotificationIds.includes(notificationId)) {
      const newReadIds = [...readNotificationIds, notificationId];
      setReadNotificationIds(newReadIds);
      await saveReadNotifications(newReadIds);
    }
  }, [readNotificationIds, saveReadNotifications]);

  // MARK ALL AS READ FOR CURRENT TAB ONLY
  const markAllAsRead = useCallback(async () => {
    if (!storageLoaded) {
      showAlertModal("Please wait", "Storage is still loading. Please try again in a moment.", 'info');
      return;
    }
    
    if (currentNotifications.length === 0) {
      showAlertModal("Info", `No ${activeTab.toLowerCase()} notifications to mark as read`, 'info');
      return;
    }
    
    const newReadIds = [...readNotificationIds];
    let markedCount = 0;
    
    // Only mark notifications in the current tab
    currentNotifications.forEach(notification => {
      const uniqueId = `${notification.notification_type}-${notification.id}`;
      if (!newReadIds.includes(uniqueId)) {
        newReadIds.push(uniqueId);
        markedCount++;
      }
    });
    
    if (markedCount > 0) {
      setReadNotificationIds(newReadIds);
      await saveReadNotifications(newReadIds);
      showAlertModal("Success", `Marked ${markedCount} ${activeTab.toLowerCase()} notification${markedCount > 1 ? 's' : ''} as read`, 'success');
    } else {
      showAlertModal("Info", `All ${activeTab.toLowerCase()} notifications are already read`, 'info');
    }
  }, [currentNotifications, activeTab, readNotificationIds, saveReadNotifications, storageLoaded]);

  // Check if a notification is read
  const isNotificationRead = useCallback((notification) => {
    if (!notification || !notification.id) return false;
    const uniqueId = `${notification.notification_type}-${notification.id}`;
    return readNotificationIds.includes(uniqueId);
  }, [readNotificationIds]);

  async function loadNotifications() {
    if (!user?.$id || !userLocation) {
      setError("User information missing. Please check your profile.");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const barangayUrl = `${process.env.EXPO_PUBLIC_HOST_URL}/api/notifications/by-barangay?barangay=${encodeURIComponent(userLocation)}`;
      const personalUrl = `${process.env.EXPO_PUBLIC_HOST_URL}/api/notifications/personal?user_id=${encodeURIComponent(user.$id)}`;

      const [barangayResponse, personalResponse] = await Promise.all([
        fetch(barangayUrl).catch(err => {
          console.error("❌ Barangay fetch error:", err);
          throw new Error(`Barangay fetch failed: ${err.message}`);
        }),
        fetch(personalUrl).catch(err => {
          console.error("❌ Personal fetch error:", err);
          throw new Error(`Personal fetch failed: ${err.message}`);
        })
      ]);

      if (!barangayResponse.ok) {
        throw new Error(`Barangay error: ${barangayResponse.status}`);
      }
      if (!personalResponse.ok) {
        throw new Error(`Personal error: ${personalResponse.status}`);
      }

      const [barangayData, personalData] = await Promise.all([
        barangayResponse.json(),
        personalResponse.json()
      ]);

      const barangayWithType = barangayData.map(item => ({ 
        ...item, 
        notification_type: 'barangay',
        id: item.id || Math.random().toString(36).substr(2, 9)
      }));
      
      const personalWithType = personalData.map(item => ({ 
        ...item, 
        notification_type: 'personal',
        id: item.id || Math.random().toString(36).substr(2, 9)
      }));

      const combinedNotifications = [...barangayWithType, ...personalWithType]
        .sort((a, b) => new Date(b.created_at || b.sent_at || Date.now()) - new Date(a.created_at || a.sent_at || Date.now()));

      setNotifications(combinedNotifications);
      
    } catch (err) {
      console.error("❌ Failed to load notifications:", err);
      setError(`Failed to load notifications: ${err.message}`);
      
      // Fallback to sample data for testing
      if (process.env.NODE_ENV === 'development') {
        const sampleData = [
          {
            id: '1',
            notification_type: 'barangay',
            title: 'Waste Collection Schedule',
            message: 'Garbage collection will be on Tuesday this week due to holiday.',
            created_at: new Date().toISOString(),
            barangay: userLocation || 'Sample Barangay'
          },
          {
            id: '2',
            notification_type: 'personal',
            title: 'Complaint Update',
            message: 'Your complaint #1234 has been forwarded to the barangay office.',
            created_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '3',
            notification_type: 'barangay',
            title: 'Community Cleanup',
            message: 'Join us for a community cleanup this Saturday at 8 AM.',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            barangay: userLocation || 'Sample Barangay'
          }
        ];
        setNotifications(sampleData);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = (notification) => {
    if (!notification) return;
    
    if (!storageLoaded) {
      showAlertModal("Please wait", "Storage is still loading. Please try again in a moment.", 'info');
      return;
    }
    
    const uniqueId = `${notification.notification_type}-${notification.id}`;
    markAsRead(uniqueId);
    
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        loadReadNotifications();
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [appState, loadReadNotifications]);

  useEffect(() => {
    loadReadNotifications();
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 3000);

    return () => clearInterval(interval);
  }, [user?.$id, userLocation, loadReadNotifications]);

  // Filter notifications by type
  const wasteCollectionNotifications = notifications.filter(notification => {
    if (!notification) return false;
    const title = notification.title?.toLowerCase() || '';
    const message = notification.message?.toLowerCase() || '';
    const type = notification.data?.type?.toLowerCase() || '';
    
    return title.includes('waste') || 
           title.includes('collection') || 
           title.includes('schedule') ||
           message.includes('waste') || 
           message.includes('collection') || 
           message.includes('schedule') ||
           type.includes('schedule');
  });

  const complaintsNotifications = notifications.filter(notification => {
    if (!notification) return false;
    const title = notification.title?.toLowerCase() || '';
    const message = notification.message?.toLowerCase() || '';
    const type = notification.data?.type?.toLowerCase() || '';
    
    return title.includes('complaint') || 
           title.includes('post') ||
           message.includes('complaint') || 
           message.includes('forwarded') || 
           message.includes('solved') ||
           message.includes('resolved') ||
           type.includes('complaint') ||
           type.includes('post');
  });

  // Get current tab notifications
  const currentNotifications = activeTab === 'Waste Collection' 
    ? wasteCollectionNotifications 
    : complaintsNotifications;

  // Count unread notifications
  const unreadWasteCount = wasteCollectionNotifications.filter(
    notification => !isNotificationRead(notification)
  ).length;

  const unreadComplaintsCount = complaintsNotifications.filter(
    notification => !isNotificationRead(notification)
  ).length;

  // Total unread count from BOTH tabs
  const totalUnreadCount = notifications.filter(
    notification => !isNotificationRead(notification)
  ).length;

  // Unread count in current tab only
  const unreadCurrentTabCount = currentNotifications.filter(
    notification => !isNotificationRead(notification)
  ).length;

  // Show loading indicator until storage is loaded
  if (loading || !storageLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.border_green} />
        <Text style={styles.loadingText}>
          {storageLoaded ? 'Loading your notifications...' : 'Loading notification history...'}
        </Text>
      </View>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity onPress={loadNotifications} style={styles.retryButton}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.pale_green }}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.border_green]}
            tintColor={colors.border_green}
          />
        }
        showsVerticalScrollIndicator={false}
      >
             
        <Text style={styles.title}>Notification History</Text>
        {/* Tabs */}
        <View style={styles.navbar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Waste Collection' && styles.activeTab]}
            onPress={() => setActiveTab('Waste Collection')}
            activeOpacity={0.7}
            disabled={!storageLoaded}
          >
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, !storageLoaded && styles.disabledText]}>
                Waste Collection
              </Text>
              {storageLoaded && unreadWasteCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadWasteCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Complaints' && styles.activeTab]}
            onPress={() => setActiveTab('Complaints')}
            activeOpacity={0.7}
            disabled={!storageLoaded}
          >
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, !storageLoaded && styles.disabledText]}>
                Complaints
              </Text>
              {storageLoaded && unreadComplaintsCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadComplaintsCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Tab-specific Unread Counter - Only shows when current tab has unread notifications */}
        {unreadCurrentTabCount > 0 && (
          <View style={styles.tabUnreadCounterContainer}>
            <View style={styles.tabUnreadIndicator}>
              <View style={styles.tabUnreadPulse} />
              <Text style={styles.tabUnreadCounterText}>
                {unreadCurrentTabCount} unread in {activeTab}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={markAllAsRead} 
              style={styles.tabMarkAllReadButton}
              activeOpacity={0.7}
              disabled={!storageLoaded}
            >
              <Text style={[styles.tabMarkAllReadText, !storageLoaded && styles.disabledButton]}>
                Mark all read
              </Text>
            </TouchableOpacity>
          </View>
        )}
              
        {/* Notification List */}
        <View style={styles.tabContentContainer}>
          {!storageLoaded ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="small" color={colors.border_green} />
              <Text style={styles.emptyText}>Loading notification status...</Text>
            </View>
          ) : currentNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} notifications</Text>
              <Text style={styles.emptySubtext}>You're all caught up!</Text>
            </View>
          ) : (
            currentNotifications.map((item, index) => {
              const isRead = isNotificationRead(item);
              return (
                <TouchableOpacity
                  key={`${item.notification_type}-${item.id}-${index}`}
                  style={[
                    styles.listItemContainer,
                    !isRead && styles.unreadItem
                  ]}
                  onPress={() => handleNotificationPress(item)}
                  activeOpacity={0.7}
                  disabled={!storageLoaded}
                >
                  {/* Unread indicator */}
                  {storageLoaded && !isRead && <View style={styles.unreadDot} />}
                  
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={[
                        styles.listItemTitle,
                        storageLoaded && !isRead && styles.unreadText
                      ]} numberOfLines={2}>
                        {item.title || 'Notification'}
                      </Text>
                      {storageLoaded && (
                        <View style={[
                          styles.typeBadge,
                          item.notification_type === 'personal' ? styles.personalBadge : styles.barangayBadge
                        ]}>
                          <Text style={styles.typeText}>
                            {item.notification_type === 'personal' ? 'Personal' : 'Barangay'}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={[
                      styles.listItemDetails,
                      storageLoaded && !isRead && styles.unreadText
                    ]} numberOfLines={3}>
                      {item.message}
                    </Text>
                    
                    <View style={styles.notificationFooter}>
                      <Text style={styles.listItemTime}>
                        {formatDateInWords(item.created_at || item.sent_at)}
                      </Text>
                      {item.barangay && item.notification_type === 'barangay' && (
                        <Text style={styles.listItemLocation}>
                          {item.barangay}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal for Notification Details */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedNotification && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {selectedNotification.title || 'Notification'}
                  </Text>
                </View>
                
                <View style={[
                  styles.typeBadge,
                  selectedNotification.notification_type === 'personal' ? styles.personalBadge : styles.barangayBadge,
                  styles.modalBadge
                ]}>
                  <Text style={styles.typeText}>
                    {selectedNotification.notification_type === 'personal' ? 'Personal Notification' : 'Barangay Notification'}
                  </Text>
                </View>
                
                <ScrollView 
                  style={styles.modalMessageContainer} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  <Text style={styles.modalMessage}>
                    {selectedNotification.message}
                  </Text>
                </ScrollView>
                
                <View style={styles.modalDetails}>
                  <Text style={styles.modalText}>
                    <Text style={styles.modalLabel}>Date: </Text>
                    {formatDateInWords(selectedNotification.created_at || selectedNotification.sent_at)}
                  </Text>
                  
                  {selectedNotification.barangay && selectedNotification.notification_type === 'barangay' && (
                    <Text style={styles.modalText}>
                      <Text style={styles.modalLabel}>Barangay: </Text>
                      {selectedNotification.barangay}
                    </Text>
                  )}
                  
                  <Text style={styles.modalText}>
                    <Text style={styles.modalLabel}>Status: </Text>
                    {isNotificationRead(selectedNotification) ? 'Read' : 'Unread'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal
        visible={alertModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleAlertModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertModalContainer}>
            <View style={styles.alertModalHeader}>
              <Text style={[
                styles.alertModalTitle,
                alertModalType === 'success' && styles.alertModalTitleSuccess,
                alertModalType === 'error' && styles.alertModalTitleError
              ]}>
                {alertModalTitle}
              </Text>
            </View>
            
            <ScrollView 
              style={styles.alertModalMessageContainer} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.alertModalScrollContent}
            >
              <Text style={styles.alertModalMessage}>
                {alertModalMessage}
              </Text>
            </ScrollView>
            
            <View style={styles.alertModalButtons}>
              <TouchableOpacity
                style={[
                  styles.alertModalButton,
                  alertModalType === 'success' && styles.alertModalButtonSuccess,
                  alertModalType === 'error' && styles.alertModalButtonError,
                  alertModalType === 'info' && styles.alertModalButtonInfo
                ]}
                onPress={handleAlertModalClose}
                activeOpacity={0.7}
              >
                <Text style={styles.alertModalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  title: { 
    fontSize: SCREEN_WIDTH * 0.07, 
    textAlign: 'center', 
    marginTop: SCREEN_HEIGHT * 0.03,  
    fontFamily: 'PSemi-Bold',
    color: colors.border_green,
    width: SCREEN_WIDTH * 0.9,
    alignSelf: 'center',
    backgroundColor: colors.pale_green,
    borderWidth: 2,
    borderColor: colors.border_green,
    borderRadius: 15,
    marginBottom: SCREEN_HEIGHT * 0.02,
    paddingVertical: 12,
  }, 
  unreadCounterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: SCREEN_WIDTH * 0.05,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#B3E0FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginRight: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  unreadCounterText: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: '#007AFF',
    fontFamily: 'PSemi-Bold',
    fontWeight: '600',
  },
  markAllReadButton: {
    backgroundColor: colors.border_green,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  markAllReadText: {
    color: 'white',
    fontSize: SCREEN_WIDTH * 0.032,
    fontFamily: 'PSemi-Bold',
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  navbar: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 0.9,
    alignSelf: 'center',
    marginTop: SCREEN_HEIGHT * 0.01,
    backgroundColor: colors.bg_green,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border_green,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SCREEN_HEIGHT * 0.016,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#72fd72',
  },
  tabText: {
    color: '#333',
    fontWeight: '600',
    fontSize: SCREEN_WIDTH * 0.038,
    fontFamily: 'PSemi-Bold',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'PSemi-Bold',
  },
  // Tab-specific Unread Counter
  tabUnreadCounterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: SCREEN_WIDTH * 0.05,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  tabUnreadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabUnreadPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF9800',
    marginRight: 8,
  },
  tabUnreadCounterText: {
    fontSize: SCREEN_WIDTH * 0.034,
    color: '#E65100',
    fontFamily: 'PSemi-Bold',
    fontWeight: '600',
  },
  tabMarkAllReadButton: {
    backgroundColor: colors.border_green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: 100,
    alignItems: 'center',
  },
  tabMarkAllReadText: {
    color: 'white',
    fontSize: SCREEN_WIDTH * 0.03,
    fontFamily: 'PSemi-Bold',
    fontWeight: '600',
    textAlign: 'center',
  },
  tabContentContainer: {
    marginHorizontal: SCREEN_WIDTH * 0.05,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    padding: 1,
    minHeight: 200,
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: '#666',
    fontFamily: 'PSemi-Bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: '#999',
    fontFamily: 'PSemi-Bold',
  },
  listItemContainer: {
    flexDirection: 'row',
    paddingVertical: SCREEN_HEIGHT * 0.02,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  unreadItem: {
    backgroundColor: '#F8FBFF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  unreadDot: {
    position: 'absolute',
    left: 10,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 8,
  },
  unreadText: {
    fontWeight: '600',
    color: '#000',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  listItemTitle: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: 'PSemi-Bold',
    flex: 1,
    marginRight: 10,
    color: '#333',
    lineHeight: 22,
  },
  listItemDetails: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: '#555',
    fontFamily: 'PSemi-Bold',
    marginBottom: 8,
    lineHeight: 20,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  personalBadge: {
    backgroundColor: '#FF6B6B',
  },
  barangayBadge: {
    backgroundColor: '#4ECDC4',
  },
  typeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'PSemi-Bold',
  },
  
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: SCREEN_WIDTH * 0.8,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontFamily: 'PSemi-Bold',
    fontSize: SCREEN_WIDTH * 0.045,
    textAlign: 'center',
    color: '#333',
    lineHeight: 24,
  },
  modalBadge: {
    alignSelf: 'center',
    marginBottom: 15,
  },
  modalMessageContainer: {
    maxHeight: 200,
    marginBottom: 15,
  },
  modalScrollContent: {
    paddingVertical: 5,
  },
  modalMessage: {
    fontSize: SCREEN_WIDTH * 0.038,
    lineHeight: 22,
    color: '#444',
    fontFamily: 'PSemi-Bold',
    textAlign: 'center',
  },
  modalDetails: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 20,
  },
  modalLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  modalText: {
    fontSize: SCREEN_WIDTH * 0.035,
    marginBottom: 8,
    color: '#666',
    fontFamily: 'PSemi-Bold',
    textAlign: 'center',
  },
  modalCloseButton: {
    backgroundColor: colors.border_green,
    padding: SCREEN_HEIGHT * 0.011,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: SCREEN_WIDTH * 0.038,
    fontFamily: 'PSemi-Bold',
    color: 'white',
  },
  
  // ALERT MODAL STYLES
  alertModalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: SCREEN_WIDTH * 0.8,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  alertModalHeader: {
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  alertModalTitle: {
    fontFamily: 'PSemi-Bold',
    fontSize: SCREEN_WIDTH * 0.045,
    textAlign: 'center',
    color: colors.border_green,
    lineHeight: 24,
  },
  alertModalTitleSuccess: {
    color: '#4CAF50', // Green for success
  },
  alertModalTitleError: {
    color: '#FF3B30', // Red for error
  },
  alertModalMessageContainer: {
    maxHeight: 150,
    marginBottom: 20,
  },
  alertModalScrollContent: {
    paddingVertical: 5,
  },
  alertModalMessage: {
    fontSize: SCREEN_WIDTH * 0.038,
    lineHeight: 22,
    color: '#444',
    fontFamily: 'PSemi-Bold',
    textAlign: 'center',
  },
  alertModalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  alertModalButton: {
    backgroundColor: colors.border_green,
    paddingHorizontal: 30,
    paddingVertical: SCREEN_HEIGHT * 0.012,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  alertModalButtonSuccess: {
    backgroundColor: '#4CAF50', // Green for success
  },
  alertModalButtonError: {
    backgroundColor: '#FF3B30', // Red for error
  },
  alertModalButtonInfo: {
    backgroundColor: colors.border_green, // Default green for info
  },
  alertModalButtonText: {
    fontSize: SCREEN_WIDTH * 0.038,
    fontFamily: 'PSemi-Bold',
    color: 'white',
  },
  
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.pale_green,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontFamily: 'PSemi-Bold',
  },
  error: {
    color: "#FF3B30",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 15,
    fontFamily: 'PSemi-Bold',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.border_green,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'PSemi-Bold',
  },
});