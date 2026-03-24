import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, TextInput, FlatList, Text, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from './BL04_Header';
import NoteItem from './BL09_NoteItem';
import { getBrandColor } from './BL02_Constants';

const SearchScreen = ({ 
  notes, 
  setCurrentScreen, 
  setSelectedNote, 
  setSelectedNoteForAction, 
  setShowNoteDialog, 
  goBack, 
  navigationStack, 
  setNavigationStack, 
  setSearchQuery, 
  searchQuery: initialSearchQuery, 
  settings,
  onLongPressNote,
  onNoteOpen
}) => {
  const [localQuery, setLocalQuery] = useState(initialSearchQuery || '');
  const inputRef = useRef(null);
  const brandColor = getBrandColor(settings || {});

  const searchResults = useMemo(() => {
    if (!notes || !Array.isArray(notes)) return [];
    if (!localQuery || !localQuery.trim()) return [];
    
    const q = localQuery.toLowerCase().trim();
    return notes.filter(note => {
      if (!note) return false;
      const title = note.title || '';
      const content = note.content || '';
      return title.toLowerCase().includes(q) || content.toLowerCase().includes(q);
    });
  }, [localQuery, notes]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setLocalQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 200);
    return () => clearTimeout(focusTimeout);
  }, []);

  const handleChangeText = (text) => {
    setLocalQuery(text);
    if (typeof setSearchQuery === 'function') {
      setSearchQuery(text);
    }
  };

  const handleNotePress = (note) => {
    if (note && typeof onNoteOpen === 'function') {
      onNoteOpen(note);
      if (typeof setNavigationStack === 'function') {
        setNavigationStack(prev => [...(prev || []), 'search']);
      }
      if (typeof setCurrentScreen === 'function') {
        setCurrentScreen('edit');
      }
    } else if (note && typeof setSelectedNote === 'function') {
      setSelectedNote(note);
      if (typeof setNavigationStack === 'function') {
        setNavigationStack(prev => [...(prev || []), 'search']);
      }
      if (typeof setCurrentScreen === 'function') {
        setCurrentScreen('edit');
      }
    }
  };

  const handleLongPress = (note) => {
    if (note && typeof onLongPressNote === 'function') {
      onLongPressNote(note);
    } else if (note && typeof setSelectedNoteForAction === 'function') {
      setSelectedNoteForAction(note);
      if (typeof setShowNoteDialog === 'function') {
        setShowNoteDialog(true);
      }
    }
  };

  const handleBack = () => {
    if (typeof setCurrentScreen === 'function') {
      setCurrentScreen('notes');
    }
    if (typeof setSearchQuery === 'function') {
      setSearchQuery('');
    }
  };

  const renderItem = ({ item }) => (
    <NoteItem 
      item={item} 
      onPress={() => handleNotePress(item)} 
      onLongPress={() => handleLongPress(item)} 
      settings={settings || {}} 
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title="Поиск" 
        rightIcon="close" 
        onRightPress={handleBack} 
        showSearch={false} 
        showPalette={false} 
        brandColor={brandColor}
      />
      
      <View style={{ padding: 16 }}>
        <TextInput 
          ref={inputRef}
          style={{ 
            borderWidth: 1, 
            borderColor: '#E0E0E0', 
            borderRadius: 8, 
            padding: 12, 
            fontSize: 16, 
            backgroundColor: '#F5F5F5',
            color: '#333'
          }} 
          placeholder="Введите текст для поиска" 
          value={localQuery} 
          onChangeText={handleChangeText} 
          returnKeyType="search" 
          clearButtonMode="while-editing" 
          autoCapitalize="none" 
          autoCorrect={false}
        />
      </View>

      {localQuery.trim() !== '' && (
        <FlatList 
          data={searchResults} 
          keyExtractor={item => item?.id || Math.random().toString()} 
          renderItem={renderItem} 
          keyboardShouldPersistTaps="always" 
          keyboardDismissMode="none" 
          ListEmptyComponent={
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Icon name="search-off" size={48} color="#E0E0E0" />
              <Text style={{ color: '#999', marginTop: 16, fontSize: 16 }}>Ничего не найдено</Text>
              <Text style={{ color: '#CCC', marginTop: 8, fontSize: 14 }}>Попробуйте изменить запрос</Text>
            </View>
          } 
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </SafeAreaView>
  );
};

export default SearchScreen;
