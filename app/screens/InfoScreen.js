import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View, ScrollView, Linking, SafeAreaView, Dimensions } from 'react-native';
import colors from '../../constant/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    title: "Bounty’s Green Revolution: Leading Plastic Waste Management",
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

const InfoScreen = ({ navigation }) => {
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
      Alert.alert(
        'Unable to Open Link',
        'Could not open this link. Please check your internet connection or try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>Materials on Waste Management</Text>

        {articles.map((item, idx) => {
          const isVideo = item.link.includes("youtube.com") || item.link.includes("youtu.be");
          return (
            <View key={idx} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <TouchableOpacity style={styles.linkButton} onPress={() => openLink(item.link)}>
                <Text style={styles.linkButtonText}>
                  {isVideo ? "Watch Video →" : "Read More →"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lime_green,
    paddingBottom: SCREEN_HEIGHT * 0.01,
  },
  scrollContainer: {
    flexGrow: 1, // ✅ ensures full scrollability
    paddingBottom: SCREEN_HEIGHT * 0.12, // ✅ extra space at the bottom
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
  cardTitle: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '600',
    color: colors.border_green,
    textAlign: 'center'
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
});

export default InfoScreen;
