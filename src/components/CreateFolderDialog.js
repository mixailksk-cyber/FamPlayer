import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { BRAND_COLOR, FOLDER_COLORS, width, validateFolderName, getBrandColor } from '../constants';

const CreateFolderDialog = ({ visible, onClose, folders, setFolders, settings }) => {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(FOLDER_COLORS[0]);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (visible) {
      setNewName('');
      setNewColor(FOLDER_COLORS[0]);
      setError('');
    }
  }, [visible]);
  
  const handleCreate = () => {
    const errorMsg = validateFolderName(newName, folders);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    
    const folderData = { name: newName.trim(), color: newColor };
    const others = folders.filter(f => {
      const n = typeof f === 'object' ? f.name : f;
      return n !== 'Главная' && n !== 'Корзина';
    });
    
    others.push(folderData);
    others.sort((a, b) => {
      const na = typeof a === 'object' ? a.name : a;
      const nb = typeof b === 'object' ? b.name : b;
      return na.localeCompare(nb, 'ru');
    });
    
    setFolders(['Главная', ...others, 'Корзина']);
    onClose();
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
            color: brandColor 
          }}>
            Новая папка
          </Text>
          
          <TextInput 
            style={{ 
              borderWidth: 1, 
              borderColor: error ? '#FF6B6B' : '#E0E0E0', 
              borderRadius: 5, 
              padding: 12, 
              marginBottom: 8, 
              fontSize: 16 
            }} 
            placeholder="Название папки" 
            value={newName} 
            onChangeText={(text) => { setNewName(text); setError(''); }} 
            maxLength={30} 
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
            {FOLDER_COLORS.map((c, i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => setNewColor(c)} 
                style={{ 
                  width: 50, 
                  height: 50, 
                  borderRadius: 8, 
                  backgroundColor: c, 
                  margin: 6, 
                  borderWidth: newColor === c ? 3 : 0, 
                  borderColor: '#333' 
                }} 
              />
            ))}
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
              <Text style={{ color: '#999', fontSize: 16 }}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreate} style={{ padding: 10 }}>
              <Text style={{ color: brandColor, fontWeight: 'bold', fontSize: 16 }}>Создать</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CreateFolderDialog;
