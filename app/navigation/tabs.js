import React from 'react-native'
import { useEffect, useState } from 'react';
import { Image, Text, View, StyleSheet, TouchableOpacity, Keyboard, Dimensions} from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../../constant/colors';
import HomeScreen from '../screens/HomeScreen';
import InfoScreen from '../screens/InfoScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationLogScreen from '../screens/NotificationLogScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Tab = createBottomTabNavigator();
const CustomTabBarButton = ({children, onPress}) => (
    <TouchableOpacity 
    style={{
        top: -SCREEN_HEIGHT * 0.025,
        justifyContent: 'center',
        alignItems: 'center',
        ...styles.shadow
    }}
         onPress={onPress}   
    >
        <View style={{
            width: SCREEN_WIDTH * 0.18,
            height: SCREEN_WIDTH * 0.18,
            borderRadius: SCREEN_WIDTH * 0.09,
            backgroundColor: colors.bg_green,
            borderWidth: 2,
            borderColor: colors.border_green,
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
                bottom: SCREEN_HEIGHT * 0.018,
                left: SCREEN_WIDTH * 0.04,
                right: SCREEN_WIDTH * 0.04,
                elevation: 1,
                backgroundColor: colors.BG_color,
                borderRadius: 15,
                height: SCREEN_HEIGHT * 0.08,
                margin: SCREEN_WIDTH * 0.025,
                zIndex: 1,
                ...styles.shadow
            }
        }}>
            <Tab.Screen name="Home" component={HomeScreen} options={{
                tabBarIcon: ({focused}) => (
                    <View style={styles.tabIconContainer}> 
                        <Image source={require('../../assets/icons/home.png')}
                        resizeMode='contain'
                        style={{
                            width: SCREEN_WIDTH * 0.11,
                            height: SCREEN_HEIGHT * 0.037,
                            tintColor: focused ? 'black' : 'gray'
                        }}
                        />
                        <Text 
                          style={[styles.tabLabel, {color: focused ? 'black' : 'gray'}]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          HOME
                        </Text>
                    </View>
                ),
            }}/>
            <Tab.Screen name="Info" component={InfoScreen} options={{
                tabBarIcon: ({focused}) => (
                    <View style={styles.tabIconContainer}> 
                        <Image source={require('../../assets/icons/info.png')}
                        resizeMode='contain'
                        style={{
                            width: SCREEN_WIDTH * 0.062,
                            height: SCREEN_HEIGHT * 0.037,
                            tintColor: focused ? 'black' : 'gray'
                        }}
                        />
                        <Text 
                          style={[styles.tabLabel, {color: focused ? 'black' : 'gray'}]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          INFO
                        </Text>
                    </View>
                    ),
            }}
            />
            <Tab.Screen name="Create" component={CreatePostScreen} options={{ 
                    tabBarIcon: ({focused}) => (
                        <Image source={require('../../assets/icons/plus.png')}
                        resizeMode='contain'
                        style={{
                            width: SCREEN_WIDTH * 0.125,
                            height: SCREEN_WIDTH * 0.125,
                            marginTop: SCREEN_WIDTH * 0.089,
                            marginLeft: SCREEN_WIDTH * 0.089,
                            tintColor: colors.border_green,
                        }}/>
                    ), 
                        tabBarButton: (props) => (
                            <CustomTabBarButton {...props}/>
                        )
                }}/>
            <Tab.Screen name="Chatbot" component={ChatbotScreen} options={{ 
                 tabBarIcon: ({focused}) => (
                    <View style={styles.tabIconContainer}> 
                        <Image source={require('../../assets/icons/chatbot.png')}
                        resizeMode='contain'
                        style={{
                            width: SCREEN_WIDTH * 0.11,
                            height: SCREEN_HEIGHT * 0.037,
                            tintColor: focused ? 'black' : 'gray'
                        }}
                        />
                        <Text 
                          style={[styles.tabLabel, {color: focused ? 'black' : 'gray'}]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          CHATBOT
                        </Text>
                    </View>
                    ),
            }}
            />
            <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ 
                  tabBarIcon: ({focused}) => (
                    <View style={styles.tabIconContainer}> 
                        <Image source={require('../../assets/icons/schedule.png')}
                        resizeMode='contain'
                        style={{
                            width: SCREEN_WIDTH * 0.062,
                            height: SCREEN_HEIGHT * 0.037,
                            tintColor: focused ? 'black' : 'gray'
                        }}
                        />
                        <Text 
                          style={[styles.tabLabel, {color: focused ? 'black' : 'gray'}]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          SCHEDULE
                        </Text>
                    </View>
                    ),
            }}/>
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarButton: () => null,
                    tabBarItemStyle: { display: 'none' },
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationLogScreen}
                options={{
                    tabBarButton: () => null,
                    tabBarItemStyle: { display: 'none' },
                }}
            />
        </Tab.Navigator>
    );
}

export default Tabs;

const styles = StyleSheet.create({
  shadow: {
    shadowColor: 'black',
    shadowOffset: {
        width: 0,
        height: SCREEN_HEIGHT * 0.11
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 1,
    zIndex: 1,
  },
  // ✅ NEW: Unified tab icon container
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: SCREEN_HEIGHT * 0.018,
    width: SCREEN_WIDTH * 0.15, // ✅ Fixed width container

  },
  // ✅ NEW: Responsive tab label
  tabLabel: {
    fontSize: SCREEN_WIDTH * 0.040, // ✅ Slightly larger base size
    fontFamily: 'PSemi-Bold',
    textAlign: 'center',
    width: '100%', // ✅ Takes full container width
    flexShrink: 1, // ✅ Allows text to shrink if needed
  }
})