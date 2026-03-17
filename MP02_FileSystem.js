import { Platform, Alert, PermissionsAndroid, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { APP_FAVORITES_NAME, TRASH_FOLDER_NAME, IS_WEB_STUB } from './MP01_Core';

// Демо-данные для Snack
const DEMO_ROOT = 'demo://root';
const DEMO_FOLDERS = [
  { id: 'folder1', name: 'Жатва', uri: 'demo://root/Жатва' },
  { id: 'folder2', name: 'Пасха', uri: 'demo://root/Пасха' },
  { id: 'folder3', name: 'Корзина', uri: 'demo://root/Корзина', isSystem: true },
];

const DEMO_SONGS = [
  { id: '1', title: 'sdvsd.mp3', uri: 'demo://root/sdvsd.mp3', folder: APP_FAVORITES_NAME, addedAt: Date.now() - 100000 },
  { id: '2', title: 'sfdb.mp3', uri: 'demo://root/sfdb.mp3', folder: APP_FAVORITES_NAME, addedAt: Date.now() - 90000 },
  { id: '3', title: 'sdvs.mp3', uri: 'demo://root/sdvs.mp3', folder: APP_FAVORITES_NAME, addedAt: Date.now() - 80000 },
  { id: '4', title: '1.mp3', uri: 'demo://root/Жатва/1.mp3', folder: 'Жатва', addedAt: Date.now() - 70000 },
  { id: '5', title: '2.mp3', uri: 'demo://root/Жатва/2.mp3', folder: 'Жатва', addedAt: Date.now() - 60000 },
  { id: '6', title: 'df.mp3', uri: 'demo://root/Пасха/df.mp3', folder: 'Пасха', addedAt: Date.now() - 50000 },
  { id: '7', title: 'kjnj.mp3', uri: 'demo://root/Пасха/kjnj.mp3', folder: 'Пасха', addedAt: Date.now() - 40000 },
  { id: '8', title: '7.mp3', uri: 'demo://root/Корзина/7.mp3', folder: TRASH_FOLDER_NAME, addedAt: Date.now() - 30000 },
  { id: '9', title: '8.mp3', uri: 'demo://root/Корзина/8.mp3', folder: TRASH_FOLDER_NAME, addedAt: Date.now() - 20000 },
];

const ROOT_FOLDER_KEY = '@root_folder';
const FOLDER_COLORS_KEY = '@folder_colors';

// ДИАГНОСТИКА: логирование всех действий
const log = (message, data = '') => {
  console.log(`[FileSystem Debug] ${message}`, data);
};

// Проверка версии Android
const isAndroid11OrHigher = () => {
  const result = Platform.OS === 'android' && Platform.Version >= 30;
  log(`Android version check: OS=${Platform.OS}, version=${Platform.Version}, is11OrHigher=${result}`);
  return result;
};

// Проверка наличия разрешения на доступ ко всем файлам
export const checkAllFilesAccess = async () => {
  log('checkAllFilesAccess called');
  
  if (IS_WEB_STUB) {
    log('IS_WEB_STUB true, returning true');
    return true;
  }
  
  if (!isAndroid11OrHigher()) {
    log('Android < 11, assuming access granted');
    return true;
  }
  
  try {
    // Пытаемся прочитать корневую папку
    const testPath = FileSystem.documentDirectory;
    log('Testing read access to:', testPath);
    const files = await FileSystem.readDirectoryAsync(testPath);
    log('Read successful, files count:', files.length);
    return true;
  } catch (error) {
    log('Read failed with error:', error.message);
    return false;
  }
};

// ДИАГНОСТИКА: получение информации о разрешениях
export const diagnosePermissions = async () => {
  log('=== STARTING PERMISSION DIAGNOSIS ===');
  
  const diagnosis = {
    platform: Platform.OS,
    androidVersion: Platform.Version,
    isAndroid11Plus: isAndroid11OrHigher(),
    hasFileAccess: false,
    manifestPermissions: [],
    error: null
  };

  try {
    // Проверяем доступ к файлам
    diagnosis.hasFileAccess = await checkAllFilesAccess();
    
    // Пытаемся получить список разрешений из манифеста (не всегда доступно)
    try {
      // Этот код может не работать на всех устройствах
      const permissions = await PermissionsAndroid.checkMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);
      diagnosis.manifestPermissions = permissions;
    } catch (e) {
      diagnosis.manifestPermissions = ['Could not check permissions'];
    }

  } catch (error) {
    diagnosis.error = error.message;
  }

  log('Diagnosis complete:', diagnosis);
  return diagnosis;
};

// Открытие настроек для включения доступа ко всем файлам
export const openAllFilesSettings = async () => {
  log('openAllFilesSettings called');
  
  if (!isAndroid11OrHigher()) {
    log('Android < 11, opening app settings');
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
      { data: 'package:com.mkhailksk.musikplayer' }
    );
    return;
  }
  
  try {
    log('Opening all files access settings');
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.MANAGE_ALL_FILES_ACCESS_PERMISSION
    );
  } catch (error) {
    log('Error opening settings:', error);
    // Fallback to app settings
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
      { data: 'package:com.mkhailksk.musikplayer' }
    );
  }
};

