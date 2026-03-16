import { useState, useEffect, useCallback } from 'react';
import * as FileSystem from './MP02_FileSystem';
import AudioPlayer from './MP03_AudioPlayer';

export const useFolderContent = (folderUri, isFavorites = false, sortBy = 'title') => {
  const [folderName, setFolderName] = useState('');
  const [songs, setSongs] = useState([]);
  const [subFolders, setSubFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      
      if (isFavorites) {
        setFolderName('Избранное');
        const allSongs = await FileSystem.getAllSongs();
        const favIds = await FileSystem.getFavorites();
        let favSongs = allSongs.filter(song => favIds.includes(song.id));
        
        // Сортировка
        favSongs = sortSongs(favSongs, sortBy);
        setSongs(favSongs);
        setSubFolders([]);
      } else if (folderUri) {
        setFolderName(folderUri.split('/').pop() || 'Папка');
        const [audioFiles, folders] = await Promise.all([
          FileSystem.getAudioFiles(folderUri),
          FileSystem.getSubFolders(folderUri),
        ]);
        
        // Сортировка
        const sorted = sortSongs(audioFiles, sortBy);
        setSongs(sorted);
        setSubFolders(folders);
      }
      
      setLoading(false);
    };
    
    load();
  }, [folderUri, isFavorites, sortBy]);

  const sortSongs = (songsArray, sortBy) => {
    return [...songsArray].sort((a, b) => {
      switch(sortBy) {
        case 'artist':
          return (a.artist || '').localeCompare(b.artist || '', 'ru');
        case 'duration':
          return (a.duration || 0) - (b.duration || 0);
        case 'addedAt':
          return (b.addedAt || 0) - (a.addedAt || 0);
        case 'title':
        default:
          return (a.title || '').localeCompare(b.title || '', 'ru');
      }
    });
  };

  return { folderName, songs, subFolders, loading };
};

export const usePlayerSync = () => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const status = AudioPlayer.getStatus();
      setCurrentSong(status.currentSong);
      setIsPlaying(status.isPlaying);
      setIsPaused(status.isPaused);
      setShuffleMode(status.shuffleMode);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return { currentSong, isPlaying, isPaused, shuffleMode };
};