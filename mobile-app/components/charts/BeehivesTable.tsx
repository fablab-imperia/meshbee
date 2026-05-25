import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BeehiveData } from '@/types/sensors';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface BeehivesTableProps {
  beehives: BeehiveData[];
}

export function BeehivesTable({ beehives }: BeehivesTableProps) {
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
            <View style={[styles.cell, styles.nameCell]}>
              <ThemedText style={styles.headerText}>Arnia</ThemedText>
            </View>
            <View style={[styles.cell, styles.valueCell, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <ThemedText style={styles.headerText}>Temperatura</ThemedText>
            </View>
            <View style={[styles.cell, styles.valueCell, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <ThemedText style={styles.headerText}>Peso</ThemedText>
            </View>
            <View style={[styles.cell, styles.valueCell, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <ThemedText style={styles.headerText}>Umidità</ThemedText>
            </View>
            <View style={[styles.cell, styles.timeCell, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
              <ThemedText style={styles.headerText}>Aggiornamento</ThemedText>
            </View>
          </View>

          {/* Data Rows */}
          {beehives.map((beehive, index) => {
            const dateString = beehive.lastUpdate 
              ? new Date(beehive.lastUpdate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : '--/--/----';
            const timeString = beehive.lastUpdate 
              ? new Date(beehive.lastUpdate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
              : '--:--';
            
            return (
              <View
                key={beehive.id || `beehive-${index}`}
                style={[
                  styles.row,
                  styles.dataRow,
                  {
                    backgroundColor: colors.rowBg,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  },
                ]}>
                <View style={[styles.cell, styles.nameCell]}>
                  <ThemedText style={styles.nameText}>
                    {beehive.name || 'Arnia senza nome'}
                  </ThemedText>
                  <ThemedText style={[styles.deviceIdText, { color: colors.textSecondary }]}>
                    ID: {beehive.deviceId || '?'}
                  </ThemedText>
                </View>
                <View style={[styles.cell, styles.valueCell, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
                  <ThemedText style={styles.valueText}>
                    {beehive.currentTemperature != null
                      ? beehive.currentTemperature.toFixed(1)
                      : '--'}
                  </ThemedText>
                  <ThemedText style={[styles.unitText, { color: colors.textSecondary }]}>°C</ThemedText>
                </View>
                <View style={[styles.cell, styles.valueCell, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
                  <ThemedText style={styles.valueText}>
                    {beehive.currentWeight != null
                      ? beehive.currentWeight.toFixed(1)
                      : '--'}
                  </ThemedText>
                  <ThemedText style={[styles.unitText, { color: colors.textSecondary }]}>kg</ThemedText>
                </View>
                <View style={[styles.cell, styles.valueCell, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
                  <ThemedText style={styles.valueText}>
                    {beehive.currentHumidity != null
                      ? beehive.currentHumidity.toFixed(0)
                      : '--'}
                  </ThemedText>
                  <ThemedText style={[styles.unitText, { color: colors.textSecondary }]}>%</ThemedText>
                </View>
                <View style={[styles.cell, styles.timeCell, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
                  <ThemedText style={styles.timeText}>{dateString} {timeString}</ThemedText>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

     
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  table: {
    minWidth: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  dataRow: {
    minHeight: 60,
  },
  cell: {
    padding: 12,
    justifyContent: 'center',
  },
  nameCell: {
    width: 160,
    minWidth: 160,
  },
  valueCell: {
    width: 100,
    minWidth: 100,
    alignItems: 'center',
  },
  timeCell: {
    width: 170,
    minWidth: 170,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  deviceIdText: {
    fontSize: 12,
  },
  valueText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  unitText: {
    fontSize: 12,
  },
  legend: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  legendText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
