import PushNotification from 'react-native-push-notification';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

export const configureNotifications = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
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
      } catch (err) {
        console.warn('Permission request error:', err);
      }
    }
  }
  
  PushNotification.configure({
    onNotification: function (notification) {
      console.log('NOTIFICATION:', notification);
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
  
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'famnotes_channel',
        channelName: 'FamNotes Reminders',
        channelDescription: 'Notifications for note reminders',
        importance: 5,
        vibrate: true,
        playSound: true,
        soundName: 'default',
      },
      (created) => console.log(`Channel created: ${created}`)
    );
  }
};

const getNotificationTexts = (title, content) => {
  let notificationTitle = 'Напоминание';
  let notificationMessage = '';
  
  if (title && title.trim()) {
    if (content && content.trim()) {
      notificationTitle = title.trim();
      notificationMessage = content.trim();
    } else {
      notificationTitle = 'Напоминание';
      notificationMessage = title.trim();
    }
  } else if (content && content.trim()) {
    notificationTitle = 'Напоминание';
    notificationMessage = content.trim();
  } else {
    notificationTitle = 'Напоминание';
    notificationMessage = 'У вас есть заметка, требующая внимания';
  }
  
  return { notificationTitle, notificationMessage };
};

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
    autoCancel: false,
  });
};

export const scheduleReminder = (noteId, title, content, date, useCalendar = false) => {
  const notificationDate = new Date(date);
  const now = new Date();
  
  if (notificationDate <= now) {
    console.log('Cannot schedule reminder in the past');
    return false;
  }
  
  console.log('Scheduling reminder for:', notificationDate);
  
  cancelReminder(noteId);
  
  const delay = notificationDate.getTime() - now.getTime();
  
  const timeoutId = setTimeout(() => {
    sendNotification(noteId, title, content);
    
    const intervalId = setInterval(() => {
      sendNotification(noteId, title, content);
    }, 10 * 60 * 1000);
    
    if (activeTimeouts[noteId]) {
      clearTimeout(activeTimeouts[noteId]);
    }
    activeTimeouts[noteId] = intervalId;
  }, delay);
  
  if (activeTimeouts[noteId]) {
    clearTimeout(activeTimeouts[noteId]);
  }
  activeTimeouts[noteId] = timeoutId;
  
  return true;
};

const activeTimeouts = {};

export const cancelReminder = (noteId) => {
  if (activeTimeouts[noteId]) {
    if (typeof activeTimeouts[noteId] === 'number') {
      clearTimeout(activeTimeouts[noteId]);
      clearInterval(activeTimeouts[noteId]);
    } else {
      clearInterval(activeTimeouts[noteId]);
    }
    delete activeTimeouts[noteId];
  }
  
  PushNotification.cancelLocalNotifications({ noteId: noteId });
};

export const cancelAllReminders = () => {
  Object.keys(activeTimeouts).forEach(noteId => {
    if (activeTimeouts[noteId]) {
      if (typeof activeTimeouts[noteId] === 'number') {
        clearTimeout(activeTimeouts[noteId]);
        clearInterval(activeTimeouts[noteId]);
      } else {
        clearInterval(activeTimeouts[noteId]);
      }
    }
  });
  Object.keys(activeTimeouts).forEach(key => delete activeTimeouts[key]);
  
  PushNotification.cancelAllLocalNotifications();
};
