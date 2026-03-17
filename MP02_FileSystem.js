import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
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

// ==========================================
// ВЫБОР ПАПКИ (Android 11+ правильный способ)
// ==========================================

export const pickFolder = async () => {
  if (IS_WEB_STUB) {
    Alert.alert('Демо-режим', 'Выбор папки работает только на устройстве');
    return DEMO_ROOT;
  }

  try {
    // Используем DocumentPicker для выбора файла, затем извлекаем путь к папке
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: false,
    });
    
    if (result.canceled) return null;
    
    const uri = result.assets[0].uri;
    // Получаем путь к папке (убираем имя файла)
    const folderUri = uri.substring(0, uri.lastIndexOf('/'));
    
    console.log('Selected folder URI:', folderUri);
    return folderUri;
    
  } catch (error) {
    console.error('Error picking folder:', error);
    Alert.alert('Ошибка', 'Не удалось выбрать папку');
    return null;
  }
};

// ==========================================
// СКАНИРОВАНИЕ ПАПКИ (совместимый способ)
// ==========================================

export const scanFolder = async (folderUri) => {
  if (IS_WEB_STUB) return { folders: [], songs: [] };

  try {
    console.log('Scanning folder:', folderUri);
    
    // Очищаем URI от префикса file:// если есть
    const cleanPath = folderUri.replace('file://', '');
    
    // Читаем содержимое директории
    const items = await FileSystem.readDirectoryAsync(cleanPath);
    
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
        }
      }
    }
    
    return { folders, songs };
    
  } catch (error) {
    console.error('Error scanning folder:', error);
    throw new Error(`Не удалось просканировать папку: ${error.message}`);
  }
};

// ==========================================
// СОХРАНЕНИЕ И ЗАГРУЗКА ДАННЫХ
// ==========================================

export const saveRootFolder = async (uri) => {
  if (IS_WEB_STUB) {
    console.log('Demo: saveRootFolder', uri);
    return true;
  }
  
  try {
    await AsyncStorage.setItem(ROOT_FOLDER_KEY, uri);
    return true;
  } catch { return false; }
};

export const getRootFolder = async () => {
  if (IS_WEB_STUB) return DEMO_ROOT;
  
  try {
    return await AsyncStorage.getItem(ROOT_FOLDER_KEY);
  } catch { return null; }
};

export const saveSongsList = async (songs) => {
  try {
    await AsyncStorage.setItem('songs_list', JSON.stringify(songs));
    console.log('Saved', songs.length, 'songs to storage');
    return true;
  } catch (error) {
    console.error('Error saving songs:', error);
    return false;
  }
};

export const getSongsList = async () => {
  try {
    const songs = await AsyncStorage.getItem('songs_list');
    return songs ? JSON.parse(songs) : [];
  } catch (error) {
    console.error('Error getting songs:', error);
    return [];
  }
};

export const saveFoldersList = async (folders) => {
  try {
    await AsyncStorage.setItem('folders_list', JSON.stringify(folders));
    return true;
  } catch { return false; }
};

export const getFoldersList = async () => {
  try {
    const folders = await AsyncStorage.getItem('folders_list');
    return folders ? JSON.parse(folders) : [];
  } catch { return []; }
};

// ==========================================
// ОСТАЛЬНЫЕ ФУНКЦИИ (для совместимости)
// ==========================================

export const getPlaylistFolders = async () => {
  if (IS_WEB_STUB) return DEMO_FOLDERS;
  return [];
};

export const getRootFiles = async () => {
  if (IS_WEB_STUB) return DEMO_SONGS.filter(s => s.folder === APP_FAVORITES_NAME);
  return [];
};

export const getFolderFiles = async (folderUri) => {
  if (IS_WEB_STUB) {
    const folderName = folderUri?.split('/').pop();
    return DEMO_SONGS.filter(s => s.folder === folderName);
  }
  return [];
};

export const moveAudioFile = async (sourceUri, destFolderUri) => {
  if (IS_WEB_STUB) {
    Alert.alert('Демо-режим', 'Перемещение файлов');
    return sourceUri;
  }
  return sourceUri;
};

export const hasTrashFolder = async () => {
  if (IS_WEB_STUB) return true;
  return false;
};

export const ensureTrashFolder = async () => {
  if (IS_WEB_STUB) return true;
  return true;
};

export const getFolderColor = async (folderName) => {
  try {
    const colors = await AsyncStorage.getItem(FOLDER_COLORS_KEY);
    const colorsMap = colors ? JSON.parse(colors) : {};
    return colorsMap[folderName] || null;
  } catch { return null; }
};

export const setFolderColor = async (folderName, color) => {
  try {
    const colors = await AsyncStorage.getItem(FOLDER_COLORS_KEY);
    const colorsMap = colors ? JSON.parse(colors) : {};
    colorsMap[folderName] = color;
    await AsyncStorage.setItem(FOLDER_COLORS_KEY, JSON.stringify(colorsMap));
    return true;
  } catch { return false; }
};

export const getAllSongs = async () => {
  if (IS_WEB_STUB) return DEMO_SONGS;
  return [];
};
