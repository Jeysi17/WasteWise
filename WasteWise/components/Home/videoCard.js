import React from 'react';
import {Text, Image, ImageBackground, TouchableOpacity, StyleSheet, View } from 'react-native';
import colors from '../../constant/colors';


    const VideoCard = ({ title, content}) => {
      return (
        <View style={styles.card}>
            <ImageBackground source={require('../../assets/images/bg-image.jpg')} style={styles.infoThumbnail} >
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.vidDetails}>{content}</Text>
            </ImageBackground>
           <TouchableOpacity>
              <Text style={styles.infoLink}>Click Here to Watch the Video</Text>
            </TouchableOpacity>
        </View>
      );
    };
    
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
        width: '97%',
        height: 'auto',
        marginTop: 10,
        alignSelf: 'center',
        overflow: 'hidden',
        borderWidth: 3,
        borderRadius: 10,
        borderColor: colors.border_green,
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
      infoThumbnail: {
        flex: 1,
        width: '95%',
        height: 170,
        margin: 20,   
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
      infoLink: {
          backgroundColor: colors.pale_green,
          width: '100%',
          alignSelf: 'center',
          marginTop: -19,
          padding: 10,
          fontFamily: 'PSemi-Bold',
          textAlign: 'center',
      },
    });
    
    
    export default VideoCard;