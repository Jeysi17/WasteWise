import React, { useState } from 'react';
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
} from 'react-native';
import { GestureHandlerRootView, TextInput } from 'react-native-gesture-handler';
import { SelectList } from 'react-native-dropdown-select-list';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import colors from '../../constant/colors';

const CreatePostScreen = ({ navigation }) => {
  const { user } = useAuth();
  const categories = [
    { key: '0', value: 'None' },
    { key: '1', value: 'Urgent' },
    { key: '2', value: 'Less Urgent' },
  ];

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');

  // Image picker
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.5,
      });

      if (result.canceled || !result.assets?.length) return;
      const firstAsset = result.assets[0];
      if (!firstAsset.uri) return;

      const permanentUri = `${FileSystem.cacheDirectory}${Date.now()}.jpg`;
      await FileSystem.copyAsync({
        from: firstAsset.uri,
        to: permanentUri,
      });

      setSelectedImage(permanentUri);
    } catch (error) {
      console.error('Image picker error:', error);
      alert('Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      alert('Please select an image first');
      return;
    }

    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - timezoneOffset).toISOString().split('T')[0];

    try {
      const formData = new FormData();
      formData.append('name', user.name);
      formData.append('title', title);
      formData.append('category', category);
      formData.append('location', location);
      formData.append('details', details);
      formData.append('date', localISOTime);

      formData.append('image', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'complaint.jpg',
      });

      const apiUrl = process.env.EXPO_PUBLIC_HOST_URL || 'http://192.168.18.87:3000';
      console.log('🌍 Submitting complaint to:', `${apiUrl}/api/pending`);

      const response = await axios.post(`${apiUrl}/api/pending`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Post created:', response.data);
      alert('Post created successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  const handleCancel = async () => {
    setTitle('');
    setLocation('');
    setDetails('');
    if (selectedImage) {
      try {
        await FileSystem.deleteAsync(selectedImage);
      } catch (error) {
        console.log('Error deleting temp image:', error);
      }
      setSelectedImage(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.lime_green }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.lime_green }}>
        <Text style={styles.header}>Create Post</Text>
      </View>

      {/* Form Container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          flex: 1,
          backgroundColor: colors.lime_green,
        }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={{
                  backgroundColor: colors.BG_color,
                  width: '95%',
                  marginTop: 10,
                  alignSelf: 'center',
                  borderRadius: 10,
                  padding: 15,
                }}
              >
                {/* Title */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.text}>Post Title:</Text>
                  <TextInput
                    placeholder="Enter Post Title"
                    placeholderTextColor="#000000"
                    style={styles.input}
                    onChangeText={setTitle}
                    value={title}
                  />
                </View>

                {/* Category */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    zIndex: 1000,
                    marginBottom: 20,
                  }}
                >
                  <Text style={styles.text}>Category:</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <SelectList
                      setSelected={(value) => {
                        setCategory(value);
                      }}
                      data={categories}
                      placeholder="Select Category"
                      defaultOption={{ key: '0', value: 'None' }}
                      boxStyles={styles.list}
                      inputStyles={{ fontSize: 13 }}
                      search={false}
                      maxHeight={120}
                      dropdownStyles={styles.dropdownList}
                      fontFamily="PSemi-Bold"
                      dropdownTextStyles={{ fontSize: 13 }}
                      save="value"
                    />
                  </View>
                </View>

                {/* Image Upload */}
                <View>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{ flexDirection: 'row', justifyContent: 'center' }}
                  >
                    <Text style={{ ...styles.text, marginLeft: -30 }}>Upload Image:</Text>
                    {selectedImage ? (
                      <Image
                        source={{ uri: selectedImage }}
                        style={styles.image}
                        onError={() => {
                          console.log('Failed to load selected image');
                          setSelectedImage(null);
                        }}
                      />
                    ) : (
                      <Image
                        source={require('../../assets/images/image_bg.png')}
                        style={styles.image}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Location */}
                <View style={{ flexDirection: 'row', marginTop: -10 }}>
                  <Text style={styles.text}>Location:</Text>
                  <TextInput
                    placeholder="Enter Location"
                    placeholderTextColor="#000000"
                    onChangeText={setLocation}
                    style={styles.input}
                    value={location}
                  />
                </View>

                {/* Details */}
                <View style={{ flexDirection: 'row', alignSelf: 'flex-start' }}>
                  <TextInput
                    placeholder="Enter Post Details..."
                    placeholderTextColor="#000000"
                    onChangeText={setDetails}
                    style={{
                      ...styles.input,
                      width: '90%',
                      height: 90,
                      textAlignVertical: 'top',
                    }}
                    value={details}
                    multiline
                  />
                </View>

                {/* Buttons */}
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    style={{ ...styles.cancelBtn, marginLeft: 20 }}
                    onPress={handleCancel}
                  >
                    <Text style={styles.btnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ ...styles.submitBtn, marginLeft: 220 }}
                    onPress={handleSubmit}
                  >
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
    fontSize: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  text: {
    fontFamily: 'PSemi-Bold',
    fontSize: 15,
    padding: 15,
    marginTop: 10,
  },
  input: {
    marginLeft: 20,
    borderWidth: 1,
    height: 40,
    width: 200,
    marginTop: 10,
    borderRadius: 10,
    fontSize: 15,
    fontFamily: 'PSemi-Bold',
    paddingVertical: 4,
    alignSelf: 'center',
    backgroundColor: '#fff',
  },
  cancelBtn: {
    backgroundColor: 'red',
    padding: 5,
    marginTop: 5,
    borderRadius: 10,
  },
  submitBtn: {
    backgroundColor: colors.lime_green,
    padding: 5,
    marginTop: 5,
    borderRadius: 10,
  },
  btnText: {
    fontSize: 15,
    fontFamily: 'PSemi-Bold',
  },
  list: {
    borderWidth: 1,
    borderColor: '#000000',
    width: '90%',
    height: 45,
    fontFamily: 'PSemi-Bold',
    marginTop: 15,
  },
  dropdownList: {
    position: 'absolute',
    top: 50,
    width: '90%',
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#fff',
    zIndex: 1000,
    elevation: 5,
  },
  image: {
    height: 200,
    width: 200,
    borderRadius: 10,
  },
});
