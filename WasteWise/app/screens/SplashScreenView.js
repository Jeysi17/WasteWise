import { View, Text, StyleSheet, Image } from 'react-native'
import React from 'react'
import Icon from '../../assets/icons/app_icon.jpeg'
export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View>
        <Image source={Icon} style={styles.image}/>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    marginTop: 250,
    height: 250, 
    width: 250,
    resizeMode: 'cover',
  }
})
