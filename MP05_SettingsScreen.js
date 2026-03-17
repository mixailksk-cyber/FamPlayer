// Замените функцию scanFolder в MP05_SettingsScreen.js на эту:

const scanFolder = async () => {
  if (scanning) {
    addLog('⚠️ Сканирование уже выполняется');
    return;
  }
  
  if (!selectedFolder) {
    Alert.alert('Ошибка', 'Сначала выберите папку');
    return;
  }
  
  addLog(`🔍 Начало сканирования: ${selectedFolder}`);
  setScanning(true);
  
  try {
    // Используем новую функцию из MP02_FileSystem
    const result = await FileSystem.scanFolder(selectedFolder);
    
    addLog(`✅ Найдено: ${result.folders.length} папок, ${result.songs.length} файлов`);
    
    // Сохраняем результаты
    await AsyncStorage.setItem('scanned_folders', JSON.stringify(result.folders));
    await AsyncStorage.setItem('scanned_songs', JSON.stringify(result.songs));
    await AsyncStorage.setItem('scan_timestamp', Date.now().toString());
    
    // Переходим на экран плейлистов
    setTimeout(() => {
      navigation.replace('Playlists', {
        scanTimestamp: Date.now(),
        foldersCount: result.folders.length,
        songsCount: result.songs.length
      });
      addLog('🚀 Переход выполнен');
    }, 300);
    
  } catch (error) {
    addLog(`❌ Ошибка сканирования: ${error.message}`);
    Alert.alert('Ошибка', `Не удалось просканировать папку: ${error.message}`);
  } finally {
    setScanning(false);
  }
};
