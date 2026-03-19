import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MP05_SettingsScreen from './MP05_SettingsScreen';
import MP06_PlaylistsScreen from './MP06_PlaylistsScreen';
import MP07_FolderScreen from './MP07_FolderScreen';
import MP20_SearchScreen from './MP20_SearchScreen';
import { BRAND_COLOR } from './MP01_Core';

const Stack = createStackNavigator();

export default function AppNavigator({ settings: initialSettings = {} }) {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Playlists');
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Загружаем сохраненный цвет
        const savedColor = await AsyncStorage.getItem('@brand_color');
        if (savedColor) {
          setSettings({ brandColor: savedColor });
        }
        
        // Проверяем, есть ли сохраненные данные
        const hasData = await AsyncStorage.getItem('scanned_folders');
        setInitialRoute(hasData ? 'Playlists' : 'Settings');
        
      } catch (error) {
        console.error('Ошибка при инициализации:', error);
        setInitialRoute('Settings');
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen 
          name="Settings" 
          component={MP05_SettingsScreen} 
          initialParams={{ settings }}
        />
        <Stack.Screen 
          name="Playlists" 
          component={MP06_PlaylistsScreen} 
          initialParams={{ settings }}
        />
        <Stack.Screen 
          name="Folder" 
          component={MP07_FolderScreen} 
        />
        <Stack.Screen 
          name="Search" 
          component={MP20_SearchScreen} 
          initialParams={{ settings }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
