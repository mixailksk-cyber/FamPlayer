import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Icon, AsyncStorage, DocumentPicker, RNFS, Share } from '../imports';
import Header from '../Header';
import { NOTE_COLORS, getBrandColor } from '../constants';

const SettingsScreen = ({ setCurrentScreen, goToSearch, settings, saveSettings, notes, folders, onBrandColorChange, onDataRestored }) => {
  const fontSizeOptions = [14, 16, 18, 20, 22, 24];
  const brandColor = getBrandColor(settings);

  const formatDateForFilename = () => {
    const date = new Date();
    return `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
  };

  const handleFontSizeChange = (size) => saveSettings({ ...settings, fontSize: size });

  const handleBrandColorChange = (color) => {
    saveSettings({ ...settings, brandColor: color });
    if (onBrandColorChange) onBrandColorChange(color);
  };

  const handleBackup = async () => {
    try {
      const backup = { notes, folders, settings };
      const backupStr = JSON.stringify(backup, null, 2);
      const fileName = `FamNote_Backup_${formatDateForFilename()}.bak`;

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
      await Share.open({ url: `file://${path}`, type: 'application/octet-stream' });
      Alert.alert('✅ Успех', 'Резервная копия создана');
    } catch (e) {
      Alert.alert('❌ Ошибка', 'Не удалось создать резервную копию');
    }
  };

  const handleRestore = async () => {
    try {
      const result = await DocumentPicker.pick({ type: [DocumentPicker.types.allFiles] });
      const fileUri = result[0].uri;
      const content = await RNFS.readFile(fileUri, 'utf8');
      const backup = JSON.parse(content);

      if (backup.notes && backup.folders) {
        const normalizedNotes = backup.notes.map(n => ({ ...n, color: n.color || brandColor }));
        await AsyncStorage.setItem('notes', JSON.stringify(normalizedNotes));
        await AsyncStorage.setItem('folders', JSON.stringify(backup.folders));
        if (backup.settings) await AsyncStorage.setItem('settings', JSON.stringify(backup.settings));
        
        Alert.alert('✅ Успех', 'Данные восстановлены. Перезапустите приложение.', [
          { text: 'OK', onPress: () => { if (onDataRestored) onDataRestored(); setCurrentScreen('notes'); } }
        ]);
      } else {
        throw new Error('Неверный формат файла');
      }
    } catch (e) {
      Alert.alert('❌ Ошибка', `Не удалось восстановить данные: ${e.message}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header title="Настройки" showBack onBack={() => setCurrentScreen('notes')} rightIcon="close" onRightPress={() => setCurrentScreen('notes')} showSearch onSearchPress={goToSearch} brandColor={brandColor} />
      
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>Размер текста</Text>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' }}>
              {fontSizeOptions.map((size) => (
                <TouchableOpacity key={size} onPress={() => handleFontSizeChange(size)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: settings.fontSize === size ? brandColor : '#F0F0F0', justifyContent: 'center', alignItems: 'center', margin: 4 }}>
                  <Text style={{ color: settings.fontSize === size ? 'white' : '#666' }}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>Цвет бренда</Text>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {NOTE_COLORS.map((color, index) => (
                <TouchableOpacity key={index} onPress={() => handleBrandColorChange(color)} style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: color, margin: 6, borderWidth: brandColor === color ? 3 : 0, borderColor: '#333' }} />
              ))}
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 }}>Резервное копирование</Text>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20, gap: 12 }}>
            <TouchableOpacity style={{ backgroundColor: brandColor, padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} onPress={handleBackup}>
              <Icon name="backup" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Создать копию</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ backgroundColor: '#FF6B6B', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} onPress={() => { Alert.alert('Восстановление', 'Все данные будут заменены. Продолжить?', [{ text: 'Отмена', style: 'cancel' }, { text: 'Восстановить', onPress: handleRestore }]); }}>
              <Icon name="restore" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Восстановить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
