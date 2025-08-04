// app/(auth)/alertWasher.tsx

import { Notifications } from '@/app/models/notif';
import { getNotificationsForWasher, markAsRead } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PAGE_LIMIT = 10;

export default function AlertWasher() {
  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();
const showBack = params.showBack === '1';


  const loadNotifications = useCallback(
    async (pageToFetch = 1, replace = false) => {
      try {
        if (pageToFetch === 1) setLoading(true);
        const data = await getNotificationsForWasher(pageToFetch, PAGE_LIMIT);
        const newNotifs = Array.isArray(data) ? data : data.notifications || [];
        setHasMore(newNotifs.length === PAGE_LIMIT);
        setNotifications(prev =>
          replace ? newNotifs : [...prev, ...newNotifs]
        );
        setPage(pageToFetch);
      } catch (err) {
        console.error('Erreur chargement notifications :', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => { loadNotifications(1, true); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(1, true);
  }, [loadNotifications]);

  const onEndReached = () => {
    if (hasMore && !loading) {
      loadNotifications(page + 1);
    }
  };

  const renderItem = ({ item }: { item: Notifications }) => {
    const actions = Array.isArray(item.actions)
      ? item.actions
      : JSON.parse(item.actions || '[]');
    const navAction = actions.find((a: any) => a.type === 'navigate');
    const avatarUrl = item.data?.userProfilePicture || item.data?.washerProfilePicture;

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={async () => {
          try {
            await markAsRead(item.id);
            setNotifications(prev =>
              prev.map(n => (n.id === item.id ? { ...n, read: true } : n))
            );
          } catch (e) {
            console.warn('Erreur markAsRead:', e);
          }
          if (navAction?.target) router.push(navAction.target);
        }}
      >
        <View style={styles.itemContent}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View style={styles.textContainer}>
            <Text style={styles.titleNotif}>{item.title}</Text>
            <Text style={styles.bodyNotif}>{item.body}</Text>
            <Text style={styles.dateNotif}>
              {new Date(item.createdAt).toLocaleString('fr-FR')}
            </Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
         {showBack && (
       <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
       </TouchableOpacity>
      )}    

        <Text style={styles.headerTitle}>Alertes Washers</Text>
        <View style={{ width: 28 }} /> {/* placeholder for alignment */}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={notif => notif.id}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && notifications.length > 0 ? (
            <ActivityIndicator style={{ marginVertical: 16 }} />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="black"
            title="Mise à jour..."
          />
        }
        ListEmptyComponent={
          !loading && notifications.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="notifications-off" size={48} color="#666" />
              <Text style={styles.emptyText}>Aucune notification trouvée</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAF9',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ccc',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  titleNotif: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  bodyNotif: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  dateNotif: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'right',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D9534F',
    position: 'absolute',
    top: 12,
    right: 12,
  },
  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 16,
    color: '#666666',
  },
});
