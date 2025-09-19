import React from 'react';
import { View, Text, Image, ImageBackground, Button, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native'
import Header from '../../components/Home/header'
import colors from '../../constant/colors'
import { GestureHandlerRootView, NativeViewGestureHandler, TextInput } from 'react-native-gesture-handler';
import { SelectList } from 'react-native-dropdown-select-list'
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const CreatePostScreen = (navigation) => {
    const {user} = useAuth();
    const categories = [
        {key: '0', value: 'None'},
        {key:'1', value:'Urgent'},
        {key:'2', value:'Less Urgent'},
    ];

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [location, setLocation] = useState('');
    const [details, setDetails] = useState('');

    const pickImage = async () => {
        try {
            // Request permissions first (important for Android)
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
            return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.Images,
            allowsEditing: true,
            aspect: [4, 4],
            quality: 0.5,
            });

            // Handle cancellation and verify response structure
            if (result.canceled) {
            console.log('User cancelled image picker');
            return;
            }

            if (!result.assets || result.assets.length === 0) {
            console.log('No assets found');
            return;
            }

            const firstAsset = result.assets[0];
            if (!firstAsset.uri) {
            console.log('Selected image has no URI');
            return;
            }

            // Optional: Create a permanent copy
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

    const loadImageBase64 = async (uri) => {
        try {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (!fileInfo.exists) {
            throw new Error('File does not exist');
            }

            const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
            });
            return `data:image/jpeg;base64,${base64}`;
        } catch (error) {
            console.error('Error reading file:', error);
            return null;
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
            const base64Image = await loadImageBase64(selectedImage);
            if (!base64Image) {
            throw new Error('Failed to process image');
            }
            const response = await axios.post(
            `${process.env.EXPO_PUBLIC_HOST_URL}/api/pending`,
            {
                name: user.name,
                title,
                category,
                imageUrl: base64Image,
                location,
                details,
                date: localISOTime
            },
            {
                headers: {
                'Content-Type': 'application/json'
                }
            }
            );

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
        <View>
            <View style={{
                backgroundColor: colors.lime_green
            }}>
                <Text style={{
                    fontFamily: 'PSemi-Bold',
                    fontSize: 20,
                    marginTop: 20,
                    textAlign: 'center'
                }}>Create Post</Text>
            </View>
            <View style={{
               backgroundColor: colors.lime_green,
               height: '100%' 
            }}>
       
                <View style={{
                    backgroundColor: colors.lime_green,
                    height: '100%' 
                }}>
                    <View style = {{
                        backgroundColor: colors.BG_color,
                        height: '71%',
                        width: '95%',
                        marginTop: 10,
                        alignSelf: 'center',
                        borderRadius: 10
                    }}>
                        <GestureHandlerRootView>
                            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                           
                                <View style={{ flexDirection: 'column'}}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.text}>Post Title:</Text>
                                    <TextInput
                                    placeholder='Enter Post Title'
                                    placeholderTextColor={"#000000"}
                                    style={styles.input}
                                    onChangeText={setTitle}
                                    value={title}
                                    />
                                </View>
            
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                    <Text style={styles.text}>Category:</Text>
                                    <SelectList 
                                    setSelected={(value)=> {
                                        setCategory(value);
                                    }}
                                        data={categories}
                                        placeholder="Select Category"
                                        defaultOption={{key: '0', value: 'None'}}
                                        boxStyles={styles.list}
                                        inputStyles={{fontSize: 13}}
                                        search={false}
                                        maxHeight={'100'}
                                        dropdownStyles={styles.dropdownList}
                                        fontFamily='PSemi-Bold'
                                        dropdownTextStyles={{fontSize: 13}}
                                        save='value'
                                        />
                                      
                                </View>
                                <View>
                                <TouchableOpacity onPress={() => pickImage()} style={{flexDirection: 'row', justifyContent: 'center'}}>
                                    <Text style={{...styles.text, marginLeft: -30}}>Upload Image:</Text>
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
                                <View style={{flexDirection: 'row',marginTop: -10}}>
                                    <Text style={styles.text}>Location:</Text>
                                    <TextInput
                                    placeholder='Enter Location'
                                    placeholderTextColor={"#000000"}
                                    onChangeText={setLocation}
                                    style={styles.input}
                                    value={location}/>
                                    
                                </View>
                                <View style={{flexDirection: 'row', alignSelf: 'flex-start'}}>
                                    <TextInput 
                                    placeholder='Enter Post Details...'
                                    placeholderTextColor={'#000000'}
                                    onChangeText={setDetails}
                                    style={{...styles.input, width: '90%', height: 120, textAlignVertical: 'top'}}
                                    value={details}/>
                                </View>
                                <View style={{flexDirection: 'row'}}>
                                    <TouchableOpacity style={{...styles.cancelBtn, marginLeft: 20}} onPress={handleCancel}>
                                        <Text style={{fontSize: 15, fontFamily: 'PSemi-Bold'}}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{...styles.submitBtn, marginLeft: 205}} onPress={handleSubmit}>
                                        <Text style={{fontSize: 15, fontFamily: 'PSemi-Bold'}}>Submit</Text>
                                    </TouchableOpacity>
                                </View>
                                </View>
                                </TouchableWithoutFeedback>
                        </GestureHandlerRootView>
                    </View>
                </View>    
            </View>
        </View>

    );
}

export default CreatePostScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    alignSelf: 'center'
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
  list: {
    borderWidth: 1,
    borderColor: "#000000",
    width: '60%',
    height: 45,
    fontFamily: 'PSemi-Bold',
    marginTop: 15,
    marginLeft: 16,
    
  },
  dropdownList: {
    borderWidth: 1,
    width: '75%',
    fontFamily: 'PSemi-Bold',
    marginTop: 10,
    marginLeft: 16,
    marginBottom: 10,
  },
  image: {
    height: 200,
    width: 200,
    borderRadius: 10,
  }
})