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
  KeyboardAvoidingView,
  Dimensions,
  Platform,
  ToastAndroid,
  ActivityIndicator,
} from "react-native";
import { SelectList } from "react-native-dropdown-select-list";
import colors from "../../constant/colors";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

export default function SignUp() {
  const [containerHeight, setContainerHeight] = useState(
    Dimensions.get("window").height
  );
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { signup } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showLocationError, setShowLocationError] = useState(false);

  // Email validation function
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSignup = async () => {
    setIsLoading(true);

    // Validate fields
    if (!username || !email || !password || !confirmPassword) {
      ToastAndroid.show("Please fill all the fields!", ToastAndroid.BOTTOM);
      setIsLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      ToastAndroid.show("Please enter a valid email address!", ToastAndroid.BOTTOM);
      setIsLoading(false);
      return;
    }

    if (location === "0" || !location) {
      setShowLocationError(true);
      ToastAndroid.show("Please select a location!", ToastAndroid.BOTTOM);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      ToastAndroid.show("Passwords do not match!", ToastAndroid.BOTTOM);
      setIsLoading(false);
      return;
    }

    try {
      // ✅ Signup should return the created Appwrite user object
      const newUser = await signup(email, password, username, location);
  
      if (!newUser || !newUser.$id) {
        throw new Error("Appwrite signup failed: no user returned");
      }
  
      // ✅ Save to your backend DB with appwrite_id
      await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/api/user`, { // 👈 send Appwrite user ID
        name: username,
        email,
        location,
        appwrite_id: newUser.$id,
      });
  
      ToastAndroid.show(
        "Account created! Please verify your email.",
        ToastAndroid.BOTTOM
      );
      router.replace("/auth/login");
    } catch (error) {
      console.error("Signup error:", error);
      let errorMessage = "Signup failed. Please try again.";
  
      if (error.message?.includes("email")) {
        errorMessage = "Invalid email address. Please use a valid email.";
      } else if (error.message?.includes("already exists")) {
        errorMessage = "An account with this email already exists.";
      }
  
      ToastAndroid.show(errorMessage, ToastAndroid.BOTTOM);
    } finally {
      setIsLoading(false);
    }
  };

  const locations = [
    { key: "1", value: "San Agustin" },
    { key: "2", value: "Cabuco" },
    { key: "3", value: "Osorio" },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground
          source={require("../../assets/images/trece.jpg")}
          style={styles.container}
        >
          {containerHeight > 0 && (
            <Image
              source={require("../../assets/images/logo-modified.png")}
              style={{
                height: containerHeight * 0.3,
                width: containerHeight * 0.25,
                resizeMode: "contain",
                marginTop: -20,
              }}
            />
          )}

          <Text style={styles.title}>Sign up your Account</Text>

          <TextInput
            placeholder="Enter Username"
            placeholderTextColor={colors.BG_color}
            style={styles.textInput}
            onChangeText={(value) => setUsername(value)}
          />
          <TextInput
            placeholder="Enter Email"
            placeholderTextColor={colors.BG_color}
            style={styles.textInput}
            onChangeText={(value) => setEmail(value)}
          />
          <View style={styles.dropdownWrapper}>
            <SelectList
              setSelected={(value) => {
                setLocation(value);
                setShowLocationError(false);
              }}
              data={locations}
              defaultOption={{ key: "0", value: "Select Location" }}
              boxStyles={{ ...styles.textInput, position: "relative" }}
              inputStyles={{
                fontSize: 15,
                color: colors.BG_color,
                fontFamily: "PSemi-Bold",
              }}
              search={false}
              dropdownTextStyles={{
                fontSize: 15,
                color: "#000000",
                fontFamily: "PSemi-Bold",
              }}
              dropdownStyles={{
                borderWidth: 2,
                borderColor: colors.BG_color,
                borderRadius: 10,
                position: "absolute",
                top: 60,
                width: "100%",
                backgroundColor: "white",
              }}
              save="value"
            />
          </View>
          <TextInput
            placeholder="Enter Password"
            placeholderTextColor={colors.BG_color}
            secureTextEntry={true}
            style={styles.textInput}
            onChangeText={(value) => setPassword(value)}
          />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={colors.BG_color}
            style={styles.textInput}
            secureTextEntry={true}
            onChangeText={(value) => setConfirmPassword(value)}
          />
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.BG_color} />
            ) : (
              <Text style={{ fontFamily: "PSemi-Bold", color: "#000000" }}>
                Sign Up
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => router.push("/auth/login")}>
              <Text style={styles.signUpText}>Login Here</Text>
            </Pressable>
          </View>
        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 100,
    padding: 25,
    height: Dimensions.get("window").height,
  },
  textInput: {
    borderColor: colors.BG_color,
    borderWidth: 2,
    marginTop: 15,
    width: "100%",
    borderRadius: 10,
    fontFamily: "PSemi-Bold",
    fontSize: 15,
    color: colors.BG_color,
    textShadowColor: "black",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  title: {
    marginTop: -20,
    fontFamily: "PSemi-Bold",
    fontSize: 25,
    color: colors.BG_color,
    textShadowColor: "black",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  loginButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: colors.pale_green,
    width: "50%",
    alignItems: "center",
    borderRadius: 10,
  },
  footer: {
    flexDirection: "row",
    gap: 3,
    marginTop: 10,
  },
  footerText: {
    fontFamily: "PSemi-Bold",
    color: colors.BG_color,
    textShadowColor: "black",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  signUpText: {
    fontFamily: "PSemi-Bold",
    color: colors.pale_green,
    textShadowColor: "black",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  dropdownWrapper: {
    width: "100%",
    position: "relative",
    zIndex: 9999,
  },
  errorText: {
    color: "red",
    marginTop: 5,
    fontFamily: "PSemi-Bold",
    textShadowColor: "black",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
});
