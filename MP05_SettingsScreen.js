import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header, EmailFooter } from './MP04_Components';
import { getBrandColor, AUTHOR_EMAIL, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';
import * as FileSystem from './MP02_FileSystem';

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const brandColor = getBrandColor(settings);
  
  const [scanning, setScanning] = useState(false);
  const [allFolders, setAllFolders] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState({});
  const [logs, setLogs] = useState([]);
  const [showFolderSelection, setShowFolderSelection] = useState(false);

  const addLog = (message, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? '❌' : '📌';
    setLogs(prev => [...prev, `${timestamp} - ${prefix} ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    loadSelectedFolders();
  }, []);

  const loadSelectedFolders = async () => {
    const saved = await AsyncStorage.getItem('selected_folders');
    if (saved) {
      setSelectedFolders(JSON.parse(saved));
    }
  };

  const scanMusic = async () => {
    if (scanning) return;
    
    addLog(`Начало сканирования...`);
    setScanning(true);
    
    try {
      const result = await FileSystem.scanWithMediaLibrary();
      
      addLog(`✅ Найдено: ${result.folders.length} папок, ${result.songs.length} файлов`);
      
      setAllFolders(result.folders);
      setShowFolderSelection(true);
      
    } catch (error) {
      addLog(`❌ Ошибка: ${error.message}`, true);
      Alert.alert('Ошибка', error.message);
    } finally {
      setScanning(false);
    }
  };

  const toggleFolderSelection = (folderId) => {
    setSelectedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const selectAllFolders = () => {
    const allSelected = {};
    allFolders.forEach(f => {
      allSelected[f.id] = true;
    });
    setSelectedFolders(allSelected);
  };

  const deselectAllFolders = () => {
    setSelectedFolders({});
  };

  const saveFolderSelection = async () => {
    await AsyncStorage.setItem('selected_folders', JSON.stringify(selectedFolders));
    
    const selectedOnly = allFolders.filter(f => selectedFolders[f.id]);
    const songs = await FileSystem.getSongsList();
    
    await AsyncStorage.setItem('scanned_folders', JSON.stringify(selectedOnly));
    await AsyncStorage.setItem('scanned_songs', JSON.stringify(songs));
    
    setShowFolderSelection(false);
    
    setTimeout(() => {
      navigation.replace('Playlists');
      addLog('🚀 Переход выполнен');
    }, 300);
  };

  const renderFolderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.folderSelectItem}
      onPress={() => toggleFolderSelection(item.id)}
    >
      <View style={styles.folderSelectInfo}>
        <MaterialIcons 
          name={selectedFolders[item.id] ? "check-box" : "check-box-outline-blank"} 
          size={24} 
          color={selectedFolders[item.id] ? brandColor : "#999"} 
        />
        <View style={styles.folderSelectText}>
          <Text style={styles.folderSelectName}>{item.name}</Text>
          <Text style={styles.folderSelectCount}>{item.count} песен</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (showFolderSelection) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Выбор папок" 
          showBack={false}
          settings={settings} 
        />
        
        <View style={styles.selectionContainer}>
          <Text style={styles.selectionTitle}>
            Выберите папки для отображения:
          </Text>
          
          <View style={styles.selectionActions}>
            <TouchableOpacity style={styles.actionButton} onPress={selectAllFolders}>
              <MaterialIcons name="select-all" size={20} color={brandColor} />
              <Text style={styles.actionButtonText}>Все</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={deselectAllFolders}>
              <MaterialIcons name="deselect" size={20} color="#999" />
              <Text style={styles.actionButtonText}>Сброс</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={allFolders}
            keyExtractor={item => item.id}
            renderItem={renderFolderItem}
            style={styles.folderList}
          />
          
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: brandColor }]}
            onPress={saveFolderSelection}
          >
            <Text style={styles.saveButtonText}>
              Показать ({Object.values(selectedFolders).filter(Boolean).length})
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <MaterialIcons name="settings" size={64} color={brandColor} style={styles.icon} />
          
          <Text style={styles.title}>Медиатека</Text>
          
          <TouchableOpacity 
            style={[styles.scanButton, { backgroundColor: brandColor }]} 
            onPress={scanMusic}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="search" size={24} color="white" />
                <Text style={styles.scanButtonText}>Сканировать</Text>
              </>
            )}
          </TouchableOpacity>
          
          {Object.keys(selectedFolders).length > 0 && (
            <View style={styles.infoBox}>
              <MaterialIcons name="info" size={16} color={brandColor} />
              <Text style={styles.infoText}>
                Выбрано {Object.values(selectedFolders).filter(Boolean).length} папок
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.logPanel}>
          <Text style={styles.logTitle}>📋 Логи:</Text>
          {logs.map((log, i) => (
            <Text key={i} style={styles.logLine}>{log}</Text>
          ))}
        </View>
      </ScrollView>
      
      <EmailFooter email={AUTHOR_EMAIL} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollView: { flex: 1 },
  content: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  icon: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    elevation: 3,
    marginBottom: 20,
  },
  scanButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  
  demoBanner: { 
    backgroundColor: '#FFD700', 
    padding: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  demoText: { color: '#333', fontSize: 12, fontWeight: '600' },
  
  logPanel: {
    backgroundColor: '#1A1A1A',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
  },
  logTitle: { color: '#FFA500', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  logLine: { color: '#0F0', fontSize: 10, fontFamily: 'monospace', marginVertical: 2 },
  
  selectionContainer: {
    flex: 1,
    padding: 16,
  },
  selectionTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#666',
  },
  folderList: {
    flex: 1,
    marginBottom: 16,
  },
  folderSelectItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  folderSelectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  folderSelectText: {
    flex: 1,
  },
  folderSelectName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  folderSelectCount: {
    fontSize: 12,
    color: '#999',
  },
  saveButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
