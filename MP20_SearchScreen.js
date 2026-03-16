import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Header, SongItem, MoveSongDialog } from './MP04_Components';
import { getBrandColor } from './MP01_Core';
import * as FileSystem from './MP02_FileSystem';
import AudioPlayer from './MP03_AudioPlayer';

export default function SearchScreen({ navigation, route }) {
  // Используем useMemo для стабилизации объекта settings
  const settings = useMemo(() => route?.params?.settings || {}, [route?.params?.settings]);
  const fromScreen = route?.params?.fromScreen || 'Playlists';
  const [query, setQuery] = useState('');
  const [allSongs, setAllSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [trash, setTrash] = useState([]);
  const [moveDialogVisible, setMoveDialogVisible] = useState(false);
  const [selectedSongForMove, setSelectedSongForMove] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  
  const inputRef = useRef(null);
  const brandColor = getBrandColor(settings);

  useEffect(() => {
    loadAllSongs();
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Синхронизация с плеером
  useEffect(() => {
    const interval = setInterval(() => {
      const status = AudioPlayer.getStatus();
      setCurrentSong(status.currentSong);
      setIsPlaying(status.isPlaying);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const loadAllSongs = async () => {
    setLoading(true);
    const songs = await FileSystem.getAllSongs();
    const favIds = await FileSystem.getFavorites();
    const trashIds = await FileSystem.getTrash();
    setAllSongs(songs);
    setFavorites(favIds);
    setTrash(trashIds);
    setLoading(false);
  };

  // Поиск ТОЛЬКО по названию файла
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allSongs.filter(song => 
      song.title && song.title.toLowerCase().includes(q)
    );
  }, [query, allSongs]);

  const handleSongPress = useCallback((song) => {
    // Переходим в папку с этой песней
    if (song.folder === 'favorites' || favorites.includes(song.id)) {
      navigation.navigate('Folder', {
        folderUri: 'favorites',
        folderName: 'Избранное',
        settings: settings,
        isSystem: true
      });
    } else if (song.folder === 'trash' || trash.includes(song.id)) {
      navigation.navigate('Folder', {
        folderUri: 'trash',
        folderName: 'Корзина',
        settings: settings,
        isSystem: true
      });
    } else {
      navigation.navigate('Folder', {
        folderUri: `demo://${song.folder}`,
        folderName: song.folder || 'Папка',
        settings: settings
      });
    }
    
    // Начинаем воспроизведение
    setTimeout(() => {
      AudioPlayer.loadSong(song, true);
    }, 100);
  }, [navigation, settings, favorites, trash]);

  const handleSongLongPress = useCallback((song) => {
    if (isPlaying && currentSong?.id === song.id) {
      Alert.alert('Остановите воспроизведение', 'Для перемещения песни сначала поставьте её на паузу');
    } else {
      setSelectedSongForMove(song);
      setMoveDialogVisible(true);
    }
  }, [isPlaying, currentSong]);

  const handleMove = useCallback(async (destFolderUri, destFolderName) => {
    if (!selectedSongForMove) return;
    
    if (destFolderName === 'Избранное') {
      await FileSystem.addToFavorites(selectedSongForMove.id);
    } else if (destFolderName === 'Корзина') {
      await FileSystem.addToTrash(selectedSongForMove.id);
    }
    
    setMoveDialogVisible(false);
    setSelectedSongForMove(null);
    Alert.alert('Успех', 'Файл перемещен');
    
    // Обновляем списки
    const favIds = await FileSystem.getFavorites();
    const trashIds = await FileSystem.getTrash();
    setFavorites(favIds);
    setTrash(trashIds);
  }, [selectedSongForMove]);

  return (
    <View style={styles.container}>
      <Header 
        title="Поиск" 
        showBack 
        onBack={() => navigation.goBack()} 
        settings={settings}
        fromScreen={fromScreen}
      />
      
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Введите название трека"
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
            <MaterialIcons name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text>Загрузка...</Text>
        </View>
      ) : query.trim() === '' ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="search" size={64} color="#E0E0E0" />
          <Text style={styles.hintText}>Введите название для поиска</Text>
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="search-off" size={64} color="#E0E0E0" />
          <Text style={styles.noResultsText}>Ничего не найдено</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <SongItem 
              item={{
                ...item,
                favorite: favorites.includes(item.id),
                inTrash: trash.includes(item.id)
              }}
              onPress={() => handleSongPress(item)}
              onLongPress={() => handleSongLongPress(item)}
              settings={settings}
              isPlaying={currentSong?.id === item.id && isPlaying}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <MoveSongDialog
        visible={moveDialogVisible}
        folders={[]}
        onSelect={handleMove}
        onCancel={() => {
          setMoveDialogVisible(false);
          setSelectedSongForMove(null);
        }}
        settings={settings}
        song={selectedSongForMove}
        isPlaying={isPlaying && currentSong?.id === selectedSongForMove?.id}
        showFavorites={true}
        showTrash={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  hintText: {
    marginTop: 16,
    color: '#999',
    fontSize: 16,
  },
  noResultsText: {
    marginTop: 16,
    color: '#999',
    fontSize: 18,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
});