import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header, FolderItem } from './MP04_Components';
import { getBrandColor, APP_FAVORITES_NAME, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';
import * as FileSystem from './MP02_FileSystem';

export default function PlaylistsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const rootFolder = route?.params?.rootFolder || 'media://library';
  const songsCount = route?.params?.songsCount || 0;
  
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState([]);
  const [folders, setFolders] = useState([]);
  const brandColor = getBrandColor(settings);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Загружаем сохраненные песни
    const savedSongs = await FileSystem.getSongsList();
    setSongs(savedSongs);
    
    // Здесь можно добавить логику для получения папок
    // Пока просто демо-данные
    setFolders([
      { id: 'folder1', name: 'Папка 1', uri: 'file:///storage/folder1' },
      { id: 'folder2', name: 'Папка 2', uri: 'file:///storage/folder2' },
    ]);
    
    setLoading(false);
  };

  const openFolder = (folder) => {
    // Фильтруем песни для этой папки
    const folderSongs = songs.filter(song => 
      song.uri.startsWith(folder.uri + '/')
    );
    
    navigation.navigate('Folder', {
      folderUri: folder.uri,
      folderName: folder.name,
      settings,
      songs: folderSongs,
      rootFolder: rootFolder
    });
  };

  const openRoot = () => {
    navigation.navigate('Folder', {
      folderUri: rootFolder,
      folderName: APP_FAVORITES_NAME,
      settings,
      songs: songs,
      isRoot: true
    });
  };

  const displayItems = [
    { id: 'root', name: APP_FAVORITES_NAME, uri: rootFolder, isRoot: true },
    ...folders
  ];

  return (
    <View style={styles.container}>
      {IS_WEB_STUB && (
        <View style={styles.demoBanner}>
          <MaterialIcons name="info" size={16} color="#333" />
          <Text style={styles.demoText}> {WEB_STUB_MESSAGE}</Text>
        </View>
      )}
      
      <Header 
        title="Плейлисты" 
        rightIcon="settings"
        onRightPress={() => navigation.navigate('Settings', { settings })}
        showSearch={false}
        settings={settings} 
      />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={styles.loading}>Загрузка...</Text>
        </View>
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <FolderItem 
              folder={{ ...item, color: brandColor }}
              onPress={() => item.isRoot ? openRoot() : openFolder(item)}
              settings={settings}
              songCount={item.isRoot ? songs.length : 0}
            />
          )}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.totalSongs}>
                Всего песен: {songs.length}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialIcons name="folder-off" size={64} color="#E0E0E0" />
              <Text style={styles.empty}>Нет папок</Text>
            </View>
          }
        />
      )}
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
});
