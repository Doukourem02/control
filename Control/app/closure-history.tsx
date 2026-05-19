import {
  getCashClosures,
  type CashClosureRow,
} from '@/lib/control-data';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
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

function ClosureItem({ closure }: { closure: CashClosureRow }) {
  const balanced = closure.cashGap === 0;
  const gapColor = balanced ? '#34C875' : '#E5484D';
  const status = balanced ? 'Equilibree' : closure.cashGap < 0 ? 'Manquant' : 'Surplus';

  return (
    <View
      style={{
        minHeight: 112,
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
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: '#111111', fontSize: 17, fontWeight: '900' }}>
            {status}
          </Text>
          <Text style={{ marginTop: 3, color: '#9A9A9A', fontSize: 13, fontWeight: '600' }}>
            {formatTime(closure.$createdAt)}
          </Text>
        </View>
        <Text style={{ color: gapColor, fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {formatMoney(closure.cashGap)}
        </Text>
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
    </View>
  );
}

export default function ClosureHistoryScreen() {
  const router = useRouter();
  const todayKey = dateToKey(new Date());
  const [businessDate, setBusinessDate] = useState(todayKey);
  const [closures, setClosures] = useState<CashClosureRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClosures = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoading(true);
    const nextClosures = await getCashClosures(50, businessDate);
    setClosures(nextClosures);
    if (!silent) setLoading(false);
  }, [businessDate]);

  useEffect(() => {
    loadClosures();
  }, [loadClosures]);

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
                <ClosureItem key={closure.$id} closure={closure} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
