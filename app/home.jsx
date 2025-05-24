import { View, Text } from 'react-native'
import React from 'react'
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native'
import Tabs from './navigation/tabs'

const home = () => {
  return (
    <NavigationIndependentTree>
        <NavigationContainer>
            <Tabs />
        </NavigationContainer>
    </NavigationIndependentTree>
  )
}

export default home;