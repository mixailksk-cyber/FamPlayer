// В функции loadData - убираем calendarEventId из сохранения
if (savedNotes) {
  const parsed = JSON.parse(savedNotes);
  const normalized = parsed.map(n => ({ 
    ...n, 
    color: n.color || NOTE_COLORS[0],
    reminder: n.reminder || null,
    // calendarEventId НЕ сохраняем в бекап, только в памяти приложения
    calendarEventId: null
  }));
  setNotes(normalized);
}

// В функции saveNotes - не сохраняем calendarEventId в AsyncStorage
const saveNotes = useCallback(async (newNotes) => {
  // Находим заметки, у которых было удалено напоминание
  const oldNotes = notes;
  const removedReminders = oldNotes.filter(oldNote => {
    const newNote = newNotes.find(n => n.id === oldNote.id);
    return oldNote.reminder && (!newNote || !newNote.reminder);
  });
  
  // Отменяем напоминания для удаленных
  removedReminders.forEach(note => {
    if (note.reminder && note.reminder > Date.now()) {
      console.log('Cancelling reminder for note:', note.id);
      cancelReminder(note.id);
      // Также удаляем из календаря если есть
      if (note.calendarEventId) {
        removeEventFromCalendar(note.calendarEventId);
      }
    }
  });
  
  // Сохраняем без calendarEventId (это временные данные)
  const normalized = newNotes.map(n => {
    const { calendarEventId, ...rest } = n;
    return { 
      ...rest, 
      color: n.color || NOTE_COLORS[0],
      reminder: n.reminder || null
    };
  });
  
  setNotes(newNotes); // Сохраняем с calendarEventId в памяти
  try {
    await AsyncStorage.setItem('notes', JSON.stringify(normalized));
    updateWidgetData(normalized);
  } catch (e) {
    if (Platform.OS === 'web') Alert.alert('Внимание', 'Данные сохранены только в памяти');
  }
}, [notes]);
