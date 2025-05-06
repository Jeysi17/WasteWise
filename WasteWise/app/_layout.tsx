import { Stack } from "expo-router";
import { useFonts } from "expo-font";

export default function RootLayout() {

  useFonts({
    'PExtra-Bold':require('./../assets/fonts/Poppins-ExtraBoldItalic.ttf'),
    'PSemi-Bold':require('./../assets/fonts/Poppins-SemiBold.ttf'),
    'PSemi-Bold-Italic':require('./../assets/fonts/Poppins-SemiBoldItalic.ttf')
  })
  return (
    <Stack screenOptions={{
      headerShown: false
    }}>

    </Stack>
  )
}