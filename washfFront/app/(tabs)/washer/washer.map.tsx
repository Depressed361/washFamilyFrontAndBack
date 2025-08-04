import { getNearbyWashers } from '@/lib/api';
import { getToken } from '@/lib/storage'; // toujours utiliser cette méthode pour récupérer le token
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

export default function WasherMapScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null); // État pour stocker le token
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [washers, setWashers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokenAndData = async () => {
      try {
        // Récupérer le token
        const storedToken = await getToken();
        if (!storedToken) {
          Alert.alert('Erreur', 'Token non disponible. Veuillez vous reconnecter.');
          return;
        }
        setToken(storedToken);

        // Demander la permission de localisation
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', "L'accès à la localisation est requis.");
          return;
        }

        // Obtenir la position actuelle
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation.coords);

        // Récupérer les laveurs à proximité
        const nearby = await getNearbyWashers();
        setWashers(nearby);
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenAndData();
  }, []);

  if (loading || !location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation
    >
      {washers.map((washer, index) => (
        <Marker
          key={index}
          coordinate={{ latitude: washer.latitude, longitude: washer.longitude }}
        >
          <Callout onPress={() => router.push({ pathname: '/profil', params: { id: washer.id } })}>
            <View style={styles.calloutContainer}>
              <Text style={styles.calloutTitle}>{washer.name} {washer.lastname}</Text>
              <Button title="Voir le profil" onPress={() => router.push({ pathname: '/profil', params: { id: washer.id } })} />
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
  },
  calloutContainer: {
    width: 180,
    padding: 8,
  },
  calloutTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
});