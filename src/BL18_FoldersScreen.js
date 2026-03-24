import React, { useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from './BL04_Header';
import CreateFolderDialog from './BL05_CreateFolderDialog';
import FolderSettingsDialog from './BL06_FolderSettingsDialog';
import { getBrandColor } from './BL02_Constants';

const FoldersScreen = ({ 
  folders, 
  currentFolder, 
  setCurrentFolder, 
  setCurrentScreen, 
  insets, 
  saveFolders, 
  settings, 
  notes, 
  handleRenameFolder, 
  handleDeleteFolder, 
  handleColorChange 
}) => {
  const brandColor = getBrandColor(settings);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedFolderColor, setSelectedFolderColor] = useState(brandColor);

  const getNoteCount = (folderName) => {
    if (folderName === 'Корзина') return 0;
    return notes.filter(n => n.folder === folderName && !n.deleted).length;
  };

  const getFolderColor = (folder) => {
    if (typeof folder === 'object') return folder.color || brandColor;
    if (folder === 'Главная' || folder === 'Корзина') return brandColor;
    const found = folders.find(f => typeof f === 'object' && f.name === folder);
    return found ? found.color : brandColor;
  };

  const handleFolderLongPress = (item) => {
    const name = typeof item === 'object' ? item.name : item;
    if (name === 'Главная' || name === 'Корзина') {
      Alert.alert('Системная папка', 'Эту папку нельзя редактировать');
      return;
    }
    const color = getFolderColor(item);
    setSelectedFolder(name);
    setSelectedFolderColor(color);
    setShowSettingsDialog(true);
  };

  const handleFolderPress = (item) => {
    const name = typeof item === 'object' ? item.name : item;
    setCurrentFolder(name);
    setCurrentScreen('notes');
  };

  const handleRename = (newName) => {
    if (newName && newName !== selectedFolder) {
      handleRenameFolder(selectedFolder, newName);
    }
  };

  const handleColorChangeForFolder = (newColor) => {
    if (newColor && newColor !== selectedFolderColor) {
      handleColorChange(selectedFolder, newColor);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Удалить папку',
      `Вы уверены, что хотите удалить папку "${selectedFolder}"? Все заметки будут перемещены в корзину.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            handleDeleteFolder(selectedFolder);
            setShowSettingsDialog(false);
            setSelectedFolder(null);
          }
        }
      ]
    );
  };

  const FolderItem = ({ item }) => {
    const name = typeof item === 'object' ? item.name : item;
    const color = getFolderColor(item);
    const count = getNoteCount(name);
    
    return (
      <TouchableOpacity 
        onLongPress={() => handleFolderLongPress(item)} 
        onPress={() => handleFolderPress(item)} 
        style={{ 
          height: 77, 
          paddingHorizontal: 16, 
          borderBottomWidth: 1, 
          borderColor: '#E0E0E0', 
          flexDirection: 'row', 
          alignItems: 'center' 
        }}>
        
        <View style={{ 
          width: 44, 
          height: 44, 
          borderRadius: 10, 
          backgroundColor: color, 
          marginRight: 16, 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          {name === 'Корзина' ? (
            <Icon name="delete" size={24} color="white" />
          ) : (
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{count}</Text>
          )}
        </View>
        
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 }}>{name}</Text>
        
        <Icon name="chevron-right" size={24} color="#CCC" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title="Выбор папки" 
        showBack 
        onBack={() => setCurrentScreen('notes')} 
        rightIcon="settings" 
        onRightPress={() => setCurrentScreen('settings')} 
        showSearch={false}
        brandColor={brandColor}
      />
      
      <FlatList 
        data={folders} 
        keyExtractor={(item, index) => {
          const name = typeof item === 'object' ? item.name : item;
          return name + index;
        }} 
        renderItem={({ item }) => <FolderItem item={item} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      
      <TouchableOpacity 
        style={{ 
          position: 'absolute', 
          bottom: insets.bottom + 24, 
          right: insets.right + 24, 
          width: 70, 
          height: 70, 
          borderRadius: 35, 
          backgroundColor: brandColor, 
          justifyContent: 'center', 
          alignItems: 'center', 
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84
        }} 
        onPress={() => setShowCreateDialog(true)}
        activeOpacity={0.7}
      >
        <Icon name="add" size={36} color="white" />
      </TouchableOpacity>
      
      <CreateFolderDialog 
        visible={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        folders={folders}
        setFolders={saveFolders}
        settings={settings}
      />
      
      <FolderSettingsDialog 
        visible={showSettingsDialog}
        onClose={() => {
          setShowSettingsDialog(false);
          setSelectedFolder(null);
        }}
        folderName={selectedFolder}
        currentColor={selectedFolderColor}
        onRename={handleRename}
        onColorChange={handleColorChangeForFolder}
        onDelete={handleDelete}
        settings={settings}
      />
    </View>
  );
};

export default FoldersScreen;
