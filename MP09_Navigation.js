import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// Импортируем все экраны явно
import MP05_SettingsScreen from './MP05_SettingsScreen';
import MP06_PlaylistsScreen from './MP06_PlaylistsScreen';
import MP07_FolderScreen from './MP07_FolderScreen';
import MP20_SearchScreen from './MP20_SearchScreen';

const Stack = createStackNavigator();

export default function AppNavigator({ rootFolder, settings = {} }) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!rootFolder ? (
          // Если папка не выбрана, показываем только настройки
          <Stack.Screen
            name="Settings"
            component={MP05_SettingsScreen}
            // Передаем settings через initialParams, как просит документация
            initialParams={{ settings: settings }}
          />
        ) : (
          // Если папка выбрана, показываем все экраны
          <>
            <Stack.Screen name="Playlists">
              {props => <MP06_PlaylistsScreen {...props} rootFolder={rootFolder} settings={settings} />}
            </Stack.Screen>
            <Stack.Screen name="Folder">
              {props => <MP07_FolderScreen {...props} rootFolder={rootFolder} settings={settings} />}
            </Stack.Screen>
            {/* Экран настроек — он будет получать settings через route.params */}
            <Stack.Screen
              name="Settings"
              component={MP05_SettingsScreen}
              initialParams={{ settings: settings }}
            />
            <Stack.Screen name="Search">
              {props => <MP20_SearchScreen {...props} rootFolder={rootFolder} settings={settings} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}