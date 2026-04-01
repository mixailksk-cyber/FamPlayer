import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBrandColor, formatDuration } from './PL01_Core';

export const Header = ({ 
  title, 
  showBack, 
  onBack, 
  showSettings,
  onSettingsPress,
  settings 
}) => {
  const insets = useSafeAreaInsets();
  const brandColor = getBrandColor(settings);
  
  return (
    <View style={{ 
      backgroundColor: brandColor, 
      paddingTop: insets.top + 12, 
      paddingBottom: 12, 
      paddingHorizontal: 16,
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        )}
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, flex: 1 }} numberOfLines={1}>
          {title}
        </Text>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {showSettings && (
          <TouchableOpacity onPress={onSettingsPress}>
            <Icon name="settings" size={24} color="white" />
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
        <Icon name={isPlaying ? "equalizer" : "music-note"} size={24} color="white" />
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

export const FolderItem = ({ folder, onPress, settings, songCount }) => {
  const brandColor = getBrandColor(settings);
  
  return (
    <TouchableOpacity style={styles.folderContainer} onPress={onPress}>
      <View style={[styles.folderIcon, { backgroundColor: folder.color || brandColor }]}>
        <Text style={styles.folderCount}>{songCount || 0}</Text>
      </View>
      <Text style={styles.folderName}>{folder.name}</Text>
      <Icon name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
  );
};

export const PlayerControls = ({ currentSong, isPlaying, onPlayPause, onNext, onPrevious, settings }) => {
  const brandColor = getBrandColor(settings);
  const insets = useSafeAreaInsets();
  
  if (!currentSong) return null;
  
  return (
    <View style={[styles.playerContainer, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.nowPlayingRow}>
        <Icon name="audiotrack" size={16} color={brandColor} />
        <Text style={styles.nowPlayingTitle} numberOfLines={1}>
          {currentSong.title}
        </Text>
      </View>
      
      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={onPrevious} style={styles.controlButton}>
          <Icon name="skip-previous" size={28} color={brandColor} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onPlayPause} style={[styles.playButton, { backgroundColor: brandColor }]}>
          <Icon name={isPlaying ? "pause" : "play-arrow"} size={32} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onNext} style={styles.controlButton}>
          <Icon name="skip-next" size={28} color={brandColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  songContainer: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderColor: '#E0E0E0', 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  songIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    marginRight: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  songInfo: { flex: 1 },
  songTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  songMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  songArtist: { color: '#666', fontSize: 14, flex: 1 },
  songDuration: { color: '#999', fontSize: 12, marginLeft: 8 },
  
  folderContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    paddingHorizontal: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  folderIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 8, 
    marginRight: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  folderCount: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  folderName: { fontSize: 16, color: '#333', flex: 1 },
  
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
  },
});
