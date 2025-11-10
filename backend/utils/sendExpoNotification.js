import fetch from "node-fetch";

export const sendExpoNotification = async (pushTokens, title, body, data = {}) => {
  if (!pushTokens?.length) return;

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
    console.log("Expo push result:", result);
  } catch (err) {
    console.error("Expo push error:", err.message);
  }
};
