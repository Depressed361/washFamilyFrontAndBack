import { useRouter } from 'expo-router';
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
import { getNotificationsForClient, markAsRead } from '../../../lib/api';
import { Notifications } from '../../models/notif';

const PAGE_LIMIT = 10;

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  // Chargement initial + pagination
  const loadNotifications = useCallback(async (pageToFetch = 1, replace = false) => {
    try {
      if (pageToFetch === 1) setLoading(true);
      const data = await getNotificationsForClient(pageToFetch, PAGE_LIMIT);
      const newNotifs = Array.isArray(data) ? data : data.notifications || [];
      setHasMore(newNotifs.length === PAGE_LIMIT);
      setNotifications(replace ? newNotifs : [...notifications, ...newNotifs]);
      setPage(pageToFetch);
    } catch (err) {
      console.error('Erreur chargement notifications :', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notifications]);

  useEffect(() => {
    loadNotifications(1, true);
  }, []);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications(1, true);
  }, [loadNotifications]);

  // Pagination (chargement en bas)
  const onEndReached = () => {
    if (hasMore && !loading) {
      loadNotifications(page + 1);
    }
  };

  // Affichage d'un item notification
  const renderItem = ({ item: notif }: { item: Notifications }) => {
    const actions = Array.isArray(notif.actions)
      ? notif.actions
      : JSON.parse(notif.actions || '[]');
    const navAction = actions.find((a: { type: string; target?: string }) => a.type === 'navigate');

    // Avatar (exemple, à adapter selon notif.data)
    let avatarUrl;
    if (notif.data?.userProfilePicture) avatarUrl = notif.data.userProfilePicture;
    else if (notif.data?.washerProfilePicture) avatarUrl = notif.data.washerProfilePicture;

    return (
      <TouchableOpacity
        key={notif.id}
        style={styles.card}
        onPress={async () => {
          try {
            await markAsRead(notif.id);
            setNotifications((prev) =>
              prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
            );
          } catch (e) {
            console.warn('Erreur markAsRead:', e);
          }
          if (navAction && navAction.target) {
            router.push(navAction.target);
          }
        }}
      >
        <View style={[styles.cardContent, notif.read && styles.read, { flexDirection: 'row', alignItems: 'center' }]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.titleNotif}>{notif.title}</Text>
            <Text style={styles.bodyNotif}>{notif.body}</Text>
            <Text style={styles.date}>
              {new Date(notif.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Affichage loader initial
  if (loading && notifications.length === 0) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={notif => notif.id}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading && notifications.length > 0 ? <ActivityIndicator /> : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="purple"
            title="Mise à jour..."
          />
        }
        ListEmptyComponent={
          !loading && notifications.length === 0 ? (
            <Text style={styles.empty}>Aucune notification</Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    paddingTop: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'purple',
    marginBottom: 20,
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 16,
    color: 'gray',
  },
  card: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardContent: {
    backgroundColor: '#f3f3f3',
    padding: 16,
  },
  read: {
    opacity: 0.6,
  },
  titleNotif: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
  },
  bodyNotif: {
    fontSize: 14,
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'right',
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
});