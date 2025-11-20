// Utility: send push notification through Expo
async function sendExpoNotification(pushTokens, title, body, data = {}) {
  if (!pushTokens || pushTokens.length === 0) {
    console.log("ℹ️ No push tokens available, skipping notification.");
    return;
  }

  const messages = pushTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log("🔔 Expo push result:", result);
    return result;
  } catch (err) {
    console.error("❌ Expo push error:", err.message);
    throw err;
  }
}

module.exports = { sendExpoNotification };