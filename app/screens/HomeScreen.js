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

  // 📰 Local list of articles (no DB)
  const articles = [
    {
      title: "Waste Disposal",
      link: "https://www.britannica.com/technology/waste-disposal-system",
    },
    {
      title: "How Our Trash Impacts the Environment",
      link: "https://www.earthday.org/how-our-trash-impacts-the-environment/",
    },
    {
      title: "Simple Ways to Heal The Planet: A FREE Guide to Waste Management & Pollution Reduction",
      link: "https://healtheplanet.com/waste?gad_source=1&gad_campaignid=22255977746&gbraid=0AAAAACTrHhwJwapKHfIflVCBV1nbXoDFx&gclid=CjwKCAiA8bvIBhBJEiwAu5ayrCAxTeabneH_KYoSDemHHRwvCQ3EUX14t2VQrnp0nzQDXdEE5EqOsRoCXjwQAvD_BwE",
    },
    {
      title: "Everything You Need to Know About Waste Management ",
      link: "https://www.recyclingbristol.com/waste-management-everything-you-need-to-know-about-waste-management/",
    },
    {
      title: "Solid waste management needs to improve",
      link: "https://www.britishecologicalsociety.org/solid-waste-management-needs-to-improve/?gad_source=1&gad_campaignid=22686019361&gbraid=0AAAAABL5RNTVz-M5kJCZvmAZzlJ6VyRJ5&gclid=CjwKCAiA8bvIBhBJEiwAu5ayrJtp9Z33HbqJiJmiGjmDRrddmEGl2EXVlUk1Nggyn7E9lP47hnzNHhoCksIQAvD_BwE",
    },
    {
      title: "Bounty's Green Revolution: Leading Plastic Waste Management",
      link: "https://bounty.com.ph/2025/05/19/bounty-plastic-waste-management/?gad_source=1&gad_campaignid=23217610034&gbraid=0AAAAAqUOxF159ety0IVb20ZQX25tE1hwy&gclid=CjwKCAiA8bvIBhBJEiwAu5ayrMUqQaPK8di3RwGgSbeGvR66NsZAV6uODrBV_RHaVRZUYsuhe0CfRhoCHzoQAvD_BwE",
    },
    {
      title: "Status of Solid Waste Management in the Philippines ",
      link: "https://www.jstage.jst.go.jp/article/jsmcwm/24/0/24_677/_pdf",
    },
    {
      title: "Ridge to Reef: The Fight Against Mismanaged Waste",
      link: "https://climate.gov.ph/news/923",
    },
    {
      title: "Zero Waste",
      link: "https://www.no-burn.org/zero-waste/?gad_source=1&gad_campaignid=21174378386&gbraid=0AAAAAogjHBlS_-QYlc9g42mOmhOfn_2Ej&gclid=CjwKCAiA8bvIBhBJEiwAu5ayrAoycItGJQxtzIA2074w5LSa7UzUbnHdblfSO5aABoTsnoo5_A0XPhoCj2QQAvD_BwE",
    },
    {
      title: "Solid Waste Management Awareness and Practices",
      link: " https://www.aquademia-journal.com/download/solid-waste-management-awareness-and-practices-among-senior-high-school-students-in-a-state-college-9579.pdf",
    },
    {
      title: "Best Practice in Solid Waste Management in the Philippines",
      link: "https://www.youtube.com/watch?v=-EQBG5TdTn4&pp=ygUWc29saWQgd2FzdGUgbWFuYWdlbWVudA%3D%3D",
    },
    {
      title: "I-Witness: 'Plastic Republic', a documentary by Howie Severino",
      link: "https://www.youtube.com/watch?v=qGNCK_buzNk&pp=ygUuc29saWQgd2FzdGUgbWFuYWdlbWVudCBkb2N1bWVudGFyeSBwaGlsaXBwaW5lcw%3D%3D",
    },
    {
      title: "IRONY - Environmental Short Film",
      link: "https://www.youtube.com/watch?v=JNGUwrmvbs0&pp=ygUuc29saWQgd2FzdGUgbWFuYWdlbWVudCBkb2N1bWVudGFyeSBwaGlsaXBwaW5lcw%3D%3D",
    },
    {
      title: "Ano sa tingin mo? | Ecological Solid Waste Management",
      link: "https://www.youtube.com/watch?v=G-JKwlb1enY&pp=ygUuc29saWQgd2FzdGUgbWFuYWdlbWVudCBkb2N1bWVudGFyeSBwaGlsaXBwaW5lcw%3D%3D",
    },
  ];

  // 🧠 Pick a random article each login
  useEffect(() => {
    const random = articles[Math.floor(Math.random() * articles.length)];
    setArticle(random);
  }, []); // only once, on mount (like on login)

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
          paddingBottom: SCREEN_HEIGHT * 0.17,
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
          <Text style={styles.cardTitle}>Your Complaints</Text>

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

        {/* 📰 Featured Article (Random) */}
        {article && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Featured Article/Video For You</Text>
            <Text style={styles.articleTitle}>{article.title}</Text>

            <TouchableOpacity onPress={() => openLink(article.link)}>
              <Text style={styles.articleLink}>
                {article.link.includes("youtube.com") || article.link.includes("youtu.be")
                  ? "Watch Video →"
                  : "Read More →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </GestureHandlerRootView>
  );
};

export default HomeScreen;

// ================= Styles =================
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.pale_green,
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
  // ✅ NEW: Container for profile text with flex
  profileTextContainer: {
    flex: 1, // Takes remaining space after image
    marginLeft: SCREEN_WIDTH * 0.03,
    justifyContent: 'center',
    maxWidth: SCREEN_WIDTH * 0.62, // ✅ Prevents overflow
  },
  cardTitle: { 
    fontSize: SCREEN_WIDTH * 0.045, 
    fontWeight: 'bold', 
    color: colors.border_green,
    fontFamily: 'PSemi-Bold',
    flexShrink: 1, // Allow text to shrink if needed
  },
  cardSubtitle: { 
    fontSize: SCREEN_WIDTH * 0.035, // Slightly smaller for better fit
    color: '#333', 
    marginTop: 4,
    fontFamily: 'PSemi-Bold',
    flexShrink: 1, // Allow text to shrink if needed
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
    // ✅ Removed marginBottom - using image height only
  },
  viewButton: { 
    marginTop: SCREEN_HEIGHT * 0.015, 
    paddingVertical: SCREEN_HEIGHT * 0.01, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center' 
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
    fontFamily: 'PSemi-Bold'
  },
  circleContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    marginVertical: SCREEN_HEIGHT * 0.025 
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
  },
  articleSummary: { 
    fontSize: SCREEN_WIDTH * 0.035, 
    color: '#555', 
    marginTop: 6, 
    marginBottom: 8 
  },
  articleLink: { 
    color: colors.border_green, 
    fontWeight: 'bold', 
    marginTop: 5 
  },
});