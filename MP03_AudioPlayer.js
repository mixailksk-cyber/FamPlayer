import { Alert } from 'react-native';
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
    this.shuffledPlaylist = [];
    this.currentIndex = -1;
    this.progress = 0;
    this.duration = 0;
  }

  async loadSong(song, shouldPlay = true) {
    if (IS_WEB_STUB) {
      this.currentSong = song;
      this.isPlaying = shouldPlay;
      this.isPaused = !shouldPlay;
      this.duration = song.duration || 180;
      
      if (this.demoInterval) clearTimeout(this.demoInterval);
      this.demoInterval = setTimeout(() => {
        if (this.onFinishCallback) this.onFinishCallback();
      }, 30000);
      return true;
    }

    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: shouldPlay },
        this._onPlaybackStatusUpdate.bind(this)
      );
      
      this.sound = sound;
      this.currentSong = song;
      this.isPlaying = shouldPlay;
      this.isPaused = !shouldPlay;
      
      return true;
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить файл');
      return false;
    }
  }

  _onPlaybackStatusUpdate(status) {
    if (status.isLoaded) {
      this.isPlaying = status.isPlaying;
      this.isPaused = !status.isPlaying && status.isLoaded;
      this.progress = status.positionMillis / (status.durationMillis || 1);
      this.duration = (status.durationMillis || 0) / 1000;
      
      if (status.didJustFinish && this.onFinishCallback) {
        this.onFinishCallback();
      }
    }
  }

  async play() {
    if (!this.sound || !this.currentSong) return false;
    try {
      await this.sound.playAsync();
      this.isPlaying = true;
      this.isPaused = false;
      return true;
    } catch (error) {
      return false;
    }
  }

  async pause() {
    if (!this.sound || !this.currentSong) return false;
    try {
      await this.sound.pauseAsync();
      this.isPlaying = false;
      this.isPaused = true;
      return true;
    } catch (error) {
      return false;
    }
  }

  async toggle() {
    return this.isPlaying ? this.pause() : this.play();
  }

  async unload() {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
    if (this.demoInterval) clearTimeout(this.demoInterval);
    this.currentSong = null;
    this.isPlaying = false;
    this.isPaused = false;
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
      progress: this.progress,
      duration: this.duration,
    };
  }

  setPlaylist(songs, startIndex = 0) {
    this.playlist = songs;
    this.shuffledPlaylist = [...songs];
    this.currentIndex = startIndex;
    if (songs.length > 0) this.currentSong = songs[startIndex];
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
