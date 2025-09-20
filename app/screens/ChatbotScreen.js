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

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([
    { id: "1", text: "👋 Hi! How can I help you today?", sender: "bot" },
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
      const response = await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/api/chat`, {
        message: input,
        sessionId,
      });

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
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.sender === "user" ? styles.userMessage : styles.botMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
      />

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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  message: {
    margin: 8,
    padding: 10,
    borderRadius: 8,
    maxWidth: "75%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#0078FF",
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E5EA",
  },
  messageText: { color: "#000" },
  inputContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#ddd",
    padding: 8,
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  sendButton: {
    backgroundColor: "#0078FF",
    marginLeft: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
  },
  sendButtonText: { color: "#fff", fontWeight: "bold" },
});

export default ChatbotScreen;
