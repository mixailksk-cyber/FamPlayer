import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header, FolderItem } from './MP04_Components';
import { IS_WEB_STUB, WEB_STUB_MESSAGE, getBrandColor, APP_FAVORITES_NAME } from './MP01_Core';

export default function PlaylistsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const folders = route?.params?.folders || [];
  const songs = route?.params?.songs || [];
  const songsCount = route?.params?.songsCount || 0;
  const rootFolder = route?.params?.rootFolder || '';
  
  const [loading, setLoading] = useState(false);
  const [folderSongsCount, setFolderSongsCount] = useState({});
  const brandColor = getBrandColor(settings);

  useEffect(() => {
    calculateFolderSongsCount();
  }, []);

  const calculateFolderSongsCount = () => {
    const counts = {};
    
    // Считаем сколько песен в каждой папке
    songs.forEach(song => {
      const songFolder = song.uri.substring(0, song.uri.lastIndexOf('/'));
      counts[songFolder] = (counts[songFolder] || 0) + 1;
    });
    
    setFolderSongsCount(counts);
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
    // Песни в корневой папке (не во вложенных папках)
    const rootSongs = songs.filter(song => {
      const songFolder = song.uri.substring(0, song.uri.lastIndexOf('/'));
      return songFolder === rootFolder.replace('file://', '');
    });
    
    navigation.navigate('Folder', {
      folderUri: rootFolder,
      folderName: APP_FAVORITES_NAME,
      settings,
      songs: rootSongs,
      isRoot: true
    });
  };

  // Создаем список для отображения
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
          renderItem={({ item }) => {
            let count = item.isRoot 
              ? songs.filter(s => {
                  const songFolder = s.uri.substring(0, s.uri.lastIndexOf('/'));
                  return songFolder === rootFolder.replace('file://', '');
                }).length
              : folderSongsCount[item.uri.replace('file://', '')] || 0;
            
            return (
              <FolderItem 
                folder={{ ...item, color: brandColor }}
                onPress={() => item.isRoot ? openRoot() : openFolder(item)}
                settings={settings}
                songCount={count}
              />
            );
          }}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.totalSongs}>
                Всего песен: {songsCount}
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
