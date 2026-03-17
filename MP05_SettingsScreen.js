// В функции handleSelectFolder, перед проверкой hasAccess, добавьте:

const handleSelectFolder = async () => {
  setLoading(true);
  
  // Для Android 11+ сначала запрашиваем специальное разрешение
  if (Platform.OS === 'android' && Platform.Version >= 30) {
    const granted = await FileSystem.requestAllFilesAccess();
    if (!granted) {
      setLoading(false);
      return; // Пользователь еще не включил разрешение
    }
  }
  
  // Затем проверяем обычный доступ
  const hasAccess = await FileSystem.checkAllFilesAccess();
  
  if (!hasAccess) {
    setLoading(false);
    FileSystem.showPermissionInstructions(diagnosis);
    return;
  }

  // ... остальной код выбора папки
};
