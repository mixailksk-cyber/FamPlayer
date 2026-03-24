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
  loadData
}) => {
  const fontSizeOptions = [14, 16, 18, 20, 22, 24];
  const brandColor = getBrandColor(settings);
  const [isRestoring, setIsRestoring] = React.useState(false);

  const handleFontSizeChange = (size) => {
    saveSettings({ ...settings, fontSize: size });
  };

  const handleBrandColorChange = (color) => {
    saveSettings({ ...settings, brandColor: color });
    if (onBrandColorChange) onBrandColorChange(color);
  };

  const getStats = () => {
    const totalNotes = notes.filter(n => !n.deleted).length;
    const trashedNotes = notes.filter(n => n.deleted).length;
    const foldersCount = folders.filter(f => {
      const name = typeof f === 'object' ? f.name : f;
      return name !== 'Корзина';
    }).length;
    return { totalNotes, trashedNotes, foldersCount };
  };

  const formatDateForFilename = () => {
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
  };

  const handleBackup = async () => {
    try {
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
      
      console.log('📦 Creating backup:', { fileName, size: backupStr.length, notesCount: backupData.notes.length });

      if (Platform.OS === 'web') {
        const blob = new Blob([backupStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('✅ Успех', 'Резервная копия создана');
        return;
      }

      const path = RNFS.DocumentDirectoryPath + '/' + fileName;
      await RNFS.writeFile(path, backupStr, 'utf8');
      
      const fileExists = await RNFS.exists(path);
      if (fileExists) {
        const fileInfo = await RNFS.stat(path);
        console.log('✅ Backup created:', { path, size: fileInfo.size });
        
        Alert.alert(
          '✅ Резервная копия создана',
          `Файл: ${fileName}\nРазмер: ${(fileInfo.size / 1024).toFixed(2)} KB\n\nСкопируйте этот файл на другое устройство для восстановления.`,
          [
            { text: 'OK', style: 'cancel' },
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
        
        console.log('📄 File content length:', content.length);
        
        const backup = JSON.parse(content);
        
        if (!backup.notes || !backup.folders) {
          throw new Error('Неверный формат файла. Файл должен содержать notes и folders.');
        }
        
        console.log('📊 Backup structure:', {
          notesCount: backup.notes.length,
          foldersCount: backup.folders.length,
          hasSettings: !!backup.settings
        });
        
        Alert.alert(
          'Восстановление данных',
          `Найдено ${backup.notes.length} заметок и ${backup.folders.length} папок. Все текущие данные будут заменены. Продолжить?`,
          [
            { text: 'Отмена', style: 'cancel', onPress: () => setIsRestoring(false) },
            { 
              text: 'Восстановить', 
              onPress: async () => {
                try {
                  const normalizedNotes = backup.notes.map(note => ({
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
                  
                  let normalizedFolders = [...backup.folders];
                  
                  const hasMain = normalizedFolders.some(f => {
                    const name = typeof f === 'object' ? f.name : f;
                    return name === 'Главная';
                  });
                  const hasTrash = normalizedFolders.some(f => {
                    const name = typeof f === 'object' ? f.name : f;
                    return name === 'Корзина';
                  });
                  
                  if (!hasMain) normalizedFolders.unshift('Главная');
                  if (!hasTrash) normalizedFolders.push('Корзина');
                  
                  const restoredSettings = backup.settings || {
                    fontSize: 16,
                    brandColor: brandColor
                  };
                  
                  console.log('💾 Saving to AsyncStorage...');
                  
                  await AsyncStorage.setItem('notes', JSON.stringify(normalizedNotes));
                  await AsyncStorage.setItem('folders', JSON.stringify(normalizedFolders));
                  await AsyncStorage.setItem('settings', JSON.stringify(restoredSettings));
                  
                  console.log('✅ Data saved to AsyncStorage');
                  
                  // Автоматическая перезагрузка данных
                  if (loadData) {
                    await loadData();
                  }
                  
                  // Принудительное обновление текущей папки
                  setCurrentScreen('notes');
                  setCurrentFolder('Главная');
                  
                  Alert.alert(
                    '✅ Успех', 
                    `Восстановлено ${normalizedNotes.length} заметок и ${normalizedFolders.length} папок.`,
                    [
                      { 
                        text: 'OK', 
                        onPress: () => {
                          setIsRestoring(false);
                        }
                      }
                    ]
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

  const stats = getStats();

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title="Настройки" 
        showBack 
        onBack={() => setCurrentScreen('notes')} 
        rightIcon="close" 
        onRightPress={() => setCurrentScreen('notes')} 
        showSearch={false} 
        brandColor={brandColor}
      />
      
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>Статистика</Text>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#666' }}>Всего заметок:</Text>
              <Text style={{ color: '#333', fontWeight: 'bold' }}>{stats.totalNotes}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#666' }}>В корзине:</Text>
              <Text style={{ color: '#FF6B6B', fontWeight: 'bold' }}>{stats.trashedNotes}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#666' }}>Папок:</Text>
              <Text style={{ color: '#333', fontWeight: 'bold' }}>{stats.foldersCount}</Text>
            </View>
          </View>
        </View>

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

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>Цвет бренда</Text>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {NOTE_COLORS.map((color, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => handleBrandColorChange(color)} 
                  style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 25, 
                    backgroundColor: color, 
                    margin: 6, 
                    borderWidth: brandColor === color ? 3 : 0, 
                    borderColor: '#333' 
                  }} 
                />
              ))}
            </View>
          </View>
        </View>

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
              disabled={isRestoring}
            >
              <Icon name="backup" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Создать копию</Text>
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
              disabled={isRestoring}
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

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>О приложении</Text>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20 }}>
            <Text style={{ color: '#666', textAlign: 'center' }}>FamNotes v1.0.0</Text>
            <Text style={{ color: '#999', textAlign: 'center', marginTop: 8, fontSize: 12 }}>Приложение для заметок</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
