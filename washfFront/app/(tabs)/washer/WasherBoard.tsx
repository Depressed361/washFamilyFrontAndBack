import { WashOrder } from '@/app/models/washOrder';
import ScreenContainer from '@/components/ScreenContainer';
import { getMissionsOfWasher } from '@/lib/api';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const COLORS = {
  primary: 'black',
  secondary: '#F9FAF9',
  cardBackground: '#FFFFFF',
  textDark: '#000000',
  textLight: '#FFFFFF',
  accent: '#FFA500',
  error: '#D32F2F'
};

export default function WasherBoard() {
  const [orders, setOrders] = useState<WashOrder[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasNext, setHasNext] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const router = useRouter();
  const initialLoadDone = useRef(false);

  const newRequestsCount = orders.filter(o => o.status === 'pending').length;

  const parseDate = (raw?: string | Date): Date | null => {
    if (!raw) return null;
    const s = raw instanceof Date
      ? raw.toISOString()
      : raw.replace(' ', 'T').replace(' +00:00', 'Z');
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const isLate = (dateEnd?: string | Date): boolean => {
    const d = parseDate(dateEnd);
    return d ? d.getTime() < Date.now() : false;
  };

  const fetchPage = useCallback(async () => {
    if (loading || !hasNext) return;
    setLoading(true);
    try {
      const { orders: newOrders, meta } = await getMissionsOfWasher(page, 10);
      const valid = newOrders
        .map((o: any) => new WashOrder(o))
        .filter((o: WashOrder) => o.washerId !== null);

      setOrders(prev => page === 1 ? valid : [...prev, ...valid]);
      setPage(meta.page + 1);
      setHasNext(meta.page < meta.totalPages);
    } catch (err) {
      console.error('Erreur chargement page', page, err);
      setHasNext(false);
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [page, hasNext, loading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setHasNext(true);
    await fetchPage();
    setRefreshing(false);
  }, [fetchPage]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const renderItem = ({ item }: { item: WashOrder }) => {
    const end = parseDate(item.dateEnd);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: './ReceiveWashOder', params: { id: item.id } })}
      >
        <Text style={styles.cardTitle}>Commande #{item.id}</Text>
        <Text style={styles.cardText}>
          Fin prévue: {end
            ? end.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
            : '—'}
        </Text>
        {isLate(item.dateEnd) && (
          <View style={styles.errorBadge}>
            <Text style={styles.errorText}>En retard</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => (
    loading && <ActivityIndicator style={styles.loader} color={COLORS.primary} />
  );

  return (
    <ScreenContainer mode="washeur" showBackButton>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('./newOrderWasher')}>
          <Text style={styles.actionText}>Nouvelles Demandes</Text>
          {newRequestsCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{newRequestsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('../availability/DefaultAvailability')}>
          <Text style={styles.actionText}>Mes disponibilités</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Mes Missions</Text>

      {initialLoadDone.current && orders.length === 0 && !loading ? (
        <Text style={styles.emptyText}>Aucune missions en cours</Text>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          onEndReached={() => initialLoadDone.current && fetchPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  actionText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  countBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  countText: {
    color: COLORS.textLight,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: COLORS.textDark,
  },
  list: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: COLORS.textDark,
  },
  errorBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  errorText: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  loader: {
    marginVertical: 20,
  },
});
