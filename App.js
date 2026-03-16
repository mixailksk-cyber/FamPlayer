import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BRAND_COLOR } from './MP01_Core';
import * as FileSystem from './MP02_FileSystem';
import MP09_Navigation from './MP09_Navigation';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [rootFolder, setRootFolder] = useState(null);
  const [settingsState, setSettingsState] = useState({ 
    brandColor: BRAND_COLOR,
    sortBy: 'addedAt' // По умолчанию сортировка по дате добавления (новые сверху)
  });

  // Стабилизируем объект settings с useMemo
  const settings = useMemo(() => settingsState, [settingsState]);

  useEffect(() => {
    checkRootFolder();
  }, []);

  const checkRootFolder = async () => {
    const folder = await FileSystem.getRootFolder();
    setRootFolder(folder);
    setIsLoading(false);
  };

  const handleSortChange = useCallback((sortBy) => {
    setSettingsState(prev => ({ ...prev, sortBy }));
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar backgroundColor={BRAND_COLOR} barStyle="light-content" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
          <ActivityIndicator size="large" color={BRAND_COLOR} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor={settings.brandColor} barStyle="light-content" />
      <MP09_Navigation 
        rootFolder={rootFolder} 
        settings={settings}
        onSortChange={handleSortChange}
      />
    </SafeAreaProvider>
  );
}