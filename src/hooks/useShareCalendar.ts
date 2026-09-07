import { useCallback, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

/**
 * カレンダーカードを画像として書き出し、OSの共有シートに渡すフック。
 *
 * 画面のスクリーンショットではなく、専用のカード（ShareableCalendarCard）を
 * 画面外にレンダリングして撮る。共有画像に回答内容が写り込まないようにするため。
 */
export function useShareCalendar() {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const share = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('共有できません', 'この端末では共有機能を利用できません。');
        return;
      }

      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        // 画像として書き出すのでファイル実体が要る（共有シートはローカルURIのみ受け付ける）
        result: 'tmpfile',
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        UTI: 'public.png',
        dialogTitle: '今月の振り返りを共有',
      });
    } catch (error) {
      console.warn('[useShareCalendar] 共有に失敗しました', error);
      Alert.alert('共有できませんでした', 'もう一度お試しください。');
    } finally {
      setSharing(false);
    }
  }, [sharing]);

  return { cardRef, share, sharing };
}
