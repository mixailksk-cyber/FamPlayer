import { Platform, Alert, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { IS_WEB_STUB, WEB_STUB_MESSAGE, APP_FAVORITES_NAME, TRASH_FOLDER_NAME } from './MP01_Core';

// Демо-данные для Snack
const DEMO_ROOT = 'demo://root';
const DEMO_FOLDERS = [
  { id: 'folder1', name: 'Жатва', uri: 'demo://root/Жатва' },
  { id: 'folder2', name: 'Пасха', uri: 'demo://root/Пасха' },
  { id: 'folder3', name: 'Корзина', uri: 'demo://root/Корзина', isSystem: true },
];

const DEMO_SONGS = [
  { id: '1', title: 'sdvsd.mp3', uri: 'demo://root/sdvsd.mp3', folder: APP_FAVORITES_NAME, addedAt: Date.now() - 100000 },
  { id: '2', title: 'sfdb.mp3', uri: 'demo://root/sfdb.mp3', folder: APP_FAVORITES_NAME, addedAt: Date.now() - 90000 },
  { id: '3', title: 'sdvs.mp3', uri: 'demo://root/sdvs.mp3', folder: APP_FAVORITES_NAME, addedAt: Date.now() - 80000 },
  { id: '4', title: '1.mp3', uri: 'demo://root/Жатва/1.mp3', folder: 'Жатва', addedAt: Date.now() - 70000 },
  { id: '5', title: '2.mp3', uri: 'demo://root/Жатва/2.mp3', folder: 'Жатва', addedAt: Date.now() - 60000 },
  { id: '6', title: 'df.mp3', uri: 'demo://root/Пасха/df.mp3', folder: 'Пасха', addedAt: Date.now() - 50000 },
  { id: '7', title: 'kjnj.mp3', uri: 'demo://root/Пасха/kjnj.mp3', folder: 'Пасха', addedAt: Date.now() - 40000 },
  { id: '8', title: '7.mp3', uri: 'demo://root/Корзина/7.mp3', folder: TRASH_FOLDER_NAME, addedAt: Date.now() - 30000 },
  { id: '9', title: '8.mp3', uri: 'demo://root/Корзина/8.mp3', folder: TRASH_FOLDER_NAME, addedAt: Date.now() - 20000 },
];

const ROOT_FOLDER_KEY = '@root_folder';
const FOLDER_COLORS_KEY = '@folder_colors';

// Запрос разрешений на Android
export const requestStoragePermission = async () => {
  if (Platform.OS !== 'android' || IS_WEB_STUB) return true;
  
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'Доступ к хранилищу',
        message: 'Приложению нужен доступ к файлам для воспроизведения музыки',
        buttonNeutral: 'Спросить позже',
        buttonNegative: 'Отмена',
        buttonPositive: 'OK',
      }
    );
    
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      // Запрашиваем также разрешение на запись
      const writeGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      return writeGranted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      Alert.alert('Ошибка', 'Нет доступа к хранилищу');
      return false;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
};

export const saveRootFolder = async (uri) => {
  if (IS_WEB_STUB) return true;
  try {
    await AsyncStorage.setItem(ROOT_FOLDER_KEY, uri);
    return true;
  } catch { return false; }
};

export const getRootFolder = async () => {
  if (IS_WEB_STUB) return DEMO_ROOT;
  try {
    return await AsyncStorage.getItem(ROOT_FOLDER_KEY);
  } catch { return null; }
};

// Выбор папки для Android
export const pickFolder = async () => {
  if (IS_WEB_STUB) {
    Alert.alert('Демо-режим', 'Выбор папки работает только на устройстве');
    return DEMO_ROOT;
  }
  
  // Сначала запрашиваем разрешения
  const hasPermission = await requestStoragePermission();
  if (!hasPermission) return null;
  
  try {
    // Используем DocumentPicker для выбора файла, потом берем его папку
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: false,
    });
    
    if (result.canceled) return null;
    
    // Получаем путь к папке из URI файла
    const fileUri = result.assets[0].uri;
    // Для Android URI может быть в формате content://, но нам нужен путь
    if (fileUri.startsWith('content://')) {
      // Пытаемся получить реальный путь
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        const folderPath = fileInfo.uri.substring(0, fileInfo.uri.lastIndexOf('/'));
        return folderPath;
      }
    }
    
    const folderPath = fileUri.substring(0, fileUri.lastIndexOf('/'));
    return folderPath;
  } catch (error) {
    Alert.alert('Ошибка', 'Не удалось выбрать папку');
    return null;
  }
};

// Получение списка папок
export const getPlaylistFolders = async () => {
  if (IS_WEB_STUB) return DEMO_FOLDERS;
  
  const rootUri = await getRootFolder();
  if (!rootUri) return [];
  
  try {
    // Убираем file:// если есть
    const cleanRootUri = rootUri.replace('file://', '');
    const items = await FileSystem.readDirectoryAsync(cleanRootUri);
    const folders = [];
    
    for (const item of items) {
      const itemUri = `${cleanRootUri}/${item}`;
      const info = await FileSystem.getInfoAsync(itemUri);
      if (info.isDirectory) {
        folders.push({
          id: itemUri,
          name: item,
          uri: itemUri,
        });
      }
    }
    
    return folders;
  } catch (error) {
    console.error('Error reading folders:', error);
    return [];
  }
};

