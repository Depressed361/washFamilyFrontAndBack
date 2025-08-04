// Screen qui affiche le détail d'une commande de lavage pour le client
// Permet de voir les infos de la commande, le laveur assigné et d'annuler la commande si nécessaire
// SVP A NE PAS CONFONDRE AVEC LE SCREEN POUR LE LAVEUR RECEIVEWASHORDER

import { WashOrder } from '@/app/models/washOrder';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  cancelWashOrder,
  clientAwaitingPickupConfirm,
  clientConfirmPickup,
  clientInitiatePickup,
  getClientWashOrderById,
} from '../../../../lib/api';

const screenWidth = Dimensions.get('window').width;
const CLIENT_COLOR = '#2E8B57';
const DANGER_COLOR = '#D9534F';
const PRIMARY_COLOR = '#4C51BF';
const PICKUP_COLOR = '#2A9D8F';

export default function DetailWashOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<WashOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await getClientWashOrderById(id);
        if (!data) throw new Error('Commande introuvable');
        setOrder(new WashOrder(data));
      } catch (error) {
        console.error('Erreur chargement détail commande :', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadOrder();
  }, [id]);

  const handleCancel = () => {
    Alert.alert(
      'Annuler la commande',
      'Êtes-vous sûr ? Des frais d’annulation peuvent être appliqués.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            await cancelWashOrder(id, 'Annulation par le client');
            Alert.alert('Commande annulée', 'Votre commande a été annulée avec succès.');
            router.push('/(tabs)/client/washing');
          },
        },
      ]
    );
  };

  const handlePayment = () => {
    Alert.alert('Procéder au paiement', 'Redirection vers le paiement...');
  };



  const handlePickup = () => {
    Alert.alert(
      'Démarrer la prise en charge',
      'Voulez-vous démarrer la prise en charge de votre linge ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          onPress: async () => {
            await clientInitiatePickup(id);
            Alert.alert('En route', 'Le dépôt du linge a été initié.');
          },
        },
      ]
    );
  };

  const handleAwaitingPickupConfirm = async () => {
    try {
      await clientAwaitingPickupConfirm(id);
      Alert.alert('Confirmation', 'Vous avez confirmé votre arrivée. Le laveur va venir prendre votre linge.');
    } catch (error) {
      console.error('Erreur lors de la confirmation de l\'arrivée :', error);
      Alert.alert('Erreur', 'Impossible de confirmer votre arrivée. Veuillez réessayer plus tard.');
    }
  };
  const handleclientConfirmPickup = async () => {
    try {
      await clientConfirmPickup(id);
      Alert.alert('Confirmation', 'Vous avez confirmé la prise en charge du linge par le laveur.');
    } catch (error) {
      console.error('Erreur lors de la confirmation de la prise en charge :', error);
      Alert.alert('Erreur', 'Impossible de confirmer la prise en charge. Veuillez réessayer plus tard.');
    }
  };


  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color={CLIENT_COLOR} />;
  if (!order) return <Text style={styles.alert}>Commande introuvable.</Text>;

  const startDate = new Date(order.dateStart).getTime();
  const now = Date.now();
  const diffMs = startDate - now;
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
   const isInProgress = order?.isInProgress || order?.status === 'pickup_in_progress';
  const isAwaitingPickupConfirm = order?.isAwaitingPickupConfirm || order?.status === 'awaiting_pickup_confirm';
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🧼  commande N° {order.orderNumber}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Statut :</Text>
        <Text style={[styles.value, order.isLate && styles.late]}>         
          {order.displayStatus}{order.isLate && ' (en retard)'}
        </Text>

        <Text style={styles.label}>Date début :</Text>
        <Text style={styles.value}>{order.formatDateStart()}</Text>

        <Text style={styles.label}>Date fin estimée :</Text>
        <Text style={styles.value}>{order.formatDateEnd()}</Text>

        <Text style={styles.label}>Type de lavage :</Text>
        <Text style={styles.value}>{order.washingType} – {order.washingRecommendation}</Text>

        <Text style={styles.label}>Type de séchage :</Text>
        <Text style={styles.value}>{order.dryingType} – {order.dryingRecommendation}</Text>

        <Text style={styles.label}>Repassage :</Text>
        <Text style={styles.value}>{order.ironing ? 'Oui' : 'Non'}</Text>

        <Text style={styles.label}>{order.deplacementClient ? 'À déposer' : 'Adresse :'}</Text>
        <Text style={styles.value}>{order.addressPickup || 'Non renseignée'}</Text>

        <Text style={styles.label}>Prix :</Text>
        <Text style={styles.value}>{order.formattedPrice}</Text>
      </View>

      <Text style={styles.subtitle}>🧔 Infos du laveur</Text>
      <View style={styles.card}>
        <View style={styles.washerInfo}>
          {order.Washer?.profilePicture && (
            <Image source={{ uri: order.Washer.profilePicture }} style={styles.avatar} />
          )}
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.value}>{order.Washer?.firstName} {order.Washer?.lastName}</Text>
            <Text style={styles.value}>{order.Washer?.email}</Text>
          </View>
        </View>
      </View>

      {/* Paiement si accepté */}
      {order.isAccepted && (
        <View style={styles.actionContainer}>
          <Text style={styles.message}>Le laveur a accepté votre demande.</Text>
          <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
            <Text style={styles.paymentText}>Procéder au paiement</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dépôt si payé et déplacement client */}
      {order.isPaid && order.deplacementClient && (
        diffMs >= 0 && diffMs <= 3600000 ? (
          <View style={styles.actionContainer}>
            <Text style={styles.message}>Votre dépôt commence maintenant.</Text>
            <TouchableOpacity style={styles.pickupButton} onPress={handlePickup}>
              <Text style={styles.pickupText}>Démarrer le dépôt</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionContainer}>
            <Text style={styles.message}>
              Vous pourrez déposer votre linge dans {diffHours} heure{diffHours > 1 ? 's' : ''}.
            </Text>
          </View>
        )
      )}

      {order.deplacementClient && isInProgress&& (
        <View style={styles.actionContainer}>
          <Text style={styles.message}>Est-tu arrivé ?</Text>
          <TouchableOpacity style={styles.pickupButton} onPress={handleAwaitingPickupConfirm}> 
            <Text style={styles.pickupText}> Avertir de mon arrivée</Text>
          </TouchableOpacity>
        </View>
      )}

      { /*si le deplacement client est false c'est au client de confirmer
      la reception du linge par le lave*/ }
      {!order.deplacementClient && isAwaitingPickupConfirm && (
        <View style={styles.actionContainer}>
          <Text style={styles.message}>Le laveur a t il pris le linge ?</Text>
          <TouchableOpacity style={styles.pickupButton} onPress={handleclientConfirmPickup }>
            <Text style={styles.pickupText}> oui! linge ramassé </Text>
          </TouchableOpacity>
        </View>
      )}

      { /* Si le laveur a déjà récupéré le linge, on affiche un message différent */ }


      {/* Annulation si payé et pas de déplacement client */}
      {order.isPaid && !order.deplacementClient ? (
        <View style={styles.footerAction}>
          <Text style={styles.warning}>⚠️ En cas d’annulation, des frais peuvent s’appliquer.</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>🚫 Annuler la commande</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.footerAction}>
          <Text style={styles.alert}>Cette commande n&#39;est pas annulable.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAF9',
    padding: 20,
    paddingBottom: 80,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: CLIENT_COLOR,
    fontWeight: 'bold',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: CLIENT_COLOR,
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  label: {
    fontWeight: '600',
    color: '#555',
    marginTop: 12,
  },
  value: {
    color: '#333',
    fontSize: 15,
    marginTop: 4,
  },
  late: {
    color: DANGER_COLOR,
    fontWeight: '700',
  },
  washerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 10,
    color: '#444',
  },
  actionContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: CLIENT_COLOR,
    marginBottom: 12,
    fontWeight: '600',
  },
  paymentButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  paymentText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pickupButton: {
    backgroundColor: '#2A9D8F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
 pickupText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerAction: {
    marginTop: 30,
    alignItems: 'center',
  },
  warning: {
    color: '#D9534F',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: '#D9534F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  alert: {
    color: '#D9534F',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  
});