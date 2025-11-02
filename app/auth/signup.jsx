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

// ✅ Allowed barangay list
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
];

export default function SignUp() {
  const [containerHeight, setContainerHeight] = useState(Dimensions.get("window").height);
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
  
  // ✅ Single unified function to handle location detection
const handleDetectBarangay = async () => {
  try {
    console.log("🔵 Starting location detection...");
    setGettingLocation(true);

    if (Platform.OS === "android") {
      console.log("🔵 Checking permission status...");
      
      // Check current permission status
      const checkResult = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      console.log("🔵 Permission check result:", checkResult);

      if (checkResult === RESULTS.DENIED) {
        console.log("🔵 Permission DENIED, requesting...");
        const requestResult = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        console.log("🔵 Permission request result:", requestResult);
        
        if (requestResult !== RESULTS.GRANTED) {
          ToastAndroid.show("Location permission denied!", ToastAndroid.BOTTOM);
          setGettingLocation(false);
          return;
        }
      } else if (checkResult === RESULTS.BLOCKED) {
        console.log("🔵 Permission BLOCKED");
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
        console.log("🔵 Permission already GRANTED");
      } else if (checkResult === RESULTS.UNAVAILABLE) {
        console.log("🔵 Permission UNAVAILABLE");
        ToastAndroid.show("Location not available on this device", ToastAndroid.BOTTOM);
        setGettingLocation(false);
        return;
      }
    }

    console.log("🔵 Getting current position...");
    Geolocation.getCurrentPosition(
      async (position) => {
        try {
          console.log("✅ Position obtained:", position);
          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });

          console.log(`🔵 Fetching address for: ${latitude}, ${longitude}`);
          
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'User-Agent': 'WasteWise App'
              }
            }
          );
          
          console.log("🔵 Response status:", res.status);
          
          const data = await res.json();
          console.log("🔵 Geocoding data received:", JSON.stringify(data, null, 2));

          // Try multiple possible fields for barangay
          const barangayName =
            data.address?.suburb ||
            data.address?.neighbourhood ||
            data.address?.village ||
            data.address?.city_district ||
            data.address?.hamlet ||
            data.address?.town ||
            data.address?.municipality ||
            "Unknown";

          console.log("🔵 Extracted barangay name:", barangayName);
          setDetectedBarangay(barangayName);

          // Check if it's in the allowed list (case-insensitive)
          const matchedBarangay = allowedBarangays.find(
            (b) =>
              b.toLowerCase().replace(/\s+/g, '').includes(barangayName.toLowerCase().replace(/\s+/g, '')) ||
              barangayName.toLowerCase().replace(/\s+/g, '').includes(b.toLowerCase().replace(/\s+/g, ''))
          );

          console.log("🔵 Matched barangay:", matchedBarangay);

          if (matchedBarangay) {
            setLocation(matchedBarangay); // Use the official name from the list
            ToastAndroid.show(`Barangay detected: ${matchedBarangay}`, ToastAndroid.BOTTOM);
          } else {
            // Show what was detected even if not in allowed list
            ToastAndroid.show(
              `Detected: ${barangayName} - Not in allowed barangays list`,
              ToastAndroid.LONG
            );
            setLocation(""); // Clear the field if not allowed
          }

          setGettingLocation(false);
        } catch (geocodingError) {
          console.error("❌ Geocoding error:", geocodingError);
          ToastAndroid.show("Failed to detect barangay: " + geocodingError.message, ToastAndroid.BOTTOM);
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error("❌ Geolocation error:", error);
        ToastAndroid.show("Failed to get location: " + error.message, ToastAndroid.BOTTOM);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  } catch (err) {
    console.error("❌ Location error:", err);
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

    // ✅ Validate that the entered barangay is in the allowed list
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

      await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/api/user`, {
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
            onChangeText={setUsername}
            value={username}
          />
          <TextInput
            placeholder="Enter Email"
            placeholderTextColor={colors.BG_color}
            style={styles.textInput}
            onChangeText={setEmail}
            value={email}
          />

          {/* ✅ Replaced DropDownPicker with TextInput */}
          <TextInput
            placeholder="Enter Barangay or Detect Automatically"
            placeholderTextColor={colors.BG_color}
            style={styles.textInput}
            onChangeText={setLocation}
            value={location}
            editable={!gettingLocation} // Disable while detecting
          />

          {/* Detect Location Button */}
          <TouchableOpacity
            style={[styles.detectButton, gettingLocation && { opacity: 0.6 }]}
            onPress={handleDetectBarangay}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={{ fontFamily: "PSemi-Bold", color: "#000" }}>
                Detect My Barangay
              </Text>
            )}
          </TouchableOpacity>

          {detectedBarangay && (
            <Text style={{ marginTop: 8, color: colors.BG_color }}>
              📍 Detected Barangay:{" "}
              <Text style={{ fontWeight: "bold" }}>{detectedBarangay}</Text>
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
              <Text style={{ fontFamily: "PSemi-Bold", color: "#000000" }}>Sign Up</Text>
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
    padding: 10,
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
  detectButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.pale_green,
    borderRadius: 10,
    width: "60%",
    alignItems: "center",
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
});