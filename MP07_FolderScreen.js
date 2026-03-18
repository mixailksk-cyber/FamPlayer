import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, Alert, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, SongItem, PlayerControls } from './MP04_Components';
import { getBrandColor, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';
import AudioPlayer from './MP03_AudioPlayer';

export default function FolderScreen({ route, navigation }) {
  const params = route?.params || {};
  const folderName = params.folderName || 'Папка';
  const settings = params.settings || {};
  const songs = params.songs || [];
  const totalSongs = params.totalSongs || songs.length;
  
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [debug, setDebug] = useState([]);
  const brandColor = getBrandColor(settings);
  const insets = useSafeAreaInsets();

  // Добавляем отладку
  const addDebug = (message) => {
    console.log(`[FolderScreen] ${message}`);
    setDebug(prev => [...prev.slice(-5), message]); // Храним последние 5 сообщений
  };

  // Синхронизация с плеером
  useEffect(() => {
    addDebug('Component mounted');
    const interval = setInterval(() => {
      const status = AudioPlayer.getStatus();
      setCurrentSong(status.currentSong);
      setIsPlaying(status.isPlaying);
    }, 100);
    return () => {
      clearInterval(interval);
      addDebug('Component unmounted');
    };
  }, []);

  // Устанавливаем плейлист при загрузке
  useEffect(() => {
    if (songs.length > 0) {
      addDebug(`Setting playlist with ${songs.length} songs`);
      AudioPlayer.setPlaylist(songs);
    }
  }, [songs]);

  const playSong = async (song) => {
    try {
      addDebug(`Attempting to play: ${song.title}`);
      
      // Проверяем наличие URI
      if (!song.uri) {
        throw new Error('No URI for song');
      }
      
      addDebug(`Song URI: ${song.uri}`);
      
      const result = await AudioPlayer.loadSong(song, true);
      
      if (result) {
        addDebug(`✅ Playback started successfully`);
      } else {
        addDebug(`❌ Failed to start playback`);
      }
    } catch (error) {
      addDebug(`❌ Error: ${error.message}`);
      Alert.alert('Ошибка', `Не удалось воспроизвести файл: ${error.message}`);
    }
  };

  const togglePlayPause = async () => {
    try {
      addDebug(`Toggle play/pause`);
      await AudioPlayer.toggle();
    } catch (error) {
      addDebug(`❌ Toggle error: ${error.message}`);
    }
  };

  const playNext = () => {
    if (!currentSong || songs.length === 0) return;
    const index = songs.findIndex(s => s.id === currentSong.id);
    const nextIndex = (index + 1) % songs.length;
    addDebug(`Playing next: ${songs[nextIndex].title}`);
    playSong(songs[nextIndex]);
  };

  const playPrevious = () => {
    if (!currentSong || songs.length === 0) return;
    const index = songs.findIndex(s => s.id === currentSong.id);
    const prevIndex = (index - 1 + songs.length) % songs.length;
    addDebug(`Playing previous: ${songs[prevIndex].title}`);
    playSong(songs[prevIndex]);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
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
        showSearch={false}
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

      {/* Отладочная панель */}
      <View style={styles.debugPanel}>
        <Text style={styles.debugTitle}>🔍 Отладка плеера:</Text>
        {debug.map((msg, i) => (
          <Text key={i} style={styles.debugLine}>{msg}</Text>
        ))}
      </View>

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
    paddingBottom: 180, // Увеличен отступ для панели отладки
  },
  debugPanel: {
    backgroundColor: '#1A1A1A',
    margin: 10,
    padding: 8,
    borderRadius: 8,
    position: 'absolute',
    bottom: 100,
    left: 10,
    right: 10,
    zIndex: 1000,
  },
  debugTitle: {
    color: '#FFA500',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  debugLine: {
    color: '#0F0',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
