import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Logo (optionnel) */}
      <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
       <View>
        <Image
          source={require('../../assets/WashFamilyLogoPng.png')} // remplace par ton logo réel
          style={styles.logo}
        />
        </View>
      </Animated.View>

      {/* Titre et slogan */}
      <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
        <Text style={styles.title}>WASHFAMILY</Text>
        <Text style={styles.subtitle}>Pressing entre particuliers</Text>
      </Animated.View>

      {/* Boutons */}
      <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/connexion')}>
          <Text style={styles.buttonText}>Connexion</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/inscription')}>
          <Text style={styles.buttonText}>Inscription</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/forgotPassword')} // crée cette route
          style={styles.linkContainer}
        >
          <Text style={styles.linkText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
 logo: {
  width: 100,
  height: 100,
  marginBottom: 20,
  resizeMode: 'contain',
  borderRadius: 30, // Arrondi des angles
  backgroundColor: '#fff',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.18,
  shadowRadius: 8,
  elevation: 8, // Pour 
  
},

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6A0DAD',
    textAlign: 'center',
    
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#6A0DAD',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  linkText: {
    color: 'purple',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
