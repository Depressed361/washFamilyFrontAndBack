import { Colors } from '@/constants/Colors';
import { useUser } from '@/context/user.context';
import { uploadProfilePicture } from '@/lib/api';
import { getAccessToken, removeToken } from '@/lib/storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const CLIENT_COLOR = '#6A0DAD';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = Math.min(120, SCREEN_WIDTH * 0.3);

export default function ProfilScreen() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Palette forcée en clair
  const palette = Colors.light;

  useEffect(() => {
    if (!user) router.replace('/(tabs)/connexion');
  }, [user, router]);

  const slideAnim = useRef(new Animated.Value(-200)).current;
  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 0, duration: 1000, useNativeDriver: true }).start();
  }, [slideAnim]);

  const handleLogout = async () => {
    await removeToken();
    setUser(null);
    router.replace('/(tabs)/connexion');
  };

  const handleValidateProfile = () => {
    Alert.alert(
      'Validation du profil',
      'Pour finaliser votre profil, veuillez compléter les informations manquantes.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Valider', onPress: () => router.push('/(tabs)/ProfilValidation') },
      ]
    );
  };

  const pickImage = async () => {
    setError(null);
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return setError('Permission refusée pour accéder aux photos.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1,1], quality: 0.7 });
    if (!result.canceled && result.assets?.length) uploadImage(result.assets[0].uri);
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Utilisateur non authentifié.');
      const profilePictureUrl = await uploadProfilePicture(uri, token);
      setUser({ ...user!, profilePicture: profilePictureUrl });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur serveur');
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  const styles = makeStyles(palette);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>      
      <Text style={styles.title}>Mon Profil Client</Text>
      <View style={styles.avatarContainer}>
        {uploading
          ? <ActivityIndicator size="large" color={CLIENT_COLOR} />
          : <TouchableOpacity >
              <Image source={user.profilePicture ? { uri: user.profilePicture } : require('../../../assets/default-avatar.png')} style={styles.avatar} />
            </TouchableOpacity>
        }
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Nom complet</Text>
        <Text style={styles.fieldValue}>{user.name} {user.lastname}</Text>

        <Text style={styles.fieldLabel}>Email</Text>
        <Text style={styles.fieldValue}>{user.email}</Text>

        <Text style={styles.fieldLabel}>Téléphone</Text>
        <Text style={styles.fieldValue}>{user.phoneNumber || 'Non renseigné'}</Text>

        <Text style={styles.fieldLabel}>Adresse</Text>
        <Text style={styles.fieldValue}>{user.address || 'Non renseignée'}</Text>
      </View>

      {!user.profileCompleted && (
        <TouchableOpacity style={[styles.button, styles.validateButton]} onPress={handleValidateProfile}>
          <Text style={styles.buttonText}>Je VALIDE mon profil</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[styles.button, { backgroundColor: CLIENT_COLOR }]} onPress={() => router.push('./washing')}>
        <Text style={styles.buttonText}>Suivi de mes commandes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: CLIENT_COLOR }]} onPress={() => router.push('./CreateWashOrder')}>
        <Text style={styles.buttonText}>Chercher un laveur</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: palette.textSecondary }]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Déconnexion</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const makeStyles = (c: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: c.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: CLIENT_COLOR,
    textAlign: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: CLIENT_COLOR,
  },
  error: {
    marginTop: 8,
    color: c.error,
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
  fieldValue: {
    fontSize: 16,
    color: c.textSecondary,
    marginTop: 4,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  validateButton: {
    backgroundColor: c.accent,
    borderWidth: 2,
    borderColor: c.accentBorder,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});