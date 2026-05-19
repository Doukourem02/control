import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View
      style={{
        minHeight: 62,
        borderRadius: 20,
        borderCurve: 'continuous',
        backgroundColor: '#F7F7F7',
        borderWidth: 1,
        borderColor: '#EFEFEF',
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: '#111111', fontSize: 15, fontWeight: '900' }}>{title}</Text>
        <Text numberOfLines={1} style={{ marginTop: 2, color: '#9A9A9A', fontSize: 13 }}>
          {subtitle}
        </Text>
      </View>
      <Pressable
        onPress={() => onValueChange(!value)}
        style={({ pressed }: { pressed: boolean }) => ({
          width: 48,
          height: 30,
          borderRadius: 15,
          backgroundColor: value ? '#B7DCF8' : '#E1E1E1',
          padding: 3,
          justifyContent: 'center',
          opacity: pressed ? 0.72 : 1,
        })}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: value ? '#2A8DEB' : '#FFFFFF',
            alignSelf: value ? 'flex-end' : 'flex-start',
          }}
        />
      </Pressable>
    </View>
  );
}

function SmallField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={{ flex: 1, gap: 7 }}>
      <Text style={{ color: '#777777', fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#B4B4B4"
        keyboardType="number-pad"
        style={{
          minHeight: 54,
          borderRadius: 18,
          borderCurve: 'continuous',
          backgroundColor: '#F7F7F7',
          borderWidth: 1,
          borderColor: '#EEEEEE',
          paddingHorizontal: 16,
          color: '#111111',
          fontSize: 16,
          fontWeight: '800',
        }}
      />
    </View>
  );
}

export default function PreferencesScreen() {
  const router = useRouter();
  const [amountsVisible, setAmountsVisible] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [closureReminder, setClosureReminder] = useState(true);
  const [lowStockLimit, setLowStockLimit] = useState('5');
  const [closingHour, setClosingHour] = useState('20');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
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
            <View style={{ width: 38, height: 38 }} />
          </View>

          <View style={{ marginTop: 26, gap: 8 }}>
            <Text style={{ color: '#111111', fontSize: 34, lineHeight: 39, fontWeight: '900' }}>
              Preferences
            </Text>
            <Text style={{ color: '#9A9A9A', fontSize: 15, lineHeight: 21 }}>
              Ajuste le comportement de la caisse.
            </Text>
          </View>

          <View
            style={{
              marginTop: 26,
              minHeight: 76,
              borderRadius: 24,
              borderCurve: 'continuous',
              backgroundColor: '#F7F7F7',
              borderWidth: 1,
              borderColor: '#EFEFEF',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 13,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                borderCurve: 'continuous',
                backgroundColor: '#3B3B3B',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="tune" size={25} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: '#111111', fontSize: 17, fontWeight: '900' }}>
                Caisse simple
              </Text>
              <Text numberOfLines={1} style={{ marginTop: 3, color: '#9A9A9A', fontSize: 13 }}>
                Alertes, visibilite et fin de journee
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 26, gap: 12 }}>
            <ToggleRow
              title="Afficher les montants"
              subtitle="Les totaux restent visibles dans l app"
              value={amountsVisible}
              onValueChange={setAmountsVisible}
            />
            <ToggleRow
              title="Alerte stock faible"
              subtitle="Signaler les produits proches de la rupture"
              value={stockAlerts}
              onValueChange={setStockAlerts}
            />
            <ToggleRow
              title="Rappel cloture"
              subtitle="Rappeler de compter la caisse en fin de journee"
              value={closureReminder}
              onValueChange={setClosureReminder}
            />
          </View>

          <View style={{ marginTop: 22, flexDirection: 'row', gap: 12 }}>
            <SmallField
              label="Seuil stock"
              value={lowStockLimit}
              onChangeText={setLowStockLimit}
              placeholder="5"
            />
            <SmallField
              label="Heure cloture"
              value={closingHour}
              onChangeText={setClosingHour}
              placeholder="20"
            />
          </View>

          {saved ? (
            <Text style={{ marginTop: 15, color: '#2A8D55', fontSize: 13, fontWeight: '800' }}>
              Preferences mises a jour.
            </Text>
          ) : null}

          <Pressable
            onPress={handleSave}
            style={({ pressed }: { pressed: boolean }) => ({
              height: 54,
              marginTop: 18,
              borderRadius: 20,
              borderCurve: 'continuous',
              backgroundColor: '#2A8DEB',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 9,
              opacity: pressed ? 0.76 : 1,
            })}
          >
            <Feather name="save" size={20} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900' }}>
              Enregistrer
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
