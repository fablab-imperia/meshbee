import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface SensorCardProps {
  title: string;
  value: number;
  unit: string;
  icon?: string;
  subtitle?: string;
}

export function SensorCard({ title, value, unit, icon, subtitle }: SensorCardProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7';

  // Determina il numero di decimali in base alla grandezza del numero
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 1;
  const formattedValue = value.toFixed(decimals);

  return (
    <ThemedView style={[styles.card, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{title}</ThemedText>
        {icon && <ThemedText style={styles.icon}>{icon}</ThemedText>}
      </View>
      <View style={styles.valueContainer}>
        <ThemedText style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {formattedValue}
        </ThemedText>
        <ThemedText style={styles.unit} numberOfLines={1}>{unit}</ThemedText>
      </View>
      {subtitle && (
        <ThemedText style={styles.subtitle} numberOfLines={2}>{subtitle}</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginLeft: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  unit: {
    fontSize: 14,
    marginLeft: 4,
    opacity: 0.7,
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
  },
});
