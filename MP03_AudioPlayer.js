import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Slider
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLOR, getBrandColor, formatDuration, width, PLAYLIST_COLORS, APP_FAVORITES_NAME, TRASH_FOLDER_NAME, TRASH_COLOR } from './MP01_Core';

// Header компонент с правильными пропсами
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

// SongItem компонент
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

// FolderItem компонент
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

// PlayerControls компонент с ползунком
export const PlayerControls = ({ 
  currentSong, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious,
  progress,
  duration,
  onSeek,
  autoPlayNext,
  onToggleAutoPlay,
  settings 
}) => {
  const brandColor = getBrandColor(settings);
  
  if (!currentSong) return null;
  
  return (
    <View style={styles.playerContainer}>
      <Text style={styles.nowPlayingTitle} numberOfLines={1}>
        {currentSong.title}
      </Text>
      
      <Slider
        style={styles.progressSlider}
        value={progress}
        minimumValue={0}
        maximumValue={1}
        minimumTrackTintColor={brandColor}
        maximumTrackTintColor="#E0E0E0"
        thumbTintColor={brandColor}
        onSlidingComplete={onSeek}
      />
      
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatDuration(progress * duration)}</Text>
        <Text style={styles.timeText}>{formatDuration(duration)}</Text>
      </View>
      
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
      
      <TouchableOpacity onPress={onToggleAutoPlay} style={styles.autoPlayButton}>
        <MaterialIcons 
          name={autoPlayNext ? "repeat" : "repeat-off"} 
          size={20} 
          color={autoPlayNext ? brandColor : "#999"} 
        />
        <Text style={[styles.autoPlayText, { color: autoPlayNext ? brandColor : "#999" }]}>
          {autoPlayNext ? "Автопроигрывание" : "Останов после трека"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Диалог действий с песней
export const SongActionDialog = ({ visible, onClose, onMove, onShare, onDelete, song, settings }) => {
  const brandColor = getBrandColor(settings);
  
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.actionDialog}>
          <Text style={styles.actionDialogTitle}>{song?.title}</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={onMove}>
            <MaterialIcons name="folder" size={24} color={brandColor} />
            <Text style={styles.actionItemText}>Переместить в другую папку</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={onShare}>
            <MaterialIcons name="share" size={24} color={brandColor} />
            <Text style={styles.actionItemText}>Поделиться</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={onDelete}>
            <MaterialIcons name="delete" size={24} color="#FF6B6B" />
            <Text style={[styles.actionItemText, { color: '#FF6B6B' }]}>Удалить</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCancel} onPress={onClose}>
            <Text style={{ color: brandColor }}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// SortMenu компонент
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

// MoveSongDialog компонент
export const MoveSongDialog = ({ visible, folders, onSelect, onCancel, settings, song }) => {
  const brandColor = getBrandColor(settings);
  
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onCancel}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: brandColor }]}>Переместить трек</Text>
          <Text style={styles.songInfoText}>{song?.title}</Text>
          
          <FlatList
            data={folders}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => onSelect(item.uri)}>
                <MaterialIcons name="folder" size={20} color={brandColor} style={styles.modalItemIcon} />
                <Text style={styles.modalItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          
          <TouchableOpacity style={styles.modalCancel} onPress={onCancel}>
            <Text style={{ color: brandColor, fontSize: 16 }}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
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
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
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
  
  playerContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
    paddingBottom: 8,
  },
  nowPlayingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressSlider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
  autoPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  autoPlayText: {
    fontSize: 12,
    marginLeft: 4,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: width - 40,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  songInfoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemIcon: {
    marginRight: 12,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalCancel: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  
  actionDialog: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: width - 40,
  },
  actionDialogTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  actionCancel: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
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
  
  emailContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  emailText: { color: '#999', marginLeft: 8, fontSize: 14 },
  
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 16 },
  colorOption: { width: 44, height: 44, borderRadius: 22, margin: 6 },
  selectedColorOption: { borderWidth: 3, borderColor: '#333' },
});
