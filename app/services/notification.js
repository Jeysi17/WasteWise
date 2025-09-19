import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

export async function registerPushToken(userId, barangay) {
  try {
    // 🔹 Check permissions
    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;

    if (status !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      finalStatus = newStatus;
    }

    if (finalStatus !== "granted") {
      console.log("❌ Push notification permission not granted");
      return;
    }

    // 🔹 Get Expo push token
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId:
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId,
    });

    const token = tokenResponse.data;

    if (!token || !token.startsWith("ExponentPushToken[")) {
      console.error("❌ Invalid Expo push token:", token);
      return;
    }

    console.log("✅ Got Expo Push Token:", token);

    // 🔹 API URL from app config
    const apiUrl = Constants.expoConfig?.extra?.apiUrl;
    if (!apiUrl) {
      console.error("❌ API URL is missing in app config");
      return;
    }

    console.log("🌍 Sending token to backend:", apiUrl);

    // 🔹 Send token to backend
    const response = await fetch(`${apiUrl}/api/register-device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        barangay,
        expo_push_token: token,
      }),
    });

    const resData = await response.json();
    console.log("📥 Backend response:", resData);

  } catch (err) {
    console.error("❌ Error in registerPushToken:", err);
  }
}
