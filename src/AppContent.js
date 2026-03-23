import React from 'react';
import { View, FlatList, Text, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getBrandColor } from './BL02_Constants';
import Header from './BL04_Header';
import NoteItem from './BL09_NoteItem';
import SettingsScreen from './BL19_SettingsScreen';
import FoldersScreen from './BL18_FoldersScreen';
import EditNoteScreen from './BL17_EditNoteScreen';
import SearchScreen from './BL20_SearchScreen';
import NoteActionDialog from './BL07_NoteActionDialog';
import { useNotesData } from './BL12_DataHooks';

// Принудительная загрузка иконок
Icon.loadFont();

const AppContent = () => {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = React.useState('notes');
  const [currentFolder, setCurrentFolder] = React.useState('Главная');
  const [selectedNote, setSelectedNote] = React.useState(null);
  const [navigationStack, setNavigationStack] = React.useState(['notes']);
  const [showNoteDialog, setShowNoteDialog] = React.useState(false);
  const [selectedNoteForAction, setSelectedNoteForAction] = React.useState(null);
  
  const { notes, folders, settings, saveNotes, saveFolders, saveSettings } = useNotesData();
  
  const filteredNotes = React.useMemo(() => {
    if (currentFolder === 'Корзина') {
      return notes.filter(n => n.deleted === true);
    }
    return notes.filter(n => n.folder === currentFolder && !n.deleted);
  }, [notes, currentFolder]);
  
  const sortedNotes = React.useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }, [filteredNotes]);
  
  const brandColor = getBrandColor(settings);
  const isInTrash = currentFolder === 'Корзина';
  
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
      pinned: false,
      locked: false
    };
    setSelectedNote(newNote);
    setCurrentScreen('edit');
  };
  
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
  
  const handleMoveNote = (note, targetFolder) => {
    const updatedNote = { 
      ...note, 
      folder: targetFolder, 
      deleted: targetFolder === 'Корзина' ? true : false,
      updatedAt: Date.now() 
    };
    const index = notes.findIndex(n => n.id === note.id);
    const newNotes = [...notes.slice(0, index), updatedNote, ...notes.slice(index + 1)];
    saveNotes(newNotes);
  };
  
  const handleTogglePin = (noteId) => {
    const updatedNotes = notes.map(n => n.id === noteId ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n);
    saveNotes(updatedNotes);
  };
  
  const handleToggleLock = (noteId) => {
    const updatedNotes = notes.map(n => n.id === noteId ? { ...n, locked: !n.locked, updatedAt: Date.now() } : n);
    saveNotes(updatedNotes);
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
            const updatedNotes = notes.filter(n => n.folder !== 'Корзина' && !n.deleted);
            saveNotes(updatedNotes);
          }
        }
      ]
    );
  };
  
  const handleRenameFolder = (oldName, newName) => {
    const updatedFolders = folders.map(f => {
      if (typeof f === 'object' && f.name === oldName) return { ...f, name: newName };
      if (f === oldName) return newName;
      return f;
    });
    const updatedNotes = notes.map(note =>
      note.folder === oldName ? { ...note, folder: newName, updatedAt: Date.now() } : note
    );
    saveNotes(updatedNotes);
    saveFolders(updatedFolders);
    if (currentFolder === oldName) setCurrentFolder(newName);
  };
  
  const handleDeleteFolder = (folderName) => {
    Alert.alert(
      'Удалить папку',
      `Все заметки из папки "${folderName}" будут перемещены в корзину. Продолжить?`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: () => {
            const updatedNotes = notes.map(note =>
              note.folder === folderName
                ? { ...note, folder: 'Корзина', deleted: true, updatedAt: Date.now() }
                : note
            );
            const updatedFolders = folders.filter(f => {
              const name = typeof f === 'object' ? f.name : f;
              return name !== folderName;
            });
            saveNotes(updatedNotes);
            saveFolders(updatedFolders);
            if (currentFolder === folderName) setCurrentFolder('Главная');
          }
        }
      ]
    );
  };
  
  const handleColorChange = (folderName, newColor) => {
    const updatedFolders = folders.map(f => {
      if (typeof f === 'object' && f.name === folderName) {
        return { ...f, color: newColor };
      }
      if (f === folderName) {
        return { name: f, color: newColor };
      }
      return f;
    });
    saveFolders(updatedFolders);
  };
  
  const NotesListScreen = () => (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title={currentFolder} 
        rightIcon="settings" 
        onRightPress={() => setCurrentScreen('settings')} 
        showBack 
        onBack={() => setCurrentScreen('folders')} 
        showSearch={true}
        onSearchPress={() => {
          setNavigationStack(prev => [...prev, 'notes']);
          setCurrentScreen('search');
        }}
        brandColor={brandColor}
      >
        {isInTrash && sortedNotes.length > 0 && (
          <TouchableOpacity onPress={handleEmptyTrash} style={{ marginRight: 20 }}>
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
            onPress={() => {
              setSelectedNote(item);
              setCurrentScreen('edit');
            }} 
            onLongPress={() => {
              setSelectedNoteForAction(item);
              setShowNoteDialog(true);
            }} 
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
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84
          }} 
          onPress={handleAddNote}>
          <Icon name="add" size={36} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
  
  switch (currentScreen) {
    case 'notes':
      return <NotesListScreen />;
    case 'settings':
      return (
        <SettingsScreen 
          setCurrentScreen={setCurrentScreen}
          settings={settings}
          saveSettings={saveSettings}
          notes={notes}
          folders={folders}
          onBrandColorChange={() => {}}
        />
      );
    case 'folders':
      return (
        <FoldersScreen 
          folders={folders}
          currentFolder={currentFolder}
          setCurrentFolder={setCurrentFolder}
          setCurrentScreen={setCurrentScreen}
          insets={insets}
          saveFolders={saveFolders}
          settings={settings}
          notes={notes}
          handleRenameFolder={handleRenameFolder}
          handleDeleteFolder={handleDeleteFolder}
          handleColorChange={handleColorChange}
          showFolderDialog={false}
          setShowFolderDialog={() => {}}
          showFolderSettings={false}
          setShowFolderSettings={() => {}}
          selectedFolderForSettings={null}
          setSelectedFolderForSettings={() => {}}
          selectedFolderColor={null}
          setSelectedFolderColor={() => {}}
        />
      );
    case 'edit':
      return (
        <EditNoteScreen 
          selectedNote={selectedNote}
          currentFolder={currentFolder}
          notes={notes}
          settings={settings}
          onSave={handleSaveNote}
          setCurrentScreen={setCurrentScreen}
          insets={insets}
        />
      );
    case 'search':
      return (
        <SearchScreen 
          notes={notes}
          setCurrentScreen={setCurrentScreen}
          setSelectedNote={setSelectedNote}
          setSelectedNoteForAction={setSelectedNoteForAction}
          setShowNoteDialog={setShowNoteDialog}
          goBack={() => setCurrentScreen('notes')}
          navigationStack={navigationStack}
          setNavigationStack={setNavigationStack}
          setSearchQuery={() => {}}
          searchQuery=""
          settings={settings}
        />
      );
    default:
      return <NotesListScreen />;
  }
};

export default AppContent;
