import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from './MP02_FileSystem';
import { Header, FolderItem } from './MP04_Components';
import { IS_WEB_STUB, WEB_STUB_MESSAGE, getBrandColor, APP_FAVORITES_NAME } from './MP01_Core';

export default function PlaylistsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const songsCount = route?.params?.songsCount || 0;
  const [loading, setLoading] = useState(true);
  const [audioFiles, setAudioFiles] = useState([]);
  const brandColor = getBrandColor(settings);

  useEffect(() => {
    loadAudioFiles();
  }, []);

  const loadAudioFiles = async () => {
    if (IS_WEB_STUB) {
      setLoading(false);
      return;
    }

    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 100,
      });
      setAudioFiles(media.assets);
    } catch (error) {
      console.error('Error loading audio files:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAllSongs = () => {
    navigation.navigate('Folder', {
      folderUri: 'media://all',
      folderName: 'Все песни',
      settings,
      songs: audioFiles,
    });
  };

  const displayItems = [
    { id: 'all', name: 'Все песни', uri: 'media://all', isSystem: true },
    { id: 'favorites', name: APP_FAVORITES_NAME, uri: 'media://favorites', isSystem: true },
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
        title="Моя музыка" 
        rightIcon="settings"
        onRightPress={() => navigation.navigate('Settings', { settings })}
        showSearch 
        onSearchPress={() => navigation.navigate('Search', { settings, fromScreen: 'Playlists' })} 
        settings={settings} 
      />
      
      {loading ? (
        <View style={styles.center}>
          <MaterialIcons name="library-music" size={48} color="#E0E0E0" />
          <Text style={styles.loading}>Загрузка музыки...</Text>
        </View>
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <FolderItem 
              folder={{ ...item, color: brandColor }}
              onPress={openAllSongs}
              settings={settings}
              songCount={item.id === 'all' ? audioFiles.length : 0}
            />
          )}
          ListFooterComponent={
            <Text style={styles.footer}>
              Найдено {audioFiles.length} музыкальных файлов
            </Text>
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
  footer: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontSize: 14,
  },
});
