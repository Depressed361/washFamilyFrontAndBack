// hooks/useDefaultAvailability.ts
import { fetchDefaultAvailability } from '@/lib/api';
import { useEffect, useState } from 'react';

export const useDefaultAvailability = () => {
  const [hasDefault, setHasDefault] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDefaultAvailability();
        setHasDefault(data && data.length > 0);
      } catch (err) {
        console.error('Erreur lors de la récupération des disponibilités par défaut', err);
        setHasDefault(false);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { hasDefault, loading };
};