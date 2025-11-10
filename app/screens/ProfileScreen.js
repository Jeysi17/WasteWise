import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Dimensions,
  Image,
  Modal
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import colors from '../../constant/colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ProfileScreen = () => {
  const [containerHeight] = useState(SCREEN_HEIGHT);
  const [activeTab, setActiveTab] = useState('Active');
  const [activePosts, setActivePosts] = useState([]);
  const [closedPosts, setClosedPosts] = useState([]);
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Fetch location once
    fetchLocation();
  
    // Fetch posts immediately
    fetchPosts();
  
    // Set interval to fetch posts every 3 seconds
    const interval = setInterval(() => {
      fetchPosts();
    }, 3000);
  
    // Clear interval on unmount
    return () => clearInterval(interval);
  }, []);
  
  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_HOST_URL;
      const fullUrl = `${apiUrl}/api/users/location?userEmail=${encodeURIComponent(user.email)}`;
      const response = await fetch(fullUrl);

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);

      const data = await response.json();
      if (data.error) setError(data.error);
      else setLocation(data.location);
    } catch (err) {
      setError(`Failed to fetch location: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    const apiUrl = process.env.EXPO_PUBLIC_HOST_URL;
    try {
      // Fetch from all three endpoints
      const [pendingRes, approvedRes, solvedRes] = await Promise.all([
        fetch(`${apiUrl}/api/posts/${encodeURIComponent(user.name)}/pending`),
        fetch(`${apiUrl}/api/posts/${encodeURIComponent(user.name)}/approved`),
        fetch(`${apiUrl}/api/posts/${encodeURIComponent(user.name)}/solved`)
      ]);

      if (!pendingRes.ok || !approvedRes.ok || !solvedRes.ok) {
        throw new Error('Failed to fetch posts');
      }

      const [pendingData, approvedData, solvedData] = await Promise.all([
        pendingRes.json(),
        approvedRes.json(),
        solvedRes.json()
      ]);

      // Combine pending and approved for Active tab
      const activePosts = [...pendingData, ...approvedData].sort(
        (a, b) => new Date(b.post_date) - new Date(a.post_date)
      );

      setActivePosts(activePosts);
      setClosedPosts(solvedData);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const handlePostPress = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg_green }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <ImageBackground
          source={require('../../assets/images/bg-image.jpg')}
          style={{
            height: containerHeight * 0.23,
            width: '100%',
            borderBottomWidth: 7,
            borderBottomColor: colors.border_green,
          }}
        />
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            height: containerHeight * 0.23,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderBottomWidth: 6,
            borderColor: colors.border_green,
          }}
        />
        <View style={{ top: SCREEN_HEIGHT * 0.19 }}>
          <View style={styles.profileImageContainer}>
            <Image
              source={require('../../assets/images/logo-modified.png')}
              style={styles.profileImage}
            />
          </View>
          <View style={styles.profileDetails}>
            {/* ✅ Added text container with flex */}
            <View style={styles.textContainer}>
              <Text 
                style={styles.Name}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user.name} |{' '}
                {location ? (
                  location
                ) : loading ? (
                  <ActivityIndicator size="small" color="#0000ff" />
                ) : (
                  'No location'
                )}
              </Text>
              <Text 
                style={styles.Details}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {user.email}
              </Text>
              {error && (
                <Text 
                  style={styles.errorText}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {error}
                </Text>
              )}
            </View>
          </View>
        </View>
        {/* Active / Closed Tabs */}
        <View style={styles.navbar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Active' && styles.activeTab]}
            onPress={() => setActiveTab('Active')}
          >
            <Text style={styles.tabText}>Active</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Closed' && styles.activeTab]}
            onPress={() => setActiveTab('Closed')}
          >
            <Text style={styles.tabText}>Closed</Text>
          </TouchableOpacity>
        </View>
              
        {/* Post List */}
        <View style={styles.tabContent}>
          {(activeTab === 'Active' ? activePosts : closedPosts).length === 0 ? (
            <Text style={{ textAlign: 'center', marginVertical: 20 }}>
              No {activeTab.toLowerCase()} posts found.
            </Text>
          ) : (
            (activeTab === 'Active' ? activePosts : closedPosts).map((item, index) => (
              <TouchableOpacity
                key={item.id || index}
                style={styles.listItemContainer}
                onPress={() => handlePostPress(item)}
              >
                {/* Changed from item.title to item.details */}
                <Text style={styles.listItemTitle}>• {item.title || 'No details'}</Text>
                <Text style={styles.listItemDetails}>
                  {/* Changed from item.category to item.location */}
                  {item.location} |{' '}
                  {item.post_date ? new Date(item.post_date).toLocaleDateString() : ''}
                </Text>
                {/* Added status display */}
                <Text style={styles.listItemStatus}>{item.status}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal for Post Details */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedPost && (
              <>
                {selectedPost.image ? (
                  <Image source={{ uri: selectedPost.image }} style={styles.modalImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text>No Image</Text>
                  </View>
                )}
                {/* Changed from title to details */}
                <Text style={styles.modalTitle}>{selectedPost.details || 'No details'}</Text>
                <Text style={styles.modalText}>Location: {selectedPost.location}</Text>
                <Text style={styles.modalText}>Status: {selectedPost.status}</Text>
                {/* 🕒 Date Display Logic Based on Status */}
                {selectedPost.status === 'Pending' && (
                  <>
                    <Text style={styles.modalText}>
                      Posted on: {selectedPost.post_date ? new Date(selectedPost.post_date).toLocaleDateString() : 'N/A'}
                    </Text>
                  </>
                )}

                {selectedPost.status === `Forwarded to Cenro by ${selectedPost.location}` && (
                  <>
                    <Text style={styles.modalText}>
                      Posted on: {selectedPost.post_date ? new Date(selectedPost.post_date).toLocaleDateString() : 'N/A'}
                    </Text>
                    <Text style={styles.modalText}>
                      Forwarded on: {selectedPost.approved_at ? new Date(selectedPost.approved_at).toLocaleDateString() : 'N/A'}
                    </Text>
                  </>
                )}

                {(selectedPost.status === `Solved by ${selectedPost.location}` || selectedPost.status === 'Solved by CENRO') && (
                  <>
                    <Text style={styles.modalText}>
                      Posted on: {selectedPost.post_date ? new Date(selectedPost.post_date).toLocaleDateString() : 'N/A'}
                    </Text>
                    <Text style={styles.modalText}>
                      Solved on: {selectedPost.solved_at ? new Date(selectedPost.solved_at).toLocaleDateString() : 'N/A'}
                    </Text>
                  </>
                )}
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
};

export default ProfileScreen;

const styles = StyleSheet.create({
  profileImageContainer: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.1,
    left: 0,
    zIndex: 10,
    backgroundColor: 'white',
    borderRadius: SCREEN_WIDTH * 0.15,
  },
  profileImage: {
    height: SCREEN_WIDTH * 0.25,
    width: SCREEN_WIDTH * 0.25,
    borderRadius: SCREEN_WIDTH * 0.125,
    borderWidth: 5,
    borderColor: colors.border_green,
  },
  profileDetails: {
    width: SCREEN_WIDTH * 0.92,
    minHeight: SCREEN_HEIGHT * 0.065, // ✅ Changed from height to minHeight
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.1,
    left: SCREEN_WIDTH * 0.04,
    zIndex: 9,
    backgroundColor: colors.pale_green,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 50,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.border_green,
    paddingVertical: SCREEN_HEIGHT * 0.005, // ✅ Added padding
  },
  // ✅ NEW: Text container with flex
  textContainer: {
    flex: 1,
    paddingLeft: SCREEN_WIDTH * 0.22,
    paddingRight: SCREEN_WIDTH * 0.02,
    justifyContent: 'center',
  },
  Name: {
    fontSize: SCREEN_WIDTH * 0.04,
    padding: 2,
    borderBottomWidth: 2,
    borderColor: colors.border_green,
    fontFamily: 'PSemi-Bold',
    flexShrink: 1, // ✅ Allow text to shrink
  },
  Details: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: 'PSemi-Bold',
    marginTop: 2,
    flexShrink: 1, // ✅ Allow text to shrink
  },
  errorText: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: 'red',
    marginTop: 2,
    flexShrink: 1,
  },
  navbar: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 0.9,
    alignSelf: 'center',
    marginTop: SCREEN_HEIGHT * 0.1,
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
  listItemTitle: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: 'PSemi-Bold',
  },
  listItemDetails: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: '#555',
    fontFamily: 'PSemi-Bold',
  },
  listItemStatus: {
    fontSize: SCREEN_WIDTH * 0.038,
    color: '#777',
    fontStyle: 'italic',
    marginTop: 2,
    fontWeight: 'bold'
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
  modalImage: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: 10,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'PSemi-Bold',
  },
  modalText: {
    fontSize: SCREEN_WIDTH * 0.035,
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'PSemi-Bold'
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: colors.border_green,
    paddingVertical: SCREEN_HEIGHT * 0.012,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    borderRadius: 10,
  },
});