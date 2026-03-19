import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Header } from './MP04_Components';
import { getBrandColor, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';
import { scanMusic, saveFoldersList, saveSongsList } from './MP02_FileSystem';

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const brandColor = getBrandColor(settings);
  
  const [scanning, setScanning] = useState(false);

  const handleScanMusic = async () => {
    if (scanning) return;
    
    setScanning(true);
    
    try {
      const result = await scanMusic();
      
      await saveFoldersList(result.folders || []);
      await saveSongsList(result.songs || []);
      
      navigation.replace('Playlists', {
        folders: result.folders || [],
        songs: result.songs || [],
      });
      
    } catch (error) {
      Alert.alert('Ошибка', error.message);
      setScanning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Настройки" 
        showBack 
        onBack={() => navigation.goBack()} 
        settings={settings} 
      />
      
      {IS_WEB_STUB && (
        <View style={styles.demoBanner}>
          <MaterialIcons name="info" size={16} color="#333" />
          <Text style={styles.demoText}> {WEB_STUB_MESSAGE}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <MaterialIcons name="settings" size={80} color={brandColor} style={styles.icon} />
        
        <Text style={styles.title}>Обновление медиатеки</Text>
        
        <Text style={styles.description}>
          При сканировании будут найдены все аудиофайлы на устройстве и сгруппированы по альбомам.
        </Text>
        
        <TouchableOpacity 
          style={[styles.scanButton, { backgroundColor: brandColor }]} 
          onPress={handleScanMusic}
          disabled={scanning}
        >
          {scanning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="refresh" size={24} color="white" />
              <Text style={styles.scanButtonText}>Обновить медиатеку</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  icon: { marginBottom: 24 },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    textAlign: 'center', 
    color: '#333' 
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 3,
    width: '100%',
    maxWidth: 280,
  },
  scanButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 10 
  },
  demoBanner: { 
    backgroundColor: '#FFD700', 
    padding: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  demoText: { color: '#333', fontSize: 12, fontWeight: '600' },
});
