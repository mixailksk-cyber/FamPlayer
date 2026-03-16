import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from './MP02_FileSystem';
import { Header, FolderItem, ColorPickerDialog } from './MP04_Components';
import { IS_WEB_STUB, WEB_STUB_MESSAGE, getBrandColor, APP_FAVORITES_NAME, TRASH_FOLDER_NAME } from './MP01_Core';

export default function PlaylistsScreen({ navigation, route }) {
  const rootFolder = route?.params?.rootFolder || 'demo://root';
  const settings = route?.params?.settings || {};
  const [folders, setFolders] = useState([]);
  const [folderSongsCount, setFolderSongsCount] = useState({});
  const [folderColors, setFolderColors] = useState({});
  const [hasTrash, setHasTrash] = useState(false);
  const [rootFilesCount, setRootFilesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const brandColor = getBrandColor(settings);

  const loadData = useCallback(async () => {
    setLoading(true);
    
    // Получаем файлы в корне (Избранное)
    const rootFiles = await FileSystem.getRootFiles();
    setRootFilesCount(rootFiles.length);
    
    // Проверяем наличие корзины
    const trashExists = await FileSystem.hasTrashFolder();
    setHasTrash(trashExists);
    
    // Получаем список папок-плейлистов (исключаем системные папки)
    const folderList = await FileSystem.getPlaylistFolders();
    // Фильтруем, чтобы не было дубликатов избранного и корзины
    const filteredFolders = folderList.filter(f => 
      f.name !== APP_FAVORITES_NAME && f.name !== TRASH_FOLDER_NAME
    );
    
    // Загружаем количество песен и цвета для каждой папки
    const counts = {};
    const colors = {};
    for (const f of filteredFolders) {
      const songs = await FileSystem.getFolderFiles(f.uri);
      counts[f.id] = songs.length;
      const savedColor = await FileSystem.getFolderColor(f.name);
      if (savedColor) colors[f.name] = savedColor;
    }
    
    setFolderSongsCount(counts);
    setFolderColors(colors);
    
    // Сортируем папки по алфавиту
    const sortedFolders = [...filteredFolders].sort((a, b) => 
      a.name.localeCompare(b.name, 'ru')
    );
    
    setFolders(sortedFolders);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, []);

  const openRoot = () => {
    navigation.navigate('Folder', { 
      folderUri: rootFolder, 
      folderName: APP_FAVORITES_NAME, 
      isRoot: true, 
      settings 
    });
  };

  const openFolder = (f) => {
    navigation.navigate('Folder', { 
      folderUri: f.uri, 
      folderName: f.name, 
      settings,
      folderColor: folderColors[f.name] || brandColor 
    });
  };

  const handleFolderLongPress = (f) => { 
    if (f.name !== TRASH_FOLDER_NAME) { 
      setSelectedFolder(f); 
      setColorPickerVisible(true); 
    } 
  };

  const handleColorSelect = async (color) => { 
    await FileSystem.setFolderColor(selectedFolder.name, color); 
    setFolderColors(p => ({ ...p, [selectedFolder.name]: color })); 
    setSelectedFolder(null); 
  };

  // Список для отображения: сначала Избранное, потом папки, потом Корзина (если есть)
  const displayItems = [
    // Избранное (корневая папка)
    { 
      id: 'root', 
      name: APP_FAVORITES_NAME, 
      uri: rootFolder, 
      isRoot: true 
    },
    // Все обычные папки
    ...folders,
    // Корзина (если есть)
    ...(hasTrash ? [{ 
      id: 'trash', 
      name: TRASH_FOLDER_NAME, 
      uri: 'demo://root/Корзина', 
      isSystem: true 
    }] : [])
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
        showSearch 
        onSearchPress={() => navigation.navigate('Search', { settings, fromScreen: 'Playlists' })} 
        settings={settings} 
      />
      
      {loading ? (
        <View style={styles.center}>
          <MaterialIcons name="folder-open" size={48} color="#E0E0E0" />
          <Text style={styles.loading}>Загрузка...</Text>
        </View>
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            let count = item.isRoot ? rootFilesCount : (folderSongsCount[item.id] || 0);
            return (
              <FolderItem 
                folder={{ 
                  ...item, 
                  color: item.isRoot ? brandColor : (folderColors[item.name] || brandColor) 
                }} 
                onPress={() => item.isRoot ? openRoot() : openFolder(item)} 
                onLongPress={() => handleFolderLongPress(item)} 
                settings={settings} 
                songCount={count} 
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialIcons name="folder-off" size={64} color="#E0E0E0" />
              <Text style={styles.empty}>Нет папок</Text>
            </View>
          }
        />
      )}
      
      <ColorPickerDialog 
        visible={colorPickerVisible} 
        onClose={() => { 
          setColorPickerVisible(false); 
          setSelectedFolder(null); 
        }} 
        onSelect={handleColorSelect} 
        currentColor={selectedFolder?.color || brandColor} 
        settings={settings} 
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