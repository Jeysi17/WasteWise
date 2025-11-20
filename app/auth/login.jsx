import React, { useState } from "react";
import { 
  Image,
  Keyboard, 
  Text, 
  View, 
  StyleSheet,
  TouchableWithoutFeedback, 
  ImageBackground, 
  TouchableOpacity, 
  TextInput, 
  Pressable, 
  Dimensions, 
  ActivityIndicator, 
  ToastAndroid,
} from "react-native";
import colors from '../../constant/colors';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"; 

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LogIn() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const {session, signin} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        if(!email || !password) {
            ToastAndroid.show('Please enter email and password!', ToastAndroid.BOTTOM);
            return;
        }
        if (isLoading) return;
        setIsLoading(true);
        try {
            const success = await signin({email, password});
          
            if (success) {
                ToastAndroid.show('Login successful!', ToastAndroid.BOTTOM);
                router.replace('/screens/HomeScreen');
            }
        } catch (error) {
            if (error.message.includes('Rate limit')) {
                ToastAndroid.show('Too many login attempts. Please wait a moment before trying again.', ToastAndroid.BOTTOM);
            } else {
                ToastAndroid.show('Login failed. Please check your credentials and try again.', ToastAndroid.BOTTOM);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAwareScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <ImageBackground
              source={require("../../assets/images/trece.jpg")}
              style={styles.container}
            >
              <Image
                source={require("../../assets/images/logo-modified.png")}
                style={styles.logo}
              />
    
              <Text style={styles.title}>Login Your Account</Text>
    
              <TextInput
                placeholder="Enter Email"
                placeholderTextColor={colors.BG_color}
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                placeholder="Enter Password"
                placeholderTextColor={colors.BG_color}
                secureTextEntry={true}
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
              />
    
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.BG_color} />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>
    
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account?</Text>
                <Pressable onPress={() => router.push("auth/signup")}>
                  <Text style={styles.signUpText}>Sign Up Here</Text>
                </Pressable>
              </View>
            </ImageBackground>
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: SCREEN_HEIGHT * 0.1,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    minHeight: SCREEN_HEIGHT,
  },
  logo: {
    height: SCREEN_HEIGHT * 0.25,
    width: SCREEN_WIDTH * 0.5,
    resizeMode: "contain",
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  title: {
    marginBottom: SCREEN_HEIGHT * 0.03,
    fontFamily: "PSemi-Bold",
    fontSize: SCREEN_WIDTH * 0.065,
    color: colors.BG_color,
    textShadowColor: "black",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  textInput: {
    borderColor: colors.BG_color,
    borderWidth: 2,
    marginTop: SCREEN_HEIGHT * 0.018,
    width: "100%",
    borderRadius: 10,
    fontFamily: "PSemi-Bold",
    fontSize: SCREEN_WIDTH * 0.04,
    color: colors.BG_color,
    textShadowColor: "black",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
    paddingVertical: SCREEN_HEIGHT * 0.015,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    textAlignVertical: 'center',
  },
  loginButton: {
    marginTop: SCREEN_HEIGHT * 0.025,
    paddingVertical: SCREEN_HEIGHT * 0.018,
    backgroundColor: colors.pale_green,
    width: "55%",
    alignItems: "center",
    borderRadius: 10,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: "PSemi-Bold",
    fontSize: SCREEN_WIDTH * 0.04,
    color: "#000000",
  },
  footer: {
    flexDirection: "row",
    gap: SCREEN_WIDTH * 0.01,
    marginTop: SCREEN_HEIGHT * 0.025,
    marginBottom: SCREEN_HEIGHT * 0.03,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerText: {
    fontFamily: "PSemi-Bold",
    fontSize: SCREEN_WIDTH * 0.038,
    color: colors.BG_color,
    textShadowColor: "black",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  signUpText: {
    fontFamily: "PSemi-Bold",
    fontSize: SCREEN_WIDTH * 0.038,
    color: colors.pale_green,
    textShadowColor: "black",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
});