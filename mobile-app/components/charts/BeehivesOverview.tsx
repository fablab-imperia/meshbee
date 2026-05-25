import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BeehiveSummary } from '@/types/sensors';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface BeehivesTableProps {
  beehives: BeehiveSummary[];
}

export function BeehivesOverview({ beehives }: BeehivesTableProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    border: isDark ? '#38383A' : '#E5E5EA',
    headerBg: isDark ? '#1C1C1E' : '#F2F2F7',
    rowBg: isDark ? '#000000' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#8E8E93' : '#6E6E73',
  };

  if (!beehives || beehives.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={{ textAlign: 'center', padding: 20 }}>
          Nessuna arnia disponibile
        </ThemedText>
      </ThemedView>
    );
  }

  return (
  <ThemedView style={styles.container}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        
        {/* Header */}
        <View style={[styles.row, styles.headerRow, { backgroundColor: colors.headerBg }]}>
          <View style={[styles.cell, styles.colId]}>
            <ThemedText style={styles.headerText}>ID</ThemedText>
          </View>
          <View style={[styles.cell, styles.colName]}>
            <ThemedText style={styles.headerText}>Arnia</ThemedText>
          </View>
          <View style={[styles.cell, styles.colVal]}>
            <ThemedText style={styles.headerText}>Temp (°C)</ThemedText>
          </View>
          <View style={[styles.cell, styles.colVal]}>
            <ThemedText style={styles.headerText}>Peso (kg)</ThemedText>
          </View>
          <View style={[styles.cell, styles.colVal]}>
            <ThemedText style={styles.headerText}>Umidità (%)</ThemedText>
          </View>
        </View>

        {/* Data rows */}
        {beehives.map((b, index) => (
          <View
            key={b.id || `beehive-${index}`}
            style={[
              styles.row,
              {
                backgroundColor: colors.rowBg,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }
            ]}
          >
            <View style={[styles.cell, styles.colId]}>
              <ThemedText style={styles.dataText}>{b.deviceId || "—"}</ThemedText>
            </View>

            <View style={[styles.cell, styles.colName]}>
              <ThemedText style={styles.dataText}>
                {b.name || "Arnia senza nome"}
              </ThemedText>
            </View>

            <View style={[styles.cell, styles.colVal]}>
              <ThemedText style={styles.dataText}>
                {b.lastTemperature?.value?.toFixed(1) ?? "—"}
              </ThemedText>
            </View>

            <View style={[styles.cell, styles.colVal]}>
              <ThemedText style={styles.dataText}>
                {b.lastWeight?.value?.toFixed(1) ?? "—"}
              </ThemedText>
            </View>

            <View style={[styles.cell, styles.colVal]}>
              <ThemedText style={styles.dataText}>
                {b.lastHumidity?.value?.toFixed(0) ?? "—"}
              </ThemedText>
            </View>
          </View>
        ))}

      </View>
    </ScrollView>


  </ThemedView>
);

}

const styles = StyleSheet.create({
  colId: { width: 80 },
colName: { width: 150 },
colVal: { width: 120 },

container: {},
table: {},
row: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 8,
},

cell: {
  paddingHorizontal: 10,
  justifyContent: "center",
},

headerRow: {
  borderBottomWidth: 1,
},

headerText: {
  fontWeight: "bold",
},

dataText: {
  fontSize: 14,
},
});
