import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, 
  Alert, Platform, ScrollView, SafeAreaView, AppState 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header, EmailFooter } from './MP04_Components';
import { getBrandColor, AUTHOR_EMAIL, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';

// ============================================
// СИСТЕМА ОТЛАДКИ
// ============================================

const LOG_LEVELS = {
  DEBUG: '🔍',
  INFO: 'ℹ️',
  SUCCESS: '✅',
  WARN: '⚠️',
  ERROR: '❌',
  FATAL: '💥',
  NAV: '🧭',
  PERM: '🔐',
  FILE: '📁',
  AUDIO: '🎵',
  FOLDER: '📂'
};

class UltraLogger {
  static logs = [];
  static maxLogs = 500;
  
  static add(level, module, message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      level: level.icon || level,
      module,
      message,
      data: data ? JSON.stringify(data).substring(0, 200) : null
    };
    
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) this.logs.pop();
    
    const consoleMsg = `[${timestamp}] ${level.icon || level} [${module}] ${message}`;
    if (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.FATAL) {
      console.error(consoleMsg, data || '');
    } else {
      console.log(consoleMsg, data || '');
    }
    
    return logEntry;
  }
  
  static getLogs() {
    return this.logs;
  }
  
  static clear() {
    this.logs = [];
  }
}

// ============================================
// КОМПОНЕНТ ОТЛАДКИ
// ============================================

const DebugPanel = ({ logs, onClear, onCopy, visible = true }) => {
  if (!visible) return null;
  
  return (
    <View style={styles.debugPanel}>
      <View style={styles.debugHeader}>
        <Text style={styles.debugTitle}>🔧 ОТЛАДКА</Text>
        <View style={styles.debugButtons}>
          <TouchableOpacity onPress={onClear} style={styles.debugButton}>
            <Text style={styles.debugButtonText}>🧹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCopy} style={styles.debugButton}>
            <Text style={styles.debugButtonText}>📋</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.debugScroll}>
        {logs.map((log, index) => (
          <View key={index} style={styles.debugLine}>
            <Text style={styles.debugTimestamp}>{log.timestamp}</Text>
            <Text style={styles.debugLevel}>{log.level}</Text>
            <Text style={styles.debugModule}>[{log.module}]</Text>
            <Text style={styles.debugMessage}>{log.message}</Text>
            {log.data && <Text style={styles.debugData}> {log.data}</Text>}
          </View>
        ))}
        {logs.length === 0 && (
          <Text style={styles.debugEmpty}>Ожидание событий...</Text>
        )}
      </ScrollView>
    </View>
  );
};

