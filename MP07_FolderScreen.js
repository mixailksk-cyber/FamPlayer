import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Text, Alert, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, SongItem, PlayerControls, SortMenu } from './MP04_Components';
import { getBrandColor, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';
import AudioPlayer from './MP03_AudioPlayer';

export default function FolderScreen({ route, navigation }) {
  const params = route?.params || {};
  const folderName = params.folderName || 'Папка';
  const settings = params.settings || {};
  const initialSongs = params.songs || [];
  
  const [songs, setSongs] = useState(initialSongs);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [autoPlayMode, setAutoPlayMode] = useState(true);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState('title');
  const [debug, setDebug] = useState([]);
  
  const brandColor = getBrandColor(settings);
  const insets = useSafeAreaInsets();

  const addDebug = (message) => {
    console.log(`[FolderScreen] ${message}`);
    setDebug(prev => [...prev.slice(-5), message]);
  };

  // Сортировка песен
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
    addDebug('Компонент загружен');
    
    AudioPlayer.setOnFinish(() => {
      addDebug('Трек закончился');
      if (autoPlayMode) {
        addDebug('Автовоспроизведение: включаем следующий');
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
    
    return () => {
      clearInterval(interval);
      addDebug('Компонент размонтирован');
    };
  }, [autoPlayMode]);

  useEffect(() => {
    if (initialSongs.length > 0) {
      addDebug(`Установлен плейлист с ${initialSongs.length} песнями`);
      const sortedSongs = sortSongs(initialSongs, currentSort);
      setSongs(sortedSongs);
      AudioPlayer.setPlaylist(sortedSongs);
    }
  }, [initialSongs, currentSort, sortSongs]);

  const playSong = async (song) => {
    try {
      addDebug(`Попытка воспроизвести: ${song.title}`);
      
      if (!song.uri) {
        throw new Error('Нет URI для песни');
      }
      
      addDebug(`URI песни: ${song.uri.substring(0, 50)}...`);
      
      const result = await AudioPlayer.loadSong(song, true);
      
      if (result) {
        addDebug(`✅ Воспроизведение запущено`);
      } else {
        addDebug(`❌ Не удалось запустить воспроизведение`);
      }
    } catch (error) {
      addDebug(`❌ Ошибка: ${error.message}`);
      Alert.alert('Ошибка', `Не удалось воспроизвести файл: ${error.message}`);
    }
  };

  const togglePlayPause = async () => {
    try {
      addDebug(`Переключение play/pause`);
      await AudioPlayer.toggle();
    } catch (error) {
      addDebug(`❌ Ошибка переключения: ${error.message}`);
    }
  };

  const playNext = () => {
    if (!currentSong || songs.length === 0) return;
    addDebug(`Следующий трек`);
    AudioPlayer.playNext();
  };

  const playPrevious = () => {
    if (!currentSong || songs.length === 0) return;
    addDebug(`Предыдущий трек`);
    AudioPlayer.playPrevious();
  };

  const toggleShuffle = () => {
    AudioPlayer.toggleShuffle();
  };

  const toggleAutoPlay = () => {
    AudioPlayer.toggleAutoPlay();
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
        showShuffle
        onShufflePress={toggleShuffle}
        shuffleMode={shuffleMode}
        showAutoPlay
        onAutoPlayPress={toggleAutoPlay}
        autoPlayMode={autoPlayMode}
        showSort
        onSortPress={() => setSortMenuVisible(true)}
        rightIcon="settings"
        onRightPress={() => navigation.navigate('Settings', { settings, fromScreen: 'Folder' })}
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
