import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header, FolderItem } from './MP04_Components';
import { getBrandColor, APP_FAVORITES_NAME, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';

export default function PlaylistsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const brandColor = getBrandColor(settings);
  
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const foldersStr = await AsyncStorage.getItem('scanned_folders');
      const songsStr = await AsyncStorage.getItem('scanned_songs');
      
      if (foldersStr) {
        const parsedFolders = JSON.parse(foldersStr);
        setFolders(parsedFolders);
      }
      
      if (songsStr) {
        const parsedSongs = JSON.parse(songsStr);
        setSongs(parsedSongs);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openFolder = (folder) => {
    navigation.navigate('Folder', {
      folderId: folder.id,
      folderName: folder.name,
      settings,
      songs: folder.songs || [],
    });
  };

  const openAllSongs = () => {
    navigation.navigate('Folder', {
      folderId: 'all_songs',
      folderName: APP_FAVORITES_NAME,
      settings,
      songs: songs,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header 
          title="Плейлисты" 
          rightIcons={[{ name: 'settings', onPress: () => navigation.navigate('Settings', { settings }) }]}
          settings={settings} 
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={styles.loading}>Загрузка...</Text>
        </View>
      </View>
    );
  }

  const displayFolders = [
    {
      id: 'all_songs',
      name: APP_FAVORITES_NAME,
      count: songs.length,
      songs: songs
    },
    ...folders
  ];

  return (
    <View style={styles.container}>
      <Header 
        title="Плейлисты" 
        rightIcons={[{ name: 'settings', onPress: () => navigation.navigate('Settings', { settings }) }]}
        settings={settings} 
      />
      
      {IS_WEB_STUB && (
        <View style={styles.demoBanner}>
          <MaterialIcons name="info" size={16} color="#333" />
          <Text style={styles.demoText}> {WEB_STUB_MESSAGE}</Text>
        </View>
      )}
      
      <FlatList
        data={displayFolders}
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
        ListEmptyComponent={
          <View style={styles.center}>
            <MaterialIcons name="folder-off" size={64} color="#E0E0E0" />
            <Text style={styles.empty}>Нет выбранных папок</Text>
            <Text style={styles.emptySubtext}>
              Зайдите в настройки и выберите папки для отображения
            </Text>
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
  emptySubtext: { 
    fontSize: 14, 
    color: '#999', 
    marginTop: 8, 
    textAlign: 'center',
    paddingHorizontal: 20 
  },
});
