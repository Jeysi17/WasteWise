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
    console.log("📍 User barangay fetched:", barangay);

    // 🔹 Send token to backend
    const response = await fetch(`${apiUrl}/api/notifications/register-device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        barangay,
        expo_push_token: token,
      }),
    });

    // ✅ Check response status first
    if (!response.ok) {
      console.error(`❌ HTTP error! status: ${response.status}`);
      const errorText = await response.text();
      console.error("❌ Error response:", errorText.substring(0, 200));
      return;
    }

    // ✅ Get raw text first
    const text = await response.text();
    
    // ✅ Check if it's HTML instead of JSON
    if (text.trim().startsWith('<')) {
      console.error("❌ Received HTML instead of JSON:", text.substring(0, 200));
      return;
    }

    // ✅ Try to parse JSON
    let resData;
    try {
      resData = JSON.parse(text);
      console.log("📥 Backend response:", resData);
    } catch (parseError) {
      console.error("❌ Failed to parse response as JSON:", parseError);
      console.error("❌ Response text:", text.substring(0, 200));
      return;
    }

  } catch (err) {
    console.error("❌ Error in registerPushToken:", err);
    // Log more details about the error
    if (err instanceof Error) {
      console.error("❌ Error message:", err.message);
      console.error("❌ Error stack:", err.stack);
    }
  }
}

// Default export for Expo Router compatibility
export default function NotificationService() {
  return null; // This is a service file, not a component
}