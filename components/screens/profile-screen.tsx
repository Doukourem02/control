import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

type SettingRowProps = {
  title: string;
  value?: string;
  danger?: boolean;
};

function SettingRow({ title, value, danger }: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => ({
        minHeight: 66,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEDEA',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: pressed ? 0.62 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text
          style={{
            color: danger ? '#D92D4B' : '#211716',
            fontSize: 16,
            fontWeight: '800',
          }}
        >
          {title}
        </Text>
        {value ? (
          <Text style={{ color: '#7C7772', fontSize: 15, fontWeight: '700' }}>{value}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={22} color="#C8C3BE" />
    </Pressable>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const [savedProfile, setSavedProfile] = useState({ firstName: 'Mohamed', lastName: 'DOUKOURE' });
  const [firstName, setFirstName] = useState(savedProfile.firstName);
  const [lastName, setLastName] = useState(savedProfile.lastName);

  const initials = useMemo(
    () =>
      `${firstName.trim().charAt(0) || 'M'}${lastName.trim().charAt(0) || 'D'}`.toUpperCase(),
    [firstName, lastName],
  );
  const hasChanges =
    firstName.trim() !== savedProfile.firstName || lastName.trim() !== savedProfile.lastName;
  const canSave = hasChanges && firstName.trim().length > 0 && lastName.trim().length > 0;
  const saveForeground = canSave ? '#FFFFFF' : '#8E8780';

  function handleSave() {
    if (!canSave) {
      return;
    }

    setSavedProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 42,
        gap: 24,
      }}
    >
      <View
        style={{
          minHeight: 52,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }: { pressed: boolean }) => ({
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: '#F5F5F3',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.62 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={26} color="#111111" />
        </Pressable>

        <Text style={{ color: '#171717', fontSize: 21, fontWeight: '900' }}>Profil</Text>

        <Pressable
          style={({ pressed }: { pressed: boolean }) => ({
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: '#FFF1F3',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.62 : 1,
          })}
        >
          <Ionicons name="log-out-outline" size={25} color="#D92D4B" />
        </Pressable>
      </View>

      <View style={{ alignItems: 'center', paddingTop: 8, gap: 13 }}>
        <View
          style={{
            width: 112,
            height: 112,
            borderRadius: 56,
            backgroundColor: '#111111',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 5,
            borderColor: '#F5F5F3',
            boxShadow: '0 16px 28px rgba(17, 17, 17, 0.16)',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '900' }}>{initials}</Text>
        </View>

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          style={{ color: '#211716', fontSize: 25, fontWeight: '900', marginTop: 8 }}
        >
          {savedProfile.firstName} {savedProfile.lastName}
        </Text>

        <View
          style={{
            minHeight: 34,
            borderRadius: 17,
            backgroundColor: '#F5F5F3',
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <Ionicons name="storefront-outline" size={16} color="#6E6760" />
          <Text style={{ color: '#6E6760', fontSize: 14, fontWeight: '800' }}>Compte vendeur</Text>
        </View>
      </View>

      <View
        style={{
          borderRadius: 28,
          backgroundColor: '#F8F7F4',
          padding: 18,
          gap: 14,
        }}
      >
        <Text style={{ color: '#171717', fontSize: 18, fontWeight: '900' }}>
          Informations personnelles
        </Text>

        <View
          style={{
            borderRadius: 20,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#EEEDEA',
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 5,
          }}
        >
          <Text style={{ color: '#817A73', fontSize: 13, fontWeight: '800' }}>Prénom</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Prénom"
            placeholderTextColor="#B8B2AC"
            style={{ minHeight: 36, color: '#171717', fontSize: 18, fontWeight: '800' }}
          />
        </View>

        <View
          style={{
            borderRadius: 20,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#EEEDEA',
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 5,
          }}
        >
          <Text style={{ color: '#817A73', fontSize: 13, fontWeight: '800' }}>Nom</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Nom"
            placeholderTextColor="#B8B2AC"
            autoCapitalize="characters"
            style={{ minHeight: 36, color: '#171717', fontSize: 18, fontWeight: '800' }}
          />
        </View>

        <Pressable
          disabled={!canSave}
          onPress={handleSave}
          style={({ pressed }: { pressed: boolean }) => ({
            minHeight: 56,
            borderRadius: 20,
            backgroundColor: canSave ? '#111111' : '#DDD8D2',
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            opacity: pressed ? 0.72 : 1,
          })}
        >
          <Ionicons name="checkmark-circle" size={22} color={saveForeground} />
          <Text style={{ color: saveForeground, fontSize: 16, fontWeight: '900' }}>
            Enregistrer
          </Text>
        </Pressable>

        {hasChanges && !canSave ? (
          <Text style={{ color: '#D92D4B', fontSize: 13, fontWeight: '800' }}>
            Le prénom et le nom sont obligatoires.
          </Text>
        ) : null}
      </View>

      <View
        style={{
          borderRadius: 28,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#EEEDEA',
          paddingHorizontal: 18,
          paddingVertical: 4,
        }}
      >
        <SettingRow title="Politique de confidentialité" />
        <SettingRow title="Conditions d'utilisation" />
        <SettingRow title="Nous contacter" />
        <SettingRow title="Suppression de compte" danger />
      </View>

      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: '#A09A94', fontSize: 13, fontWeight: '700' }}>CONTROL</Text>
      </View>
    </ScrollView>
  );
}
