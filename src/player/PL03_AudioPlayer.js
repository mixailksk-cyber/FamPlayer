import TrackPlayer, { Event, Capability, AppKilledPlaybackBehavior } from 'react-native-track-player';

class AudioPlayer {
  constructor() {
    this.initialized = false;
    this.currentSong = null;
    this.isPlaying = false;
    this.onFinishCallback = null;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      await TrackPlayer.setupPlayer({
        maxCacheSize: 1024 * 10,
      });
      
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
      });
      
      this.initialized = true;
      console.log('✅ TrackPlayer initialized');
    } catch (error) {
      console.error('❌ Failed to initialize TrackPlayer:', error);
    }
  }

  async loadSong(song, shouldPlay = true) {
    await this.init();
    
    try {
      await TrackPlayer.reset();
      
      await TrackPlayer.add({
        id: song.id,
        url: song.uri,
        title: song.title,
        artist: song.artist,
        album: song.album,
        artwork: undefined,
        duration: song.duration,
      });
      
      this.currentSong = song;
      
      if (shouldPlay) {
        await TrackPlayer.play();
        this.isPlaying = true;
      }
      
      console.log(`🎵 Loaded: ${song.title}`);
      return true;
    } catch (error) {
      console.error('Error loading song:', error);
      return false;
    }
  }

  async play() {
    if (!this.currentSong) return false;
    try {
      await TrackPlayer.play();
      this.isPlaying = true;
      return true;
    } catch (error) {
      console.error('Error playing:', error);
      return false;
    }
  }

  async pause() {
    if (!this.currentSong) return false;
    try {
      await TrackPlayer.pause();
      this.isPlaying = false;
      return true;
    } catch (error) {
      console.error('Error pausing:', error);
      return false;
    }
  }

  async toggle() {
    return this.isPlaying ? this.pause() : this.play();
  }

  async seekTo(positionMillis) {
    try {
      await TrackPlayer.seekTo(positionMillis);
      return true;
    } catch (error) {
      console.error('Error seeking:', error);
      return false;
    }
  }

  async unload() {
    try {
      await TrackPlayer.reset();
      this.currentSong = null;
      this.isPlaying = false;
      console.log('Player unloaded');
    } catch (error) {
      console.error('Error unloading:', error);
    }
  }

  setOnFinish(callback) {
    this.onFinishCallback = callback;
    TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (data) => {
      if (data.nextTrack === null && this.onFinishCallback) {
        this.onFinishCallback();
      }
    });
  }

  getStatus() {
    return {
      currentSong: this.currentSong,
      isPlaying: this.isPlaying,
      isPaused: !this.isPlaying && this.currentSong !== null,
      isLoaded: this.currentSong !== null,
      positionMillis: 0,
      durationMillis: this.currentSong?.duration ? this.currentSong.duration * 1000 : 0,
    };
  }

  setPlaylist(songs, startIndex = 0) {
    // Для простоты пока не реализуем очередь
  }

  toggleShuffle() {}
  toggleAutoPlay() {}
  async playNext() {}
  async playPrevious() {}
}

export default new AudioPlayer();
