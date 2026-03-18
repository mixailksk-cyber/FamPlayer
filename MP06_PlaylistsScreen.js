import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header, FolderItem } from './MP04_Components';
import { getBrandColor, APP_FAVORITES_NAME, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';
import * as FileSystem from './MP02_FileSystem';

export default function PlaylistsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const scanMode = route?.params?.scanMode;
  const brandColor = getBrandColor(settings);
  
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [songs, setSongs] = useState([]);
  const [totalSongs, setTotalSongs] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Загружаем сохраненные данные
      const foldersStr = await AsyncStorage.getItem('scanned_folders');
      const songsStr = await AsyncStorage.getItem('scanned_songs');
      
      if (foldersStr) {
        const parsedFolders = JSON.parse(foldersStr);
        setFolders(parsedFolders);
        console.log(`Loaded ${parsedFolders.length} folders`);
      }
      
      if (songsStr) {
        const parsedSongs = JSON.parse(songsStr);
        setSongs(parsedSongs);
        setTotalSongs(parsedSongs.length);
        console.log(`Loaded ${parsedSongs.length} songs`);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openFolder = (folder) => {
    // Для медиатеки folder.songs уже есть
    // Для файловой системы нужно будет фильтровать
    const folderSongs = folder.songs || [];
    
    navigation.navigate('Folder', {
      folderId: folder.id,
      folderName: folder.name,
      settings,
      songs: folderSongs,
      totalSongs: folderSongs.length
    });
  };

  const openAllSongs = () => {
    navigation.navigate('Folder', {
      folderId: 'all_songs',
      folderName: APP_FAVORITES_NAME,
      settings,
      songs: songs,
      totalSongs: songs.length,
      isAllSongs: true
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header 
          title="Плейлисты" 
          rightIcon="settings"
          onRightPress={() => navigation.navigate('Settings', { settings })}
          showSearch={false}
          settings={settings} 
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={styles.loading}>Загрузка...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Плейлисты" 
        rightIcon="settings"
        onRightPress={() => navigation.navigate('Settings', { settings })}
        showSearch={false}
        settings={settings} 
      />
      
      {IS_WEB_STUB && (
        <View style={styles.demoBanner}>
          <MaterialIcons name="info" size={16} color="#333" />
          <Text style={styles.demoText}> {WEB_STUB_MESSAGE}</Text>
        </View>
      )}
      
      <FlatList
        data={folders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <FolderItem 
            folder={{
              ...item,
              color: brandColor
            }}
            onPress={() => item.id === 'all_songs' ? openAllSongs() : openFolder(item)}
            settings={settings}
            songCount={item.count || 0}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.totalSongs}>
              Всего песен: {totalSongs}
            </Text>
            {scanMode && (
              <Text style={styles.scanMode}>
                Режим: {scanMode === 'media' ? 'Медиатека' : 'Файловая система'}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <MaterialIcons name="folder-off" size={64} color="#E0E0E0" />
            <Text style={styles.empty}>Нет папок</Text>
          </View>
        }
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loading: { marginTop: 16, color: '#999', fontSize: 16 },
  empty: { fontSize: 20, fontWeight: '600', color: '#333', marginTop: 16 },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  totalSongs: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scanMode: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});
