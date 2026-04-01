import { Dimensions } from 'react-native';

export const BRAND_COLOR = '#20A0A0';
export const TRASH_COLOR = '#FF6B6B';

export const PLAYLIST_COLORS = ['#20A0A0','#E91E63','#FF9800','#4CAF50','#2196F3','#FF5722','#607D8B','#795548','#3F51B5','#009688'];
export const SONG_COLORS = ['#20A0A0','#E91E63','#FF9800','#4CAF50','#2196F3','#FF5722','#607D8B','#795548','#3F51B5','#009688','#FFC107','#00BCD4'];

export const { width } = Dimensions.get('window');

export const getBrandColor = (settings) => settings?.brandColor || BRAND_COLOR;

export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const APP_FAVORITES_NAME = 'Избранное';
export const TRASH_FOLDER_NAME = 'Корзина';
