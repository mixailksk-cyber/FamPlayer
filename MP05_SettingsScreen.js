import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from './MP02_FileSystem';
import { Header, EmailFooter } from './MP04_Components';
import { getBrandColor, AUTHOR_EMAIL, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';

// Система логирования
const Logger = {
  log: (tag, message, data = '') => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] [${tag}] ${message}`, data);
  },
  error: (tag, message, error = '') => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.error(`[${timestamp}] [${tag}] ❌ ${message}`, error);
  },
  success: (tag, message, data = '') => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] [${tag}] ✅ ${message}`, data);
  }
};

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const [loading, setLoading] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [loadingMusic, setLoadingMusic] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  const brandColor = getBrandColor(settings);

  const addDebug = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, { timestamp, message, type }]);
    Logger.log('Settings', message);
  };

  useEffect(() => {
    addDebug('🔧 Компонент SettingsScreen загружен');
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    addDebug('📋 Проверка разрешений...');
    
    if (IS_WEB_STUB) {
      addDebug('🌐 Web режим, пропускаем проверку');
      setCheckingPermission(false);
      setHasPermission(true);
      return;
    }

    try {
      addDebug('📱 Проверка через MediaLibrary.getPermissionsAsync()');
      const { status, canAskAgain, granted } = await MediaLibrary.getPermissionsAsync();
      
      addDebug(`📊 Статус разрешений: status=${status}, canAskAgain=${canAskAgain}, granted=${granted}`);
      
      if (status === 'granted') {
        addDebug('✅ Разрешения уже предоставлены');
        setHasPermission(true);
      } else {
        addDebug(`❌ Разрешения не предоставлены: ${status}`);
        setHasPermission(false);
      }
    } catch (error) {
      addDebug(`🔥 Ошибка при проверке разрешений: ${error.message}`, 'error');
      Logger.error('Settings', 'Error checking permissions', error);
    } finally {
      setCheckingPermission(false);
    }
  };

  const requestPermission = async () => {
    addDebug('🔐 Запрос разрешений через MediaLibrary.requestPermissionsAsync()');
    setLoading(true);
    
    try {
      const { status, canAskAgain, granted } = await MediaLibrary.requestPermissionsAsync();
      
      addDebug(`📊 Результат запроса: status=${status}, canAskAgain=${canAskAgain}, granted=${granted}`);
      
      if (status === 'granted') {
        addDebug('✅ Разрешения успешно получены');
        setHasPermission(true);
        handleGoToMusic();
      } else {
        addDebug(`❌ Пользователь отклонил разрешения: ${status}`);
        setHasPermission(false);
      }
    } catch (error) {
      addDebug(`🔥 Ошибка при запросе разрешений: ${error.message}`, 'error');
      Alert.alert('Ошибка', 'Не удалось запросить разрешения');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToMusic = async () => {
    addDebug('🎵 Нажата кнопка "Перейти к музыке"');
    setLoadingMusic(true);
    
    try {
      addDebug('📋 Проверка разрешений перед переходом...');
      const { status, granted } = await MediaLibrary.getPermissionsAsync();
      
      addDebug(`📊 Статус разрешений: status=${status}, granted=${granted}`);
      
      if (status !== 'granted') {
        addDebug('❌ Нет разрешений, запрашиваем...');
        Alert.alert('Ошибка', 'Нет доступа к музыке');
        setLoadingMusic(false);
        return;
      }

      addDebug('✅ Разрешения есть, загружаем музыку...');
      
      // Получаем список песен
      addDebug('📀 Вызов MediaLibrary.getAssetsAsync() с mediaType=audio');
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 1000,
      });
      
      addDebug(`📊 Найдено ${media.totalCount} аудиофайлов, получено ${media.assets.length} в первой партии`);
      
      if (media.assets.length > 0) {
        addDebug(`🎵 Примеры файлов: ${media.assets.slice(0, 3).map(a => a.filename).join(', ')}`);
      }

      // Сохраняем найденные песни в глобальное состояние или передаем через параметры
      addDebug('💾 Сохраняем список песен в AsyncStorage');
      await FileSystem.saveSongsList(media.assets);
      
      addDebug('🚀 Переход на экран Playlists...');
      
      // Проверяем доступность экрана Playlists
      const routes = navigation.getState()?.routes.map(r => r.name) || [];
      addDebug(`📋 Доступные экраны: ${routes.join(', ')}`);
      
      // Используем navigate вместо replace для начала
      navigation.navigate('Playlists', { 
        rootFolder: 'media://library', 
        settings,
        songsCount: media.totalCount
      });
      
      addDebug('✅ Успешно перешли на Playlists');
      
    } catch (error) {
      addDebug(`🔥 Ошибка при доступе к музыке: ${error.message}`, 'error');
      addDebug(`📋 Stack: ${error.stack}`, 'error');
      Logger.error('Settings', 'Error accessing music', error);
      Alert.alert('Ошибка', `Не удалось получить доступ к музыке: ${error.message}`);
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
      
      <ScrollView style={styles.scrollView}>
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

        {/* Панель отладки */}
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>🔍 Отладочная информация:</Text>
          {debugInfo.map((item, index) => (
            <Text 
              key={index} 
              style={[
                styles.debugLine,
                item.type === 'error' ? styles.debugError : 
                styles.debugInfo
              ]}
            >
              {item.timestamp} - {item.message}
            </Text>
          ))}
        </View>
      </ScrollView>
      
      <EmailFooter email={AUTHOR_EMAIL} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollView: { flex: 1 },
  content: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  icon: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  permissionContainer: { width: '100%', alignItems: 'center' },
  permissionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 10, width: '100%', elevation: 3 },
  permissionButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginLeft: 10 },
  selectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 10, width: '100%', elevation: 3 },
  selectButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginLeft: 10 },
  hint: { marginTop: 16, color: '#999', fontSize: 14, textAlign: 'center' },
  successText: { marginTop: 16, color: '#4CAF50', fontSize: 14, textAlign: 'center' },
  demoBanner: { backgroundColor: '#FFD700', padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  demoText: { color: '#333', fontSize: 12, fontWeight: '600' },
  permissionText: { marginTop: 16, color: '#666', fontSize: 14 },
  debugPanel: { backgroundColor: '#1E1E1E', margin: 16, padding: 12, borderRadius: 8, maxHeight: 300 },
  debugTitle: { color: '#FFA500', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  debugLine: { color: '#0F0', fontSize: 11, fontFamily: 'monospace', marginVertical: 2 },
  debugError: { color: '#FF6B6B' },
  debugInfo: { color: '#0F0' },
});
