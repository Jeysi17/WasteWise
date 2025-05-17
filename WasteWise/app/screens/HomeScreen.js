import React, {useState} from 'react';
import {Text, Image, ImageBackground, TouchableOpacity, StyleSheet, View } from 'react-native';
import colors from '../../constant/colors';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import VideoCard from '../../components/Home/videoCard';
import ArticleCard from '../../components/Home/articleCard';


const HomeScreen = ({ navigation }) => {
  const events = [
    { title: "Event Title", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." },
    { title: "Event Title", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." },
    { title: "Event Title", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." },
    { title: "Event Title", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." },
    { title: "Event Title", description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." }
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg_green }}>
        <ScrollView contentContainerStyle={{ paddingBottom: '38%' }}>
        <ImageBackground
          source={require('../../assets/images/bg-image.jpg')}
          style={{
            height: 200,
            width: '100%',
            backgroundColor: 'rgb(0, 0, 0)',
          }}
        >
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderBottomWidth: 6,
            borderColor:  colors.border_green,

          }}
        />
          <Text style={styles.title}>Event Title</Text>
          <Text style={styles.subtitle}>
            Lorem ipsum is a placeholder text commonly used in publishing and graphic design.
          </Text>
          <TouchableOpacity style={styles.readMoreButton}>
            <Text style={styles.readMoreText}>Read More</Text>
          </TouchableOpacity>
        </ImageBackground>

      
          <View>
            <VideoCard title="Card Title 1" content="This is the content of card 1." />
          </View>
          <View>
            <ArticleCard title="Card Title 1" content="This is the content of card 1." />
          </View>
          <View>
            <VideoCard title="Card Title 1" content="This is the content of card 1." />
          </View>
          <View>
            <ArticleCard title="Card Title 1" content="This is the content of card 1." />
          </View>
          <View>
            <VideoCard title="Card Title 1" content="This is the content of card 1." />
          </View>
          <View>
            <ArticleCard title="Card Title 1" content="This is the content of card 1." />
          </View>
          <View>
            <VideoCard title="Card Title 1" content="This is the content of card 1." />
          </View>
          <View>
            <ArticleCard title="Card Title 1" content="This is the content of card 1." />
          </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
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
