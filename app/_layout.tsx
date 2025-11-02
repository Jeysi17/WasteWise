import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import { AuthProvider, useAuth } from "../context/AuthContext";
import colors from "../constant/colors";
import Header from "../components/Home/header";
import SideNav from "../components/Home/sideNav";
import { app } from "../config/FirebaseConfig";
// ✅ import helper
import { registerPushToken } from "./services/notification";

// ✅ Initialize Firebase early
console.log("🔥 Firebase app initialized:", app?.name || "Unknown");

function RootLayoutNav() {
  const { isLoading, session, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  // ✅ Redirect user based on auth state
  useEffect(() => {
    if (!isLoading) {
      if (session) {
        router.replace("/home");
      } else {
        router.replace("/auth/login");
      }
    }
  }, [isLoading, session]);

  // ✅ Fetch barangay & register push token after Firebase is ready
  useEffect(() => {
    async function fetchBarangayAndRegister() {
      if (session && user?.$id) {
        try {
          const url = `${process.env.EXPO_PUBLIC_HOST_URL}/api/users/${user.$id}`;
          console.log("🌍 Fetching barangay from:", url);

          const response = await fetch(url);
          const text = await response.text();
          console.log("📡 Raw barangay response:", text);

          let data;
          try {
            data = JSON.parse(text);
          } catch {
            console.error("❌ Response is not valid JSON");
            return;
          }

          const barangay = data?.location || "DefaultBarangay";
          console.log("🏘 Barangay from backend:", barangay);

          // ✅ Now register push token
          await registerPushToken(user.$id, barangay);
        } catch (err) {
          console.error("❌ Failed to fetch barangay:", err);
        }
      }
    }

    fetchBarangayAndRegister();
  }, [session, user]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.bg_green,
        }}
      >
        <ActivityIndicator size="large" color={colors.BG_color} />
        <Text
          style={{
            marginTop: 10,
            fontFamily: "PSemi-Bold",
            color: colors.BG_color,
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  const inAuthFlow = (segments[0] as string) === "auth";
  const inVerifyFlow = (segments[0] as string) === "verify";

  return (
    <View style={{ flex: 1 }}>
      {!inAuthFlow && !inVerifyFlow && (
        <>
          <Header onMenuPress={() => setIsSideNavOpen(true)} />
          <SideNav visible={isSideNavOpen} onClose={() => setIsSideNavOpen(false)} />
        </>
      )}
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

export default function RootLayout() {
  useFonts({
    "PExtra-Bold": require("./../assets/fonts/Poppins-ExtraBoldItalic.ttf"),
    "PSemi-Bold": require("./../assets/fonts/Poppins-SemiBold.ttf"),
    "PSemi-Bold-Italic": require("./../assets/fonts/Poppins-SemiBoldItalic.ttf"),
  });

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
