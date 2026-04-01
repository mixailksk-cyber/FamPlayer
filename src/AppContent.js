import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Alert, BackHandler, Platform, Linking, StatusBar, ActivityIndicator } from 'react-native';
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
import { NativeModules, NativeEventEmitter } from 'react-native';

const AppContent = () => {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState('notes');
  const [currentFolder, setCurrentFolder] = useState('Главная');
  const [selectedNote, setSelectedNote] = useState(null);
  const [navigationStack, setNavigationStack] = useState(['notes']);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedNoteForAction, setSelectedNoteForAction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const isCreatingNote = useRef(false);
  const pendingCreateFromWidget = useRef(false);
  
  const { notes, folders, settings, saveNotes, saveFolders, saveSettings, loadData } = useNotesData();

  // Функция создания новой заметки
  const createNewNote = React.useCallback(() => {
    if (isSaving || isCreatingNote.current) return;
    isCreatingNote.current = true;
    
    const brandColor = getBrandColor(settings);
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
      hasReminder: false,
      reminderTime: null
    };
    setSelectedNote(newNote);
    setCurrentScreen('edit');
    
    setTimeout(() => {
      isCreatingNote.current = false;
    }, 1000);
  }, [isSaving, currentFolder, settings]);

  // Проверка истекших напоминаний
  useEffect(() => {
    if (!isDataLoaded) return;
    
    const now = Date.now();
    let hasChanges = false;
    
    const updatedNotes = notes.map(note => {
      if (note.hasReminder && note.reminderTime && note.reminderTime <= now) {
        hasChanges = true;
        return { ...note, hasReminder: false, reminderTime: null };
      }
      return note;
    });
    
    if (hasChanges) {
      saveNotes(updatedNotes);
    }
  }, [notes, isDataLoaded, saveNotes]);

  // Обработка события из виджета через NativeEventEmitter
  useEffect(() => {
    let eventEmitter = null;
    let subscription = null;
    
    try {
      const { DeviceEventManagerModule } = NativeModules;
      if (DeviceEventManagerModule) {
        eventEmitter = new NativeEventEmitter(DeviceEventManagerModule);
        subscription = eventEmitter.addListener('createNewNote', () => {
          console.log('Received createNewNote event from widget');
          if (isDataLoaded) {
            createNewNote();
          } else {
            pendingCreateFromWidget.current = true;
          }
        });
      }
    } catch (e) {
      console.log('NativeEventEmitter error:', e);
    }
    
    return () => {
      if (subscription) subscription.remove();
    };
  }, [isDataLoaded, createNewNote]);

  // Обработка deep link для открытия заметки и создания через URL
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
        if (isDataLoaded) {
          createNewNote();
        } else {
          pendingCreateFromWidget.current = true;
        }
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
          if (isDataLoaded) {
            createNewNote();
          } else {
            pendingCreateFromWidget.current = true;
          }
        }
      }
    };
    
    getInitialUrl();
    
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription.remove();
    };
  }, [notes, isDataLoaded, createNewNote]);

  // Обработка отложенного создания после загрузки данных
  useEffect(() => {
    if (isDataLoaded && pendingCreateFromWidget.current) {
      pendingCreateFromWidget.current = false;
      createNewNote();
    }
  }, [isDataLoaded, createNewNote]);

  // Загрузка данных
  useEffect(() => {
    const loadDataAsync = async () => {
      await loadData();
      setIsDataLoaded(true);
    };
    loadDataAsync();
  }, [loadData]);

  // Установка напоминания
  const handleSetReminder = (noteId, reminderTime) => {
    const updatedNotes = notes.map(n => 
      n.id === noteId ? { ...n, hasReminder: true, reminderTime: reminderTime, updatedAt: Date.now() } : n
    );
    saveNotes(updatedNotes);
  };
  
  // Отмена напоминания
  const handleCancelReminder = (noteId) => {
    const updatedNotes = notes.map(n => 
      n.id === noteId ? { ...n, hasReminder: false, reminderTime: null, updatedAt: Date.now() } : n
    );
    saveNotes(updatedNotes);
    Alert.alert('✅ Напоминание отменено', 'Напоминание для этой заметки отменено');
  };

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
    createNewNote();
  };
  
  const handleSaveNote = (updatedNote) => {
    if (isSaving) return;
    setIsSaving(true);
    
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
    
    setCurrentScreen('notes');
    setSelectedNote(null);
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
    const hasActiveReminder = selectedNoteForAction.hasReminder === true && 
                              selectedNoteForAction.reminderTime && 
                              selectedNoteForAction.reminderTime > Date.now();
    
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
        onSetReminder={handleSetReminder}
        onCancelReminder={handleCancelReminder}
        hasReminder={hasActiveReminder}
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
          </TouchableOpacity>
        )}
      </Header>
      
      {!isDataLoaded ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={{ marginTop: 16, color: '#666' }}>Загрузка...</Text>
        </View>
      ) : (
        <FlatList 
          data={sortedNotes} 
          keyExtractor={item => item.id} 
          renderItem={({ item }) => (
            <NoteItem 
              item={item} 
              onPress={() => handleNoteOpen(item)} 
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
      )}
      
      {!isInTrash && isDataLoaded && (
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
  
  const isSelectedNoteNew = selectedNote && selectedNote.isNew === true;
  
  if (!isDataLoaded && currentScreen !== 'edit') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color={brandColor} />
        <Text style={{ marginTop: 16, color: '#666' }}>Загрузка заметок...</Text>
      </View>
    );
  }
  
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
          onQuickDelete={handleQuickDelete}
          isNewNote={isSelectedNoteNew}
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
          goBack={() => {
            setCurrentScreen('notes');
            setSearchQuery('');
          }}
          navigationStack={navigationStack}
          setNavigationStack={setNavigationStack}
          setSearchQuery={setSearchQuery}
          searchQuery={searchQuery}
          settings={settings}
          onLongPressNote={handleLongPressOnNote}
          onNoteOpen={handleNoteOpen}
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
