import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Share, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from './BL04_Header';
import ColorPickerModal from './BL08_ColorPickerModal';
import { TITLE_MAX_LENGTH, NOTE_MAX_LENGTH, getBrandColor } from './BL02_Constants';

const EditNoteScreen = ({ 
  selectedNote, 
  currentFolder, 
  notes, 
  settings, 
  onSave, 
  setCurrentScreen, 
  insets
}) => {
  const brandColor = getBrandColor(settings);
  const [note, setNote] = useState(selectedNote ? { ...selectedNote } : { 
    id: Date.now() + '', 
    title: '', 
    content: '', 
    color: brandColor, 
    folder: currentFolder, 
    createdAt: Date.now(), 
    updatedAt: Date.now(), 
    deleted: false,
    locked: false
  });
  const [showColor, setShowColor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const contentInputRef = useRef(null);
  const titleInputRef = useRef(null);
  
  const isInTrash = note.folder === 'Корзина' || note.deleted === true;

  const handleShare = async () => {
    try {
      const message = note.title ? `${note.title}\n\n${note.content}` : note.content;
      await Share.share({ message, title: note.title || 'Заметка' });
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Удалить заметку',
      isInTrash ? 'Удалить заметку безвозвратно?' : 'Переместить заметку в корзину?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            if (isInTrash) {
              const updatedNotes = notes.filter(n => n.id !== note.id);
              onSave(updatedNotes);
            } else {
              const updatedNote = { ...note, folder: 'Корзина', deleted: true, updatedAt: Date.now() };
              onSave(updatedNote);
            }
            setCurrentScreen('notes');
          }
        }
      ]
    );
  };

  const handleBack = () => {
    const hasChanges = () => {
      if (!selectedNote) return note.title !== '' || note.content !== '';
      return selectedNote.title !== note.title || selectedNote.content !== note.content || selectedNote.color !== note.color;
    };
    
    if (hasChanges() && !isInTrash) {
      Alert.alert(
        'Несохраненные изменения',
        'У вас есть несохраненные изменения. Выйти без сохранения?',
        [
          { text: 'Отмена', style: 'cancel' },
          { 
            text: 'Выйти', 
            onPress: () => {
              setCurrentScreen('notes');
            }
          }
        ]
      );
    } else {
      setCurrentScreen('notes');
    }
  };

  const handleSave = () => {
    onSave({ ...note, updatedAt: Date.now() });
    setIsEditing(false);
  };

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleColorSelect = (color) => {
    setNote({ ...note, color, updatedAt: Date.now() });
    // При смене цвета открываем режим редактирования
    if (!isEditing && !isInTrash) {
      setIsEditing(true);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: 'white' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Header 
        title={isEditing ? "Редактирование" : "Просмотр"}
        showBack 
        onBack={handleBack} 
        showPalette 
        onPalettePress={() => setShowColor(true)} 
        showSearch={false} 
        brandColor={note.color || brandColor}
      >
        <TouchableOpacity onPress={handleShare}>
          <Icon name="share" size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleDelete}>
          <Icon name="delete" size={24} color="white" />
        </TouchableOpacity>
      </Header>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {isEditing ? (
            <TextInput 
              ref={titleInputRef}
              style={{ fontSize: settings.fontSize + 2, fontWeight: 'bold', paddingVertical: 8, color: '#333' }} 
              placeholder="Заголовок" 
              placeholderTextColor="#999" 
              maxLength={TITLE_MAX_LENGTH} 
              value={note.title} 
              onChangeText={t => setNote({ ...note, title: t })}
              editable={!isInTrash && isEditing}
            />
          ) : (
            <TouchableOpacity onPress={handleEditPress} activeOpacity={0.7}>
              <Text style={{ fontSize: settings.fontSize + 2, fontWeight: 'bold', paddingVertical: 8, color: '#333' }}>
                {note.title || 'Заголовок'}
              </Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 2, backgroundColor: note.color || brandColor, width: '100%', marginTop: 4 }} />
        </View>

        {isEditing ? (
          <TextInput 
            ref={contentInputRef}
            style={{ fontSize: settings.fontSize, paddingHorizontal: 16, paddingVertical: 12, textAlignVertical: 'top', color: '#333', minHeight: 200 }} 
            placeholder="Текст заметки..." 
            placeholderTextColor="#999" 
            multiline 
            maxLength={NOTE_MAX_LENGTH} 
            value={note.content} 
            onChangeText={t => setNote({ ...note, content: t })}
            editable={!isInTrash && isEditing}
            scrollEnabled={true}
          />
        ) : (
          <Text 
            selectable={true}
            onPress={handleEditPress}
            style={{ fontSize: settings.fontSize, paddingHorizontal: 16, paddingVertical: 12, color: '#333', lineHeight: settings.fontSize * 1.5 }}
          >
            {note.content || '...'}
          </Text>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={{ 
          position: 'absolute', 
          bottom: insets.bottom + 24, 
          right: 24, 
          width: 70, 
          height: 70, 
          borderRadius: 35, 
          backgroundColor: note.color || brandColor, 
          justifyContent: 'center', 
          alignItems: 'center', 
          elevation: 5, 
          zIndex: 1000
        }} 
        onPress={isEditing ? handleSave : handleEditPress}
      >
        <Icon name={isEditing ? "check" : "edit"} size={36} color="white" />
      </TouchableOpacity>

      <ColorPickerModal 
        visible={showColor} 
        onClose={() => setShowColor(false)} 
        selectedColor={note.color} 
        onSelect={handleColorSelect}
        settings={settings}
      />
    </KeyboardAvoidingView>
  );
};

export default EditNoteScreen;
