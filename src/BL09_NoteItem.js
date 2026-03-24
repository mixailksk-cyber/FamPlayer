<NoteItem 
  item={item} 
  onPress={() => {
    setSelectedNote(item);
    setCurrentScreen('edit');
  }} 
  onLongPress={() => handleLongPressOnNote(item)}
  settings={settings} 
  showPin={!isInTrash}
  onPinPress={() => handleTogglePin(item.id)}
/>
