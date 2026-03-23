import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { AsyncStorage } from '../imports';
import { NOTE_COLORS } from '../constants';

export const useNotesData = () => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState(['Главная', 'Корзина']);
  const [settings, setSettings] = useState({ fontSize: 16 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
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
          locked: n.locked || false,
          pinned: n.pinned || false,
          deleted: n.deleted || false
        }));
        setNotes(normalized);
      } else {
        const demoNote = {
          id: Date.now().toString(),
          title: 'Добро пожаловать!',
          content: 'Это пример заметки. Вы можете редактировать, удалять и создавать новые заметки.',
          folder: 'Главная',
          color: NOTE_COLORS[0],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deleted: false,
          pinned: false,
          locked: false
        };
        setNotes([demoNote]);
        await AsyncStorage.setItem('notes', JSON.stringify([demoNote]));
      }
      
      if (savedFolders) setFolders(JSON.parse(savedFolders));
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch (e) {
      console.log('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveNotes = useCallback(async (newNotes) => {
    const normalized = newNotes.map(n => ({ ...n, color: n.color || NOTE_COLORS[0] }));
    setNotes(normalized);
    await AsyncStorage.setItem('notes', JSON.stringify(normalized));
  }, []);

  const saveFolders = useCallback(async (newFolders) => {
    setFolders(newFolders);
    await AsyncStorage.setItem('folders', JSON.stringify(newFolders));
  }, []);

  const saveSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
  }, []);

  return { notes, folders, settings, isLoading, saveNotes, saveFolders, saveSettings, loadData };
};
