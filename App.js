import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BRAND_COLOR } from './MP01_Core';
import MP09_Navigation from './MP09_Navigation';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [settings] = useState({ brandColor: BRAND_COLOR });

  useEffect(() => {
    // Просто даем приложению время на инициализацию
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
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
      <MP09_Navigation settings={settings} />
    </SafeAreaProvider>
  );
}
