import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header, EmailFooter } from './MP04_Components';
import { getBrandColor, AUTHOR_EMAIL, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';
import { scanMusic, saveFoldersList, saveSongsList } from './MP02_FileSystem';

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const brandColor = getBrandColor(settings);
  
  const [scanning, setScanning] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? '❌' : '📌';
    setLogs(prev => [...prev, `${timestamp} - ${prefix} ${message}`]);
    console.log(message);
  };

  const handleScanMusic = async () => {
    if (scanning) {
      addLog('Сканирование уже выполняется', true);
      return;
    }
    
    addLog('Начало сканирования медиатеки...');
    setScanning(true);
    
    try {
      const result = await scanMusic();
      
      addLog(`✅ Найдено: ${result.folders?.length || 0} папок/альбомов, ${result.songs?.length || 0} треков`);
      
      if (result.stats) {
        addLog(`📊 Статистика: всего ${result.stats.total} треков в медиатеке`);
      }
      
      await saveFoldersList(result.folders || []);
      await saveSongsList(result.songs || []);
      await AsyncStorage.setItem('scan_timestamp', Date.now().toString());
      
      setTimeout(() => {
        navigation.replace('Playlists', {
          scanTimestamp: Date.now(),
          foldersCount: result.folders?.length || 0,
          songsCount: result.songs?.length || 0
        });
        addLog('🚀 Переход выполнен');
      }, 300);
      
    } catch (error) {
      addLog(`❌ Ошибка сканирования: ${error.message}`, true);
      Alert.alert('Ошибка', error.message);
    } finally {
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
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <MaterialIcons name="settings" size={64} color={brandColor} style={styles.icon} />
          
          <Text style={styles.title}>Медиатека</Text>
          
          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={16} color={brandColor} />
            <Text style={styles.infoText}>
              Сканирование всей медиатеки устройства. Будут найдены все аудиофайлы и сгруппированы по альбомам.
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.scanButton, { backgroundColor: brandColor }]} 
            onPress={handleScanMusic}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="search" size={24} color="white" />
                <Text style={styles.scanButtonText}>Начать сканирование</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.logPanel}>
          <Text style={styles.logTitle}>📋 Логи:</Text>
          {logs.map((log, i) => (
            <Text key={i} style={styles.logLine}>{log}</Text>
          ))}
        </View>
      </ScrollView>
      
      <EmailFooter email={AUTHOR_EMAIL} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollView: { flex: 1 },
  content: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  icon: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    elevation: 3,
  },
  scanButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  
  demoBanner: { 
    backgroundColor: '#FFD700', 
    padding: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  demoText: { color: '#333', fontSize: 12, fontWeight: '600' },
  
  logPanel: {
    backgroundColor: '#1A1A1A',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
  },
  logTitle: { color: '#FFA500', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  logLine: { color: '#0F0', fontSize: 10, fontFamily: 'monospace', marginVertical: 2 },
});
