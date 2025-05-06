import React, { useState, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../../constant/colors';

const Tab = createBottomTabNavigator();

const ScrollAwareTabNavigator = ({ children }) => {
  const [tabBarVisible, setTabBarVisible] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollThreshold = 30;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollingUp = currentScrollY > lastScrollY.current;

        if (Math.abs(currentScrollY - lastScrollY.current) > scrollThreshold) {
          setTabBarVisible(!scrollingUp);
          lastScrollY.current = currentScrollY;
        }
      },
    }
  );

  const tabBarTranslateY = scrollY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  });

  return (
    <Tab.Navigator
      screenOptions={{
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
          transform: [{ translateY: tabBarVisible ? 0 : tabBarTranslateY }],
          opacity: tabBarVisible ? 1 : 0,
          ...styles.shadow
        }
      }}
    >
      {React.Children.toArray(children).filter(Boolean).map((child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            listeners: {
              scroll: handleScroll,
            },
          });
        }
        return child;
      })}
    </Tab.Navigator>
  );
};

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
});

export default ScrollAwareTabNavigator;