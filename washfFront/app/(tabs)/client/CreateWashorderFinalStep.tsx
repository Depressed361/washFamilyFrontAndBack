import { postWashOrder } from '@/lib/api';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SuggestOtherWashersModal from './suggestOtherWashers';

interface Washer {
  email: string;
  address: string;
  city: string;
  zip: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  washer: Washer;
  manualAddress: string;
  startDate: Date;
  endDate: Date;
  washingType: string;
  washingRecommendation: string;
  dryingType: string;
  dryingRecommendation: string;
  ironing: boolean;
}

export default function FinalStepModal({
  visible,
  onClose,
  washer,
  manualAddress,
  startDate,
  endDate,
  washingType,
  washingRecommendation,
  dryingType,
  dryingRecommendation,
  ironing
}: Props) {
  const [deplacementClient, setDeplacementClient] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const router = useRouter();

  if (!visible) return null;

  const handleFinish = async () => {
    if (deplacementClient === null) return Alert.alert('Veuillez faire un choix');
    setLoading(true);
    const address = deplacementClient
      ? `${washer.address}, ${washer.zip} ${washer.city}`
      : manualAddress;

    try {
      const res = await postWashOrder({
        washerEmail: washer.email,
        startDate: startDate.toISOString(),
        dateEnd: endDate.toISOString(),
        washingType,
        washingRecommendation,
        dryingType,
        dryingRecommendation,
        ironing,
        addressPickup: address,
        addressPickupLinenClean: address
      });
      if (res?.id) {
        setCreatedOrderId(res.id);
        setShowSuggestModal(true);
      } else {
        Alert.alert('Commande créée');
        router.push('/');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestClose = () => {
    setShowSuggestModal(false);
    setCreatedOrderId(null);
    router.push('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Dernière étape :</Text>
      <Text style={styles.subLabel}>Le laveur doit-il venir chercher et déposer votre linge ?</Text>

      <LottieView
        source={require('../../../assets/animations/devierly.json')}
        autoPlay
        loop
        style={styles.lottie}
      />

      <View style={styles.choiceContainer}>
        <TouchableOpacity
          style={[styles.choiceButton, deplacementClient === false && styles.choiceSelected]}
          onPress={() => setDeplacementClient(false)}
        >
          <Text style={[styles.choiceText, deplacementClient === false && styles.choiceTextSelected]}>Oui</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.choiceButton, deplacementClient === true && styles.choiceSelected]}
          onPress={() => {
            setDeplacementClient(true);
            Alert.alert('Vous irez déposer et chercher le linge vous-même');
          }}
        >
          <Text style={[styles.choiceText, deplacementClient === true && styles.choiceTextSelected]}>Non</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.finishButton} onPress={handleFinish} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.finishText}>Terminer</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>Annuler</Text>
      </TouchableOpacity>

      {showSuggestModal && createdOrderId && (
        <SuggestOtherWashersModal
          orderId={createdOrderId}
          manualAddress={manualAddress}
          onClose={handleSuggestClose}
        />
      )}
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
  label: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  subLabel: { fontSize: 15, fontWeight: '500', marginBottom: 16 },
  image: { width: 140, height: 140, alignSelf: 'center', marginBottom: 16 },
  choiceContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  choiceButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6A0DAD',
    backgroundColor: '#fff'
  },
  choiceSelected: {
    backgroundColor: '#6A0DAD'
  },
  lottie: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginBottom: 16,
  },
  choiceText: {
    color: '#6A0DAD',
    fontWeight: '600'
  },
  choiceTextSelected: {
    color: '#fff'
  },
  finishButton: {
    backgroundColor: '#6A0DAD',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center'
  },
  finishText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: 'center'
  },
  cancelText: {
    color: '#999'
  }
});