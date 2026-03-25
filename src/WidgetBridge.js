import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { WidgetDataModule } = NativeModules;

export const updateWidgetData = async (notes) => {
  try {
    if (!notes || !Array.isArray(notes)) {
      console.log('No notes to update widget');
      return;
    }

    // Берем ВСЕ заметки из папки "Главная"
    const mainFolderNotes = notes
      .filter(note => note.folder === 'Главная' && !note.deleted)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map(note => ({
        id: note.id,
        title: note.title || '',
        content: note.content || '',
        date: note.updatedAt || note.createdAt || Date.now()
      }));
    
    const notesJson = JSON.stringify(mainFolderNotes);
    console.log('📱 Updating widget with', mainFolderNotes.length, 'notes from Главная');
    
    // Для Android нативного виджета
    if (Platform.OS === 'android' && WidgetDataModule) {
      WidgetDataModule.updateWidgetNotes(notesJson);
      console.log('✅ Widget updated via native module');
    }
    
    // Сохраняем в AsyncStorage для возможного использования
    await AsyncStorage.setItem('@widget_notes', notesJson);
    
  } catch (error) {
    console.error('Error updating widget:', error);
  }
};

export const getWidgetNotes = async () => {
  try {
    const notesJson = await AsyncStorage.getItem('@widget_notes');
    return notesJson ? JSON.parse(notesJson) : [];
  } catch (error) {
    console.error('Error getting widget notes:', error);
    return [];
  }
};
