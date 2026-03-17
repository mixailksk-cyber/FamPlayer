import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView } from 'react-native';
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
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [logs, setLogs] = useState([]);

  // Сразу показываем экран, никаких проверок файлов
  useEffect(() => {
    loadSavedFolder();
  }, []);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp} - ${message}`]);
    console.log(message);
  };

  const loadSavedFolder = async () => {
    try {
      const saved = await AsyncStorage.getItem('selected_folder');
      if (saved) {
        addLog(`📂 Загружена сохраненная папка: ${saved}`);
        setSelectedFolder(saved);
      }
    } catch (error) {
      addLog(`❌ Ошибка загрузки: ${error.message}`);
    }
  };

  // ==========================================
  // ШАГ 1: ТОЛЬКО ВЫБОР ПАПКИ
  // ==========================================
  
  const pickFolder = async () => {
    addLog('📁 Открытие выбора папки...');
    setLoading(true);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        // Получаем путь к папке (убираем имя файла)
        const folderUri = uri.substring(0, uri.lastIndexOf('/'));
        
        addLog(`✅ Папка выбрана: ${folderUri}`);
        setSelectedFolder(folderUri);
        await AsyncStorage.setItem('selected_folder', folderUri);
        
        Alert.alert('Успех', 'Папка выбрана. Теперь можно сканировать.');
      } else {
        addLog('❌ Выбор отменен');
      }
    } catch (error) {
      addLog(`❌ Ошибка выбора: ${error.message}`);
      Alert.alert('Ошибка', 'Не удалось выбрать папку');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ШАГ 2: СКАНИРОВАНИЕ ПАПКИ
  // ==========================================
  
  const scanFolder = async () => {
    if (!selectedFolder) {
      Alert.alert('Ошибка', 'Сначала выберите папку');
      return;
    }
    
    addLog(`🔍 Начало сканирования: ${selectedFolder}`);
    setLoading(true);
    
    try {
      // Очищаем путь от file:// если есть
      const cleanPath = selectedFolder.replace('file://', '');
      
      // Читаем содержимое папки
      addLog('📖 Чтение директории...');
      const items = await FileSystem.readDirectoryAsync(cleanPath);
      addLog(`📊 Найдено элементов: ${items.length}`);
      
      // Фильтруем только аудиофайлы
      const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac'];
      const audioFiles = [];
      const subfolders = [];
      
      for (const item of items) {
        const itemPath = `${cleanPath}/${item}`;
        const info = await FileSystem.getInfoAsync(itemPath);
        
        if (info.isDirectory) {
          // Это папка - сохраняем для плейлистов
          subfolders.push({
            id: itemPath,
            name: item,
            uri: `file://${itemPath}`,
          });
          addLog(`📁 Найдена папка: ${item}`);
        } else {
          // Это файл - проверяем расширение
          const ext = item.substring(item.lastIndexOf('.')).toLowerCase();
          if (audioExtensions.includes(ext)) {
            audioFiles.push({
              id: itemPath,
              title: item.replace(/\.[^/.]+$/, ""),
              filename: item,
              uri: `file://${itemPath}`,
              duration: 0,
            });
            addLog(`🎵 Найден аудиофайл: ${item}`);
          }
        }
      }
      
      addLog(`✅ Результат сканирования:`);
      addLog(`   - Папок: ${subfolders.length}`);
      addLog(`   - Аудиофайлов: ${audioFiles.length}`);
      
      // Сохраняем результаты
      await AsyncStorage.setItem('scanned_folders', JSON.stringify(subfolders));
      await AsyncStorage.setItem('scanned_songs', JSON.stringify(audioFiles));
      
      addLog('💾 Данные сохранены');
      
      // Переходим на экран плейлистов
      addLog('🚀 Переход на Playlists...');
      
      navigation.navigate('Playlists', {
        rootFolder: selectedFolder,
        settings,
        folders: subfolders,
        songs: audioFiles,
        songsCount: audioFiles.length
      });
      
    } catch (error) {
      addLog(`❌ Ошибка сканирования: ${error.message}`);
      Alert.alert('Ошибка', 'Не удалось просканировать папку');
    } finally {
      setLoading(false);
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
          
          <Text style={styles.title}>Настройки приложения</Text>
          
          <Text style={styles.subtitle}>
            Выберите папку с музыкой и отсканируйте её
          </Text>
          
          {/* Информация о выбранной папке */}
          {selectedFolder && (
            <View style={styles.folderInfo}>
              <MaterialIcons name="folder" size={20} color={brandColor} />
              <Text style={styles.folderPath} numberOfLines={2}>
                {selectedFolder}
              </Text>
              <TouchableOpacity onPress={pickFolder}>
                <MaterialIcons name="edit" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Кнопки */}
          <View style={styles.buttonGroup}>
            {/* Кнопка выбора папки */}
            <TouchableOpacity 
              style={[styles.folderButton, { borderColor: brandColor }]} 
              onPress={pickFolder}
              disabled={loading}
            >
              <MaterialIcons name="folder-open" size={24} color={brandColor} />
              <Text style={[styles.folderButtonText, { color: brandColor }]}>
                {selectedFolder ? 'Изменить папку' : 'Выбрать папку'}
              </Text>
            </TouchableOpacity>
            
            {/* Кнопка сканирования (активна только если выбрана папка) */}
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
          
          {/* Подсказка */}
          <Text style={styles.hint}>
            После сканирования вы перейдете к списку плейлистов
          </Text>
        </View>
        
        {/* Панель логов */}
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
  icon: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  
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
  
  hint: {
    marginTop: 20,
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
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
