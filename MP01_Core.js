import { Dimensions, Platform } from 'react-native';

// Новый цвет приложения #008080 (Teal)
export const BRAND_COLOR = '#008080';
export const TRASH_COLOR = '#FF6B6B';

export const PLAYLIST_COLORS = ['#008080','#E91E63','#FF9800','#4CAF50','#2196F3','#FF5722','#607D8B','#795548','#3F51B5','#009688'];
export const SONG_COLORS = ['#008080','#E91E63','#FF9800','#4CAF50','#2196F3','#FF5722','#607D8B','#795548','#3F51B5','#009688','#FFC107','#00BCD4'];
export const TITLE_MAX_LENGTH = 50;
export const PLAYLIST_NAME_MAX_LENGTH = 50;
export const { width } = Dimensions.get('window');

export const getBrandColor = (settings) => settings?.brandColor || BRAND_COLOR;

export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const IS_WEB_STUB = Platform.OS === 'web';
export const WEB_STUB_MESSAGE = 'Демо-режим: для работы с файлами установите на устройство';
export const AUTHOR_EMAIL = 'mixailksk-cyber@example.com';
export const APP_FAVORITES_NAME = 'Избранное';
export const TRASH_FOLDER_NAME = 'Корзина';
