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
    // Используем системный выбор папки через DocumentPicker
    // Для Android 11+ это даст URI папки
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: false,
    });
    
    if (result.canceled) return null;
    
    const uri = result.assets[0].uri;
    
    // Преобразуем URI документа в URI папки
    // content://com.android.externalstorage.documents/document/primary%3AMusic%2Fsong.mp3
    // -> content://com.android.externalstorage.documents/tree/primary%3AMusic
    let folderUri = uri;
    
    if (uri.includes('/document/')) {
      // Это URI файла, нужно получить URI папки
      const parts = uri.split('/document/');
      if (parts.length === 2) {
        const path = parts[1];
        const folderPath = path.substring(0, path.lastIndexOf('%2F'));
        folderUri = `${parts[0]}/tree/${folderPath}`;
      }
    }
    
    console.log('Selected folder URI:', folderUri);
    return folderUri;
    
  } catch (error) {
    console.error('Error picking folder:', error);
    Alert.alert('Ошибка', 'Не удалось выбрать папку');
    return null;
  }
};

// ==========================================
// СКАНИРОВАНИЕ ПАПКИ (новый API)
// ==========================================

export const scanFolder = async (folderUri) => {
  if (IS_WEB_STUB) return { folders: [], songs: [] };

  try {
    console.log('Scanning folder:', folderUri);
    
    // Для content:// URI нужно использовать другой подход
    if (folderUri.startsWith('content://')) {
      return await scanContentUri(folderUri);
    } else {
      return await scanFileUri(folderUri);
    }
    
  } catch (error) {
    console.error('Error scanning folder:', error);
    throw error;
  }
};

// ==========================================
// СКАНИРОВАНИЕ CONTENT URI (Android SAF)
// ==========================================

const scanContentUri = async (folderUri) => {
  console.log('Using SAF for content URI');
  
  // Для Android Storage Access Framework нужно использовать
  // MediaLibrary или другой подход
  // Пока возвращаем заглушку
  Alert.alert(
    'Информация',
    'Для папок из SAF сканирование пока в разработке. Используйте обычные пути.'
  );
  
  return { folders: [], songs: [] };
};

// ==========================================
// СКАНИРОВАНИЕ FILE URI (обычные пути)
// ==========================================

const scanFileUri = async (folderUri) => {
  console.log('Using file system for file URI');
  
  const cleanPath = folderUri.replace('file://', '');
  
  // Используем новый API
  const directory = FileSystem.directory(cleanPath);
  
  // Получаем содержимое
  const entries = await directory.listAsync();
  
  const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac'];
  const folders = [];
  const songs = [];
  
  for (const entry of entries) {
    const info = await entry.info();
    
    if (info.isDirectory) {
      folders.push({
        id: info.uri,
        name: info.name,
        uri: info.uri,
      });
    } else {
      const ext = info.name.substring(info.name.lastIndexOf('.')).toLowerCase();
      if (audioExtensions.includes(ext)) {
        songs.push({
          id: info.uri,
          title: info.name.replace(/\.[^/.]+$/, ""),
          filename: info.name,
          uri: info.uri,
          addedAt: Date.now(),
        });
      }
    }
  }
  
  return { folders, songs };
};

// ==========================================
// ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений)
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
