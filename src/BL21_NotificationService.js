import PushNotification from 'react-native-push-notification';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

// Хранилище активных интервалов для повторяющихся напоминаний
const activeIntervals = {};

export const configureNotifications = async () => {
  // Запрос разрешения на Android 13+
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) { // Android 13 (API 33) и выше
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Разрешение на уведомления',
            message: 'FamNotes нужно отправлять уведомления о напоминаниях',
            buttonNeutral: 'Спросить позже',
            buttonNegative: 'Запретить',
            buttonPositive: 'Разрешить',
          }
        );
        console.log('Notification permission:', granted);
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Notification permission granted');
        } else {
          console.log('❌ Notification permission denied');
          Alert.alert(
            'Уведомления отключены',
            'Для получения напоминаний включите уведомления в настройках приложения',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        console.warn('Permission request error:', err);
      }
    }
  }
  
  PushNotification.configure({
    onNotification: function (notification) {
      console.log('NOTIFICATION:', notification);
      // Не удаляем уведомление при нажатии
      if (notification.userInteraction) {
        console.log('User tapped notification, noteId:', notification.userInfo?.noteId);
        // Уведомление остается в шторке, ничего не делаем
      }
    },
    onRegister: function (token) {
      console.log('TOKEN:', token);
    },
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },
    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });
  
  // Создаем канал уведомлений (для Android 8+)
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'famnotes_channel',
        channelName: 'FamNotes Reminders',
        channelDescription: 'Notifications for note reminders',
        importance: 5, // HIGH
        vibrate: true,
        playSound: true,
        soundName: 'default',
      },
      (created) => console.log(`Channel created: ${created}`)
    );
  }
};

// Формирование текста уведомления
const getNotificationTexts = (title, content) => {
  let notificationTitle = 'Напоминание';
  let notificationMessage = '';
  
  if (title && title.trim()) {
    if (content && content.trim()) {
      // Есть и заголовок, и текст: верхняя строка - заголовок, нижняя - текст
      notificationTitle = title.trim();
      notificationMessage = content.trim();
    } else {
      // Есть только заголовок: верхняя строка - "Напоминание", нижняя - заголовок
      notificationTitle = 'Напоминание';
      notificationMessage = title.trim();
    }
  } else if (content && content.trim()) {
    // Есть только текст: верхняя строка - "Напоминание", нижняя - текст
    notificationTitle = 'Напоминание';
    notificationMessage = content.trim();
  } else {
    // Нет ни заголовка, ни текста: верхняя строка - "Напоминание", нижняя - стандартный текст
    notificationTitle = 'Напоминание';
    notificationMessage = 'У вас есть заметка, требующая внимания';
  }
  
  return { notificationTitle, notificationMessage };
};

// Отправка уведомления
const sendNotification = (noteId, title, content) => {
  const { notificationTitle, notificationMessage } = getNotificationTexts(title, content);
  
  PushNotification.localNotification({
    channelId: 'famnotes_channel',
    title: notificationTitle,
    message: notificationMessage,
    allowWhileIdle: true,
    userInfo: { noteId: noteId },
    vibrate: true,
    vibration: 300,
    playSound: true,
    soundName: 'default',
    importance: 'high',
    priority: 'high',
    visibility: 'public',
    // Уведомление не удаляется при нажатии
    autoCancel: false,
  });
};

export const scheduleReminder = (noteId, title, content, date) => {
  const notificationDate = new Date(date);
  const now = new Date();
  
  // Проверяем, что дата в будущем
  if (notificationDate <= now) {
    console.log('Cannot schedule reminder in the past');
    return false;
  }
  
  console.log('Scheduling reminder for:', notificationDate);
  
  // Сначала отменяем существующее напоминание для этой заметки
  cancelReminder(noteId);
  
  // Вычисляем задержку до первого уведомления
  const delay = notificationDate.getTime() - now.getTime();
  
  // Запускаем интервал для повторяющихся уведомлений
  activeIntervals[noteId] = setTimeout(() => {
    // Первое уведомление
    sendNotification(noteId, title, content);
    
    // Запускаем интервал для повторения каждые 10 минут
    activeIntervals[noteId] = setInterval(() => {
      sendNotification(noteId, title, content);
    }, 10 * 60 * 1000); // 10 минут
  }, delay);
  
  return true;
};

export const cancelReminder = (noteId) => {
  // Останавливаем интервал для этой заметки
  if (activeIntervals[noteId]) {
    if (typeof activeIntervals[noteId] === 'number') {
      clearTimeout(activeIntervals[noteId]);
    } else {
      clearInterval(activeIntervals[noteId]);
    }
    delete activeIntervals[noteId];
  }
  
  // Отменяем все запланированные уведомления для этой заметки
  PushNotification.cancelLocalNotifications({ noteId: noteId });
};

export const cancelAllReminders = () => {
  // Останавливаем все интервалы
  Object.keys(activeIntervals).forEach(noteId => {
    if (activeIntervals[noteId]) {
      if (typeof activeIntervals[noteId] === 'number') {
        clearTimeout(activeIntervals[noteId]);
      } else {
        clearInterval(activeIntervals[noteId]);
      }
    }
  });
  Object.keys(activeIntervals).forEach(key => delete activeIntervals[key]);
  
  // Отменяем все уведомления
  PushNotification.cancelAllLocalNotifications();
};
