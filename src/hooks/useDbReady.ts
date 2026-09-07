import { useEffect, useState } from 'react';
import { ensureDbReady } from '@/db/client';

/** ルートレイアウトで一度だけ呼び、DBマイグレーション完了を待つ */
export function useDbReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    ensureDbReady().then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return ready;
}
