import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PlayerApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FamPlayer</Text>
      <Text style={styles.subtitle}>Музыкальный плеер</Text>
      <Text style={styles.info}>В разработке...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#20A0A0',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  info: {
    fontSize: 14,
    color: '#999',
    marginTop: 20,
  },
});
