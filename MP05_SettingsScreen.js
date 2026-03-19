import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Alert, SafeAreaView, Modal,
  FlatList
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from './MP04_Components';
import { getBrandColor, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';
import { scanMusic, saveFoldersList, saveSongsList, getFoldersList } from './MP02_FileSystem';

const SELECTED_FOLDERS_KEY = '@selected_folders';

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const brandColor = getBrandColor(settings);
  
  const [scanning, setScanning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [allFolders, setAllFolders] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState({});
  const [loading, setLoading] = useState(false);

  // Загружаем все папки и выбранные при открытии
  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setLoading(true);
    try {
      // Загружаем все отсканированные папки
      const folders = await getFoldersList();
      setAllFolders(folders);
      
      // Загружаем выбранные папки
      const saved = await AsyncStorage.getItem(SELECTED_FOLDERS_KEY);
      if (saved) {
        setSelectedFolders(JSON.parse(saved));
      } else {
        // По умолчанию выбираем все папки
        const defaultSelected = {};
        folders.forEach(folder => {
          defaultSelected[folder.id] = true;
        });
        setSelectedFolders(defaultSelected);
      }
    } catch (error) {
      console.error('Ошибка загрузки папок:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId) => {
    setSelectedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const selectAll = () => {
    const allSelected = {};
    allFolders.forEach(folder => {
      allSelected[folder.id] = true;
    });
    setSelectedFolders(allSelected);
  };

  const deselectAll = () => {
    setSelectedFolders({});
  };

  const saveSelection = async () => {
    try {
      await AsyncStorage.setItem(SELECTED_FOLDERS_KEY, JSON.stringify(selectedFolders));
      setModalVisible(false);
      Alert.alert('Успех', 'Выбор папок сохранен');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить выбор');
    }
  };

  const handleScanMusic = async () => {
    if (scanning) return;
    
    setScanning(true);
    
    try {
      const result = await scanMusic();
      
      await saveFoldersList(result.folders || []);
      await saveSongsList(result.songs || []);
      
      // Обновляем список папок в модальном окне
      setAllFolders(result.folders || []);
      
      // Сбрасываем выбор (по умолчанию все)
      const defaultSelected = {};
      result.folders.forEach(folder => {
        defaultSelected[folder.id] = true;
      });
      setSelectedFolders(defaultSelected);
      await AsyncStorage.setItem(SELECTED_FOLDERS_KEY, JSON.stringify(defaultSelected));
      
      navigation.replace('Playlists', {
        folders: result.folders || [],
        songs: result.songs || [],
        selectedFolders: defaultSelected
      });
      
    } catch (error) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setScanning(false);
    }
  };

  const getSelectedCount = () => {
    return Object.values(selectedFolders).filter(Boolean).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Настройки" 
        showBack 
        onBack={() => navigation.goBack()} 
        settings={settings} 
      />
      
      {IS_WEB_STUB && (
        <View style={styles.demoBanner}>
          <MaterialIcons name="info" size={16} color="#333" />
          <Text style={styles.demoText}> {WEB_STUB_MESSAGE}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <MaterialIcons name="settings" size={80} color={brandColor} style={styles.icon} />
        
        <Text style={styles.title}>Управление медиатекой</Text>
        
        {/* Кнопка выбора папок */}
        <TouchableOpacity 
          style={[styles.folderButton, { borderColor: brandColor }]} 
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="playlist-add-check" size={24} color={brandColor} />
          <Text style={[styles.folderButtonText, { color: brandColor }]}>
            Выбор папок ({getSelectedCount()}/{allFolders.length})
          </Text>
          <MaterialIcons name="chevron-right" size={24} color={brandColor} />
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <Text style={styles.description}>
          Обновить список всех папок и песен
        </Text>
        
        <TouchableOpacity 
          style={[styles.scanButton, { backgroundColor: brandColor }]} 
          onPress={handleScanMusic}
          disabled={scanning}
        >
          {scanning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="refresh" size={24} color="white" />
              <Text style={styles.scanButtonText}>Обновить медиатеку</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Модальное окно выбора папок */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Выбор папок</Text>
            <TouchableOpacity onPress={saveSelection}>
              <Text style={[styles.saveButton, { color: brandColor }]}>Сохранить</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.actionButton} onPress={selectAll}>
              <Text style={{ color: brandColor }}>Выбрать все</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={deselectAll}>
              <Text style={{ color: '#999' }}>Снять все</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={brandColor} />
            </View>
          ) : (
            <FlatList
              data={allFolders}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedFolders[item.id] || false;
                return (
                  <TouchableOpacity 
                    style={styles.folderItem}
                    onPress={() => toggleFolder(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.folderInfo}>
                      <MaterialIcons 
                        name="folder" 
                        size={24} 
                        color={isSelected ? brandColor : '#999'} 
                      />
                      <View style={styles.folderText}>
                        <Text style={styles.folderName}>{item.name}</Text>
                        <Text style={styles.folderCount}>{item.count || 0} треков</Text>
                      </View>
                    </View>
                    
                    {/* Кастомный чекбокс */}
                    <View style={[
                      styles.checkbox,
                      { borderColor: isSelected ? brandColor : '#999' }
                    ]}>
                      {isSelected && (
                        <MaterialIcons name="check" size={18} color={brandColor} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>Нет папок</Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { 
    flex: 1, 
    alignItems: 'center', 
    padding: 24 
  },
  icon: { marginBottom: 24 },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 24, 
    textAlign: 'center', 
    color: '#333' 
  },
  folderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    width: '100%',
    marginBottom: 24,
  },
  folderButtonText: { 
    fontSize: 16, 
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    width: '100%',
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 3,
    width: '100%',
    maxWidth: 280,
  },
  scanButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 10 
  },
  demoBanner: { 
    backgroundColor: '#FFD700', 
    padding: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  demoText: { color: '#333', fontSize: 12, fontWeight: '600' },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderText: {
    marginLeft: 12,
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  folderCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
