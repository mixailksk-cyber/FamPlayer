import React from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';

export default function AppContent() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>FamNotes</Text>
      <Text style={styles.subtitle}>Ваши заметки всегда с вами</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => Alert.alert('Привет!', 'Добро пожаловать в FamNotes')}
      >
        <Text style={styles.buttonText}>Нажми меня</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#20A0A0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 32,
  },
  button: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#20A0A0',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
