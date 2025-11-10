import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Tabs from './tabs.js';
import SideNav from '../../components/Home/sideNav';
import Header from '../../components/Home/header.jsx';
import { initNotifications } from '../services/notification.js';
import { useAuth } from '../../context/AuthContext';
const AppContainer = () => {
  const { user, signout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  

  // ✅ Fetch location after user loads
  useEffect(() => {
    if (user?.email) {
      fetchLocation();
    }
  }, [user]);

  const fetchLocation = async () => {
    setLoading(true);
    try {
        const apiUrl = process.env.EXPO_PUBLIC_HOST_URL || 'http://192.168.18.7:3000';
        console.log('🌐 AppContainer calling URL:', `${apiUrl}/api/users/location?userEmail=${encodeURIComponent(user.email)}`);
        const response = await fetch(
          `${apiUrl}/api/users/location?userEmail=${encodeURIComponent(user.email)}`
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

  // ✅ Pass location into your notifications setup
  useEffect(() => {
    if (location) {
      initNotifications(location);
    }
  }, [location]);

  return (
    <View style={styles.container}>
      <Header onMenuPress={() => setMenuOpen(true)} />
      <Tabs />
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
