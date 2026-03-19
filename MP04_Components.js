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

export const Header = ({ title, rightIcon, onRightPress, showBack, onBack, showSearch, onSearchPress, showShuffle, onShufflePress, shuffleMode, showAutoPlay, onAutoPlayPress, autoPlayMode, showSort, onSortPress, children, settings }) => {
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
        {children}
        {showAutoPlay && (
          <TouchableOpacity onPress={onAutoPlayPress} style={{ marginRight: 18 }}>
            <MaterialIcons 
              name={autoPlayMode ? "repeat" : "repeat-one"} 
              size={24} 
              color={autoPlayMode ? brandColor : "white"} 
            />
          </TouchableOpacity>
        )}
        {showShuffle && (
          <TouchableOpacity onPress={onShufflePress} style={{ marginRight: 18 }}>
            <MaterialIcons name="shuffle" size={24} color={shuffleMode ? brandColor : "white"} />
          </TouchableOpacity>
        )}
        {showSort && (
          <TouchableOpacity onPress={onSortPress} style={{ marginRight: 18 }}>
            <MaterialIcons name="sort" size={24} color="white" />
          </TouchableOpacity>
        )}
        {showSearch && (
          <TouchableOpacity onPress={onSearchPress} style={{ marginRight: 18 }}>
            <MaterialIcons name="search" size={24} color="white" />
          </TouchableOpacity>
        )}
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress}>
            <MaterialIcons name={rightIcon} size={24} color="white" />
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

export const PlayerControls = ({ currentSong, isPlaying, onPlayPause, onNext, onPrevious, settings }) => {
  const brandColor = getBrandColor(settings);
  
  if (!currentSong) return null;
  
  return (
    <View style={styles.playerContainer}>
      <View style={styles.nowPlayingRow}>
        <MaterialIcons name="audiotrack" size={16} color={brandColor} />
        <Text style={styles.nowPlayingTitle} numberOfLines={1}>
          {currentSong.title}
        </Text>
      </View>
      
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
  
  playerContainer: { 
    paddingVertical: 8, 
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
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  nowPlayingTitle: { 
    fontSize: 12, 
    fontWeight: '500', 
    color: '#666', 
    marginLeft: 6,
    flex: 1,
  },
  controlsRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 2,
  },
  controlButton: { 
    padding: 6, 
    marginHorizontal: 16,
  },
  playButton: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
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
