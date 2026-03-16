import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from './MP02_FileSystem';
import AudioPlayer from './MP03_AudioPlayer';
import { Header, SongItem, MoveSongDialog, PlayerControls } from './MP04_Components';
import { IS_WEB_STUB, WEB_STUB_MESSAGE, getBrandColor, APP_FAVORITES_NAME, TRASH_FOLDER_NAME } from './MP01_Core';

export default function FolderScreen({ route, navigation }) {
  const params = route?.params || {};
  const folderUri = params.folderUri || 'demo://root';
  const folderName = params.folderName || APP_FAVORITES_NAME;
  const settings = params.settings || { sortBy: 'addedAt' };
  const isRoot = params.isRoot || false;
  
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [moveDialogVisible, setMoveDialogVisible] = useState(false);
  const [selectedSongForMove, setSelectedSongForMove] = useState(null);
  const [availableFolders, setAvailableFolders] = useState([]);
  const brandColor = getBrandColor(settings);

  // Загрузка содержимого папки - ТОЛЬКО ФАЙЛЫ
  const loadContent = useCallback(async () => {
    let files = [];
    
    if (folderUri === 'demo://root' || folderName === APP_FAVORITES_NAME || isRoot) {
      // Корень (Избранное) - только файлы
      files = await FileSystem.getRootFiles();
    } else if (folderName === TRASH_FOLDER_NAME || folderUri.includes('Корзина')) {
      // Корзина
      files = await FileSystem.getFolderFiles(folderUri);
    } else {
      // Обычная папка
      files = await FileSystem.getFolderFiles(folderUri);
    }
    
    setSongs(files);
  }, [folderUri, folderName, isRoot]);

  // Загружаем список всех папок для перемещения
  const loadAvailableFolders = useCallback(async () => {
    const allFolders = await FileSystem.getPlaylistFolders();
    // Исключаем текущую папку
    const otherFolders = allFolders.filter(f => {
      if (folderName === APP_FAVORITES_NAME) return true; // Из корня можно во все папки
      if (folderName === TRASH_FOLDER_NAME) return f.name !== TRASH_FOLDER_NAME; // Из корзины нельзя в корзину
      return f.name !== folderName; // Из обычной папки нельзя в себя
    });
    setAvailableFolders(otherFolders);
  }, [folderName]);

  useEffect(() => { 
    loadContent(); 
    loadAvailableFolders(); 
  }, []);

  // Синхронизация с плеером
  useEffect(() => {
    const interval = setInterval(() => { 
      const status = AudioPlayer.getStatus(); 
      setCurrentSong(status.currentSong); 
      setIsPlaying(status.isPlaying); 
      setShuffleMode(status.shuffleMode); 
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Установка плейлиста в плеер
  useEffect(() => {
    if (songs.length > 0) {
      const idx = songs.findIndex(s => s.id === currentSong?.id);
      AudioPlayer.setPlaylist(songs, idx >= 0 ? idx : 0);
    }
  }, [songs]);

  const playSong = async (s) => await AudioPlayer.loadSong(s, true);
  const togglePlayPause = async () => await AudioPlayer.toggle();
  const playNext = async () => await AudioPlayer.playNext();
  const playPrevious = async () => await AudioPlayer.playPrevious();
  const toggleShuffle = () => AudioPlayer.toggleShuffle();

  useEffect(() => { 
    AudioPlayer.setOnFinish(playNext); 
    return () => AudioPlayer.setOnFinish(null); 
  }, []);

  const handleSongLongPress = async (song) => {
    setSelectedSongForMove(song);
    if (isPlaying && currentSong?.id === song.id) await AudioPlayer.pause();
    setMoveDialogVisible(true);
  };

  const handleMove = async (destUri) => {
    if (!selectedSongForMove) return;
    
    // Проверяем, не перемещаем ли мы в ту же папку
    const currentFolder = selectedSongForMove.uri.substring(0, selectedSongForMove.uri.lastIndexOf('/'));
    if (currentFolder === destUri) {
      Alert.alert('Ошибка', 'Файл уже в этой папке');
      setMoveDialogVisible(false);
      setSelectedSongForMove(null);
      return;
    }
    
    const newUri = await FileSystem.moveAudioFile(selectedSongForMove.uri, destUri);
    if (newUri) {
      setSongs(prev => prev.filter(s => s.id !== selectedSongForMove.id));
      if (currentSong?.id === selectedSongForMove.id) await playNext();
      setMoveDialogVisible(false);
      setSelectedSongForMove(null);
      Alert.alert('Успех', 'Файл перемещен');
    }
  };

  const getEmptyMessage = () => {
    if (folderName === APP_FAVORITES_NAME) return 'В избранном нет файлов';
    if (folderName === TRASH_FOLDER_NAME) return 'Корзина пуста';
    return 'В этой папке нет музыки';
  };

  return (
    <View style={styles.container}>
      {IS_WEB_STUB && (
        <View style={styles.demoBanner}>
          <MaterialIcons name="info" size={16} color="#333" />
          <Text style={styles.demoText}> {WEB_STUB_MESSAGE}</Text>
        </View>
      )}
      
      <Header
        title={folderName}
        subtitle={`${songs.length} треков`}
        showBack
        onBack={() => navigation.goBack()}
        rightIcon="settings"
        onRightPress={() => navigation.navigate('Settings', { settings })}
        showSearch
        onSearchPress={() => navigation.navigate('Search', { settings, fromScreen: 'Folder' })}
        showShuffle
        onShufflePress={toggleShuffle}
        shuffleMode={shuffleMode}
        settings={settings}
      />

      <FlatList
        data={songs}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <SongItem 
            item={item} 
            isPlaying={currentSong?.id === item.id && isPlaying} 
            onPress={() => playSong(item)} 
            onLongPress={() => handleSongLongPress(item)} 
            settings={settings} 
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="music-off" size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <PlayerControls
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        onNext={playNext}
        onPrevious={playPrevious}
        settings={settings}
      />

      <MoveSongDialog
        visible={moveDialogVisible}
        folders={availableFolders}
        onSelect={handleMove}
        onCancel={() => {
          setMoveDialogVisible(false);
          setSelectedSongForMove(null);
        }}
        settings={settings}
        song={selectedSongForMove}
        isPlaying={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  demoBanner: { 
    backgroundColor: '#FFD700', 
    padding: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  demoText: { color: '#333', fontSize: 12, fontWeight: '600' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16, textAlign: 'center' },
  listContent: { paddingBottom: 120 },
});