// Получение файлов из корня
export const getRootFiles = async () => {
  if (IS_WEB_STUB) return DEMO_SONGS.filter(s => s.folder === APP_FAVORITES_NAME);
  
  const rootUri = await getRootFolder();
  if (!rootUri) return [];
  
  try {
    return await getAudioFilesFromPath(rootUri);
  } catch (error) {
    console.error('Error reading root files:', error);
    return [];
  }
};

// Получение файлов из папки
export const getFolderFiles = async (folderUri) => {
  if (IS_WEB_STUB) {
    const folderName = folderUri?.split('/').pop();
    return DEMO_SONGS.filter(s => s.folder === folderName);
  }
  
  try {
    return await getAudioFilesFromPath(folderUri);
  } catch (error) {
    console.error('Error reading folder files:', error);
    return [];
  }
};

// Общая функция для чтения аудиофайлов
const getAudioFilesFromPath = async (path) => {
  const audioExtensions = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac', '.m4r'];
  const cleanPath = path.replace('file://', '');
  
  try {
    const items = await FileSystem.readDirectoryAsync(cleanPath);
    const files = [];
    
    for (const item of items) {
      const itemPath = `${cleanPath}/${item}`;
      const info = await FileSystem.getInfoAsync(itemPath);
      
      if (!info.isDirectory) {
        const ext = item.substring(item.lastIndexOf('.')).toLowerCase();
        if (audioExtensions.includes(ext)) {
          files.push({
            id: itemPath,
            title: item,
            uri: `file://${itemPath}`,
            folder: cleanPath.split('/').pop(),
            addedAt: Date.now(),
          });
        }
      }
    }
    
    return files;
  } catch (error) {
    console.error('Error reading files:', error);
    return [];
  }
};

// Перемещение файла
export const moveAudioFile = async (sourceUri, destFolderUri) => {
  if (IS_WEB_STUB) {
    const fileName = sourceUri.split('/').pop();
    const destName = destFolderUri.split('/').pop();
    Alert.alert('Демо-режим', `Файл ${fileName} перемещен в ${destName}`);
    return 'demo://moved';
  }
  
  try {
    // Очищаем пути от file://
    const cleanSource = sourceUri.replace('file://', '');
    const cleanDest = destFolderUri.replace('file://', '');
    
    const fileName = cleanSource.split('/').pop();
    const destPath = `${cleanDest}/${fileName}`;
    
    await FileSystem.moveAsync({
      from: cleanSource,
      to: destPath,
    });
    
    return `file://${destPath}`;
  } catch (error) {
    console.error('Move error:', error);
    Alert.alert('Ошибка', 'Не удалось переместить файл');
    return null;
  }
};

// Проверка наличия корзины
export const hasTrashFolder = async () => {
  const rootUri = await getRootFolder();
  if (!rootUri) return false;
  
  try {
    const cleanRoot = rootUri.replace('file://', '');
    const trashPath = `${cleanRoot}/${TRASH_FOLDER_NAME}`;
    const info = await FileSystem.getInfoAsync(trashPath);
    return info.exists && info.isDirectory;
  } catch (error) {
    return false;
  }
};

// Создание папки корзины если её нет
export const ensureTrashFolder = async () => {
  const rootUri = await getRootFolder();
  if (!rootUri) return false;
  
  try {
    const cleanRoot = rootUri.replace('file://', '');
    const trashPath = `${cleanRoot}/${TRASH_FOLDER_NAME}`;
    const info = await FileSystem.getInfoAsync(trashPath);
    
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(trashPath);
    }
    return true;
  } catch (error) {
    console.error('Error creating trash folder:', error);
    return false;
  }
};

// Работа с цветами папок
export const getFolderColor = async (folderName) => {
  try {
    const colors = await AsyncStorage.getItem(FOLDER_COLORS_KEY);
    const colorsMap = colors ? JSON.parse(colors) : {};
    return colorsMap[folderName] || null;
  } catch { return null; }
};

export const setFolderColor = async (folderName, color) => {
  try {
    const colors = await AsyncStorage.getItem(FOLDER_COLORS_KEY);
    const colorsMap = colors ? JSON.parse(colors) : {};
    colorsMap[folderName] = color;
    await AsyncStorage.setItem(FOLDER_COLORS_KEY, JSON.stringify(colorsMap));
    return true;
  } catch { return false; }
};

// Получение всех песен для поиска
export const getAllSongs = async () => {
  if (IS_WEB_STUB) return DEMO_SONGS;
  
  const rootUri = await getRootFolder();
  if (!rootUri) return [];
  
  const allSongs = [];
  const folders = await getPlaylistFolders();
  
  // Добавляем файлы из корня
  const rootFiles = await getRootFiles();
  allSongs.push(...rootFiles);
  
  // Добавляем файлы из каждой папки
  for (const folder of folders) {
    const folderFiles = await getFolderFiles(folder.uri);
    allSongs.push(...folderFiles);
  }
  
  return allSongs;
};