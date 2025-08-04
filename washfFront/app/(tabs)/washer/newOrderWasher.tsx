// app/(tabs)/newOrderWasher.tsx
import { WashOrder } from '@/app/models/washOrder';
import {
  acceptWashOrder,
  getNewOrdersOfWasher,
  refuseWashOrder
} from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;
const AVATAR_SIZE = 50;
const PAGE_LIMIT = 10;

export default function NewOrderWasher() {
  const router = useRouter();
  const [orders, setOrders] = useState<WashOrder[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(
    async (pageToFetch = 1, replace = false) => {
      if (pageToFetch > totalPages) return;
      if (replace) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const { orders: fetched, meta } = await getNewOrdersOfWasher(
          pageToFetch,
          PAGE_LIMIT
        );
        setTotalPages(meta.totalPages);
        setPage(meta.page);
        const mapped = fetched.map((o: any) => new WashOrder(o));
        setOrders(prev => (replace ? mapped : [...prev, ...mapped]));
      } catch (err) {
        console.error('Erreur chargement nouvelles commandes :', err);
      } finally {
        if (replace) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [totalPages]
  );

  useEffect(() => {
    fetchOrders(1, true);
  }, [fetchOrders]);
 
  console.log('Orders:', orders);
  const handleAccept = async (orderId: string) => {
    try {
      await acceptWashOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error('Erreur acceptation commande :', err);
    }
  };

  const handleDecline = async (orderId: string) => {
    try {
      await refuseWashOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error('Erreur refus commande :', err);
    }
  };

  const renderItem = ({ item }: { item: WashOrder }) => {
    const client = item.User;
    const avatar = client?.profilePicture;
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View style={styles.infoColumn}>
            <Text style={styles.clientName}>
              {client?.firstName} {client?.lastName}
            </Text>
            <Text style={styles.orderId}>Commande #{item.id}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Ionicons name="calendar-outline" size={18} color="black" />
          <Text style={styles.detailText}>{item.formatDateStart()}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAccept(item.id)}
          >
            <Text style={styles.actionText}>Accepter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDecline(item.id)}
          >
            <Text style={styles.actionText}>Refuser</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelles Commandes</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        renderItem={renderItem}
        onEndReached={() => fetchOrders(page + 1)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrders(1, true)}
            tintColor="black"
          />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={!loading ? (
          <Text style={styles.emptyText}>Aucune nouvelle commande</Text>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAF9',
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    margin: CARD_MARGIN,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  listContainer: {
    paddingHorizontal: CARD_MARGIN,
    paddingBottom: 30,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#EEE',
    marginRight: 12,
  },
  infoColumn: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 14,
    color: '#666666',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#000000',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: '#28A745',
  },
  declineButton: {
    backgroundColor: '#DC3545',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 16,
    color: '#666666',
  },
});
