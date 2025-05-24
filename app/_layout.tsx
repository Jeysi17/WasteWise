import { Stack, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { View, Text, ActivityIndicator } from "react-native";
import colors from "../constant/colors";
import { useEffect } from "react";

function RootLayoutNav() {
  const { isLoading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        router.replace('/home');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [isLoading, session]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg_green }}>
        <ActivityIndicator size="large" color={colors.BG_color} />
        <Text style={{ marginTop: 10, fontFamily: 'PSemi-Bold', color: colors.BG_color }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{
      headerShown: false
    }}>
    </Stack>
  );
}

export default function RootLayout() {
  useFonts({
    'PExtra-Bold':require('./../assets/fonts/Poppins-ExtraBoldItalic.ttf'),
    'PSemi-Bold':require('./../assets/fonts/Poppins-SemiBold.ttf'),
    'PSemi-Bold-Italic':require('./../assets/fonts/Poppins-SemiBoldItalic.ttf')
  });

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}