import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLOR, getBrandColor, formatDuration, width, PLAYLIST_COLORS, APP_FAVORITES_NAME, TRASH_FOLDER_NAME, TRASH_COLOR } from './MP01_Core';

export const Header = ({ title, rightIcons = [], showBack, onBack, settings }) => {
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
        {rightIcons.map((icon, index) => (
          <TouchableOpacity key={index} onPress={icon.onPress} style={{ marginLeft: 18 }}>
            <MaterialIcons name={icon.name} size={24} color="white" />
          </TouchableOpacity>
        ))}
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

export const PlayerControls = ({ currentSong, isPlaying, onPlayPause, onNext, onPrevious, settings }) => {
  const brandColor = getBrandColor(settings);
  
  if (!currentSong) return null;
  
  return (
    <View style={styles.playerContainer}>
      <Text style={styles.nowPlayingTitle} numberOfLines={1}>
        {currentSong.title}
      </Text>
      
      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={onPrevious} style={styles.controlButton}>
          <MaterialIcons name="skip-previous" size={32} color={brandColor} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onPlayPause} style={[styles.playButton, { backgroundColor: brandColor }]}>
          <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={36} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onNext} style={styles.controlButton}>
          <MaterialIcons name="skip-next" size={32} color={brandColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const SortMenu = ({ visible, onClose, currentSort, onSortChange }) => {
  const sorts = [
    { value: 'addedAt', label: 'Сначала новые', icon: 'schedule' },
    { value: 'title', label: 'По алфавиту', icon: 'sort-by-alpha' },
    { value: 'shuffle', label: 'Случайный порядок', icon: 'shuffle' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.sortMenu}>
          {sorts.map((sort) => (
            <TouchableOpacity
              key={sort.value}
              style={[styles.sortItem, currentSort === sort.value && styles.sortItemActive]}
              onPress={() => {
                onSortChange(sort.value);
                onClose();
              }}
            >
              <MaterialIcons name={sort.icon} size={20} color={currentSort === sort.value ? BRAND_COLOR : '#666'} />
              <Text style={[styles.sortItemText, currentSort === sort.value && styles.sortItemTextActive]}>
                {sort.label}
              </Text>
              {currentSort === sort.value && (
                <MaterialIcons name="check" size={20} color={BRAND_COLOR} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ... остальные компоненты (EmailFooter, ColorPickerDialog, MoveSongDialog) без изменений

const styles = StyleSheet.create({
  // ... существующие стили
  
  playerContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
    paddingBottom: 8,
  },
  nowPlayingTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    marginHorizontal: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  sortMenu: {
    position: 'absolute',
    top: '30%',
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minWidth: 200,
  },
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
  },
  sortItemActive: {
    backgroundColor: '#F0F0F0',
  },
  sortItemText: {
    flex: 1,
    marginLeft: 12,
    color: '#666',
    fontSize: 14,
  },
  sortItemTextActive: {
    color: BRAND_COLOR,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
