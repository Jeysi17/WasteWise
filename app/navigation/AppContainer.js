import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Tabs from './tabs.js';
import SideNav from '../../components/Home/sideNav';
import Header from '../../components/Home/header.jsx';
import { initNotifications } from '../services/notification.js';
import { useAuth } from '../../context/AuthContext';
import {OneSignal, LogLevel} from 'react-native-onesignal';

const AppContainer = () => {
  const { user, signout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  OneSignal.initialize(process.env.ONESIGNAL_APP_ID);

  OneSignal.Notifications.requestPermission(false);
  useEffect(() => {
          fetchLocation();
      }, []);
  
      const fetchLocation = async () => {
          setLoading(true);
          try {
              const response = await fetch(
                  `${process.env.EXPO_PUBLIC_HOST_URL}/location?userEmail=${encodeURIComponent(user.email)}`
              );
              const data = await response.json();
              
              if (data.error) {
                  setError(data.error);
              } else {
                  setLocation(data.location); 
              }
          } catch (err) {
              setError('Failed to fetch location');
              console.error(err);
          } finally {
              setLoading(false);
          }
      };
  useEffect(() => {
    initNotifications(location);
  }, []);
  return (
    <View style={styles.container}>
        <Header onMenuPress={() => setMenuOpen(true)} />
        <Tabs/>
        <SideNav visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
};

export default AppContainer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});