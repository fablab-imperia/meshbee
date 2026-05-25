import { BeehivesTable } from '@/components/charts/BeehivesTable';
import { ItemSelector } from '@/components/charts/ItemSelector';
import { SensorCard } from '@/components/charts/SensorCard';
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { 
  loadBeehivesData, 
  loadBeehiveActivities, 
  createBeehiveActivity, 
  updateBeehiveActivity, 
  deleteBeehiveActivity 
} from '@/services/fastapi-beehive-service';
import { BeehiveData } from '@/types/sensors';
import { AttivitaResponse } from '@/types/api';
import { useAuth } from '@/contexts/FastAPIAuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import { 
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View, 
  TouchableOpacity, Platform, Alert, Modal, TextInput 
} from 'react-native';

export default function BeehivesScreen() {
  const [beehives, setBeehives] = useState<BeehiveData[]>([]);
  const [activities, setActivities] = useState<Record<string, AttivitaResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBeehiveId, setSelectedBeehiveId] = useState<string | null>('all');
  const colorScheme = useColorScheme();

  // Activity Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState<AttivitaResponse | null>(null);
  const [activityText, setActivityText] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBeehiveId && selectedBeehiveId !== 'all') {
      loadActivitiesForArnia(selectedBeehiveId);
    } else if (selectedBeehiveId === 'all') {
      beehives.forEach(b => loadActivitiesForArnia(b.id));
    }
  }, [selectedBeehiveId, beehives]);

  const loadActivitiesForArnia = async (id: string) => {
    const result = await loadBeehiveActivities(id);
    if (result.success && result.data) {
      setActivities(prev => ({ ...prev, [id]: result.data! }));
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loadBeehivesData();

      if (result.success && result.data) {
        setBeehives(result.data);
        if (result.data.length > 0 && !selectedBeehiveId) {
          setSelectedBeehiveId('all');
        }
      } else {
        if (result.error?.toLowerCase().includes('unauthorized') || 
            result.error?.toLowerCase().includes('token') ||
            result.error?.toLowerCase().includes('autenticazione')) {
          handleLogoutAction();
          return;
        }
        setError(result.error || 'Errore nel caricamento dei dati');
      }
    } catch (err) {
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (selectedBeehiveId && selectedBeehiveId !== 'all') {
      await loadActivitiesForArnia(selectedBeehiveId);
    } else if (selectedBeehiveId === 'all') {
      await Promise.all(beehives.map(b => loadActivitiesForArnia(b.id)));
    }
    setRefreshing(false);
  };

  const handleLogoutAction = async () => {
    try {
      await signOut();
    } catch (err) {
      router.replace('/(auth)/login');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Sei sicuro di voler uscire?');
      if (confirmed) handleLogoutAction();
    } else {
      Alert.alert('Logout', 'Sei sicuro di voler uscire?', [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: handleLogoutAction },
      ]);
    }
  };

  const handleOpenAddActivity = () => {
    if (selectedBeehiveId === 'all') {
      Alert.alert('Nota', 'Seleziona un\'arnia specifica per aggiungere una nota.');
      return;
    }
    setEditingActivity(null);
    setActivityText('');
    setActivityDate(new Date().toISOString().slice(0, 16));
    setModalVisible(true);
  };

  const handleEditActivity = (activity: AttivitaResponse) => {
    setEditingActivity(activity);
    setActivityText(activity.descrizione || '');
    setActivityDate(new Date(activity.timestamp).toISOString().slice(0, 16));
    setModalVisible(true);
  };

  const handleSubmitActivity = async () => {
    setModalError(null);
    
    if (!activityText.trim()) {
      const msg = 'Inserisci il testo della nota.';
      setModalError(msg);
      if (Platform.OS === 'web') alert(msg);
      return;
    }
    
    if (!selectedBeehiveId || selectedBeehiveId === 'all') return;

    setIsSubmitting(true);
    try {
      console.log('💾 Tentativo di salvataggio nota:', { activityDate, activityText, arniaId: selectedBeehiveId });
      
      const dateParsed = new Date(activityDate.replace(' ', 'T'));
      if (isNaN(dateParsed.getTime())) {
        throw new Error('Formato data non valido. Usa YYYY-MM-DD HH:MM');
      }
      
      const timestamp = dateParsed.toISOString();
      let result;
      
      if (editingActivity) {
        result = await updateBeehiveActivity(selectedBeehiveId, editingActivity.id_log, {
          descrizione: activityText,
          timestamp: timestamp,
          tipo_attivita: 'Nota manuale'
        });
      } else {
        result = await createBeehiveActivity(selectedBeehiveId, {
          descrizione: activityText,
          timestamp: timestamp,
          tipo_attivita: 'Nota manuale'
        });
      }
      
      if (result.success) {
        setModalVisible(false);
        setActivityText('');
        setEditingActivity(null);
        await loadActivitiesForArnia(selectedBeehiveId);
        if (Platform.OS === 'web') alert('Nota salvata!');
      } else {
        const errorMsg = result.error || 'Errore durante il salvataggio.';
        setModalError(errorMsg);
        if (Platform.OS === 'web') alert('Errore: ' + errorMsg);
        else Alert.alert('Errore', errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Errore imprevisto.';
      setModalError(errorMsg);
      if (Platform.OS === 'web') alert('Errore: ' + errorMsg);
      else Alert.alert('Errore', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!editingActivity || !selectedBeehiveId || selectedBeehiveId === 'all') return;
    
    const deleteAction = async () => {
      setIsSubmitting(true);
      setModalError(null);
      const result = await deleteBeehiveActivity(selectedBeehiveId, editingActivity.id_log);
      if (result.success) {
        setModalVisible(false);
        loadActivitiesForArnia(selectedBeehiveId);
      } else {
        const errorMsg = result.error || 'Errore durante l\'eliminazione.';
        setModalError(errorMsg);
        if (Platform.OS === 'web') alert('Errore: ' + errorMsg);
        else Alert.alert('Errore', errorMsg);
      }
      setIsSubmitting(false);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Sei sicuro di voler eliminare questa nota?')) {
        deleteAction();
      }
    } else {
      Alert.alert('Elimina Nota', 'Sei sicuro di voler eliminare questa nota?', [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: deleteAction }
      ]);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.loadingText}>Caricamento dati...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
          <TouchableOpacity onPress={loadData} style={[styles.retryButton, { marginTop: 24 }]}>
            <ThemedText style={styles.retryButtonText}>Riprova</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (beehives.length === 0) {
    return (
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <ThemedView style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <ThemedText type="title" style={styles.title}>🐝 BeeHive IoT</ThemedText>
              <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}><ThemedText style={styles.logoutText}>Logout</ThemedText></TouchableOpacity>
          </View>
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyTitle}>Nessuna arnia configurata</ThemedText>
            <ThemedText style={styles.emptyHint}>Contatta l&apos;amministratore per configurare le tue arnie</ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    );
  }

  const selectorItems = beehives.map(b => ({ id: b.id, name: b.name }));
  const currentArniaId = selectedBeehiveId === 'all' ? null : selectedBeehiveId;
  const currentBeehive = beehives.find(b => b.id === currentArniaId);
  const currentActivities = currentArniaId ? activities[currentArniaId] || [] : [];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <ThemedView style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <ThemedText type="title" style={styles.title}>🐝 Monitoraggio Arnie</ThemedText>
              <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}><ThemedText style={styles.logoutText}>Logout</ThemedText></TouchableOpacity>
          </View>
          <ThemedText style={styles.subtitle}>{beehives.length} {beehives.length === 1 ? 'arnia attiva' : 'arnie attive'}</ThemedText>
        </ThemedView>

        <ItemSelector items={selectorItems} selectedId={selectedBeehiveId} onSelect={setSelectedBeehiveId} showAllOption={true} allLabel="Tutte" />

        {selectedBeehiveId === 'all' ? (
          <ThemedView style={styles.dataSection}><BeehivesTable beehives={beehives} /></ThemedView>
        ) : currentBeehive ? (
          <ThemedView style={styles.dataSection}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="subtitle" style={styles.sectionName}>{currentBeehive.name}</ThemedText>
              {currentBeehive.lastUpdate && (
                <ThemedText style={styles.lastUpdateText}>
                  Ultimo dato: {new Date(currentBeehive.lastUpdate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(currentBeehive.lastUpdate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
              )}
            </View>

            <TouchableOpacity style={styles.addNoteButton} onPress={handleOpenAddActivity}>
              <ThemedText style={styles.addNoteButtonText}>+ Aggiungi Nota Manuale</ThemedText>
            </TouchableOpacity>

            <View style={styles.cardRow}>
              <View style={styles.cardThird}><SensorCard title="Temperatura" value={currentBeehive.currentTemperature} unit="°C" icon="🌡️" /></View>
              <View style={styles.cardThird}><SensorCard title="Peso" value={currentBeehive.currentWeight} unit="kg" icon="⚖️" /></View>
              <View style={styles.cardThird}><SensorCard title="Umidità" value={currentBeehive.currentHumidity} unit="%" icon="💧" /></View>
            </View>

            <TimeSeriesChart title="Andamento Temperatura" data={currentBeehive.temperature} unit="°C" color="#FF3B30" activities={currentActivities} onActivityPress={handleEditActivity} />
            <TimeSeriesChart title="Andamento Peso" data={currentBeehive.weight} unit="kg" color="#FF9500" activities={currentActivities} onActivityPress={handleEditActivity} />
            <TimeSeriesChart title="Andamento Umidità" data={currentBeehive.humidity} unit="%" color="#007AFF" activities={currentActivities} onActivityPress={handleEditActivity} />
          </ThemedView>
        ) : null}
      </ScrollView>

      {/* Note Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>{editingActivity ? 'Modifica Nota' : 'Nuova Nota'}</ThemedText>
            
            {modalError && (
              <View style={styles.errorContainer}>
                <ThemedText style={styles.modalErrorText}>⚠️ {modalError}</ThemedText>
              </View>
            )}
            
            <ThemedText style={styles.inputLabel}>Data e Ora (YYYY-MM-DD HH:MM)</ThemedText>
            <TextInput style={[styles.input, { color: colorScheme === 'dark' ? '#FFF' : '#000' }]} value={activityDate} onChangeText={setActivityDate} placeholder="2024-05-06 14:30" placeholderTextColor="#999" />

            <ThemedText style={styles.inputLabel}>Nota / Attività</ThemedText>
            <TextInput style={[styles.input, styles.textArea, { color: colorScheme === 'dark' ? '#FFF' : '#000' }]} value={activityText} onChangeText={setActivityText} placeholder="Esempio: Aggiunto melario" placeholderTextColor="#999" multiline numberOfLines={4} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)} disabled={isSubmitting}>
                <ThemedText style={styles.modalButtonText}>Annulla</ThemedText>
              </TouchableOpacity>
              
              {editingActivity && (
                <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={handleDeleteActivity} disabled={isSubmitting}>
                  <ThemedText style={styles.modalButtonText}>Elimina</ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.modalButton, styles.submitButton]} onPress={handleSubmitActivity} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.modalButtonText}>Salva</ThemedText>}
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 16, fontSize: 16, opacity: 0.6 },
  errorText: { fontSize: 18, fontWeight: '600', textAlign: 'center', color: '#FF3B30' },
  retryButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600' },
  header: { padding: 20, paddingTop: 60 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold' },
  userEmail: { fontSize: 14, opacity: 0.6 },
  logoutButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FF3B30' },
  logoutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  subtitle: { fontSize: 14, opacity: 0.6 },
  emptyContainer: { marginTop: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  emptyHint: { fontSize: 14, opacity: 0.6, textAlign: 'center' },
  dataSection: { padding: 20, paddingTop: 0 },
  sectionName: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  lastUpdateText: { fontSize: 12, opacity: 0.5 },
  addNoteButton: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  addNoteButtonText: { color: '#FFF', fontWeight: 'bold' },
  cardRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  cardThird: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { marginBottom: 20, textAlign: 'center' },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  modalErrorText: {
    color: '#FF3B30',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, opacity: 0.8 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#FFF', fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#8E8E93' },
  submitButton: { backgroundColor: '#007AFF' },
  deleteButton: { backgroundColor: '#FF3B30' },
});
