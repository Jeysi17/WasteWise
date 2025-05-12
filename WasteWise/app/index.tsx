import { Image, Text, View, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, Animated} from "react-native";
import colors from '../constant/colors';
import { useRouter } from "expo-router";
import SplashScreen from '../app/screens/SplashScreenView'
import { useEffect, useState } from "react";


export default function Index() {
  const [containerHeight] = useState(Dimensions.get('window').height);
  const router = useRouter();
  const [isShowSplash, setIsShowSplash] = useState(true);
  const logoTranslateY = useState(new Animated.Value(containerHeight * .321))[0];
  const panelTranslateY = useState(new Animated.Value(containerHeight * .7))[0];

  useEffect(() => {
    setTimeout(() => {
      setIsShowSplash(false);

      Animated.parallel([
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 700,
          delay: 500,
          useNativeDriver: true,
        }),
        Animated.timing(panelTranslateY, {
          toValue: 0,
          duration: 700,
          delay: 500,
          useNativeDriver: true,
        })

      ]).start();
    }, 3000)
  })


  return (
    
    <View>
      <>{isShowSplash ? <SplashScreen /> : 
      <ImageBackground 
      source={require('./../assets/images/trece.jpg')}
      style={{
        height: 1000
      }}
      resizeMode="cover"
    >
      <Animated.Image source={require('./../assets/images/logo-modified.png')}
      style={{
        height: containerHeight * 0.35,
        width: containerHeight * 0.35,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginTop: 10,
        transform: [{ translateY: logoTranslateY}]
        }}
      />
      
      <Animated.View style={{ transform: [{ translateY: panelTranslateY }] }}>
            <View style={{
                padding: 25,
                marginTop: 10,
                backgroundColor: colors.pale_green,
                height: '110%',
                borderTopLeftRadius: 35,
                borderTopRightRadius: 35
              }}>
                <Text style={{
                  fontSize: 35,
                  textAlign: 'center',
                  fontFamily: 'PSemi-Bold',
                  letterSpacing: 4,
                  color: colors.lime_green,
                }}>Welcome to WasteWise!</Text>

                <Text style={{
                  marginTop: 15,
                  fontSize: 20,
                  textAlign: 'center',
                  fontFamily: 'PSemi-Bold'
                }}>City Environment and Natural Resource Office of Trece Martires</Text>

                <TouchableOpacity style={styles.button}
                onPress={()=>router.push('../auth/signup')}
                >
                  <Text style={[styles.buttonText, { color: 'rgb(255, 255, 255)'}]}>Get Started on WasteWise</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, {
                  backgroundColor: colors.pale_green, marginTop: 10, borderWidth: 1, borderColor: colors.BG_color}]}
                  onPress={()=>router.push('../auth/login')}
                  >
                  <Text style={styles.buttonText}>Already have an account?</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    </ImageBackground>
    }</>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24
  },
  button:{
    marginTop: 30,
    padding: 20,
    backgroundColor: colors.lime_green,
    borderRadius: 35,
  },
  buttonText:{
    fontSize: 20,
    fontFamily: 'PSemi-Bold',
    textAlign: 'center'
  }
})
