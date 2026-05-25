import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/FastAPIAuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const router = useRouter();

  // Reindirizza al login se non autenticato
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, loading, router]);

  // Mostra loading mentre verifica autenticazione
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </View>
    );
  }

  // Non renderizzare se non autenticato
  if (!user) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
      }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
