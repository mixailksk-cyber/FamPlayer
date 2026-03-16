import { Alert } from 'react-native';
import { IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';

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
  }

  async loadSong(song, shouldPlay = true) {
    if (IS_WEB_STUB) {
      console.log('Demo: loading song', song.title);
      this.currentSong = song;
      this.isPlaying = shouldPlay;
      this.isPaused = !shouldPlay;
      
      if (this.demoInterval) {
        clearTimeout(this.demoInterval);
      }
      
      this.demoInterval = setTimeout(() => {
        if (this.onFinishCallback) {
          this.onFinishCallback();
        }
      }, 30000);
      
      return true;
    }
    return false;
  }

  async play() {
    if (IS_WEB_STUB) {
      this.isPlaying = true;
      this.isPaused = false;
      return true;
    }
    return false;
  }

  async pause() {
    if (IS_WEB_STUB) {
      this.isPlaying = false;
      this.isPaused = true;
      return true;
    }
    return false;
  }

  async toggle() {
    return this.isPlaying ? this.pause() : this.play();
  }

  async unload() {
    if (IS_WEB_STUB) {
      if (this.demoInterval) {
        clearTimeout(this.demoInterval);
        this.demoInterval = null;
      }
      this.sound = null;
      this.currentSong = null;
      this.isPlaying = false;
      this.isPaused = false;
    }
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
    };
  }

  // Управление плейлистом
  setPlaylist(songs, startIndex = 0) {
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
      // Перемешиваем плейлист
      this.shuffledPlaylist = [...this.playlist];
      for (let i = this.shuffledPlaylist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.shuffledPlaylist[i], this.shuffledPlaylist[j]] = [this.shuffledPlaylist[j], this.shuffledPlaylist[i]];
      }
      // Находим текущую песню в перемешанном списке
      this.currentIndex = this.shuffledPlaylist.findIndex(s => s.id === this.currentSong?.id);
    } else {
      // Возвращаемся к оригинальному порядку
      this.currentIndex = this.playlist.findIndex(s => s.id === this.currentSong?.id);
    }
  }

  getNextSong() {
    const playlist = this.shuffleMode ? this.shuffledPlaylist : this.playlist;
    if (playlist.length === 0) return null;
    
    let nextIndex = this.currentIndex + 1;
    if (nextIndex >= playlist.length) {
      nextIndex = 0;
    }
    return { song: playlist[nextIndex], index: nextIndex };
  }

  getPreviousSong() {
    const playlist = this.shuffleMode ? this.shuffledPlaylist : this.playlist;
    if (playlist.length === 0) return null;
    
    let prevIndex = this.currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = playlist.length - 1;
    }
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