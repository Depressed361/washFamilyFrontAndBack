import axios from 'axios';
import { parseISO } from 'date-fns';
import Constants from 'expo-constants';
import { Alert } from 'react-native';
import { User } from '../app/models/user'; // Assurez-vous que le chemin est correct
 // Assurez-vous que le chemin est correct
import { getAccessToken, getRefreshToken, removeToken, storeTokens } from './storage';





 const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Fonction pour récupérer l'IP locale en dev
const getLocalApiUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${debuggerHost}:3000`;
};

const API_URL = getLocalApiUrl();

let user!: User ; // Variable pour stocker l'objet utilisateur
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/users/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
      credentials: 'include', // nécessaire si tu utilises les cookies sécurisés
    });

    if (!res.ok) return null;

    const data = await res.json();
    const newAccessToken = data.accessToken ?? null;

    if (newAccessToken) {
      await storeTokens(newAccessToken, refreshToken);
      return newAccessToken;
    }

    return null;
  } catch (err) {
    console.error('Erreur lors du refresh token :', err);
    return null;
  }
}

/**
 * Fonction de requête avec token d'authentification, auto-refresh si expiré
 */
export async function fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
  let token = await getAccessToken();

  const headers: HeadersInit = {
    ...(init?.headers || {}),
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };

  let response = await fetch(input, {
    ...init,
    headers,
  });

  // Si le token est expiré → on tente un refresh
  if (response.status === 401) {
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      await removeToken(); // déconnexion sécurisée
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    const retryHeaders: HeadersInit = {
      ...(init?.headers || {}),
      Authorization: `Bearer ${newAccessToken}`,
      'Content-Type': 'application/json',
    };

    response = await fetch(input, {
      ...init,
      headers: retryHeaders,
    });
  }

  return response;
}


// -------------------------------------------------------Fonctions pour les notifications---------------------------------------------
export const getNotificationsForClient = async (page: number = 1, limit: number = 10 ) => {
  const token = await getAccessToken();
  
  const res = await axios.get(`${API_URL}/notifications/type=client?page${page}&limit${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // Liste des notifications
}

