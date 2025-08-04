import { completeProfile } from '@/lib/api';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  phoneNumber: Yup.string()
    .matches(/^[0-9]{10,15}$/, 'Numéro invalide')
    .required('Numéro requis'),
  address: Yup.string().required('Adresse requise'),
  country: Yup.string().required('Pays requis'),
  city: Yup.string().required('Ville requise'),
  zip: Yup.string().required('Code postal requis'),
  sexe: Yup.string()
    .oneOf(['male', 'femelle', 'autre'], 'Sexe invalide')
    .required('Sexe requis'),
  bornDate: Yup.string()
    .required('Date de naissance requise')
    .test('valid-date', 'Date invalide', (value) => {
      if (!value) return false;
      const [day, month, year] = value.split('/');
      const date = new Date(`${year}-${month}-${day}`);
      return (
        /^\d{2}\/\d{2}\/\d{4}$/.test(value) &&
        date.getDate() === parseInt(day, 10) &&
        date.getMonth() + 1 === parseInt(month, 10) &&
        date.getFullYear() === parseInt(year, 10)
      );
    })
    .test('age-minimum', 'Tu dois avoir au moins 18 ans', (value) => {
      if (!value) return false;
      const [day, month, year] = value.split('/');
      const birthDate = new Date(`${year}-${month}-${day}`);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      return age > 18 || (age === 18 && m >= 0 && today.getDate() >= birthDate.getDate());
    }),
});

export default function ProfilValidation() {
  const [countryCode, setCountryCode] = useState<CountryCode>('FR');
  const [callingCode, setCallingCode] = useState('+33');
  const [selectedCountryName, setSelectedCountryName] = useState('France');

  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#fafafa' }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <>
            <Text style={styles.title}>Complète ton profil</Text>
            <Formik
              initialValues={{
                phoneNumber: '',
                address: '',
                country: '',
                city: '',
                zip: '',
                sexe: '',
                bornDate: '',
              }}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting, setErrors }) => {
                setLoading(true);
                try {
                  await completeProfile({
                    ...values,
                    phoneNumber: callingCode + values.phoneNumber.replace(/^0+/, ''),
                    sexe: values.sexe as 'male' | 'femelle' | 'autre',
                  });
                  setSuccess(true);
                  setStep(2);
                } catch (err: any) {
                  setErrors({ phoneNumber: err?.toString() || 'Erreur' });
                } finally {
                  setLoading(false);
                  setSubmitting(false);
                }
              }}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View>
                  <Text style={styles.label}>Pays & Indicatif</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CountryPicker
                      withCallingCode
                      withFlag
                      withFilter
                      withCountryNameButton
                      countryCode={countryCode}
                      onSelect={(country: Country) => {
                       setCountryCode(country.cca2);
                            setCallingCode(`+${country.callingCode[0]}`);
                         setSelectedCountryName(
                          typeof country.name === 'string'
                          ? country.name
                         : country.name.common || ''
                       );
                       handleChange('country')(
                       typeof country.name === 'string'
                           ? country.name
                             : country.name.common || ''
                       );
                        }}    
                    />
                    <Text style={{ marginLeft: 10 }}>{callingCode}</Text>
                  </View>

                  <Text style={styles.label}>Numéro de téléphone</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="phone-pad"
                    placeholder="XXXXXXXXX"
                    onChangeText={handleChange('phoneNumber')}
                    onBlur={handleBlur('phoneNumber')}
                    value={values.phoneNumber}
                  />
                  {touched.phoneNumber && errors.phoneNumber && (
                    <Text style={styles.error}>{errors.phoneNumber}</Text>
                  )}

                  <Text style={styles.label}>Adresse</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Adresse"
                    onChangeText={handleChange('address')}
                    onBlur={handleBlur('address')}
                    value={values.address}
                  />
                  {touched.address && errors.address && (
                    <Text style={styles.error}>{errors.address}</Text>
                  )}

                  <Text style={styles.label}>Pays</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Pays"
                    onChangeText={handleChange('country')}
                    onBlur={handleBlur('country')}
                    value={values.country}
                  />
                  {touched.country && errors.country && (
                    <Text style={styles.error}>{errors.country}</Text>
                  )}

                  <Text style={styles.label}>Ville</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ville"
                    onChangeText={handleChange('city')}
                    onBlur={handleBlur('city')}
                    value={values.city}
                  />
                  {touched.city && errors.city && (
                    <Text style={styles.error}>{errors.city}</Text>
                  )}

                  <Text style={styles.label}>Code postal</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Code postal"
                    onChangeText={handleChange('zip')}
                    onBlur={handleBlur('zip')}
                    value={values.zip}
                  />
                  {touched.zip && errors.zip && (
                    <Text style={styles.error}>{errors.zip}</Text>
                  )}

                  <Text style={styles.label}>Sexe</Text>
                  <View style={styles.row}>
                    {['male', 'femelle', 'autre'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.sexeButton,
                          values.sexe === option && styles.sexeButtonSelected,
                        ]}
                        onPress={() => handleChange('sexe')(option)}
                      >
                        <Text
                          style={[
                            styles.sexeButtonText,
                            values.sexe === option && styles.sexeButtonTextSelected,
                          ]}
                        >
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {touched.sexe && errors.sexe && (
                    <Text style={styles.error}>{errors.sexe}</Text>
                  )}

                  <Text style={styles.label}>Date de naissance</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="JJ/MM/AAAA"
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^\d]/g, '').slice(0, 8);
                      let formatted = cleaned;
                      if (cleaned.length >= 5)
                        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
                      else if (cleaned.length >= 3)
                        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
                      handleChange('bornDate')(formatted);
                    }}
                    onBlur={handleBlur('bornDate')}
                    value={values.bornDate}
                  />
                  {touched.bornDate && errors.bornDate && (
                    <Text style={styles.error}>{errors.bornDate}</Text>
                  )}

                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#FFA500', marginTop: 20 }]}
                    onPress={() => handleSubmit()}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Envoi...' : 'Valider mon profil'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </>
        )}

        {step === 2 && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={styles.successTitle}>🎉 Bravo, profil complété !</Text>
            <Text style={styles.successMessage}>
              Tu peux maintenant faire laver ton linge facilement et rapidement !
            </Text>
            <View style={styles.animatedBox}>
              <Text style={{ fontSize: 32, marginBottom: 10 }}>🧺</Text>
              <Text style={{ fontSize: 18, color: '#555', textAlign: 'center' }}>
                Crée du revenu en lavant du linge !
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 30 }}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#4CAF50', marginRight: 10 }]}
                onPress={() => {
                  Alert.alert('Validation d\'identité', 'Cette étape sera disponible prochainement.');
                }}
              >
                <Text style={styles.buttonText}>Je valide mon identité</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#888' }]}
                onPress={() => router.replace('/(tabs)/profil')}
              >
                <Text style={styles.buttonText}>Plus tard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fafafa',
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'purple',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 48,
    marginTop: 4,
    backgroundColor: '#fff',
  },
  error: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    marginTop: 8,
  },
  sexeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: '#eee',
  },
  sexeButtonSelected: {
    backgroundColor: '#FFA500',
    borderColor: '#FF8C00',
  },
  sexeButtonText: {
    color: '#555',
    textAlign: 'center',
    fontWeight: '600',
  },
  sexeButtonTextSelected: {
    color: '#fff',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  animatedBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
