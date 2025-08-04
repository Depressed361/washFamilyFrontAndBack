// components/ScreenContainer.tsx
import { getNotificationsForClient, getNotificationsForWasher } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenContainerProps = {
  children: React.ReactNode;
  mode: 'washeur' | 'client';
  showBackButton?: boolean;
};

export default function ScreenContainer({ children, mode, showBackButton = false }: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const backButtonBackground = mode === 'washeur' ? 'black' : '#6A0DAD';
  const iconColor = mode === 'washeur' ? '#000' : '#6A0DAD';
  const bellBackground = mode === 'washeur' ? 'rgba(0,0,0,0.05)' : 'transparent';

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const data = mode === 'washeur'
          ? await getNotificationsForWasher(1, 50)
          : await getNotificationsForClient(1, 50);
        const unread = data.notifications.filter((n: { read: boolean }) => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.warn('Erreur récupération notifications :', err);
      }
    };
    fetchNotifs();
  }, [mode]);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <View style={styles.navbar}>
        <View style={styles.navbarRow}>
          {showBackButton && (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: backButtonBackground }]}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>
          )}

          <View style={styles.rightIcons}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: bellBackground }]}
              onPress={() =>
                router.push(mode === 'washeur'
                  ? '/(tabs)/washer/alertWasher?showBack=1'
                  : '/(tabs)/client/notifications')
              }
            >
              <Ionicons name="notifications-outline" size={24} color={iconColor} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '+10' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() =>
                router.push(
                  mode === 'washeur'
                    ? '/(tabs)/washer/profilWasheur?showBack=1'
                    : '/(tabs)/client/profil'
                )
              }
            >
              <Ionicons name="person-circle-outline" size={28} color={iconColor} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F9FAF9',
  },
  topSafeArea: {
    backgroundColor: '#fff',
  },
  navbar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    position: 'relative',
    borderRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
