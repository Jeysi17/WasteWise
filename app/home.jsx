import React from 'react'
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native'
import AppNavigator from './navigation/AppNavigator'
import { navigationRef } from './navigation/RootNavigation'

const home = () => {
  return (
    <NavigationIndependentTree>
      <NavigationContainer ref={navigationRef}>
        <AppNavigator />
      </NavigationContainer>
    </NavigationIndependentTree>
  )
}

export default home;