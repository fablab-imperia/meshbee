import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Slider from '@react-native-community/slider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SensorReading } from '@/types/sensors';
import { AttivitaResponse } from '@/types/api';

interface TimeSeriesChartProps {
  title: string;
  data: SensorReading[];
  unit: string;
  color?: string;
  activities?: AttivitaResponse[];
  onActivityPress?: (activity: AttivitaResponse) => void;
}

export function TimeSeriesChart({ 
  title, 
  data, 
  unit, 
  color = '#4A90E2',
  activities = [],
  onActivityPress
}: TimeSeriesChartProps) {
  const colorScheme = useColorScheme();
  const screenWidth = Dimensions.get('window').width;
  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? '#1C1C1E' : '#F2F2F7';
  
  // Chart dimensions
  const chartWidth = screenWidth - 64;
  const chartHeight = 220;
  const horizontalPadding = 45; // Based on react-native-chart-kit typical layout
  const verticalPadding = 20;

  // Ordina i dati per timestamp
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [data]);

  const [pointsToShow, setPointsToShow] = useState(Math.min(10, sortedData.length || 10));

  // Effettivamente mostriamo gli ultimi 'pointsToShow' punti
  const displayData = useMemo(() => {
    return sortedData.slice(-pointsToShow);
  }, [sortedData, pointsToShow]);

  // Utility per il parsing sicuro delle date
  const parseDate = (dateStr: any) => {
    if (dateStr instanceof Date) return dateStr;
    if (!dateStr) return new Date();
    // Gestisce formati come "2024-05-06 14:30:00" trasformandoli in ISO standard
    const normalized = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // Find activities that fall within the current display range
  const visibleActivities = useMemo(() => {
    if (displayData.length === 0) return [];
    
    // Se c'è un solo punto, mostriamo le attività di quel giorno
    if (displayData.length === 1) {
      const day = parseDate(displayData[0].timestamp).toDateString();
      return activities.filter(act => parseDate(act.timestamp).toDateString() === day);
    }

    const minTime = parseDate(displayData[0].timestamp).getTime();
    const maxTime = parseDate(displayData[displayData.length - 1].timestamp).getTime();
    
    // Aggiungiamo un piccolo margine (1 ora) per includere attività appena fuori dai punti
    const margin = 1000 * 60 * 60; 
    
    return activities.filter(act => {
      const actTime = parseDate(act.timestamp).getTime();
      return actTime >= (minTime - margin) && actTime <= (maxTime + margin);
    });
  }, [activities, displayData]);

  // Calculate X position for an activity
  const getActivityX = (timestamp: string) => {
    if (displayData.length === 0) return -100;
    
    const time = parseDate(timestamp).getTime();
    const minTime = parseDate(displayData[0].timestamp).getTime();
    
    if (displayData.length === 1) return horizontalPadding + (chartWidth - horizontalPadding) / 2;
    
    const maxTime = parseDate(displayData[displayData.length - 1].timestamp).getTime();
    const range = maxTime - minTime;
    
    if (range <= 0) return horizontalPadding;
    
    const progress = (time - minTime) / range;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    const effectiveWidth = chartWidth - horizontalPadding - 20;
    return horizontalPadding + (clampedProgress * effectiveWidth);
  };

  const values = displayData.map(d => d.value);
  const labels = displayData.map((d, i) => {
    // Mostra solo alcune label se ci sono troppi punti per non affollare l'asse X
    if (pointsToShow > 20 && i % Math.ceil(pointsToShow / 5) !== 0 && i !== displayData.length - 1) {
      return '';
    }
    return `${String(d.timestamp.getDate()).padStart(2, '0')}/${String(d.timestamp.getMonth() + 1).padStart(2, '0')} ${String(d.timestamp.getHours()).padStart(2, '0')}:${String(d.timestamp.getMinutes()).padStart(2, '0')}`;
  });

  const chartConfig = {
    backgroundColor: backgroundColor,
    backgroundGradientFrom: backgroundColor,
    backgroundGradientTo: backgroundColor,
    decimalPlaces: 1,
    color: (opacity = 1) => color,
    labelColor: (opacity = 1) => isDark ? '#FFFFFF' : '#000000',
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: pointsToShow > 30 ? '0' : '3', // Nascondi i punti se sono troppi
      strokeWidth: '1',
      stroke: color,
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // solid lines
      stroke: isDark ? '#333' : '#e3e3e3',
    }
  };

  const chartData = {
    labels: labels.length > 0 ? labels : [' '],
    datasets: [
      {
        data: values.length > 0 ? values : [0],
        color: (opacity = 1) => color,
        strokeWidth: 2,
      },
    ],
  };

  const handleRangeChange = (value: number) => {
    setPointsToShow(Math.round(value));
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.currentRange}>
          {pointsToShow} {pointsToShow === 1 ? 'data point' : 'data point'}
        </ThemedText>
      </View>

      <View style={{ position: 'relative' }}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier={pointsToShow < 50}
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={false}
          yAxisSuffix={` ${unit}`}
          verticalLabelRotation={pointsToShow > 10 ? 35 : 0}
          xLabelsOffset={-10}
        />
        
        {/* Activity Icons Overlay */}
        {visibleActivities.map((activity) => {
          const xPos = getActivityX(activity.timestamp);
          if (xPos < 0) return null;
          
          return (
            <TouchableOpacity
              key={activity.id_log}
              style={[styles.activityIcon, { left: xPos - 12 }]}
              onPress={() => onActivityPress?.(activity)}
            >
              <ThemedText style={{ fontSize: 16 }}>📝</ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.controls}>
        <View style={styles.sliderRow}>
          <ThemedText style={styles.sliderLabel}>Zoom:</ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={2}
            maximumValue={Math.max(sortedData.length, 10)}
            value={pointsToShow}
            onValueChange={handleRangeChange}
            minimumTrackTintColor={color}
            maximumTrackTintColor={isDark ? '#38383A' : '#E5E5EA'}
            thumbTintColor={color}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[
              styles.rangeButton, 
              { borderColor: color },
              pointsToShow === 10 && { backgroundColor: color }
            ]}
            onPress={() => setPointsToShow(Math.min(10, sortedData.length))}>
            <ThemedText style={[styles.buttonText, pointsToShow === 10 && styles.activeButtonText]}>10 DP</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.rangeButton, 
              { borderColor: color },
              pointsToShow === 50 && { backgroundColor: color }
            ]}
            onPress={() => setPointsToShow(Math.min(50, sortedData.length))}>
            <ThemedText style={[styles.buttonText, pointsToShow === 50 && styles.activeButtonText]}>50 DP</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.rangeButton, 
              { borderColor: color },
              pointsToShow === sortedData.length && { backgroundColor: color }
            ]}
            onPress={() => setPointsToShow(sortedData.length)}>
            <ThemedText style={[styles.buttonText, pointsToShow === sortedData.length && styles.activeButtonText]}>Tutti</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    fontSize: 16,
    fontWeight: '600',
  },
  currentRange: {
    fontSize: 12,
    opacity: 0.6,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    marginLeft: -16,
    paddingBottom: 20, // Aggiunto spazio extra per le label ruotate
  },
  controls: {
    marginTop: 12,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 12,
    marginRight: 8,
    opacity: 0.7,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  rangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
  activityIcon: {
    position: 'absolute',
    top: 20,
    zIndex: 10,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
});
