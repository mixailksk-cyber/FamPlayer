import { useMemo, useCallback } from 'react';
import { BRAND_COLOR } from '../constants';

export const useMemoizedCalculations = ({ notes, folders, currentFolder }) => {
  const sortedNotes = useMemo(() => {
    return [...notes]
      .filter(n => {
        if (currentFolder === 'Корзина') return n.deleted === true;
        return n.folder === currentFolder && !n.deleted;
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
  }, [notes, currentFolder]);

  const getFolderColor = useCallback((folder) => {
    if (folder === 'Главная' || folder === 'Корзина') return BRAND_COLOR;
    if (typeof folder === 'object') return folder.color || BRAND_COLOR;
    const found = folders.find(f => typeof f === 'object' && f.name === folder);
    return found ? found.color : BRAND_COLOR;
  }, [folders]);

  const getFolderName = useCallback((folder) => {
    return typeof folder === 'object' ? folder.name : folder;
  }, []);

  return { sortedNotes, getFolderColor, getFolderName };
};
