import {
  correctCashClosure,
  getCashClosures,
  getControlErrorMessage,
  type CashClosureRow,
} from '@/lib/control-data';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function dateToKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateStr: string) {
  return new Date(dateStr + 'T12:00:00');
}

function shiftDateKey(dateStr: string, offset: number) {
  const date = dateFromKey(dateStr);
  date.setDate(date.getDate() + offset);
  return dateToKey(date);
}

function formatBusinessDate(dateStr: string) {
  return dateFromKey(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function CorrectionModal({
  closure,
  visible,
  onClose,
  onSaved,
}: {
  closure: CashClosureRow | null;
  visible: boolean;
  onClose: () => void;
  onSaved: (updated: CashClosureRow) => void;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<typeof TextInput>(null);

  useEffect(() => {
    if (visible && closure) {
      setNote(closure.correctionNote ?? '');
      setError('');
    }
  }, [visible, closure]);

  async function handleSave() {
    if (!closure) return;
    setError('');
    setSaving(true);
    try {
      const updated = await correctCashClosure(closure.$id, note.trim());
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(getControlErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.38)' }}
        onPress={onClose}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 36,
            gap: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#111111', fontSize: 20, fontWeight: '900' }}>
              Correction
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#F7F7F7',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.62 : 1,
              })}
            >
              <Feather name="x" size={18} color="#111111" />
            </Pressable>
          </View>

          <Text style={{ color: '#9A9A9A', fontSize: 13, lineHeight: 18, fontWeight: '600' }}>
            Ajoute une note pour expliquer l&apos;erreur de saisie. Les montants originaux sont conserves pour l&apos;audit.
          </Text>

          {closure ? (
            <View
              style={{
                borderRadius: 18,
                borderCurve: 'continuous',
                backgroundColor: '#F7F7F7',
                borderWidth: 1,
                borderColor: '#EFEFEF',
                padding: 14,
                gap: 6,
              }}
            >
              <Text style={{ color: '#9A9A9A', fontSize: 12, fontWeight: '700' }}>
                Cloture du {formatTime(closure.$createdAt)}
              </Text>
              <Text style={{ color: '#111111', fontSize: 14, fontWeight: '800' }}>
                Attendu {formatMoney(closure.physicalCashExpected)} — Compte {formatMoney(closure.physicalCashActual)} — Ecart {formatMoney(closure.cashGap)}
              </Text>
            </View>
          ) : null}

          <View style={{ gap: 7 }}>
            <Text style={{ color: '#777777', fontSize: 13, fontWeight: '600' }}>Note de correction</Text>
            <TextInput
              ref={inputRef}
              value={note}
              onChangeText={setNote}
              placeholder="Ex : j'ai saisi 5000 au lieu de 15000"
              placeholderTextColor="#B4B4B4"
              multiline
              style={{
                minHeight: 72,
                borderRadius: 16,
                borderCurve: 'continuous',
                backgroundColor: '#F7F7F7',
                borderWidth: 1,
                borderColor: '#EEEEEE',
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: '#111111',
                fontSize: 15,
                fontWeight: '600',
                textAlignVertical: 'top',
              }}
            />
          </View>

          {error ? (
            <Text style={{ color: '#D93D42', fontSize: 13, fontWeight: '700' }}>{error}</Text>
          ) : null}

          <Pressable
            onPress={handleSave}
            disabled={saving || note.trim().length === 0}
            style={({ pressed }: { pressed: boolean }) => ({
              height: 52,
              borderRadius: 18,
              borderCurve: 'continuous',
              backgroundColor: saving || note.trim().length === 0 ? '#9FCAEF' : '#2A8DEB',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              opacity: pressed && note.trim().length > 0 ? 0.76 : 1,
            })}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Feather name="check" size={18} color="#FFFFFF" />
            )}
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
              Enregistrer la correction
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ClosureItem({
  closure,
  onCorrect,
}: {
  closure: CashClosureRow;
  onCorrect: (closure: CashClosureRow) => void;
}) {
  const balanced = closure.cashGap === 0;
  const gapColor = balanced ? '#34C875' : '#E5484D';
  const status = closure.isPartial
    ? 'Partielle'
    : balanced
      ? 'Equilibree'
      : closure.cashGap < 0
        ? 'Manquant'
        : 'Surplus';

  return (
    <View
      style={{
        borderRadius: 24,
        borderCurve: 'continuous',
        backgroundColor: '#F7F7F7',
        borderWidth: 1,
        borderColor: '#EFEFEF',
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text numberOfLines={1} style={{ color: '#111111', fontSize: 17, fontWeight: '900' }}>
                {status}
              </Text>
              {closure.isPartial ? (
                <View
                  style={{
                    borderRadius: 8,
                    backgroundColor: '#FFF3CD',
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ color: '#856404', fontSize: 11, fontWeight: '800' }}>EN COURS</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ marginTop: 3, color: '#9A9A9A', fontSize: 13, fontWeight: '600' }}>
              {formatTime(closure.$createdAt)}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ color: gapColor, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
            {formatMoney(closure.cashGap)}
          </Text>
          <Pressable
            onPress={() => onCorrect(closure)}
            style={({ pressed }: { pressed: boolean }) => ({
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: '#EEEEEE',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.62 : 1,
            })}
          >
            <Feather name="edit-2" size={15} color="#555555" />
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#9A9A9A', fontSize: 12, fontWeight: '700' }}>Attendu</Text>
          <Text style={{ marginTop: 2, color: '#111111', fontSize: 14, fontWeight: '800' }}>
            {formatMoney(closure.physicalCashExpected)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#9A9A9A', fontSize: 12, fontWeight: '700' }}>Compte</Text>
          <Text style={{ marginTop: 2, color: '#111111', fontSize: 14, fontWeight: '800' }}>
            {formatMoney(closure.physicalCashActual)}
          </Text>
        </View>
      </View>

      {closure.correctionNote ? (
        <View
          style={{
            borderRadius: 12,
            backgroundColor: '#FFF8E7',
            borderWidth: 1,
            borderColor: '#FFE9A0',
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 7,
          }}
        >
          <Feather name="alert-circle" size={14} color="#B06D00" style={{ marginTop: 2 }} />
          <Text style={{ flex: 1, color: '#7A4A00', fontSize: 13, fontWeight: '600', lineHeight: 18 }}>
            {closure.correctionNote}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function ClosureHistoryScreen() {
  const router = useRouter();
  const todayKey = dateToKey(new Date());
  const [businessDate, setBusinessDate] = useState(todayKey);
  const [closures, setClosures] = useState<CashClosureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [correcting, setCorrecting] = useState<CashClosureRow | null>(null);

  const loadClosures = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoading(true);
    const nextClosures = await getCashClosures(50, businessDate);
    setClosures(nextClosures);
    if (!silent) setLoading(false);
  }, [businessDate]);

  useEffect(() => {
    loadClosures();
  }, [loadClosures]);

  function handleCorrectionSaved(updated: CashClosureRow) {
    setClosures((prev) => prev.map((c) => (c.$id === updated.$id ? updated : c)));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 36,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 520 }}>
          <View
            style={{
              minHeight: 42,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F7F7F7',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.62 : 1,
              })}
            >
              <Feather name="arrow-left" size={21} color="#111111" />
            </Pressable>
            <Pressable
              onPress={() => loadClosures()}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F7F7F7',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.62 : 1,
              })}
            >
              <Feather name="refresh-cw" size={18} color="#777777" />
            </Pressable>
          </View>

          <View style={{ marginTop: 26, gap: 8 }}>
            <Text style={{ color: '#111111', fontSize: 34, lineHeight: 39, fontWeight: '900' }}>
              Clotures
            </Text>
            <Text style={{ color: '#9A9A9A', fontSize: 15, lineHeight: 21 }}>
              Retrouve les caisses deja cloturees.
            </Text>
          </View>

          <View
            style={{
              marginTop: 22,
              minHeight: 52,
              borderRadius: 20,
              borderCurve: 'continuous',
              backgroundColor: '#F7F7F7',
              borderWidth: 1,
              borderColor: '#EEEEEE',
              paddingHorizontal: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Pressable
              onPress={() => setBusinessDate((current) => shiftDateKey(current, -1))}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.62 : 1,
              })}
            >
              <Feather name="chevron-left" size={22} color="#777777" />
            </Pressable>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ flex: 1, color: '#111111', fontSize: 16, fontWeight: '800', textAlign: 'center' }}
            >
              {formatBusinessDate(businessDate)}
            </Text>
            <Pressable
              disabled={businessDate === todayKey}
              onPress={() => setBusinessDate((current) => shiftDateKey(current, 1))}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: businessDate === todayKey ? 0.28 : pressed ? 0.62 : 1,
              })}
            >
              <Feather name="chevron-right" size={22} color="#777777" />
            </Pressable>
          </View>

          <View style={{ marginTop: 26, gap: 13 }}>
            <Text style={{ color: '#111111', fontSize: 18, fontWeight: '800' }}>
              Historique du {formatBusinessDate(businessDate)}
            </Text>

            {loading ? (
              <View style={{ paddingVertical: 28, alignItems: 'center' }}>
                <ActivityIndicator color="#2A8DEB" />
              </View>
            ) : closures.length === 0 ? (
              <View
                style={{
                  minHeight: 78,
                  borderRadius: 22,
                  borderCurve: 'continuous',
                  backgroundColor: '#F7F7F7',
                  borderWidth: 1,
                  borderColor: '#EFEFEF',
                  padding: 18,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#111111', fontSize: 16, fontWeight: '800' }}>
                  Aucune cloture enregistree
                </Text>
                <Text style={{ marginTop: 5, color: '#9A9A9A', fontSize: 14 }}>
                  Les clotures de caisse apparaitront ici.
                </Text>
              </View>
            ) : (
              closures.map((closure) => (
                <ClosureItem
                  key={closure.$id}
                  closure={closure}
                  onCorrect={setCorrecting}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <CorrectionModal
        closure={correcting}
        visible={correcting !== null}
        onClose={() => setCorrecting(null)}
        onSaved={handleCorrectionSaved}
      />
    </SafeAreaView>
  );
}
