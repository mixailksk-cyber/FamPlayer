import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Share, ScrollView, TouchableWithoutFeedback, StatusBar, Keyboard } from 'react-native';
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
  insets,
  onQuickDelete,
  isNewNote
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
    locked: false,
    reminder: null
  });
  const [showColor, setShowColor] = useState(false);
  const [isEditing, setIsEditing] = useState(isNewNote || false);
  const contentInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  
  const isInTrash = note.folder === 'Корзина' || note.deleted === true;

  // Для новой заметки: фокус в поле текста
  useEffect(() => {
    if (isNewNote && contentInputRef.current) {
      setTimeout(() => {
        contentInputRef.current.focus();
      }, 100);
    }
  }, [isNewNote]);

  // Фокус в поле текста при нажатии на любую область
  const handleContentPress = () => {
    if (isEditing && !isInTrash && contentInputRef.current) {
      contentInputRef.current.focus();
    }
  };

  // Фокус в поле заголовка при нажатии на заголовок
  const handleTitlePress = () => {
    if (isEditing && !isInTrash && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  };

  const handleShare = async () => {
    try {
      const message = note.title ? `${note.title}\n\n${note.content}` : note.content;
      await Share.share({ message, title: note.title || 'Заметка' });
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = () => {
    if (onQuickDelete) {
      onQuickDelete(note);
      setCurrentScreen('notes');
    } else {
      if (isInTrash) {
        const updatedNotes = notes.filter(n => n.id !== note.id);
        onSave(updatedNotes);
      } else {
        const updatedNote = { ...note, folder: 'Корзина', deleted: true, updatedAt: Date.now() };
        onSave(updatedNote);
      }
      setCurrentScreen('notes');
    }
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
    if (isInTrash) {
      Alert.alert('Заметка в корзине', 'Заметки в корзине можно только просматривать и восстанавливать');
      return;
    }
    setIsEditing(true);
    setTimeout(() => {
      if (contentInputRef.current) {
        contentInputRef.current.focus();
      }
    }, 100);
  };

  const handleColorSelect = (color) => {
    if (isInTrash) {
      Alert.alert('Заметка в корзине', 'Заметки в корзине нельзя редактировать');
      return;
    }
    setNote({ ...note, color, updatedAt: Date.now() });
    if (!isEditing && !isInTrash) {
      setIsEditing(true);
      setTimeout(() => {
        if (contentInputRef.current) {
          contentInputRef.current.focus();
        }
      }, 100);
    }
  };

  const headerColor = note.color || brandColor;
  
  // Кнопка всегда на фиксированном расстоянии от низа, без учета клавиатуры
  // KeyboardAvoidingView сам поднимет контент, кнопка будет следовать за ним
  const buttonBottom = insets.bottom + 24;

  return (
    <>
      <StatusBar backgroundColor={headerColor} barStyle="light-content" />
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: 'white' }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Header 
          title={isInTrash ? "Просмотр (Корзина)" : (isEditing ? "Редактирование" : "Просмотр")}
          showSearch={false} 
          brandColor={headerColor}
        >
          {/* Кнопка выбора цвета (только не в корзине) */}
          {!isInTrash && (
            <TouchableOpacity onPress={() => setShowColor(true)}>
              <Icon name="palette" size={24} color="white" />
            </TouchableOpacity>
          )}
          
          {/* Кнопка поделиться */}
          <TouchableOpacity onPress={handleShare}>
            <Icon name="share" size={24} color="white" />
          </TouchableOpacity>
          
          {/* Кнопка корзины - удаляет без подтверждения */}
          <TouchableOpacity onPress={handleDelete}>
            <Icon name="delete" size={24} color="white" />
          </TouchableOpacity>
        </Header>

        <TouchableWithoutFeedback onPress={handleContentPress}>
          <ScrollView 
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              {isEditing && !isInTrash ? (
                <TouchableWithoutFeedback onPress={handleTitlePress}>
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
                </TouchableWithoutFeedback>
              ) : (
                <Text style={{ fontSize: settings.fontSize + 2, fontWeight: 'bold', paddingVertical: 8, color: '#333' }}>
                  {note.title || 'Заголовок'}
                </Text>
              )}
              <View style={{ height: 2, backgroundColor: note.color || brandColor, width: '100%', marginTop: 4 }} />
            </View>

            {isEditing && !isInTrash ? (
              <TextInput 
                ref={contentInputRef}
                style={{ fontSize: settings.fontSize, paddingHorizontal: 16, paddingVertical: 12, textAlignVertical: 'top', color: '#333', minHeight: 200, lineHeight: settings.fontSize * 1.5 }} 
                placeholder="Текст заметки" 
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
                style={{ fontSize: settings.fontSize, paddingHorizontal: 16, paddingVertical: 12, color: '#333', lineHeight: settings.fontSize * 1.5 }}
                onPress={handleEditPress}
              >
                {note.content || '...'}
              </Text>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Кнопка редактирования/сохранения - не показываем для заметок в корзине */}
        {!isInTrash && (
          <View
            style={{ 
              position: 'absolute', 
              bottom: buttonBottom, 
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
          >
            <TouchableOpacity 
              onPress={isEditing ? handleSave : handleEditPress}
              style={{ width: '100%', height: '100%', borderRadius: 35, justifyContent: 'center', alignItems: 'center' }}
            >
              <Icon name={isEditing ? "check" : "edit"} size={36} color="white" />
            </TouchableOpacity>
          </View>
        )}

        <ColorPickerModal 
          visible={showColor} 
          onClose={() => setShowColor(false)} 
          selectedColor={note.color} 
          onSelect={handleColorSelect}
          settings={settings}
        />
      </KeyboardAvoidingView>
    </>
  );
};

export default EditNoteScreen;
