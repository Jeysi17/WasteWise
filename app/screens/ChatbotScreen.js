// ChatbotScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import axios from "axios";
import uuid from "react-native-uuid";
import colors from "../../constant/colors";
// Example colors (replace with your colors.js import if available)


const ChatbotScreen = () => {
  const [messages, setMessages] = useState([
    { id: "1", text: "Hi! How can I help you today? (kindly type 'Hi' or 'Hello' to start the conversation.)", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(uuid.v4()); // unique session per user

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST_URL}/api/chat`,
        {
          message: input,
          sessionId,
        }
      );

      const botMessage = {
        id: Date.now().toString(),
        text: response.data.reply || "⚠️ Sorry, I didn’t understand that.",
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error.message);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: "❌ Server error", sender: "bot" },
      ]);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Chat container */}
      <View style={styles.chatContainer}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
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
            </View>
          )}
        />

        {/* Input box */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
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
    paddingTop: 40, // adjust for header spacing
  },
  headerTitle: {
    fontFamily: "PSemi-Bold",
    fontSize: 30,
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
    color: "#000",
  },
  chatContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.BG_color,
    width: "90%",
    alignSelf: "center",
    borderRadius: 10,
    maxHeight: "79%",
  },
  message: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 8,
    maxWidth: "70%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#ECECEC",
  },
  messageText: { color: "#000" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    padding: 8,
    backgroundColor: "#fff",
  },
  sendButton: {
    backgroundColor: "#32CD32",
    marginLeft: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 10,
    height: '40%'
  },
  sendButtonText: { color: "#fff", fontWeight: "bold" },
});

export default ChatbotScreen;
