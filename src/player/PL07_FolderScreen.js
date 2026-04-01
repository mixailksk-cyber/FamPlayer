import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Header, SongItem } from './PL04_Components';

export default function FolderScreen({ route, navigation }) {
  const { folderName, songs, settings } = route.params;
  
  return (
    <View style={styles.container}>
      <Header 
        title={folderName} 
        showBack 
        onBack={() => navigation.goBack()} 
        settings={settings} 
      />
      
      <FlatList
        data={songs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SongItem 
            item={item} 
            onPress={() => {}} 
            settings={settings} 
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>В этой папке нет треков</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  emptyContainer: { padding: 40, alignItems: 'center' },
});
