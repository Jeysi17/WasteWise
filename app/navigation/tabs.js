import React from 'react-native'
import { useEffect, useState } from 'react';
import { Image, Text, View, StyleSheet, TouchableOpacity, Keyboard} from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../../constant/colors';
import HomeScreen from '../screens/HomeScreen';
import EventScreen from '../screens/EventScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import CreatePostScreen from '../screens/CreatePostScreen';

const Tab = createBottomTabNavigator();
const CustomTabBarButton = ({children, onPress}) => (
    <TouchableOpacity 
    style={{
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
        ...styles.shadow
    }}
         onPress={onPress}   
    >
        <View style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: colors.lime_green,
        }}>{children}</View>
    </TouchableOpacity>

    );
const Tabs = () => {
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
          showSub.remove();
          hideSub.remove();
        };
      }, []);
      
    return (
        <Tab.Navigator screenOptions={{
            tabBarShowLabel: false,
            headerShown: false,
            tabBarStyle: isKeyboardVisible
            ? { display: 'none' }
            : {
                position: 'absolute',
                bottom: 15,
                left: 15,
                right: 15,
                elevation: 1,
                backgroundColor: colors.BG_color,
                borderRadius: 15,
                height: 90,
                margin: 10,
                zIndex: 1,
                ...styles.shadow
            }
        }}>
            <Tab.Screen name="Home" component={HomeScreen} options={{
                tabBarIcon: ({focused}) => (
                    <View style={{alignItems:'center', justifyContent:'center', top: 25}}> 
                        <Image source={require('../../assets/icons/home.png')}
                        resizeMode='contain'
                        style={{
                            width: 45,
                            height: 30,
                            tintColor: focused ? 'black' : 'gray'
                        }}
                        />
                        <Text style={{color: focused ? 'black' : 'gray', fontSize: 8, fontFamily: 'PSemi-Bold'}}>HOME</Text>
                    </View>
                ),
            }}/>
            <Tab.Screen name="Event" component={EventScreen} options={{
                tabBarIcon: ({focused}) => (
                    <View style={{alignItems:'center', justifyContent:'center', top: 24}}> 
                        <Image source={require('../../assets/icons/event.png')}
                        resizeMode='contain'
                        style={{
                            width: 25,
                            height: 30,
                            tintColor: focused ? 'black' : 'gray'
                        }}
                        />
                        <Text style={{color: focused ? 'black' : 'gray', fontSize: 8, fontFamily: 'PSemi-Bold'}}>EVENT</Text>
                    </View>
                    ),
            }}
            />
            <Tab.Screen name="Create" component={CreatePostScreen} options={{ 
                    tabBarIcon: ({focused}) => (
                        <Image source={require('../../assets/icons/plus.png')}
                        resizeMode='contain'
                        style={{
                            width: 50,
                            height: 50,
                            marginTop: 38,
                            marginLeft: 38,
                            tintColor: colors.BG_color,
                        }}/>
                    ), 
                        tabBarButton: (props) => (
                            <CustomTabBarButton {...props}/>
                        )
                }}/>
            <Tab.Screen name="Chatbot" component={ChatbotScreen} options={{ 
                 tabBarIcon: ({focused}) => (
                    <View style={{alignItems:'center', justifyContent:'center', top: 29}}> 
                        <Image source={require('../../assets/icons/chatbot.png')}
                        resizeMode='contain'
                        style={{
                            width: 45,
                            height: 30,
                            tintColor: focused ? 'black' : 'gray'
                        }}
                        />
                        <Text style={{color: focused ? 'black' : 'gray', fontSize: 8, fontFamily: 'PSemi-Bold', width: '100%'}}>CHATBOT</Text>
                    </View>
                    ),
            }}
            />
            <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ 
                  tabBarIcon: ({focused}) => (
                    <View style={{alignItems:'center', justifyContent:'center', top: 29}}> 
                        <Image source={require('../../assets/icons/schedule.png')}
                        resizeMode='contain'
                        style={{
                            width: 25,
                            height: 30,
                            tintColor: focused ? 'black' : 'gray'
                        }}
                        />
                        <Text style={{color: focused ? 'black' : 'gray', fontSize: 8, fontFamily: 'PSemi-Bold', width: '100%'}}>SCHEDULE</Text>
                    </View>
                    ),
            }}/>
        </Tab.Navigator>
    );
}

export default Tabs;

const styles = StyleSheet.create({
  shadow: {
    shadowColor: 'black',
    shadowOffset: {
        width: 0,
        height: 90
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 1,
    zIndex: 1,
  }
})
