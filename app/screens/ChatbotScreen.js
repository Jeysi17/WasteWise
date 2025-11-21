import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import axios from "axios";
import uuid from "react-native-uuid";
import { Keyboard, Platform } from "react-native";
import colors from "../../constant/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Hi! I'm here to give you knowledge regarding waste management.",
      sender: "bot",
      buttons: [
        "What is Waste Management?",
        "What are the benefits of Waste Management?",
        "Is Waste Management important?",
        "Steps on how to recycle....",
        "What are the proper ways of segregating...",
      ],
    },
  ]);

  const [input, setInput] = useState("");
  const [sessionId] = useState(uuid.v4());
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
  const showSub = Keyboard.addListener(
    Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
    (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    }
  );

  const hideSub = Keyboard.addListener(
    Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
    () => {
      setKeyboardHeight(0);
    }
  );

  return () => {
    showSub.remove();
    hideSub.remove();
  };
}, []);
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Log the request details for debugging
      console.log("📤 Sending request:", {
        url: `${process.env.EXPO_PUBLIC_HOST_URL}/api/chat`,
        message: text,
        sessionId,
      });

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST_URL}/api/chat`,
        {
          message: text,
          sessionId,
        },
        {
          timeout: 10000, // 10 second timeout
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📥 Response received:", response.data);

      const botReply =
        response.data.reply || "⚠️ Sorry, I didn't understand that.";

      // Extract buttons from backend payload
      let buttons = [];
      
      if (response.data.payload?.buttons && Array.isArray(response.data.payload.buttons)) {
        buttons = response.data.payload.buttons;
        console.log('✅ Buttons received from backend:', buttons);
      } else {
        console.log('⚠️ No buttons in payload:', response.data.payload);
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botReply,
        sender: "bot",
        buttons,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("❌ Chat error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });

      let errorMessage = "❌ Unable to connect to the server";

      if (error.response) {
        // Server responded with an error
        const status = error.response.status;
        const details = error.response.data?.details || error.response.data?.error;

        if (status === 403) {
          errorMessage = "❌ Authentication error: Unable to access chatbot service";
          
          Alert.alert(
            "Authentication Error",
            "The chatbot service couldn't authenticate with Dialogflow.\n\nThis usually means:\n• Dialogflow credentials are missing or invalid\n• Service account key file is not properly configured\n• API permissions are not set correctly\n\nPlease contact the administrator.",
            [{ text: "OK" }]
          );
        } else if (status === 500) {
          errorMessage = `❌ Server error: ${details || "Something went wrong on the server"}`;
          
          Alert.alert(
            "Server Error",
            `The chatbot service encountered an error. Please try again.\n\nDetails: ${details || "Internal server error"}`,
            [{ text: "OK" }]
          );
        } else if (status === 400) {
          errorMessage = "❌ Invalid request. Please try again.";
        } else if (status === 404) {
          errorMessage = "❌ Chat service not found. Please check your connection.";
        } else {
          errorMessage = `❌ Error ${status}: ${details || "Please try again"}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "❌ No response from server. Check your internet connection.";
        
        Alert.alert(
          "Connection Error",
          "Unable to reach the server. Please check:\n• Your internet connection\n• Server URL in environment variables\n• Server is running",
          [{ text: "OK" }]
        );
      } else if (error.code === "ECONNABORTED") {
        // Timeout
        errorMessage = "❌ Request timed out. Please try again.";
      }

      const errorBotMessage = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        sender: "bot",
        buttons: ["Try again"],
      };

      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonPress = (text) => {
    sendMessage(text);
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>WasteWise Chatbot</Text>
      <View style={[styles.chatContainer, { marginBottom: keyboardHeight > 0 ? 10 : SCREEN_HEIGHT * 0.15 }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.flatListContent}
          renderItem={({ item }) => (
            <View
              style={[
                styles.message,
                item.sender === "user"
                  ? styles.userMessage
                  : styles.botMessage,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>

              {/* Show buttons if present */}
              {item.sender === "bot" && item.buttons?.length > 0 && (
                <View style={styles.buttonContainer}>
                  {item.buttons.map((btnText, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.optionButton}
                      onPress={() => handleButtonPress(btnText)}
                      disabled={isLoading}
                    >
                      <Text style={styles.optionText}>{btnText}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#32CD32" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}

        {/* Input box at the bottom */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={input}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (isLoading || !input.trim()) && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
          >
            <Text style={styles.sendButtonText}>
              {isLoading ? "..." : "Send"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lime_green,
    paddingTop: SCREEN_HEIGHT * 0.01,
  },
  chatContainer: {
    flex: 1,
    marginTop: SCREEN_WIDTH * 0.06,
    backgroundColor: '#d0f3d7ff',
    width: SCREEN_WIDTH * 0.9,
    alignSelf: "center",
    borderRadius: 10,
    maxHeight: SCREEN_HEIGHT * 0.65,
    marginBottom: SCREEN_HEIGHT * 0.15,
    borderWidth: 3,
    borderColor: colors.border_green,
  },
  flatListContent: {
    paddingBottom: SCREEN_HEIGHT * 0.012,
    padding: SCREEN_WIDTH * 0.04,
  },
  message: {
    marginVertical: SCREEN_HEIGHT * 0.01,
    padding: SCREEN_WIDTH * 0.025,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#51e651ff",
    shadowColor: colors.border_green,
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
    borderRadius: 10,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderColor: colors.border_green,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#ECECEC",
    shadowColor: colors.border_green,
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: colors.border_green,
  },
  messageText: {
    color: "#000",
    fontSize: SCREEN_WIDTH * 0.038,
  },
  buttonContainer: {
    marginTop: SCREEN_HEIGHT * 0.01,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  optionButton: {
    borderColor: "#0f690fff",
    backgroundColor: colors.pale_green,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: SCREEN_HEIGHT * 0.007,
    paddingHorizontal: SCREEN_WIDTH * 0.035,
    alignSelf: "flex-start",
    marginTop: SCREEN_HEIGHT * 0.007,
  },
  optionText: {
    color: "#0f690fff",
    fontWeight: "500",
    fontSize: SCREEN_WIDTH * 0.033,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SCREEN_HEIGHT * 0.01,
  },
  loadingText: {
    marginLeft: SCREEN_WIDTH * 0.02,
    color: "#666",
    fontStyle: "italic",
    fontSize: SCREEN_WIDTH * 0.035,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SCREEN_HEIGHT * 0.01,
    backgroundColor: colors.BG_color,
    padding: SCREEN_WIDTH * 0.02,
    paddingVertical: SCREEN_HEIGHT * 0.017,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderTopWidth: 2,
    borderColor: colors.border_green,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    padding: SCREEN_WIDTH * 0.02,
    backgroundColor: "#fff",
    fontSize: SCREEN_WIDTH * 0.038,
  },
  sendButton: {
    backgroundColor: "#32CD32",
    marginLeft: SCREEN_WIDTH * 0.02,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    justifyContent: "center",
    borderRadius: 10,
    height: SCREEN_HEIGHT * 0.05,
  },
  sendButtonDisabled: {
    backgroundColor: "#A0D6A0",
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: SCREEN_WIDTH * 0.038,
  },
  title: { 
      fontSize: SCREEN_WIDTH * 0.06, 
      textAlign: 'center', 
      marginTop: SCREEN_HEIGHT * 0.025,  
      fontFamily: 'PSemi-Bold',
      color: colors.border_green,
      width: SCREEN_WIDTH * 0.8,
      alignSelf: 'center',
      backgroundColor: colors.pale_green,
      borderRadius: 40,
      borderWidth: 2,
      borderColor: colors.border_green,
      paddingTop: SCREEN_HEIGHT * 0.0069,
    },
});

export default ChatbotScreen;