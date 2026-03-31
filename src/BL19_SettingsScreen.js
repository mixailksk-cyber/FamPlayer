import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform, Share, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from './BL04_Header';
import { NOTE_COLORS, getBrandColor } from './BL02_Constants';
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';

const SettingsScreen = ({ 
  setCurrentScreen, 
  settings, 
  saveSettings, 
  notes, 
  folders, 
  onBrandColorChange,
  loadData,
  setCurrentFolder
}) => {
  const fontSizeOptions = [14, 16, 18, 20, 22, 24];
  const brandColor = getBrandColor(settings);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [isBackingUp, setIsBackingUp] = React.useState(false);

  const handleFontSizeChange = (size) => {
    saveSettings({ ...settings, fontSize: size });
  };

  const handleBrandColorChange = (color) => {
    saveSettings({ ...settings, brandColor: color });
    if (onBrandColorChange) onBrandColorChange(color);
  };

  const formatDateForFilename = () => {
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${day}-${month}-${year}_${hours}-${minutes}`;
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      
      const backupData = {
        notes: notes.map(note => ({
          id: note.id,
          title: note.title || '',
          content: note.content || '',
          folder: note.folder || 'Главная',
          color: note.color || brandColor,
          createdAt: note.createdAt || Date.now(),
          updatedAt: note.updatedAt || Date.now(),
          deleted: note.deleted || false,
          pinned: note.pinned || false,
          locked: note.locked || false
        })),
        folders: folders.map(folder => {
          if (typeof folder === 'object') {
            return { name: folder.name, color: folder.color };
          }
          return folder;
        }),
        settings: {
          fontSize: settings.fontSize || 16,
          brandColor: settings.brandColor || brandColor
        }
      };
      
      const backupStr = JSON.stringify(backupData, null, 2);
      const fileName = `FamNote_Backup_${formatDateForFilename()}.bak`;
      
      console.log('📦 Creating backup:', { fileName, size: backupStr.length });

      if (Platform.OS === 'web') {
        const blob = new Blob([backupStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('✅ Успех', 'Резервная копия создана');
        setIsBackingUp(false);
        return;
      }

      const downloadsPath = RNFS.DownloadDirectoryPath;
      const path = downloadsPath + '/' + fileName;
      
      await RNFS.writeFile(path, backupStr, 'utf8');
      
      const fileExists = await RNFS.exists(path);
      if (fileExists) {
        const fileInfo = await RNFS.stat(path);
        
        Alert.alert(
          '✅ Резервная копия создана',
          `Файл: ${fileName}\nРазмер: ${(fileInfo.size / 1024).toFixed(2)} KB\n\nСохранено в папку "Загрузки"`,
          [
            { 
              text: 'OK', 
              onPress: () => setIsBackingUp(false)
            },
            { 
              text: 'Поделиться', 
              onPress: async () => {
                try {
                  await Share.share({
                    title: 'Резервная копия FamNotes',
                    url: `file://${path}`,
                    message: `Резервная копия заметок от ${new Date().toLocaleString()}`
                  });
                } catch (e) {
                  console.log('Share error:', e);
                }
                setIsBackingUp(false);
              }
            }
          ]
        );
      } else {
        throw new Error('Файл не был создан');
      }
    } catch (e) {
      console.error('Backup error:', e);
      Alert.alert('❌ Ошибка', 'Не удалось создать резервную копию: ' + e.message);
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      
      if (result && result[0]) {
        const fileUri = result[0].uri;
        const fileName = result[0].name;
        console.log('📂 Selected file:', { fileName, uri: fileUri });
        
        let content;
        
        if (Platform.OS === 'web') {
          const response = await fetch(fileUri);
          content = await response.text();
        } else {
          content = await RNFS.readFile(fileUri, 'utf8');
        }
        
        const backup = JSON.parse(content);
        
        if (!backup.notes || !backup.folders) {
          throw new Error('Неверный формат файла. Файл должен содержать notes и folders.');
        }
        
        Alert.alert(
          'Восстановление данных',
          `Найдено ${backup.notes.length} заметок и ${backup.folders.length} папок. Все текущие данные будут заменены. Продолжить?`,
          [
            { text: 'Отмена', style: 'cancel', onPress: () => setIsRestoring(false) },
            { 
              text: 'Восстановить', 
              onPress: async () => {
                try {
                  const restoredNotes = backup.notes.map(note => ({
                    id: note.id || Date.now().toString() + Math.random(),
                    title: note.title || '',
                    content: note.content || '',
                    folder: note.folder || 'Главная',
                    color: note.color || brandColor,
                    createdAt: note.createdAt || Date.now(),
                    updatedAt: note.updatedAt || Date.now(),
                    deleted: note.deleted || false,
                    pinned: note.pinned || false,
                    locked: note.locked || false
                  }));
                  
                  let restoredFolders = [...backup.folders];
                  
                  const hasMain = restoredFolders.some(f => {
                    const name = typeof f === 'object' ? f.name : f;
                    return name === 'Главная';
                  });
                  const hasTrash = restoredFolders.some(f => {
                    const name = typeof f === 'object' ? f.name : f;
                    return name === 'Корзина';
                  });
                  
                  if (!hasMain) restoredFolders.unshift('Главная');
                  if (!hasTrash) restoredFolders.push('Корзина');
                  
                  const restoredSettings = backup.settings || {
                    fontSize: 16,
                    brandColor: brandColor
                  };
                  
                  await AsyncStorage.setItem('notes', JSON.stringify(restoredNotes));
                  await AsyncStorage.setItem('folders', JSON.stringify(restoredFolders));
                  await AsyncStorage.setItem('settings', JSON.stringify(restoredSettings));
                  
                  if (loadData) {
                    await loadData();
                  }
                  
                  if (setCurrentFolder) {
                    setCurrentFolder('Главная');
                  }
                  
                  setCurrentScreen('notes');
                  
                  Alert.alert(
                    '✅ Успех', 
                    `Восстановлено ${restoredNotes.length} заметок и ${restoredFolders.length} папок.`,
                    [{ text: 'OK', onPress: () => setIsRestoring(false) }]
                  );
                } catch (saveError) {
                  console.error('Restore save error:', saveError);
                  Alert.alert('❌ Ошибка', 'Не удалось сохранить восстановленные данные: ' + saveError.message);
                  setIsRestoring(false);
                }
              }
            }
          ]
        );
      } else {
        setIsRestoring(false);
      }
    } catch (e) {
      setIsRestoring(false);
      if (e.code !== 'DOCUMENT_PICKER_CANCELED') {
        console.error('Restore error:', e);
        Alert.alert('❌ Ошибка', 'Не удалось восстановить данные: ' + e.message);
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title="Настройки" 
        rightIcon="close" 
        onRightPress={() => setCurrentScreen('notes')} 
        showSearch={false} 
        brandColor={brandColor}
      />
      
      <ScrollView style={{ flex: 1, padding: 20 }}>
        {/* Размер текста */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>Размер текста</Text>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' }}>
              {fontSizeOptions.map((size) => (
                <TouchableOpacity 
                  key={size} 
                  onPress={() => handleFontSizeChange(size)} 
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 22, 
                    backgroundColor: settings.fontSize === size ? brandColor : '#F0F0F0', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    margin: 4 
                  }}
                >
                  <Text style={{ color: settings.fontSize === size ? 'white' : '#666' }}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: settings.fontSize, color: '#333' }}>Пример текста</Text>
            </View>
          </View>
        </View>

        {/* Цвет бренда */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>Цвет бренда</Text>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {NOTE_COLORS.map((color, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => handleBrandColorChange(color)} 
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 22, 
                    backgroundColor: color, 
                    margin: 4, 
                    borderWidth: brandColor === color ? 3 : 0, 
                    borderColor: '#333' 
                  }} 
                />
              ))}
            </View>
          </View>
        </View>

        {/* Резервное копирование */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>Резервное копирование</Text>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20, gap: 12 }}>
            <TouchableOpacity 
              style={{ 
                backgroundColor: brandColor, 
                padding: 16, 
                borderRadius: 12, 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center'
              }} 
              onPress={handleBackup}
              disabled={isBackingUp || isRestoring}
            >
              {isBackingUp ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Icon name="backup" size={24} color="white" style={{ marginRight: 8 }} />
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Создать копию</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ 
                backgroundColor: isRestoring ? '#CCCCCC' : '#FF6B6B', 
                padding: 16, 
                borderRadius: 12, 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center'
              }} 
              onPress={handleRestore}
              disabled={isBackingUp || isRestoring}
            >
              {isRestoring ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Icon name="restore" size={24} color="white" style={{ marginRight: 8 }} />
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Восстановить</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
