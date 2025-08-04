import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Email invalide').required('Email est requis'),
});

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleForgotPassword = async (email: string) => {
    try {
      setLoading(true);

      // 🔁 Requête vers ton endpoint
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/user/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Erreur', data.message || 'Une erreur est survenue.');
      } else {
        Alert.alert(
          'Lien envoyé',
          'Vérifie ta boîte mail pour réinitialiser ton mot de passe.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de traiter la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ flex: 1, width: '100%' }}
      >
        <Animated.View style={{ opacity: fadeAnim, padding: 20 }}>
          <Text style={styles.title}>Mot de passe oublié</Text>
          <Text style={styles.subtitle}>Nous t’enverrons un lien de réinitialisation par email.</Text>

          <Formik
            initialValues={{ email: '' }}
            validationSchema={validationSchema}
            onSubmit={(values) => handleForgotPassword(values.email)}
          >
            {({ handleChange, handleSubmit, values, touched, errors }) => (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={handleChange('email')}
                  value={values.email}
                />
                {touched.email && errors.email && <Text style={styles.error}>{errors.email}</Text>}

                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.6 }]}
                  onPress={() => handleSubmit()}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.replace('/')} // Navigue vers l'écran d'accueil
                  style={styles.linkContainer}
                >
                  <Text style={styles.linkText}>retour à l&apos;écran d&apos;accueil</Text>
                </TouchableOpacity>
              </>
              
            )}
          </Formik>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'purple',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    fontSize: 13,
  },
  button: {
    backgroundColor: 'purple',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
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
