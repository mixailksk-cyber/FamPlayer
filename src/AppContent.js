import React, { useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, Alert, BackHandler, Platform } from 'react-native';
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

const AppContent = () => {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = React.useState('notes');
  const [currentFolder, setCurrentFolder] = React.useState('Главная');
  const [selectedNote, setSelectedNote] = React.useState(null);
  const [navigationStack, setNavigationStack] = React.useState(['notes']);
  const [showNoteDialog, setShowNoteDialog] = React.useState(false);
  const [selectedNoteForAction, setSelectedNoteForAction] = React.useState(null);
  
  const { notes, folders, settings, saveNotes, saveFolders, saveSettings, loadData } = useNotesData();

  // Обработка кнопки "Назад" на Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Если открыт диалог - закрываем его
      if (showNoteDialog) {
        setShowNoteDialog(false);
        setSelectedNoteForAction(null);
        return true;
      }
      
      // Если на экране редактирования и пришли из поиска
      if (currentScreen === 'edit' && navigationStack[navigationStack.length - 1] === 'search') {
        setCurrentScreen('search');
        setSelectedNote(null);
        setNavigationStack(prev => prev.slice(0, -1));
        return true;
      }
      
      // Если на экране редактирования
      if (currentScreen === 'edit') {
        setCurrentScreen('notes');
        setSelectedNote(null);
        setNavigationStack(prev => prev.slice(0, -1));
        return true;
      }
      
      // Если на экране поиска
      if (currentScreen === 'search') {
        setCurrentScreen('notes');
        setNavigationStack(prev => prev.slice(0, -1));
        return true;
      }
      
      // Если на экране папок
      if (currentScreen === 'folders') {
        setCurrentScreen('notes');
        setNavigationStack(prev => prev.slice(0, -1));
        return true;
      }
      
      // Если на экране настроек
      if (currentScreen === 'settings') {
        setCurrentScreen('notes');
        setNavigationStack(prev => prev.slice(0, -1));
        return true;
      }
      
      // Если на экране заметок, но не в Главной папке
      if (currentScreen === 'notes' && currentFolder !== 'Главная') {
        setCurrentFolder('Главная');
        return true;
      }
      
      // Если на главном экране с папкой Главная - закрываем приложение
      return false;
    });
    
    return () => backHandler.remove();
  }, [currentScreen, currentFolder, navigationStack, showNoteDialog]);
  
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
      deleted: false,
      updatedAt: Date.now() 
    };
    const index = notes.findIndex(n => n.id === note.id);
    const newNotes = [...notes.slice(0, index), updatedNote, ...notes.slice(index + 1)];
    saveNotes(newNotes);
  };
  
  const handleRestoreFromTrash = (note) => {
    const updatedNote = { ...note, folder: 'Главная', deleted: false, updatedAt: Date.now() };
    const index = notes.findIndex(n => n.id === note.id);
    const newNotes = [...notes.slice(0, index), updatedNote, ...notes.slice(index + 1)];
    saveNotes(newNotes);
  };
  
  const handleTogglePin = (noteId) => {
    const updatedNotes = notes.map(n => n.id === noteId ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n);
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
  
  // Удаление заметки без подтверждения
  const handleQuickDelete = (note) => {
    if (note.folder === 'Корзина') {
      const updatedNotes = notes.filter(n => n.id !== note.id);
      saveNotes(updatedNotes);
    } else {
      const updatedNote = { ...note, folder: 'Корзина', deleted: true, pinned: false, updatedAt: Date.now() };
      const index = notes.findIndex(n => n.id === note.id);
      const newNotes = [...notes.slice(0, index), updatedNote, ...notes.slice(index + 1)];
      saveNotes(newNotes);
    }
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
  
  const handleLongPressOnNote = (note) => {
    setSelectedNoteForAction(note);
    setShowNoteDialog(true);
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
        {!isInTrash && (
          <TouchableOpacity onPress={() => handleQuickDelete(selectedNoteForAction || {})}>
            <Icon name="delete" size={24} color="white" />
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
            onLongPress={() => handleLongPressOnNote(item)}
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
  
  const ActionDialog = () => {
    if (!selectedNoteForAction) return null;
    
    return (
      <NoteActionDialog 
        visible={showNoteDialog} 
        onClose={() => { 
          setShowNoteDialog(false); 
          setSelectedNoteForAction(null); 
        }} 
        folders={folders} 
        currentFolder={selectedNoteForAction?.folder || currentFolder} 
        onMove={(targetFolder) => {
          if (selectedNoteForAction.folder === 'Корзина') {
            handleRestoreFromTrash(selectedNoteForAction);
          } else {
            handleMoveNote(selectedNoteForAction, targetFolder);
          }
          setShowNoteDialog(false);
          setSelectedNoteForAction(null);
        }} 
        onDelete={() => {
          if (selectedNoteForAction.folder === 'Корзина') {
            const updatedNotes = notes.filter(n => n.id !== selectedNoteForAction.id);
            saveNotes(updatedNotes);
          } else {
            const updatedNote = { ...selectedNoteForAction, folder: 'Корзина', deleted: true, pinned: false, updatedAt: Date.now() };
            const index = notes.findIndex(n => n.id === selectedNoteForAction.id);
            const newNotes = [...notes.slice(0, index), updatedNote, ...notes.slice(index + 1)];
            saveNotes(newNotes);
          }
          setShowNoteDialog(false);
          setSelectedNoteForAction(null);
        }} 
        onPermanentDelete={() => {
          const updatedNotes = notes.filter(n => n.id !== selectedNoteForAction.id);
          saveNotes(updatedNotes);
          setShowNoteDialog(false);
          setSelectedNoteForAction(null);
        }} 
        onTogglePin={() => handleTogglePin(selectedNoteForAction.id)}
        onToggleLock={() => {}}
        isPinned={selectedNoteForAction?.pinned || false}
        isLocked={false}
        settings={settings} 
      />
    );
  };
  
  switch (currentScreen) {
    case 'notes':
      return (
        <>
          <NotesListScreen />
          <ActionDialog />
        </>
      );
    case 'settings':
      return (
        <SettingsScreen 
          setCurrentScreen={setCurrentScreen}
          settings={settings}
          saveSettings={saveSettings}
          notes={notes}
          folders={folders}
          onBrandColorChange={() => {}}
          loadData={loadData}
          setCurrentFolder={setCurrentFolder}
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
      return (
        <>
          <NotesListScreen />
          <ActionDialog />
        </>
      );
  }
};

export default AppContent;
