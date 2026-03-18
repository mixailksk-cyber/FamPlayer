import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, SongItem, PlayerControls, SortMenu, SongActionDialog, MoveSongDialog } from './MP04_Components';
import { getBrandColor, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';
import AudioPlayer from './MP03_AudioPlayer';
import * as FileSystem from './MP02_FileSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FolderScreen({ route, navigation }) {
  const params = route?.params || {};
  const folderName = params.folderName || 'Папка';
  const settings = params.settings || {};
  const initialSongs = params.songs || [];
  const folderId = params.folderId;
  
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songs, setSongs] = useState(initialSongs);
  const [sortMode, setSortMode] = useState('addedAt');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [actionDialogVisible, setActionDialogVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [moveDialogVisible, setMoveDialogVisible] = useState(false);
  const [availableFolders, setAvailableFolders] = useState([]);
  
  const brandColor = getBrandColor(settings);
  const insets = useSafeAreaInsets();

  // Загружаем доступные папки для перемещения
  useEffect(() => {
    loadAvailableFolders();
  }, []);

  const loadAvailableFolders = async () => {
    const foldersStr = await AsyncStorage.getItem('scanned_folders');
    if (foldersStr) {
      const allFolders = JSON.parse(foldersStr);
      // Исключаем текущую папку
      const otherFolders = allFolders.filter(f => f.id !== folderId);
      setAvailableFolders(otherFolders);
    }
  };

  // Сортировка песен
  useEffect(() => {
    let sorted = [...initialSongs];
    
    if (sortMode === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortMode === 'shuffle') {
      sorted = [...initialSongs].sort(() => Math.random() - 0.5);
    } else {
      sorted.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    }
    
    setSongs(sorted);
    
    if (sorted.length > 0) {
      const currentIndex = sorted.findIndex(s => s.id === currentSong?.id);
      AudioPlayer.setPlaylist(sorted, currentIndex >= 0 ? currentIndex : 0);
    }
  }, [sortMode, initialSongs]);

  // Синхронизация с плеером
  useEffect(() => {
    const interval = setInterval(() => {
      const status = AudioPlayer.getStatus();
      setCurrentSong(status.currentSong);
      setIsPlaying(status.isPlaying);
      setProgress(status.progress || 0);
      setDuration(status.duration || 0);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Обработка окончания трека
  useEffect(() => {
    AudioPlayer.setOnFinish(() => {
      if (autoPlayNext) {
        playNext();
      } else {
        AudioPlayer.pause();
      }
    });
    return () => AudioPlayer.setOnFinish(null);
  }, [autoPlayNext]);

  // При выходе из папки ставим на паузу
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      AudioPlayer.pause();
    });
    return unsubscribe;
  }, [navigation]);

  const playSong = async (song) => {
    try {
      await AudioPlayer.loadSong(song, true);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось воспроизвести файл');
    }
  };

  const togglePlayPause = async () => {
    await AudioPlayer.toggle();
  };

  const playNext = () => {
    if (!currentSong || songs.length === 0) return;
    const index = songs.findIndex(s => s.id === currentSong.id);
    const nextIndex = (index + 1) % songs.length;
    playSong(songs[nextIndex]);
  };

  const playPrevious = () => {
    if (!currentSong || songs.length === 0) return;
    const index = songs.findIndex(s => s.id === currentSong.id);
    const prevIndex = (index - 1 + songs.length) % songs.length;
    playSong(songs[prevIndex]);
  };

  const handleSeek = async (value) => {
    if (currentSong && AudioPlayer.sound) {
      await AudioPlayer.sound.setPositionAsync(value * duration * 1000);
    }
  };

  const handleSortChange = (newSort) => {
    setSortMode(newSort);
  };

  const handleSongLongPress = (song) => {
    setSelectedSong(song);
    setActionDialogVisible(true);
  };

  const handleMove = () => {
    setActionDialogVisible(false);
    setMoveDialogVisible(true);
  };

  const handleShare = async () => {
    setActionDialogVisible(false);
    if (selectedSong) {
      await FileSystem.shareFile(selectedSong.uri);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Удаление',
      'Удалить этот трек?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            // Здесь логика удаления
            setActionDialogVisible(false);
            Alert.alert('Успех', 'Функция удаления будет добавлена');
          }
        }
      ]
    );
  };

  const handleMoveConfirm = async (destFolderUri) => {
    if (selectedSong) {
      await FileSystem.moveAudioFile(selectedSong.uri, destFolderUri);
      setMoveDialogVisible(false);
      setSelectedSong(null);
      // Обновляем список песен
      setSongs(prev => prev.filter(s => s.id !== selectedSong.id));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {IS_WEB_STUB && (
        <View style={styles.demoBanner}>
          <MaterialIcons name="info" size={16} color="#333" />
          <Text style={styles.demoText}> {WEB_STUB_MESSAGE}</Text>
        </View>
      )}
      
      <Header
        title={folderName}
        showBack
        onBack={() => navigation.goBack()}
        rightIcons={[
          { name: sortMode === 'shuffle' ? 'shuffle' : 'sort', onPress: () => setSortMenuVisible(true) },
          { name: 'settings', onPress: () => navigation.navigate('Settings', { settings }) }
        ]}
        settings={settings}
      />

      <FlatList
        data={songs}
        keyExtractor={item => item.id}
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
            <Text style={styles.emptyText}>В этой папке нет музыки</Text>
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
        progress={progress}
        duration={duration}
        onSeek={handleSeek}
        autoPlayNext={autoPlayNext}
        onToggleAutoPlay={() => setAutoPlayNext(!autoPlayNext)}
        settings={settings}
      />

      <SortMenu
        visible={sortMenuVisible}
        onClose={() => setSortMenuVisible(false)}
        currentSort={sortMode}
        onSortChange={handleSortChange}
      />

      <SongActionDialog
        visible={actionDialogVisible}
        onClose={() => setActionDialogVisible(false)}
        onMove={handleMove}
        onShare={handleShare}
        onDelete={handleDelete}
        song={selectedSong}
        settings={settings}
      />

      <MoveSongDialog
        visible={moveDialogVisible}
        folders={availableFolders}
        onSelect={handleMoveConfirm}
        onCancel={() => {
          setMoveDialogVisible(false);
          setSelectedSong(null);
        }}
        settings={settings}
        song={selectedSong}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  demoBanner: { 
    backgroundColor: '#FFD700', 
    padding: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  demoText: { color: '#333', fontSize: 12, fontWeight: '600' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16 },
  listContent: { 
    paddingBottom: 180,
  },
});
