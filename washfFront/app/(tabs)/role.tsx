// app/(tabs)/role.tsx
import { useUser } from '@/context/user.context';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Illustrations épurées au format watermark
import clientIcon from '../../assets/je-suis-client-purple.png';
import washerIcon from '../../assets/je-suis-laveur-blackwhite.png';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40; // 20px de padding latéral
const CARD_HEIGHT = CARD_WIDTH * 0.6;  // ratio 5:3

export default function RoleScreen() {
  const router = useRouter();
  const { user } = useUser();

  const handleClientPress = () => router.push('/(tabs)/client/profil');
  const handleWasherPress = () => {
    if (!user?.profileCompleted || !user?.identityVerified) {
      router.push('/(tabs)/ProfilValidation');
    } else {
      router.push('/(tabs)/washer/profilWasheur');
    }
  };

  const washerLabel =
    !user?.profileCompleted
      ? 'Je complète mon profil'
      : !user?.identityVerified
        ? 'Je confirme mon identité'
        : 'Accéder à mon espace laveur';

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Bienvenue !</Text>
      <Text style={styles.subtitle}>Qui êtes-vous aujourd’hui ?</Text>

      {/* Bouton client */}
      <Pressable
        onPress={handleClientPress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed
        ]}
        accessibilityLabel="Je suis client"
      >
        <View style={styles.iconWrapper}>
          <Image
            source={clientIcon}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
        <View style={styles.textWrapper}>
          <Text style={styles.buttonTitle}>🙋 Je suis client</Text>
          <Text style={styles.buttonSub}>Réservez un lavage, suivez vos commandes</Text>
        </View>
      </Pressable>

      {/* Bouton laveur */}
      <Pressable
        onPress={handleWasherPress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed
        ]}
        accessibilityLabel="Je suis laveur"
      >
        <View style={styles.iconWrapper}>
          <Image
            source={washerIcon}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
        <View style={styles.textWrapper}>
          <Text style={styles.buttonTitle}>🧼 {washerLabel}</Text>
          <Text style={styles.buttonSub}>Rejoins notre réseau de laveurs et gagne de l’argent</Text>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    // ombres
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardPressed: {
    backgroundColor: '#EEE',
  },
  iconWrapper: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: '60%',
    height: '70%',
    opacity: 0.9,
  },
  textWrapper: {
    flex: 1,
    paddingLeft: 16,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  buttonSub: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
});