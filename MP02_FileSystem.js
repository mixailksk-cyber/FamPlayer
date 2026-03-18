// Добавьте эти функции в конец файла MP02_FileSystem.js

export const saveSelectedFolders = async (selectedIds) => {
  try {
    await AsyncStorage.setItem('selected_folders', JSON.stringify(selectedIds));
    return true;
  } catch { return false; }
};

export const getSelectedFolders = async () => {
  try {
    const selected = await AsyncStorage.getItem('selected_folders');
    return selected ? JSON.parse(selected) : {};
  } catch { return {}; }
};

export const filterFoldersBySelection = (folders, selectedIds) => {
  return folders.filter(f => selectedIds[f.id]);
};
