import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  PanResponder
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLOR, getBrandColor, formatDuration, width, PLAYLIST_COLORS, APP_FAVORITES_NAME, TRASH_FOLDER_NAME, TRASH_COLOR } from './MP01_Core';
import AudioPlayer from './MP03_AudioPlayer';

export const Header = ({ 
  title, 
  showBack, 
  onBack, 
  showSettings,
  onSettingsPress,
  showSort,
  onSortPress,
  sortMode,
  showAutoPlay,
  onAutoPlayPress,
  autoPlayMode,
  settings 
}) => {
  const insets = useSafeAreaInsets();
  const brandColor = getBrandColor(settings);
  
  return (
    <View style={{ backgroundColor: brandColor, paddingTop: insets.top + 12, paddingBottom: 12, paddingLeft: insets.left + 16, paddingRight: insets.right + 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        )}
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, flex: 1 }} numberOfLines={1}>{title}</Text>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {showAutoPlay && (
          <TouchableOpacity onPress={onAutoPlayPress} style={{ marginRight: 20 }}>
            <MaterialIcons 
              name={autoPlayMode ? "repeat" : "repeat-one"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        )}
        
        {showSort && (
          <TouchableOpacity onPress={onSortPress} style={{ marginRight: 20 }}>
            <MaterialIcons 
              name={
                sortMode === 'addedAt' ? 'new-releases' : 
                sortMode === 'random' ? 'shuffle' : 
                'sort-by-alpha'
              } 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        )}
        
        {showSettings && (
          <TouchableOpacity onPress={onSettingsPress}>
            <MaterialIcons name="settings" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const SongItem = ({ item, onPress, onLongPress, settings, isPlaying }) => {
  const brandColor = getBrandColor(settings);
  return (
    <TouchableOpacity onLongPress={onLongPress} onPress={onPress} style={styles.songContainer}>
      <View style={[styles.songIcon, { backgroundColor: item.color || brandColor }]}>
        {isPlaying ? <MaterialIcons name="equalizer" size={24} color="white" /> : <MaterialIcons name="music-note" size={24} color="white" />}
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.songMeta}>
          <Text style={styles.songArtist} numberOfLines={1}>{item.artist || 'Неизвестный исполнитель'}</Text>
          <Text style={styles.songDuration}>{formatDuration(item.duration)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const FolderItem = ({ folder, onPress, onLongPress, settings, songCount }) => {
  const brandColor = getBrandColor(settings);
  let backgroundColor = folder.name === TRASH_FOLDER_NAME ? TRASH_COLOR : (folder.color || brandColor);
  return (
    <TouchableOpacity style={styles.folderContainer} onPress={onPress} onLongPress={onLongPress}>
      <View style={[styles.folderIcon, { backgroundColor }]}>
        {folder.name === TRASH_FOLDER_NAME ? (
          <MaterialIcons name="delete" size={24} color="white" />
        ) : (
          <Text style={styles.folderCount}>{songCount || 0}</Text>
        )}
      </View>
      <Text style={styles.folderName}>{folder.name}</Text>
      <MaterialIcons name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
  );
};

export const MoveSongDialog = ({ visible, folders, onSelect, onCancel, settings, song, isPlaying }) => {
  const brandColor = getBrandColor(settings);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: brandColor }]}>Переместить трек</Text>
          {isPlaying && (
            <View style={styles.warningContainer}>
              <MaterialIcons name="warning" size={20} color="#FF6B6B" />
              <Text style={styles.warningText}>Остановите воспроизведение</Text>
            </View>
          )}
          <Text style={styles.songInfoText}>{song?.title}</Text>
          <Text style={styles.selectFolderText}>Выберите папку:</Text>
          {folders.length === 0 ? (
            <Text style={styles.emptyText}>Нет папок для перемещения</Text>
          ) : (
            <FlatList
              data={folders}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => !isPlaying && onSelect(item.uri)}>
                  <MaterialIcons name="folder" size={20} color={brandColor} style={styles.modalItemIcon} />
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
          <TouchableOpacity style={styles.modalCancel} onPress={onCancel}>
            <Text style={{ color: brandColor, fontSize: 16 }}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Компонент прогресс-бара
export const ProgressBar = ({ currentTime, duration, onSeek, settings }) => {
  const brandColor = getBrandColor(settings);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const pan = useRef(new Animated.Value(0)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Начало перетаскивания
      },
      onPanResponderMove: (evt, gestureState) => {
        // Вычисляем позицию касания относительно ширины прогресс-бара
        const { locationX } = evt.nativeEvent;
        const newProgress = Math.min(100, Math.max(0, (locationX / (width - 80)) * 100));
        pan.setValue(newProgress);
        
        // Вычисляем новое время
        const newTime = (newProgress / 100) * duration;
        if (onSeek) {
          onSeek(newTime);
        }
      },
      onPanResponderRelease: () => {
        // Завершение перетаскивания
      },
    })
  ).current;

  useEffect(() => {
    // Обновляем позицию при изменении текущего времени
    Animated.timing(pan, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatDuration(currentTime)}</Text>
        <Text style={styles.timeText}>{formatDuration(duration)}</Text>
      </View>
      
      <View style={styles.progressBarContainer} {...panResponder.panHandlers}>
        <View style={[styles.progressBarBackground, { backgroundColor: '#E0E0E0' }]}>
          <Animated.View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: brandColor,
                width: pan.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                })
              }
            ]} 
          />
        </View>
        <Animated.View 
          style={[
            styles.progressHandle,
            {
              backgroundColor: brandColor,
              left: pan.interpolate({
                inputRange: [0, 100],
                outputRange: ['-6px', `${100 - 6}%`],
              })
            }
          ]} 
        />
      </View>
    </View>
  );
};

