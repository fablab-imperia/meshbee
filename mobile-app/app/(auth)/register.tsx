// FEATURE TEMPORANEAMENTE DISABILITATA - Richiede migrazione da Supabase a FastAPI
// TODO: Implementare registrazione utenti tramite API FastAPI

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#000000' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#8E8E93' : '#6E6E73',
    primary: '#007AFF',
  };

  function goToLogin() {
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.icon, { color: colors.text }]}>🚧</Text>
      <Text style={[styles.title, { color: colors.text }]}>
        Funzionalità in Sviluppo
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        La registrazione sarà disponibile a breve.
      </Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        Stiamo completando la migrazione al nuovo sistema.
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={goToLogin}>
        <Text style={styles.buttonText}>Torna al Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 32,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

/* CODICE ORIGINALE COMMENTATO - Richiede Supabase
 * Il file completo è salvato in register.tsx.backup
 */
