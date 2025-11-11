import React, { useState, useEffect } from 'react';
import {
View,
Text,
Image,
TouchableOpacity,
StyleSheet,
TouchableWithoutFeedback,
Keyboard,
KeyboardAvoidingView,
ScrollView,
Platform,
Modal,
FlatList,
Dimensions
} from 'react-native';
import { GestureHandlerRootView, TextInput } from 'react-native-gesture-handler';
import DropDownPicker from 'react-native-dropdown-picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { useAuth} from '../../context/AuthContext';
import colors from '../../constant/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

DropDownPicker.setListMode('SCROLLVIEW'); 

const CreatePostScreen = ({ navigation }) => {
  const { user, userLocation } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [details, setDetails] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const barangays = [
    'Aguado',
    'Cabezas',
    'Cabuco',
    'Conchu',
    'De Ocampo',
    'Gregorio',
    'Hugo Perez',
    'Inocencio',
    'Lallana',
    'Lapidario',
    'Luciano',
    'Osorio',
    'San Agustin',
  ];

  useEffect(() => {
  if (userLocation) {
    setLocation(userLocation);
  }
}, [userLocation]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission required to access gallery!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.5,
      });

      if (!result.canceled && result.assets?.[0]) {
        const image = result.assets[0];
        const newPath = `${FileSystem.cacheDirectory}${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: image.uri, to: newPath });
        setSelectedImage(newPath);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };
  const uploadToCloudinary = async (imageUri) => {
    const data = new FormData();
    data.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    });
    data.append('upload_preset', 'complaint_images'); 
    data.append('cloud_name', 'ddbnrxryn');
  
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/ddbnrxryn/image/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      return result.secure_url; 
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };
  

  const handleSubmit = async () => {
    if (!selectedImage) {
      alert('Please select an image first');
      return;
    }
  
    // ✅ Add validation for user data
    if (!user?.$id) {
      alert('User information not found. Please log in again.');
      return;
    }
  
    if (!userLocation) {
      alert('Location not available. Please wait or try again.');
      return;
    }
  
    try {
      const now = new Date();
      const date = now.toISOString();
  
      // 🔹 Upload image to Cloudinary
      const imageUrl = await uploadToCloudinary(selectedImage);
  
      // 🔹 Prepare post data
      const postData = {
        user_id: user.$id,              // ✅ Appwrite user ID
        name: user.name || user.email,  // ✅ User's display name
        title,
        location: userLocation,         // ✅ User's barangay from AuthContext
        details,
        date,
        imageUrl,
      };
  
      console.log('📤 Submitting complaint:', postData);
  
      const apiUrl = process.env.EXPO_PUBLIC_HOST_URL;
      const response = await axios.post(`${apiUrl}/api/posts/pending`, postData);
  
      console.log('✅ Complaint submitted:', response.data);
      alert('Complaint posted successfully!');
  
      // Reset form
      setTitle('');
      setDetails('');
      if (selectedImage) {
        await FileSystem.deleteAsync(selectedImage);
        setSelectedImage(null);
      }
  
    } catch (error) {
      console.error('❌ Error submitting complaint:', error);
      if (error.response) {
        console.error('Response error:', error.response.data);
        alert(`Failed to submit complaint: ${error.response.data.error || 'Unknown error'}`);
      } else {
        alert('Failed to submit complaint. Please check your connection.');
      }
    }
  };

  const handleCancel = async () => {
    setTitle('');
    setLocation(null);
    setDetails('');
    if (selectedImage) {
      try {
        await FileSystem.deleteAsync(selectedImage);
      } catch (err) {
        console.error('Error deleting temp image:', err);
      }
      setSelectedImage(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.lime_green }}>
      <View>
        <Text style={styles.header}>Create Complaint</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.formContainer, {height: '95%'}]}>
                <View style={styles.inputRow}>
                  <Text style={styles.text}>Post Title:</Text>
                  <TextInput
                    placeholder="Enter Complaint Title"
                    placeholderTextColor="#000"
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                <View>
                  <TouchableOpacity onPress={pickImage} style={{ alignSelf: 'center' }}>
                    <Text style={[styles.text, { marginBottom: -10, marginLeft: -70, marginTop: 5 }]}>Upload Image:</Text>
                    <Image
                      source={
                        selectedImage
                          ? { uri: selectedImage }
                          : require('../../assets/images/image_bg.png')
                      }
                      style={[styles.image, {marginTop: 10}]}
                    />
                  </TouchableOpacity>
                </View>

                {/* Replace your entire TouchableOpacity + Modal block with this */}
                <View style={styles.locationContainer}>
                  <Text style={styles.locationText}>
                    Location: {userLocation ? userLocation : 'Fetching location...'}
                  </Text>
                </View>

                <TextInput
                  placeholder="Enter Post Details..."
                  placeholderTextColor="#000"
                  multiline
                  style={styles.detailsInput}
                  value={details}
                  onChangeText={setDetails}
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                    <Text style={styles.btnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                    <Text style={styles.btnText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </GestureHandlerRootView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreatePostScreen;

const styles = StyleSheet.create({
  header: {
    fontFamily: 'PSemi-Bold',
    fontSize: SCREEN_WIDTH * 0.06,
    marginTop: SCREEN_HEIGHT * 0.025,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: colors.BG_color,
    width: SCREEN_WIDTH * 0.95,
    marginTop: SCREEN_HEIGHT * 0.012,
    alignSelf: 'center',
    borderRadius: 10,
    padding: SCREEN_WIDTH * 0.04,
  },
  text: {
    fontFamily: 'PSemi-Bold',
    fontSize: SCREEN_WIDTH * 0.038,
    paddingLeft: SCREEN_WIDTH * 0.025,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SCREEN_WIDTH * 0.01
  },
  input: {
    marginLeft: SCREEN_WIDTH * 0.025,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: SCREEN_WIDTH * 0.038,
    fontFamily: 'PSemi-Bold',
    paddingHorizontal: SCREEN_WIDTH * 0.025,
    backgroundColor: '#fff',
    height: SCREEN_HEIGHT * 0.05,
    flex: 1,
    textAlignVertical: 'center',
    paddingTop: 2,
  },
  image: {
    height: SCREEN_WIDTH * 0.5,
    width: SCREEN_WIDTH * 0.5,
    borderRadius: 10,
    alignSelf: 'center',
  },
  detailsInput: {
    marginTop: SCREEN_HEIGHT * 0.018,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: SCREEN_WIDTH * 0.038,
    fontFamily: 'PSemi-Bold',
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    padding: SCREEN_WIDTH * 0.025,
    height: SCREEN_HEIGHT * 0.12,
    width: SCREEN_WIDTH * 0.9,
    alignSelf: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SCREEN_HEIGHT * 0.018,
    paddingHorizontal: SCREEN_WIDTH * 0.075,
  },
  cancelBtn: {
    backgroundColor: 'red',
    padding: SCREEN_HEIGHT * 0.01,
    borderRadius: 10,
    width: SCREEN_WIDTH * 0.23,
    alignItems: 'center',
  },
  submitBtn: {
    backgroundColor: colors.lime_green,
    padding: SCREEN_HEIGHT * 0.01,
    borderRadius: 10,
    width: SCREEN_WIDTH * 0.23,
    alignItems: 'center',
  },
  btnText: {
    fontSize: SCREEN_WIDTH * 0.038,
    fontFamily: 'PSemi-Bold',
  },
  dropdownButton: {
    borderColor: colors.black,
    borderWidth: 1,
    borderRadius: 10,
    padding: SCREEN_WIDTH * 0.03,
    marginTop: SCREEN_HEIGHT * 0.006,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontFamily: 'PSemi-Bold',
    fontSize: SCREEN_WIDTH * 0.035,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    backgroundColor: colors.BG_color,
    borderRadius: 10,
    width: SCREEN_WIDTH * 0.8,
    maxHeight: SCREEN_HEIGHT * 0.6,
    padding: SCREEN_WIDTH * 0.04,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: 'PSemi-Bold',
    fontSize: SCREEN_WIDTH * 0.045,
    marginBottom: SCREEN_HEIGHT * 0.012,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: SCREEN_HEIGHT * 0.012,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontFamily: 'PSemi-Bold',
    fontSize: SCREEN_WIDTH * 0.038,
    textAlign: 'center',
  },
  modalItemSelected: {
    backgroundColor: colors.lime_green,
  },
  closeButton: {
    marginTop: SCREEN_HEIGHT * 0.012,
    padding: SCREEN_HEIGHT * 0.01,
    backgroundColor: colors.dark_green,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FF0000',
    fontFamily: 'PSemi-Bold',
  },
  label: {
    fontFamily: 'PSemi-Bold',
    fontSize: SCREEN_WIDTH * 0.038,
  },
  locationText: {
  marginLeft: SCREEN_WIDTH * 0.02,
  fontSize: SCREEN_WIDTH * 0.04,
  fontFamily: 'PSemi-Bold',
  color: colors.black,
},
});