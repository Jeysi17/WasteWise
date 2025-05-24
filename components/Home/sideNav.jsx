import React, { useEffect, useRef } from 'react';
import { Text, Animated, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import colors from '../../constant/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SideNav = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <AntDesign name="right" size={15} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.navItem}>Profile</Text>
      <Text style={styles.navItem}>Settings</Text>
      <Text style={styles.navItem}>About</Text>
      <Text style={styles.signOut}>Sign Out</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
    drawer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: SCREEN_WIDTH * 0.7,
        backgroundColor: colors.bg_green,
        paddingTop: 10,
        paddingHorizontal: 20,
        zIndex: 9999,
        elevation: 50,
        position: 'absolute',
        borderLeftWidth: 5,
        borderLeftColor: colors.border_green,
    },
    closeBtn: {
        alignSelf: 'flex-start',
        backgroundColor: colors.lime_green,
        borderRadius: 50,
        color: colors.bg_green,
        padding: 15,
        left: '80%',
        marginBottom: 20,
        marginTop: 10,
    },
    navItem: {
        fontSize: 20,
        color: colors.border_green,
        marginVertical: 10,
        padding: 5,
        fontFamily: 'PSemi-Bold',
        backgroundColor: colors.pale_green,
        borderRadius: 40,
        textAlign: 'center',
        borderWidth: 3,
        borderColor: colors.border_green,
    },
    signOut: {
      fontSize: 20,
      color: colors.bg_green,
      marginVertical: 10,
      padding: 5,
      fontFamily: 'PSemi-Bold',
      backgroundColor: 'rgb(212, 44, 44)',
      borderRadius: 40,
      textAlign: 'center',
    }
});

export default SideNav;
