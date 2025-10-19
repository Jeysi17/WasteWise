// Test Dialogflow connection
// Add this to your server.js temporarily for testing

app.get("/api/test-dialogflow", async (req, res) => {
  try {
    const testMessage = "hello";
    const testSessionId = "test-session-123";
    
    console.log("🧪 Testing Dialogflow connection...");
    console.log("Access token:", process.env.DIALOGFLOW_ACCESS_TOKEN ? "✅ Set" : "❌ Not set");
    
    const reply = await sendToDialogflow(testMessage, testSessionId);
    
    res.json({
      message: "Dialogflow test completed",
      testMessage,
      reply,
      usingDialogflow: !reply.includes("🗓️") && !reply.includes("♻️") // Check if it's a fallback response
    });
  } catch (error) {
    res.json({
      message: "Dialogflow test failed",
      error: error.message
    });
  }
});





















