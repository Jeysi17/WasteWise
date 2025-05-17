import { View, Text } from 'react-native'
import React from 'react'
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native'
import AppContainer from './navigation/AppContainer';

const home = () => {
  return (
    <NavigationIndependentTree>
        <NavigationContainer>
            <AppContainer/>
        </NavigationContainer>
    </NavigationIndependentTree>
  )
}

export default home;