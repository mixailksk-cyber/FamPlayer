import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Icon } from '../imports';
import Header from '../Header';
import { NOTE_COLORS, getBrandColor } from '../constants';

const SettingsScreen = ({ setCurrentScreen, goToSearch, settings, saveSettings, notes, folders, onBrandColorChange, onDataRestored }) => {
  const fontSizeOptions = [14, 16, 18, 20, 22, 24];
  const brandColor = getBrandColor(settings);

  const handleFontSizeChange = (size) => saveSettings({ ...settings, fontSize: size });

  const handleBrandColorChange = (color) => {
    saveSettings({ ...settings, brandColor: color });
    if (onBrandColorChange) onBrandColorChange(color);
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
            <Text style={{ textAlign: 'center', color: '#666' }}>Функция временно недоступна</Text>
            <Text style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>Будет добавлена в следующем обновлении</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
