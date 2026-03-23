import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BRAND_COLOR, getBrandColor } from './BL02_Constants';
import Header from './BL04_Header';

const AppContent = () => {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = React.useState('notes');
  const brandColor = BRAND_COLOR;
  
  const NotesScreen = () => (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title="Главная" 
        rightIcon="settings" 
        onRightPress={() => setCurrentScreen('settings')} 
        showBack={false}
        brandColor={brandColor}
      />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#333' }}>Список заметок</Text>
        <Text style={{ marginTop: 16, color: '#666' }}>Здесь будут ваши заметки</Text>
      </View>
      <TouchableOpacity 
        style={{ 
          position: 'absolute', 
          bottom: insets.bottom + 24, 
          right: insets.right + 24, 
          width: 70, 
          height: 70, 
          borderRadius: 35, 
          backgroundColor: brandColor, 
          justifyContent: 'center', 
          alignItems: 'center',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84
        }} 
        onPress={() => console.log('Add note')}>
        <Icon name="add" size={36} color="white" />
      </TouchableOpacity>
    </View>
  );
  
  const SettingsScreen = () => (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title="Настройки" 
        showBack 
        onBack={() => setCurrentScreen('notes')} 
        rightIcon="close" 
        onRightPress={() => setCurrentScreen('notes')}
        brandColor={brandColor}
      />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#333' }}>Настройки приложения</Text>
        <Text style={{ marginTop: 16, color: '#666' }}>Здесь будут настройки</Text>
      </View>
    </View>
  );
  
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {currentScreen === 'notes' ? <NotesScreen /> : <SettingsScreen />}
    </View>
  );
};

export default AppContent;
