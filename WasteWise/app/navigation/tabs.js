import React from 'react-native'
import { Image, Text, View, StyleSheet, TouchableOpacity, ScrollView} from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../../constant/colors';
import HomeScreen from '../screens/HomeScreen';
import EventScreen from '../screens/EventScreen';
import PostsScreen from '../screens/PostsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import CreatePostScreen from '../screens/CreatePostScreen';

const Tab = createBottomTabNavigator();
const CustomTabBarButton = ({children, onPress}) => (
    <TouchableOpacity 
    style={{
        top: -30,
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
            backgroundColor: colors.pale_green
        }}>{children}</View>
    </TouchableOpacity>

    );
const Tabs = () => {
    return (
        <Tab.Navigator screenOptions={{
            tabBarShowLabel: false,
            headerShown: false,
            tabBarStyle: {
                position: 'absolute',
                bottom: 15,
                left: 15,
                right: 15,
                elevation: 0,
                backgroundColor: colors.BG_color,
                borderRadius: 15,
                height: 90,
                margin: 10,
                ...styles.shadow
            }
        }}>
            <Tab.Screen name="Home" component={HomeScreen} options={{
                tabBarIcon: ({focused}) => (
                    <View style={{alignItems:'center', justifyContent:'center', top: 25}}> 
                        <Image source={require('../../assets/icons/home.png')}
                        resizeMode='contain'
                        style={{
                            width: 25,
                            height: 25,
                            tintColor: focused ? 'black' : 'gray'
                        }}
                        />
                        <Text style={{color: focused ? 'black' : 'gray', fontSize: 10, fontFamily: 'PSemi-Bold'}}>HOME</Text>
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
                            height: 25,
                            tintColor: focused ? 'black' : 'gray'
                        }}
                        />
                        <Text style={{color: focused ? 'black' : 'gray', fontSize: 9, fontFamily: 'PSemi-Bold'}}>EVENT</Text>
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
            <Tab.Screen name="Post" component={PostsScreen} options={{ 
                 tabBarIcon: ({focused}) => (
                    <View style={{alignItems:'center', justifyContent:'center', top: 24}}> 
                        <Image source={require('../../assets/icons/posts.png')}
                        resizeMode='contain'
                        style={{
                            width: 25,
                            height: 25,
                            tintColor: focused ? 'black' : 'gray'
                        }}
                        />
                        <Text style={{color: focused ? 'black' : 'gray', fontSize: 9, fontFamily: 'PSemi-Bold'}}>POST</Text>
                    </View>
                    ),
            }}
            />
            <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ 
                  tabBarIcon: ({focused}) => (
                    <View style={{alignItems:'center', justifyContent:'center', top: 25}}> 
                        <Image source={require('../../assets/icons/schedule.png')}
                        resizeMode='contain'
                        style={{
                            width: 25,
                            height: 25,
                            tintColor: focused ? 'black' : 'gray'
                        }}
                        />
                        <Text style={{color: focused ? 'black' : 'gray', fontSize: 10, fontFamily: 'PSemi-Bold', }}>SCHEDULE</Text>
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
    elevation: 5
  }
})
