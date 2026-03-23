import { useMemo, useCallback } from 'react';

export const useSearchNavigation = ({ notes, searchQuery, currentScreen, navigationStack, setCurrentScreen, setNavigationStack, setSelectedNote, setSearchQuery }) => {
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || currentScreen !== 'search') return [];
    const q = searchQuery.toLowerCase();
    return notes.filter(n => !n.deleted && (
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q))
    ));
  }, [searchQuery, notes, currentScreen]);

  const goToSearch = useCallback(() => {
    setNavigationStack(prev => [...prev, currentScreen]);
    setCurrentScreen('search');
  }, [currentScreen, setNavigationStack, setCurrentScreen]);

  const goBack = useCallback(() => {
    if (currentScreen === 'edit' || currentScreen === 'search') {
      const prevScreen = navigationStack[navigationStack.length - 1] || 'notes';
      setNavigationStack(prev => prev.slice(0, -1));
      setCurrentScreen(prevScreen);
      if (currentScreen === 'search') setSearchQuery('');
    } else {
      setCurrentScreen('notes');
    }
  }, [currentScreen, navigationStack, setNavigationStack, setCurrentScreen, setSearchQuery]);

  const handleNotePress = useCallback((note, fromScreen) => {
    setSelectedNote(note);
    setNavigationStack(prev => [...prev, fromScreen]);
    setCurrentScreen('edit');
  }, [setSelectedNote, setNavigationStack, setCurrentScreen]);

  const handleCloseSearch = useCallback(() => {
    const prevScreen = navigationStack[navigationStack.length - 1] || 'notes';
    setNavigationStack(prev => prev.slice(0, -1));
    setCurrentScreen(prevScreen);
    setSearchQuery('');
  }, [navigationStack, setNavigationStack, setCurrentScreen, setSearchQuery]);

  return { searchResults, goToSearch, goBack, handleNotePress, handleCloseSearch };
};
