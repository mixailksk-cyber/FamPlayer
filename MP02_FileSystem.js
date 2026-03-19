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
];

const ROOT_FOLDER_KEY = '@root_folder';
const FOLDER_COLORS_KEY = '@folder_colors';
const SCAN_MODE_KEY = '@scan_mode';

// ==========================================
// ТИПЫ СКАНИРОВАНИЯ
// ==========================================

export const SCAN_MODES = {
  FOLDER: 'folder',
  MEDIA: 'media'
};

// ==========================================
// СОХРАНЕНИЕ РЕЖИМА
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
    return mode || SCAN_MODES.MEDIA; // По умолчанию Медиатека (быстрый режим)
  } catch { return SCAN_MODES.MEDIA; }
};

// ==========================================
// ВАРИАНТ 1: MEDIA LIBRARY (РАБОЧИЙ)
// ==========================================

export const scanWithMediaLibrary = async () => {
  if (IS_WEB_STUB) return { folders: [], songs: [] };

  try {
    console.log('📱 Starting MediaLibrary scan...');
    
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Нет доступа к медиатеке');
    }

    // Получаем ВСЕ аудиофайлы
    const media = await MediaLibrary.getAssetsAsync({
      mediaType: 'audio',
      first: 10000,
    });

    console.log(`📊 Found ${media.totalCount} total audio files`);

    // Получаем все альбомы
    const albums = await MediaLibrary.getAlbumsAsync();
    console.log(`📊 Found ${albums.length} albums`);

    // Создаем карту для быстрого доступа к песням по альбомам
    const songsByAlbum = {};
    const allSongs = [];

    // Сначала собираем все песни
    for (const asset of media.assets) {
      const song = {
        id: asset.id,
        title: asset.filename,
        filename: asset.filename,
        uri: asset.uri,
        duration: asset.duration,
        addedAt: asset.creationTime,
        albumId: asset.albumId,
        albumTitle: null, // Заполним позже
      };
      allSongs.push(song);
      
      if (asset.albumId) {
        if (!songsByAlbum[asset.albumId]) {
          songsByAlbum[asset.albumId] = [];
        }
        songsByAlbum[asset.albumId].push(song);
      }
    }

    // Создаем список папок (альбомов) с количеством песен
    const folders = albums.map(album => ({
      id: album.id,
      name: album.title || 'Без названия',
      uri: `album://${album.id}`,
      count: songsByAlbum[album.id]?.length || 0,
      songs: songsByAlbum[album.id] || [],
    }));

    // Добавляем папку "Все песни"
    const allSongsFolder = {
      id: 'all_songs',
      name: APP_FAVORITES_NAME,
      uri: 'album://all',
      count: allSongs.length,
      songs: allSongs,
    };

    const allFolders = [allSongsFolder, ...folders];

    console.log(`✅ MediaLibrary scan complete: ${allFolders.length} folders, ${allSongs.length} songs`);

    return { 
      folders: allFolders, 
      songs: allSongs,
      stats: {
        total: media.totalCount,
        albums: albums.length,
        foldersWithSongs: folders.filter(f => f.count > 0).length
      }
    };

  } catch (error) {
    console.error('❌ Error in scanWithMediaLibrary:', error);
    throw error;
  }
};

// ==========================================
// ВАРИАНТ 2: ФАЙЛОВАЯ СИСТЕМА (LEGACY)
// ==========================================

import * as LegacyFileSystem from 'expo-file-system/legacy';

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
        } else {
          folderUri = `${parts[0]}/tree/${path}`;
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
    console.log('📁 Starting FileSystem scan of:', folderUri);
    
    // Используем LEGACY API для совместимости
    let cleanPath = folderUri;
    if (folderUri.startsWith('file://')) {
      cleanPath = folderUri.replace('file://', '');
    } else if (folderUri.startsWith('content://')) {
      // Для content:// URI используем другой подход
      Alert.alert(
        'Внешний накопитель',
        'Для сканирования внешних накопителей рекомендуется использовать режим "Медиатека".\n\n' +
        'Попробуйте переключить режим сканирования.',
        [{ text: 'OK' }]
      );
      return { folders: [], songs: [] };
    }

    // Используем legacy API
    const items = await LegacyFileSystem.readDirectoryAsync(cleanPath);
    
    const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac'];
    const folders = [];
    const songs = [];
    
    for (const item of items) {
      const itemPath = `${cleanPath}/${item}`;
      const info = await LegacyFileSystem.getInfoAsync(itemPath);
      
      if (info.isDirectory) {
        folders.push({
          id: itemPath,
          name: item,
          uri: `file://${itemPath}`,
          count: 0, // Пока не знаем сколько внутри
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
    
    console.log(`✅ FileSystem scan complete: ${folders.length} folders, ${songs.length} songs`);
    
    return { folders, songs };
    
  } catch (error) {
    console.error('❌ Error in scanWithFileSystem:', error);
    throw new Error(`Ошибка сканирования: ${error.message}`);
  }
};

// ==========================================
// УНИВЕРСАЛЬНАЯ ФУНКЦИЯ
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

// Для совместимости с MP06_PlaylistsScreen
export const getFolderFiles = async (folderId) => {
  try {
    const folders = await getFoldersList();
    const folder = folders.find(f => f.id === folderId);
    return folder?.songs || [];
  } catch {
    return [];
  }
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
