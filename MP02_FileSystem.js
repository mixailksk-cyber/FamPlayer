import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import { APP_FAVORITES_NAME, IS_WEB_STUB } from './MP01_Core';

// Демо-данные для Snack
const DEMO_FOLDERS = [
  { id: 'folder1', name: 'Жатва', uri: 'demo://root/Жатва', count: 3, songs: [] },
  { id: 'folder2', name: 'Пасха', uri: 'demo://root/Пасха', count: 2, songs: [] },
  { id: 'folder3', name: 'Избранное', uri: 'demo://root/Избранное', count: 3, songs: [] },
];

const DEMO_SONGS = [
  { id: '1', title: 'sdvsd.mp3', uri: 'demo://root/sdvsd.mp3', folder: 'Избранное', addedAt: Date.now() - 100000, duration: 180 },
  { id: '2', title: 'sfdb.mp3', uri: 'demo://root/sfdb.mp3', folder: 'Избранное', addedAt: Date.now() - 90000, duration: 240 },
  { id: '3', title: 'sdvs.mp3', uri: 'demo://root/sdvs.mp3', folder: 'Избранное', addedAt: Date.now() - 80000, duration: 195 },
];

const SCAN_MODE_KEY = '@scan_mode';

// ==========================================
// ТИПЫ СКАНИРОВАНИЯ (оставляем только MEDIA для совместимости)
// ==========================================

export const SCAN_MODES = {
  MEDIA: 'media'
};

// ==========================================
// СОХРАНЕНИЕ РЕЖИМА (заглушки)
// ==========================================

export const saveScanMode = async () => true;
export const getScanMode = async () => SCAN_MODES.MEDIA;

// ==========================================
// MEDIA LIBRARY СКАНИРОВАНИЕ
// ==========================================

export const scanMusic = async () => {
  if (IS_WEB_STUB) {
    return { 
      folders: DEMO_FOLDERS, 
      songs: DEMO_SONGS,
      stats: { total: 3, albums: 2, foldersWithSongs: 2 }
    };
  }

  try {
    console.log('📱 Starting MediaLibrary scan...');
    
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Нет доступа к медиатеке');
    }

    const media = await MediaLibrary.getAssetsAsync({
      mediaType: 'audio',
      first: 10000,
    });

    console.log(`📊 Found ${media.totalCount} total audio files`);

    const albums = await MediaLibrary.getAlbumsAsync();
    console.log(`📊 Found ${albums.length} albums`);

    const songsByAlbum = {};
    const allSongs = [];

    for (const asset of media.assets) {
      const song = {
        id: asset.id,
        title: asset.filename,
        filename: asset.filename,
        uri: asset.uri,
        duration: asset.duration,
        addedAt: asset.creationTime,
        albumId: asset.albumId,
        albumTitle: null,
      };
      allSongs.push(song);
      
      if (asset.albumId) {
        if (!songsByAlbum[asset.albumId]) {
          songsByAlbum[asset.albumId] = [];
        }
        songsByAlbum[asset.albumId].push(song);
      }
    }

    const folders = albums.map(album => ({
      id: album.id,
      name: album.title || 'Без названия',
      uri: `album://${album.id}`,
      count: songsByAlbum[album.id]?.length || 0,
      songs: songsByAlbum[album.id] || [],
    })).filter(folder => folder.count > 0);

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
        foldersWithSongs: folders.length
      }
    };

  } catch (error) {
    console.error('❌ Error in scanWithMediaLibrary:', error);
    throw error;
  }
};

// ==========================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ
// ==========================================

export const saveRootFolder = async () => true;
export const getRootFolder = async () => null;

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
    const colors = await AsyncStorage.getItem('@folder_colors');
    const colorsMap = colors ? JSON.parse(colors) : {};
    return colorsMap[folderName] || null;
  } catch { return null; }
};

export const setFolderColor = async (folderName, color) => {
  try {
    const colors = await AsyncStorage.getItem('@folder_colors');
    const colorsMap = colors ? JSON.parse(colors) : {};
    colorsMap[folderName] = color;
    await AsyncStorage.setItem('@folder_colors', JSON.stringify(colorsMap));
    return true;
  } catch { return false; }
};

// Заглушки для удаленных функций
export const pickFolder = async () => null;
export const scanWithFileSystem = async () => ({ folders: [], songs: [] });
