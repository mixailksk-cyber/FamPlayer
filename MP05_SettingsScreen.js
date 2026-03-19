import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header, EmailFooter } from './MP04_Components';
import { getBrandColor, AUTHOR_EMAIL, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';
import * as FileSystem from './MP02_FileSystem'; // ВАЖНО: добавлен этот импорт

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const brandColor = getBrandColor(settings);
  
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [scanMode, setScanMode] = useState(FileSystem.SCAN_MODES.MEDIA); // По умолчанию MEDIA
  const [logs, setLogs] = useState([]);
  const [isReady, setIsReady] = useState(true);

  const addLog = (message, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? '❌' : '📌';
    setLogs(prev => [...prev, `${timestamp} - ${prefix} ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedFolder = await AsyncStorage.getItem('selected_folder');
      if (savedFolder) {
        addLog(`Загружена папка: ${savedFolder}`);
        setSelectedFolder(savedFolder);
      }
      
      const savedMode = await FileSystem.getScanMode();
      setScanMode(savedMode);
      addLog(`Режим сканирования: ${savedMode === FileSystem.SCAN_MODES.MEDIA ? 'Медиатека' : 'Выбор папки'}`);
      
    } catch (error) {
      addLog(`Ошибка загрузки: ${error.message}`, true);
    }
  };

  const toggleScanMode = async () => {
    const newMode = scanMode === FileSystem.SCAN_MODES.FOLDER 
      ? FileSystem.SCAN_MODES.MEDIA 
      : FileSystem.SCAN_MODES.FOLDER;
    
    setScanMode(newMode);
    await FileSystem.saveScanMode(newMode);
    addLog(`Режим изменен: ${newMode === FileSystem.SCAN_MODES.MEDIA ? 'Медиатека' : 'Выбор папки'}`);
  };

  const pickFolder = async () => {
    addLog('Выбор папки...');
    setLoading(true);
    
    try {
      const folderUri = await FileSystem.pickFolder();
      
      if (folderUri) {
        addLog(`Выбрана: ${folderUri}`);
        setSelectedFolder(folderUri);
        await AsyncStorage.setItem('selected_folder', folderUri);
      } else {
        addLog('Выбор отменен');
      }
    } catch (error) {
      addLog(`Ошибка: ${error.message}`, true);
      Alert.alert('Ошибка', 'Не удалось выбрать папку');
    } finally {
      setLoading(false);
    }
  };

  const scanMusic = async () => {
    if (scanning) {
      addLog('Сканирование уже выполняется', true);
      return;
    }
    
    if (scanMode === FileSystem.SCAN_MODES.FOLDER && !selectedFolder) {
      Alert.alert('Ошибка', 'Сначала выберите папку');
      return;
    }
    
    addLog(`Начало сканирования (${scanMode === FileSystem.SCAN_MODES.MEDIA ? 'Медиатека' : 'Файловая система'})...`);
    setScanning(true);
    
    try {
      const result = await FileSystem.scanMusic(scanMode, selectedFolder);
      
      addLog(`✅ Найдено: ${result.folders?.length || 0} папок/альбомов, ${result.songs?.length || 0} файлов`);
      
      if (result.stats) {
        addLog(`📊 Статистика: всего ${result.stats.total} файлов в медиатеке`);
      }
      
      await AsyncStorage.setItem('scanned_folders', JSON.stringify(result.folders || []));
      await AsyncStorage.setItem('scanned_songs', JSON.stringify(result.songs || []));
      await AsyncStorage.setItem('scan_timestamp', Date.now().toString());
      await AsyncStorage.setItem('scan_mode', scanMode);
      
      setTimeout(() => {
        navigation.replace('Playlists', {
          scanTimestamp: Date.now(),
          foldersCount: result.folders?.length || 0,
          songsCount: result.songs?.length || 0,
          scanMode: scanMode
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
          
          <Text style={styles.title}>Настройки сканирования</Text>
          
          {/* Переключатель режимов */}
          <View style={styles.modeSelector}>
            <Text style={styles.modeLabel}>Режим сканирования:</Text>
            <View style={styles.modeButtons}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  scanMode === FileSystem.SCAN_MODES.FOLDER && styles.modeButtonActive,
                  { borderColor: brandColor }
                ]}
                onPress={toggleScanMode}
              >
                <MaterialIcons 
                  name="folder" 
                  size={20} 
                  color={scanMode === FileSystem.SCAN_MODES.FOLDER ? brandColor : '#999'} 
                />
                <Text style={[
                  styles.modeButtonText,
                  scanMode === FileSystem.SCAN_MODES.FOLDER && { color: brandColor }
                ]}>
                  Выбор папки
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  scanMode === FileSystem.SCAN_MODES.MEDIA && styles.modeButtonActive,
                  { borderColor: brandColor }
                ]}
                onPress={toggleScanMode}
              >
                <MaterialIcons 
                  name="library-music" 
                  size={20} 
                  color={scanMode === FileSystem.SCAN_MODES.MEDIA ? brandColor : '#999'} 
                />
                <Text style={[
                  styles.modeButtonText,
                  scanMode === FileSystem.SCAN_MODES.MEDIA && { color: brandColor }
                ]}>
                  Медиатека
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Информация о режиме */}
          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={16} color={brandColor} />
            <Text style={styles.infoText}>
              {scanMode === FileSystem.SCAN_MODES.MEDIA 
                ? 'Быстрое сканирование всей медиатеки. Работает с внутренней памятью.'
                : 'Ручной выбор папки. Подходит для внешних SD-карт, но может быть медленнее.'}
            </Text>
          </View>
          
          {/* Выбор папки (только для режима FOLDER) */}
          {scanMode === FileSystem.SCAN_MODES.FOLDER && (
            <>
              {selectedFolder && (
                <View style={styles.folderInfo}>
                  <MaterialIcons name="folder" size={20} color={brandColor} />
                  <Text style={styles.folderPath} numberOfLines={2}>
                    {selectedFolder}
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={[styles.folderButton, { borderColor: brandColor }]} 
                onPress={pickFolder}
                disabled={loading || scanning}
              >
                {loading ? (
                  <ActivityIndicator color={brandColor} />
                ) : (
                  <>
                    <MaterialIcons name="folder-open" size={24} color={brandColor} />
                    <Text style={[styles.folderButtonText, { color: brandColor }]}>
                      {selectedFolder ? 'Изменить папку' : 'Выбрать папку'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
          
          {/* Кнопка сканирования */}
          <TouchableOpacity 
            style={[styles.scanButton, { backgroundColor: brandColor }]} 
            onPress={scanMusic}
            disabled={scanning || (scanMode === FileSystem.SCAN_MODES.FOLDER && !selectedFolder)}
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
  
  modeSelector: {
    width: '100%',
    marginBottom: 20,
  },
  modeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#F0F8FF',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#999',
  },
  
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
  
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  folderPath: { marginLeft: 8, fontSize: 12, color: '#333', flex: 1 },
  
  folderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    width: '100%',
    marginBottom: 12,
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
});
