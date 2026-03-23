import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppContent from './src/AppContent';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
