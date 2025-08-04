import { useUser } from '@/context/user.context';
import { updateUserProfile, uploadProfilePicture } from '@/lib/api';
import { getAccessToken } from '@/lib/storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ModifierProfil() {
  const { user, setUser } = useUser();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const showBack = params.showBack === '1';

  const [form, setForm] = useState({
    name: '',
    lastname: '',
    bornDate: '',
    phoneNumber: '',
    address: '',
    city: '',
    zip: '',
    country: '',
  });

  const [initialName, setInitialName] = useState('');
  const [initialLastname, setInitialLastname] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        lastname: user.lastname,
        bornDate: user.bornDate?.toString().split('T')[0] ?? '',
        phoneNumber: user.phoneNumber,
        address: user.address,
        city: user.city,
        zip: user.zip,
        country: user.country,
      });
      setInitialName(user.name);
      setInitialLastname(user.lastname);
    }
  }, [user]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImagePick = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission refusée', 'Impossible d’accéder à la galerie.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length) {
      await handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (uri: string) => {
    try {
      setUploading(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Utilisateur non authentifié.');

      const profilePictureUrl = await uploadProfilePicture(uri, token);
      setUser(prev => prev ? { ...prev, profilePicture: profilePictureUrl } : prev);
      Alert.alert('Succès', 'Photo de profil mise à jour !');
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', (err as any).message || 'Erreur lors de l’upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (form.name !== initialName || form.lastname !== initialLastname) {
      Alert.alert(
        'Changement de nom',
        'Si vous changez votre nom ou prénom, il faudra refaire une vérification d’identité.'
      );
    }

    try {
      const updatedUser = await updateUserProfile({
        ...form,
        bornDate: form.bornDate ? new Date(form.bornDate) : undefined,
      });
      setUser(updatedUser);
      Alert.alert('Succès', 'Profil mis à jour avec succès.');
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', ((err as any).message) || 'Une erreur est survenue lors de la mise à jour.');
    }
  };

  if (!user) return null;

  const shouldHideFields = user.washer === false && user.profileCompleted === false;
  const shouldShowValidateButton = user.washer === false && user.profileCompleted === true;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {showBack && (
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
      )}

      {shouldHideFields && (
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/ProfilValidation')}>
          <Text style={styles.buttonText}>Compléter mon profil</Text>
        </TouchableOpacity>
      )}

      {shouldShowValidateButton && (
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/ProfilValidation')}>
          <Text style={styles.buttonText}>Je VALIDE mon identité</Text>
        </TouchableOpacity>
      )}

      {!shouldHideFields && (
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                user.profilePicture
                  ? { uri: user.profilePicture }
                  : require('../../../assets/default-avatar.png')
              }
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.plusButton} onPress={handleImagePick}>
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>
          </View>

          {uploading && <ActivityIndicator size="small" color="black" style={{ marginBottom: 12 }} />}

          <Text style={styles.title}>Modifier mon profil</Text>

          <Text style={styles.label}>Prénom</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={text => handleChange('name', text)} />

          <Text style={styles.label}>Nom</Text>
          <TextInput style={styles.input} value={form.lastname} onChangeText={text => handleChange('lastname', text)} />

          <Text style={styles.label}>Date de naissance</Text>
          <TextInput
            style={[styles.input, user.washer && styles.disabled]}
            value={form.bornDate}
            onChangeText={text => handleChange('bornDate', text)}
            editable={!user.washer}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>Téléphone</Text>
          <TextInput style={styles.input} value={form.phoneNumber} onChangeText={text => handleChange('phoneNumber', text)} />

          <Text style={styles.label}>Adresse</Text>
          <TextInput style={styles.input} value={form.address} onChangeText={text => handleChange('address', text)} />

          <Text style={styles.label}>Ville</Text>
          <TextInput style={styles.input} value={form.city} onChangeText={text => handleChange('city', text)} />

          <Text style={styles.label}>Code postal</Text>
          <TextInput style={styles.input} value={form.zip} onChangeText={text => handleChange('zip', text)} />

          <Text style={styles.label}>Pays</Text>
          <TextInput style={styles.input} value={form.country} onChangeText={text => handleChange('country', text)} />

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
const AVATAR_SIZE = 100;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAF9',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  plusButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'purple',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  label: {
    alignSelf: 'stretch',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  input: {
    alignSelf: 'stretch',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
  },
  disabled: {
    backgroundColor: '#eee',
    color: '#888',
  },
  button: {
    marginTop: 24,
    padding: 14,
    borderRadius: 8,
    backgroundColor: 'purple',
    alignSelf: 'stretch',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
   backButton: {
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'black',
    marginBottom: 16,
    

    },

      backText: {
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
  },
});
