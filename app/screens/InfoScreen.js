import React, { useState, useRef } from 'react';
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
  Image
} from 'react-native';
import colors from '../../constant/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Slogans data
const slogans = [
  {
    id: 1,
    title: "Possible ang Zero Waste kung magtutulungan tayo",
    image: require('../../assets/images/possible-ang-zero-waste-kung-magtutulungan-tayo.jpg'),
  },
  {
    id: 2,
    title: "9 na dahilan para iwasan ang paggamit ng plastik",
    image: require('../../assets/images/9-na-dahilan-para-iwasan-ang-paggamit-ng-plastik.jpg'),
  },
  {
    id: 3,
    title: "Bawasan natin ang basurang plastik",
    image: require('../../assets/images/bawasan-natin-ang-basurang-plastik.jpg'),
  },
  {
    id: 4,
    title: "Tamang pagtatapon ng apat na uri ng basura",
    image: require('../../assets/images/tamang-pagtatapon-ng-apat-na-uri-basura.jpg'),
  },
  {
    id: 5,
    title: "Pangalagaan ang ating kapaligiran at ang ating kalusugan itapon sa Special Waste Bins ang mga delikado at nakakahawang mga basura",
    image: require('../../assets/images/slogan-3.jpg'),
  },
  {
    id: 6,
    title: "Makakatulong sa inyong pamilya ang Zero Waste!",
    image: require('../../assets/images/zero-waste.jpg'),
  },
];

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

const InfoScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlogan, setSelectedSlogan] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const scrollViewRef = useRef(null);

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

  const openSloganImage = (slogan) => {
    const index = slogans.findIndex(s => s.id === slogan.id);
    setCurrentIndex(index);
    setSelectedSlogan(slogan);
    setModalVisible(true);
    
    // Reset scroll position when opening new image
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
    }
  };

  const closeSloganImage = () => {
    setModalVisible(false);
    setSelectedSlogan(null);
    setCurrentIndex(0);
  };

  const goToNext = () => {
    if (currentIndex < slogans.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedSlogan(slogans[newIndex]);
      
      // Reset scroll position for new image
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
      }
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedSlogan(slogans[newIndex]);
      
      // Reset scroll position for new image
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
      }
    }
  };

  const resetZoom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.title}>Materials on Waste Management</Text>

        {/* Slogans Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Educational Slogans & Guides</Text>
        </View>

        {/* Slogans Cards */}
        {slogans.map((slogan, index) => (
          <View key={slogan.id} style={[
            styles.card,
            index === 0 && styles.firstSloganCard
          ]}>
            <Text style={styles.cardTitle}>{slogan.title}</Text>
            <TouchableOpacity 
              style={styles.linkButton} 
              onPress={() => openSloganImage(slogan)}
            >
              <Text style={styles.linkButtonText}>View Slogan →</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Articles Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Articles & Videos</Text>
        </View>

        {/* Articles List */}
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

      {/* Image Modal with Navigation Buttons */}
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
                {currentIndex + 1} of {slogans.length}
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

            {/* Zoomable Image */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              maximumZoomScale={3.0}
              minimumZoomScale={1.0}
              showsHorizontalScrollIndicator={true}
              showsVerticalScrollIndicator={true}
              bounces={true}
              bouncesZoom={true}
              pinchGestureEnabled={true} // Add this
              directionalLockEnabled={false} // Add this
              contentOffset={{ x: 0, y: 0 }} // Add this
            >
              <Image
                source={selectedSlogan?.image}
                style={styles.zoomableImage}
                resizeMode="contain"
              />
            </ScrollView>

            {/* Next Button */}
            {currentIndex < slogans.length - 1 && (
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
};

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
  sectionHeader: {
    backgroundColor: colors.border_green,
    marginHorizontal: SCREEN_WIDTH * 0.05,
    marginVertical: SCREEN_HEIGHT * 0.02,
    paddingVertical: SCREEN_HEIGHT * 0.015,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.dark_green,
  },
  sectionTitle: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
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
  sloganCard: {
    backgroundColor: colors.pale_green,
    borderColor: colors.orange,
  },
  firstSloganCard: {
    marginTop: SCREEN_HEIGHT * 0.01,
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
  imageButton: {
    marginTop: SCREEN_HEIGHT * 0.012,
    alignSelf: 'center',
    backgroundColor: colors.orange,
    paddingVertical: SCREEN_HEIGHT * 0.007,
    paddingHorizontal: SCREEN_WIDTH * 0.03,
    borderRadius: 6,
  },
  imageButtonText: {
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.06,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  imageContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
    marginHorizontal: 10,
  },
  scrollViewContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomableImage: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.7,
  },
  // Navigation Buttons
  navButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  navButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.08,
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  imageCounter: {
    color: '#ccc',
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: 'bold',
  },
  zoomHint: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.035,
    marginBottom: 10,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: colors.border_green,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: 'bold',
  },
});

export default InfoScreen;