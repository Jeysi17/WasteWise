import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Tabs from './tabs.js';
import SideNav from '../../components/Home/sideNav';
import Header from '../../components/Home/header.jsx';

const AppContainer = () => {
  const [menuOpen, setMenuOpen] = useState(false);

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