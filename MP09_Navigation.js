import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MP05_SettingsScreen from './MP05_SettingsScreen';
import MP06_PlaylistsScreen from './MP06_PlaylistsScreen';
import MP07_FolderScreen from './MP07_FolderScreen';
import MP20_SearchScreen from './MP20_SearchScreen';

const Stack = createStackNavigator();

export default function AppNavigator({ rootFolder, settings = {} }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Settings" component={MP05_SettingsScreen} initialParams={{ settings }} />
        <Stack.Screen name="Playlists" component={MP06_PlaylistsScreen} />
        <Stack.Screen name="Folder" component={MP07_FolderScreen} />
        <Stack.Screen name="Search" component={MP20_SearchScreen} initialParams={{ settings }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
