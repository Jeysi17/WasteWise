import React from 'react';
import {Text, Image, ImageBackground, TouchableOpacity, StyleSheet, View } from 'react-native';
import Header from '../../components/Home/header';
import colors from '../../constant/colors';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';


const HomeScreen = ({ navigation }) => {
  const events = [
    { title: "Event Title", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." },
    { title: "Event Title", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." },
    { title: "Event Title", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." },
    { title: "Event Title", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." },
    { title: "Event Title", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." }
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.lime_green }}>
        <Header />
        
        <ImageBackground
          source={require('../../assets/images/bg-image.jpg')}
          style={{
            height: 200,
            width: '100%',
          }}
        >
          <Text style={styles.title}>Event Title</Text>
          <Text style={styles.subtitle}>
            Lorem ipsum is a placeholder text commonly used in publishing and graphic design.
          </Text>
          <TouchableOpacity style={styles.readMoreButton}>
            <Text style={styles.readMoreText}>Read More</Text>
          </TouchableOpacity>
        </ImageBackground>

        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <ImageBackground source={require('../../assets/images/bg-image.jpg')} style={styles.infoThumbnail}>
            <Text style={styles.vidDetails}>Lorem ipsum is a placeholder text commonly used in publishing and graphic design.</Text>
          </ImageBackground>
          <TouchableOpacity>
              <Text style={styles.infoLink}>Click Here to Watch the Video</Text>
          </TouchableOpacity>
          <View style={styles.articleContainer}>
            <Image source={require('../../assets/images/cover1.jpeg')} style={styles.articleTThumbnail}></Image>
            <Text style={styles.articleDetails}>Lorem ipsum is a placeholder text commonly used in publishing and graphic design.</Text>
          </View>
          <TouchableOpacity>
              <Text style={styles.infoLink}>Click Here to Read the Article</Text>
          </TouchableOpacity>
          <ImageBackground source={require('../../assets/images/bg-image.jpg')} style={styles.infoThumbnail}>
            <Text style={styles.vidDetails}>Lorem ipsum is a placeholder text commonly used in publishing and graphic design.</Text>
          </ImageBackground>
          <TouchableOpacity>
              <Text style={styles.infoLink}>Click Here to Watch the Video</Text>
          </TouchableOpacity>
          <ImageBackground source={require('../../assets/images/bg-image.jpg')} style={styles.infoThumbnail}>
            <Text style={styles.vidDetails}>Lorem ipsum is a placeholder text commonly used in publishing and graphic design.</Text>
          </ImageBackground>
          <TouchableOpacity>
              <Text style={styles.infoLink}>Click Here to Watch the Video</Text>
          </TouchableOpacity>
          <View style={styles.articleContainer}>
            <Image source={require('../../assets/images/cover1.jpeg')} style={styles.articleTThumbnail}></Image>
            <Text style={styles.articleDetails}>Lorem ipsum is a placeholder text commonly used in publishing and graphic design.</Text>
          </View>
          <TouchableOpacity>
              <Text style={styles.infoLink}>Click Here to Read the Article</Text>
          </TouchableOpacity>
          <View style={styles.articleContainer}>
            <Image source={require('../../assets/images/cover1.jpeg')} style={styles.articleTThumbnail}></Image>
            <Text style={styles.articleDetails}>Lorem ipsum is a placeholder text commonly used in publishing and graphic design.</Text>
          </View>
          <TouchableOpacity>
              <Text style={styles.infoLink}>Click Here to Read the Article</Text>
          </TouchableOpacity>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  title: {
    fontFamily: 'PSemi-Bold',
    fontSize: 30,
    alignSelf: 'center',
    marginTop: 10,
    color: colors.BG_color,
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'PSemi-Bold',
    color: colors.BG_color,
    textAlign: 'center',
    marginHorizontal: 10,
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  readMoreButton: {
    alignSelf: 'center',
    backgroundColor: colors.BG_color,
    padding: 5,
    borderRadius: 10,
    marginTop: 10,
  },
  readMoreText: {
    fontFamily: 'PSemi-Bold',
  },
  card: {
    backgroundColor: colors.pale_green,
    width: '90%',
    height: 150,
    marginTop: 20,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '40%',
    height: '100%',
    position: 'absolute',
    left: 0,
  },
  text: {
    fontFamily: 'PSemi-Bold',
    padding: 5,
    backgroundColor: colors.BG_color,
    alignSelf: 'flex-start',
    width: 210,
    marginLeft: 143,
    marginTop: 1,
    textAlign: 'center',
  },
  details: {
    fontFamily: 'PSemi-Bold',
    textAlign: 'justify',
    marginLeft: 160,
    marginTop: 5,
    marginRight: 20,
    fontSize: 10,
  },
  infoThumbnail: {
    flex: 1,
    width: '95%',
    height: 170,
    margin: 20,
    
  },
  infoLink: {
    backgroundColor: colors.pale_green,
    width: '90%',
    alignSelf: 'center',
    marginTop: -19,
    padding: 10,
    fontFamily: 'PSemi-Bold',
    textAlign: 'center',
  },
  vidDetails: {
    fontSize: 15,
    fontFamily: 'PSemi-Bold',
    color: colors.BG_color,
    textAlign: 'center',
    textShadowColor: "#000000",
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 10,
    marginHorizontal: 30,
    marginVertical: 50
  },
  articleContainer: {
    backgroundColor: colors.pale_green,
    width: '90%',
    marginTop: 10,
    margin: 20,
    flexDirection: 'row'
  },
  articleTThumbnail: {
    width: '30%',
    height: 150,
    marginLeft: 1,
  },
  articleDetails: {
    fontFamily: 'PSemi-Bold',
    fontSize: 13,
    marginLeft: 20,
    marginRight: 130,
    marginTop: 30,
    textAlign: 'center',
    marginVertical: 15
  }
});
