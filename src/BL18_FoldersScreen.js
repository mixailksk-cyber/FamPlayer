import React from 'react';
import { View, FlatList, Text, TouchableOpacity, Alert } from 'react-native';
import Header from './BL04_Header';
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

  const getNoteCount = (folderName) => {
    if (folderName === 'Корзина') return 0;
    return notes.filter(n => n.folder === folderName && !n.deleted).length;
  };

  const handleAddFolderPress = () => {
    Alert.prompt(
      'Новая папка',
      'Введите название папки',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Создать', 
          onPress: (name) => {
            if (name && name.trim()) {
              const folderNames = folders.map(f => typeof f === 'object' ? f.name : f);
              if (folderNames.includes(name.trim())) {
                Alert.alert('Ошибка', 'Папка с таким именем уже существует');
                return;
              }
              if (/[<>:"/\\|?*]/.test(name.trim())) {
                Alert.alert('Ошибка', 'Недопустимые символы в названии папки');
                return;
              }
              const newFolders = [...folders, name.trim()];
              saveFolders(newFolders);
              Alert.alert('✅ Успех', `Папка "${name.trim()}" создана`);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleFolderLongPress = (item) => {
    const name = typeof item === 'object' ? item.name : item;
    if (name === 'Главная' || name === 'Корзина') {
      Alert.alert('Системная папка', 'Эту папку нельзя редактировать');
      return;
    }
    
    Alert.alert(
      'Действия с папкой',
      `Что вы хотите сделать с папкой "${name}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Переименовать', 
          onPress: () => {
            Alert.prompt(
              'Переименовать папку',
              'Введите новое название',
              [
                { text: 'Отмена', style: 'cancel' },
                { 
                  text: 'Сохранить', 
                  onPress: (newName) => {
                    if (newName && newName.trim() && newName !== name) {
                      const folderNames = folders.map(f => typeof f === 'object' ? f.name : f);
                      if (folderNames.includes(newName.trim())) {
                        Alert.alert('Ошибка', 'Папка с таким именем уже существует');
                        return;
                      }
                      if (/[<>:"/\\|?*]/.test(newName.trim())) {
                        Alert.alert('Ошибка', 'Недопустимые символы в названии папки');
                        return;
                      }
                      handleRenameFolder(name, newName.trim());
                      Alert.alert('✅ Успех', `Папка переименована в "${newName.trim()}"`);
                    }
                  }
                }
              ],
              'plain-text',
              name
            );
          }
        },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Удалить папку',
              `Все заметки из папки "${name}" будут перемещены в корзину. Продолжить?`,
              [
                { text: 'Отмена', style: 'cancel' },
                { 
                  text: 'Удалить', 
                  style: 'destructive', 
                  onPress: () => {
                    handleDeleteFolder(name);
                    Alert.alert('🗑 Удалено', `Папка "${name}" удалена`);
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleFolderPress = (item) => {
    const name = typeof item === 'object' ? item.name : item;
    setCurrentFolder(name);
    setCurrentScreen('notes');
  };

  const FolderItem = ({ item }) => {
    const name = typeof item === 'object' ? item.name : item;
    const color = typeof item === 'object' ? (item.color || brandColor) : brandColor;
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
            <Text style={{ fontSize: 24, color: 'white' }}>🗑</Text>
          ) : (
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{count}</Text>
          )}
        </View>
        
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 }}>{name}</Text>
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
        onPress={handleAddFolderPress}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 36, color: 'white' }}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FoldersScreen;
