import { useCallback, useEffect, useState } from 'react';
import { getUserPreference } from '@/db/repositories/userPreferenceRepo';
import type { UserPreference } from '@/types/models';

export function useUserPreference() {
  const [preference, setPreference] = useState<UserPreference | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const pref = await getUserPreference();
      setPreference(pref);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { preference, loading, refresh };
}
