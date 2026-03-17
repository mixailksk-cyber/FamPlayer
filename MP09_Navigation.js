import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MP05_SettingsScreen from './MP05_SettingsScreen';
import MP06_PlaylistsScreen from './MP06_PlaylistsScreen';
import MP07_FolderScreen from './MP07_FolderScreen';
import MP20_SearchScreen from './MP20_SearchScreen';

const Stack = createStackNavigator();

export default function AppNavigator({ settings = {} }) {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Settings');

  useEffect(() => {
    // Определяем, какой экран показать первым
    const determineInitialRoute = async () => {
      try {
        const hasFolder = await AsyncStorage.getItem('selected_folder');
        // Если есть сохраненная папка, показываем плейлисты, иначе настройки
        setInitialRoute(hasFolder ? 'Playlists' : 'Settings');
      } catch (error) {
        console.error('Error reading storage:', error);
        setInitialRoute('Settings');
      } finally {
        // Даем время на отрисовку
        setTimeout(() => setIsReady(true), 100);
      }
    };

    determineInitialRoute();
  }, []);

  if (!isReady) {
    return null; // Ничего не показываем, пока не определим маршрут
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Settings" component={MP05_SettingsScreen} initialParams={{ settings }} />
        <Stack.Screen name="Playlists" component={MP06_PlaylistsScreen} />
        <Stack.Screen name="Folder" component={MP07_FolderScreen} />
        <Stack.Screen name="Search" component={MP20_SearchScreen} initialParams={{ settings }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
