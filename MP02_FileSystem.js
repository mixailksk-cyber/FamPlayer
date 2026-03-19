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

export const SCAN_MODES = {
  MEDIA: 'media'
};

export const saveScanMode = async () => true;
export const getScanMode = async () => SCAN_MODES.MEDIA;

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
        duration: asset.duration || 0,
        addedAt: asset.creationTime || Date.now(),
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

export const saveFoldersList = async (folders) => {
  try {
    const jsonValue = JSON.stringify(folders);
    await AsyncStorage.setItem('scanned_folders', jsonValue);
    console.log(`💾 Saved ${folders.length} folders to storage`);
    return true;
  } catch (error) {
    console.error('Error saving folders:', error);
    return false;
  }
};

export const getFoldersList = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('scanned_folders');
    const folders = jsonValue != null ? JSON.parse(jsonValue) : [];
    console.log(`📂 Loaded ${folders.length} folders from storage`);
    return folders;
  } catch (error) {
    console.error('Error loading folders:', error);
    return [];
  }
};

export const saveSongsList = async (songs) => {
  try {
    const jsonValue = JSON.stringify(songs);
    await AsyncStorage.setItem('scanned_songs', jsonValue);
    console.log(`💾 Saved ${songs.length} songs to storage`);
    return true;
  } catch (error) {
    console.error('Error saving songs:', error);
    return false;
  }
};

export const getSongsList = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('scanned_songs');
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading songs:', error);
    return [];
  }
};

// Заглушки для обратной совместимости
export const saveRootFolder = async () => true;
export const getRootFolder = async () => null;
export const pickFolder = async () => null;
export const scanWithFileSystem = async () => ({ folders: [], songs: [] });
export const getFolderFiles = async (folderId) => {
  const folders = await getFoldersList();
  const folder = folders.find(f => f.id === folderId);
  return folder?.songs || [];
};
export const getFolderColor = async () => null;
export const setFolderColor = async () => true;