// Инструкция для пользователя
export const showPermissionInstructions = (diagnosis = null) => {
  log('showPermissionInstructions called');
  
  let message = 'Для работы с музыкой приложению нужен доступ к файлам.\n\n';
  
  if (diagnosis) {
    message += `📊 Диагностика:\n`;
    message += `• Android версия: ${diagnosis.androidVersion}\n`;
    message += `• Android 11+: ${diagnosis.isAndroid11Plus ? 'Да' : 'Нет'}\n`;
    message += `• Доступ к файлам: ${diagnosis.hasFileAccess ? '✅ Есть' : '❌ Нет'}\n\n`;
  }
  
  message += 'На Android 11 и выше необходимо включить "Разрешить управление всеми файлами":\n\n' +
    '1. Нажмите "Открыть настройки"\n' +
    '2. Выберите "Разрешения"\n' +
    '3. Включите "Разрешить управление всеми файлами"\n' +
    '4. Вернитесь в приложение и нажмите "Повторить"';

  Alert.alert(
    '🔍 Требуется доступ к файлам',
    message,
    [
      { text: 'Отмена', style: 'cancel' },
      { text: '📋 Диагностика', onPress: () => showDiagnosticInfo() },
      { text: '⚙️ Открыть настройки', onPress: openAllFilesSettings }
    ]
  );
};

// ДИАГНОСТИКА: показать подробную информацию
const showDiagnosticInfo = async () => {
  const diagnosis = await diagnosePermissions();
  
  Alert.alert(
    '📊 Диагностика доступа',
    `Платформа: ${diagnosis.platform}\n` +
    `Android версия: ${diagnosis.androidVersion}\n` +
    `Android 11+: ${diagnosis.isAndroid11Plus ? 'Да' : 'Нет'}\n` +
    `Доступ к файлам: ${diagnosis.hasFileAccess ? '✅ Есть' : '❌ Нет'}\n` +
    `Ошибка: ${diagnosis.error || 'Нет'}\n\n` +
    `Если доступ отсутствует, следуйте инструкции.`,
    [
      { text: '❓ Помощь', onPress: showPermissionInstructions },
      { text: '⚙️ Настройки', onPress: openAllFilesSettings }
    ]
  );
};

// Остальные функции (без изменений, но с добавленным логированием)
export const saveRootFolder = async (uri) => {
  log('saveRootFolder:', uri);
  if (IS_WEB_STUB) return true;
  try {
    await AsyncStorage.setItem(ROOT_FOLDER_KEY, uri);
    return true;
  } catch { return false; }
};

export const getRootFolder = async () => {
  log('getRootFolder called');
  if (IS_WEB_STUB) return DEMO_ROOT;
  try {
    return await AsyncStorage.getItem(ROOT_FOLDER_KEY);
  } catch { return null; }
};

export const pickFolder = async () => {
  log('pickFolder called');
  
  if (IS_WEB_STUB) {
    Alert.alert('Демо-режим', 'Выбор папки работает только на устройстве');
    return DEMO_ROOT;
  }
  
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: false,
    });
    
    log('DocumentPicker result:', result);
    
    if (result.canceled) return null;
    
    const fileUri = result.assets[0].uri;
    const folderPath = fileUri.substring(0, fileUri.lastIndexOf('/'));
    log('Selected folder:', folderPath);
    
    return folderPath;
  } catch (error) {
    log('Error picking folder:', error);
    Alert.alert('Ошибка', 'Не удалось выбрать папку');
    return null;
  }
};

// ... остальные функции экспортируются так же, но с добавленным логированием
// (getPlaylistFolders, getRootFiles, getFolderFiles, moveAudioFile и т.д.)

export const getPlaylistFolders = async () => {
  log('getPlaylistFolders called');
  if (IS_WEB_STUB) return DEMO_FOLDERS;
  // ... остальной код
};

export const getRootFiles = async () => {
  log('getRootFiles called');
  if (IS_WEB_STUB) return DEMO_SONGS.filter(s => s.folder === APP_FAVORITES_NAME);
  // ... остальной код
};

export const getFolderFiles = async (folderUri) => {
  log('getFolderFiles called for:', folderUri);
  if (IS_WEB_STUB) {
    const folderName = folderUri?.split('/').pop();
    return DEMO_SONGS.filter(s => s.folder === folderName);
  }
  // ... остальной код
};

export const moveAudioFile = async (sourceUri, destFolderUri) => {
  log('moveAudioFile called:', { sourceUri, destFolderUri });
  if (IS_WEB_STUB) {
    const fileName = sourceUri.split('/').pop();
    const destName = destFolderUri.split('/').pop();
    Alert.alert('Демо-режим', `Файл ${fileName} перемещен в ${destName}`);
    return 'demo://moved';
  }
  // ... остальной код
};

export const hasTrashFolder = async () => {
  log('hasTrashFolder called');
  if (IS_WEB_STUB) return true;
  // ... остальной код
};

export const ensureTrashFolder = async () => {
  log('ensureTrashFolder called');
  if (IS_WEB_STUB) return true;
  // ... остальной код
};

export const getFolderColor = async (folderName) => {
  log('getFolderColor called for:', folderName);
  try {
    const colors = await AsyncStorage.getItem(FOLDER_COLORS_KEY);
    const colorsMap = colors ? JSON.parse(colors) : {};
    return colorsMap[folderName] || null;
  } catch { return null; }
};

export const setFolderColor = async (folderName, color) => {
  log('setFolderColor called:', { folderName, color });
  try {
    const colors = await AsyncStorage.getItem(FOLDER_COLORS_KEY);
    const colorsMap = colors ? JSON.parse(colors) : {};
    colorsMap[folderName] = color;
    await AsyncStorage.setItem(FOLDER_COLORS_KEY, JSON.stringify(colorsMap));
    return true;
  } catch { return false; }
};

export const getAllSongs = async () => {
  log('getAllSongs called');
  if (IS_WEB_STUB) return DEMO_SONGS;
  // ... остальной код
};
