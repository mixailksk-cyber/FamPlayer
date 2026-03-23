import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTE_COLORS } from './BL02_Constants';

export const useNotesData = () => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState(['Главная', 'Корзина']);
  const [settings, setSettings] = useState({ fontSize: 16, brandColor: '#20A0A0' });

  useEffect(() => {
    loadData();
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
        const normalized = parsed.map(n => ({ ...n, color: n.color || NOTE_COLORS[0] }));
        setNotes(normalized);
        console.log(`📝 Loaded ${normalized.length} notes`);
      } else {
        // Создаем пример заметки для демонстрации
        const demoNote = {
          id: Date.now().toString(),
          title: 'Пример заметки',
          content: 'Это пример заметки. Нажмите на нее, чтобы редактировать. Нажмите + чтобы создать новую.',
          folder: 'Главная',
          color: NOTE_COLORS[0],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deleted: false,
          pinned: false
        };
        setNotes([demoNote]);
        await AsyncStorage.setItem('notes', JSON.stringify([demoNote]));
        console.log('📝 Created demo note');
      }
      
      if (savedFolders) {
        setFolders(JSON.parse(savedFolders));
        console.log(`📁 Loaded folders`);
      }
      
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
        console.log(`⚙️ Loaded settings`);
      }
    } catch (e) {
      console.log('Error loading data:', e);
    }
  }, []);

  const saveNotes = useCallback(async (newNotes) => {
    const normalized = newNotes.map(n => ({ ...n, color: n.color || NOTE_COLORS[0] }));
    setNotes(normalized);
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(normalized));
      console.log(`💾 Saved ${normalized.length} notes`);
    } catch (e) {
      console.log('Error saving notes:', e);
      if (Platform.OS === 'web') Alert.alert('Внимание', 'Данные сохранены только в памяти');
    }
  }, []);

  const saveFolders = useCallback(async (newFolders) => {
    setFolders(newFolders);
    await AsyncStorage.setItem('folders', JSON.stringify(newFolders));
    console.log(`💾 Saved folders`);
  }, []);

  const saveSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
    console.log(`💾 Saved settings`);
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
