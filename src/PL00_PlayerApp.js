import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import PlaylistsScreen from './player/PL06_PlaylistsScreen';
import { BRAND_COLOR } from './player/PL01_Core';

const Stack = createStackNavigator();

export default function PlayerApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Playlists"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Playlists" component={PlaylistsScreen} />
        <Stack.Screen name="Folder" component={require('./player/PL07_FolderScreen').default} />
        <Stack.Screen name="Settings" component={require('./player/PL05_SettingsScreen').default} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
