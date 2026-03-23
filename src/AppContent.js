import React from 'react';
import { View, FlatList, Text, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getBrandColor } from './BL02_Constants';
import Header from './BL04_Header';
import NoteItem from './BL09_NoteItem';
import { useNotesData } from './BL12_DataHooks';

const AppContent = () => {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = React.useState('notes');
  const [currentFolder, setCurrentFolder] = React.useState('Главная');
  const [selectedNote, setSelectedNote] = React.useState(null);
  
  const { notes, folders, settings, saveNotes, saveFolders, saveSettings, loadData } = useNotesData();
  
  // Фильтруем заметки по текущей папке
  const filteredNotes = React.useMemo(() => {
    if (currentFolder === 'Корзина') {
      return notes.filter(n => n.deleted === true);
    }
    return notes.filter(n => n.folder === currentFolder && !n.deleted);
  }, [notes, currentFolder]);
  
  // Сортируем заметки (закрепленные вверху, потом по дате)
  const sortedNotes = React.useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }, [filteredNotes]);
  
  const brandColor = getBrandColor(settings);
  const isInTrash = currentFolder === 'Корзина';
  
  // Создание новой заметки
  const handleAddNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: '',
      content: '',
      folder: currentFolder,
      color: brandColor,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false,
      pinned: false
    };
    setSelectedNote(newNote);
    setCurrentScreen('edit');
  };
  
  // Редактирование заметки
  const handleNotePress = (note) => {
    setSelectedNote(note);
    setCurrentScreen('edit');
  };
  
  // Сохранение заметки
  const handleSaveNote = (updatedNote) => {
    if (Array.isArray(updatedNote)) {
      saveNotes(updatedNote);
      return;
    }
    
    if (!updatedNote.updatedAt) updatedNote.updatedAt = Date.now();
    
    const index = notes.findIndex(n => n.id === updatedNote.id);
    const newNotes = index >= 0 
      ? [...notes.slice(0, index), updatedNote, ...notes.slice(index + 1)] 
      : [updatedNote, ...notes];
    
    saveNotes(newNotes);
    setCurrentScreen('notes');
    setSelectedNote(null);
  };
  
  // Экран списка заметок
  const NotesListScreen = () => (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title={currentFolder} 
        rightIcon="settings" 
        onRightPress={() => setCurrentScreen('settings')} 
        showBack 
        onBack={() => setCurrentScreen('folders')} 
        showSearch={false}
        brandColor={brandColor}
      />
      
      <FlatList 
        data={sortedNotes} 
        keyExtractor={item => item.id} 
        renderItem={({ item }) => (
          <NoteItem 
            item={item} 
            onPress={() => handleNotePress(item)} 
            onLongPress={() => console.log('Long press', item.id)}
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
  
  // Экран настроек (временный)
  const SettingsScreen = () => (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title="Настройки" 
        showBack 
        onBack={() => setCurrentScreen('notes')} 
        rightIcon="close" 
        onRightPress={() => setCurrentScreen('notes')}
        brandColor={brandColor}
      />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#333' }}>Настройки приложения</Text>
        <Text style={{ marginTop: 16, color: '#666' }}>Здесь будут настройки</Text>
      </View>
    </View>
  );
  
  // Экран папок (временный)
  const FoldersScreen = () => (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title="Выбор папки" 
        showBack 
        onBack={() => setCurrentScreen('notes')} 
        rightIcon="settings" 
        onRightPress={() => setCurrentScreen('settings')}
        brandColor={brandColor}
      />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#333' }}>Папки</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 12, backgroundColor: brandColor, borderRadius: 8 }}
          onPress={() => {
            setCurrentFolder('Главная');
            setCurrentScreen('notes');
          }}>
          <Text style={{ color: 'white' }}>Главная</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ marginTop: 12, padding: 12, backgroundColor: '#FF6B6B', borderRadius: 8 }}
          onPress={() => {
            setCurrentFolder('Корзина');
            setCurrentScreen('notes');
          }}>
          <Text style={{ color: 'white' }}>Корзина</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Экран редактирования
  const EditNoteScreen = () => (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title="Редактирование" 
        showBack 
        onBack={() => {
          setCurrentScreen('notes');
          setSelectedNote(null);
        }} 
        brandColor={selectedNote?.color || brandColor}
      />
      <View style={{ flex: 1, padding: 20 }}>
        <TextInput
          style={{ fontSize: 20, fontWeight: 'bold', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', color: '#333' }}
          placeholder="Заголовок"
          placeholderTextColor="#999"
          value={selectedNote?.title || ''}
          onChangeText={(text) => setSelectedNote({ ...selectedNote, title: text })}
        />
        <TextInput
          style={{ flex: 1, fontSize: 16, padding: 8, textAlignVertical: 'top', marginTop: 16, color: '#333' }}
          placeholder="Текст заметки..."
          placeholderTextColor="#999"
          multiline
          value={selectedNote?.content || ''}
          onChangeText={(text) => setSelectedNote({ ...selectedNote, content: text })}
        />
        <TouchableOpacity 
          style={{ 
            position: 'absolute', 
            bottom: insets.bottom + 24, 
            right: insets.right + 24, 
            width: 70, 
            height: 70, 
            borderRadius: 35, 
            backgroundColor: selectedNote?.color || brandColor, 
            justifyContent: 'center', 
            alignItems: 'center',
            elevation: 5
          }} 
          onPress={() => handleSaveNote(selectedNote)}>
          <Icon name="check" size={36} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Рендерим нужный экран
  switch (currentScreen) {
    case 'notes':
      return <NotesListScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'folders':
      return <FoldersScreen />;
    case 'edit':
      return <EditNoteScreen />;
    default:
      return <NotesListScreen />;
  }
};

export default AppContent;