// ============================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const [loading, setLoading] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderPath, setFolderPath] = useState('');
  const [logs, setLogs] = useState([]);
  const [appReady, setAppReady] = useState(false);
  const brandColor = getBrandColor(settings);
  
  const startTime = useRef(Date.now());

  // ==========================================
  // ОТЛАДОЧНЫЕ ФУНКЦИИ
  // ==========================================
  
  const log = (level, module, message, data = null) => {
    const entry = UltraLogger.add(level, module, message, data);
    setLogs(UltraLogger.getLogs());
    return entry;
  };

  // ==========================================
  // ИНИЦИАЛИЗАЦИЯ
  // ==========================================
  
  useEffect(() => {
    log(LOG_LEVELS.INFO, 'APP', '📱 Компонент SettingsScreen загружен');
    
    const init = async () => {
      await checkPermissions();
      await loadSavedFolder();
      setAppReady(true);
    };
    
    init();
  }, []);

  // ==========================================
  // ПРОВЕРКА РАЗРЕШЕНИЙ
  // ==========================================
  
  const checkPermissions = async () => {
    log(LOG_LEVELS.PERM, 'PERMISSION', '🔐 Проверка разрешений');
    
    if (IS_WEB_STUB) {
      log(LOG_LEVELS.WARN, 'PERMISSION', '🌐 Web режим');
      setHasPermission(true);
      setCheckingPermission(false);
      return;
    }

    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      log(LOG_LEVELS.PERM, 'PERMISSION', `📊 Статус: ${status}`);
      
      setHasPermission(status === 'granted');
    } catch (error) {
      log(LOG_LEVELS.ERROR, 'PERMISSION', '❌ Ошибка', error.message);
    } finally {
      setCheckingPermission(false);
    }
  };

  // ==========================================
  // ЗАГРУЗКА СОХРАНЕННОЙ ПАПКИ
  // ==========================================
  
  const loadSavedFolder = async () => {
    try {
      const saved = await AsyncStorage.getItem('selected_folder');
      if (saved) {
        setFolderPath(saved);
        log(LOG_LEVELS.FOLDER, 'FOLDER', '📂 Загружена сохраненная папка', saved);
      }
    } catch (error) {
      log(LOG_LEVELS.ERROR, 'FOLDER', '❌ Ошибка загрузки папки', error.message);
    }
  };

  // ==========================================
  // ЗАПРОС РАЗРЕШЕНИЙ
  // ==========================================
  
  const requestPermission = async () => {
    log(LOG_LEVELS.PERM, 'PERMISSION', '🔐 Запрос разрешений');
    setLoading(true);
    
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      log(LOG_LEVELS.PERM, 'PERMISSION', `📊 Результат: ${status}`);
      
      setHasPermission(status === 'granted');
    } catch (error) {
      log(LOG_LEVELS.ERROR, 'PERMISSION', '❌ Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ВЫБОР ПАПКИ
  // ==========================================
  
  const pickFolder = async () => {
    log(LOG_LEVELS.FOLDER, 'FOLDER', '📂 Начало выбора папки');
    setLoading(true);
    
    try {
      // Сначала проверяем разрешения
      if (!hasPermission) {
        log(LOG_LEVELS.WARN, 'FOLDER', '⚠️ Нет разрешений, запрашиваем');
        await requestPermission();
        if (!hasPermission) {
          Alert.alert('Ошибка', 'Необходим доступ к файлам');
          setLoading(false);
          return;
        }
      }

      // Используем DocumentPicker для выбора папки
      log(LOG_LEVELS.FOLDER, 'FOLDER', '📁 Открытие DocumentPicker');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      
      log(LOG_LEVELS.FOLDER, 'FOLDER', '📊 Результат выбора', result);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        // Получаем путь к папке (убираем имя файла)
        const folderUri = uri.substring(0, uri.lastIndexOf('/'));
        
        log(LOG_LEVELS.SUCCESS, 'FOLDER', '✅ Папка выбрана', folderUri);
        
        setSelectedFolder(folderUri);
        setFolderPath(folderUri);
        
        // Сохраняем в AsyncStorage
        await AsyncStorage.setItem('selected_folder', folderUri);
        log(LOG_LEVELS.FOLDER, 'FOLDER', '💾 Папка сохранена');
        
        Alert.alert('Успех', 'Папка выбрана');
      } else {
        log(LOG_LEVELS.INFO, 'FOLDER', 'ℹ️ Выбор отменен');
      }
      
    } catch (error) {
      log(LOG_LEVELS.ERROR, 'FOLDER', '❌ Ошибка выбора папки', error.message);
      Alert.alert('Ошибка', 'Не удалось выбрать папку');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // СКАНИРОВАНИЕ ПАПКИ
  // ==========================================
  
  const scanFolder = async () => {
    if (!selectedFolder && !folderPath) {
      Alert.alert('Ошибка', 'Сначала выберите папку');
      return;
    }
    
    const folderToScan = selectedFolder || folderPath;
    log(LOG_LEVELS.AUDIO, 'SCAN', '🔍 Начало сканирования папки', folderToScan);
    setLoading(true);
    
    try {
      // Очищаем путь от file:// если есть
      const cleanPath = folderToScan.replace('file://', '');
      
      // Читаем содержимое папки
      log(LOG_LEVELS.AUDIO, 'SCAN', '📁 Чтение директории');
      const items = await FileSystem.readDirectoryAsync(cleanPath);
      
      log(LOG_LEVELS.AUDIO, 'SCAN', `📊 Найдено элементов: ${items.length}`);
      
      // Фильтруем аудиофайлы
      const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac'];
      const audioFiles = [];
      
      for (const item of items) {
        const itemPath = `${cleanPath}/${item}`;
        const info = await FileSystem.getInfoAsync(itemPath);
        
        if (!info.isDirectory) {
          const ext = item.substring(item.lastIndexOf('.')).toLowerCase();
          if (audioExtensions.includes(ext)) {
            audioFiles.push({
              id: itemPath,
              title: item,
              uri: `file://${itemPath}`,
              duration: 0,
            });
          }
        }
      }
      
      log(LOG_LEVELS.SUCCESS, 'SCAN', `✅ Найдено аудиофайлов: ${audioFiles.length}`);
      
      if (audioFiles.length > 0) {
        // Сохраняем список файлов
        await AsyncStorage.setItem('scanned_songs', JSON.stringify(audioFiles));
        log(LOG_LEVELS.SUCCESS, 'SCAN', '💾 Список файлов сохранен');
        
        // Переходим к списку плейлистов
        log(LOG_LEVELS.NAV, 'NAV', '🚀 Переход на Playlists');
        
        navigation.navigate('Playlists', {
          rootFolder: folderToScan,
          settings,
          songsCount: audioFiles.length,
          songs: audioFiles
        });
      } else {
        Alert.alert('Информация', 'В выбранной папке нет аудиофайлов');
      }
      
    } catch (error) {
      log(LOG_LEVELS.ERROR, 'SCAN', '❌ Ошибка сканирования', error.message);
      Alert.alert('Ошибка', 'Не удалось просканировать папку');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ОТЛАДОЧНЫЕ ДЕЙСТВИЯ
  // ==========================================
  
  const clearLogs = () => {
    UltraLogger.clear();
    setLogs([]);
  };

  const copyLogs = () => {
    const logText = logs.map(l => 
      `${l.timestamp} ${l.level} [${l.module}] ${l.message}${l.data ? ' ' + l.data : ''}`
    ).join('\n');
    
    console.log('=== КОПИЯ ЛОГОВ ===\n' + logText + '\n=== КОНЕЦ ЛОГОВ ===');
    Alert.alert('Готово', 'Логи скопированы в консоль');
  };

  // ==========================================
  // РЕНДЕРИНГ
  // ==========================================
  
  if (!appReady || checkingPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Настройки" showBack onBack={() => navigation.goBack()} settings={settings} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={styles.permissionText}>Загрузка...</Text>
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
          <MaterialIcons name="folder-open" size={64} color={brandColor} style={styles.icon} />
          
          <Text style={styles.title}>Выбор папки с музыкой</Text>
          
          <Text style={styles.subtitle}>
            Выберите папку, в которой находятся ваши музыкальные файлы
          </Text>
          
          {/* Индикатор разрешений */}
          <View style={styles.statusContainer}>
            <MaterialIcons 
              name={hasPermission ? "check-circle" : "error"} 
              size={20} 
              color={hasPermission ? "#4CAF50" : "#FF6B6B"} 
            />
            <Text style={[styles.statusText, hasPermission ? styles.successText : styles.errorText]}>
              {hasPermission ? 'Доступ к файлам разрешен' : 'Требуется доступ к файлам'}
            </Text>
          </View>
          
          {/* Отображение выбранной папки */}
          {(selectedFolder || folderPath) ? (
            <View style={styles.folderInfo}>
              <MaterialIcons name="folder" size={16} color={brandColor} />
              <Text style={styles.folderPath} numberOfLines={2}>
                {selectedFolder || folderPath}
              </Text>
            </View>
          ) : null}
          
          {/* Кнопки действий */}
          <View style={styles.buttonContainer}>
            {/* Кнопка выбора папки */}
            <TouchableOpacity 
              style={[styles.folderButton, { borderColor: brandColor }]} 
              onPress={pickFolder}
              disabled={loading}
            >
              <MaterialIcons name="folder" size={24} color={brandColor} />
              <Text style={[styles.folderButtonText, { color: brandColor }]}>
                Выбрать папку
              </Text>
            </TouchableOpacity>
            
            {/* Кнопка сканирования (активна только если выбрана папка) */}
            {(selectedFolder || folderPath) && (
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
            
            {/* Кнопка запроса разрешений (если нет доступа) */}
            {!hasPermission && (
              <TouchableOpacity 
                style={styles.permissionButton} 
                onPress={requestPermission}
                disabled={loading}
              >
                <MaterialIcons name="security" size={20} color="#666" />
                <Text style={styles.permissionButtonText}>Запросить разрешения</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Панель отладки */}
        <DebugPanel 
          logs={logs} 
          onClear={clearLogs} 
          onCopy={copyLogs}
        />
      </ScrollView>
      
      <EmailFooter email={AUTHOR_EMAIL} />
    </SafeAreaView>
  );
}

// ============================================
// СТИЛИ
// ============================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollView: { flex: 1 },
  content: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  icon: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  statusText: { marginLeft: 8, fontSize: 14, flex: 1 },
  successText: { color: '#4CAF50' },
  errorText: { color: '#FF6B6B' },
  
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
  
  buttonContainer: { width: '100%', gap: 12 },
  
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
  
  demoBanner: { 
    backgroundColor: '#FFD700', 
    padding: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  demoText: { color: '#333', fontSize: 12, fontWeight: '600' },
  permissionText: { marginTop: 16, color: '#666', fontSize: 14 },
  
  // Панель отладки
  debugPanel: {
    backgroundColor: '#1A1A1A',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 300,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#333',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  debugTitle: { color: '#FFA500', fontSize: 12, fontWeight: 'bold' },
  debugButtons: { flexDirection: 'row' },
  debugButton: { marginLeft: 8, padding: 4 },
  debugButtonText: { fontSize: 16 },
  debugScroll: { padding: 8, maxHeight: 250 },
  debugLine: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginVertical: 2,
    backgroundColor: '#222',
    padding: 4,
    borderRadius: 4,
  },
  debugTimestamp: { color: '#888', fontSize: 9, marginRight: 4 },
  debugLevel: { fontSize: 9, marginRight: 4, minWidth: 18 },
  debugModule: { color: '#FFA500', fontSize: 9, marginRight: 4 },
  debugMessage: { color: '#FFF', fontSize: 9, flex: 1 },
  debugData: { color: '#4CAF50', fontSize: 8 },
  debugEmpty: { color: '#666', fontSize: 12, textAlign: 'center', padding: 20 },
});
