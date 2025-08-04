// src/screens/DefaultAvailabilityScreen.tsx

import type { DefaultSlot } from '@/app/models/availability';
import TimeRangePicker from '@/components/TimeRangePicker';
import {
  deleteDefaultSlot,
  getDefaultAvailability,
  setDefaultAvailability,
} from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ACCENT = '#6A0DAD';

export default function DefaultAvailabilityScreen() {
  const [slotsByDay, setSlotsByDay] = useState<Record<number, DefaultSlot[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerDay, setPickerDay] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => { loadDefaults(); }, []);

  async function loadDefaults() {
    try {
      const data = await getDefaultAvailability();
      const grouped = data.reduce((acc: Record<number, DefaultSlot[]>, slot: DefaultSlot) => {
        (acc[slot.dayOfWeek] ||= []).push(slot);
        return acc;
      }, {});
      setSlotsByDay(grouped);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger vos disponibilités par défaut.');
    }
  }

  function handleAdd(dow: number) {
    setPickerDay(dow);
    setPickerVisible(true);
  }

  async function handleDelete(dow: number, slotId: string) {
    try {
      await deleteDefaultSlot(slotId);
      setSlotsByDay(prev => ({
        ...prev,
        [dow]: prev[dow].filter(s => s.id !== slotId),
      }));
    } catch {
      Alert.alert('Erreur', 'Impossible de supprimer ce créneau.');
    }
  }

  async function handleSave() {
    setIsSaving(true);
    const allSlots = Object.values(slotsByDay).flat();
    try {
      await setDefaultAvailability(allSlots);
      Alert.alert('Succès', 'Disponibilités enregistrées.');
      await loadDefaults();
    } catch {
      Alert.alert('Erreur', 'Échec de l’enregistrement.');
    } finally {
      setIsSaving(false);
    }
  }

  function onPickerConfirm(startTime: string, endTime: string) {
    if (pickerDay === null) return;
    const newSlot: DefaultSlot = { dayOfWeek: pickerDay, startTime, endTime };
    setSlotsByDay(prev => ({
      ...prev,
      [pickerDay]: [...(prev[pickerDay] || []), newSlot],
    }));
    setPickerVisible(false);
    setPickerDay(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
       <ScrollView contentContainerStyle={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 22, color: ACCENT }}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Disponibilités par défaut</Text>
      </View>
      
        <Text style={styles.title}>Disponibilités par défaut</Text>
        <Text style={styles.subtitle}>Définissez vos plages habituelles pour chaque jour de la semaine.</Text>

{[0,1,2,3,4,5,6].map(dow => (
          <View key={dow} style={styles.daySection}>
            <Text style={styles.dayLabel}>
              {format(new Date().setDate(dow + 1), 'EEEE', { locale: fr })}
            </Text>

            {(slotsByDay[dow] || []).map(slot => (
              <View
                key={slot.id ?? `${slot.startTime}-${slot.endTime}`}
                style={[styles.slotRow, styles.defaultSlot]}
              >
                <Text style={styles.slotTxt}>{slot.startTime} – {slot.endTime}</Text>
                {slot.id && (
                  <TouchableOpacity onPress={() => handleDelete(dow, slot.id!)}>
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}


    <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(Number(dow))}>
      <Text style={styles.addTxt}>+ Ajouter un créneau</Text>
    </TouchableOpacity>
  </View>
))}

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.disabledBtn]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveTxt}>{isSaving ? 'Enregistrement...' : 'Enregistrer mes disponibilités'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={pickerVisible} transparent animationType="slide">
        <TimeRangePicker
          isVisible={pickerVisible}
          onConfirm={onPickerConfirm}
          onCancel={() => { setPickerVisible(false); setPickerDay(null); }}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafafa' },
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: '#333' },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 16 },
  daySection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  dayLabel: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    marginBottom: 6,
  },
  slotTxt: { fontSize: 14, color: '#333' },
  defaultSlot: { opacity: 0.5 },
  deleteText: { color: ACCENT, fontWeight: '700' },
  addBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12 },
  addTxt: { color: ACCENT, fontWeight: '600' },
  saveButton: {
    marginTop: 16,
    backgroundColor: ACCENT,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveTxt: { color: '#fff', fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
});
