import { getExpenseReceiptUri } from '@/lib/control-data';
import { colors } from '@/lib/theme';
import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, Text, View } from 'react-native';

export function ReceiptViewerModal({
  expenseId,
  onClose,
}: {
  expenseId: string | null;
  onClose: () => void;
}) {
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!expenseId) {
      setUri(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    getExpenseReceiptUri(expenseId)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setError(true);
        } else {
          setUri(result);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [expenseId]);

  return (
    <Modal visible={expenseId !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.72)', alignItems: 'center', justifyContent: 'center' }}>
        <Pressable style={{ position: 'absolute', inset: 0 }} onPress={onClose} />

        <View style={{ width: '86%', maxWidth: 420, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Feather name="x" size={20} color={colors.gray900} />
            </Pressable>
          </View>

          <View
            style={{
              width: '100%',
              aspectRatio: 3 / 4,
              borderRadius: 16,
              backgroundColor: colors.white,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : error || !uri ? (
              <View style={{ alignItems: 'center', gap: 8, padding: 24 }}>
                <Feather name="image" size={28} color={colors.gray400} />
                <Text style={{ color: colors.gray500, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                  Photo introuvable
                </Text>
              </View>
            ) : (
              <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
