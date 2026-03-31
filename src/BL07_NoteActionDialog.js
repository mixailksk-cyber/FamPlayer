import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Platform, Alert, ScrollView, Share } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { width, getBrandColor } from './BL02_Constants';

const NoteActionDialog = ({ 
  visible, 
  onClose, 
  folders, 
  onMove, 
  onDelete, 
  onPermanentDelete, 
  onTogglePin, 
  isPinned, 
  currentFolder, 
  settings,
  isInTrash,
  onSetReminder,
  reminderTime,
  currentNote
}) => {
  const availableFolders = React.useMemo(() => {
    return folders
      .filter(f => {
        const n = typeof f === 'object' ? f.name : f;
        return n !== 'Корзина' && n !== currentFolder;
      })
      .map(f => typeof f === 'object' ? f.name : f);
  }, [folders, currentFolder]);
  
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.9));
  
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
      
      const now = new Date();
      setSelectedDay(now.getDate());
      setSelectedMonth(now.getMonth());
      setSelectedHour(0);
      setSelectedMinute(0);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      setShowDateTimePicker(false);
    }
  }, [visible]);
  
  const brandColor = getBrandColor(settings);
  
  const formatReminderTime = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month} ${hours}:${minutes}`;
  };
  
  const hasActiveReminder = reminderTime && reminderTime > Date.now();
  
  // Функция для отправки заметки в календарь
  const shareToCalendar = async () => {
    if (!currentNote) return;
    
    const title = currentNote.title || 'Напоминание';
    const content = currentNote.content || '';
    
    // Формируем текст для календаря
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    // Форматируем даты для iCalendar
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0];
    };
    
    // Создаем .ics файл для календаря
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FamNotes//RU
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@famnotes
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title.replace(/[\\,;]/g, '')}
DESCRIPTION:${content.replace(/[\\,;]/g, '').substring(0, 500)}
END:VEVENT
END:VCALENDAR`;
    
    // Для Android используем создание файла .ics и его отправку
    if (Platform.OS === 'android') {
      try {
        // Пробуем отправить как текстовый файл с MIME типом календаря
        await Share.share({
          title: `📅 ${title}`,
          message: content || title,
          url: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`,
        });
        Alert.alert('✅ Отправлено', 'Выберите календарь в меню "Поделиться"');
      } catch (error) {
        // Если не получилось, пробуем просто текст
        await Share.share({
          message: `${title}\n\n${content}\n\n---\nСоздано в FamNotes`,
        });
        Alert.alert('ℹ️ Подсказка', 'Если календарь не появился, скопируйте текст и вставьте вручную');
      }
    } else {
      // iOS
      await Share.share({
        message: `${title}\n\n${content}\n\n---\nСоздано в FamNotes`,
      });
    }
  };
  
  // Альтернативный способ - создать напоминание с выбором даты
  const shareWithDate = async () => {
    if (!currentNote) return;
    
    const title = currentNote.title || 'Напоминание';
    const content = currentNote.content || '';
    
    // Создаем текст с датой для быстрого добавления
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateStr = `${tomorrow.getDate().toString().padStart(2, '0')}.${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}.${tomorrow.getFullYear()}`;
    
    await Share.share({
      message: `${title}\n${content}\n\n📅 Добавьте в календарь на ${dateStr} в 09:00\n\nСоздано в FamNotes`,
    });
    Alert.alert('ℹ️ Подсказка', 'Скопируйте текст и создайте событие в календаре вручную');
  };
  
  const getDaysList = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }
    return days;
  };
  
  const getMonthsList = () => {
    return ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  };
  
  const getHoursList = () => {
    const hours = [];
    for (let i = 0; i <= 23; i++) {
      hours.push(i.toString().padStart(2, '0'));
    }
    return hours;
  };
  
  const getMinutesList = () => {
    const minutes = [];
    for (let i = 0; i <= 59; i++) {
      minutes.push(i.toString().padStart(2, '0'));
    }
    return minutes;
  };
  
  const isValidDate = (day, month, year) => {
    const date = new Date(year, month, day);
    return date.getMonth() === month && date.getDate() === day;
  };
  
  const handleSetReminder = () => {
    const now = new Date();
    let year = now.getFullYear();
    let month = selectedMonth;
    let day = selectedDay;
    
    if (month < now.getMonth()) {
      year = now.getFullYear() + 1;
    } else if (month === now.getMonth() && day < now.getDate()) {
      year = now.getFullYear() + 1;
    } else if (month === now.getMonth() && day === now.getDate()) {
      const selectedTime = new Date(year, month, day, selectedHour, selectedMinute);
      if (selectedTime <= now) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        year = tomorrow.getFullYear();
        month = tomorrow.getMonth();
        day = tomorrow.getDate();
      }
    }
    
    if (!isValidDate(day, month, year)) {
      const lastDay = new Date(year, month + 1, 0).getDate();
      day = Math.min(day, lastDay);
    }
    
    const reminderDate = new Date(year, month, day, selectedHour, selectedMinute);
    
    if (reminderDate > now) {
      onSetReminder(reminderDate.getTime());
      setShowDateTimePicker(false);
      onClose();
    } else {
      Alert.alert('Ошибка', 'Выбранная дата и время уже прошли');
    }
  };
  
  const handleDisableReminder = () => {
    onSetReminder(null);
    onClose();
  };
  
  const openDateTimePicker = () => {
    setShowDateTimePicker(true);
  };
  
  if (!visible) return null;
  
  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <Animated.View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: fadeAnim
        }}>
          <Animated.View style={{ 
            backgroundColor: 'white', 
            padding: 20, 
            borderRadius: 10, 
            width: width - 40,
            maxHeight: '85%',
            transform: [{ scale: scaleAnim }]
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: brandColor }}>
              Действия с заметкой
            </Text>
            
            {!isInTrash && (
              <>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <TouchableOpacity 
                    onPress={() => { onTogglePin(); onClose(); }} 
                    style={{ 
                      flex: 1,
                      padding: 12, 
                      alignItems: 'center', 
                      flexDirection: 'row',
                      justifyContent: 'center',
                      backgroundColor: brandColor,
                      borderRadius: 8,
                    }}>
                    <Icon name="push-pin" size={20} color="white" />
                    <Text style={{ fontSize: 14, color: 'white', marginLeft: 6 }}>
                      {isPinned ? "Открепить" : "Закрепить"}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={hasActiveReminder ? handleDisableReminder : openDateTimePicker} 
                    style={{ 
                      flex: 1,
                      padding: 12, 
                      alignItems: 'center', 
                      flexDirection: 'row',
                      justifyContent: 'center',
                      backgroundColor: brandColor,
                      borderRadius: 8,
                    }}>
                    <Icon name="alarm" size={20} color="white" />
                    <Text style={{ fontSize: 14, color: 'white', marginLeft: 6 }}>
                      {hasActiveReminder ? "Отключить" : "Напомнить"}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Кнопка "Поделиться в календарь" */}
                <TouchableOpacity 
                  onPress={shareToCalendar} 
                  style={{ 
                    padding: 12, 
                    alignItems: 'center', 
                    flexDirection: 'row',
                    justifyContent: 'center',
                    backgroundColor: '#4CAF50',
                    borderRadius: 8,
                    marginBottom: 8,
                  }}>
                  <Icon name="event" size={20} color="white" />
                  <Text style={{ fontSize: 14, color: 'white', marginLeft: 6 }}>
                    📅 Добавить в календарь
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={shareWithDate} 
                  style={{ 
                    padding: 8, 
                    alignItems: 'center', 
                    flexDirection: 'row',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                  <Icon name="content-copy" size={16} color={brandColor} />
                  <Text style={{ fontSize: 12, color: brandColor, marginLeft: 4 }}>
                    Или скопировать текст с датой
                  </Text>
                </TouchableOpacity>
              </>
            )}
            
            {hasActiveReminder && !isInTrash && (
              <View style={{ 
                padding: 8, 
                alignItems: 'center',
                marginBottom: 8,
                backgroundColor: '#F5F5F5',
                borderRadius: 8
              }}>
                <Text style={{ fontSize: 12, color: brandColor }}>
                  Напоминание установлено на {formatReminderTime(reminderTime)}
                </Text>
              </View>
            )}
            
            {availableFolders.length > 0 && (
              <>
                <Text style={{ marginBottom: 8, color: '#666', marginTop: 8 }}>Переместить в папку:</Text>
                <ScrollView style={{ maxHeight: 200 }}>
                  {availableFolders.map((n, i) => (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => { onMove(n); onClose(); }} 
                      style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name="folder" size={20} color="#666" style={{ marginRight: 12 }} />
                      <Text style={{ fontSize: 16, color: '#333' }}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            
            {!isInTrash && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <TouchableOpacity 
                  onPress={() => { onPermanentDelete(); onClose(); }} 
                  style={{ 
                    flex: 1,
                    padding: 12, 
                    backgroundColor: '#FF4444', 
                    borderRadius: 8, 
                    alignItems: 'center', 
                    flexDirection: 'row', 
                    justifyContent: 'center' }}>
                  <Icon name="delete-forever" size={20} color="white" style={{ marginRight: 6 }} />
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Безвозвратно</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => { onDelete(); onClose(); }} 
                  style={{ 
                    flex: 1,
                    padding: 12, 
                    backgroundColor: '#F57C00', 
                    borderRadius: 8, 
                    alignItems: 'center', 
                    flexDirection: 'row', 
                    justifyContent: 'center' }}>
                  <Icon name="delete" size={20} color="white" style={{ marginRight: 6 }} />
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>В корзину</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {isInTrash && (
              <TouchableOpacity 
                onPress={() => { onPermanentDelete(); onClose(); }} 
                style={{ marginTop: 16, padding: 12, backgroundColor: '#FF4444', borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                <Icon name="delete-forever" size={24} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Удалить безвозвратно</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={onClose} style={{ marginTop: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ color: brandColor, fontSize: 16 }}>Отмена</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
      
      {/* Модальное окно выбора даты и времени */}
      <Modal visible={showDateTimePicker} transparent animationType="fade" onRequestClose={() => setShowDateTimePicker(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ 
            backgroundColor: 'white', 
            padding: 20, 
            borderRadius: 8, 
            width: width - 40,
            borderWidth: 1,
            borderColor: '#E0E0E0',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: brandColor }}>
              Выберите дату и время
            </Text>
            
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 8, color: '#666' }}>День и месяц:</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <ScrollView style={{ height: 120, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, backgroundColor: 'white' }}>
                    {getDaysList().map(day => (
                      <TouchableOpacity 
                        key={day}
                        onPress={() => setSelectedDay(day)}
                        style={{ padding: 8, alignItems: 'center', backgroundColor: selectedDay === day ? brandColor : 'white' }}>
                        <Text style={{ color: selectedDay === day ? 'white' : '#333', fontWeight: selectedDay === day ? 'bold' : 'normal' }}>{day}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={{ flex: 1 }}>
                  <ScrollView style={{ height: 120, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, backgroundColor: 'white' }}>
                    {getMonthsList().map((month, index) => (
                      <TouchableOpacity 
                        key={index}
                        onPress={() => setSelectedMonth(index)}
                        style={{ padding: 8, alignItems: 'center', backgroundColor: selectedMonth === index ? brandColor : 'white' }}>
                        <Text style={{ color: selectedMonth === index ? 'white' : '#333', fontWeight: selectedMonth === index ? 'bold' : 'normal' }}>{month}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
            
            <View style={{ marginBottom: 20 }}>
              <Text style={{ marginBottom: 8, color: '#666' }}>Время:</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <ScrollView style={{ height: 120, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, backgroundColor: 'white' }}>
                    {getHoursList().map(hour => (
                      <TouchableOpacity 
                        key={hour}
                        onPress={() => setSelectedHour(parseInt(hour))}
                        style={{ padding: 8, alignItems: 'center', backgroundColor: selectedHour === parseInt(hour) ? brandColor : 'white' }}>
                        <Text style={{ color: selectedHour === parseInt(hour) ? 'white' : '#333', fontWeight: selectedHour === parseInt(hour) ? 'bold' : 'normal' }}>{hour}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={{ flex: 1 }}>
                  <ScrollView style={{ height: 120, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, backgroundColor: 'white' }}>
                    {getMinutesList().map(minute => (
                      <TouchableOpacity 
                        key={minute}
                        onPress={() => setSelectedMinute(parseInt(minute))}
                        style={{ padding: 8, alignItems: 'center', backgroundColor: selectedMinute === parseInt(minute) ? brandColor : 'white' }}>
                        <Text style={{ color: selectedMinute === parseInt(minute) ? 'white' : '#333', fontWeight: selectedMinute === parseInt(minute) ? 'bold' : 'normal' }}>{minute}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setShowDateTimePicker(false)} style={{ padding: 12 }}>
                <Text style={{ color: '#999', fontSize: 16 }}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSetReminder} style={{ padding: 12 }}>
                <Text style={{ color: brandColor, fontWeight: 'bold', fontSize: 16 }}>Установить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default NoteActionDialog;
