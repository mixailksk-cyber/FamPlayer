import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PlayerApp from './src/PL00_PlayerApp';

export default function App() {
  return (
    <SafeAreaProvider>
      <PlayerApp />
    </SafeAreaProvider>
  );
}
