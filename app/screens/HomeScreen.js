import React, { useEffect, useState } from 'react';
import { Text, Image, TouchableOpacity, StyleSheet, View, Linking, Dimensions, Alert, Platform } from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import colors from '../../constant/colors';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user, userLocation } = useAuth();
  const [summary, setSummary] = useState({ pending: 0, solved: 0 });
  const [schedule, setSchedule] = useState(null);
  const [article, setArticle] = useState(null);
  const [loadingArticle, setLoadingArticle] = useState(true);

  const apiUrl = process.env.EXPO_PUBLIC_HOST_URL;

  // 🧠 Function to format date in words
  const formatDateInWords = (dateString) => {
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

  // 🆕 Fetch random article from database
const fetchRandomArticle = async () => {
  try {
    setLoadingArticle(true);
    console.log('📰 Fetching random article from:', `${apiUrl}/api/materials/random`);
    
    const response = await fetch(`${apiUrl}/api/materials/random`);
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch random article:', response.status, response.statusText);
      
      // Try to get error details
      try {
        const errorData = await response.text();
        console.error('❌ Error response:', errorData);
      } catch (e) {
        console.error('❌ Could not read error response');
      }
      
      // Fallback: Use local articles if API fails
      const fallbackArticles = [
        {
          title: "Waste Disposal",
          link_url: "https://www.britannica.com/technology/waste-disposal-system",
          thumbnail_path: null,
          created_at: new Date().toISOString()
        },
        {
          title: "How Our Trash Impacts the Environment",
          link_url: "https://www.earthday.org/how-our-trash-impacts-the-environment/",
          thumbnail_path: null,
          created_at: new Date().toISOString()
        }
      ];
      
      const randomFallback = fallbackArticles[Math.floor(Math.random() * fallbackArticles.length)];
      setArticle(randomFallback);
      return;
    }
    
    const articleData = await response.json();
    console.log('✅ Random article received:', articleData);
    setArticle(articleData);
  } catch (error) {
    console.error('❌ Error fetching random article:', error.message);
    console.error('❌ Full error:', error);
    
    // Fallback to local articles
    const fallbackArticles = [
      {
        title: "Waste Disposal",
        link_url: "https://www.britannica.com/technology/waste-disposal-system",
        thumbnail_path: null,
        created_at: new Date().toISOString()
      },
      {
        title: "How Our Trash Impacts the Environment",
        link_url: "https://www.earthday.org/how-our-trash-impacts-the-environment/",
        thumbnail_path: null,
        created_at: new Date().toISOString()
      }
    ];
    
    const randomFallback = fallbackArticles[Math.floor(Math.random() * fallbackArticles.length)];
    setArticle(randomFallback);
  } finally {
    setLoadingArticle(false);
  }
};
  // 🆕 Load random article when component mounts
  useEffect(() => {
    fetchRandomArticle();
  }, []); // Only runs once on mount

  // 🆕 Function to refresh article (optional - you could add a refresh button)
  const refreshArticle = () => {
    fetchRandomArticle();
  };

  const fetchAllData = async () => {
    try {
      if (!user) {
        console.log('❌ No user found');
        return;
      }
  
      console.log('🔍 Fetching summary for:', user.name);
      console.log('🌐 API URL:', `${apiUrl}/api/posts/summary/${encodeURIComponent(user.name)}`);
  
      const summaryRes = await fetch(`${apiUrl}/api/posts/summary/${encodeURIComponent(user.name)}`);
      
      if (!summaryRes.ok) {
        console.error('❌ Summary fetch failed:', summaryRes.status, summaryRes.statusText);
        return;
      }
  
      const summaryData = await summaryRes.json();
      console.log('📊 Summary Data received:', summaryData);
      setSummary(summaryData);
  
      if (userLocation) {
        const schedRes = await fetch(`${apiUrl}/api/schedules`);
        const schedules = await schedRes.json();
  
        const userSchedules = schedules
        // only schedules in the same barangay
        .filter(s => 
          s.barangay?.toLowerCase().trim() === userLocation?.toLowerCase().trim() &&
          s.completed === false
        )        
        // sort newest first
        .sort((a, b) => new Date(b.schedule_date) - new Date(a.schedule_date));

        // pick the most recent one that's not completed
        const latestNotCompleted = userSchedules.length > 0 ? userSchedules[0] : null;
        setSchedule(latestNotCompleted);

        console.log('📅 Latest Not Completed Schedule:', latestNotCompleted);
    
        console.log('🗺 UserLocation:', userLocation);
        console.log('📅 Latest Schedule:', latestNotCompleted);
      }
    } catch (err) {
      console.error('❌ Error fetching home data:', err.message);
      console.error('Full error:', err);
    }
  };

  // ✅ Fetch every 3 seconds
  useEffect(() => {
    if (user && userLocation) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 3000);
      return () => clearInterval(interval);
    }
  }, [user, userLocation]);

  // 🔗 IMPROVED: Open link with fallback options
  const openLink = async (url) => {
    try {
      // For YouTube links, try multiple approaches
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // Extract video ID
        let videoId = null;
        
        if (url.includes('youtube.com/watch?v=')) {
          videoId = url.split('watch?v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1]?.split('?')[0];
        }

        if (videoId) {
          // Try YouTube app first (vnd.youtube://)
          const youtubeAppUrl = `vnd.youtube://watch?v=${videoId}`;
          const canOpenYoutubeApp = await Linking.canOpenURL(youtubeAppUrl);
          
          if (canOpenYoutubeApp) {
            await Linking.openURL(youtubeAppUrl);
            return;
          }
        }
      }

      // Fallback: Try opening the original URL in browser
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Last resort: Try opening without checking
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

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg_green }}>
      <ScrollView 
        contentContainerStyle={{
          paddingBottom: SCREEN_HEIGHT * 0.13,
          backgroundColor: colors.lime_green,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>User Dashboard</Text>

        {/* 🧍 Profile Card - FIXED */}
        <View style={[styles.card, styles.profileCard]}>
          <Image source={require('../../assets/images/logo-modified.png')} style={styles.profileImage} />
          <View style={styles.profileTextContainer}>
            <Text 
              style={styles.cardTitle} 
              numberOfLines={1} 
              ellipsizeMode="tail"
            >
              Welcome, {user?.name}!
            </Text>
            <Text 
              style={styles.cardSubtitle} 
              numberOfLines={1} 
              ellipsizeMode="tail"
            >
              {user?.email}
            </Text>
            <Text 
              style={styles.cardSubtitle} 
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Barangay: {userLocation}
            </Text>
          </View>
        </View>

        {/* 📊 Complaints Summary */}
        <View style={styles.card}>
          <Text style={[
            styles.cardTitle, 
            { borderBottomWidth: 2, 
            paddingBottom: 3, 
            borderColor: colors.border_green}
            ]}>Your Complaints</Text>

          <View style={styles.circleContainer}>
            <View style={styles.circleWrapper}>
              <View style={[styles.circle, { backgroundColor: colors.pale_green }]}>
                <Text style={styles.circleNumber}>{summary.pending}</Text>
              </View>
              <Text style={styles.circleLabel}>Pending</Text>
            </View>

            <View style={styles.circleWrapper}>
              <View style={[styles.circle, { backgroundColor: colors.pale_green }]}>
                <Text style={styles.circleNumber}>{summary.solved}</Text>
              </View>
              <Text style={styles.circleLabel}>Resolved</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
        </View>

        {/* 📅 Upcoming Schedule */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upcoming Waste Collection Schedule</Text>
          {schedule ? (
            <>
              <Text style={styles.cardSubtitle}>{schedule.barangay}</Text>
              <Text style={styles.cardDate}>
                {formatDateInWords(schedule.schedule_date)}
              </Text>
            </>
          ) : (
            <Text>No upcoming schedules.</Text>
          )}
        </View>

        {/* 📰 Featured Article (Random from Database) */}
        <View style={styles.card}>
          <View style={styles.articleHeader}>
            <Text style={styles.cardTitle}>Featured Article/Video For You</Text>
            <TouchableOpacity onPress={refreshArticle} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>↻</Text>
            </TouchableOpacity>
          </View>
          
          {loadingArticle ? (
            <Text style={styles.loadingText}>Loading featured content...</Text>
          ) : article ? (
            <>
              <Text style={styles.articleTitle}>{article.title}</Text>
              
              {/* Optional: Display thumbnail if available */}
              {article.thumbnail_path && (
                <Image 
                  source={{ uri: `${apiUrl}${article.thumbnail_path}` }} 
                  style={styles.articleThumbnail}
                  resizeMode="cover"
                />
              )}
              
              {/* Optional: Display date */}
              {article.created_at && (
                <Text style={styles.articleDate}>
                  Added: {formatDateInWords(article.created_at)}
                </Text>
              )}
              
              <TouchableOpacity onPress={() => openLink(article.link_url)}>
                <Text style={styles.articleLink}>
                  {article.link_url.includes("youtube.com") || article.link_url.includes("youtu.be")
                    ? "Watch Video →"
                    : "Read More →"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text>No articles available at the moment.</Text>
          )}
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

export default HomeScreen;

// ================= Styles =================
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg_green,
    width: SCREEN_WIDTH * 0.9,
    borderRadius: 15,
    alignSelf: 'center',
    marginVertical: SCREEN_HEIGHT * 0.012,
    padding: SCREEN_WIDTH * 0.04,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  profileImage: { 
    width: SCREEN_WIDTH * 0.18, 
    height: SCREEN_WIDTH * 0.18, 
    borderRadius: SCREEN_WIDTH * 0.09,
  },
  profileTextContainer: {
    flex: 1,
    marginLeft: SCREEN_WIDTH * 0.03,
    justifyContent: 'center',
    maxWidth: SCREEN_WIDTH * 0.62,
  },
  cardTitle: { 
    fontSize: SCREEN_WIDTH * 0.045, 
    fontWeight: 'bold', 
    color: colors.border_green,
    fontFamily: 'PSemi-Bold',
    flexShrink: 1,
  },
  cardSubtitle: { 
    fontSize: SCREEN_WIDTH * 0.035,
    color: '#333', 
    marginTop: 4,
    fontFamily: 'PSemi-Bold',
    flexShrink: 1,
  },
  cardDate: { 
    fontSize: SCREEN_WIDTH * 0.04, 
    color: colors.border_green, 
    marginTop: 5, 
    fontWeight: '600' 
  },
  profileCard: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  viewButton: { 
    marginTop: SCREEN_HEIGHT * 0.015, 
    paddingVertical: SCREEN_HEIGHT * 0.01, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: colors.pale_green,
    borderWidth: 2,
    borderColor: colors.border_green,
  },
  viewButtonText: { 
    color: colors.border_green, 
    fontWeight: 'bold', 
    fontSize: SCREEN_WIDTH * 0.035 
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
    borderRadius: 40,
    paddingTop: SCREEN_HEIGHT * 0.0069,
    borderWidth: 2,
    borderColor: colors.border_green,
  },
  circleContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    marginVertical: SCREEN_HEIGHT * 0.025,
    marginBottom: SCREEN_HEIGHT * 0.001, 
  },
  circleWrapper: { 
    alignItems: 'center' 
  },
  circle: {
    width: SCREEN_WIDTH * 0.25,
    height: SCREEN_WIDTH * 0.25,
    borderRadius: SCREEN_WIDTH * 0.125,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.border_green,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  circleNumber: { 
    fontSize: SCREEN_WIDTH * 0.08, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  circleLabel: { 
    marginTop: SCREEN_HEIGHT * 0.01, 
    fontSize: SCREEN_WIDTH * 0.04, 
    fontWeight: '600', 
    color: '#333',
    fontFamily: 'PSemi-Bold',
  },
  articleTitle: { 
    fontSize: SCREEN_WIDTH * 0.04, 
    fontWeight: 'bold', 
    color: '#222', 
    marginTop: SCREEN_HEIGHT * 0.012,
    fontFamily: 'PSemi-Bold',
    borderBottomWidth: 2,
    borderBottomColor: colors.border_green,
    paddingBottom: 6,
  },
  articleLink: { 
    color: colors.border_green, 
    fontWeight: 'bold', 
    marginTop: 10,
    fontSize: SCREEN_WIDTH * 0.035,
  },
  articleDate: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  articleThumbnail: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.15,
    borderRadius: 8,
    marginTop: SCREEN_HEIGHT * 0.01,
    marginBottom: SCREEN_HEIGHT * 0.01,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: colors.pale_green,
    width: SCREEN_WIDTH * 0.08,
    height: SCREEN_WIDTH * 0.08,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border_green,
  },
  refreshButtonText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: 'bold',
    color: colors.border_green,
  },
  loadingText: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: '#666',
    textAlign: 'center',
    marginTop: SCREEN_HEIGHT * 0.02,
    fontStyle: 'italic',
  },
});