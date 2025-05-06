import React from 'react-native';
import { View, Text, Image, ImageBackground, Button, TouchableOpacity, StyleSheet } from 'react-native'
import Header from '../../components/Home/header'
import colors from '../../constant/colors'
import { GestureHandlerRootView, NativeViewGestureHandler, TextInput } from 'react-native-gesture-handler';
import { SelectList } from 'react-native-dropdown-select-list'
import { useState } from 'react';


const CreatePostScreen = (navigation) => {
    const [category, setCategory] = useState("");
    const [subcategory, setSubCategory] = useState("");
    const categories = [
        {key: '0', value: 'None'},
        {key:'1', value:'Mobiles'},
        {key:'2', value:'Appliances'},
        {key:'3', value:'Cameras'},
    ];
    return (
        <View>
        <Header />
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
                        height: '55%',
                        width: '90%',
                        marginTop: 10,
                        alignSelf: 'center',
                        borderRadius: 10
                    }}>
                        <GestureHandlerRootView>
                           
                                <View style={{ flexDirection: 'column'}}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={styles.text}>Post Title:</Text>
                                    <TextInput
                                    placeholder='Enter Post Title'
                                    placeholderTextColor={"#000000"}
                                    style={styles.input}
                                    />
                                </View>
            
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                    <Text style={styles.text}>Category:</Text>
                                    <SelectList 
                                        setSelected={setCategory}
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
                                        />
                                        <TouchableOpacity>
                                            <Image source={require('../../assets/icons/upload.png')} style={{
                                                marginTop: 25,
                                                marginLeft: -60
                                            }}></Image>
                                        </TouchableOpacity>
                                </View>
                                <View style={{flexDirection: 'row'}}>
                                    <Text style={styles.text}>Location:</Text>
                                    <TextInput
                                    placeholder='Enter Location'
                                    placeholderTextColor={"#000000"}
                                    style={styles.input}/>
                                </View>
                                <View style={{flexDirection: 'row', alignSelf: 'flex-start'}}>
                                    <TextInput 
                                    placeholder='Enter Post Details...'
                                    placeholderTextColor={'#000000'}
                                    style={{...styles.input, width: '90%', height: 120, textAlignVertical: 'top'}}/>
                                </View>
                                <View style={{flexDirection: 'row'}}>
                                    <TouchableOpacity style={{...styles.cancelBtn, marginLeft: 25}}>
                                        <Text style={{fontSize: 15, fontFamily: 'PSemi-Bold'}}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{...styles.submitBtn, marginLeft: 175}}>
                                        <Text style={{fontSize: 15, fontFamily: 'PSemi-Bold'}}>Submit</Text>
                                    </TouchableOpacity>
                                </View>
                                </View>
                           
                        </GestureHandlerRootView>
                    </View>
                </View>    
            </View>
        </View>

    );
};

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
  }
})