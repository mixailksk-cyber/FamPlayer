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
const SCAN_MODE_KEY = '@scan_mode';

// ==========================================
// ТИПЫ СКАНИРОВАНИЯ
// ==========================================

export const SCAN_MODES = {
  FOLDER: 'folder',      // Ручной выбор папки (старый способ)
  MEDIA: 'media'         // Медиатека (быстрый способ)
};

// ==========================================
// СОХРАНЕНИЕ РЕЖИМА СКАНИРОВАНИЯ
// ==========================================

export const saveScanMode = async (mode) => {
  try {
    await AsyncStorage.setItem(SCAN_MODE_KEY, mode);
    return true;
  } catch { return false; }
};

export const getScanMode = async () => {
  try {
    const mode = await AsyncStorage.getItem(SCAN_MODE_KEY);
    return mode || SCAN_MODES.FOLDER; // По умолчанию старый способ
  } catch { return SCAN_MODES.FOLDER; }
};

// ==========================================
// ВАРИАНТ 1: СКАНИРОВАНИЕ ЧЕРЕЗ MEDIA LIBRARY (БЫСТРЫЙ)
// ==========================================

export const scanWithMediaLibrary = async () => {
  if (IS_WEB_STUB) return { folders: [], songs: [] };

  try {
    // Запрашиваем разрешения
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Нет доступа к медиатеке');
    }

    // Получаем все аудиофайлы
    const media = await MediaLibrary.getAssetsAsync({
      mediaType: 'audio',
      first: 10000, // Большой лимит
    });

    console.log(`MediaLibrary: найдено ${media.totalCount} файлов`);

    // Пытаемся получить альбомы (группировка)
    const albums = await MediaLibrary.getAlbumsAsync();
    console.log(`MediaLibrary: найдено ${albums.length} альбомов`);

    // Преобразуем в наш формат
    const songs = media.assets.map(asset => ({
      id: asset.id,
      title: asset.filename,
      filename: asset.filename,
      uri: asset.uri,
      duration: asset.duration,
      addedAt: asset.creationTime,
      albumId: asset.albumId,
    }));

    // Для альбомов (папок) используем albums
    const folders = albums.map(album => ({
      id: album.id,
      name: album.title,
      uri: `album://${album.id}`,
      count: album.assetCount,
    }));

    return { 
      folders, 
      songs,
      stats: {
        total: media.totalCount,
        albums: albums.length
      }
    };

  } catch (error) {
    console.error('Error in scanWithMediaLibrary:', error);
    throw error;
  }
};

// ==========================================
// ВАРИАНТ 2: СКАНИРОВАНИЕ ЧЕРЕЗ ФАЙЛОВУЮ СИСТЕМУ (СТАРЫЙ СПОСОБ)
// ==========================================

export const pickFolder = async () => {
  if (IS_WEB_STUB) return DEMO_ROOT;

  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: false,
    });
    
    if (result.canceled) return null;
    
    const uri = result.assets[0].uri;
    
    // Преобразуем URI документа в URI папки
    let folderUri = uri;
    if (uri.includes('/document/')) {
      const parts = uri.split('/document/');
      if (parts.length === 2) {
        const path = parts[1];
        const lastSlash = path.lastIndexOf('%2F');
        if (lastSlash !== -1) {
          const folderPath = path.substring(0, lastSlash);
          folderUri = `${parts[0]}/tree/${folderPath}`;
        }
      }
    }
    
    return folderUri;
    
  } catch (error) {
    console.error('Error picking folder:', error);
    Alert.alert('Ошибка', 'Не удалось выбрать папку');
    return null;
  }
};

export const scanWithFileSystem = async (folderUri) => {
  if (IS_WEB_STUB) return { folders: [], songs: [] };

  try {
    console.log('FileSystem scan of:', folderUri);
    
    // Проверяем тип URI
    if (folderUri.startsWith('content://')) {
      Alert.alert(
        'Внешний накопитель',
        'Для сканирования внешней SD-карты через файловую систему есть ограничения.\n' +
        'Рекомендуется использовать режим "Медиатека" для лучшего результата.',
        [
          { text: 'Продолжить', style: 'default' },
          { text: 'Отмена', style: 'cancel' }
        ]
      );
    }

    // Очищаем URI
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
    
  } catch (error) {
    console.error('Error in scanWithFileSystem:', error);
    throw error;
  }
};

// ==========================================
// УНИВЕРСАЛЬНАЯ ФУНКЦИЯ СКАНИРОВАНИЯ
// ==========================================

export const scanMusic = async (mode, folderUri = null) => {
  if (mode === SCAN_MODES.MEDIA) {
    return await scanWithMediaLibrary();
  } else {
    if (!folderUri) {
      throw new Error('Не выбрана папка для сканирования');
    }
    return await scanWithFileSystem(folderUri);
  }
};

// ==========================================
// ОСТАЛЬНЫЕ ФУНКЦИИ
// ==========================================

export const saveRootFolder = async (uri) => {
  try {
    await AsyncStorage.setItem(ROOT_FOLDER_KEY, uri);
    return true;
  } catch { return false; }
};

export const getRootFolder = async () => {
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
