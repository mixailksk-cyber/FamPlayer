import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from './MP02_FileSystem';
import { Header, EmailFooter } from './MP04_Components';
import { getBrandColor, AUTHOR_EMAIL, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const [loading, setLoading] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [loadingMusic, setLoadingMusic] = useState(false);
  const brandColor = getBrandColor(settings);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (IS_WEB_STUB) {
      setCheckingPermission(false);
      setHasPermission(true);
      return;
    }

    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      console.log('Permission status:', status);
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setCheckingPermission(false);
    }
  };

  const requestPermission = async () => {
    setLoading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      console.log('Permission requested, status:', status);
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        // После получения разрешений сразу переходим к музыке
        handleGoToMusic();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Ошибка', 'Не удалось запросить разрешения');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToMusic = async () => {
    setLoadingMusic(true);
    
    try {
      // Проверяем разрешения еще раз
      const { status } = await MediaLibrary.getPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нет доступа к музыке');
        setLoadingMusic(false);
        return;
      }

      // Пытаемся получить список песен (просто для проверки)
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 1,
      });
      
      console.log('Found', media.totalCount, 'audio files');
      
      // Переходим к экрану плейлистов
      navigation.replace('Playlists', { 
        rootFolder: 'media://library', 
        settings,
        songsCount: media.totalCount 
      });
      
    } catch (error) {
      console.error('Error accessing music:', error);
      Alert.alert('Ошибка', 'Не удалось получить доступ к музыке');
    } finally {
      setLoadingMusic(false);
    }
  };

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
        <MaterialIcons name="library-music" size={64} color={brandColor} style={styles.icon} />
        
        <Text style={styles.title}>Доступ к музыке</Text>
        
        <Text style={styles.subtitle}>
          Приложению нужен доступ к музыкальным файлам на вашем устройстве
        </Text>
        
        {!hasPermission ? (
          <View style={styles.permissionContainer}>
            <TouchableOpacity 
              style={[styles.permissionButton, { backgroundColor: brandColor }]} 
              onPress={requestPermission} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="perm-media" size={24} color="white" />
                  <Text style={styles.permissionButtonText}>Предоставить доступ</Text>
                </>
              )}
            </TouchableOpacity>
            
            <Text style={styles.hint}>
              Приложение запросит доступ к медиафайлам. 
              Нажмите "Разрешить" в системном диалоге.
            </Text>
          </View>
        ) : (
          <View style={styles.permissionContainer}>
            <TouchableOpacity 
              style={[styles.selectButton, { backgroundColor: brandColor }]} 
              onPress={handleGoToMusic}
              disabled={loadingMusic}
            >
              {loadingMusic ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="playlist-play" size={24} color="white" />
                  <Text style={styles.selectButtonText}>Перейти к музыке</Text>
                </>
              )}
            </TouchableOpacity>
            
            <Text style={styles.successText}>
              ✅ Доступ к музыке предоставлен
            </Text>
          </View>
        )}
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
  permissionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    elevation: 3,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    elevation: 3,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  hint: {
    marginTop: 16,
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  successText: {
    marginTop: 16,
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
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
