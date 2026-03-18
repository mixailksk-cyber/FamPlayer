import React, { useState, useEffect } from 'react';
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
  
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songs, setSongs] = useState(initialSongs);
  const [sortMode, setSortMode] = useState('addedAt');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  
  const brandColor = getBrandColor(settings);
  const insets = useSafeAreaInsets();

  // Сортировка песен
  useEffect(() => {
    let sorted = [...initialSongs];
    
    if (sortMode === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortMode === 'shuffle') {
      sorted = [...initialSongs].sort(() => Math.random() - 0.5);
    } else {
      // addedAt - сортируем по дате добавления (новые сверху)
      sorted.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    }
    
    setSongs(sorted);
    
    // Обновляем плейлист в плеере
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
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const playSong = async (song) => {
    try {
      await AudioPlayer.loadSong(song, true);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось воспроизвести файл');
    }
  };

  const togglePlayPause = async () => {
    try {
      await AudioPlayer.toggle();
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
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

  const handleSortChange = (newSort) => {
    setSortMode(newSort);
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
        settings={settings}
      />

      <SortMenu
        visible={sortMenuVisible}
        onClose={() => setSortMenuVisible(false)}
        currentSort={sortMode}
        onSortChange={handleSortChange}
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
    paddingBottom: 80,
  },
});
