import { useCallback } from 'react';
import { Alert } from 'react-native';

export const useFolderHandlers = ({ folders, notes, currentFolder, saveFolders, saveNotes, setCurrentFolder }) => {
  const handleRenameFolder = useCallback((oldName, newName) => {
    const folderNames = folders.map(f => typeof f === 'object' ? f.name : f);
    if (folderNames.includes(newName)) {
      Alert.alert('Ошибка', 'Папка с таким именем уже существует');
      return false;
    }

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
    return true;
  }, [folders, notes, currentFolder, saveFolders, saveNotes, setCurrentFolder]);

  const handleColorChange = useCallback((folderName, newColor) => {
    const updatedFolders = folders.map(f => {
      if (typeof f === 'object' && f.name === folderName) return { ...f, color: newColor };
      if (f === folderName) return { name: f, color: newColor };
      return f;
    });
    saveFolders(updatedFolders);
  }, [folders, saveFolders]);

  const handleDeleteFolder = useCallback((folderName) => {
    const updatedNotes = notes.map(note =>
      note.folder === folderName ? { ...note, folder: 'Корзина', deleted: true, updatedAt: Date.now() } : note
    );
    const updatedFolders = folders.filter(f => {
      const name = typeof f === 'object' ? f.name : f;
      return name !== folderName;
    });
    saveNotes(updatedNotes);
    saveFolders(updatedFolders);
    if (currentFolder === folderName) setCurrentFolder('Главная');
  }, [notes, folders, currentFolder, saveFolders, saveNotes, setCurrentFolder]);

  return { handleRenameFolder, handleColorChange, handleDeleteFolder };
};
