import React from 'react';
import { View, FlatList, Text, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from './BL04_Header';
import NoteItem from './BL09_NoteItem';
import { getBrandColor } from './BL02_Constants';

const NotesListScreen = ({ 
  currentFolder, 
  sortedNotes, 
  handleNotePress, 
  setSelectedNoteForAction, 
  setShowNoteDialog, 
  setCurrentScreen, 
  setSelectedNote, 
  goToSearch, 
  insets, 
  settings, 
  onEmptyTrash 
}) => {
  const brandColor = getBrandColor(settings);
  const isInTrash = currentFolder === 'Корзина';

  const handleAddNote = () => {
    const newNote = {
      id: Date.now() + '',
      title: '',
      content: '',
      folder: currentFolder,
      color: brandColor,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false,
      pinned: false,
      isNew: true
    };
    setSelectedNote(newNote);
    setCurrentScreen('edit');
  };

  const handleNoteLongPress = (item) => {
    // Для заметок в корзине не показываем диалог
    if (isInTrash) {
      Alert.alert(
        'Заметка в корзине',
        'Вы можете восстановить заметку или удалить её безвозвратно',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Восстановить', onPress: () => handleNotePress(item) },
          { text: 'Удалить безвозвратно', style: 'destructive', onPress: () => {
            Alert.alert(
              'Удалить заметку',
              'Вы уверены, что хотите безвозвратно удалить эту заметку?',
              [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Удалить', style: 'destructive', onPress: () => {
                  // Удаление безвозвратно
                }}
              ]
            );
          }}
        ]
      );
      return;
    }
    setSelectedNoteForAction(item);
    setShowNoteDialog(true);
  };

  const handleNotePressWrapper = (item) => {
    // Для заметок в корзине не открываем редактирование
    if (isInTrash) {
      Alert.alert(
        'Заметка в корзине',
        'Вы можете восстановить заметку или удалить её безвозвратно',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Восстановить', onPress: () => handleNotePress(item) },
          { text: 'Удалить безвозвратно', style: 'destructive', onPress: () => {
            Alert.alert(
              'Удалить заметку',
              'Вы уверены, что хотите безвозвратно удалить эту заметку?',
              [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Удалить', style: 'destructive', onPress: () => {
                  // Удаление безвозвратно
                }}
              ]
            );
          }}
        ]
      );
      return;
    }
    handleNotePress(item);
  };

  const handleEmptyTrash = () => {
    Alert.alert(
      'Очистить корзину',
      'Вы уверены, что хотите безвозвратно удалить все заметки из корзины?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить все', 
          style: 'destructive',
          onPress: () => {
            if (onEmptyTrash) {
              onEmptyTrash();
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title={currentFolder} 
        rightIcon="settings" 
        onRightPress={() => setCurrentScreen('settings')} 
        showSearch={true}
        onSearchPress={goToSearch}
        showFolders={true}
        onFoldersPress={() => setCurrentScreen('folders')}
        brandColor={brandColor}
      >
        {isInTrash && sortedNotes.length > 0 && (
          <TouchableOpacity onPress={handleEmptyTrash}>
            <Icon name="delete-sweep" size={24} color="white" />
          </TouchableOpacity>
        )}
      </Header>
      
      <FlatList 
        data={sortedNotes} 
        keyExtractor={item => item.id} 
        renderItem={({ item }) => (
          <NoteItem 
            item={item} 
            onPress={() => handleNotePressWrapper(item)} 
            onLongPress={() => handleNoteLongPress(item)} 
            settings={settings} 
            showPin={!isInTrash}
          />
        )} 
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: '#999' }}>Нет заметок</Text>
          </View>
        } 
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      
      {!isInTrash && (
        <TouchableOpacity 
          style={{ 
            position: 'absolute', 
            bottom: insets.bottom + 24, 
            right: insets.right + 24, 
            width: 70, 
            height: 70, 
            borderRadius: 35, 
            backgroundColor: brandColor, 
            justifyContent: 'center', 
            alignItems: 'center', 
            elevation: 5 
          }} 
          onPress={handleAddNote}>
          <Icon name="add" size={36} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default NotesListScreen;
