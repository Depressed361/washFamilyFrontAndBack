// app/ReceiveWashOder.tsx
import { WashOrder } from '@/app/models/washOrder';
import {
  acceptWashOrder,
  getWashOrderForWasher,
  refuseWashOrder,
  washerAwaitingPickupConfirm,
  washerConfirmPickup,
  washerInitiatePickup
} from '@/lib/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';

export default function ReceiveWashOrder() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<WashOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
 const router = useRouter();
 const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWashOrderForWasher(String(id));
      setOrder(new WashOrder(data));
      console.log('Order fetched:', data);
    } catch (err) {
      console.error('Erreur au chargement de la commande', err);
      Alert.alert('Erreur', "Impossible de charger la commande.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
  fetchOrder();
}, [id, fetchOrder]);


const onRefresh = async () => {
  setRefreshing(true);
  await fetchOrder();
  setRefreshing(false);
};
  const handleAccept = async () => {
    try {
      await acceptWashOrder(String(id));
      Alert.alert('Succès', 'Commande acceptée avec succès.');
      fetchOrder();
    } catch (err) {
      console.error('Erreur lors de l\'acceptation de la commande', err);
      Alert.alert('Erreur', "Impossible d'accepter la commande.");
    }
  }
 const handleRefuse = async () => {
    try {
      await refuseWashOrder(String(id));
      Alert.alert('Succès', 'Commande refusée avec succès.');
      fetchOrder();
    } catch (err) {
      console.error('Erreur lors du refus de la commande', err);
      Alert.alert('Erreur', "Impossible de refuser la commande.");
    }
  }

  const handleIniatePickup = async () => {
    try {
      await washerInitiatePickup(String(id));
      Alert.alert('Succès', 'Vous vous etes mis en route pour la recupération du linge.');
      fetchOrder();
    }
    catch (err) {
      console.error('Erreur lors de l\'initiation du pickup', err);
      Alert.alert('Erreur', "Impossible d'initier le pickup.");
    }

  }

  const handleAwaitingPickupConfirm = async () => {
    try {
      await washerAwaitingPickupConfirm(String(id));
      Alert.alert('Succès', 'Vous avez confirmé la prise en charge du linge.');
      fetchOrder();
    }
    catch (err) {
      console.error('Erreur lors de la confirmation du pickup', err);
      Alert.alert('Erreur', "Impossible de confirmer le pickup.");
    }
  }

  const handleConfirmPickup = async () => {
    try {
      await washerConfirmPickup(String(id));
      Alert.alert('Succès', 'Linge reçu avec succès.');
      fetchOrder();
    } catch (err) {
      console.error('Erreur lors de la confirmation du pickup', err);
      Alert.alert('Erreur', "Impossible de confirmer la réception du linge.");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="purple" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.info}>Commande introuvable.</Text>
      </View>
    );
  }


  const washOrderRefused = order.status === 'refused_by_washer';
  const showAcceptRefuse = order.status === 'pending';
  const awaitingPayment = order.status === 'accepted' ;
  const showPriseEnMain = order.status === 'paid' && !order.deplacementClient;
  const showAwaitingPickupConfirm = order.status === 'pickup_in_progress' && !order.deplacementClient;
  const showClientComing = order.status === 'awaiting_pickup_confirm' && order.deplacementClient;
  const AddressPickup = order.addressPickup || 'le client viendra déposer le linge';

  return (
 
    <ScrollView contentContainerStyle={styles.container}
    refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }>
       <View style={styles.headerCard}>
    <Text style={styles.header}>Commande #{order.id}</Text>
    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
      <Text style={styles.backText}>← Retour</Text>
    </TouchableOpacity>
  </View>
      <Text style={styles.header}>Commande N° {order.orderNumber}</Text>

      { washOrderRefused && (
        <Text style={styles.info}>Cette commande a été refusée </Text>
      )}

      {order.User && (
        <>
          <Text style={styles.label}>photo de profil</Text>
          <Image
            source={
              order.User.profilePicture
                ? { uri: order.User.profilePicture }
                : require('../../../assets/default-avatar.png')
            }
            style={styles.avatar}
          />
          <Text style={styles.label}>Email :</Text>
          <Text style={styles.value}>{order.User.email}</Text>

          <Text style={styles.label}>Téléphone :</Text>
          <Text style={styles.value}>{order.User.phoneNumber}</Text>
        </>
      )}

      { AddressPickup ? (
        <>
          <Text style={styles.label}>Adresse de ramassage :</Text>
          <Text style={styles.info}> {AddressPickup}</Text>
        </>
      ) : (
        <Text style={styles.info}>Le client viendra déposer le linge.</Text>
      )}

      <Text style={styles.label}>Type de lavage :</Text>
      <Text style={styles.value}>{order.washingType}</Text>

      <Text style={styles.label}>Type de séchage :</Text>
      <Text style={styles.value}>{order.dryingType}</Text>

      <Text style={styles.label}>Repassage :</Text>
      <Text style={styles.value}>{order.ironing ? 'Oui' : 'Non'}</Text>

      <View style={styles.actions}>
        {showAcceptRefuse && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.accept]}
              onPress={ handleAccept}
            >
              <Text style={styles.buttonText}>Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.refuse]}
              onPress={ handleRefuse}
            >
              <Text style={styles.buttonText}>Refuser</Text>
            </TouchableOpacity>
          </>
        )}

        {showPriseEnMain && (
          <TouchableOpacity
            style={[styles.button, styles.accept]}
            onPress={handleIniatePickup}
          >
            <Text style={styles.buttonText}>En route</Text>
          </TouchableOpacity>
        )}

        {awaitingPayment && (
          <Text style={styles.info}>
            En attente du paiement du client.
          </Text>
        )}

        {showAwaitingPickupConfirm && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Vous êtes arrivé à destination?.</Text>
            <TouchableOpacity
              style={[styles.button, styles.accept]}
              onPress={handleAwaitingPickupConfirm}
            >
              <Text style={styles.buttonText}>Avertir de votre arrivée</Text>
            </TouchableOpacity>
          </View>
        )}

        {showClientComing &&  (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Le client viendra déposer le linge.</Text>
            <Text style={[styles.label, { marginTop: 12 }]}>Avez-vous reçu le linge ?</Text>
            <TouchableOpacity
              style={[styles.button, styles.accept, { marginTop: 10 }]}
              onPress={handleConfirmPickup}
            >
              <Text style={styles.buttonText}>Linge reçu</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F3F3F3',
    padding: 20,
    paddingTop: 60,

  },

   headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
   backButton: {
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#000000',
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#ddd',
    marginTop: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'purple',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
  info: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 32,
  },
  button: {
    flexGrow: 1,
    backgroundColor: 'purple',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  accept: {
    backgroundColor: 'green',
  },
  refuse: {
    backgroundColor: '#B00020',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});


