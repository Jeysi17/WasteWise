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
  PermissionsAndroid
} from "react-native";
import { 
  request, 
  check, 
  PERMISSIONS, 
  RESULTS, 
  openSettings 
} from "react-native-permissions";
import DropDownPicker from "react-native-dropdown-picker";
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
  const [location, setLocation] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [detectedBarangay, setDetectedBarangay] = useState(null);
  const [coords, setCoords] = useState(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(
    allowedBarangays.map((b) => ({ label: b, value: b }))
  );

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
 
  // ✅ Function to get live location and reverse geocode using OpenStreetMap
  const getLiveLocation = async () => {
    try {
      setGettingLocation(true);
  
      let permissionResult;
  
      if (Platform.OS === "android") {
        permissionResult = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
  
        if (permissionResult === RESULTS.DENIED) {
          // ✅ Show native popup asking the user
          permissionResult = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        }
  
        if (permissionResult === RESULTS.BLOCKED) {
          Alert.alert(
            "Permission Required",
            "Location access is required to detect your barangay. Please enable it in settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => openSettings() },
            ]
          );
          setGettingLocation(false);
          return;
        }
  
        if (permissionResult !== RESULTS.GRANTED) {
          ToastAndroid.show("Location permission denied!", ToastAndroid.BOTTOM);
          setGettingLocation(false);
          return;
        }
      }
  
      // ✅ Get location after permission granted
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });
  
          // Reverse geocode using OpenStreetMap
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
  
          const barangayName =
            data.address?.suburb ||
            data.address?.neighbourhood ||
            data.address?.village ||
            data.address?.city_district ||
            "Unknown";
  
          setDetectedBarangay(barangayName);
  
          const isAllowed = allowedBarangays.some(
            (b) =>
              b.toLowerCase().replace("brgy.", "barangay").trim() ===
              barangayName.toLowerCase().replace("brgy.", "barangay").trim()
          );
  
          if (isAllowed) {
            setLocation(barangayName);
            ToastAndroid.show(`Barangay detected: ${barangayName}`, ToastAndroid.BOTTOM);
          } else {
            ToastAndroid.show(
              `You are outside the allowed barangays (${barangayName})`,
              ToastAndroid.BOTTOM
            );
            setLocation(null);
          }
  
          setGettingLocation(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          ToastAndroid.show("Failed to get location.", ToastAndroid.BOTTOM);
          setGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      console.error("Location error:", err);
      ToastAndroid.show("Failed to get location.", ToastAndroid.BOTTOM);
      setGettingLocation(false);
    }
  };

  const handleDetectBarangay = async () => {
    try {
      // Ask for fine location permission
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "WasteWise needs access to your location to detect your barangay.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
  
      console.log("Permission result:", granted);
  
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Location permission granted");
        getLiveLocation(); // call your existing function
      } else {
        console.log("Location permission denied");
        Alert.alert(
          "Permission Denied",
          "You need to allow location access to detect your barangay."
        );
      }
    } catch (err) {
      console.warn(err);
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
      ToastAndroid.show("Please detect or select your location!", ToastAndroid.BOTTOM);
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
          />
          <TextInput
            placeholder="Enter Email"
            placeholderTextColor={colors.BG_color}
            style={styles.textInput}
            onChangeText={setEmail}
          />

          <DropDownPicker
            open={open}
            value={location}
            items={items}
            setOpen={setOpen}
            setValue={(callback) => {
              const val = callback(location);
              setLocation(val);
            }}
            setItems={setItems}
            placeholder="Select Location or Detect Automatically"
            style={{
              borderColor: colors.BG_color,
              borderWidth: 2,
              borderRadius: 10,
              marginTop: 15,
            }}
            textStyle={{
              fontFamily: "PSemi-Bold",
            }}
            labelStyle={{
              fontFamily: "PSemi-Bold",
            }}
            dropDownContainerStyle={{
              borderColor: colors.BG_color,
              borderWidth: 2,
              borderRadius: 10,
              maxHeight: 200,
            }}
            listMode="SCROLLVIEW"
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
          />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={colors.BG_color}
            secureTextEntry={true}
            style={styles.textInput}
            onChangeText={setConfirmPassword}
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
