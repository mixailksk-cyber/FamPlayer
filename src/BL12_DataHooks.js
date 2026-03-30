import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTE_COLORS } from './BL02_Constants';
import { updateWidgetData } from './WidgetBridge';
import { configureNotifications, cancelReminder, scheduleReminder } from './BL21_NotificationService';
import { addEventToCalendar, removeEventFromCalendar } from './CalendarBridge';

// Хранилище ID событий календаря (только в памяти, не в бекап)
const calendarEventIds = {};

export const useNotesData = () => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState(['Главная', 'Корзина']);
  const [settings, setSettings] = useState({ fontSize: 16, brandColor: '#20A0A0', useCalendar: false });

  useEffect(() => {
    loadData();
    configureNotifications();
  }, []);

  const loadData = useCallback(async () => {
    try {
      console.log('📂 Loading data from AsyncStorage...');
      const [storedNotes, storedFolders, storedSettings] = await Promise.all([
        AsyncStorage.getItem('notes'),
        AsyncStorage.getItem('folders'),
        AsyncStorage.getItem('settings')
      ]);
      
      if (storedNotes) {
        const parsed = JSON.parse(storedNotes);
        const normalized = parsed.map(n => ({ 
          ...n, 
          color: n.color || NOTE_COLORS[0],
          reminder: n.reminder || null
        }));
        setNotes(normalized);
        console.log(`📝 Loaded ${normalized.length} notes`);
        updateWidgetData(normalized);
        
        // Восстанавливаем напоминания для активных заметок
        normalized.forEach(note => {
          if (note.reminder && note.reminder > Date.now()) {
            scheduleReminder(note.id, note.title, note.content, note.reminder, settings.useCalendar);
          }
        });
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
      
      if (storedFolders) {
        setFolders(JSON.parse(storedFolders));
      }
      
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (e) {
      console.log('Error loading data:', e);
    }
  }, [settings.useCalendar]);

  const saveNotes = useCallback(async (newNotes) => {
    const oldNotes = notes;
    
    // Находим заметки, у которых изменилось напоминание
    const changedReminders = oldNotes.filter(oldNote => {
      const newNote = newNotes.find(n => n.id === oldNote.id);
      return oldNote.reminder !== newNote?.reminder;
    });
    
    // Отменяем старые напоминания
    changedReminders.forEach(note => {
      if (note.reminder) {
        cancelReminder(note.id);
      }
    });
    
    // Планируем новые напоминания
    for (const newNote of newNotes) {
      if (newNote.reminder && newNote.reminder > Date.now()) {
        await scheduleReminder(
          newNote.id, 
          newNote.title, 
          newNote.content, 
          newNote.reminder, 
          settings.useCalendar,
          (noteId, eventId) => {
            calendarEventIds[noteId] = eventId;
          }
        );
      }
    }
    
    // Сохраняем без calendarEventId (только в памяти)
    const normalized = newNotes.map(n => {
      const { calendarEventId, ...rest } = n;
      return { 
        ...rest, 
        color: n.color || NOTE_COLORS[0],
        reminder: n.reminder || null
      };
    });
    
    setNotes(newNotes);
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(normalized));
      updateWidgetData(normalized);
    } catch (e) {
      if (Platform.OS === 'web') Alert.alert('Внимание', 'Данные сохранены только в памяти');
    }
  }, [notes, settings.useCalendar]);

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
