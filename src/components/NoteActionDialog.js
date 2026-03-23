import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Icon } from '../imports';
import { width, getBrandColor } from '../constants';

const NoteActionDialog = ({ 
  visible, 
  onClose, 
  folders, 
  onMove, 
  onDelete, 
  onPermanentDelete, 
  onTogglePin, 
  onToggleLock, 
  isPinned, 
  isLocked, 
  currentFolder, 
  settings 
}) => {
  const availableFolders = useMemo(() => {
    return folders
      .filter(f => {
        const n = typeof f === 'object' ? f.name : f;
        return n !== 'Корзина' && n !== currentFolder;
      })
      .map(f => typeof f === 'object' ? f.name : f);
  }, [folders, currentFolder]);
  
  const brandColor = getBrandColor(settings);
  const isInTrash = currentFolder === 'Корзина';
  
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
            Действия с заметкой
          </Text>
          
          {!isInTrash && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 }}>
              <TouchableOpacity 
                onPress={() => { onTogglePin(); onClose(); }} 
                style={{ padding: 12, alignItems: 'center', flex: 1 }}>
                <Icon name="push-pin" size={28} color={isPinned ? brandColor : '#999'} />
                <Text style={{ fontSize: 12, color: '#333', marginTop: 4 }}>
                  {isPinned ? "Открепить" : "Закрепить"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => { onToggleLock(); onClose(); }} 
                style={{ padding: 12, alignItems: 'center', flex: 1 }}>
                <Icon name={isLocked ? "lock" : "lock-open"} size={28} color={isLocked ? brandColor : '#999'} />
                <Text style={{ fontSize: 12, color: '#333', marginTop: 4 }}>
                  {isLocked ? "Разблок." : "Блокир."}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {availableFolders.length > 0 && (
            <>
              <Text style={{ marginBottom: 8, color: '#666', marginTop: 8 }}>
                Переместить в папку:
              </Text>
              {availableFolders.map((n, i) => (
                <TouchableOpacity 
                  key={i} 
                  onPress={() => { onMove(n); onClose(); }} 
                  style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
                  <Text style={{ fontSize: 16, color: '#333' }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
          
          {!isInTrash && (
            <TouchableOpacity 
              onPress={() => { onDelete(); onClose(); }} 
              style={{ 
                marginTop: 16, 
                padding: 12, 
                backgroundColor: '#F57C00', 
                borderRadius: 5, 
                alignItems: 'center' 
              }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                Переместить в корзину
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            onPress={() => { onPermanentDelete(); onClose(); }} 
            style={{ 
              marginTop: isInTrash ? 16 : 8, 
              padding: 12, 
              backgroundColor: '#FF4444', 
              borderRadius: 5, 
              alignItems: 'center' 
            }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
              Удалить безвозвратно
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onClose} style={{ marginTop: 8, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: brandColor, fontSize: 16 }}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default NoteActionDialog;
