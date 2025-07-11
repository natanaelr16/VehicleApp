/**
 * Vehicle Inspection App
 * React Native App for vehicle inspection management
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import AppNavigator from './src/components/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="#2196F3"
      />
      <AppNavigator />
    </>
  );
}

export default App;
