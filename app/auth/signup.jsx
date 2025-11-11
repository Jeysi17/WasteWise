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
ToastAndroid,
ActivityIndicator,
Platform,
Alert,
} from "react-native";
import { 
request, 
check, 
PERMISSIONS, 
RESULTS, 
openSettings 
} from "react-native-permissions";
import colors from "../../constant/colors";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Geolocation from "react-native-geolocation-service";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const allowedBarangays = [
  "Aguado",
  "Cabezas",
  "Cabuco",
  "Conchu",
  "De Ocampo",
  "Gregorio",
  "Hugo Perez",
  "Inocencio",
  "Lallana",
  "Lapidario",
  "Luciano",
  "Osorio",
  "San Agustin",
  "Buenavista I",
];

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [detectedBarangay, setDetectedBarangay] = useState(null);
  const [coords, setCoords] = useState(null);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
  
const handleDetectBarangay = async () => {
  try {
    console.log("Starting location detection...");
    setGettingLocation(true);

    if (Platform.OS === "android") {
      const checkResult = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      if (checkResult === RESULTS.DENIED) {
        const requestResult = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        if (requestResult !== RESULTS.GRANTED) {
          ToastAndroid.show("Location permission denied!", ToastAndroid.BOTTOM);
          setGettingLocation(false);
          return;
        }
      } else if (checkResult === RESULTS.BLOCKED) {
        Alert.alert(
          "Permission Required",
          "Location access is blocked. Please enable it in settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => openSettings() },
          ]
        );
        setGettingLocation(false);
        return;
      } else if (checkResult === RESULTS.GRANTED) {
      } else if (checkResult === RESULTS.UNAVAILABLE) {
        ToastAndroid.show("Location not available on this device", ToastAndroid.BOTTOM);
        setGettingLocation(false);
        return;
      }
    }
    Geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'User-Agent': 'WasteWise App'
              }
            }
          );
          const data = await res.json();
          console.log("Geocoding data received:", JSON.stringify(data, null, 2));

          const barangayName =
            data.address?.village ||
            data.address?.quarter ||
            data.address?.suburb ||
            data.address?.neighbourhood ||
            data.address?.city_district ||
            data.address?.hamlet ||
            "Unknown";

          console.log("Extracted barangay name:", barangayName);
          setDetectedBarangay(barangayName);

          const matchedBarangay = allowedBarangays.find(
            (b) =>
              b.toLowerCase().replace(/\s+/g, '').includes(barangayName.toLowerCase().replace(/\s+/g, '')) ||
              barangayName.toLowerCase().replace(/\s+/g, '').includes(b.toLowerCase().replace(/\s+/g, ''))
          );

          console.log("Matched barangay:", matchedBarangay);

          if (matchedBarangay) {
            setLocation(matchedBarangay); 
            ToastAndroid.show(`Barangay detected: ${matchedBarangay}`, ToastAndroid.BOTTOM);
          } else {
        
            ToastAndroid.show(
              `Detected: ${barangayName} - Not in allowed barangays list`,
              ToastAndroid.LONG
            );
            setLocation(""); 
          }

          setGettingLocation(false);
        } catch (geocodingError) {
          console.error("Geocoding error:", geocodingError);
          ToastAndroid.show("Failed to detect barangay: " + geocodingError.message, ToastAndroid.BOTTOM);
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        ToastAndroid.show("Failed to get location: " + error.message, ToastAndroid.BOTTOM);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  } catch (err) {
    console.error("Location error:", err);
    ToastAndroid.show("Failed to get location: " + err.message, ToastAndroid.BOTTOM);
    setGettingLocation(false);
  }
};

  const handleSignup = async () => {
    setIsLoading(true);

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

    if (!location) {
      ToastAndroid.show("Please detect your location!", ToastAndroid.BOTTOM);
      setIsLoading(false);
      return;
    }

    const isAllowed = allowedBarangays.some(
      (b) => b.toLowerCase() === location.toLowerCase()
    );

    if (!isAllowed) {
      ToastAndroid.show("Please enter a valid barangay from the allowed list!", ToastAndroid.BOTTOM);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      ToastAndroid.show("Passwords do not match!", ToastAndroid.BOTTOM);
      setIsLoading(false);
      return;
    }

    try {
      const newUser = await signup(email, password, username, location);

      if (!newUser || !newUser.$id) {
        throw new Error("Appwrite signup failed: no user returned");
      }

      await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/api/users`, {
        name: username,
        email,
        location,
        appwrite_id: newUser.$id,
      });

      ToastAndroid.show("Account created! Please verify your email.", ToastAndroid.BOTTOM);
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={20}
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

          <Text style={styles.title}>Sign up your Account</Text>
          
          <TextInput
            placeholder="Enter Username"
            placeholderTextColor={colors.BG_color}
            style={styles.textInput}
            onChangeText={setUsername}
            value={username}
          />
          
          <TextInput
            placeholder="Enter Email"
            placeholderTextColor={colors.BG_color}
            style={styles.textInput}
            onChangeText={setEmail}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Click 'Detect My Barangay' button"
            placeholderTextColor={colors.BG_color}
            style={styles.textInput}
            value={location}
            editable={false}
          />

          <TouchableOpacity
            style={[styles.detectButton, gettingLocation && { opacity: 0.6 }]}
            onPress={handleDetectBarangay}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>
                Detect My Barangay
              </Text>
            )}
          </TouchableOpacity>

          {detectedBarangay && (
            <Text style={styles.detectedText}>
              Detected Barangay:{" "}
              <Text style={styles.detectedBarangayText}>{detectedBarangay}</Text>
            </Text>
          )}

          <TextInput
            placeholder="Enter Password"
            placeholderTextColor={colors.BG_color}
            secureTextEntry={true}
            style={styles.textInput}
            onChangeText={setPassword}
            value={password}
          />
          
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={colors.BG_color}
            secureTextEntry={true}
            style={styles.textInput}
            onChangeText={setConfirmPassword}
            value={confirmPassword}
          />

          <TouchableOpacity
            style={[styles.loginButton, isLoading && { opacity: 0.7 }]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.BG_color} />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => router.push("/auth/login")}>
              <Text style={styles.signUpText}>Login Here</Text>
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
    paddingTop: SCREEN_HEIGHT * 0.08,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    minHeight: SCREEN_HEIGHT,
  },
  logo: {
    height: SCREEN_HEIGHT * 0.2,
    width: SCREEN_WIDTH * 0.4,
    resizeMode: "contain",
    marginBottom: SCREEN_HEIGHT * 0.01,
  },
  title: {
    marginBottom: SCREEN_HEIGHT * 0.02,
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
    marginTop: SCREEN_HEIGHT * 0.015,
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
  detectButton: {
    marginTop: SCREEN_HEIGHT * 0.015,
    paddingVertical: SCREEN_HEIGHT * 0.015,
    backgroundColor: colors.pale_green,
    borderRadius: 10,
    width: "65%",
    alignItems: "center",
  },
  loginButton: {
    marginTop: SCREEN_HEIGHT * 0.02,
    paddingVertical: SCREEN_HEIGHT * 0.018,
    backgroundColor: colors.pale_green,
    width: "55%",
    alignItems: "center",
    borderRadius: 10,
  },
  buttonText: {
    fontFamily: "PSemi-Bold",
    fontSize: SCREEN_WIDTH * 0.04,
    color: "#000000",
  },
  detectedText: {
    marginTop: SCREEN_HEIGHT * 0.012,
    color: colors.BG_color,
    fontFamily: "PSemi-Bold",
    fontSize: SCREEN_WIDTH * 0.035,
  },
  detectedBarangayText: {
    fontWeight: "bold",
    fontFamily: "PSemi-Bold",
  },
  footer: {
    flexDirection: "row",
    gap: SCREEN_WIDTH * 0.01,
    marginTop: SCREEN_HEIGHT * 0.02,
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