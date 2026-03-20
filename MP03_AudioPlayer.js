import { Alert, AppState } from 'react-native';
import { IS_WEB_STUB } from './MP01_Core';
import { Audio } from 'expo-av';

class AudioPlayer {
  constructor() {
    this.sound = null;
    this.currentSong = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.onFinishCallback = null;
    this.demoInterval = null;
    this.playlist = [];
    this.shuffleMode = false;
    this.autoPlayMode = true;
    this.shuffledPlaylist = [];
    this.currentIndex = -1;
    this.debug = [];
    this.position = 0;
    this.duration = 0;
    
    this.setupAudioMode();
    
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  setupAudioMode = async () => {
    if (IS_WEB_STUB) return;
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
      });
      console.log('✅ Audio mode configured for background playback');
    } catch (error) {
      console.error('❌ Failed to set audio mode:', error);
    }
  };

  handleAppStateChange = (nextAppState) => {
    console.log(`📱 App state changed to: ${nextAppState}`);
  };

  addDebug(message) {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[AudioPlayer ${timestamp}] ${message}`;
    console.log(log);
    this.debug.push(log);
  }

  async loadSong(song, shouldPlay = true) {
    this.addDebug(`loadSong: ${song?.title}, shouldPlay: ${shouldPlay}`);
    
    if (IS_WEB_STUB) {
      this.addDebug(`Demo mode: loading song ${song.title}`);
      this.currentSong = song;
      this.isPlaying = shouldPlay;
      this.isPaused = !shouldPlay;
      this.duration = song.duration || 180;
      
      if (this.demoInterval) clearTimeout(this.demoInterval);
      this.demoInterval = setInterval(() => {
        if (this.isPlaying) {
          this.position += 1;
          if (this.position >= this.duration) {
            this.position = 0;
            if (this.onFinishCallback) this.onFinishCallback();
          }
        }
      }, 1000);
      
      return true;
    }

    try {
      if (this.sound) {
        this.addDebug('Unloading previous sound');
        await this.sound.unloadAsync();
        this.sound = null;
      }

      this.addDebug(`Creating sound from URI: ${song.uri}`);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { 
          shouldPlay: shouldPlay,
          progressUpdateIntervalMillis: 500,
        },
        this._onPlaybackStatusUpdate.bind(this)
      );
      
      this.sound = sound;
      this.currentSong = song;
      this.isPlaying = shouldPlay;
      this.isPaused = !shouldPlay;
      
      // Получаем длительность
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        this.duration = status.durationMillis / 1000;
      }
      
      this.addDebug(`Sound loaded successfully, shouldPlay: ${shouldPlay}`);
      
      return true;
    } catch (error) {
      this.addDebug(`❌ Error loading sound: ${error.message}`);
      Alert.alert('Ошибка', 'Не удалось загрузить файл');
      return false;
    }
  }

  _onPlaybackStatusUpdate(status) {
    if (status.isLoaded) {
      this.isPlaying = status.isPlaying;
      this.isPaused = !status.isPlaying && status.isLoaded;
      this.position = status.positionMillis / 1000;
      this.duration = status.durationMillis / 1000;
      
      if (status.didJustFinish && this.onFinishCallback) {
        this.addDebug('Song finished, calling callback');
        this.onFinishCallback();
      }
    }
  }

  async play() {
    this.addDebug('play called');
    if (!this.sound || !this.currentSong) {
      this.addDebug('No sound loaded');
      return false;
    }
    
    try {
      await this.sound.playAsync();
      this.isPlaying = true;
      this.isPaused = false;
      this.addDebug('Playback started');
      return true;
    } catch (error) {
      this.addDebug(`Error playing: ${error.message}`);
      return false;
    }
  }

  async pause() {
    this.addDebug('pause called');
    if (!this.sound || !this.currentSong) {
      this.addDebug('No sound loaded');
      return false;
    }
    
    try {
      await this.sound.pauseAsync();
      this.isPlaying = false;
      this.isPaused = true;
      this.addDebug('Playback paused');
      return true;
    } catch (error) {
      this.addDebug(`Error pausing: ${error.message}`);
      return false;
    }
  }

  async toggle() {
    this.addDebug('toggle called');
    return this.isPlaying ? this.pause() : this.play();
  }

  async seekTo(positionMillis) {
    this.addDebug(`seekTo: ${positionMillis}ms`);
    if (!this.sound || !this.currentSong) {
      this.addDebug('No sound loaded');
      return false;
    }
    
    try {
      await this.sound.setPositionAsync(positionMillis);
      this.position = positionMillis / 1000;
      return true;
    } catch (error) {
      this.addDebug(`Error seeking: ${error.message}`);
      return false;
    }
  }

  async unload() {
    this.addDebug('unload called');
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
    if (this.demoInterval) clearInterval(this.demoInterval);
    this.currentSong = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.position = 0;
    this.duration = 0;
    this.addDebug('Unloaded');
  }

  setOnFinish(callback) {
    this.onFinishCallback = callback;
  }

  getStatus() {
    return {
      currentSong: this.currentSong,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      shuffleMode: this.shuffleMode,
      autoPlayMode: this.autoPlayMode,
      positionMillis: this.position * 1000,
      durationMillis: this.duration * 1000,
      isLoaded: true,
    };
  }

  setPlaylist(songs, startIndex = 0) {
    this.addDebug(`setPlaylist: ${songs.length} songs, startIndex: ${startIndex}`);
    this.playlist = songs;
    this.shuffledPlaylist = [...songs];
    this.currentIndex = startIndex;
    if (songs.length > 0) {
      this.currentSong = songs[startIndex];
    }
  }

  toggleShuffle() {
    this.shuffleMode = !this.shuffleMode;
    if (this.shuffleMode) {
      this.shuffledPlaylist = [...this.playlist];
      for (let i = this.shuffledPlaylist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.shuffledPlaylist[i], this.shuffledPlaylist[j]] = [this.shuffledPlaylist[j], this.shuffledPlaylist[i]];
      }
      this.currentIndex = this.shuffledPlaylist.findIndex(s => s.id === this.currentSong?.id);
    } else {
      this.currentIndex = this.playlist.findIndex(s => s.id === this.currentSong?.id);
    }
  }

  toggleAutoPlay() {
    this.autoPlayMode = !this.autoPlayMode;
    this.addDebug(`AutoPlay mode: ${this.autoPlayMode ? 'ON' : 'OFF'}`);
  }

  getNextSong() {
    const playlist = this.shuffleMode ? this.shuffledPlaylist : this.playlist;
    if (playlist.length === 0) return null;
    let nextIndex = this.currentIndex + 1;
    if (nextIndex >= playlist.length) nextIndex = 0;
    return { song: playlist[nextIndex], index: nextIndex };
  }

  getPreviousSong() {
    const playlist = this.shuffleMode ? this.shuffledPlaylist : this.playlist;
    if (playlist.length === 0) return null;
    let prevIndex = this.currentIndex - 1;
    if (prevIndex < 0) prevIndex = playlist.length - 1;
    return { song: playlist[prevIndex], index: prevIndex };
  }

  async playNext() {
    const next = this.getNextSong();
    if (next) {
      this.currentIndex = next.index;
      await this.loadSong(next.song, true);
    }
  }

  async playPrevious() {
    const prev = this.getPreviousSong();
    if (prev) {
      this.currentIndex = prev.index;
      await this.loadSong(prev.song, true);
    }
  }
}

export default new AudioPlayer();
