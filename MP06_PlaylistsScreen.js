import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header, FolderItem } from './MP04_Components';
import { getBrandColor, APP_FAVORITES_NAME, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';

export default function PlaylistsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const scanTimestamp = route?.params?.scanTimestamp;
  const brandColor = getBrandColor(settings);
  
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState('Загрузка данных...');
  const [folders, setFolders] = useState([]);
  const [songs, setSongs] = useState([]);
  const [folderSongsCount, setFolderSongsCount] = useState({});
  const [rootFolder, setRootFolder] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  const maxRetries = 5;
  const retryDelay = 500;
  const loadAttempts = useRef(0);

  // ==========================================
  // ЗАГРУЗКА ДАННЫХ С ПОВТОРНЫМИ ПОПЫТКАМИ
  // ==========================================
  
  useEffect(() => {
    loadDataWithRetry();
  }, [scanTimestamp, retryCount]);

  const loadDataWithRetry = async () => {
    loadAttempts.current += 1;
    setLoadingProgress(`Загрузка данных... Попытка ${loadAttempts.current}`);
    
    try {
      const data = await loadData();
      
      if (data) {
        // Данные успешно загружены
        setFolders(data.folders);
        setSongs(data.songs);
        setRootFolder(data.rootFolder);
        calculateFolderSongsCount(data.songs, data.folders);
        setLoading(false);
      } else if (loadAttempts.current < maxRetries) {
        // Данных нет, пробуем снова через задержку
        setLoadingProgress(`Данные не готовы, повтор через ${retryDelay}мс...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, retryDelay);
      } else {
        // Превышено количество попыток
        setLoadingProgress('Не удалось загрузить данные');
        setTimeout(() => setLoading(false), 2000);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLoadingProgress(`Ошибка: ${error.message}`);
      setTimeout(() => setLoading(false), 2000);
    }
  };

  // ==========================================
  // ЗАГРУЗКА ДАННЫХ ИЗ STORAGE
  // ==========================================
  
  const loadData = async () => {
    try {
      // Загружаем данные параллельно
      const [foldersStr, songsStr, savedFolderStr] = await Promise.all([
        AsyncStorage.getItem('scanned_folders'),
        AsyncStorage.getItem('scanned_songs'),
        AsyncStorage.getItem('selected_folder')
      ]);
      
      // Проверяем, что данные действительно загрузились
      if (!foldersStr || !songsStr) {
        console.log('Data not ready yet');
        return null;
      }
      
      const parsedFolders = JSON.parse(foldersStr);
      const parsedSongs = JSON.parse(songsStr);
      
      return {
        folders: parsedFolders || [],
        songs: parsedSongs || [],
        rootFolder: savedFolderStr || ''
      };
      
    } catch (error) {
      console.error('Error parsing data:', error);
      return null;
    }
  };

  // ==========================================
  // ПОДСЧЕТ ПЕСЕН В ПАПКАХ
  // ==========================================
  
  const calculateFolderSongsCount = (songsList, foldersList) => {
    const counts = {};
    
    // Считаем песни в каждой папке
    songsList.forEach(song => {
      const songFolder = song.uri.substring(0, song.uri.lastIndexOf('/'));
      counts[songFolder] = (counts[songFolder] || 0) + 1;
    });
    
    // Добавляем для каждой папки
    foldersList.forEach(folder => {
      const folderPath = folder.uri.replace('file://', '');
      counts[folderPath] = counts[folderPath] || 0;
    });
    
    setFolderSongsCount(counts);
  };

  // ==========================================
  // НАВИГАЦИЯ
  // ==========================================
  
  const openFolder = (folder) => {
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

  // ==========================================
  // ПОДСЧЕТ ПЕСЕН В КОРНЕ
  // ==========================================
  
  const getRootSongsCount = () => {
    if (!rootFolder || !songs.length) return 0;
    
    return songs.filter(song => {
      const songFolder = song.uri.substring(0, song.uri.lastIndexOf('/'));
      return songFolder === rootFolder.replace('file://', '');
    }).length;
  };

  // ==========================================
  // РЕНДЕРИНГ
  // ==========================================
  
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
          <Text style={styles.loading}>{loadingProgress}</Text>
        </View>
      </View>
    );
  }

  const displayItems = [
    { id: 'root', name: APP_FAVORITES_NAME, uri: rootFolder, isRoot: true },
    ...folders
  ];

  const rootSongsCount = getRootSongsCount();

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
        data={displayItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const count = item.isRoot 
            ? rootSongsCount
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
  loading: { marginTop: 16, color: '#999', fontSize: 14 },
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
