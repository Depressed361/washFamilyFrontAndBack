import { loginUser } from '@/lib/api';
import { storeTokens } from '@/lib/storage'; // Import the saveToken function
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import * as Yup from 'yup';
import { useUser } from '../../context/user.context'; // Import the useUser hook from the UserProvider

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Email invalide').required('Email est requis'),
  password: Yup.string().required('Mot de passe obligatoire'),
});

export const options = {
  tabBarStyle: { display: 'none' },
};

const Connexion = () => {
  const { setUser } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false); // État pour gérer le chargement

 const handleLogin = async (values: any) => {
  setLoading(true);
  try {
    const user = await loginUser(values.email, values.password);
    await storeTokens(user.token, user.refreshToken); // Enregistre le token et le refreshToken
    setUser(user.user);
    router.push('/(tabs)/role');
  } catch (err: any) {
    console.error('Erreur de connexion détaillée :', JSON.stringify(err, null, 2));

    const errorMessage =
      err?.error ||
      err?.message ||
      err?.response?.data?.error ||
      err?.response?.data?.message;

    if (errorMessage?.includes('Invalid credentials')) {
      Alert.alert('Erreur', 'Utilisateur inconnu');
    } else {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la connexion.');
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <Formik
      initialValues={{
        email: '',
        password: '',
      }}
      validationSchema={validationSchema}
      onSubmit={handleLogin} // ✅ Appelle handleLogin
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Connexion</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            onChangeText={handleChange('email')}
            onBlur={handleBlur('email')}
            value={values.email}
            keyboardType="email-address"
          />
          {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            onChangeText={handleChange('password')}
            onBlur={handleBlur('password')}
            value={values.password}
            secureTextEntry
          />
          {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TouchableOpacity style={styles.button} onPress={() => handleSubmit()} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Connexion</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
                    onPress={() => router.push('/forgotPassword')} // crée cette route
                    style={styles.linkContainer}
                  >
                    <Text style={styles.linkText}>Mot de passe oublié ?</Text>
                  </TouchableOpacity>

          <TouchableOpacity style={styles.linkContainer} onPress={() => router.push('/inscription')}>
            <Text style={styles.linkText}>Inscription</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: '#fff',
    
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#6A0DAD',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal:10,
    height: 50,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#6A0DAD',

  },
  button: {
    backgroundColor: '#6A0DAD',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
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

export default Connexion;