import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ItemSelectorProps {
  items: Array<{ id: string; name: string }>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  showAllOption?: boolean;
  showAggregateOption?: boolean;
  allLabel?: string;
  aggregateLabel?: string;
}

export function ItemSelector({
  items,
  selectedId,
  onSelect,
  showAllOption = false,
  showAggregateOption = false,
  allLabel = 'all',
  aggregateLabel = 'Media'
}: ItemSelectorProps) {
  const colorScheme = useColorScheme();
  const activeColor = colorScheme === 'dark' ? '#0A84FF' : '#007AFF';
  const inactiveColor = colorScheme === 'dark' ? '#2C2C2E' : '#E5E5EA';
  const activeTextColor = '#FFFFFF';
  const inactiveTextColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Opzione "Tutte" per vista tabella */}
        {showAllOption && (
          <TouchableOpacity
            style={[
              styles.chip,
              { backgroundColor: selectedId === 'all' ? activeColor : inactiveColor },
            ]}
            onPress={() => onSelect('all')}>
            <ThemedText
              style={[
                styles.chipText,
                { color: selectedId === 'all' ? activeTextColor : inactiveTextColor },
              ]}>
              {allLabel}
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Opzione "Media" per vista aggregata (opzionale) */}
        {showAggregateOption && (
          <TouchableOpacity
            style={[
              styles.chip,
              { backgroundColor: selectedId === null ? activeColor : inactiveColor },
            ]}
            onPress={() => onSelect(null)}>
            <ThemedText
              style={[
                styles.chipText,
                { color: selectedId === null ? activeTextColor : inactiveTextColor },
              ]}>
              {aggregateLabel}
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Singoli item */}
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.chip,
              { backgroundColor: selectedId === item.id ? activeColor : inactiveColor },
            ]}
            onPress={() => onSelect(item.id)}>
            <ThemedText
              style={[
                styles.chipText,
                { color: selectedId === item.id ? activeTextColor : inactiveTextColor },
              ]}>
              {item.name}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
