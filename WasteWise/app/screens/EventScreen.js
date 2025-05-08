import React from 'react';
import {Text, Image, ImageBackground, TouchableOpacity, StyleSheet } from 'react-native';
import Header from '../../components/Home/header';
import colors from '../../constant/colors';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';

const EventScreen = ({ navigation }) => {
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
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {events.map((event, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.card}
          >
            <Image 
              source={require('../../assets/images/bg-image.jpg')} 
              style={styles.image} 
            />
            <Text style={styles.text}>{event.title}</Text>
            <Text style={styles.details}>{event.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </GestureHandlerRootView>
  );
};

export default EventScreen;

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
});
