import React, { useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, Alert, BackHandler, Platform, Linking, StatusBar } from 'react-native';
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
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState(null);
  
  const { notes, folders, settings, saveNotes, saveFolders, saveSettings, loadData } = useNotesData();

  // Обработка открытия заметки из виджета и создания заметки из виджета
  useEffect(() => {
    const handleDeepLink = (event) => {
      const url = event.url;
      console.log('Deep link received:', url);
      if (url && url.includes('famnotes://note/')) {
        const noteId = url.split('famnotes://note/')[1];
        const note = notes.find(n => n.id === noteId);
        if (note) {
          setSelectedNote(note);
          setCurrentScreen('edit');
        }
      } else if (url && url.includes('famnotes://create')) {
        handleAddNote();
      }
    };
    
    const getInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        if (initialUrl.includes('famnotes://note/')) {
          const noteId = initialUrl.split('famnotes://note/')[1];
          const note = notes.find(n => n.id === noteId);
          if (note) {
            setSelectedNote(note);
            setCurrentScreen('edit');
          }
        } else if (initialUrl.includes('famnotes://create')) {
          handleAddNote();
        }
      }
    };
    
    getInitialUrl();
    
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription.remove();
    };
  }, [notes]);

  // Обработка кнопки "Назад" на Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showNoteDialog) {
        setShowNoteDialog(false);
        setSelectedNoteForAction(null);
        return true;
      }
      
      if (currentScreen === 'edit' && navigationStack[navigationStack.length - 1] === 'search') {
        setCurrentScreen('search');
        setSelectedNote(null);
        setNavigationStack(prev => prev.slice(0, -1));
        return true;
      }
      
      if (currentScreen === 'edit') {
        setCurrentScreen('notes');
        setSelectedNote(null);
        setNavigationStack(prev => prev.slice(0, -1));
        return true;
      }
      
      if (currentScreen === 'search') {
        setCurrentScreen('notes');
        setSearchQuery('');
        setNavigationStack(prev => prev.slice(0, -1));
        return true;
      }
      
      if (currentScreen === 'folders') {
        setCurrentScreen('notes');
        setNavigationStack(prev => prev.slice(0, -1));
        return true;
      }
      
      if (currentScreen === 'settings') {
        setCurrentScreen('notes');
        setNavigationStack(prev => prev.slice(0, -1));
        return true;
      }
      
      if (currentScreen === 'notes' && currentFolder !== 'Главная') {
        setCurrentFolder('Главная');
        return true;
      }
      
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
    if (isSaving) return;
    console.log('handleAddNote called, currentScreen:', currentScreen);
    
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
      locked: false,
      isNew: true,
      calendarEventId: null
    };
    setSelectedNote(newNote);
    setCurrentScreen('edit');
  };
  
  const handleSaveNote = (updatedNote) => {
    if (isSaving) return;
    setIsSaving(true);
    
    console.log('handleSaveNote called, isNew:', updatedNote?.isNew);
    
    try {
      if (Array.isArray(updatedNote)) {
        saveNotes(updatedNote);
        setIsSaving(false);
        return;
      }
      
      if (!updatedNote.updatedAt) updatedNote.updatedAt = Date.now();
      
      const index = notes.findIndex(n => n.id === updatedNote.id);
      const newNotes = index >= 0 
        ? [...notes.slice(0, index), updatedNote, ...notes.slice(index + 1)] 
        : [updatedNote, ...notes];
      
      const notesToSave = newNotes.map(n => {
        const { isNew, ...rest } = n;
        return rest;
      });
      
      saveNotes(notesToSave);
      
      setSelectedNote(null);
      setCurrentScreen('notes');
    } finally {
      setTimeout(() => {
        setIsSaving(false);
      }, 100);
    }
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
  
  // Функция отмены напоминания (удаляем calendarEventId)
  const handleCancelReminder = (noteId) => {
    const updatedNotes = notes.map(n => 
      n.id === noteId ? { ...n, calendarEventId: null, updatedAt: Date.now() } : n
    );
    saveNotes(updatedNotes);
    Alert.alert('✅ Напоминание отменено', 'Напоминание для этой заметки отменено');
  };
  
  const handleQuickDelete = (note) => {
    const noteId = note.id;
    const wasInTrash = note.folder === 'Корзина';
    
    if (note.folder === 'Корзина') {
      const updatedNotes = notes.filter(n => n.id !== note.id);
      saveNotes(updatedNotes);
    } else {
      const updatedNote = { ...note, folder: 'Корзина', deleted: true, pinned: false, updatedAt: Date.now() };
      const index = notes.findIndex(n => n.id === note.id);
      const newNotes = [...notes.slice(0, index), updatedNote, ...notes.slice(index + 1)];
      saveNotes(newNotes);
    }
    
    // Сохраняем информацию о том, что нужно вернуться в режим просмотра списка
    setPendingAction({ type: 'delete', noteId, wasInTrash });
  };
  
  // Эффект для обработки возврата после удаления
  useEffect(() => {
    if (pendingAction && pendingAction.type === 'delete') {
      setPendingAction(null);
      if (currentScreen !== 'notes') {
        setCurrentScreen('notes');
      }
      setSelectedNote(null);
    }
  }, [pendingAction, currentScreen]);
  
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
  
  const handleNoteOpen = (note) => {
    setSelectedNote(note);
    setCurrentScreen('edit');
  };
  
  const ActionDialog = () => {
    if (!selectedNoteForAction) return null;
    
    const isInTrashFolder = selectedNoteForAction.folder === 'Корзина' || selectedNoteForAction.deleted === true;
    
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
          if (isInTrashFolder) {
            handleRestoreFromTrash(selectedNoteForAction);
          } else {
            handleMoveNote(selectedNoteForAction, targetFolder);
          }
          setShowNoteDialog(false);
          setSelectedNoteForAction(null);
        }} 
        onDelete={() => {
          if (!isInTrashFolder) {
            handleQuickDelete(selectedNoteForAction);
          }
          setShowNoteDialog(false);
          setSelectedNoteForAction(null);
        }} 
        onPermanentDelete={() => {
          const updatedNotes = notes.filter(n => n.id !== selectedNoteForAction.id);
          saveNotes(updatedNotes);
          setShowNoteDialog(false);
          setSelectedNoteForAction(null);
          setCurrentScreen('notes');
        }} 
        onTogglePin={() => handleTogglePin(selectedNoteForAction.id)}
        isPinned={selectedNoteForAction?.pinned || false}
        isInTrash={isInTrashFolder}
        currentNote={selectedNoteForAction}
        settings={settings}
        onCancelReminder={handleCancelReminder}
      />
    );
  };
  
  const NotesListScreen = () => (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar backgroundColor={brandColor} barStyle="light-content" />
      <Header 
        title={currentFolder} 
        rightIcon="settings" 
        onRightPress={() => setCurrentScreen('settings')} 
        showSearch={true}
        onSearchPress={() => {
          setNavigationStack(prev => [...prev, 'notes']);
          setCurrentScreen('search');
        }}
        showFolders={true}
        onFoldersPress={() => setCurrentScreen('folders')}
        brandColor={brandColor}
      >
        {isInTrash && sortedNotes.length > 0 && (
          <TouchableOpacity onPress={handleEmptyTrash}>
            <Icon name="delete-sweep" size={24} color="white" />
          </
