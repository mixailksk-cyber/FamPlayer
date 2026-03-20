import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Text, Alert, SafeAreaView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, SongItem, PlayerControls, SortMenu, SongLongPressDialog } from './MP04_Components';
import { getBrandColor, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';
import AudioPlayer from './MP03_AudioPlayer';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { getFoldersList } from './MP02_FileSystem';

export default function FolderScreen({ route, navigation }) {
  const params = route?.params || {};
  const folderName = params.folderName || 'Папка';
  const settings = params.settings || {};
  const initialSongs = params.songs || [];
  const folderId = params.folderId;
  
  const [songs, setSongs] = useState(initialSongs);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [autoPlayMode, setAutoPlayMode] = useState(true);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState('title');
  const [longPressDialogVisible, setLongPressDialogVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [allFolders, setAllFolders] = useState([]);

  const brandColor = getBrandColor(settings);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    const folders = await getFoldersList();
    const otherFolders = folders.filter(f => f.id !== folderId);
    setAllFolders(otherFolders);
  };

  const sortSongs = useCallback((songsToSort, sortType) => {
    const sorted = [...songsToSort];
    
    if (sortType === 'random') {
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      return sorted;
    }

    return sorted.sort((a, b) => {
      switch(sortType) {
        case 'addedAt':
          return (b.addedAt || 0) - (a.addedAt || 0);
        case 'title':
        default:
          return (a.title || '').localeCompare(b.title || '', 'ru');
      }
    });
  }, []);

  const handleSort = (sortType) => {
    setCurrentSort(sortType);
    const sortedSongs = sortSongs(initialSongs, sortType);
    setSongs(sortedSongs);
    
    const currentIndex = currentSong ? sortedSongs.findIndex(s => s.id === currentSong.id) : 0;
    AudioPlayer.setPlaylist(sortedSongs, currentIndex >= 0 ? currentIndex : 0);
    AudioPlayer.shuffleMode = sortType === 'random';
    setShuffleMode(sortType === 'random');
  };

  useEffect(() => {
    AudioPlayer.setOnFinish(() => {
      if (autoPlayMode) {
        AudioPlayer.playNext();
      }
    });

    const interval = setInterval(() => {
      const status = AudioPlayer.getStatus();
      setCurrentSong(status.currentSong);
      setIsPlaying(status.isPlaying);
      setShuffleMode(status.shuffleMode);
      setAutoPlayMode(status.autoPlayMode);
    }, 100);
    
    return () => clearInterval(interval);
  }, [autoPlayMode]);

  useEffect(() => {
    if (initialSongs.length > 0) {
      const sortedSongs = sortSongs(initialSongs, currentSort);
      setSongs(sortedSongs);
      AudioPlayer.setPlaylist(sortedSongs);
    }
  }, [initialSongs]);

  const playSong = async (song) => {
    try {
      await AudioPlayer.loadSong(song, true);
    } catch (error) {
      Alert.alert('Ошибка', `Не удалось воспроизвести файл: ${error.message}`);
    }
  };

  const togglePlayPause = async () => {
    await AudioPlayer.toggle();
  };

  const playNext = () => {
    if (!currentSong || songs.length === 0) return;
    AudioPlayer.playNext();
  };

  const playPrevious = () => {
    if (!currentSong || songs.length === 0) return;
    AudioPlayer.playPrevious();
  };

  const toggleShuffle = () => {
    AudioPlayer.toggleShuffle();
  };

  const toggleAutoPlay = () => {
    AudioPlayer.toggleAutoPlay();
  };

  const openSettings = () => {
    navigation.navigate('Settings', { settings });
  };

  // Переименование файла через MediaStore
  const handleRename = async (song, newName) => {
    try {
      Alert.alert(
        'Переименование файла',
        `Переименовать "${song.title}" в "${newName}.mp3"?\n\nВнимание: Изменение имени файла может повлиять на его отображение в медиатеке.`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Переименовать',
            onPress: async () => {
              try {
                // Для файлов на SD-карте через MediaStore
                const asset = await MediaLibrary.getAssetInfoAsync(song.id);
                if (asset) {
                  // MediaStore не поддерживает прямое переименование
                  // Показываем инструкцию
                  Alert.alert(
                    'Инструкция',
                    'Для переименования файлов на SD-карте используйте файловый менеджер.\n\n' +
                    '1. Откройте файловый менеджер\n' +
                    '2. Найдите папку: ' + asset.uri.split('/').slice(0, -1).join('/') + '\n' +
                    '3. Переименуйте файл вручную\n\n' +
                    'После переименования обновите медиатеку в настройках.',
                    [{ text: 'Понятно' }]
                  );
                }
              } catch (error) {
                Alert.alert('Ошибка', 'Не удалось получить информацию о файле');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось переименовать файл');
    }
  };

  // Перемещение файла через MediaStore
  const handleMove = async (song, destinationFolder) => {
    try {
      if (destinationFolder.uri.startsWith('album://')) {
        Alert.alert('Ошибка', 'Перемещение в виртуальные папки недоступно. Выберите реальную папку на устройстве.');
        return;
      }

      Alert.alert(
        'Перемещение файла',
        `Переместить "${song.title}" в папку "${destinationFolder.name}"?\n\n` +
        `Внимание: Файлы на SD-карте могут не перемещаться через приложение.`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Переместить',
            onPress: async () => {
              try {
                const asset = await MediaLibrary.getAssetInfoAsync(song.id);
                if (asset) {
                  Alert.alert(
                    'Инструкция',
                    'Для перемещения файлов на SD-карте используйте файловый менеджер.\n\n' +
                    '1. Откройте файловый менеджер\n' +
                    '2. Найдите текущую папку: ' + asset.uri.split('/').slice(0, -1).join('/') + '\n' +
                    '3. Переместите файл в: ' + destinationFolder.name + '\n\n' +
                    'После перемещения обновите медиатеку в настройках.',
                    [{ text: 'Понятно' }]
                  );
                }
              } catch (error) {
                Alert.alert('Ошибка', 'Не удалось получить информацию о файле');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось переместить файл');
    }
  };

  // Шаринг файла
  const handleShare = async (song) => {
    try {
      const fileUri = song.uri;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Ошибка', 'Шеринг не доступен на этом устройстве');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось поделиться файлом');
    }
  };

  // Удаление файла через MediaStore
  const handleDelete = async (song) => {
    try {
      Alert.alert(
        'Удаление файла',
        `Удалить "${song.title}"?`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Удалить',
            style: 'destructive',
            onPress: async () => {
              try {
                // Пытаемся удалить через MediaLibrary
                const deleted = await MediaLibrary.deleteAssetsAsync([song.id]);
                if (deleted) {
                  const updatedSongs = songs.filter(s => s.id !== song.id);
                  setSongs(updatedSongs);
                  
                  if (currentSong?.id === song.id) {
                    await AudioPlayer.unload();
                  }
                  
                  Alert.alert('Успех', 'Файл удален');
                } else {
                  Alert.alert(
                    'Не удалось удалить',
                    'Файл находится на SD-карте. Удалите его вручную через файловый менеджер.',
                    [{ text: 'OK' }]
                  );
                }
              } catch (error) {
                Alert.alert(
                  'Не удалось удалить',
                  'Файл находится на SD-карте. Удалите его вручную через файловый менеджер.\n\n' +
                  '1. Откройте файловый менеджер\n' +
                  '2. Найдите файл: ' + song.title + '\n' +
                  '3. Удалите файл вручную\n\n' +
                  'После удаления обновите медиатеку в настройках.',
                  [{ text: 'Понятно' }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось удалить файл');
    }
  };

  const handleSongLongPress = (song) => {
    if (isPlaying && currentSong?.id === song.id) {
      Alert.alert('Воспроизведение', 'Сначала поставьте песню на паузу');
      return;
    }
    setSelectedSong(song);
    setLongPressDialogVisible(true);
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
        showAutoPlay
        onAutoPlayPress={toggleAutoPlay}
        autoPlayMode={autoPlayMode}
        showSort
        onSortPress={() => setSortMenuVisible(true)}
        sortMode={currentSort}
        showSettings
        onSettingsPress={openSettings}
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

      <SortMenu
        visible={sortMenuVisible}
        onClose={() => setSortMenuVisible(false)}
        onSelect={handleSort}
        currentSort={currentSort}
      />

      <SongLongPressDialog
        visible={longPressDialogVisible}
        song={selectedSong}
        folders={allFolders}
        onClose={() => setLongPressDialogVisible(false)}
        onRename={handleRename}
        onMove={handleMove}
        onShare={handleShare}
        onDelete={handleDelete}
        settings={settings}
      />

      <PlayerControls
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        onNext={playNext}
        onPrevious={playPrevious}
        settings={settings}
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
    paddingBottom: 100,
  },
});
