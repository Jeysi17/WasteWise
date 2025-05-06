import React from 'react-native';
import { View, Text, Image, ImageBackground, Button, TouchableOpacity, StyleSheet } from 'react-native'
import Header from '../../components/Home/header'
import colors from '../../constant/colors'

const CreatePostScreen = (navigation) => {
    return (
        <View>
        <Header />
            <ImageBackground source={require('../../assets/images/bg-image.jpg')} 
            style={{
                height: 200,
                width: '100%'
            }}>
                <Text style={{
                    fontFamily: 'PSemi-Bold',
                    fontSize: 30,
                    alignSelf: 'center',
                    marginTop: 10,
                    color: colors.BG_color,
                    textShadowColor: 'black',
                    textShadowOffset: {width: 1, height: 1},
                    textShadowRadius: 10
                }}>Event Title</Text>
                <Text style={{
                    fontFamily: 'PSemi-Bold',
                    color: colors.BG_color,
                    textAlign: 'center',
                    textShadowColor: 'black',
                    textShadowOffset: {width: 1, height: 1},
                    textShadowRadius: 10
                }}>Lorem ipsum is a placeholder text commonly used in publishing and graphic design to demonstrate the visual form of a document or a typeface without relying on meaningful content."</Text>
                <TouchableOpacity style={{
                    alignSelf: 'center',
                    backgroundColor: colors.BG_color,
                    padding: 5,
                    borderRadius: 10,
                }}>
                    <Text style={{
                        fontFamily: 'PSemi-Bold'
                    }}>Read More</Text>
                </TouchableOpacity>
            </ImageBackground>
            <View style={{
               backgroundColor: colors.lime_green,
               height: '100%' 
            }}>
            </View>
    </View>

    );
};

export default CreatePostScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
})