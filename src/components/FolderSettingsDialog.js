import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { BRAND_COLOR, FOLDER_COLORS, width, getBrandColor } from '../constants';

const FolderSettingsDialog = ({ 
  visible, 
  onClose, 
  folderName, 
  currentColor, 
  onRename, 
  onColorChange, 
  onDelete, 
  settings 
}) => {
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(currentColor || BRAND_COLOR);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (visible) {
      setNewName(folderName || '');
      setSelectedColor(currentColor || BRAND_COLOR);
      setError('');
    }
  }, [visible, folderName, currentColor]);
  
  const handleSave = () => {
    if (!newName.trim()) {
      setError('Введите название папки');
      return;
    }
    
    if (newName.trim() !== folderName) {
      onRename(newName.trim());
    } else {
      if (selectedColor !== currentColor) {
        onColorChange(selectedColor);
      }
      onClose();
    }
  };
  
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    onColorChange(color);
  };
  
  const brandColor = getBrandColor(settings);
  
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.5)' 
      }}>
        <View style={{ 
          backgroundColor: 'white', 
          padding: 20, 
          borderRadius: 10, 
          width: width - 40 
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            marginBottom: 16, 
            textAlign: 'center', 
            color: brandColor 
          }}>
            Настройки папки
          </Text>
          
          <Text style={{ marginBottom: 8, color: '#666' }}>Название папки:</Text>
          
          <TextInput 
            style={{ 
              borderWidth: 1, 
              borderColor: error ? '#FF6B6B' : '#E0E0E0', 
              borderRadius: 5, 
              padding: 12, 
              marginBottom: 16, 
              fontSize: 16 
            }} 
            placeholder="Название папки" 
            value={newName} 
            onChangeText={(text) => { setNewName(text); setError(''); }} 
            autoFocus 
          />
          
          {error ? <Text style={{ color: '#FF6B6B', marginBottom: 16 }}>{error}</Text> : null}
          
          <Text style={{ marginBottom: 8, color: '#666' }}>Выберите цвет:</Text>
          
          <View style={{ 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            marginBottom: 16 
          }}>
            {FOLDER_COLORS.map((color, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => handleColorSelect(color)} 
                style={{ 
                  width: 50, 
                  height: 50, 
                  borderRadius: 8, 
                  backgroundColor: color, 
                  margin: 6, 
                  borderWidth: selectedColor === color ? 3 : 0, 
                  borderColor: '#333' 
                }} 
              />
            ))}
          </View>
          
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-around', 
            paddingTop: 8, 
            borderTopWidth: 1, 
            borderTopColor: '#E0E0E0' 
          }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
              <Text style={{ color: '#999', fontSize: 16 }}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={{ padding: 10 }}>
              <Text style={{ color: brandColor, fontWeight: 'bold', fontSize: 16 }}>Сохранить</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            onPress={onDelete} 
            style={{ 
              marginTop: 16, 
              padding: 12, 
              backgroundColor: '#FF6B6B', 
              borderRadius: 5, 
              alignItems: 'center' 
            }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Удалить папку</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default FolderSettingsDialog;
