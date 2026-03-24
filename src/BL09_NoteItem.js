import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { formatDate, getBrandColor } from './BL02_Constants';

const NoteItem = ({ item, onPress, onLongPress, settings, showPin, onPinPress }) => {
  const defaultColor = getBrandColor(settings);
  const { day, month } = formatDate(item.updatedAt || item.createdAt || Date.now());
  
  return (
    <TouchableOpacity 
      onLongPress={onLongPress} 
      onPress={onPress} 
      activeOpacity={0.7}
      style={{ 
        padding: 12, 
        borderBottomWidth: 1, 
        borderColor: '#E0E0E0', 
        flexDirection: 'row', 
        alignItems: 'center',
        backgroundColor: 'white'
      }}>
      
      <View style={{ 
        width: 52, 
        height: 52, 
        borderRadius: 26, 
        backgroundColor: item.color || defaultColor, 
        marginRight: 16, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>{day}</Text>
        <Text style={{ color: 'white', fontSize: 10 }}>{month}</Text>
      </View>
      
      <View style={{ flex: 1 }}>
        {item.title ? (
          <>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#333' }} numberOfLines={1}>
              {item.title}
            </Text>
            {item.content ? (
              <Text style={{ color: '#666', fontSize: 16 }} numberOfLines={1}>
                {item.content}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={{ color: '#666', fontSize: 16 }} numberOfLines={2}>
            {item.content || '...'}
          </Text>
        )}
      </View>
      
      {showPin && (
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            if (onPinPress) onPinPress();
          }}
          style={{ 
            padding: 8,
            borderRadius: 20,
            backgroundColor: item.pinned ? defaultColor : 'transparent'
          }}>
          <Icon 
            name="push-pin" 
            size={20} 
            color="white" 
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default NoteItem;
