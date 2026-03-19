import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header, FolderItem } from './MP04_Components';
import { getBrandColor, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';
import { getFoldersList } from './MP02_FileSystem';

export default function PlaylistsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const brandColor = getBrandColor(settings);
  
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  // Следим за параметрами маршрута (обновление после сканирования)
  useEffect(() => {
    if (route.params?.folders) {
      setFolders(route.params.folders);
      setLoading(false);
    } else {
      loadData();
    }
  }, [route.params]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const savedFolders = await getFoldersList();
      // Фильтруем папки, оставляем только те, где есть песни
      const foldersWithSongs = savedFolders.filter(folder => (folder.count || 0) > 0);
      setFolders(foldersWithSongs);
      console.log(`📂 Загружено ${foldersWithSongs.length} папок с песнями`);
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
      totalSongs: folder.count || 0
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header 
          title="Плейлисты" 
          rightIcon="settings"
          onRightPress={() => navigation.navigate('Settings', { settings })}
          settings={settings} 
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={styles.loadingText}>Загрузка плейлистов...</Text>
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
        settings={settings} 
      />
      
      {IS_WEB_STUB && (
        <View style={styles.demoBanner}>
          <MaterialIcons name="info" size={16} color="#333" />
          <Text style={styles.demoText}> {WEB_STUB_MESSAGE}</Text>
        </View>
      )}
      
      {folders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="folder-off" size={80} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Нет папок с музыкой</Text>
          <Text style={styles.emptySubtitle}>
            Нажмите на шестеренку и запустите сканирование медиатеки
          </Text>
          <TouchableOpacity 
            style={[styles.scanButton, { backgroundColor: brandColor }]}
            onPress={() => navigation.navigate('Settings', { settings })}
          >
            <MaterialIcons name="search" size={20} color="white" />
            <Text style={styles.scanButtonText}>Сканировать</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={folders}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <FolderItem 
              folder={{
                ...item,
                color: brandColor
              }}
              onPress={() => openFolder(item)}
              settings={settings}
              songCount={item.count || 0}
            />
          )}
          contentContainerStyle={styles.listContent}
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
  loadingText: { marginTop: 16, color: '#999', fontSize: 16 },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#333', 
    marginTop: 16 
  },
  emptySubtitle: { 
    fontSize: 14, 
    color: '#999', 
    textAlign: 'center', 
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 20
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  scanButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 8 
  },
  listContent: {
    paddingBottom: 20,
  },
});
