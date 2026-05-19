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
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={{ color: '#777777', fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#B4B4B4"
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

function PermissionRow({
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

export default function TeamSettingsScreen() {
  const router = useRouter();
  const [sellerName, setSellerName] = useState('Vendeuse');
  const [sellerPhone, setSellerPhone] = useState('');
  const [canSell, setCanSell] = useState(true);
  const [canExpense, setCanExpense] = useState(true);
  const [canClose, setCanClose] = useState(true);
  const [canStock, setCanStock] = useState(false);
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
              Equipe
            </Text>
            <Text style={{ color: '#9A9A9A', fontSize: 15, lineHeight: 21 }}>
              Gere la vendeuse et ce qu elle peut faire.
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
                backgroundColor: '#FF8A4C',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="account" size={25} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: '#111111', fontSize: 17, fontWeight: '900' }}>
                {sellerName || 'Vendeuse'}
              </Text>
              <Text numberOfLines={1} style={{ marginTop: 3, color: '#9A9A9A', fontSize: 13 }}>
                Role vendeur caisse
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 26, gap: 15 }}>
            <Field label="Nom" value={sellerName} onChangeText={setSellerName} placeholder="Nom vendeuse" />
            <Field label="Telephone" value={sellerPhone} onChangeText={setSellerPhone} placeholder="+225 ..." />

            <View style={{ marginTop: 4, gap: 10 }}>
              <Text style={{ color: '#111111', fontSize: 18, fontWeight: '800' }}>Permissions</Text>
              <PermissionRow
                title="Ventes"
                subtitle="Peut enregistrer une vente"
                value={canSell}
                onValueChange={setCanSell}
              />
              <PermissionRow
                title="Sorties"
                subtitle="Peut enregistrer une depense"
                value={canExpense}
                onValueChange={setCanExpense}
              />
              <PermissionRow
                title="Cloture"
                subtitle="Peut compter la caisse"
                value={canClose}
                onValueChange={setCanClose}
              />
              <PermissionRow
                title="Stock"
                subtitle="Peut modifier le stock"
                value={canStock}
                onValueChange={setCanStock}
              />
            </View>

            {saved ? (
              <Text style={{ color: '#2A8D55', fontSize: 13, fontWeight: '800' }}>
                Reglages equipe mis a jour.
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
