import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header, FolderItem } from './MP04_Components';
import { getBrandColor, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';

export default function PlaylistsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const brandColor = getBrandColor(settings);
  
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const foldersStr = await AsyncStorage.getItem('scanned_folders');
      
      if (foldersStr) {
        const parsedFolders = JSON.parse(foldersStr);
        const foldersWithSongs = parsedFolders.filter(folder => (folder.count || 0) > 0);
        setFolders(foldersWithSongs);
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
            onPress={() => openFolder(item)}
            settings={settings}
            songCount={item.count || 0}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <MaterialIcons name="folder-off" size={64} color="#E0E0E0" />
            <Text style={styles.empty}>Нет папок с музыкой</Text>
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
});
