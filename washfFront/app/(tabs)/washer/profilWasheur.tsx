// app/(auth)/profilWasheur.tsx

import { useUser } from '@/context/user.context';
import { uploadProfilePicture } from '@/lib/api';
import { getAccessToken, removeToken } from '@/lib/storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = Math.min(120, SCREEN_WIDTH * 0.3);
/*export const unstable_settings = {
  initialRouteName: 'profilWasheur',
};*/

  export const screenOptions = {
  headerShown: false,
};


export default function ProfilWasheur() {
  const { user, setUser, toggleOnline, logout } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useLocalSearchParams();
  const showBack = params.showBack === '1';

 
  const handleEditPress = () => {
  Alert.alert(
    "Attention",
    "Certaines modifications (comme le nom ou prénom) nécessiteront une nouvelle vérification d'identité.",
    [
      {
        text: "Annuler",
        style: "cancel",
      },
      {
        text: "Continuer",
        onPress: () => router.push('./profileModification?showBack=1'),
      },
    ]
  );
};


  useEffect(() => {
    if (!user) {
      router.replace('/(tabs)/connexion');
    }
  }, [user, router]);

  const handleLogout = async () => {
    await removeToken();
    logout();
    router.replace('/(tabs)/connexion');
  };

  const handleValidateProfile = () => {
    router.push('/(tabs)/ProfilValidation');
  };

  const pickImage = async () => {
    setError(null);
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      setError('Permission refusée pour accéder aux photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('Utilisateur non authentifié.');
        setUploading(false);
        return;
      }
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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {showBack && (
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={ styles.fieldValue }>← Retour</Text>
        </TouchableOpacity>
      )}
    <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }}
      style={styles.container}
      showsVerticalScrollIndicator={false}> 
      <View style={styles.card}>
        <Text style={styles.title}>Mon Profil Laveur</Text>

        <View style={styles.avatarContainer}>
          {uploading ? (
            <ActivityIndicator size="large" color="black" />
          ) : (
            <TouchableOpacity onPress={pickImage}>
              <Image
                source={
                  user.profilePicture
                    ? { uri: user.profilePicture }
                    : require('../../../assets/default-avatar.png')
                }
                style={styles.avatar}
              />
            </TouchableOpacity>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
        </View>

        <Text style={styles.fieldLabel}>Nom complet</Text>
        <Text style={styles.fieldValue}>
          {user.name} {user.lastname}
        </Text>

        <Text style={styles.fieldLabel}>Email</Text>
        <Text style={styles.fieldValue}>{user.email}</Text>

        <Text style={styles.fieldLabel}>Téléphone</Text>
        <Text style={styles.fieldValue}>
          {user.phoneNumber || 'Non renseigné'}
        </Text>

        <Text style={styles.fieldLabel}>Adresse</Text>
        <Text style={styles.fieldValue}>
          {user.address || 'Non renseignée'}
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={handleEditPress}
        >
        <Text style={styles.buttonText}>Modifier mon profil</Text>
        </TouchableOpacity>



        {user.washer && user.identityVerified && (
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>
              {user.isOnline ? 'En service' : 'Hors service'}
            </Text>
            <Switch
              value={!!user.isOnline}
              onValueChange={async value => {
                await toggleOnline(value);
              }}
              thumbColor={user.isOnline ? 'black' : '#ccc'}
            />
          </View>
          
        )}

        {!user.profileCompleted && !user.identityVerified && (
          <TouchableOpacity
            style={[styles.button, styles.validateButton]}
            onPress={handleValidateProfile}
          >
            <Text style={styles.buttonText}>Compléter votre profil</Text>
          </TouchableOpacity>
        )}

        {user.profileCompleted && !user.identityVerified && (
          <Text style={styles.infoMessage}>
            Votre identité est en cours de vérification.
          </Text>
        )}

        {!user.isVerified && (
          <Text style={styles.infoMessage}>VERIFIER vos mails</Text>
        )}

        {user.washer && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.proButton]}
              onPress={() => router.push('./WasherBoard')}
                
              
            >
              <Text style={styles.buttonText}>Mes missions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.clientButton]}
              onPress={() => router.push('../availability/DefaultAvailability')}
            >
              <Text style={styles.buttonText}>Mes Disponibilités</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAF9'
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  fieldLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  fieldValue: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    
  },
  validateButton: {
    backgroundColor: '#FFA500',
  },
  proButton: { backgroundColor: 'black' },
  clientButton: { backgroundColor: 'black' },
  logoutButton: { backgroundColor: 'black' },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  error: {
    marginTop: 8,
    color: '#D32F2F',
    fontSize: 12,
    textAlign: 'center',
  },
  infoMessage: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  editButton: {
  backgroundColor: '#4A90E2', // bleu doux, tu peux changer
},
 backButton: {
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'black',
    marginBottom: 16,
    

    }
});
