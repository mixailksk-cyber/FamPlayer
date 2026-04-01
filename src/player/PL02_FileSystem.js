import AsyncStorage from '@react-native-async-storage/async-storage';
import MusicFiles from 'react-native-get-music-files';

export const scanMusic = async () => {
  try {
    console.log('📱 Scanning music files...');
    
    const songs = await MusicFiles.getAll({
      cover: false,
      duration: true,
      title: true,
      artist: true,
      album: true,
      genre: true,
    });
    
    console.log(`📊 Found ${songs.length} audio files`);
    
    const albumsMap = {};
    const allSongs = [];
    
    songs.forEach((song, index) => {
      const albumName = song.album || 'Неизвестный альбом';
      const artist = song.artist || 'Неизвестный исполнитель';
      
      const songItem = {
        id: song.id || `${Date.now()}_${index}`,
        title: song.title || song.filename,
        filename: song.filename,
        uri: song.path,
        duration: song.duration || 0,
        artist: artist,
        album: albumName,
        addedAt: Date.now(),
      };
      
      allSongs.push(songItem);
      
      if (!albumsMap[albumName]) {
        albumsMap[albumName] = {
          id: albumName,
          name: albumName,
          count: 0,
          songs: []
        };
      }
      albumsMap[albumName].count++;
      albumsMap[albumName].songs.push(songItem);
    });
    
    const folders = Object.values(albumsMap);
    
    console.log(`✅ Scan complete: ${folders.length} albums, ${allSongs.length} songs`);
    
    return { folders, songs: allSongs };
  } catch (error) {
    console.error('❌ Error scanning music:', error);
    throw error;
  }
};

export const saveFoldersList = async (folders) => {
  try {
    await AsyncStorage.setItem('scanned_folders', JSON.stringify(folders));
    console.log(`💾 Saved ${folders.length} folders`);
    return true;
  } catch (error) {
    console.error('Error saving folders:', error);
    return false;
  }
};

export const getFoldersList = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('scanned_folders');
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading folders:', error);
    return [];
  }
};

export const saveSongsList = async (songs) => {
  try {
    await AsyncStorage.setItem('scanned_songs', JSON.stringify(songs));
    console.log(`💾 Saved ${songs.length} songs`);
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
