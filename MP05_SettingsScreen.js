import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from './MP02_FileSystem';
import { Header, EmailFooter } from './MP04_Components';
import { getBrandColor, AUTHOR_EMAIL, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const [loading, setLoading] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const brandColor = getBrandColor(settings);

  // Проверка разрешений при загрузке
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (IS_WEB_STUB) {
      setCheckingPermission(false);
      setHasPermission(true);
      return;
    }

    // Для Android 11+ проверяем специальное разрешение
    if (Platform.OS === 'android' && Platform.Version >= 30) {
      const hasAccess = await FileSystem.checkAllFilesAccess();
      setHasPermission(hasAccess);
    } else {
      // Для старых версий считаем что доступ есть
      setHasPermission(true);
    }
    
    setCheckingPermission(false);
  };

  const handleSelectFolder = async () => {
    if (IS_WEB_STUB) {
      const folderUri = await FileSystem.pickFolder();
      if (folderUri) {
        navigation.replace('Playlists', { rootFolder: folderUri, settings });
      }
      return;
    }

    // Для Android 11+ проверяем разрешение перед выбором папки
    if (Platform.OS === 'android' && Platform.Version >= 30) {
      const hasAccess = await FileSystem.checkAllFilesAccess();
      
      if (!hasAccess) {
        // Показываем инструкцию по включению доступа
        FileSystem.showPermissionInstructions();
        return;
      }
    }

    // Если разрешение есть - выбираем папку
    setLoading(true);
    const folderUri = await FileSystem.pickFolder();
    
    if (folderUri) {
      await FileSystem.ensureTrashFolder();
      navigation.replace('Playlists', { rootFolder: folderUri, settings });
    }
    
    setLoading(false);
  };

  // Экран проверки разрешений
  if (checkingPermission) {
    return (
      <View style={styles.container}>
        <Header title="Настройки" showBack onBack={() => navigation.goBack()} settings={settings} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={styles.permissionText}>Проверка разрешений...</Text>
        </View>
      </View>
    );
  }

  // Экран для Android 11+ без разрешений
  if (!hasPermission && Platform.OS === 'android' && Platform.Version >= 30) {
    return (
      <View style={styles.container}>
        <Header title="Настройки" showBack onBack={() => navigation.goBack()} settings={settings} />
        
        <View style={styles.centerContent}>
          <MaterialIcons name="folder-open" size={64} color={brandColor} style={styles.icon} />
          
          <Text style={styles.title}>Требуется доступ к файлам</Text>
          
          <Text style={styles.instructions}>
            На Android 11 и выше необходимо включить разрешение 
            "Разрешить управление всеми файлами":
          </Text>
          
          <View style={styles.stepsContainer}>
            <Text style={styles.step}>1. Нажмите "Открыть настройки"</Text>
            <Text style={styles.step}>2. Выберите "Разрешения"</Text>
            <Text style={styles.step}>3. Включите "Разрешить управление всеми файлами"</Text>
            <Text style={styles.step}>4. Вернитесь и нажмите "Повторить"</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.settingsButton]} 
              onPress={FileSystem.openAllFilesSettings}
            >
              <Text style={styles.settingsButtonText}>Открыть настройки</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: brandColor }]} 
              onPress={checkPermissions}
            >
              <Text style={styles.retryButtonText}>Повторить</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <EmailFooter email={AUTHOR_EMAIL} />
      </View>
    );
  }

  // Основной экран выбора папки
  return (
    <View style={styles.container}>
      <Header 
        title="Настройки" 
        showBack 
        onBack={() => navigation.goBack()} 
        settings={settings} 
      />
      
      {IS_WEB_STUB && (
        <View style={styles.demoBanner}>
          <MaterialIcons name="info" size={16} color="#333" />
          <Text style={styles.demoText}> {WEB_STUB_MESSAGE}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <MaterialIcons name="folder-open" size={64} color={brandColor} style={styles.icon} />
        
        <Text style={styles.title}>Выберите корневую папку</Text>
        
        <Text style={styles.subtitle}>
          В этой папке должны находиться папки с альбомами или исполнителями
        </Text>
        
        <TouchableOpacity 
          style={[styles.selectButton, { backgroundColor: brandColor }]} 
          onPress={handleSelectFolder} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.selectButtonText}>Выбрать папку</Text>
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
  centerContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 30 
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
  instructions: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  stepsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    width: '100%',
  },
  step: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  selectButton: { 
    paddingHorizontal: 30, 
    paddingVertical: 15, 
    borderRadius: 10, 
    minWidth: 200, 
    alignItems: 'center', 
    elevation: 3 
  },
  selectButtonText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: '600' 
  },
  settingsButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  settingsButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  demoBanner: { 
    backgroundColor: '#FFD700', 
    padding: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  demoText: { 
    color: '#333', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  permissionText: {
    marginTop: 16,
    color: '#666',
    fontSize: 14,
  },
});
