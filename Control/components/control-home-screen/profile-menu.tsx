import { useControlAuth } from '@/lib/control-auth';
import { getShopLogoUri } from '@/lib/control-data';
import { colors } from '@/lib/theme';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SettingsRow, SettingsSection, type ControlExperienceRole } from './shared-ui';
import {
  formatAlertsSummary,
  formatLanguage,
  formatPaymentMethods,
  formatUnit,
  getInitials,
  isAmountsVisibleByDefault,
} from './utils';

export function ProfileMenu({
  compact,
  role,
  memberCount,
  onEditShop,
  onEditCash,
  onEditDisplay,
  onEditAlerts,
  onEditTeam,
  onEditData,
  onEditStores,
}: {
  compact: boolean;
  role: ControlExperienceRole | null;
  memberCount: number;
  onEditShop: () => void;
  onEditCash: () => void;
  onEditDisplay: () => void;
  onEditAlerts: () => void;
  onEditTeam: () => void;
  onEditData: () => void;
  onEditStores: () => void;
}) {
  const { session, signOut } = useControlAuth();
  const shopName = session?.shop.name || 'Boutique';
  const email = session?.user.email || 'Session active';
  const contact = session?.shop.contact || 'Non renseigné';
  const address = session?.shop.address || 'Non renseignée';
  const openingHours = session?.shop.openingHours || 'Non renseignés';
  const currency = session?.shop.currency || 'FCFA';
  const paymentMethods = formatPaymentMethods(session?.shop.paymentMethods);
  const defaultClosingTime = session?.shop.defaultClosingTime || '20:00';
  const amountsPreference = isAmountsVisibleByDefault(session?.shop.amountsVisibleByDefault)
    ? 'Visibles'
    : 'Masqués';
  const displayPreference = `${amountsPreference} · ${formatLanguage(session?.shop.displayLanguage)}`;
  const defaultUnit = formatUnit(session?.shop.defaultUnit);
  const alertsSummary = formatAlertsSummary(session?.shop);
  const teamValue = `${memberCount} membre${memberCount > 1 ? 's' : ''}`;
  const isOwner = role === 'owner';
  // Le manager herite de l'experience UI "owner" mais ne doit pas voir le
  // selecteur de boutiques (reserve au vrai proprietaire du compte).
  const isRealOwner = session?.user.accountRole === 'owner';
  const logoFileId = session?.shop.logoFileId;
  const [logoUri, setLogoUri] = useState<string | null>(null);

  useEffect(() => {
    if (!logoFileId) {
      setLogoUri(null);
      return;
    }
    let cancelled = false;
    getShopLogoUri()
      .then((uri) => {
        if (!cancelled) setLogoUri(uri);
      })
      .catch(() => {
        if (!cancelled) setLogoUri(null);
      });
    return () => {
      cancelled = true;
    };
  }, [logoFileId]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: compact ? 18 : 26,
        paddingBottom: compact ? 104 : 118,
        gap: 18,
      }}
    >
      <View style={{ alignItems: 'center', gap: 9 }}>
        {logoUri ? (
          <Image
            source={{ uri: logoUri }}
            style={{
              width: compact ? 78 : 86,
              height: compact ? 78 : 86,
              borderRadius: compact ? 39 : 43,
              backgroundColor: colors.gray100,
            }}
          />
        ) : (
          <View
            style={{
              width: compact ? 78 : 86,
              height: compact ? 78 : 86,
              borderRadius: compact ? 39 : 43,
              backgroundColor: colors.primarySoft,
              borderWidth: 1,
              borderColor: colors.primaryDisabled,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '800' }}>
              {getInitials(shopName)}
            </Text>
          </View>
        )}
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{ color: colors.gray900, fontSize: 25, lineHeight: 30, fontWeight: '800' }}
          >
            {shopName}
          </Text>
          <Text numberOfLines={1} style={{ color: colors.gray600, fontSize: 15, fontWeight: '500' }}>
            {email}
          </Text>
        </View>
        {isOwner ? (
          <Pressable
            onPress={onEditShop}
            style={({ pressed }: { pressed: boolean }) => ({
              height: 42,
              paddingHorizontal: 24,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.65 : 1,
              marginTop: 8,
            })}
          >
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '800' }}>
              Modifier
            </Text>
          </Pressable>
        ) : (
          <View
            style={{
              height: 34,
              paddingHorizontal: 14,
              borderRadius: 17,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 6,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '800' }}>
              Espace vendeur
            </Text>
          </View>
        )}
      </View>

      <View style={{ gap: 14, marginTop: compact ? 2 : 8 }}>
        <SettingsSection title="Boutique">
          <SettingsRow icon="store" title="Nom" value={shopName} onPress={isOwner ? onEditShop : undefined} />
          <SettingsRow icon="phone-outline" title="Contact" value={contact} onPress={isOwner ? onEditShop : undefined} />
          <SettingsRow icon="map-marker-outline" title="Adresse" value={address} onPress={isOwner ? onEditShop : undefined} />
          <SettingsRow icon="clock-outline" title="Horaires" value={openingHours} onPress={isOwner ? onEditShop : undefined} />
          {isRealOwner ? (
            <SettingsRow icon="shopping-outline" title="Mes boutiques" onPress={onEditStores} />
          ) : null}
        </SettingsSection>

        {isOwner ? (
          <>
            <SettingsSection title="Caisse">
              <SettingsRow icon="cash-register" title="Devise" value={currency} onPress={onEditCash} />
              <SettingsRow icon="credit-card-outline" title="Paiements" value={paymentMethods} onPress={onEditCash} />
              <SettingsRow icon="calendar-clock" title="Clôture" value={defaultClosingTime} onPress={onEditCash} />
            </SettingsSection>

            <SettingsSection title="Préférences">
              <SettingsRow icon="bell-outline" title="Alertes" value={alertsSummary} onPress={onEditAlerts} />
              <SettingsRow icon="eye-outline" title="Affichage" value={displayPreference} onPress={onEditDisplay} />
              <SettingsRow icon="ruler-square" title="Unité" value={defaultUnit} onPress={onEditDisplay} />
              <SettingsRow icon="account-group" title="Équipe" value={teamValue} onPress={onEditTeam} />
              <SettingsRow icon="database-outline" title="Données" value="Exports" onPress={onEditData} />
            </SettingsSection>
          </>
        ) : null}

        <SettingsSection title="Compte">
          <SettingsRow icon="email-outline" title="Email" value={email} />
          <SettingsRow
            icon="logout"
            title="Déconnexion"
            value="Quitter"
            onPress={signOut}
            destructive
          />
        </SettingsSection>
      </View>
    </ScrollView>
  );
}
