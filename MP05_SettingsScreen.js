import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header, EmailFooter } from './MP04_Components';
import { getBrandColor, AUTHOR_EMAIL, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const brandColor = getBrandColor(settings);
  
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isReady, setIsReady] = useState(true); // Сразу готов

  // ==========================================
  // ЛОГИРОВАНИЕ
  // ==========================================
  
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp} - ${message}`]);
    console.log(message);
  };

  // ==========================================
  // ЗАГРУЗКА СОХРАНЕННОЙ ПАПКИ
  // ==========================================
  
  useEffect(() => {
    loadSavedFolder();
  }, []);

  const loadSavedFolder = async () => {
    try {
      const saved = await AsyncStorage.getItem('selected_folder');
      if (saved) {
        addLog(`📂 Загружена папка: ${saved}`);
        setSelectedFolder(saved);
      }
    } catch (error) {
      addLog(`❌ Ошибка загрузки: ${error.message}`);
    }
  };

  // ==========================================
  // ВЫБОР ПАПКИ
  // ==========================================
  
  const pickFolder = async () => {
    addLog('📁 Выбор папки...');
    setLoading(true);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        const folderUri = uri.substring(0, uri.lastIndexOf('/'));
        
        addLog(`✅ Выбрана: ${folderUri}`);
        setSelectedFolder(folderUri);
        await AsyncStorage.setItem('selected_folder', folderUri);
      }
    } catch (error) {
      addLog(`❌ Ошибка: ${error.message}`);
      Alert.alert('Ошибка', 'Не удалось выбрать папку');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // СКАНИРОВАНИЕ С ЗАЩИТОЙ ОТ ДВОЙНОГО НАЖАТИЯ
  // ==========================================
  
  const scanFolder = async () => {
    // Защита от двойного нажатия
    if (scanning) {
      addLog('⚠️ Сканирование уже выполняется');
      return;
    }
    
    if (!selectedFolder) {
      Alert.alert('Ошибка', 'Сначала выберите папку');
      return;
    }
    
    addLog(`🔍 Начало сканирования: ${selectedFolder}`);
    setScanning(true);
    
    try {
      const cleanPath = selectedFolder.replace('file://', '');
      
      // Таймаут на случай зависания
      const scanPromise = performScan(cleanPath);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Таймаут сканирования')), 30000)
      );
      
      const result = await Promise.race([scanPromise, timeoutPromise]);
      
      addLog(`✅ Сканирование завершено: ${result.folders.length} папок, ${result.songs.length} файлов`);
      
      // Сохраняем с подтверждением
      await saveScanResults(result);
      
      // Проверяем, что экран существует
      const routes = navigation.getState()?.routes.map(r => r.name) || [];
      addLog(`📋 Доступные экраны: ${routes.join(', ')}`);
      
      if (!routes.includes('Playlists')) {
        throw new Error('Экран Playlists не зарегистрирован в навигации');
      }
      
      // Переход с задержкой для гарантии сохранения
      setTimeout(() => {
        navigation.replace('Playlists', {
          scanTimestamp: Date.now(),
          foldersCount: result.folders.length,
          songsCount: result.songs.length
        });
        addLog('🚀 Переход выполнен');
      }, 300);
      
    } catch (error) {
      addLog(`❌ Ошибка сканирования: ${error.message}`);
      Alert.alert('Ошибка', `Не удалось просканировать папку: ${error.message}`);
      setScanning(false);
    }
  };

  // ==========================================
  // ЛОГИКА СКАНИРОВАНИЯ
  // ==========================================
  
  const performScan = async (cleanPath) => {
    addLog('📖 Чтение директории...');
    const items = await FileSystem.readDirectoryAsync(cleanPath);
    addLog(`📊 Найдено элементов: ${items.length}`);
    
    const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac'];
    const folders = [];
    const songs = [];
    
    for (const item of items) {
      const itemPath = `${cleanPath}/${item}`;
      const info = await FileSystem.getInfoAsync(itemPath);
      
      if (info.isDirectory) {
        folders.push({
          id: itemPath,
          name: item,
          uri: `file://${itemPath}`,
        });
        addLog(`📁 Папка: ${item}`);
      } else {
        const ext = item.substring(item.lastIndexOf('.')).toLowerCase();
        if (audioExtensions.includes(ext)) {
          songs.push({
            id: itemPath,
            title: item.replace(/\.[^/.]+$/, ""),
            filename: item,
            uri: `file://${itemPath}`,
            addedAt: Date.now(),
          });
          addLog(`🎵 Файл: ${item}`);
        }
      }
    }
    
    return { folders, songs };
  };

  // ==========================================
  // СОХРАНЕНИЕ С ПОДТВЕРЖДЕНИЕМ
  // ==========================================
  
  const saveScanResults = async (result) => {
    addLog('💾 Сохранение данных...');
    
    // Сохраняем с подтверждением
    await AsyncStorage.setItem('scanned_folders', JSON.stringify(result.folders));
    await AsyncStorage.setItem('scanned_songs', JSON.stringify(result.songs));
    await AsyncStorage.setItem('scan_timestamp', Date.now().toString());
    
    // Проверяем, что сохранилось
    const savedFolders = await AsyncStorage.getItem('scanned_folders');
    const savedSongs = await AsyncStorage.getItem('scanned_songs');
    
    if (!savedFolders || !savedSongs) {
      throw new Error('Данные не сохранились');
    }
    
    addLog(`✅ Сохранено: ${JSON.parse(savedFolders).length} папок, ${JSON.parse(savedSongs).length} файлов`);
  };

  // ==========================================
  // РЕНДЕРИНГ
  // ==========================================
  
  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      </SafeAreaView>
    );
  }

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
          
          <Text style={styles.title}>Настройки приложения</Text>
          
          {selectedFolder && (
            <View style={styles.folderInfo}>
              <MaterialIcons name="folder" size={20} color={brandColor} />
              <Text style={styles.folderPath} numberOfLines={2}>
                {selectedFolder}
              </Text>
              <TouchableOpacity onPress={pickFolder} disabled={loading}>
                <MaterialIcons name="edit" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.folderButton, { borderColor: brandColor }]} 
              onPress={pickFolder}
              disabled={loading || scanning}
            >
              <MaterialIcons name="folder-open" size={24} color={brandColor} />
              <Text style={[styles.folderButtonText, { color: brandColor }]}>
                {selectedFolder ? 'Изменить папку' : 'Выбрать папку'}
              </Text>
            </TouchableOpacity>
            
            {selectedFolder && (
              <TouchableOpacity 
                style={[styles.scanButton, { backgroundColor: brandColor }]} 
                onPress={scanFolder}
                disabled={scanning}
              >
                {scanning ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="search" size={24} color="white" />
                    <Text style={styles.scanButtonText}>Сканировать папку</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.logPanel}>
          <Text style={styles.logTitle}>📋 Логи:</Text>
          {logs.map((log, i) => (
            <Text key={i} style={styles.logLine}>{log}</Text>
          ))}
          {logs.length === 0 && (
            <Text style={styles.logEmpty}>Ожидание действий...</Text>
          )}
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
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  icon: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  folderPath: { marginLeft: 8, fontSize: 12, color: '#333', flex: 1 },
  
  buttonGroup: { width: '100%', gap: 12 },
  
  folderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    width: '100%',
  },
  folderButtonText: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  
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
  logEmpty: { color: '#666', fontSize: 12, textAlign: 'center', padding: 10 },
});
