import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  View,
  FlatList,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import colors from '../../constant/colors';
import Header from '../../components/Home/header';
import { Dialogflow_V2 } from 'react-native-dialogflow';

const { width, height } = Dimensions.get('window');

const ChatbotScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogflowReady, setIsDialogflowReady] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    initializeDialogflow();
  }, []);

  const initializeDialogflow = async () => {
    try {
      const dialogflowConfig = {
        type: "service_account",
        project_id: "wastewise-gach",
        private_key_id: "07b9d3f1338d9bbc02f79d500d0ac78206786314",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCk0PSeV+LcOKsf\nRkPmL64+kcKEQCD6iJPwMWopI1Liors5NPNSR92gSpdpMufGQmlh9Dmk0vS/90UA\nbwohXepH6VtYZxRpKIRuthOtg6+NA5sI02BHRBbtT6YloEDodci8iR2fhme7bs+l\nclOLOkwSoXZK0anDH005N9cQFnwQPt2LaHNzxLMPA0cqlp1K5Fi2Hqb2SRaULd3/\nHYIHU6POIoFmxGAc/DGxDVtWoyXzZwcbyNMPnF6YbcsK5iiKlgFYVajNnGsNtXyh\nN5S8AXfqCTUOOkzsaMdTR7MXeBsQq5ar6+Jpuhoq7sXnsK5pLSKXynOSZDnTKanC\nTV1qSDlnAgMBAAECggEARhJMnfFxkv1Iy6AdCAVniFSCJaX6H2nns6venaTV/WMA\nRF8dv/Kr6BUucFxjK+haU3n48/l4cxEWtgt/fBYon/A3lMsmY1sFiuhAT3n4LfTF\neigb+9CYCsbdNYv/bJV/BaEqBgOnoImJIKcNm9jqNNWOrFqdWUa6l0QFXGKi1mil\nCL/Cclhwug89tiRXqjbpHy4ZTPaE2yKtDCsvYm2YAIPgUgVKINBwEG4IUZZkDbql\njv8wXbk8I6g4FmFxvI8bb70wMkn8E0Z6aA1DNo4QgsqgsyZj9qtB+MVwrq7D6MfE\n1MXJQdNXwMK8hIfMzcZR8t7np/zRaJ1EiwLi3OXo0QKBgQDWSmNqkdoKjNxdBwFs\nqCmVUIPoKvuek+FMXA33A/oMOQsur57Bs02W0QiaY1ywbIFWBRI708c1GnrfPuez\nlp94G+xEG71AhiUUb0UHhU9aFX8pm//RHwMy6+2FuVFc8kU34HdI3gah6krvFgOu\nYrmh2oJdoqP2SLqWedtAfZSCaQKBgQDE5V+GDmexyu3QgGERvbosEqLyEh1fSgRn\n+L5+BBEbA1Y3Fq92UPYt3Ocr2EQHEeldPniiTkttyTZQ5zjFU/MU3VSaFwl9tFTK\nTDWTA0mTtg/er2sfciaN+y4sMMvS5YVmrp5SRS3YmE471iprewZmcS4nIL7KRqrl\nTftoWW7DTwKBgQC9TL2CGRIKm+DW9SdW+z6wvo2n/MCGl5BBSlizy3mKbqHoPg/6\ngRCbmFEHQZtR5qhietxeqXii+p9ssz8vsHFzQwd2KyMF6vq6kIjkWel9ZNwOv9Y+\nwCytQSl0Jf8wInzvHYWCg1BMnJJRnprl5CSkTEk5ukEpgZoC7+a1k7orcQKBgBwK\nIjlgEcpTAN0Be1FgeIPQP55DkCVC0C/ST6Z4g8saBYwg0eoCi5xqag1nZgCvv1EF\nFX7fsYQ39GE/HGmVk/dzsZmkEDjzlmOcyMBf5nl/ovDugE3hHrZ3f9LRPCWThBTk\nZy2GJopC3llNHYti4L1z/sOZuTHrMGkpWtU4bzqnAoGBAMmGnRbnnAjpbwQmjdcd\n24C9Z7+Xj81Ly8kMO8FktgvcSeOZkOuk+JSt4z0TrOmPS/uI1RS95AgibTs4VWKX\nfVIDIGRfw+JFyc7MWHftZNiJNqT5nTM7wCJ3jL7xcSiAfdvedwX7EOCCYIYBe1G5\nvSQayAY4pX7SOG0b1biLnOr9\n-----END PRIVATE KEY-----\n",
        client_email: "dialogflow-client@wastewise-gach.iam.gserviceaccount.com",
        client_id: "114375885492880661574",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/dialogflow-client%40wastewise-gach.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
      };

      Dialogflow_V2.setConfiguration(
        dialogflowConfig.client_email,
        dialogflowConfig.private_key,
        Dialogflow_V2.LANG_ENGLISH_US,
        dialogflowConfig.project_id
      );
      
      setIsDialogflowReady(true);
    } catch (error) {
      console.error('Dialogflow initialization error:', error);
      Alert.alert('Error', 'Failed to initialize chatbot. Please try again.');
    }
  };

  const sendMessage = () => {
    if (!input.trim() || !isDialogflowReady) return;
    
    const userMessage = { 
      text: input.trim(), 
      sender: 'user', 
      timestamp: new Date().getTime() 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    Dialogflow_V2.requestQuery(
      input.trim(),
      result => {
        handleResponse(result);
        setIsLoading(false);
      },
      error => {
        console.error('Dialogflow error:', error);
        setIsLoading(false);
        Alert.alert('Error', 'Failed to get response. Please try again.');
      }
    );
    
    setInput('');
    // Auto-scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleResponse = (result) => {
    const botMessage = { 
      text: result.queryResult.fulfillmentText || "I didn't understand that. Could you please rephrase?", 
      sender: 'bot',
      timestamp: new Date().getTime()
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      { alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start' }
    ]}>
      <View style={[
        styles.messageBubble,
        { backgroundColor: item.sender === 'user' ? '#DCF8C6' : '#ECECEC' }
      ]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.lime_green }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
  
      {/* Title */}
      <View>
        <Text style={{
          fontFamily: 'PSemi-Bold',
          fontSize: 20,
          marginTop: 20,
          textAlign: 'center'
        }}>
          WasteWise Assistant
        </Text>
      </View>
  
      {/* Chat Container */}
      <View style={{ 
        flex: 1, 
        padding: 16, 
        backgroundColor: colors.BG_color, 
        width: '90%', 
        alignSelf: 'center', 
        borderRadius: 10, 
        maxHeight: '65%'
      }}>
        {messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, textAlign: 'center', color: '#666' }}>
              👋 Hi! I'm your WasteWise assistant. Ask me anything about waste management!
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={{ 
                alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: item.sender === 'user' ? '#DCF8C6' : '#ECECEC',
                padding: 10,
                borderRadius: 8,
                marginVertical: 5,
                maxWidth: '80%'
              }}>
                <Text>{item.text}</Text>
              </View>
            )}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
  
        {isLoading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
            <ActivityIndicator size="small" color={colors.lime_green} />
            <Text style={{ marginLeft: 8, color: '#666', fontSize: 14 }}>Thinking...</Text>
          </View>
        )}
  
        {/* Input row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <TextInput
            style={{ 
              flex: 1, 
              borderWidth: 1, 
              borderColor: '#ccc', 
              borderRadius: 20, 
              padding: 8,
              backgroundColor: '#fff'
            }}
            value={input}
            onChangeText={setInput}
            placeholder={isListening ? "Listening..." : "Type your message..."}
            editable={!isListening && isDialogflowReady && !isLoading}
          />
          <Button title="Send" onPress={sendMessage} disabled={!input.trim() || !isDialogflowReady || isLoading} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lime_green,
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  title: {
    fontFamily: 'PSemi-Bold',
    fontSize: 22,
    color: '#333',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: colors.BG_color || '#f5f5f5',
    marginHorizontal: '5%',
    borderRadius: 15,
    padding: 16,
    marginBottom: 10,
    height: '40%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: '40%',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    backgroundColor: colors.BG_color || '#f5f5f5',
    paddingHorizontal: '5%',
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: 120,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: colors.lime_green,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatbotScreen;