import { Image, Text, View, StyleSheet, ImageBackground, TouchableOpacity, TextInput, Pressable, Dimensions } from "react-native"
import React from "react"
import colors from '../../constant/colors';
import { useRouter } from 'expo-router';

export default function LogIn(){
    const { width, height} = Dimensions.get('window');
    const router = useRouter();
    return (
       <ImageBackground source={require('../../assets/images/trece.jpg')} style={[ styles.container]}>
        <Image source={require('../../assets/images/logo-modified.png')}
        style={{
            width: 200,
            height: 200,
        }} />
    
        <Text style={{
            marginTop: 10,
            fontFamily: 'PSemi-Bold',
            fontSize: 25,
            color: colors.BG_color,
            textShadowColor: 'black',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 10,
        }}>Login Your Account</Text>
        <TextInput placeholder="Enter Email" placeholderTextColor={colors.BG_color} style={styles.textInput}/>
        <TextInput placeholder="Enter Password" placeholderTextColor={colors.BG_color} secureTextEntry={true} style={styles.textInput}/>

        <TouchableOpacity style={{
                marginTop: 15,
                padding: 15,
                backgroundColor: colors.pale_green,
                width: '50%',
                alignItems: 'center',
                borderRadius: 10,
            }} onPress={() => router.push('home')}>
            <Text style={{
                fontFamily: 'PSemi-Bold',
            }}>Login</Text>
        </TouchableOpacity>

        <View style={{
            flexDirection: 'row',
            gap: 3,
            marginTop: 10
        }}>
            <Text style={{
                fontFamily: 'PSemi-Bold',
                color: colors.BG_color,
                textShadowColor: 'black',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 10,
            }}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('auth/signup')}><Text style={{
                fontFamily: 'PSemi-Bold',
                color: colors.pale_green,
                textShadowColor: 'black',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 10,
            }}>Sign Up Here</Text></Pressable>
        </View>
        </ImageBackground>
    )
}const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    paddingTop: 100,
    padding: 25,
  },
  textInput: {
    borderColor: colors.BG_color,
    borderWidth: 2,
    marginTop: 15,
    width: '100%',
    borderRadius: 10,
    fontFamily: 'PSemi-Bold',
    fontSize: 15,
    color: colors.BG_color
  }
})
