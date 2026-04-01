import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Header } from './PL04_Components';
import { BRAND_COLOR } from './PL01_Core';

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || { brandColor: BRAND_COLOR };
  
  return (
    <View style={styles.container}>
      <Header 
        title="Настройки" 
        showBack 
        onBack={() => navigation.goBack()} 
        settings={settings} 
      />
      <View style={styles.content}>
        <Text style={styles.text}>Настройки в разработке</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, color: '#666' },
});
