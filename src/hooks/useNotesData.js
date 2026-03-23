import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { NOTE_COLORS } from '../constants';

// Временное хранилище в памяти
let memoryNotes = [];
let memoryFolders = ['Главная', 'Корзина'];
let memorySettings = { fontSize: 16 };

export const useNotesData = () => {
  const [notes, setNotes] = useState(memoryNotes);
  const [folders, setFolders] = useState(memoryFolders);
  const [settings, setSettings] = useState(memorySettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (memoryNotes.length === 0) {
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
        memoryNotes = [demoNote];
        setNotes(memoryNotes);
      } else {
        setNotes(memoryNotes);
      }
      
      setFolders(memoryFolders);
      setSettings(memorySettings);
    } catch (e) {
      console.log('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveNotes = useCallback(async (newNotes) => {
    const normalized = newNotes.map(n => ({ ...n, color: n.color || NOTE_COLORS[0] }));
    memoryNotes = normalized;
    setNotes(normalized);
  }, []);

  const saveFolders = useCallback(async (newFolders) => {
    memoryFolders = newFolders;
    setFolders(newFolders);
  }, []);

  const saveSettings = useCallback(async (newSettings) => {
    memorySettings = newSettings;
    setSettings(newSettings);
  }, []);

  return { notes, folders, settings, isLoading, saveNotes, saveFolders, saveSettings, loadData };
};
