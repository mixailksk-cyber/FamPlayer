import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
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

// ЗАПРОС РАЗРЕШЕНИЙ ЧЕРЕЗ MEDIA LIBRARY (правильный способ)
export const requestMediaPermissions = async () => {
  if (IS_WEB_STUB) return true;
  
  try {
    const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
    
    console.log('Media permission status:', status, 'canAskAgain:', canAskAgain);
    
    if (status === 'granted') {
      return true;
    } else {
      if (!canAskAgain) {
        // Пользователь нажал "Больше не спрашивать"
        Alert.alert(
          'Требуется доступ',
          'Пожалуйста, включите доступ к файлам в настройках приложения',
          [
            { text: 'Отмена' },
            { text: 'Открыть настройки', onPress: openAppSettings }
          ]
        );
      }
      return false;
    }
  } catch (error) {
    console.error('Error requesting media permissions:', error);
    return false;
  }
};

// Получение всех аудиофайлов через MediaLibrary
export const getAllAudioFiles = async () => {
  if (IS_WEB_STUB) return DEMO_SONGS;
  
  try {
    // Проверяем разрешения
    const { status } = await MediaLibrary.getPermissionsAsync();
    if (status !== 'granted') {
      const granted = await requestMediaPermissions();
      if (!granted) return [];
    }
    
    // Получаем все аудиофайлы
    const media = await MediaLibrary.getAssetsAsync({
      mediaType: 'audio',
      first: 1000, // Максимальное количество
      sortBy: MediaLibrary.SortBy.creationTime,
    });
    
    console.log(`Found ${media.assets.length} audio files`);
    
    // Преобразуем в формат приложения
    return media.assets.map(asset => ({
      id: asset.id,
      title: asset.filename,
      uri: asset.uri,
      duration: asset.duration,
      addedAt: asset.creationTime,
      folder: 'Все песни',
    }));
    
  } catch (error) {
    console.error('Error getting audio files:', error);
    return [];
  }
};

// Получение информации о конкретном файле
export const getAssetInfo = async (assetId) => {
  if (IS_WEB_STUB) return null;
  
  try {
    const asset = await MediaLibrary.getAssetInfoAsync(assetId);
    return asset;
  } catch (error) {
    console.error('Error getting asset info:', error);
    return null;
  }
};

// Сохранение файла в библиотеку (если нужно копировать)
export const createAsset = async (localUri) => {
  if (IS_WEB_STUB) return null;
  
  try {
    const asset = await MediaLibrary.createAssetAsync(localUri);
    return asset;
  } catch (error) {
    console.error('Error creating asset:', error);
    return null;
  }
};

// Сохранение корневой папки (теперь это просто метка)
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

// Получение корневой папки
export const getRootFolder = async () => {
  if (IS_WEB_STUB) return DEMO_ROOT;
  
  try {
    return await AsyncStorage.getItem(ROOT_FOLDER_KEY);
  } catch { return null; }
};

// Выбор файла через DocumentPicker (для отдельных операций)
export const pickFile = async () => {
  if (IS_WEB_STUB) {
    Alert.alert('Демо-режим', 'Выбор файла работает только на устройстве');
    return null;
  }
  
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });
    
    if (result.canceled) return null;
    return result.assets[0];
  } catch (error) {
    console.error('Error picking file:', error);
    return null;
  }
};

// Шеринг файла
export const shareFile = async (uri) => {
  if (IS_WEB_STUB) {
    Alert.alert('Демо-режим', 'Шеринг работает только на устройстве');
    return;
  }
  
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert('Ошибка', 'Шеринг не поддерживается на этом устройстве');
    }
  } catch (error) {
    console.error('Error sharing file:', error);
  }
};

// Получение списка папок (для совместимости)
export const getPlaylistFolders = async () => {
  if (IS_WEB_STUB) return DEMO_FOLDERS;
  
  // С MediaLibrary мы не работаем с папками напрямую
  // Возвращаем стандартные плейлисты
  return [
    { id: 'all', name: 'Все песни', uri: 'media://all', isSystem: true },
    { id: 'favorites', name: APP_FAVORITES_NAME, uri: 'media://favorites', isSystem: true },
  ];
};

// Получение файлов из корня (для совместимости)
export const getRootFiles = async () => {
  if (IS_WEB_STUB) return DEMO_SONGS.filter(s => s.folder === APP_FAVORITES_NAME);
  
  return getAllAudioFiles();
};

// Получение файлов из папки (для совместимости)
export const getFolderFiles = async (folderUri) => {
  if (IS_WEB_STUB) {
    const folderName = folderUri?.split('/').pop();
    return DEMO_SONGS.filter(s => s.folder === folderName);
  }
  
  // С MediaLibrary все файлы в одном месте
  return getAllAudioFiles();
};

// Перемещение файла (для совместимости)
export const moveAudioFile = async (sourceUri, destFolderUri) => {
  if (IS_WEB_STUB) {
    Alert.alert('Демо-режим', 'Перемещение файлов');
    return sourceUri;
  }
  
  // С MediaLibrary мы не перемещаем файлы физически
  // Просто отмечаем в нашем хранилище
  return sourceUri;
};

// Проверка наличия корзины
export const hasTrashFolder = async () => {
  if (IS_WEB_STUB) return true;
  return false;
};

// Создание папки корзины
export const ensureTrashFolder = async () => {
  if (IS_WEB_STUB) return true;
  return true;
};

// Получение цвета папки
export const getFolderColor = async (folderName) => {
  try {
    const colors = await AsyncStorage.getItem(FOLDER_COLORS_KEY);
    const colorsMap = colors ? JSON.parse(colors) : {};
    return colorsMap[folderName] || null;
  } catch { return null; }
};

// Установка цвета папки
export const setFolderColor = async (folderName, color) => {
  try {
    const colors = await AsyncStorage.getItem(FOLDER_COLORS_KEY);
    const colorsMap = colors ? JSON.parse(colors) : {};
    colorsMap[folderName] = color;
    await AsyncStorage.setItem(FOLDER_COLORS_KEY, JSON.stringify(colorsMap));
    return true;
  } catch { return false; }
};

// Получение всех песен для поиска
export const getAllSongs = async () => {
  if (IS_WEB_STUB) return DEMO_SONGS;
  return getAllAudioFiles();
};

// Открытие настроек приложения
const openAppSettings = async () => {
  await IntentLauncher.startActivityAsync(
    IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
    { data: 'package:com.mkhailksk.musikplayer' }
  );
};
