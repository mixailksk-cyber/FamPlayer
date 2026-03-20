import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Alert, SafeAreaView, Modal,
  FlatList, ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from './MP04_Components';
import { BRAND_COLOR, getBrandColor, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';
import { scanMusic, saveFoldersList, saveSongsList, getFoldersList } from './MP02_FileSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SELECTED_FOLDERS_KEY = '@selected_folders';
const BRAND_COLOR_KEY = '@brand_color';

const BRAND_COLORS = [
  '#20A0A0',
  '#E91E63',
  '#FF9800',
  '#4CAF50',
  '#2196F3',
  '#9C27B0',
  '#795548',
];

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const [currentBrandColor, setCurrentBrandColor] = useState(settings.brandColor || BRAND_COLOR);
  const brandColor = getBrandColor({ brandColor: currentBrandColor });
  const insets = useSafeAreaInsets();
  
  const [scanning, setScanning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [allFolders, setAllFolders] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState({});
  const [tempSelectedFolders, setTempSelectedFolders] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFolders();
    loadBrandColor();
  }, []);

  const loadBrandColor = async () => {
    try {
      const saved = await AsyncStorage.getItem(BRAND_COLOR_KEY);
      if (saved) {
        setCurrentBrandColor(saved);
        updateAppBrandColor(saved);
      }
    } catch (error) {
      console.error('Ошибка загрузки цвета:', error);
    }
  };

  const saveBrandColor = async (color) => {
    try {
      await AsyncStorage.setItem(BRAND_COLOR_KEY, color);
      setCurrentBrandColor(color);
      updateAppBrandColor(color);
    } catch (error) {
      console.error('Ошибка сохранения цвета:', error);
    }
  };

  const updateAppBrandColor = (color) => {
    navigation.setParams({ 
      settings: { brandColor: color }
    });
  };

  const loadFolders = async () => {
    setLoading(true);
    try {
      const folders = await getFoldersList();
      setAllFolders(folders);
      
      const saved = await AsyncStorage.getItem(SELECTED_FOLDERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedFolders(parsed);
        setTempSelectedFolders(parsed);
      } else {
        const defaultSelected = {};
        folders.forEach(folder => {
          defaultSelected[folder.id] = true;
        });
        setSelectedFolders(defaultSelected);
        setTempSelectedFolders(defaultSelected);
      }
    } catch (error) {
      console.error('Ошибка загрузки папок:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId) => {
    setTempSelectedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const selectAll = () => {
    const allSelected = {};
    allFolders.forEach(folder => {
      allSelected[folder.id] = true;
    });
    setTempSelectedFolders(allSelected);
  };

  const deselectAll = () => {
    setTempSelectedFolders({});
  };

  const saveSelection = async () => {
    try {
      await AsyncStorage.setItem(SELECTED_FOLDERS_KEY, JSON.stringify(tempSelectedFolders));
      setSelectedFolders(tempSelectedFolders);
      setModalVisible(false);
      
      // Отправляем обновление на экран плейлистов, но остаемся в настройках
      navigation.navigate('Playlists', {
        updateSelection: true,
        selectedFolders: tempSelectedFolders
      });
      
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить выбор');
    }
  };

  const cancelSelection = () => {
    setTempSelectedFolders(selectedFolders);
    setModalVisible(false);
  };

  const handleScanMusic = async () => {
    if (scanning) return;
    
    setScanning(true);
    
    try {
      const result = await scanMusic();
      
      await saveFoldersList(result.folders || []);
      await saveSongsList(result.songs || []);
      
      setAllFolders(result.folders || []);
      
      const defaultSelected = {};
      result.folders.forEach(folder => {
        defaultSelected[folder.id] = true;
      });
      setSelectedFolders(defaultSelected);
      setTempSelectedFolders(defaultSelected);
      await AsyncStorage.setItem(SELECTED_FOLDERS_KEY, JSON.stringify(defaultSelected));
      
      navigation.navigate('Playlists', {
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
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <Header 
        title="Настройки" 
        showBack 
        onBack={() => navigation.goBack()} 
        settings={{ brandColor: currentBrandColor }} 
      />
      
      {IS_WEB_STUB && (
        <View style={styles.demoBanner}>
          <MaterialIcons name="info" size={16} color="#333" />
          <Text style={styles.demoText}> {WEB_STUB_MESSAGE}</Text>
        </View>
      )}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Цвет бренда */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Цвет бренда</Text>
          <View style={styles.colorOptions}>
            {BRAND_COLORS.map(color => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  currentBrandColor === color && styles.colorButtonSelected
                ]}
                onPress={() => saveBrandColor(color)}
              >
                {currentBrandColor === color && (
                  <MaterialIcons name="check" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Управление папками */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Управление папками</Text>
          
          <TouchableOpacity 
            style={[styles.folderButton, { borderColor: currentBrandColor }]} 
            onPress={() => {
              setTempSelectedFolders({...selectedFolders});
              setModalVisible(true);
            }}
          >
            <View style={styles.folderButtonLeft}>
              <MaterialIcons name="playlist-add-check" size={20} color={currentBrandColor} />
              <Text style={[styles.folderButtonText, { color: currentBrandColor }]}>
                Выбор папок
              </Text>
            </View>
            <View style={styles.folderButtonRight}>
              <Text style={[styles.folderCount, { color: currentBrandColor }]}>
                {getSelectedCount()}/{allFolders.length}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={currentBrandColor} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.updateButton, { backgroundColor: currentBrandColor }]} 
            onPress={handleScanMusic}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="refresh" size={20} color="white" />
                <Text style={styles.updateButtonText}>Обновить медиатеку</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Модальное окно выбора папок */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={cancelSelection}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={cancelSelection}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Выбор папок</Text>
            <TouchableOpacity onPress={saveSelection}>
              <Text style={[styles.saveButton, { color: currentBrandColor }]}>Готово</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.actionButton} onPress={selectAll}>
              <Text style={{ color: currentBrandColor }}>Выбрать все</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={deselectAll}>
              <Text style={{ color: '#999' }}>Снять все</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={currentBrandColor} />
            </View>
          ) : (
            <FlatList
              data={allFolders}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isSelected = tempSelectedFolders[item.id] || false;
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
                        color={isSelected ? currentBrandColor : '#999'} 
                      />
                      <View style={styles.folderText}>
                        <Text style={styles.folderName}>{item.name}</Text>
                        <Text style={styles.folderCount}>{item.count || 0} треков</Text>
                      </View>
                    </View>
                    
                    <View style={[
                      styles.checkbox,
                      { borderColor: isSelected ? currentBrandColor : '#999' }
                    ]}>
                      {isSelected && (
                        <MaterialIcons name="check" size={18} color={currentBrandColor} />
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  demoBanner: { 
    backgroundColor: '#FFD700', 
    padding: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  demoText: { color: '#333', fontSize: 12, fontWeight: '600' },
  
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },

  colorOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: '#333',
  },

  folderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  folderButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  folderButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderCount: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },

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
