import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { clientInitiatePickup, getClientWashOrders } from '../../../lib/api';
import { WashOrder as WashOrderModel } from '../../models/washOrder';

const screenWidth = Dimensions.get('window').width;
const CLIENT_COLOR = '#6A0DAD';  // Couleur primaire inspirée de CreateWashOrder (violet)

export default function WashingScreen() {
  const [tab, setTab] = useState<'upcoming' | 'pending' | 'past' | 'clientDrop'>('upcoming');
  const [orders, setOrders] = useState<WashOrderModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getClientWashOrders();
        const formatted = data.map((item: any) => new WashOrderModel(item));
        setOrders(formatted);
      } catch (err) {
        console.log('Erreur chargement commandes :', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getClientWashOrders();
      const formatted = data.map((item: any) => new WashOrderModel(item));
      setOrders(formatted);
    } catch (err) {
      console.log('Erreur chargement commandes :', err);
    } finally {
      setRefreshing(false);
    }
  };

  const clientDropOrders = orders.filter(
    o =>
      (o.status === 'paid' || o.status === 'pickup_in_progress') &&
      o.deplacementClient === false
  );

  const clientDropNotPickedUp = clientDropOrders.filter(
    o => o.status !== 'pickup_in_progress'
  );

  const renderOrders = (type: typeof tab) => {
    let filtered = orders;

    if (type === 'upcoming') {
      filtered = orders.filter(o => o.status === 'accepted' || o.status === 'paid');
    } else if (type === 'pending') {
      filtered = orders.filter(o => o.status === 'pending');
    } else if (type === 'past') {
      filtered = orders.filter(o => o.status === 'completed');
    } else if (type === 'clientDrop') {
      filtered = clientDropOrders;
    }

    filtered.sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

    if (filtered.length === 0) {
      return <Text style={styles.info}>Aucune commande {type === 'past' ? 'passée' : type === 'pending' ? 'en attente' : type === 'clientDrop' ? 'à déposer' : 'à venir'}.</Text>;
    }

    return filtered.map(order => {
      const isSoon = new Date(order.dateStart).getTime() - Date.now() < 3 * 60 * 60 * 1000;
      const canInitiatePickup = order.status === 'paid' &&
        new Date(order.dateStart).getTime() - Date.now() < 60 * 60 * 1000;

      return (
        <View key={`order-wrapper-${order.id}`}>  
          <TouchableOpacity onPress={() => router.push(`./DetailWashOrder/${order.id}`)}>
            <View style={[styles.card, isSoon && styles.highlightBorder]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>🮺 Commande #{order.id}</Text>
                {tab === 'clientDrop' && order.status !== 'pickup_in_progress' && (
                  <View style={styles.pastille} />
                )}
              </View>

              <Text style={styles.cardText}>
                👤 Laveur : {order.Washer?.firstName}
              </Text>
              <Text style={styles.cardText}>
                📧 Email : {order.Washer?.email || 'Non renseigné'}
              </Text>
              <Text style={styles.cardText}>
                adresse : {order.addressPickup || 'Non renseignée'}
              </Text>
              <Text style={styles.cardText}>
                📅 Début : {order.dateStart ? new Date(order.dateStart).toLocaleDateString('fr-FR', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : 'Date inconnue'}
              </Text>
              <Text style={styles.cardText}>🧼 {order.washingType} - {order.dryingType}{order.ironing ? ' + Repassage' : ''}</Text>
              <Text style={styles.cardText}>📦 Statut : {order.displayStatus}</Text>

              {tab === 'clientDrop' && new Date(order.dateStart) < new Date() && (
                <Text style={styles.alert}>⚠️ Date dépassée</Text>
              )}
              {isSoon && (
                <Text style={[styles.alert, { color: CLIENT_COLOR }]}>🕒 Dans moins de 3h !</Text>
              )}

              {tab === 'clientDrop' && canInitiatePickup && (
                <View style={styles.clientDropActions}>
                  <TouchableOpacity
                    style={styles.pickupButton}
                    onPress={async () => {
                      try {
                        await clientInitiatePickup(order.id);
                        const updated = orders.map(o =>
                          o.id === order.id
                            ? new WashOrderModel({ ...o, status: 'pickup_in_progress' })
                            : o
                        );
                        setOrders(updated);
                      } catch (e) {
                        console.error('Erreur lors de initiatePickup :', e);
                        alert("Impossible d'initier la remise. Veuillez réessayer.");
                      }
                    }}
                  >
                    <Text style={styles.pickupButtonText}>📦 Je dépose mon linge</Text>
                  </TouchableOpacity>
                </View>
              )}

              {order.status === 'accepted' && (
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => Linking.openURL(`https://stripe.com/pay?orderId=${order.id}`)}
                >
                  <Text style={styles.payButtonText}>Payer maintenant</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: '#888', marginTop: 8 }]}
            onPress={() => router.push(`/client/DetailWashOrder/${order.id}`)}
          >
            <Text style={styles.payButtonText}>Voir le détail</Text>
          </TouchableOpacity>
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Mes Lavages</Text>

        <View style={styles.tabs}>
          {['upcoming', 'pending', 'past', 'clientDrop'].map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t as typeof tab)} style={[styles.tab, tab === t && styles.activeTab]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.tabText, tab === t && styles.activeTabText]}>
                  {{
                    upcoming: 'À venir',
                    pending: 'En attente',
                    past: 'Passés',
                    clientDrop: 'À déposer',
                  }[t]}
                </Text>
                {t === 'clientDrop' && clientDropNotPickedUp.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{clientDropNotPickedUp.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CLIENT_COLOR]} />
          }
        >
          {loading ? (
            <ActivityIndicator size="large" color={CLIENT_COLOR} />
          ) : (
            renderOrders(tab)
          )}
        </ScrollView>

        {/* Bouton principal pour créer une nouvelle commande */}
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => router.push('./CreateWashOrder')}
        >
          <Text style={styles.mainButtonText}>Laver mon linge</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafafa' },
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: 20,
    paddingHorizontal: screenWidth < 360 ? 10 : 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 8,
    backgroundColor: CLIENT_COLOR,
    marginBottom: 12,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    fontSize: screenWidth < 360 ? 22 : 28,
    fontWeight: 'bold',
    color: CLIENT_COLOR,
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ECECEC',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: CLIENT_COLOR,
  },
  tabText: {
    fontWeight: '600',
    color: '#888',
    fontSize: 14,
  },
  activeTabText: {
    color: 'white',
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  info: {
    textAlign: 'center',
    fontSize: 16,
    color: '#555',
    marginTop: 30,
  },
  highlightBorder: {
    borderColor: 'orange',
    borderWidth: 2,
  },
  card: {
    backgroundColor: 'white',
    padding: 14,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  cardText: {
    color: '#444',
    fontSize: screenWidth < 360 ? 13 : 14,
    marginTop: 4,
  },
  alert: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  pastille: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: CLIENT_COLOR,
  },
  badge: {
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 6,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  payButton: {
    marginTop: 10,
    backgroundColor: 'purple',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  payButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  clientDropActions: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  pickupButton: {
    backgroundColor: CLIENT_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  pickupButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Nouveau bouton principal
  mainButton: {
    backgroundColor: CLIENT_COLOR,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  mainButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