export const PlayerControls = ({ currentSong, isPlaying, onPlayPause, onNext, onPrevious, settings }) => {
  const brandColor = getBrandColor(settings);
  const insets = useSafeAreaInsets();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await AudioPlayer.getStatus();
      if (status?.isLoaded) {
        setCurrentTime(status.positionMillis / 1000 || 0);
        setDuration(status.durationMillis / 1000 || 0);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleSeek = async (time) => {
    await AudioPlayer.seekTo(time * 1000);
  };
  
  if (!currentSong) return null;
  
  return (
    <View style={[styles.playerContainer, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.nowPlayingRow}>
        <MaterialIcons name="audiotrack" size={16} color={brandColor} />
        <Text style={styles.nowPlayingTitle} numberOfLines={1}>
          {currentSong.title}
        </Text>
      </View>
      
      <ProgressBar 
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        settings={settings}
      />
      
      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={onPrevious} style={styles.controlButton}>
          <MaterialIcons name="skip-previous" size={28} color={brandColor} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onPlayPause} style={[styles.playButton, { backgroundColor: brandColor }]}>
          <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={32} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onNext} style={styles.controlButton}>
          <MaterialIcons name="skip-next" size={28} color={brandColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const EmailFooter = ({ email }) => (
  <View style={styles.emailContainer}>
    <MaterialIcons name="email" size={16} color="#999" />
    <Text style={styles.emailText}>{email}</Text>
  </View>
);

export const ColorPickerDialog = ({ visible, onClose, onSelect, currentColor, settings }) => {
  const brandColor = getBrandColor(settings);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: brandColor }]}>Выберите цвет</Text>
          <View style={styles.colorGrid}>
            {PLAYLIST_COLORS.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.colorOption, { backgroundColor: color }, currentColor === color && styles.selectedColorOption]}
                onPress={() => { onSelect(color); onClose(); }}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
            <Text style={{ color: brandColor }}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const SortMenu = ({ visible, onClose, onSelect, currentSort }) => {
  const sorts = [
    { key: 'title', label: 'По алфавиту', icon: 'sort-by-alpha' },
    { key: 'addedAt', label: 'Сначала новые', icon: 'new-releases' },
    { key: 'random', label: 'Случайно', icon: 'shuffle' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sortMenu}>
          {sorts.map((sort) => (
            <TouchableOpacity
              key={sort.key}
              style={[styles.sortItem, currentSort === sort.key && styles.sortItemActive]}
              onPress={() => {
                onSelect(sort.key);
                onClose();
              }}
            >
              <MaterialIcons 
                name={sort.icon} 
                size={20} 
                color={currentSort === sort.key ? BRAND_COLOR : '#333'} 
              />
              <Text style={[styles.sortItemText, currentSort === sort.key && { color: BRAND_COLOR }]}>
                {sort.label}
              </Text>
              {currentSort === sort.key && (
                <MaterialIcons name="check" size={20} color={BRAND_COLOR} style={styles.sortCheck} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  songContainer: { padding: 12, borderBottomWidth: 1, borderColor: '#E0E0E0', flexDirection: 'row', alignItems: 'center' },
  songIcon: { width: 44, height: 44, borderRadius: 22, marginRight: 16, justifyContent: 'center', alignItems: 'center' },
  songInfo: { flex: 1 },
  songTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  songMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  songArtist: { color: '#666', fontSize: 14, flex: 1 },
  songDuration: { color: '#999', fontSize: 12, marginLeft: 8 },
  
  folderContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  folderIcon: { width: 44, height: 44, borderRadius: 8, marginRight: 16, justifyContent: 'center', alignItems: 'center' },
  folderCount: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  folderName: { fontSize: 16, color: '#333', flex: 1 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 10, padding: 20, width: width - 40, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  warningContainer: { backgroundColor: '#FFE5E5', padding: 10, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  warningText: { color: '#FF6B6B', fontSize: 14 },
  songInfoText: { fontSize: 16, color: '#333', marginBottom: 8 },
  selectFolderText: { fontSize: 14, color: '#666', marginBottom: 8 },
  emptyText: { textAlign: 'center', color: '#999', padding: 20 },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalItemIcon: { marginRight: 12 },
  modalItemText: { fontSize: 16, color: '#333', flex: 1 },
  modalCancel: { marginTop: 16, paddingVertical: 12, alignItems: 'center' },
  
  playerContainer: { 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#E0E0E0', 
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nowPlayingRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  nowPlayingTitle: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#333', 
    marginLeft: 8,
    flex: 1,
  },
  
  // Стили для прогресс-бара
  progressContainer: {
    width: '100%',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#999',
  },
  progressBarContainer: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressHandle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: 9,
    marginLeft: -6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  
  controlsRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 4,
  },
  controlButton: { 
    padding: 8, 
    marginHorizontal: 20,
  },
  playButton: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  emailContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E0E0E0', marginTop: 20 },
  emailText: { color: '#999', marginLeft: 8, fontSize: 14 },
  
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 16 },
  colorOption: { width: 44, height: 44, borderRadius: 22, margin: 6 },
  selectedColorOption: { borderWidth: 3, borderColor: '#333' },

  sortMenu: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    width: width - 80,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sortItemActive: {
    backgroundColor: '#F0F8FF',
  },
  sortItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  sortCheck: {
    marginLeft: 'auto',
  },
});
