import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from './MP02_FileSystem';
import { Header, EmailFooter } from './MP04_Components';
import { getBrandColor, AUTHOR_EMAIL, IS_WEB_STUB, WEB_STUB_MESSAGE } from './MP01_Core';

export default function SettingsScreen({ navigation, route }) {
  const settings = route?.params?.settings || {};
  const [loading, setLoading] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [errorDetails, setErrorDetails] = useState('');
  const brandColor = getBrandColor(settings);

  // Подробная диагностика при загрузке
  useEffect(() => {
    runFullDiagnosis();
  }, []);

  const runFullDiagnosis = async () => {
    setCheckingPermission(true);
    
    try {
      // Запускаем диагностику
      const diag = await FileSystem.diagnosePermissions();
      setDiagnosis(diag);
      setHasPermission(diag.hasFileAccess);
      
      // Собираем дополнительную информацию
      let errorMsg = '';
      if (!diag.hasFileAccess) {
        errorMsg = '❌ Нет доступа к файлам\n';
        if (diag.isAndroid11Plus) {
          errorMsg += 'На Android 11+ нужно включить "Разрешить управление всеми файлами"\n';
        } else {
          errorMsg += 'Попробуйте запросить разрешения через системный диалог\n';
        }
      } else {
        errorMsg = '✅ Доступ к файлам есть\n';
      }
      
      errorMsg += `\n📱 Устройство: Android ${diag.androidVersion}`;
      setErrorDetails(errorMsg);
      
    } catch (error) {
      setErrorDetails(`Ошибка диагностики: ${error.message}`);
    } finally {
      setCheckingPermission(false);
    }
  };

  const handleSelectFolder = async () => {
    setLoading(true);
    
    // Сначала проверяем доступ
    const hasAccess = await FileSystem.checkAllFilesAccess();
    
    if (!hasAccess) {
      setLoading(false);
      // Показываем подробную диагностику
      FileSystem.showPermissionInstructions(diagnosis);
      return;
    }

    // Если доступ есть - выбираем папку
    const folderUri = await FileSystem.pickFolder();
    
    if (folderUri) {
      await FileSystem.ensureTrashFolder();
      navigation.replace('Playlists', { rootFolder: folderUri, settings });
    }
    
    setLoading(false);
  };

  const handleDiagnoseAgain = () => {
    runFullDiagnosis();
  };

  const handleOpenSettings = () => {
    FileSystem.openAllFilesSettings();
  };

  // Экран проверки разрешений
  if (checkingPermission) {
    return (
      <View style={styles.container}>
        <Header title="Настройки" showBack onBack={() => navigation.goBack()} settings={settings} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={styles.permissionText}>Диагностика доступа...</Text>
        </View>
      </View>
    );
  }

  // Экран с диагностикой и инструкцией
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
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.diagnosticCard}>
          <Text style={styles.diagnosticTitle}>🔍 Диагностика доступа</Text>
          <Text style={styles.diagnosticText}>{errorDetails}</Text>
          
          {diagnosis && (
            <View style={styles.diagnosticDetails}>
              <Text style={styles.detailText}>Платформа: {diagnosis.platform}</Text>
              <Text style={styles.detailText}>Android версия: {diagnosis.androidVersion}</Text>
              <Text style={styles.detailText}>Android 11+: {diagnosis.isAndroid11Plus ? 'Да' : 'Нет'}</Text>
              <Text style={styles.detailText}>Доступ к файлам: {diagnosis.hasFileAccess ? '✅' : '❌'}</Text>
            </View>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.diagnoseButton]} 
              onPress={handleDiagnoseAgain}
            >
              <MaterialIcons name="refresh" size={20} color="#007AFF" />
              <Text style={styles.diagnoseButtonText}>Повторить диагностику</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!hasPermission && (
          <View style={styles.instructionCard}>
            <MaterialIcons name="info" size={32} color={brandColor} style={styles.instructionIcon} />
            <Text style={styles.instructionTitle}>Требуется доступ к файлам</Text>
            
            <View style={styles.stepsContainer}>
              <Text style={styles.step}>1️⃣ Нажмите "Открыть настройки Android"</Text>
              <Text style={styles.step}>2️⃣ Выберите "Разрешения"</Text>
              <Text style={styles.step}>3️⃣ Включите "Разрешить управление всеми файлами"</Text>
              <Text style={styles.step}>4️⃣ Вернитесь и нажмите "Повторить диагностику"</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.settingsButton, { backgroundColor: brandColor }]} 
              onPress={handleOpenSettings}
            >
              <MaterialIcons name="settings" size={24} color="white" />
              <Text style={styles.settingsButtonText}>Открыть настройки Android</Text>
            </TouchableOpacity>
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
            disabled={loading || !hasPermission}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="folder" size={24} color="white" />
                <Text style={styles.selectButtonText}>Выбрать папку</Text>
              </>
            )}
          </TouchableOpacity>
          
          {!hasPermission && (
            <Text style={styles.warningText}>
              ⚠️ Кнопка выбора папки станет доступна после включения разрешений
            </Text>
          )}
        </View>
      </ScrollView>
      
      <EmailFooter email={AUTHOR_EMAIL} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  centerContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  diagnosticCard: {
    backgroundColor: '#F0F8FF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B0E0FF',
  },
  diagnosticTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 12,
  },
  diagnosticText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  diagnosticDetails: {
    backgroundColor: '#E6F3FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#004999',
    marginVertical: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  diagnoseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#E6F3FF',
    borderRadius: 8,
  },
  diagnoseButtonText: {
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  instructionCard: {
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFB066',
  },
  instructionIcon: {
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 16,
  },
  stepsContainer: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  step: {
    fontSize: 14,
    color: '#333',
    marginVertical: 4,
    paddingLeft: 8,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  settingsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: { 
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
    marginBottom: 30, 
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  selectButton: { 
    flexDirection: 'row',
    paddingHorizontal: 30, 
    paddingVertical: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 3,
    opacity: 1,
  },
  selectButtonText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: '600',
    marginLeft: 10,
  },
  warningText: {
    marginTop: 16,
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
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
