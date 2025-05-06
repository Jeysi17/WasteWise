import { Image, Text, View, StyleSheet, ImageBackground, TouchableOpacity, ScrollView} from "react-native";
import colors from '../constant/colors';
import { useRouter } from "expo-router";
import SplashScreen from '../app/screens/SplashScreenView'
import { useEffect, useState } from "react";

export default function Index() {
  const router = useRouter();
  const [isShowSplash, setIsShowSplash] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setIsShowSplash(false);
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
      <Image source={require('./../assets/images/logo-modified.png')}
      style={{
        width: '75%',
        height: 300,
        marginLeft: 5,
        marginTop: 10,
        alignSelf: 'center'
      }}
      />
      
      <View>
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
                  fontFamily: 'PSemi-Bold'
                  
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
                  <Text style={styles.buttonText}>Get Started on WasteWise</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, {
                  backgroundColor: colors.pale_green, marginTop: 10, borderWidth: 1, borderColor: colors.BG_color}]}
                  onPress={()=>router.push('../auth/login')}
                  >
                  <Text style={styles.buttonText}>Already have an account?</Text>
                </TouchableOpacity>
            </View>
        </View>
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
