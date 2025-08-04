// src/screens/WeeklyAvailabilityScreen.tsx

import {
  blockDay,
  createAvailability,
  deleteAvailability,
  getMergedAvailabilities,
  unblockDay,
} from '@/lib/api';
import { areIntervalsOverlapping, differenceInMinutes, format, parse } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { WeeklySlot } from '../../models/availability';

// Validation pure function : renvoie un message d'erreur ou null si OK
function validateSlot(
  existingSlots: WeeklySlot[],
  startTime: string,
  endTime: string
): string | null {
  const start = parse(startTime, 'HH:mm', new Date());
  const end = parse(endTime, 'HH:mm', new Date());

  if (differenceInMinutes(end, start) < 60) {
    return 'Le créneau doit durer au moins 1 heure.';
  }
  // Vérifie chevauchement
  const overlap = existingSlots.some(s => {
    const sStart = parse(s.startTime, 'HH:mm', new Date());
    const sEnd = parse(s.endTime, 'HH:mm', new Date());
    return areIntervalsOverlapping(
      { start, end },
      { start: sStart, end: sEnd },
      { inclusive: false }
    );
  });
  if (overlap) {
    return 'Ce créneau chevauche un créneau existant.';
  }
  return null;
}

export default function WeeklyAvailabilityScreen() {
  const insets = useSafeAreaInsets();

  const [slots, setSlots] = useState<WeeklySlot[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [pendingCreates, setPendingCreates] = useState<WeeklySlot[]>([]);
  const [pendingDeletes, setPendingDeletes] = useState<WeeklySlot[]>([]);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600_000));

  useEffect(() => { load(); }, []);
  async function load() {
    try {
      const data = await getMergedAvailabilities();
      setSlots(data);
    } catch {
      Alert.alert('Erreur', "Impossible de charger l'écran.");
    }
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return format(d, 'yyyy-MM-dd');
  });
  const grouped = days.map(date => ({ date, slots: slots.filter(s => s.date === date) }));

  function toggleEdit() {
    if (editMode) {
      handleSaveAll();
    }
    setEditMode(prev => !prev);
  }

  async function handleSaveAll() {
    try {
      if (pendingCreates.length) {
        await createAvailability(
          pendingCreates.map(s => ({ date: s.date, startTime: s.startTime, endTime: s.endTime }))
        );
      }
      if (pendingDeletes.length) {
        await deleteAvailability(
          pendingDeletes.map(s => ({ date: s.date, startTime: s.startTime, endTime: s.endTime }))
        );
      }
      setPendingCreates([]);
      setPendingDeletes([]);
      await load();
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer toutes les modifications.");
    }
  }

  function onDayPress(date: string) {
    if (!editMode) return;
    setPickerDate(date);
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 3600_000));
    setPickerMode('start');
    setPickerVisible(true);
  }

  function handleConfirmNative(dateValue: Date) {
    if (pickerMode === 'start') {
      setStartDate(dateValue);
      setPickerMode('end');
    } else {
      const formattedStart = format(startDate, 'HH:mm');
      const formattedEnd = format(dateValue, 'HH:mm');
      // Valide avant de fermer le picker
      if (pickerDate) {
        const daySlots = slots
          .filter(s => s.date === pickerDate)
          .filter(s => !pendingDeletes.some(d => d.date === s.date && d.startTime === s.startTime && d.endTime === s.endTime));
        const error = validateSlot(daySlots.concat(pendingCreates.filter(c => c.date === pickerDate)), formattedStart, formattedEnd);
        if (error) {
          Alert.alert('Erreur', error);
          return; // ne ferme pas le picker
        }
        onConfirmTime(formattedStart, formattedEnd);
      }
      setPickerVisible(false);
    }
  }

  function onConfirmTime(startTime: string, endTime: string) {
    if (!pickerDate) return;
    const slot: WeeklySlot = {
      date: pickerDate,
      startTime,
      endTime,
      isDefault: false,
      blocked: false,
    };
    setPendingCreates(prev => [...prev, slot]);
    setSlots(prev => [...prev, slot]);
  }

  function onDelete(slot: WeeklySlot) {
    if (!editMode || slot.isDefault) return;
    setPendingDeletes(prev => [...prev, slot]);
    setSlots(prev => prev.filter(s =>
      !(s.date === slot.date && s.startTime === slot.startTime && s.endTime === slot.endTime)
    ));
  }

  async function onBlockToggle(date: string, isBlocked: boolean) {
    try {
      if (isBlocked) await unblockDay(date);
      else await blockDay(date);
      await load();
    } catch {
      Alert.alert('Erreur', isBlocked ? 'Déblocage impossible.' : 'Blocage impossible.');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]}>  
      <View style={styles.header}>
        <Text style={styles.title}>Semaine à venir</Text>
        <TouchableOpacity onPress={toggleEdit} style={styles.editBtn}>
          <Text style={styles.editTxt}>{editMode ? 'Terminer' : 'Modifier'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {grouped.map(({ date, slots: daySlots }) => {
          const isBlocked = daySlots.length === 0 && daySlots.some(s => s.blocked);
          return (
            <TouchableOpacity
              key={date}
              style={styles.dayCard}
              onPress={() => onDayPress(date)}
              activeOpacity={editMode ? 0.7 : 1}
            >
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>
                  {format(new Date(date), 'EEEE dd/MM', { locale: fr })}
                </Text>
                {isBlocked && <Text style={styles.blocked}>Indisponible</Text>}
              </View>

              {daySlots.map(slot => (
                <View
                  key={`${slot.date}-${slot.startTime}-${slot.endTime}`}
                  style={[styles.slotRow, slot.isDefault && styles.default]}
                >
                  <Text style={styles.slotTxt}>
                    {slot.startTime} – {slot.endTime}
                    {slot.isDefault ? ' (par défaut)' : ''}
                  </Text>
                  {editMode && !slot.isDefault && (
                    <TouchableOpacity onPress={() => onDelete(slot)}>
                      <Text style={styles.delete}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {editMode && (
                <View style={styles.blockBtnContainer}>
                  <TouchableOpacity
                    style={styles.blockBtn}
                    onPress={() => onBlockToggle(date, isBlocked)}
                  >
                    <Text style={styles.blockTxt}>{isBlocked ? 'Débloquer' : 'Bloquer'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {pickerVisible && (
        <View style={styles.pickerHeader} pointerEvents="none">
          <Text style={styles.pickerHeaderText}>
            {pickerMode === 'start'
              ? 'Choisissez une heure de début'
              : 'Choisissez une heure de fin'}
          </Text>
        </View>
      )}
      <DateTimePickerModal
        isVisible={pickerVisible}
        mode="time"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        date={pickerMode === 'start' ? startDate : endDate}
        minimumDate={pickerMode === 'end' ? startDate : undefined}
        onConfirm={handleConfirmNative}
        onCancel={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const ACCENT = '#6A0DAD';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafafa' },
  pickerHeader: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 30,
    left: 0, right: 0, alignItems: 'center', paddingVertical: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee', zIndex: 1000, elevation: 1000
  },
  pickerHeaderText: { fontSize: 16, fontWeight: '600' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee'
  },
  title: { fontSize: 20, fontWeight: '700' },
  editBtn: { padding: 8 },
  editTxt: { color: ACCENT, fontWeight: '600' },
  container: { padding: 16 },
  dayCard: {
    marginBottom: 12, backgroundColor: '#fff', borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    elevation: 2, padding: 12
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dayLabel: { fontSize: 16, fontWeight: '600' },
  blocked: { fontStyle: 'italic', color: '#888' },
  slotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  slotTxt: { fontSize: 14 },
  default: { opacity: 0.5 },
  delete: { color: ACCENT, fontWeight: '700' },
  blockBtnContainer: { marginTop: 8, alignItems: 'flex-end' },
  blockBtn: { backgroundColor: '#c00', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  blockTxt: { color: '#fff', fontWeight: '600', textAlign: 'center' },
});
