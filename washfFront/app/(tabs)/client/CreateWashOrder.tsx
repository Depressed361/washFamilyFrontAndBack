// app/(tabs)/CreateWashOrder.tsx
import { useUserView } from '@/context/userView.context';
import { getAvailableWashers, postWashOrder } from '@/lib/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import GooglePlacesAutocomplete from 'react-native-google-places-autocomplete';
import ModalSelector from 'react-native-modal-selector';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getThemeStyles } from '../../theme';
import FinalStepModal from '././CreateWashorderFinalStep';

 // Récupération depuis app.json → expo.extra
 // 1️⃣ On récupère la clé depuis expoConfig.extra ou manifest.extra
const extra = (Constants.expoConfig ?? Constants.manifest)?.extra ?? {};
const GOOGLE_MAPS_API_KEY = extra.googleMapsApiKey as string;

// 2️⃣ On ne throw plus, juste un warn  
if (!GOOGLE_MAPS_API_KEY) {
  console.warn('❗️ Clé Google Maps non trouvée dans expoConfig.extra.googleMapsApiKey');
}
interface Washer {
  email: string;
  Profilepicture: string;
  name: string;
  lastname: string;
  city: string;
  zip: string;
  address: string;
  phoneNumber?: string;
}


export default function CreateWashOrder() {
  const { view, setView } = useUserView();
  const theme = getThemeStyles(view);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const googleRef = useRef<any>(null);

  // Dates & Heures
 const now = new Date();
  const [startDate, setStartDate] = useState<Date>(now);
  const [endDate, setEndDate] = useState<Date>(new Date(now.getTime() + 4 * 60 * 60 * 1000));
  const [showPicker, setShowPicker] = useState<'startDate' | 'startTime' | 'endDate' | 'endTime' | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');


  // Form fields
  const [washingType, setWashingType] = useState('mixte');
  const [washingRecommendation, setWashingRecommendation] = useState('lavage machine');
  const [dryingType, setDryingType] = useState('air');
  const [dryingRecommendation, setDryingRecommendation] = useState('séchage à l’air libre');
  const [ironing, setIroning] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showFinalStep, setShowFinalStep] = useState(false);
  const [washers, setWashers] = useState<Washer[]>([]);
  const [selectedWasher, setSelectedWasher] = useState<Washer | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWasherModal, setShowWasherModal] = useState(false);

  
  // Geoloc
  const handleUseCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return alert('Permission refusée');
    const loc = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = loc.coords;
    setLocation({ lat: latitude, lng: longitude });
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`);
    const data = await res.json();
    if (data.results?.[0]) {
      setManualAddress(data.results[0].formatted_address);
      googleRef.current?.setAddressText(data.results[0].formatted_address);
    }
  };

  // Fetch washers after start & location
  useEffect(() => {
    if (!location) return;
    (async () => {
      const isoDate = startDate.toISOString().split('T')[0];
      const isoTime = startDate.toTimeString().slice(0, 8);
      try {
        const result = await getAvailableWashers({ date: isoDate, lat: location.lat, lng: location.lng, startTime: isoTime });
        setWashers(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [startDate, location]);

  const handleSubmit = async () => {
    if (!selectedWasher || !manualAddress) return alert('Remplis tous les champs');
    if (endDate <= startDate) return alert('Fin doit être après début');
    if ((endDate.getTime() - startDate.getTime()) / 3600000 < 4) return alert('Au moins 4h de diff');

    setLoading(true);
    try {
      await postWashOrder({
        washerEmail: selectedWasher.email,
         startDate: startDate.toISOString(),
        dateEnd: endDate.toISOString(),
        washingType,
        washingRecommendation,
        dryingType,
        dryingRecommendation,
        ironing,
        addressPickup: manualAddress,
        //addressPickuplinenClean: est gerer en backend il a les memes infos que addressPickup
       
      });
      alert('Commande créée');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Erreur');
    } finally {
      setLoading(false);
    }
  };

   const onChangePicker = (event: any, selected?: Date) => {
    if (!selected) {
      setShowPicker(null);
      return;
    }
    // Date mode
    if (pickerMode === 'date') {
      if (showPicker === 'startDate') {
        const newDate = selected < now ? now : selected;
        setStartDate(prev => {
          // keep time
          return new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), prev.getHours(), prev.getMinutes());
        });
        // adjust endDate min
        if (endDate < newDate) {
          setEndDate(new Date(newDate.getTime() + 4 * 3600000));
        }
      } else if (showPicker === 'endDate') {
        const minEnd = selected < startDate ? startDate : selected;
        setEndDate(prev => {
          return new Date(minEnd.getFullYear(), minEnd.getMonth(), minEnd.getDate(), prev.getHours(), prev.getMinutes());
        });
      }
    } else {
      // Time mode
      if (showPicker === 'startTime') {
        const d = new Date(startDate);
        d.setHours(selected.getHours(), selected.getMinutes());
        setStartDate(d);
        // ensure endDate >= startDate +4h
        if (endDate < new Date(d.getTime() + 4 * 3600000)) {
          setEndDate(new Date(d.getTime() + 4 * 3600000));
        }
      } else if (showPicker === 'endTime') {
        const d = new Date(endDate);
        d.setHours(selected.getHours(), selected.getMinutes());
        setEndDate(d < startDate ? startDate : d);
      }
    }
    setShowPicker(null);
  };


  return (
    <SafeAreaView style={[styles.safe, { paddingBottom: insets.bottom }]}>      
      <View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Date & Time pickers */}
        <Text style={styles.label}>Date de début</Text>
        <TouchableOpacity
          style={styles.field}
          onPress={() => { setPickerMode('date'); setShowPicker('startDate'); }}
        >
          <Text>{startDate.toLocaleDateString('fr-FR')}</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Heure de début</Text>
        <TouchableOpacity
          style={styles.field}
          onPress={() => { setPickerMode('time'); setShowPicker('startTime'); }}
        >
          <Text>{startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Date de fin</Text>
        <TouchableOpacity
          style={styles.field}
          onPress={() => { setPickerMode('date'); setShowPicker('endDate'); }}
        >
          <Text>{endDate.toLocaleDateString('fr-FR')}</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Heure de fin</Text>
        <TouchableOpacity
          style={styles.field}
          onPress={() => { setPickerMode('time'); setShowPicker('endTime'); }}
        >
          <Text>{endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={
              showPicker === 'startDate' || showPicker === 'startTime'
                ? startDate
                : endDate
            }
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={pickerMode === 'date'
              ? showPicker === 'startDate' ? now : startDate
              : undefined
            }
            onChange={onChangePicker}
            style={styles.pickerIOS}
            is24Hour={true}
          />
        )}

        <Text style={styles.label}>Adresse manuelle </Text>
        {GOOGLE_MAPS_API_KEY ? (
        <GooglePlacesAutocomplete
              ref={googleRef}
             placeholder="Adresse..."
            fetchDetails
             onPress={(data, details) => {
      if (details?.geometry.location) {
        setManualAddress(data.description);
        setLocation(details.geometry.location);
      }
    }}
    query={{ key: GOOGLE_MAPS_API_KEY, language: 'fr' }}
    styles={{ textInput: styles.field, listView: styles.listView }}
    enablePoweredByContainer={false}
     textInputProps={{}}
  />
) : (
  <Text style={{ color: 'red' }}>Clé Google Maps manquante</Text>
)}
 
       <Text style={styles.label}>ou alors</Text>
        
        <TouchableOpacity style={theme.button} onPress={handleUseCurrentLocation}>
          <Text style={theme.buttonText}>utiliser ma position</Text>
        </TouchableOpacity>

<Text style={styles.label}>Choisir un laveur</Text>
<TouchableOpacity style={theme.button} onPress={() => setShowWasherModal(true)}>
  <Text style={theme.buttonText}>Voir les laveurs disponibles</Text>
</TouchableOpacity>
{selectedWasher && (
  <View style={styles.matchPreview}>
    <Text style={{ fontWeight: '600', fontSize: 16 }}>Sélectionné :</Text>
    <View style={styles.matchCard}>
      <Image source={selectedWasher.Profilepicture ? { uri: selectedWasher.Profilepicture } : require('../../../assets/default-avatar.png')} style={styles.matchAvatar} />
      <View style={{ marginLeft: 12 }}>
        <Text style={styles.washerName}>{selectedWasher.name} {selectedWasher.lastname}</Text>
        <Text style={styles.washerEmail}>{selectedWasher.city}</Text>
      </View>
    </View>
  </View>
)}


        {/* Picker sections */}
        {['Type de lavage', 'Recommandation lavage', 'Type de séchage', 'Recommandation séchage'].map((label, idx) => {
          const items = idx === 0 ? ['soie','blanc','cachemire','synthetique','mixte','coton']
            : idx === 1 ? ['lavage à la main','lavage machine','nettoyage à sec','lavage machine basse température']
            : idx === 2 ? ['air','machine','mixte']
            : ['séchage à l’air libre','séchage en machine','séchage à l’air libre et en machine'];
          const value = idx === 0 ? washingType
            : idx === 1 ? washingRecommendation
            : idx === 2 ? dryingType
            : dryingRecommendation;
          const setter = idx === 0 ? setWashingType
            : idx === 1 ? setWashingRecommendation
            : idx === 2 ? setDryingType
            : setDryingRecommendation;
            console.log('items', items);
          return (
            <View key={idx}>
              <Text style={styles.label}>{label}</Text>
              <ModalSelector
              data={items.map(i => ({ key: i, label: i }))}
              initValue={value}
              onChange={option => setter(option.key)}
              style={styles.pickerWrapper}
              initValueTextStyle={{ color: '#333' }}
              selectTextStyle={{ color: '#333', fontSize: 16 }}
              optionTextStyle={{ color: '#333' }}
              cancelText="Annuler"
              cancelTextStyle={{ color: '#333' }}
              >
              <TouchableOpacity style={styles.field}>
                <Text style={{ color: '#333' }}>{value}</Text>
              </TouchableOpacity>
              </ModalSelector>
            </View>
          );
        })}

        <Text style={styles.label}>Repassage</Text>
        <View style={styles.switchRow}>
          <TouchableOpacity style={[styles.toggle, ironing && styles.toggleActive]} onPress={() => setIroning(!ironing)}>
            <Text style={[styles.toggleText, ironing && { color: '#fff' }]}>{ironing ? 'Oui' : 'Non'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.submitContainer, { paddingBottom: insets.bottom + 10 }]}>  
        <TouchableOpacity
  style={theme.button}
  onPress={() => setShowFinalStep(true)}
  disabled={loading}
>
  <Text style={theme.buttonText}>Finaliser la demande</Text>
</TouchableOpacity>
      </View>
      {/* Ajoute le modal ici */}
    {showFinalStep && selectedWasher && (
      <FinalStepModal
  visible={showFinalStep}
  onClose={() => setShowFinalStep(false)}
  washer={{
    email: selectedWasher?.email ?? '',
    address: selectedWasher?.address ?? '',
    city: selectedWasher?.city ?? '',
    zip: selectedWasher?.zip ?? ''
    
  }}
  manualAddress={manualAddress}
  startDate={startDate}
  endDate={endDate}
  washingType={washingType}
  washingRecommendation={washingRecommendation}
  dryingType={dryingType}
  dryingRecommendation={dryingRecommendation}
  ironing={ironing}
/>
)}
{showWasherModal && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <ScrollView>
        <Text style={styles.label}>Laveurs disponibles</Text>
        {washers.map(w => (
          <TouchableOpacity
            key={w.email}
            style={[styles.matchCard, selectedWasher?.email === w.email && styles.selectedWasher]}
            onPress={() => {
              setSelectedWasher(w);
              setShowWasherModal(false);
            }}
          >
            <Image source={w.Profilepicture ? { uri: w.Profilepicture } : require('../../../assets/default-avatar.png')} style={styles.matchAvatar} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.washerName}>{w.name} {w.lastname}</Text>
              <Text style={styles.washerEmail}>{w.city}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => setShowWasherModal(false)} style={[theme.button, { marginTop: 20 }]}>
          <Text style={theme.buttonText}>Fermer</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  </View>
)}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafafa' },
  container: { padding: 24, backgroundColor: '#fafafa', flexGrow: 1 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 12, color: '#333' },
  backButton: {
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 8,
    backgroundColor:  '#6A0DAD', 
    borderWidth: 1,
    marginBottom: 12,

    
  },
  backText: {
    color:  '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  field: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 14, marginTop: 4, backgroundColor: '#fff' },
  pickerWrapper: {overflow: 'visible',borderWidth: 1, borderColor: '#ccc',borderRadius: 8,marginTop: 4,backgroundColor: '#fff',},
  picker: { height: 50, width: '100%' },
  pickerItem: { height: 50 },
  listView: { backgroundColor: '#fff' },
  gpsButton: { backgroundColor: '#6A0DAD', borderRadius: 8, padding: 14, marginTop: 12, alignItems: 'center' },
  gpsText: { color: '#fff', fontWeight: '700' },
  washerCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 8, backgroundColor: '#fff', marginVertical: 6, borderWidth: 1, borderColor: '#ddd' },
  selectedWasher: { borderColor: '#6A0DAD', borderWidth: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E0E0E0' },
  washerInfo: { marginLeft: 12 },
  washerName: { fontSize: 16, fontWeight: '600', color: '#333' },
  washerEmail: { color: '#666', fontSize: 14 },
  switchRow: { flexDirection: 'row', marginTop: 12 },
  toggle: { flex: 1, padding: 14, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center', backgroundColor: '#fff' },
  toggleActive: { backgroundColor: '#6A0DAD', borderColor: '#6A0DAD' },
  toggleText: 
  { color: '#333', fontWeight: '600' },
  submitContainer:
   { position: 'absolute',  left: 0, right: 0, bottom: 0, backgroundColor: '#fff', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderColor: '#eee' },
  submitBtn: { backgroundColor: '#6A0DAD', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 60, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  pickerIOS: { width: '100%' },
  modalOverlay: {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
},
modalContent: {
  width: '90%',
  maxHeight: '80%',
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 20,
},
matchCard: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12,
  borderRadius: 12,
  backgroundColor: '#f9f9f9',
  marginVertical: 8,
  borderWidth: 1,
  borderColor: '#ddd',
},
matchAvatar: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: '#eee',
},
matchPreview: {
  marginTop: 12,
  backgroundColor: '#fff',
  padding: 12,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#ccc',
},
});