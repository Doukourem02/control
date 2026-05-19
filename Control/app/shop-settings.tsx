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

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={{ color: '#777777', fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#B4B4B4"
        keyboardType={keyboardType}
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
          fontWeight: '700',
        }}
      />
    </View>
  );
}

export default function ShopSettingsScreen() {
  const router = useRouter();
  const [shopName, setShopName] = useState('Boutique Control');
  const [address, setAddress] = useState('Abidjan');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('08:00 - 20:00');
  const [currency, setCurrency] = useState('FCFA');
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
              Boutique
            </Text>
            <Text style={{ color: '#9A9A9A', fontSize: 15, lineHeight: 21 }}>
              Informations visibles pour la caisse et les rapports.
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
                backgroundColor: '#4C9BFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="store" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: '#111111', fontSize: 17, fontWeight: '900' }}>
                {shopName || 'Boutique'}
              </Text>
              <Text numberOfLines={1} style={{ marginTop: 3, color: '#9A9A9A', fontSize: 13 }}>
                {address || 'Adresse non renseignee'}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 26, gap: 15 }}>
            <Field label="Nom boutique" value={shopName} onChangeText={setShopName} placeholder="Nom" />
            <Field label="Adresse" value={address} onChangeText={setAddress} placeholder="Adresse" />
            <Field
              label="Telephone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+225 ..."
              keyboardType="phone-pad"
            />
            <Field label="Horaires" value={hours} onChangeText={setHours} placeholder="08:00 - 20:00" />
            <Field label="Devise" value={currency} onChangeText={setCurrency} placeholder="FCFA" />

            {saved ? (
              <Text style={{ color: '#2A8D55', fontSize: 13, fontWeight: '800' }}>
                Informations boutique mises a jour.
              </Text>
            ) : null}

            <Pressable
              onPress={handleSave}
              style={({ pressed }: { pressed: boolean }) => ({
                height: 54,
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
