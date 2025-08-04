// app/(auth)/Inscription.tsx
import { registerUser } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ReCaptcha from 'react-native-recaptcha-that-works';
import * as Yup from 'yup';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PADDING = 20;
const INPUT_HEIGHT = 50;
const BUTTON_HEIGHT = 50;
const FORM_WIDTH = SCREEN_WIDTH - PADDING * 2;

// Nombre de bulles à afficher
const BUBBLE_COUNT = 15;

// Schéma de validation avec mot de passe sécurisé et confirmation
const validationSchema = Yup.object().shape({
  name: Yup.string().min(2, 'Trop court').required('Prénom requis'),
  lastname: Yup.string().min(2, 'Trop court').required('Nom requis'),
  username: Yup.string().min(3, 'Trop court').required('Pseudo requis'),
  email: Yup.string().email('Email invalide').required('Email requis'),
  password: Yup.string()
    .min(8, 'Au moins 8 caractères')
    .matches(/(?=.*[A-Z])/, 'Au moins une majuscule')
    .matches(/(?=.*[a-z])/, 'Au moins une minuscule')
    .matches(/(?=.*[0-9])/, 'Au moins un chiffre')
    .matches(/(?=.*[!@#$%^&*])/, 'Au moins un caractère spécial')
    .required('Mot de passe requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Les mots de passe doivent correspondre')
    .required('Confirmation requise'),
});

export const options = {
  title: 'Inscription',
  headerShown: false,
};

export default function Inscription() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const recaptchaRef = useRef<any>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const formikRef = useRef<any>(null);
  // Génération des animations pour les bulles une seule fois
  const bubblesRef = useRef(
    Array.from({ length: BUBBLE_COUNT }).map(() => ({
      anim: new Animated.Value(0),
      left: Math.random() * SCREEN_WIDTH,
      size: 20 + Math.random() * 30,
      delay: Math.random() * 2000,
    }))
  );
  const bubbles = bubblesRef.current;

  useEffect(() => {
    if (showSuccess) {
      bubbles.forEach(({ anim, delay }) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 4000 + Math.random() * 2000,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }
  }, [showSuccess, bubbles]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    setServerError(null);
    try {
      if (!captchaToken) {
        // Lance le captcha si pas encore validé
        recaptchaRef.current?.open();
        setLoading(false);
        return;
      }
      await registerUser(
        values.email,
        values.password,
        values.username,
        values.name,
        values.lastname,
        captchaToken // <-- Passe le token au backend
      );
      setShowSuccess(true);
      setTimeout(() => router.replace('/(tabs)/connexion'), 4000);
    } catch {
      setServerError('Erreur lors de l\'inscription. Veuillez réessayer.');
      // Réinitialise le token captcha en cas d'erreur
      setCaptchaToken(null);
      // ...gestion erreur...
    } finally {
      setLoading(false);
      setCaptchaToken(null); // Réinitialise pour la prochaine inscription
    }
  };

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        {bubbles.map(({ anim, left, size }, i) => {
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [SCREEN_HEIGHT, -size],
          });
          const opacity = anim.interpolate({
            inputRange: [0, 0.8, 1],
            outputRange: [0, 0.6, 0],
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.bubble,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  left,
                  transform: [{ translateY }],
                  opacity,
                },
              ]}
            />
          );
        })}

        <Text style={styles.successTitle}>Succès ! 🎉</Text>
        <Text style={styles.successMessage}>
          Consulte tes mails !{'\n'}Confirme ton compte 🙂
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Créer un compte</Text>
        <Formik
          innerRef={formikRef}
          initialValues={{
            lastname: '',
            name: '',
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.form}>
              {serverError && (
                <Text style={styles.serverError}>{serverError}</Text>
              )}

              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre nom"
                autoCapitalize="words"
                onChangeText={handleChange('lastname')}
                onBlur={handleBlur('lastname')}
                value={values.lastname}
              />
              {touched.lastname && errors.lastname && (
                <Text style={styles.error}>{errors.lastname}</Text>
              )}

              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre prénom"
                autoCapitalize="words"
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                value={values.name}
              />
              {touched.name && errors.name && (
                <Text style={styles.error}>{errors.name}</Text>
              )}

              <Text style={styles.label}>Pseudo</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre pseudo"
                autoCapitalize="none"
                onChangeText={handleChange('username')}
                onBlur={handleBlur('username')}
                value={values.username}
              />
              {touched.username && errors.username && (
                <Text style={styles.error}>{errors.username}</Text>
              )}

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="exemple@domaine.com"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                value={values.email}
              />
              {touched.email && errors.email && (
                <Text style={styles.error}>{errors.email}</Text>
              )}

              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
              />
              {touched.password && errors.password && (
                <Text style={styles.error}>{errors.password}</Text>
              )}

              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                value={values.confirmPassword}
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <Text style={styles.error}>{errors.confirmPassword}</Text>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={() => handleSubmit()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Inscription</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/connexion')}
              >
                <Text style={styles.switchText}>
                  Déjà un compte ?{' '}
                  <Text style={styles.switchLink}>Se connecter</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
        <ReCaptcha
        ref={recaptchaRef}
        siteKey="6LdGMoQrAAAAAB8HugEdL9LrA-hNrrKrxEPiPVsF" // Ton site key
        baseUrl="http://localhost" // ou ton domaine de prod
        onVerify={token => {
          setCaptchaToken(token);
          // Relance la soumission après validation du captcha
          setTimeout(() => onSubmit(formikRef.current?.values), 100);
        }}
        onExpire={() => setCaptchaToken(null)}
        size="invisible"
      />
   
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fafafa' },
  container: { padding: PADDING, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 30, color: '#4B0082' },
  form: { width: FORM_WIDTH },
  label: { marginVertical: 6, fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    height: INPUT_HEIGHT,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  error: { color: '#D32F2F', marginTop: 4, marginBottom: 8, fontSize: 12 },
  serverError: { color: '#D32F2F', marginBottom: 12, textAlign: 'center' },
  button: {
    height: BUTTON_HEIGHT,
    backgroundColor: '#4B0082',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonDisabled: { backgroundColor: '#a189c8' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switchText: { textAlign: 'center', marginTop: 16, color: '#666' },
  switchLink: { color: '#4B0082', fontWeight: '600' },

  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: PADDING,
    backgroundColor: '#fafafa',
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4B0082',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: '#80D8FF',
  },
});
