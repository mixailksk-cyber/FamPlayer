import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Импортируем экраны
import PlaylistsScreen from './player/PL06_PlaylistsScreen';
import FolderScreen from './player/PL07_FolderScreen';
import SettingsScreen from './player/PL05_SettingsScreen';

const Stack = createNativeStackNavigator();

export default function PlayerApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Playlists"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Playlists" component={PlaylistsScreen} />
        <Stack.Screen name="Folder" component={FolderScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
