import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import InspectionFormScreen from '../screens/InspectionFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReportPreviewScreen from '../screens/ReportPreviewScreen';
import BodyInspectionScreen from '../screens/BodyInspectionScreen';

export type RootStackParamList = {
  Home: undefined;
  InspectionForm: undefined;
  Settings: undefined;
  ReportPreview: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'Inspección Vehicular',
            headerShown: false, // Ocultamos el header para la pantalla Home
          }}
        />
        <Stack.Screen 
          name="InspectionForm" 
          component={InspectionFormScreen}
          options={{
            title: 'Formulario de Inspección',
            headerShown: false, // Ocultamos el header para mantener consistencia
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            title: 'Configuración',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="ReportPreview" 
          component={ReportPreviewScreen}
          options={{
            title: 'Vista Previa del Reporte',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="BodyInspection" 
          component={BodyInspectionScreen}
          options={{
            title: 'Inspección de Carrocería',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 