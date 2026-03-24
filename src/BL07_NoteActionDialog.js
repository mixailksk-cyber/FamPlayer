import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { width, getBrandColor } from './BL02_Constants';

const NoteActionDialog = ({ 
  visible, 
  onClose, 
  folders, 
  onMove, 
  onDelete, 
  onPermanentDelete, 
  onTogglePin, 
  isPinned, 
  currentFolder, 
  settings,
  isInTrash
}) => {
  const availableFolders = useMemo(() => {
    return folders
      .filter(f => {
        const n = typeof f === 'object' ? f.name : f;
        return n !== 'Корзина' && n !== currentFolder;
      })
      .map(f => typeof f === 'object' ? f.name : f);
  }, [folders, currentFolder]);
  
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.9));
  
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);
  
  const brandColor = getBrandColor(settings);
  
  if (!visible) return null;
  
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.5)',
        opacity: fadeAnim
      }}>
        <Animated.View style={{ 
          backgroundColor: 'white', 
          padding: 20, 
          borderRadius: 10, 
          width: width - 40,
          transform: [{ scale: scaleAnim }]
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: brandColor }}>
            Действия с заметкой
          </Text>
          
          {/* Кнопка закрепления */}
          <TouchableOpacity 
            onPress={() => { onTogglePin(); onClose(); }} 
            style={{ 
              padding: 12, 
              alignItems: 'center', 
              flexDirection: 'row',
              justifyContent: 'center',
              backgroundColor: '#F5F5F5',
              borderRadius: 8,
              marginBottom: 16
            }}>
            <Icon name="push-pin" size={24} color={isPinned ? brandColor : '#666'} />
            <Text style={{ fontSize: 16, color: isPinned ? brandColor : '#333', marginLeft: 8 }}>
              {isPinned ? "Открепить" : "Закрепить"}
            </Text>
          </TouchableOpacity>
          
          {/* Перемещение в папки */}
          {availableFolders.length > 0 && !isInTrash && (
            <>
              <Text style={{ marginBottom: 8, color: '#666', marginTop: 8 }}>Переместить в папку:</Text>
              {availableFolders.map((n, i) => (
                <TouchableOpacity 
                  key={i} 
                  onPress={() => { onMove(n); onClose(); }} 
                  style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="folder" size={20} color="#666" style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 16, color: '#333' }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
          
          {/* Кнопка "Переместить в корзину" (только для обычных заметок) */}
          {!isInTrash && (
            <TouchableOpacity 
              onPress={() => { onDelete(); onClose(); }} 
              style={{ marginTop: 16, padding: 12, backgroundColor: '#F57C00', borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
              <Icon name="delete" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Переместить в корзину</Text>
            </TouchableOpacity>
          )}
          
          {/* Кнопка "Удалить безвозвратно" (для всех заметок) */}
          <TouchableOpacity 
            onPress={() => { onPermanentDelete(); onClose(); }} 
            style={{ marginTop: 8, padding: 12, backgroundColor: '#FF4444', borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
            <Icon name="delete-forever" size={24} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Удалить безвозвратно</Text>
          </TouchableOpacity>
          
          {/* Кнопка "Восстановить" для корзины */}
          {isInTrash && (
            <TouchableOpacity 
              onPress={() => { onMove('Главная'); onClose(); }} 
              style={{ marginTop: 8, padding: 12, backgroundColor: '#4CAF50', borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
              <Icon name="restore" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Восстановить</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={onClose} style={{ marginTop: 16, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: brandColor, fontSize: 16 }}>Отмена</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default NoteActionDialog;
