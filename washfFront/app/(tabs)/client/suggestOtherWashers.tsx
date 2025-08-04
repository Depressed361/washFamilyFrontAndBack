// components/SuggestOtherWashersModal.tsx
import { getNearbyWashersForOrder, sendToOtherWashers } from '@/lib/api';
import { Checkbox } from 'expo-checkbox';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Washer {
  id: string;
  name: string;
  lastname: string;
  distance: number;
   profilePicture?: string;
}

interface Props {
  orderId: string;
  manualAddress: string;
  onClose: () => void;
}

export default function SuggestOtherWashersModal({ orderId, manualAddress, onClose }: Props) {
  const [washers, setWashers] = useState<Washer[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getNearbyWashersForOrder(orderId);
        setWashers(res);
      } catch (err) {
        console.error('Erreur récupération des laveurs :', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const toggleWasher = (id: string) => {
    if (selected.includes(id)) {
      setSelected(prev => prev.filter(x => x !== id));
    } else {
      setSelected(prev => [...prev, id]);
    }
  };

  const handleSend = async () => {
    if (selected.length === 0) return Alert.alert('Aucun laveur sélectionné.');
    setSending(true);
    try {
      await sendToOtherWashers(orderId, selected);
      Alert.alert('Demande envoyée à plusieurs laveurs !');
      onClose();
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur lors de l'envoi de la demande");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Demande envoyée !</Text>
      <Text style={styles.subtext}>Souhaitez-vous aussi envoyer cette demande aux autres laveurs à proximité ?</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <ScrollView style={{ maxHeight: 300 }}>
          {washers.map(w => (
  <TouchableOpacity key={w.id} style={styles.row} onPress={() => toggleWasher(w.id)}>
    <Checkbox value={selected.includes(w.id)} onValueChange={() => toggleWasher(w.id)} color="#6A0DAD" />
    <Image
      source={
        w.profilePicture
          ? { uri: w.profilePicture }
          : require('../../../assets/default-avatar.png')
      }
      style={styles.avatar}
    />
    <Text style={styles.label}>{w.name} {w.lastname} – {w.distance.toFixed(1)} km</Text>
  </TouchableOpacity>
))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending}>
        <Text style={styles.sendText}>{sending ? 'Envoi en cours...' : 'Envoyer aux laveurs sélectionnés'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>Ignorer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fafafa',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#ccc',
    zIndex: 10
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  subtext: { fontSize: 15, fontWeight: '500', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { marginLeft: 12, fontSize: 15 },
  sendBtn: {
    backgroundColor: '#6A0DAD',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16
  },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: 12, alignItems: 'center' },
  cancelText: { color: '#999' },
  // ...autres styles...
avatar: {
  width: 36,
  height: 36,
  borderRadius: 18,
  marginLeft: 10,
  backgroundColor: '#eee',
  borderWidth: 1,
  borderColor: '#ccc',
},
});
