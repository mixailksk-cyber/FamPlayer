import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MP05_SettingsScreen from './MP05_SettingsScreen';
import MP06_PlaylistsScreen from './MP06_PlaylistsScreen';
import MP07_FolderScreen from './MP07_FolderScreen';
import MP20_SearchScreen from './MP20_SearchScreen';
import { BRAND_COLOR } from './MP01_Core';
import { scanMusic, saveFoldersList, saveSongsList, getFoldersList } from './MP02_FileSystem';

const Stack = createStackNavigator();

export default function AppNavigator({ settings: initialSettings = {} }) {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Playlists');
  const [initialParams, setInitialParams] = useState({});
  const [settings] = useState(initialSettings);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Проверяем, есть ли сохраненные данные
        const savedFolders = await getFoldersList();
        
        if (savedFolders.length > 0) {
          // Если есть сохраненные данные, показываем плейлисты
          setInitialParams({ folders: savedFolders });
          setInitialRoute('Playlists');
        } else {
          // Если нет данных, запускаем автоматическое сканирование
          console.log('🔄 Автоматическое сканирование медиатеки...');
          const result = await scanMusic();
          
          await saveFoldersList(result.folders || []);
          await saveSongsList(result.songs || []);
          
          setInitialParams({ 
            folders: result.folders || [],
            songs: result.songs || [] 
          });
          setInitialRoute('Playlists');
        }
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
          initialParams={initialParams}
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
