import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { View, Text, ActivityIndicator } from "react-native";
import colors from "../constant/colors";
import { useEffect, useState } from "react";

import Header from "../components/Home/header";
import SideNav from "../components/Home/sideNav";

function RootLayoutNav() {
  const { isLoading, session } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        router.replace("/home");
      } else {
        router.replace("/auth/login");
      }
    }
  }, [isLoading, session]);

  if (isLoading) {
    // ✅ While loading, render ONLY loading screen
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

  // ✅ Hide header + sidenav on auth screens and verify screen
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
