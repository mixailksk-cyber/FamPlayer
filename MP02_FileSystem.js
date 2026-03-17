// Добавьте эту функцию в MP02_FileSystem.js
export const saveSongsList = async (songs) => {
  try {
    await AsyncStorage.setItem('songs_list', JSON.stringify(songs));
    console.log('Saved', songs.length, 'songs to storage');
    return true;
  } catch (error) {
    console.error('Error saving songs:', error);
    return false;
  }
};

export const getSongsList = async () => {
  try {
    const songs = await AsyncStorage.getItem('songs_list');
    return songs ? JSON.parse(songs) : [];
  } catch (error) {
    console.error('Error getting songs:', error);
    return [];
  }
};
