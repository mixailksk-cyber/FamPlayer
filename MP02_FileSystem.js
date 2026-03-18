import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
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
// ПРОВЕРКА ТИПА ХРАНИЛИЩА
// ==========================================

const isInternalStorage = (uri) => {
  // Внутренняя память обычно содержит "emulated" или "0"
  return uri.includes('emulated') || uri.includes('%3A0%2F') || uri.includes(':0/');
};

const isExternalSdCard = (uri) => {
  // Внешняя SD карта содержит идентификатор типа "9C33-6BBD"
  return uri.includes('/tree/') && !isInternalStorage(uri);
};

// ==========================================
// ПРАВИЛЬНЫЙ ВЫБОР ПАПКИ
// ==========================================

export const pickFolder = async () => {
  if (IS_WEB_STUB) {
    Alert.alert('Демо-режим', 'Выбор папки работает только на устройстве');
    return DEMO_ROOT;
  }

  try {
    // Показываем инструкцию в зависимости от Android версии
    if (Platform.OS === 'android') {
      if (Platform.Version >= 30) {
        Alert.alert(
          'Выбор папки',
          'В открывшемся окне:\n1. Найдите нужную папку\n2. Нажмите "Разрешить" или "Использовать эту папку"\n\n' +
          'Рекомендуется использовать внутреннюю память для лучшей совместимости.',
          [{ text: 'OK' }]
        );
      }
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: false,
    });
    
    if (result.canceled) return null;
    
    const uri = result.assets[0].uri;
    console.log('Selected URI:', uri);
    
    // Преобразуем URI документа в URI папки
    let folderUri = uri;
    
    if (uri.includes('/document/')) {
      const parts = uri.split('/document/');
      if (parts.length === 2) {
        const path = parts[1];
        // Убираем имя файла из пути
        const lastSlash = path.lastIndexOf('%2F');
        if (lastSlash !== -1) {
          const folderPath = path.substring(0, lastSlash);
          folderUri = `${parts[0]}/tree/${folderPath}`;
        } else {
          // Это уже папка? Тогда просто меняем document на tree
          folderUri = `${parts[0]}/tree/${path}`;
        }
      }
    }
    
    console.log('Converted to folder URI:', folderUri);
    
    // Проверяем тип хранилища
    if (isExternalSdCard(folderUri)) {
      Alert.alert(
        'Внешний накопитель',
        'Вы выбрали папку на внешней SD-карте. Это может работать медленнее. ' +
        'Рекомендуется использовать внутреннюю память для лучшей производительности.',
        [
          { text: 'Продолжить', style: 'default' },
          { text: 'Выбрать другую', style: 'cancel', onPress: () => pickFolder() }
        ]
      );
    }
    
    return folderUri;
    
  } catch (error) {
    console.error('Error picking folder:', error);
    Alert.alert('Ошибка', 'Не удалось выбрать папку');
    return null;
  }
};

// ==========================================
// ПОЛУЧЕНИЕ РЕАЛЬНОГО ПУТИ ДЛЯ ВНЕШНИХ НАКОПИТЕЛЕЙ
// ==========================================

const getExternalStoragePath = async (uri) => {
  try {
    // Пытаемся получить доступ через MediaLibrary
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      // MediaLibrary может работать с внешними накопителями
      const assets = await MediaLibrary.getAssetsAsync({
        first: 1,
        album: 'Music'
      });
      return { type: 'medialibrary', assets };
    }
  } catch (error) {
    console.log('MediaLibrary not available for external storage');
  }
  
  return { type: 'external', uri };
};

// ==========================================
// СКАНИРОВАНИЕ ПАПКИ С ПОДДЕРЖКОЙ ВНЕШНИХ НАКОПИТЕЛЕЙ
// ==========================================

export const scanFolder = async (folderUri) => {
  if (IS_WEB_STUB) return { folders: [], songs: [] };

  try {
    console.log('Scanning folder:', folderUri);
    
    // Для внешних SD-карт предлагаем альтернативный подход
    if (isExternalSdCard(folderUri)) {
      Alert.alert(
        'Внешний накопитель',
        'Для сканирования внешней SD-карты требуется дополнительное разрешение.\n\n' +
        'Выберите действие:',
        [
          {
            text: 'Использовать MediaLibrary',
            onPress: () => scanWithMediaLibrary(folderUri)
          },
          {
            text: 'Выбрать другую папку',
            style: 'cancel'
          }
        ]
      );
      return { folders: [], songs: [] };
    }
    
    // Для внутренней памяти - обычное сканирование
    return await scanInternalStorage(folderUri);
    
  } catch (error) {
    console.error('Error scanning folder:', error);
    throw error;
  }
};

// ==========================================
// СКАНИРОВАНИЕ ВНУТРЕННЕЙ ПАМЯТИ
// ==========================================

const scanInternalStorage = async (folderUri) => {
  const cleanPath = folderUri.replace('file://', '').replace('/tree/', '/');
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
};

// ==========================================
// СКАНИРОВАНИЕ ЧЕРЕЗ MEDIALIBRARY (ДЛЯ ВНЕШНИХ НАКОПИТЕЛЕЙ)
// ==========================================

const scanWithMediaLibrary = async (folderUri) => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Нет доступа к медиатеке');
      return { folders: [], songs: [] };
    }
    
    // Получаем все аудиофайлы через MediaLibrary
    const media = await MediaLibrary.getAssetsAsync({
      mediaType: 'audio',
      first: 1000,
    });
    
    // Преобразуем в наш формат
    const songs = media.assets.map(asset => ({
      id: asset.id,
      title: asset.filename,
      filename: asset.filename,
      uri: asset.uri,
      addedAt: asset.creationTime,
    }));
    
    // MediaLibrary не дает структуру папок
    return {
      folders: [],
      songs: songs
    };
    
  } catch (error) {
    console.error('Error scanning with MediaLibrary:', error);
    return { folders: [], songs: [] };
  }
};

// ==========================================
// ОСТАЛЬНЫЕ ФУНКЦИИ
// ==========================================

export const saveRootFolder = async (uri) => {
  if (IS_WEB_STUB) return true;
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
    return true;
  } catch { return false; }
};

export const getSongsList = async () => {
  try {
    const songs = await AsyncStorage.getItem('songs_list');
    return songs ? JSON.parse(songs) : [];
  } catch { return []; }
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

// Остальные функции для совместимости
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
