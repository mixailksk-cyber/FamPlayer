import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTE_COLORS } from './BL02_Constants';
import { updateWidgetData } from './WidgetBridge';
import { configureNotifications, cancelReminder } from './BL21_NotificationService';

export const useNotesData = () => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState(['Главная', 'Корзина']);
  const [settings, setSettings] = useState({ fontSize: 16, brandColor: '#20A0A0' });

  useEffect(() => {
    loadData();
    // Настройка уведомлений с запросом разрешения
    configureNotifications();
  }, []);

  const loadData = useCallback(async () => {
    try {
      console.log('📂 Loading data from AsyncStorage...');
      const [savedNotes, savedFolders, savedSettings] = await Promise.all([
        AsyncStorage.getItem('notes'),
        AsyncStorage.getItem('folders'),
        AsyncStorage.getItem('settings')
      ]);
      
      if (savedNotes) {
        const parsed = JSON.parse(savedNotes);
        const normalized = parsed.map(n => ({ 
          ...n, 
          color: n.color || NOTE_COLORS[0],
          reminder: n.reminder || null
        }));
        setNotes(normalized);
        console.log(`📝 Loaded ${normalized.length} notes`);
        updateWidgetData(normalized);
      } else {
        const demoNote = {
          id: Date.now().toString(),
          title: 'Пример заметки',
          content: 'Это пример заметки. Нажмите на нее, чтобы редактировать.',
          folder: 'Главная',
          color: NOTE_COLORS[0],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deleted: false,
          pinned: false,
          reminder: null
        };
        setNotes([demoNote]);
        await AsyncStorage.setItem('notes', JSON.stringify([demoNote]));
      }
      
      if (savedFolders) {
        setFolders(JSON.parse(savedFolders));
      }
      
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (e) {
      console.log('Error loading data:', e);
    }
  }, []);

  const saveNotes = useCallback(async (newNotes) => {
    // Находим заметки, у которых было удалено напоминание
    const oldNotes = notes;
    const removedReminders = oldNotes.filter(oldNote => {
      const newNote = newNotes.find(n => n.id === oldNote.id);
      return oldNote.reminder && (!newNote || !newNote.reminder);
    });
    
    // Отменяем напоминания для удаленных
    removedReminders.forEach(note => {
      if (note.reminder && note.reminder > Date.now()) {
        console.log('Cancelling reminder for note:', note.id);
        cancelReminder(note.id);
      }
    });
    
    const normalized = newNotes.map(n => ({ 
      ...n, 
      color: n.color || NOTE_COLORS[0],
      reminder: n.reminder || null
    }));
    setNotes(normalized);
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(normalized));
      updateWidgetData(normalized);
    } catch (e) {
      if (Platform.OS === 'web') Alert.alert('Внимание', 'Данные сохранены только в памяти');
    }
  }, [notes]);

  const saveFolders = useCallback(async (newFolders) => {
    setFolders(newFolders);
    await AsyncStorage.setItem('folders', JSON.stringify(newFolders));
  }, []);

  const saveSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
  }, []);

  return { 
    notes, 
    folders, 
    settings, 
    saveNotes, 
    saveFolders, 
    saveSettings,
    loadData
  };
};
