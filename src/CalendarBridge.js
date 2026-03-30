import { NativeModules, Platform, PermissionsAndroid, Alert } from 'react-native';

const { CalendarModule } = NativeModules;

export const isCalendarAvailable = () => {
  return Platform.OS === 'android' && CalendarModule !== null;
};

export const checkCalendarPermission = async () => {
  if (Platform.OS !== 'android') return false;
  if (!CalendarModule) return false;
  
  try {
    const hasPermission = await CalendarModule.checkCalendarPermission();
    return hasPermission === true;
  } catch (error) {
    console.error('Error checking calendar permission:', error);
    return false;
  }
};

export const requestCalendarPermission = async () => {
  if (Platform.OS !== 'android') return false;
  
  try {
    if (Platform.Version >= 23) {
      const readGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
        {
          title: 'Доступ к календарю',
          message: 'FamNotes нужно добавить напоминания в календарь',
          buttonNeutral: 'Спросить позже',
          buttonNegative: 'Запретить',
          buttonPositive: 'Разрешить',
        }
      );
      
      if (readGranted === PermissionsAndroid.RESULTS.GRANTED) {
        const writeGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR,
          {
            title: 'Доступ к календарю',
            message: 'FamNotes нужно добавить напоминания в календарь',
            buttonNeutral: 'Спросить позже',
            buttonNegative: 'Запретить',
            buttonPositive: 'Разрешить',
          }
        );
        return writeGranted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting calendar permission:', error);
    return false;
  }
};

export const addEventToCalendar = async (title, description, date) => {
  if (Platform.OS !== 'android' || !CalendarModule) {
    console.log('Calendar module not available');
    return null;
  }
  
  try {
    const startTime = new Date(date).getTime();
    const endTime = startTime + 60 * 60 * 1000;
    
    const result = await CalendarModule.addEvent(title, description, startTime, endTime);
    return result.eventId;
  } catch (error) {
    console.error('Error adding event to calendar:', error);
    if (error.code === 'PERMISSION_DENIED') {
      Alert.alert(
        'Нет доступа к календарю',
        'Разрешите доступ к календарю в настройках приложения',
        [{ text: 'OK' }]
      );
    }
    return null;
  }
};

export const removeEventFromCalendar = async (eventId) => {
  if (Platform.OS !== 'android' || !CalendarModule || !eventId) {
    return false;
  }
  
  try {
    await CalendarModule.removeEvent(eventId);
    return true;
  } catch (error) {
    console.error('Error removing event from calendar:', error);
    return false;
  }
};
