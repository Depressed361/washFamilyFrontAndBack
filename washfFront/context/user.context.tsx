import { removeToken } from '@/lib/storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { fetchUserProfile, getStoredUser, getUserOnlineStatus, updateUserOnlineStatus } from '../lib/api';

type User = {
  id: string;
  name: string;
  lastname: string;
  email: string;
  phoneNumber: string;
  role: string;
  address: string;
  city: string;
  country: string;
  zip: string;
  username: string;
  profilePicture?: string;
  bornDate?: Date;
  washer: boolean;
  sexe: string;
  profileCompleted?: boolean;
  identityVerified?: boolean;
  isVerified?: boolean;
  isOnline?: boolean;
};

type UserContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
  toggleOnline: (value: boolean) => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  logout: async () => {},
  toggleOnline: async () => {},
});

type Props = {
  children: React.ReactNode;
};

export const UserProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load stored or fetched user
    const loadUser = async () => {
      try {
        const userData = getStoredUser();
        const profile = userData ?? await fetchUserProfile();
        setUser(profile);
      } catch (error: unknown) {
        console.error('Erreur profil :', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    // Fetch online status when user is loaded and is washer
    if (user && user.role === 'washer' && user.identityVerified) {
      getUserOnlineStatus()
        .then(({ isOnline }) => setUser(u => u ? { ...u, isOnline } : u))
        .catch(err => console.warn('Statut en ligne non récupéré', err));
    }
  }, [user]);

  const toggleOnline = async (value: boolean) => {
    if (!user) return;
    // Optimistic update
    setUser(u => u ? { ...u, isOnline: value } : u);
    try {
      await updateUserOnlineStatus( { isOnline: value });
    } catch (err) {
      console.error('Erreur mise à jour statut', err);
      // Revert on error
      setUser(u => u ? { ...u, isOnline: !value } : u);
    }
  };

  const logout = async () => {
    try {
      await removeToken();
      setUser(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, toggleOnline }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
