import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from './MP02_FileSystem';
import { Header, EmailFooter } from './MP04_Components';
import { getBrandColor, AUTHOR_EMAIL } from './MP01_Core';

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const [loading, setLoading] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const brandColor = getBrandColor(settings);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (Platform.OS === 'android') {
      const hasPermission = await FileSystem.requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Нет доступа',
          'Приложению нужен доступ к файлам для работы',
          [
            { text: 'Выйти', onPress: () => {} },
            { text: 'Повторить', onPress: checkPermission }
          ]
        );
      }
    }
    setCheckingPermission(false);
  };

  const selectFolder = async () => {
    setLoading(true);
    const folderUri = await FileSystem.pickFolder();
    
    if (folderUri) {
      const saved = await FileSystem.saveRootFolder(folderUri);
      if (saved) {
        // Создаем папку корзины если её нет
        await FileSystem.ensureTrashFolder();
        
        Alert.alert('Успех', 'Корневая папка выбрана', [
          { 
            text: 'OK', 
            onPress: () => navigation.replace('Playlists', { rootFolder: folderUri, settings }) 
          }
        ]);
      }
    }
    setLoading(false);
  };

  if (checkingPermission) {
    return (
      <View style={styles.container}>
        <Header title="Настройки" showBack onBack={() => navigation.goBack()} settings={settings} />
        <View style={styles.content}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={styles.permissionText}>Проверка разрешений...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Настройки" 
        showBack 
        onBack={() => navigation.goBack()} 
        settings={settings} 
      />
      
      <View style={styles.content}>
        <MaterialIcons name="folder-open" size={64} color={brandColor} style={styles.icon} />
        
        <Text style={styles.title}>Выберите корневую папку</Text>
        
        <Text style={styles.subtitle}>
          В этой папке должны находиться папки с альбомами или исполнителями
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: brandColor }]} 
          onPress={selectFolder} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Выбрать папку</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <EmailFooter email={AUTHOR_EMAIL} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  icon: { 
    marginBottom: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    textAlign: 'center', 
    color: '#333' 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center', 
    marginBottom: 40, 
    lineHeight: 22 
  },
  button: { 
    paddingHorizontal: 30, 
    paddingVertical: 15, 
    borderRadius: 10, 
    minWidth: 200, 
    alignItems: 'center', 
    elevation: 3 
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: '600' 
  },
  permissionText: {
    marginTop: 16,
    color: '#666',
    fontSize: 14,
  },
});