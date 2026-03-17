// ДОБАВЬТЕ ЭТУ ФУНКЦИЮ в MP02_FileSystem.js

// Запрос специального разрешения "Доступ ко всем файлам" для Android 11+
export const requestAllFilesAccess = async () => {
  log('requestAllFilesAccess called');
  
  if (Platform.OS !== 'android' || Platform.Version < 30) {
    log('Not Android 11+, skipping special permission request');
    return true;
  }
  
  try {
    // Проверяем, есть ли уже разрешение
    const hasAccess = await checkAllFilesAccess();
    if (hasAccess) {
      log('Already has all files access');
      return true;
    }
    
    // Для Android 11+ нужно открыть системные настройки
    log('Opening all files access settings');
    
    Alert.alert(
      '🔐 Требуется специальное разрешение',
      'Для работы с музыкой приложению нужен "Доступ ко всем файлам".\n\n' +
      'Сейчас вы будете перенаправлены в настройки. Включите переключатель для приложения "Musik Player".',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Перейти в настройки', 
          onPress: async () => {
            try {
              // Открываем экран "Доступ ко всем файлам"
              await IntentLauncher.startActivityAsync(
                IntentLauncher.ActivityAction.MANAGE_ALL_FILES_ACCESS_PERMISSION
              );
            } catch (error) {
              log('Error opening settings:', error);
              // Fallback к общим настройкам приложения
              await IntentLauncher.startActivityAsync(
                IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
                { data: 'package:com.mkhailksk.musikplayer' }
              );
            }
          }
        }
      ]
    );
    
    return false;
  } catch (error) {
    log('Error in requestAllFilesAccess:', error);
    return false;
  }
};
