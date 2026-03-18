// Добавьте эту функцию в MP02_FileSystem.js

export const shareFile = async (uri) => {
  if (IS_WEB_STUB) {
    Alert.alert('Демо-режим', 'Шеринг работает только на устройстве');
    return;
  }
  
  try {
    const { Sharing } = require('expo-sharing');
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert('Ошибка', 'Шеринг не поддерживается на этом устройстве');
    }
  } catch (error) {
    console.error('Error sharing file:', error);
    Alert.alert('Ошибка', 'Не удалось поделиться файлом');
  }
};
