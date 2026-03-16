import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { APP_FAVORITES_NAME, TRASH_FOLDER_NAME, IS_WEB_STUB } from './MP01_Core';

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

// Проверка версии Android
const isAndroid11OrHigher = () => {
  return Platform.OS === 'android' && Platform.Version >= 30;
};

// Проверка наличия разрешения на доступ ко всем файлам
export const checkAllFilesAccess = async () => {
  if (IS_WEB_STUB) return true;
  if (!isAndroid11OrHigher()) return true; // Для старых Android считаем что доступ есть
  
  try {
    // Пытаемся прочитать корневую папку storage
    const testPath = `${FileSystem.documentDirectory}test`;
    await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
    return true; // Если успешно - разрешение есть
  } catch (error) {
    return false; // Если ошибка - разрешения нет
  }
};

// Открытие настроек для включения доступа ко всем файлам
export const openAllFilesSettings = async () => {
  if (!isAndroid11OrHigher()) return;
  
  try {
    // Открываем страницу настроек приложения
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
      { data: 'package:com.mkhailksk.musikplayer' } // замените на ваш package
    );
  } catch (error) {
    console.error('Error opening settings:', error);
    Alert.alert('Ошибка', 'Не удалось открыть настройки');
  }
};

// Инструкция для пользователя
export const showPermissionInstructions = () => {
  Alert.alert(
    'Требуется доступ к файлам',
    'Для работы с музыкой приложению нужен доступ к файлам.\n\n' +
    'На Android 11 и выше необходимо включить "Разрешить управление всеми файлами":\n\n' +
    '1. Нажмите "Открыть настройки"\n' +
    '2. Выберите "Разрешения"\n' +
    '3. Включите "Разрешить управление всеми файлами"\n' +
    '4. Вернитесь в приложение и нажмите "Повторить"',
    [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Открыть настройки', onPress: openAllFilesSettings }
    ]
  );
};

// Сохранение корневой папки
export const saveRootFolder = async (uri) => {
  if (IS_WEB_STUB) {
    console.log('Demo: saveRootFolder', uri);
    return true;
  }
  
  try {
    await AsyncStorage.setItem(ROOT_FOLDER_KEY, uri);
    return true;
  } catch { return false; }
};

// Получение корневой папки
export const getRootFolder = async () => {
  if (IS_WEB_STUB) return DEMO_ROOT;
  
  try {
    return await AsyncStorage.getItem(ROOT_FOLDER_KEY);
  } catch { return null; }
};

// Выбор папки через системный диалог (работает на всех Android)
export const pickFolder = async () => {
  if (IS_WEB_STUB) {
    Alert.alert('Демо-режим', 'Выбор папки работает только на устройстве');
    return DEMO_ROOT;
  }
  
  try {
    // Используем DocumentPicker для выбора любого файла
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: false,
    });
    
    if (result.canceled) return null;
    
    // Получаем URI выбранного файла
    const fileUri = result.assets[0].uri;
    
    // Извлекаем путь к папке (убираем имя файла)
    const folderPath = fileUri.substring(0, fileUri.lastIndexOf('/'));
    
    // Сохраняем выбранную папку
    await saveRootFolder(folderPath);
    
    return folderPath;
  } catch (error) {
    console.error('Error picking folder:', error);
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
  
  return getAudioFilesFromPath(rootUri);
};

// Получение файлов из папки
export const getFolderFiles = async (folderUri) => {
  if (IS_WEB_STUB) {
    const folderName = folderUri?.split('/').pop();
    return DEMO_SONGS.filter(s => s.folder === folderName);
  }
  
  return getAudioFilesFromPath(folderUri);
};

// Вспомогательная функция для получения аудиофайлов
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
  if (IS_WEB_STUB) return true;
  
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

// Создание папки корзины
export const ensureTrashFolder = async () => {
  if (IS_WEB_STUB) return true;
  
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

// Получение цвета папки
export const getFolderColor = async (folderName) => {
  try {
    const colors = await AsyncStorage.getItem(FOLDER_COLORS_KEY);
    const colorsMap = colors ? JSON.parse(colors) : {};
    return colorsMap[folderName] || null;
  } catch { return null; }
};

// Установка цвета папки
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
  
  const rootFiles = await getRootFiles();
  allSongs.push(...rootFiles);
  
  for (const folder of folders) {
    const folderFiles = await getFolderFiles(folder.uri);
    allSongs.push(...folderFiles);
  }
  
  return allSongs;
};
