import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Header } from './PL04_Components';
import { getBrandColor, BRAND_COLOR } from './PL01_Core';
import { scanMusic, saveFoldersList, saveSongsList, getFoldersList } from './PL02_FileSystem';

export default function PlaylistsScreen({ navigation, route }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const settings = route?.params?.settings || { brandColor: BRAND_COLOR };
  const brandColor = getBrandColor(settings);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      let savedFolders = await getFoldersList();
      
      if (savedFolders.length === 0) {
        const result = await scanMusic();
        savedFolders = result.folders;
        await saveFoldersList(savedFolders);
        await saveSongsList(result.songs);
      }
      
      setFolders(savedFolders);
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

  const openSettings = () => {
    navigation.navigate('Settings', { settings });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Плейлисты" showSettings onSettingsPress={openSettings} settings={settings} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={styles.loadingText}>Сканирование музыки...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Плейлисты" showSettings onSettingsPress={openSettings} settings={settings} />
      
      {folders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="music-off" size={80} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Нет музыки</Text>
          <Text style={styles.emptySubtitle}>
            Не найдено аудиофайлов на устройстве
          </Text>
          <TouchableOpacity 
            style={[styles.scanButton, { backgroundColor: brandColor }]}
            onPress={loadData}
          >
            <Icon name="refresh" size={20} color="white" />
            <Text style={styles.scanButtonText}>Обновить</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={folders}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.folderItem} onPress={() => openFolder(item)}>
              <View style={[styles.folderIcon, { backgroundColor: brandColor }]}>
                <Text style={styles.folderCount}>{item.count || 0}</Text>
              </View>
              <Text style={styles.folderName}>{item.name}</Text>
              <Icon name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 16, color: '#999', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8, marginBottom: 24, paddingHorizontal: 20 },
  scanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  scanButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  listContent: { paddingBottom: 20 },
  folderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  folderIcon: { width: 44, height: 44, borderRadius: 8, marginRight: 16, justifyContent: 'center', alignItems: 'center' },
  folderCount: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  folderName: { fontSize: 16, color: '#333', flex: 1 },
});
