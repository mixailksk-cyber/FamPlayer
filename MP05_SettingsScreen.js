import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header, EmailFooter } from './MP04_Components';
import { getBrandColor, AUTHOR_EMAIL, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const brandColor = getBrandColor(settings);
  
  // Состояния
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [logs, setLogs] = useState([]);

  // ==========================================
  // ИНИЦИАЛИЗАЦИЯ С ТАЙМАУТОМ
  // ==========================================
  
  useEffect(() => {
    // Таймаут для гарантированной загрузки
    const timer = setTimeout(() => {
      initializeApp();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const initializeApp = async () => {
    addLog('🔧 Инициализация...');
    
    try {
      // Проверяем разрешения
      if (!IS_WEB_STUB) {
        const { status } = await MediaLibrary.getPermissionsAsync();
        addLog(`📊 Статус разрешений: ${status}`);
        setHasPermission(status === 'granted');
      }
      
      // Загружаем сохраненную папку
      const saved = await AsyncStorage.getItem('selected_folder');
      if (saved) {
        addLog(`📂 Загружена папка: ${saved}`);
        setSelectedFolder(saved);
      }
      
    } catch (error) {
      addLog(`❌ Ошибка: ${error.message}`);
    } finally {
      // Принудительно устанавливаем isReady через 500мс
      setTimeout(() => {
        addLog('✅ Приложение готово');
        setIsReady(true);
      }, 500);
    }
  };

  // ==========================================
  // ЛОГИРОВАНИЕ
  // ==========================================
  
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp} - ${message}`]);
    console.log(message);
  };

  // ==========================================
  // ЗАПРОС РАЗРЕШЕНИЙ
  // ==========================================
  
  const requestPermission = async () => {
    addLog('🔐 Запрос разрешений...');
    setLoading(true);
    
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      addLog(`📊 Результат: ${status}`);
      setHasPermission(status === 'granted');
    } catch (error) {
      addLog(`❌ Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
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
  // СКАНИРОВАНИЕ
  // ==========================================
  
  const scanFolder = async () => {
    if (!selectedFolder) {
      Alert.alert('Ошибка', 'Сначала выберите папку');
      return;
    }
    
    addLog('🔍 Сканирование...');
    setLoading(true);
    
    try {
      const cleanPath = selectedFolder.replace('file://', '');
      const items = await FileSystem.readDirectoryAsync(cleanPath);
      
      const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac'];
      const audioFiles = [];
      
      for (const item of items) {
        const ext = item.substring(item.lastIndexOf('.')).toLowerCase();
        if (audioExtensions.includes(ext)) {
          audioFiles.push({
            id: `${cleanPath}/${item}`,
            title: item,
            uri: `file://${cleanPath}/${item}`,
          });
        }
      }
      
      addLog(`✅ Найдено: ${audioFiles.length} файлов`);
      
      if (audioFiles.length > 0) {
        await AsyncStorage.setItem('scanned_songs', JSON.stringify(audioFiles));
        
        // Переход с задержкой
        setTimeout(() => {
          navigation.navigate('Playlists', {
            rootFolder: selectedFolder,
            settings,
            songsCount: audioFiles.length
          });
        }, 300);
      }
    } catch (error) {
      addLog(`❌ Ошибка: ${error.message}`);
      Alert.alert('Ошибка', 'Не удалось просканировать папку');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // РЕНДЕРИНГ
  // ==========================================
  
  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={styles.loadingText}>Загрузка приложения...</Text>
          <Text style={styles.logText}>{logs[logs.length - 1] || ''}</Text>
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
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <MaterialIcons name="folder-open" size={64} color={brandColor} style={styles.icon} />
          
          <Text style={styles.title}>Выбор папки с музыкой</Text>
          
          <View style={styles.statusContainer}>
            <MaterialIcons 
              name={hasPermission ? "check-circle" : "error"} 
              size={20} 
              color={hasPermission ? "#4CAF50" : "#FF6B6B"} 
            />
            <Text style={styles.statusText}>
              {hasPermission ? 'Доступ разрешен' : 'Доступ не предоставлен'}
            </Text>
          </View>
          
          {selectedFolder && (
            <View style={styles.folderInfo}>
              <MaterialIcons name="folder" size={16} color={brandColor} />
              <Text style={styles.folderPath} numberOfLines={2}>
                {selectedFolder}
              </Text>
            </View>
          )}
          
          <View style={styles.buttonGroup}>
            {!hasPermission && (
              <TouchableOpacity 
                style={[styles.permissionButton]} 
                onPress={requestPermission}
                disabled={loading}
              >
                <MaterialIcons name="security" size={20} color="#666" />
                <Text style={styles.permissionButtonText}>Разрешить доступ</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.folderButton, { borderColor: brandColor }]} 
              onPress={pickFolder}
              disabled={loading}
            >
              <MaterialIcons name="folder" size={24} color={brandColor} />
              <Text style={[styles.folderButtonText, { color: brandColor }]}>
                {selectedFolder ? 'Изменить папку' : 'Выбрать папку'}
              </Text>
            </TouchableOpacity>
            
            {selectedFolder && (
              <TouchableOpacity 
                style={[styles.scanButton, { backgroundColor: brandColor }]} 
                onPress={scanFolder}
                disabled={loading}
              >
                {loading ? (
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
        
        {/* Панель логов */}
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
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  icon: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  loadingText: { marginTop: 16, color: '#666', fontSize: 14 },
  logText: { marginTop: 8, color: '#999', fontSize: 12 },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  statusText: { marginLeft: 8, fontSize: 14, color: '#333' },
  
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
  
  buttonGroup: { width: '100%', gap: 10 },
  
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
  
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  permissionButtonText: { color: '#666', fontSize: 14, marginLeft: 8 },
  
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
