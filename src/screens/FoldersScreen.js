import React from 'react';
import { View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Icon } from '../imports';
import Header from '../Header';
import FolderItem from '../components/FolderItem';
import CreateFolderDialog from '../components/CreateFolderDialog';
import FolderSettingsDialog from '../components/FolderSettingsDialog';
import { getBrandColor } from '../constants';

const FoldersScreen = ({ 
  folders, 
  currentFolder, 
  setCurrentFolder, 
  setCurrentScreen, 
  goToSearch, 
  insets, 
  showFolderDialog, 
  setShowFolderDialog, 
  saveFolders, 
  showFolderSettings, 
  setShowFolderSettings, 
  selectedFolderForSettings, 
  setSelectedFolderForSettings, 
  selectedFolderColor, 
  setSelectedFolderColor, 
  handleRenameFolder, 
  handleColorChange, 
  handleDeleteFolder, 
  settings, 
  notes 
}) => {
  const brandColor = getBrandColor(settings);

  const getNoteCount = (folderName) => {
    if (folderName === 'Корзина') return 0;
    return notes.filter(n => n.folder === folderName && !n.deleted).length;
  };

  const handleAddFolderPress = () => setShowFolderDialog(true);

  const handleFolderLongPress = (item) => {
    const name = typeof item === 'object' ? item.name : item;
    if (name === 'Главная' || name === 'Корзина') {
      Alert.alert('Системная папка', 'Эту папку нельзя редактировать');
      return;
    }
    const color = typeof item === 'object' && item.color ? item.color : brandColor;
    setSelectedFolderForSettings(name);
    setSelectedFolderColor(color);
    setShowFolderSettings(true);
  };

  const handleFolderPress = (item) => {
    const name = typeof item === 'object' ? item.name : item;
    setCurrentFolder(name);
    setCurrentScreen('notes');
  };

  const handleCloseFolderSettings = () => {
    setShowFolderSettings(false);
    setSelectedFolderForSettings(null);
    setSelectedFolderColor(brandColor);
  };

  const handleRename = (newName) => {
    if (newName && newName !== selectedFolderForSettings) handleRenameFolder(selectedFolderForSettings, newName);
    handleCloseFolderSettings();
  };

  const handleColorChangePress = (newColor) => {
    if (newColor && newColor !== selectedFolderColor) handleColorChange(selectedFolderForSettings, newColor);
  };

  const handleDelete = () => Alert.alert(
    'Удалить папку',
    `Вы уверены, что хотите удалить папку "${selectedFolderForSettings}"? Все заметки будут перемещены в корзину.`,
    [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          handleDeleteFolder(selectedFolderForSettings);
          handleCloseFolderSettings();
        }
      }
    ]
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title="Выбор папки" 
        showBack 
        onBack={() => setCurrentScreen('notes')} 
        rightIcon="settings" 
        onRightPress={() => setCurrentScreen('settings')} 
        showSearch 
        onSearchPress={goToSearch} 
        showPalette={false} 
        brandColor={brandColor}
      />
      
      <FlatList 
        data={folders} 
        keyExtractor={(item, index) => {
          if (typeof item === 'object' && item.name) return item.name + index;
          return item + index;
        }} 
        renderItem={({ item }) => {
          const name = typeof item === 'object' ? item.name : item;
          return (
            <FolderItem 
              item={item} 
              currentFolder={currentFolder} 
              onPress={() => handleFolderPress(item)} 
              onLongPress={() => handleFolderLongPress(item)} 
              settings={settings} 
              noteCount={getNoteCount(name)} 
            />
          );
        }} 
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      
      <TouchableOpacity 
        style={{ 
          position: 'absolute', 
          bottom: 24 + (insets?.bottom || 0), 
          right: 24 + (insets?.right || 0), 
          width: 70, 
          height: 70, 
          borderRadius: 35, 
          backgroundColor: brandColor, 
          justifyContent: 'center', 
          alignItems: 'center', 
          elevation: 5, 
          zIndex: 1000 
        }} 
        onPress={handleAddFolderPress} 
        activeOpacity={0.7}
      >
        <Icon name="add" size={36} color="white" />
      </TouchableOpacity>
      
      <CreateFolderDialog 
        visible={showFolderDialog} 
        onClose={() => setShowFolderDialog(false)} 
        folders={folders} 
        setFolders={saveFolders} 
        settings={settings} 
      />
      
      {selectedFolderForSettings && (
        <FolderSettingsDialog 
          visible={showFolderSettings} 
          onClose={handleCloseFolderSettings} 
          folderName={selectedFolderForSettings} 
          currentColor={selectedFolderColor} 
          onRename={handleRename} 
          onColorChange={handleColorChangePress} 
          onDelete={handleDelete} 
          settings={settings} 
        />
      )}
    </View>
  );
};

export default FoldersScreen;
