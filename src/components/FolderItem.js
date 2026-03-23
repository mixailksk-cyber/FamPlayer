import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from '../imports';
import { getBrandColor } from '../constants';

const FolderItem = ({ item, currentFolder, onPress, onLongPress, settings, noteCount }) => {
  const name = typeof item === 'object' ? item.name : item;
  const brandColor = getBrandColor(settings);
  
  let color;
  if (name === 'Главная' || name === 'Корзина') {
    color = brandColor;
  } else {
    color = typeof item === 'object' ? item.color || brandColor : brandColor;
  }
  
  return (
    <TouchableOpacity 
      onLongPress={onLongPress} 
      onPress={onPress} 
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
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{noteCount}</Text>
        )}
      </View>
      
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 }}>{name}</Text>
    </TouchableOpacity>
  );
};

export default FolderItem;