export const getNotificationsForWasher = async (page: number = 1, limit: number = 10 ) => {
  const token = await getAccessToken();
  
  const res = await axios.get(`${API_URL}/notifications/type=washer?page${page}&limit${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.notifications; // Liste des notifications
}

// Fonction pour marquer une notification comme lue
export const markAsRead = async (id: string) => {
  const token = await getAccessToken();
  const res = await axios.patch(`${API_URL}/notifications/${id}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // Détails de la notification marquée comme lue
};

//-----------------------------------------------------------Fonctions pour l'utilisateur-------------------------------------------------------------


export const  registerUser = async (email:string , password:string ,lastname:string, username: string, name:string, capchaToken:string ) => {
  try {
    // Convertir l'email en minuscule
    const normalizedEmail = email.toLowerCase();

    // Log des données envoyées dans la requête
    console.log('Données envoyées :', { email: normalizedEmail, password, username,lastname, name, capchaToken });

    const response = await axios.post(
      `${API_URL}/users/register`,
      { email: normalizedEmail, password, username, name ,lastname, capchaToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Réponse d\'inscription :', response.data); // Log pour le débogage
    return response.data; // Retourne les données utilisateur si la requête réussit
  } catch (error: any) {
    if (error.response) {
      console.error('Erreur API :', error.response.data); // Log pour le débogage
      throw error.response.data?.message || 'Une erreur est survenue lors de l\'inscription.';
    }
    if (error.request) {
      console.error('Erreur réseau :', error.request); // Log pour le débogage
      throw 'Impossible de se connecter au serveur. Vérifiez votre connexion réseau.';
    }
    console.error('Erreur inconnue :', error.message); // Log pour le débogage
    throw 'Une erreur inconnue est survenue. Veuillez réessayer.';
  }
}


function fixProfilePictureUrl(url: string): string {
 // Fonction pour corriger l'URL de la photo de profilfunction fixProfilePictureUrl(url: string): string {
  if (!url) return url;
  // Récupère l’IP locale utilisée pour l’API
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (!debuggerHost) return url;
  return url.replace('localhost', debuggerHost).replace('\\', '/');
}   


// Fonction pour connecter un utilisateur
export const loginUser = async (email: string, password: string) => {
  try {
    const normalizedEmail = email.toLowerCase();
    const response = await axios.post(
      `${API_URL}/users/login`,
      { email: normalizedEmail, password },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Correction dynamique de l’URL de la photo de profil
    if (response.data.user && response.data.user.profilePicture) {
      response.data.user.profilePicture = fixProfilePictureUrl(response.data.user.profilePicture);
    }

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error('Erreur API :', error.response.data); // Log pour le débogage
      throw {
        error: error.response.data?.error || 'Erreur inconnue',
        message: error.response.data?.message || 'Une erreur est survenue lors de la connexion.',
        status: error.response.status,
      };
    }

    if (error.request) {
      console.error('Erreur réseau :', error.request);
      throw {
        error: 'Network error',
        message: 'Impossible de se connecter au serveur. Vérifiez votre connexion réseau.',
      };
    }

    console.error('Erreur inconnue :', error.message);
    throw {
      error: 'Unknown error',
      message: 'Une erreur inconnue est survenue. Veuillez réessayer.',
    };
  }
};

export const completeProfile = async (
  profile: {
    phoneNumber: string;
    address: string;
    country: string;
    city: string;
    zip: string;
    sexe: 'male' | 'femelle' | 'autre';
    bornDate: string; // format ISO (ex: '2000-01-01')
  },
 
) => {
  try {
     const token = await getAccessToken();
    const res = await axios.put(
      `${API_URL}/users/profile/complete`,
      profile,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return res.data;
  } catch (error: any) {
    console.error('Erreur lors de la complétion du profil :', error.response?.data || error.message);
    throw error.response?.data?.message || 'Impossible de compléter le profil.';
  }
};


//fonction pour ajouter photo de profil
export const uploadProfilePicture = async (uri: string, token: string) => {
  const form = new FormData();
  form.append('profilePicture', {
    uri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  } as any);

  const res = await fetch(`${API_URL}/users/profile/photo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: form,
  });

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload.message || 'Erreur lors de l’upload');
  }
  return payload.profilePictureUrl;
};

// Fonction pour récupérer le profil utilisateur
export const fetchUserProfile = async (): Promise<User> => {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Aucun token trouvé. Veuillez vous connecter.');
  }

  try {
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    user = response.data.user!; // Stocke directement l'objet utilisateur
    console.log('Utilisateur stocké :', user); // Log pour vérifier
    return user; // Retourne l'objet utilisateur
  }
  
  catch (error: any) {
    if (error.response) {
      console.error('Erreur API :', error.response.data); // Log pour le débogage
      throw error.response.data?.message || 'Impossible de récupérer le profil utilisateur.';
    }

    if (error.request) {
      console.error('Erreur réseau :', error.request); // Log pour le débogage
      throw 'Impossible de se connecter au serveur. Vérifiez votre connexion réseau.';
    }

    console.error('Erreur inconnue :', error.message); // Log pour le débogage
    throw 'Une erreur inconnue est survenue lors de la récupération du profil utilisateur.';
  }
};

// Fonction pour accéder à l'utilisateur stocké
export const getStoredUser = (): User => {
  if (!user) {
    throw new Error('Aucun utilisateur stocké.');
  }
  return user;

}

//fonction pour mettre les informations de l'utilisateur à jour

export const updateUserProfile = async (updates: Partial<User>) => {
  const token = await getAccessToken();
  try {
    const res = await axios.put(
      `${API_URL}/users/profile`,
      updates,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data; // Retourne l'utilisateur mis à jour et le message
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du profil :', error.response?.data || error.message);
    throw error.response?.data?.message || 'Impossible de mettre à jour le profil utilisateur.';
  }
};


//----------------------------Les fonctions pour bloquer/débloquer un utilisateur----------------------------


type ReportUserPayload = {
  reportedUserId: string;
  reason:
    | 'harassment'
    | 'scam'
    | 'inappropriate_behavior'
    | 'spam'
    | 'violation_of_terms'
    | 'other';
  description?: string;
};

// lib/api.ts
type Attachment = {
  uri: string;
  name?: string;
  type?: string;
};

export const reportUser = async (payload: ReportUserPayload, attachments?: Attachment[]) => {
  const token = await getAccessToken();
  const form = new FormData();
  form.append('reportedUserId', payload.reportedUserId);
  form.append('reason', payload.reason);
  if (payload.description) form.append('description', payload.description);

  if (attachments && attachments.length > 0) {
    attachments.forEach((file, idx) => {
      form.append('attachments', {
        uri: file.uri,
        name: file.name || `photo_${idx}.jpg`,
        type: file.type || 'image/jpeg',
      } as any);
    });
  }

  const res = await fetch(`${API_URL}/users/reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: form,
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Erreur de signalement');
  }
};


type BlockUserPayload = {
  blockedUserId: string;
  reason: string;
  asWasher: boolean;
};

export const blockUser = async ({ blockedUserId, reason, asWasher }: BlockUserPayload) => {
  const res = await fetch(`${API_URL}/users/block`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await getAccessToken()}`,
    },
    credentials: 'include',
    body: JSON.stringify({ blockedUserId, reason, asWasher }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Erreur de blocage');
  }
};


// ---------------------------- Les fonctions pour les commandes de lavage ----------------------------

//fonction de geodecodage 
const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      // Retourne l'adresse formatée
      return data.results[0].formatted_address;
    } else {
      console.error('Aucune adresse trouvée pour ces coordonnées.');
      return null;
    }
  } catch (error) {
    console.error('Erreur lors du géocodage inverse :', error);
    return null;
  }
};


//Fonction pour créer une commande de lavage

export const postWashOrder = async (body: {
  washerEmail: string;
  price?: number; // optionnel si non utilisé dans le front
  deplacementClient?: boolean; // optionnel si non utilisé dans le front
  startDate: string;
  dateEnd: string;
  washingType: string;
  washingRecommendation: string;
  dryingType: string;
  dryingRecommendation: string;
  ironing: boolean;
  addressPickup: string;
  addressPickupLinenClean?: string; // optionnel si non utilisé dans le front
}) => {
  const res = await fetch(`${API_URL}/washorders/createwashOrder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await getAccessToken()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Erreur lors de la création de la commande');
  return res.json();
};

// Fonction pour récupérer les laveurs disponibles
export const getAvailableWashers = async ({
  date,
  lat,
  lng,
  startTime,
}: {
  date: string;
  lat: number;
  lng: number;
  startTime: string;
}) => {
  const token = await getAccessToken();
  const url = `${API_URL}/users/washeurs/search?latitude=${lat}&longitude=${lng}&date=${encodeURIComponent(date)}&startTime=${startTime}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ Erreur HTTP getAvailableWashers :", errText);
      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.warn("⚠️ API a répondu un format inattendu :", data);
      return [];
    }

    return data;
  } catch (error) {
    console.error("❌ Erreur réseau ou JSON :", error);
    return [];
  }
};



// Fonction pour récupérer les commandes de lavage pour le client
//-- a ne pas confondre avec les commandes pour lewasheur
export const getClientWashOrders = async () => {
  const token = await getAccessToken();
  const res = await axios.get(`${API_URL}/washorders/clientOrders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // Liste des washOrders du client
};

// Fonction pour récupérer les commandes de lavage par ID pour le client
export const getClientWashOrderById = async (id: string) => {
  const token = await getAccessToken();
  const res = await axios.get(`${API_URL}/washorders/detail/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
return res.data; // Détails de la commande de lavage
  

}

// Fonction pour annuler une commande de lavage par le client
export const cancelWashOrder = async (id: string , reason : string) => {
  const token = await getAccessToken();
  const res = await axios.patch(`${API_URL}/washorders/cancel/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
    data: { reason }, // Envoie la raison d'annulation
  });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(res.data?.message || 'Erreur lors de l’annulation de la commande');
  }
  return res.data; // Retourne les détails de la commande annulée
}


// Fonction pour récupérer les commandes de lavage du washeur
//-- a ne pas confondre avec les commandes du client
export const getNewOrdersOfWasher = async (page: number = 1, limit: number = 10) => {
  const token = await getAccessToken();
  const res = await axios.get(`${API_URL}/washer/newOrders?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // Le backend retourne { orders, meta }
  return res.data; // ou res.data selon ce que tu veux exploiter
};
  
// Fonction pour récupérer les missions du washeur càd les commandes de lavage acceptées
export const getMissionsOfWasher = async (page: number = 1, limit: number = 10) => {
  const token = await getAccessToken();
  
  const res = await axios.get(`${API_URL}/washer/missions?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // Le backend retourne { orders, meta }
  return res.data ; // ou res.data selon ce que tu veux exploiter
}

//fonction pour recupérer la commandes de lavage du washeur par ID
export const getWashOrderForWasher = async (id: string) => {
  const token = await getAccessToken();
  const res = await axios.get(`${API_URL}/washer/washOrderforWasher/${id}`,
     { 
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('Détails de la commande de lavage pour le washeur:', res.data);
  return res.data;
};
  



// fonction pour accepter une commande de lavage par le washeur
export const acceptWashOrder = async (id: string) => {
  const token = await getAccessToken();
    console.log('PATCH', `${API_URL}/washer/orders/${id}/accept`, 'token:', token);
  await axios.patch(`${API_URL}/washer/orders/${id}/accept`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
//-----------------------------suivi pickup Du client---------------------------------------------------

//fonction pour initialiser le pickup d'une commande de lavage
export const clientInitiatePickup = async (id: string) => {
  const token = await getAccessToken();
  // Assurez-vous que l'ID est valide et que le token est récupéré correctement
  if (!id || !token) {
    throw new Error('ID de commande ou token manquant');
  }
  console.log('PATCH', `${API_URL}/washorders/client/pickup/initiate/${id}`, 'token:', token);
  await axios.patch(`${API_URL}/washorders/pickup/initiate/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
 // fonction pour avertir le washeur que le pickup est arrivé Si le client a choisi le déplacement client

 export const clientAwaitingPickupConfirm = async (id: string) => {
  const token = await getAccessToken();
  if (!id || !token) {
    throw new Error('ID de commande ou token manquant');
  }
  console.log('PATCH', `${API_URL}/washorders/client/pickup/awaiting_pickup_confirm/${id}`, 'token:', token);
  await axios.patch(`${API_URL}/washorders/pickup/awaiting/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// confirmation de la recupération du linge du client par le washeur 
// si le client ne se déplace pas pour le pickup
export const clientConfirmPickup = async (id: string) => {
  const token = await getAccessToken();
  console.log('PATCH', `${API_URL}/washorders/client/pickup/confirm/${id}`, 'token:', token);
  await axios.patch(`${API_URL}/washorders/pickup/confirm/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
}



//------------------------------------------suivi pickup du washeur---------------------------------------------------

// Fonction pour initier le pickup d'une commande de lavage par le washeur
// si deplacement client est false
export const washerInitiatePickup = async (id: string) => {
  const token = await getAccessToken();
  console.log('PATCH', `${API_URL}/washer/initiatePickup/${id}`, 'token:', token);
  await axios.patch(`${API_URL}/washer/orders/${id}/pickup/initiate`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export const washerAwaitingPickupConfirm = async (id: string) => {
  const token = await getAccessToken();
  console.log('PATCH', `${API_URL}/washer/AwaitingconfirmPickup/${id}g`, 'token:', token);
  await axios.patch(`${API_URL}/washer/orders/${id}/pickup/awaiting`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });

}

// Fonction pour confirmer le depot du linge du client par le washer
//si deplacement client est true


export const washerConfirmPickup = async (id: string) => {
  const token = await getAccessToken();
  console.log('PATCH', `${API_URL}/washer/confirmPickup/${id}`, 'token:', token);
  await axios.patch(`${API_URL}/washer/orders/${id}/pickup/confirm`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

//fonction pour refuser une commande de lavage par le washeur
export const refuseWashOrder = async (id: string) => {
  const token = await getAccessToken();
  await axios.put(`${API_URL}/washer/orders/${id}/refuse`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// 🔒 Utilisation du token dans les headers
const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});


//------------------------------------------------- Fonctions pour les disponibilités -------------------------------------------------------------

// 📥 GET – Récupérer les dispos de l'utilisateur connecté
export const getAvailabilities = async () => {
    try {
      const token = await getAccessToken();
      const res = await axios.get(`${API_URL}/washer/availability/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const parsed = res.data.map((slot: { date: string; startTime: string; endTime: string }) => ({
        ...slot,
        startTime: parseISO(`2000-01-01T${slot.startTime}`),
        endTime: parseISO(`2000-01-01T${slot.endTime}`),
      }));
      return parsed;
    } catch {
      Alert.alert("Erreur", "Impossible de charger les disponibilités");
      return [];
    }
  };

  //Get Récupérer les dispos de l'utilisateur connecté fusionnées avec les dispos par défaut
  // lib/api.ts
export async function getMergedAvailabilities() {
  
  const token = await getAccessToken();
  const res =  await axios.get (`${API_URL}/washer/availability/next7days`, {
    headers: { Authorization: `Bearer ${token}` },
  
  });
  return res.data; // Retourne les disponibilités fusionnées
  
}




// 📤 POST – Ajouter une disponibilité
export const createAvailability = async (
  slots: { date: string; startTime: string; endTime: string }[],
) => {
  const token = await getAccessToken();
  const payload = { slots }; // Le backend attend un objet avec une clé "slots"
  const res = await axios.post(`${API_URL}/washer/availability/`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};  


// POSTER Bloquer une disponibilité
export const blockDay = async (date: string) => {
  const token = await getAccessToken();
  // Le backend attend un objet JSON avec la date à bloquer
  const res = await axios.post(
    `${API_URL}/washer/availability/block`,
    { date }, // envoyé en JSON
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

// POST – Débloquer une disponibilité
export const unblockDay = async (date: string) => {
  const token = await getAccessToken();
  // Le backend attend un objet JSON avec la date à débloquer
  const res = await axios.post(
    `${API_URL}/washer/availability/unblock`,
    { date }, // envoyé en JSON
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

// 🗑️ DELETE – Supprimer une dispo spécifique
export const deleteAvailability = async (slots: {date: string, startTime: string, endTime: string}[],) => {
  const token = await getAccessToken();
  const payload = { slots }; // Le backend attend un objet avec une clé "slots"
  const res = await axios.delete(`${API_URL}/washer/availability/`, {
    headers: { Authorization: `Bearer ${token}` },
    data: payload,
  });
  return res.data;
};

// 🧹 DELETE – Supprimer toutes les dispos expirées
export const cleanAvailabilities = async () => {
  const token = await getAccessToken();
  const res = await axios.delete(`${API_URL}/availability`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  return res.data;
};



// Fonction pour récupérer les disponibilités par défaut
export const getDefaultAvailability = async () => {
  const token = await getAccessToken();
  try {
    const res = await axios.get(`${API_URL}/availability/default/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // Retourne les disponibilités par défaut
  } catch (error: any) {
    console.error('Erreur lors de la récupération des disponibilités par défaut :', error.response?.data || error.message);
    throw error.response?.data?.message || 'Impossible de récupérer les disponibilités par défaut.';
  }
}

// Fonction pour mettre à jour les disponibilités par défaut
export const updateDefaultAvailability = async ( slots: { dayOfWeek: number;
  startTime: string;
  endTime: string;

}[]) => {
    const token = await getAccessToken();
  try {
    const res = await axios.put(`${API_URL}/availability/default`, { slots }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // Retourne les disponibilités mises à jour
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour des disponibilités par défaut :', error.response?.data || error.message);
    throw error.response?.data?.message || 'Impossible de mettre à jour les disponibilités par défaut.';
  }
};

export const setDefaultAvailability = async ( slots: { dayOfWeek: number;
  startTime: string;
  endTime: string;
}[]) => {
  const token = await getAccessToken();
  try {
    const res = await axios.post(`${API_URL}/availability/default`, { slots }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // Retourne les disponibilités par défaut créées
  } catch (error: any) {
    console.error('Erreur lors de la création des disponibilités par défaut :', error.response?.data || error.message);
    throw error.response?.data?.message || 'Impossible de créer les disponibilités par défaut.';
  }
}


// Fonction pour supprimer les disponibilités par défaut
export const deleteDefaultSlot = async (slotId: string) => {
  const token = await getAccessToken();
  if (!slotId || !token) {
    throw new Error('ID de disponibilité ou token manquant');
  }
  try {
    const res = await axios.delete(`${API_URL}/availability/default/${slotId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // Retourne la réponse du serveur
  } catch (error: any) {
    console.error('Erreur lors de la suppression des disponibilités par défaut :', error.response?.data || error.message);
    throw error.response?.data?.message || 'Impossible de supprimer les disponibilités par défaut.';
  }
};






//----------------------------------------------------- Fonctions pour la mise en service du washer ---------------------------------------------




/**
 * Récupère le statut en ligne du laveur connecté.
 * GET /washeur/:id/status
 */
export async function getUserOnlineStatus(): Promise<{ isOnline: boolean }> {
  const token = await getAccessToken();
  const res = await axios.get<{ isOnline: boolean }>(
    `${API_URL}/washer/status`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('Statut en ligne récupéré :', res.data.isOnline); // Log pour vérifier
  return res.data;
}

/**
 * Met à jour le statut en ligne du laveur.
 * PATCH /washeur/orders/:id
 */
export async function updateUserOnlineStatus(
  payload: { isOnline: boolean }
): Promise<{ isOnline: boolean }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Aucun token trouvé. Veuillez vous connecter.');
  }
  const res = await axios.patch<{ isOnline: boolean }>(
    `${API_URL}/washer/status`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}



//-------------------- Fonctions pour la localisation de l'utilisateur --------------------
// POST AFFICHER SA POSITION SUR LA CARTE
export const postUserLocation = async ( location: { latitude: number; longitude: number }) => {
  try {
    const token = await getAccessToken();
    const res = await axios.post(`${API_URL}/users/location`, location, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // Retourne la réponse du serveur
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de la position :', error.response?.data || error.message);
    throw error.response?.data?.message || 'Impossible d\'envoyer la position.';
  }
};


// 📍 GET – Récupérer les laveurs à proximité
export const getNearbyWashers = async () => {
  const token = await getAccessToken();
  try {
    const res = await axios.get(`${API_URL}/users/washers/nearby`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // Retourne la liste des laveurs à proximité
  } catch (error: any) {
    console.error('Erreur lors de la récupération des laveurs à proximité :', error.response?.data || error.message);
    throw error.response?.data?.message || 'Impossible de récupérer les laveurs à proximité.';
  }
};


// Récupérer les laveurs proches d'une commande (par ID de commande)
export const getNearbyWashersForOrder = async (orderId: string, maxDistance: number = 10) => {
  const token = await getAccessToken();
  const res = await axios.get(
    `${API_URL}/washorders/nearby-washers-for-order`,
    {
      params: { orderId, maxDistance },
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data; // Liste des laveurs proches
};

// Envoyer une commande à plusieurs laveurs
export const sendToOtherWashers = async (orderId: string, washerIds: string[]) => {
  const token = await getAccessToken();
  const res = await axios.post(
    `${API_URL}/washorders/sendToOtherWashers`,
    { orderId, washerIds },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data; // Résultat de l'envoi
};