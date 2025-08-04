import { reportUser } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Image,
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';


type ReportReason =
  | 'harassment'
  | 'scam'
  | 'inappropriate_behavior'
  | 'spam'
  | 'violation_of_terms'
  | 'other';

export default function ReportAndBlockScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [reason, setReason] = useState<ReportReason | undefined>(undefined);
  const [customReason, setCustomReason] = useState('');
  const [blockAfterReport, setBlockAfterReport] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [showToast, setShowToast] = useState(false);


  const fadeAnim = useRef(new Animated.Value(0)).current;

  const reasons = [
    { label: 'Harcèlement', value: 'harassment' },
    { label: 'Arnaque', value: 'scam' },
    { label: 'Comportement inapproprié', value: 'inappropriate_behavior' },
    { label: 'Spam', value: 'spam' },
    { label: 'Violation des conditions', value: 'violation_of_terms' },
    { label: 'Autre', value: 'other' },
  ];
  const [attachments, setAttachments] = useState<{ uri: string; name?: string; type?: string }[]>([]);

  // Fonction pour choisir une photo
  const pickImage = async () => {
  if (attachments.length >= 5) {
    Alert.alert('Limite atteinte', 'Vous pouvez ajouter jusqu’à 5 photos maximum.');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.7,
  });
  if (!result.canceled) {
    // Pour Expo SDK >= 49
    const files = result.assets.map(asset => ({
      uri: asset.uri,
      name: asset.fileName || 'photo.jpg',
      type: asset.type || 'image/jpeg',
    }));
    // Limite à 5 au total
    const newAttachments = [...attachments, ...files].slice(0, 5);
    setAttachments(newAttachments);
  }
};

  
  useEffect(() => {
    if (showToast) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setShowToast(false));
        }, 3000);
      });
    }
  }, [showToast, fadeAnim]);

  const handleSubmit = () => {
    if (!reason) {
      return Alert.alert('Erreur', 'Veuillez sélectionner une raison.');
    }
    if (reason === 'other' && !customReason.trim()) {
      return Alert.alert('Erreur', 'Veuillez préciser la raison du signalement.');
    }
    Keyboard.dismiss();
    if (blockAfterReport) {
      setModalVisible(true);
    } else {
      handleFinalSubmit();
    }
  };

  // ...handleFinalSubmit...
  const handleFinalSubmit = async () => {
    setModalVisible(false);
    setLoading(true);
    try {
      await reportUser(
        {
          reportedUserId: userId,
          reason: reason!,
          description: customReason || undefined,
        },
        attachments // <-- Ajoute les fichiers ici
      );
      setReportSent(true);
      setShowToast(true);
      // ...blocage éventuel...
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          {reportSent ? (
            <View style={styles.confirmationContainer}>
              <Text style={styles.title}>Signalement envoyé ✅</Text>
              <Text style={styles.subtitle}>Merci pour votre contribution.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Signaler un utilisateur</Text>
              <Text style={styles.subtitle}>Sélectionnez une raison :</Text>

              {reasons.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.option, reason === r.value && styles.selected]}
                  onPress={() => setReason(r.value as ReportReason)}
                >
                  <Text style={styles.optionText}>{r.label}</Text>
                </TouchableOpacity>
              ))}

              {reason === 'other' && (
                <TextInput
                  style={styles.input}
                  placeholder="Expliquez brièvement..."
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  maxLength={500}
                />
              )}
<TouchableOpacity style={styles.submitButton} onPress={pickImage}>
        <Text style={styles.submitText}>Ajouter une photo</Text>
      </TouchableOpacity>
      <ScrollView horizontal>
        {attachments.map((file, idx) => (
          <Image key={idx} source={{ uri: file.uri }} style={{ width: 80, height: 80, margin: 5, borderRadius: 10 }} />
        ))}
      </ScrollView>
              <TouchableOpacity
                style={[styles.submitButton, loading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitText}>
                  {loading ? 'Envoi en cours...' : 'Envoyer le signalement'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.option, blockAfterReport && styles.selected, { marginTop: 20 }]}
            onPress={() => setBlockAfterReport(!blockAfterReport)}
          >
            <Text style={styles.optionText}>
              {blockAfterReport ? '✅ ' : ''}Bloquer également cet utilisateur
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>

      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirmer le blocage</Text>
            <Text style={styles.modalText}>
              Vous allez également bloquer cet utilisateur. Il ne pourra plus voir votre profil ni vous
              contacter.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#ccc' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#7a5df0' }]}
                onPress={handleFinalSubmit}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showToast && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <Text style={styles.toastText}>Signalement envoyé avec succès.</Text>
          <TouchableOpacity onPress={() => router.back()}
            style={[styles.modalBtn, { backgroundColor: '#7a5df0' }]}>
            <Text style={styles.toastText}>Fermer</Text>
            </TouchableOpacity>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  option: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  selected: {
    backgroundColor: '#f1f0ff',
    borderColor: '#7a5df0',
  },
  optionText: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#7a5df0',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 30,
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    padding: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  toast: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    opacity: 0.95,
    zIndex: 99,
  },
  toastText: {
    color: '#fff',
    fontSize: 15,
  },
});