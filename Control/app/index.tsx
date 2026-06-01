import { SellerActionTile, type SellerAction } from '@/components/seller-action-tile';
import { useControlAuth } from '@/lib/control-auth';
import {
  exportDailyReport,
  exportHistoryCSV,
  flushOfflineQueue,
  getControlErrorMessage,
  getAnalytics,
  getNotifications,
  getRecentStockMovements,
  getTeamMembers,
  getTodaySummary,
  inviteTeamMember,
  joinShop,
  markAllNotificationsRead,
  markNotificationRead,
  removeTeamMember,
  updateCurrentShop,
  type AnalyticsData,
  type AnalyticsType,
  type MemberRow,
  type NotificationRow,
  type ProductUnit,
  type StockMovementRow,
  type TodaySummary,
} from '@/lib/control-data';
import { logControlError } from '@/lib/control-errors';
import { useNetworkStatus } from '@/lib/network-state';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavKey = 'home' | 'report' | 'missing' | 'profile';

type NavIcon =
  | { family: 'asset'; name: 'home' | 'report' | 'missing' }
  | { family: 'material'; name: ComponentProps<typeof MaterialCommunityIcons>['name'] };

const quickActions: SellerAction[] = [
  {
    title: 'Vente',
    subtitle: 'Nouvelle vente',
    icon: { family: 'feather', name: 'arrow-up-right' },
    accent: '#4C9BFF',
  },
  {
    title: 'Stock',
    subtitle: 'Articles',
    icon: { family: 'material', name: 'cube-outline' },
    accent: '#FF8A4C',
  },
  {
    title: 'Clôture',
    subtitle: 'Fin de journée',
    icon: { family: 'material', name: 'credit-card-outline' },
    accent: '#B94DFF',
  },
  {
    title: 'Sortie',
    subtitle: 'Dépense caisse',
    icon: { family: 'material', name: 'currency-usd' },
    accent: '#3B3B3B',
  },
];

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

function needsShopSetup(session: ReturnType<typeof useControlAuth>['session']) {
  if (!session) return false;

  const shopName = session.shop.name.trim();
  const ownerName = session.shop.ownerName.trim() || session.user.name.trim();

  return (
    !shopName ||
    shopName === 'Ma boutique' ||
    (!!ownerName && shopName.toLowerCase() === `boutique ${ownerName}`.toLowerCase())
  );
}

function getInitials(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) return 'C';

  return words.map((word) => word[0]?.toUpperCase()).join('');
}

function readPaymentMethods(value?: string) {
  const methods = (value || 'Cash,Mobile Money')
    .split(',')
    .map((method) => method.trim())
    .filter(Boolean);

  return methods.length > 0 ? methods : ['Cash', 'Mobile Money'];
}

function formatPaymentMethods(value?: string) {
  return readPaymentMethods(value).join(', ');
}

function isAmountsVisibleByDefault(value?: string) {
  return value !== 'false';
}

function isPreferenceEnabled(value?: string) {
  return value !== 'false';
}

function formatLanguage(value?: string) {
  return value === 'en' ? 'English' : 'Français';
}

function formatUnit(value?: string) {
  const labels: Record<string, string> = {
    kg: 'kg',
    piece: 'pièce',
    carton: 'carton',
    tas: 'tas',
    unite: 'unité',
  };

  return labels[value || 'piece'] ?? 'pièce';
}

function formatAlertsSummary(shop?: {
  stockLowAlertsEnabled?: string;
  closureReminderEnabled?: string;
  cashGapAlertsEnabled?: string;
}) {
  const enabledCount = [
    isPreferenceEnabled(shop?.stockLowAlertsEnabled),
    isPreferenceEnabled(shop?.closureReminderEnabled),
    isPreferenceEnabled(shop?.cashGapAlertsEnabled),
  ].filter(Boolean).length;

  if (enabledCount === 0) return 'Désactivées';
  return `${enabledCount} active${enabledCount > 1 ? 's' : ''}`;
}

function NavAssetIcon({
  name,
  color,
  size,
}: {
  name: 'home' | 'report' | 'missing';
  color: string;
  size: number;
}) {
  const source =
    name === 'home'
      ? require('../assets/icons/home-flaticon-9664027.png')
      : name === 'report'
        ? require('../assets/icons/diagram-flaticon-9637699.png')
        : require('../assets/icons/wallet-flaticon-9122560.png');

  return (
    <Image
      source={source}
      style={{
        width: size,
        height: size,
        resizeMode: 'contain',
        tintColor: color,
      }}
    />
  );
}

function BottomNav({
  active = 'home',
  compact = false,
  onChange,
}: {
  active?: NavKey;
  compact?: boolean;
  onChange?: (key: NavKey) => void;
}) {
  const navHeight = compact ? 66 : 68;
  const itemSize = compact ? 50 : 52;
  const items: {
    key: NavKey;
    icon: NavIcon;
  }[] = [
    { key: 'home', icon: { family: 'asset', name: 'home' } },
    { key: 'report', icon: { family: 'asset', name: 'report' } },
    { key: 'missing', icon: { family: 'asset', name: 'missing' } },
    { key: 'profile', icon: { family: 'material', name: 'cog' } },
  ];

  return (
    <View
      style={{
        alignSelf: 'center',
        width: '66%',
        minWidth: 244,
        maxWidth: 292,
        height: navHeight,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 18px 34px rgba(0, 0, 0, 0.07)',
      }}
    >
      {items.map((item) => {
        const isActive = active === item.key;

        return (
          <Pressable
            key={item.key}
            onPress={() => onChange?.(item.key)}
            style={({ pressed }: { pressed: boolean }) => ({
              width: itemSize,
              height: itemSize,
              borderRadius: itemSize / 2,
              backgroundColor: isActive ? '#F7F7F7' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.64 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            })}
          >
            {item.icon.family === 'asset' ? (
              <NavAssetIcon
                name={item.icon.name}
                size={compact ? 25 : 26}
                color={isActive ? '#050505' : '#A6A6A6'}
              />
            ) : (
              <MaterialCommunityIcons
                name={item.icon.name}
                size={compact ? 25 : 26}
                color={isActive ? '#050505' : '#A6A6A6'}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  destructive = false,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        minHeight: subtitle ? 54 : 45,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.68 : 1,
      })}
    >
      <MaterialCommunityIcons name={icon} size={21} color={destructive ? '#B42318' : '#111111'} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            color: destructive ? '#B42318' : '#111111',
            fontSize: subtitle ? 15 : 16,
            fontWeight: subtitle ? '700' : '500',
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={{ color: '#A4A4A4', fontSize: 13, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text
          numberOfLines={1}
          style={{
            color: '#555555',
            fontSize: 15,
            fontWeight: '500',
            maxWidth: 166,
            textAlign: 'right',
          }}
        >
          {value}
        </Text>
      ) : null}
      {onPress ? <Feather name="chevron-right" size={19} color="#B0B0B0" /> : null}
    </Pressable>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        borderRadius: 22,
        borderCurve: 'continuous',
        backgroundColor: '#F7F7F7',
        paddingHorizontal: 18,
        paddingVertical: 16,
        gap: 7,
      }}
    >
      <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

function ShopSettingsModal({
  visible,
  compact,
  onClose,
  onSaved,
}: {
  visible: boolean;
  compact: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { session } = useControlAuth();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!visible || !session) return;

    setName(needsShopSetup(session) ? '' : session.shop.name);
    setContact(session.shop.contact ?? '');
    setAddress(session.shop.address ?? '');
    setOpeningHours(session.shop.openingHours ?? '');
    setErrorMessage('');
  }, [session, visible]);

  async function handleSave() {
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setErrorMessage('Donne un nom de boutique plus complet.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      await updateCurrentShop({
        name: trimmedName,
        contact,
        address,
        openingHours,
      });
      await onSaved();
      onClose();
    } catch (error) {
      setErrorMessage(getControlErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.24)',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 18,
            paddingBottom: compact ? 24 : 34,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>Boutique</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 13 }}>
                Nom et informations visibles dans CONTROL
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F5F5F5',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.68 : 1,
              })}
            >
              <Feather name="x" size={20} color="#111111" />
            </Pressable>
          </View>

          {[
            { label: 'Nom de la boutique', value: name, onChangeText: setName, placeholder: 'Ex. Chez Awa' },
            { label: 'Contact', value: contact, onChangeText: setContact, placeholder: 'Téléphone ou WhatsApp' },
            { label: 'Adresse', value: address, onChangeText: setAddress, placeholder: 'Quartier, marché, rue' },
            { label: 'Horaires', value: openingHours, onChangeText: setOpeningHours, placeholder: 'Ex. 8h - 20h' },
          ].map((field) => (
            <View key={field.label} style={{ gap: 7 }}>
              <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>{field.label}</Text>
              <TextInput
                value={field.value}
                onChangeText={field.onChangeText}
                placeholder={field.placeholder}
                placeholderTextColor="#A8A8A8"
                style={{
                  height: 52,
                  borderRadius: 18,
                  backgroundColor: '#F7F7F7',
                  paddingHorizontal: 16,
                  color: '#111111',
                  fontSize: 16,
                  fontWeight: field.label === 'Nom de la boutique' ? '700' : '500',
                }}
              />
            </View>
          ))}

          {errorMessage ? (
            <Text style={{ color: '#B42318', fontSize: 13, fontWeight: '700' }}>{errorMessage}</Text>
          ) : null}

          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={({ pressed }: { pressed: boolean }) => ({
              height: 56,
              borderRadius: 22,
              backgroundColor: '#050505',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed || saving ? 0.72 : 1,
            })}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800' }}>Enregistrer</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CashSettingsModal({
  visible,
  compact,
  onClose,
  onSaved,
}: {
  visible: boolean;
  compact: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { session } = useControlAuth();
  const [currency, setCurrency] = useState('FCFA');
  const [cashEnabled, setCashEnabled] = useState(true);
  const [mobileMoneyEnabled, setMobileMoneyEnabled] = useState(true);
  const [defaultClosingTime, setDefaultClosingTime] = useState('20:00');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const currencies = ['FCFA', 'GNF', 'EUR', 'USD'];

  useEffect(() => {
    if (!visible || !session) return;

    const paymentMethods = readPaymentMethods(session.shop.paymentMethods);
    setCurrency(session.shop.currency || 'FCFA');
    setCashEnabled(paymentMethods.includes('Cash'));
    setMobileMoneyEnabled(paymentMethods.includes('Mobile Money'));
    setDefaultClosingTime(session.shop.defaultClosingTime || '20:00');
    setErrorMessage('');
  }, [session, visible]);

  async function handleSave() {
    const paymentMethods = [
      ...(cashEnabled ? ['Cash'] : []),
      ...(mobileMoneyEnabled ? ['Mobile Money'] : []),
    ];

    if (paymentMethods.length === 0) {
      setErrorMessage('Active au moins un mode de paiement.');
      return;
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(defaultClosingTime.trim())) {
      setErrorMessage('Renseigne une heure au format HH:MM.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      await updateCurrentShop({
        currency,
        paymentMethods,
        defaultClosingTime: defaultClosingTime.trim(),
      });
      await onSaved();
      onClose();
    } catch (error) {
      setErrorMessage(getControlErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.24)',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 18,
            paddingBottom: compact ? 24 : 34,
            gap: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>Caisse</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 13 }}>
                Devise, paiements et clôture
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F5F5F5',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.68 : 1,
              })}
            >
              <Feather name="x" size={20} color="#111111" />
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Devise</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {currencies.map((item) => {
                const selected = currency === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() => setCurrency(item)}
                    style={({ pressed }: { pressed: boolean }) => ({
                      height: 42,
                      paddingHorizontal: 16,
                      borderRadius: 21,
                      backgroundColor: selected ? '#050505' : '#F7F7F7',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    <Text style={{ color: selected ? '#FFFFFF' : '#111111', fontSize: 14, fontWeight: '800' }}>
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Modes de paiement</Text>
            {[
              { label: 'Cash', enabled: cashEnabled, onToggle: setCashEnabled },
              { label: 'Mobile Money', enabled: mobileMoneyEnabled, onToggle: setMobileMoneyEnabled },
            ].map((method) => (
              <Pressable
                key={method.label}
                onPress={() => method.onToggle(!method.enabled)}
                style={({ pressed }: { pressed: boolean }) => ({
                  minHeight: 48,
                  borderRadius: 16,
                  backgroundColor: '#F7F7F7',
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '700' }}>{method.label}</Text>
                <MaterialCommunityIcons
                  name={method.enabled ? 'check-circle' : 'circle-outline'}
                  size={23}
                  color={method.enabled ? '#08784F' : '#A8A8A8'}
                />
              </Pressable>
            ))}
          </View>

          <View style={{ gap: 7 }}>
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Heure de clôture par défaut</Text>
            <TextInput
              value={defaultClosingTime}
              onChangeText={setDefaultClosingTime}
              placeholder="20:00"
              placeholderTextColor="#A8A8A8"
              keyboardType="numbers-and-punctuation"
              style={{
                height: 52,
                borderRadius: 18,
                backgroundColor: '#F7F7F7',
                paddingHorizontal: 16,
                color: '#111111',
                fontSize: 16,
                fontWeight: '700',
              }}
            />
          </View>

          {errorMessage ? (
            <Text style={{ color: '#B42318', fontSize: 13, fontWeight: '700' }}>{errorMessage}</Text>
          ) : null}

          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={({ pressed }: { pressed: boolean }) => ({
              height: 56,
              borderRadius: 22,
              backgroundColor: '#050505',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed || saving ? 0.72 : 1,
            })}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800' }}>Enregistrer</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DisplaySettingsModal({
  visible,
  compact,
  onClose,
  onSaved,
}: {
  visible: boolean;
  compact: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { session } = useControlAuth();
  const [amountsVisibleByDefault, setAmountsVisibleByDefault] = useState(true);
  const [displayLanguage, setDisplayLanguage] = useState<'fr' | 'en'>('fr');
  const [defaultUnit, setDefaultUnit] = useState<ProductUnit>('piece');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const languages: { label: string; value: 'fr' | 'en' }[] = [
    { label: 'Français', value: 'fr' },
    { label: 'English', value: 'en' },
  ];
  const units: { label: string; value: ProductUnit }[] = [
    { label: 'kg', value: 'kg' },
    { label: 'pièce', value: 'piece' },
    { label: 'carton', value: 'carton' },
    { label: 'tas', value: 'tas' },
    { label: 'unité', value: 'unite' },
  ];

  useEffect(() => {
    if (!visible || !session) return;

    const language = session.shop.displayLanguage === 'en' ? 'en' : 'fr';
    const validUnits: ProductUnit[] = ['kg', 'piece', 'carton', 'tas', 'unite'];
    const unit = validUnits.includes(session.shop.defaultUnit as ProductUnit)
      ? (session.shop.defaultUnit as ProductUnit)
      : 'piece';

    setAmountsVisibleByDefault(isAmountsVisibleByDefault(session.shop.amountsVisibleByDefault));
    setDisplayLanguage(language);
    setDefaultUnit(unit);
    setErrorMessage('');
  }, [session, visible]);

  async function handleSave() {
    setSaving(true);
    setErrorMessage('');

    try {
      await updateCurrentShop({
        amountsVisibleByDefault,
        displayLanguage,
        defaultUnit,
      });
      await onSaved();
      onClose();
    } catch (error) {
      setErrorMessage(getControlErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.24)',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 18,
            paddingBottom: compact ? 24 : 34,
            gap: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>Affichage</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 13 }}>
                Montants, langue et unités
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F5F5F5',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.68 : 1,
              })}
            >
              <Feather name="x" size={20} color="#111111" />
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Montants</Text>
            <Pressable
              onPress={() => setAmountsVisibleByDefault((visible) => !visible)}
              style={({ pressed }: { pressed: boolean }) => ({
                minHeight: 52,
                borderRadius: 18,
                backgroundColor: '#F7F7F7',
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>
                  Visibles au démarrage
                </Text>
                <Text numberOfLines={1} style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                  {"Tu peux toujours masquer avec l'icône œil"}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={amountsVisibleByDefault ? 'check-circle' : 'circle-outline'}
                size={24}
                color={amountsVisibleByDefault ? '#08784F' : '#A8A8A8'}
              />
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Langue</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {languages.map((item) => {
                const selected = displayLanguage === item.value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setDisplayLanguage(item.value)}
                    style={({ pressed }: { pressed: boolean }) => ({
                      flex: 1,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: selected ? '#050505' : '#F7F7F7',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    <Text style={{ color: selected ? '#FFFFFF' : '#111111', fontSize: 14, fontWeight: '800' }}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Unité par défaut</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {units.map((item) => {
                const selected = defaultUnit === item.value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setDefaultUnit(item.value)}
                    style={({ pressed }: { pressed: boolean }) => ({
                      height: 42,
                      minWidth: 76,
                      paddingHorizontal: 15,
                      borderRadius: 21,
                      backgroundColor: selected ? '#050505' : '#F7F7F7',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    <Text style={{ color: selected ? '#FFFFFF' : '#111111', fontSize: 14, fontWeight: '800' }}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {errorMessage ? (
            <Text style={{ color: '#B42318', fontSize: 13, fontWeight: '700' }}>{errorMessage}</Text>
          ) : null}

          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={({ pressed }: { pressed: boolean }) => ({
              height: 56,
              borderRadius: 22,
              backgroundColor: '#050505',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed || saving ? 0.72 : 1,
            })}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800' }}>Enregistrer</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PreferenceToggle({
  title,
  subtitle,
  enabled,
  onToggle,
}: {
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }: { pressed: boolean }) => ({
        minHeight: 54,
        borderRadius: 18,
        backgroundColor: '#F7F7F7',
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>{title}</Text>
        <Text numberOfLines={1} style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <MaterialCommunityIcons
        name={enabled ? 'check-circle' : 'circle-outline'}
        size={24}
        color={enabled ? '#08784F' : '#A8A8A8'}
      />
    </Pressable>
  );
}

function AlertsSettingsModal({
  visible,
  compact,
  onClose,
  onSaved,
}: {
  visible: boolean;
  compact: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { session } = useControlAuth();
  const [stockLowAlertsEnabled, setStockLowAlertsEnabled] = useState(true);
  const [closureReminderEnabled, setClosureReminderEnabled] = useState(true);
  const [cashGapAlertsEnabled, setCashGapAlertsEnabled] = useState(true);
  const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState('5');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!visible || !session) return;

    setStockLowAlertsEnabled(isPreferenceEnabled(session.shop.stockLowAlertsEnabled));
    setClosureReminderEnabled(isPreferenceEnabled(session.shop.closureReminderEnabled));
    setCashGapAlertsEnabled(isPreferenceEnabled(session.shop.cashGapAlertsEnabled));
    setDefaultLowStockThreshold(session.shop.defaultLowStockThreshold || '5');
    setErrorMessage('');
  }, [session, visible]);

  async function handleSave() {
    const threshold = defaultLowStockThreshold.trim();

    if (!/^\d+$/.test(threshold) || Number(threshold) < 1 || Number(threshold) > 999) {
      setErrorMessage('Renseigne un seuil entre 1 et 999.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      await updateCurrentShop({
        stockLowAlertsEnabled,
        closureReminderEnabled,
        cashGapAlertsEnabled,
        defaultLowStockThreshold: String(Number(threshold)),
      });
      await onSaved();
      onClose();
    } catch (error) {
      setErrorMessage(getControlErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.24)',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 18,
            paddingBottom: compact ? 24 : 34,
            gap: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>Alertes</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 13 }}>
                Préférences avant les notifications
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F5F5F5',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.68 : 1,
              })}
            >
              <Feather name="x" size={20} color="#111111" />
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            <PreferenceToggle
              title="Stock faible"
              subtitle="Signaler les produits sous le seuil"
              enabled={stockLowAlertsEnabled}
              onToggle={() => setStockLowAlertsEnabled((enabled) => !enabled)}
            />
            <PreferenceToggle
              title="Clôture oubliée"
              subtitle="Préparer le rappel de fin de journée"
              enabled={closureReminderEnabled}
              onToggle={() => setClosureReminderEnabled((enabled) => !enabled)}
            />
            <PreferenceToggle
              title="Écart de caisse"
              subtitle="Mettre en avant les écarts détectés"
              enabled={cashGapAlertsEnabled}
              onToggle={() => setCashGapAlertsEnabled((enabled) => !enabled)}
            />
          </View>

          <View style={{ gap: 7 }}>
            <Text style={{ color: '#4A4A4A', fontSize: 13, fontWeight: '700' }}>Seuil stock faible</Text>
            <TextInput
              value={defaultLowStockThreshold}
              onChangeText={setDefaultLowStockThreshold}
              placeholder="5"
              placeholderTextColor="#A8A8A8"
              keyboardType="number-pad"
              style={{
                height: 52,
                borderRadius: 18,
                backgroundColor: '#F7F7F7',
                paddingHorizontal: 16,
                color: '#111111',
                fontSize: 16,
                fontWeight: '700',
              }}
            />
          </View>

          {errorMessage ? (
            <Text style={{ color: '#B42318', fontSize: 13, fontWeight: '700' }}>{errorMessage}</Text>
          ) : null}

          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={({ pressed }: { pressed: boolean }) => ({
              height: 56,
              borderRadius: 22,
              backgroundColor: '#050505',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed || saving ? 0.72 : 1,
            })}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800' }}>Enregistrer</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TeamSettingsModal({
  visible,
  compact,
  onClose,
}: {
  visible: boolean;
  compact: boolean;
  onClose: () => void;
}) {
  const { session } = useControlAuth();
  const ownerName = session?.shop.ownerName || session?.user.name || 'Proprietaire';
  const ownerEmail = session?.user.email || '';
  const userId = session?.user.id ?? '';
  const shopId = session?.shop.$id ?? '';
  const isOwner = !userId || !shopId || userId === shopId;

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  function flash(msg: string, ok = false) {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 3500);
  }

  useEffect(() => {
    if (!visible) return;
    setLoadingMembers(true);
    getTeamMembers()
      .then(setMembers)
      .finally(() => setLoadingMembers(false));
  }, [visible]);

  async function handleInvite() {
    if (inviteLoading) return;
    setInviteLoading(true);
    try {
      const member = await inviteTeamMember({ name: inviteName, email: inviteEmail });
      setMembers((prev) => [member, ...prev]);
      setInviteName('');
      setInviteEmail('');
      setInviteVisible(false);
      flash(`Code d'invitation : ${member.inviteCode}`, true);
    } catch (err: any) {
      flash(getControlErrorMessage(err));
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRemove(memberId: string) {
    try {
      await removeTeamMember(memberId);
      setMembers((prev) => prev.filter((m) => m.$id !== memberId));
    } catch (err: any) {
      flash(getControlErrorMessage(err));
    }
  }

  async function handleJoin() {
    if (joinLoading) return;
    setJoinLoading(true);
    try {
      await joinShop(joinCode.trim().toUpperCase());
      setJoinCode('');
      setJoinVisible(false);
      flash('Tu as rejoint la boutique. Reconnecte-toi pour activer.', true);
    } catch (err: any) {
      flash(getControlErrorMessage(err));
    } finally {
      setJoinLoading(false);
    }
  }

  const activeMembers = members.filter((m) => m.status === 'active');
  const pendingMembers = members.filter((m) => m.status === 'pending');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.24)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <ScrollView
          style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%' }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: compact ? 24 : 34, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>Equipe</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 13 }}>Proprietaire, vendeuses et acces</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38, height: 38, borderRadius: 19, backgroundColor: '#F5F5F5',
                alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.68 : 1,
              })}
            >
              <Feather name="x" size={20} color="#111111" />
            </Pressable>
          </View>

          {/* Feedback */}
          {feedback ? (
            <View style={{ borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: feedback.ok ? '#E8F8F0' : '#FFF3CD' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: feedback.ok ? '#08784F' : '#856404' }}>{feedback.msg}</Text>
            </View>
          ) : null}

          {/* Proprietaire */}
          <View style={{ borderRadius: 20, backgroundColor: '#F7F7F7', padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F4EF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#08784F', fontSize: 15, fontWeight: '800' }}>{getInitials(ownerName)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>{ownerName}</Text>
                {ownerEmail ? <Text numberOfLines={1} style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', marginTop: 1 }}>{ownerEmail}</Text> : null}
              </View>
              <Text style={{ color: '#08784F', fontSize: 11, fontWeight: '800' }}>Owner</Text>
            </View>
          </View>

          {/* Membres actifs */}
          {loadingMembers ? (
            <ActivityIndicator size="small" color="#111111" style={{ alignSelf: 'center', marginVertical: 8 }} />
          ) : activeMembers.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>Vendeuses actives</Text>
              {activeMembers.map((m) => (
                <View key={m.$id} style={{ borderRadius: 16, backgroundColor: '#F7F7F7', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#EAF0FF', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#2A5BE8', fontSize: 13, fontWeight: '800' }}>{getInitials(m.name || m.email)}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: '#111111', fontSize: 14, fontWeight: '700' }}>{m.name || m.email}</Text>
                    {m.name ? <Text numberOfLines={1} style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600' }}>{m.email}</Text> : null}
                  </View>
                  {isOwner ? (
                    <Pressable
                      onPress={() => handleRemove(m.$id)}
                      style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.5 : 1, padding: 4 })}
                    >
                      <Feather name="x" size={16} color="#BBBBBB" />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {/* Invitations en attente */}
          {isOwner && pendingMembers.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>En attente</Text>
              {pendingMembers.map((m) => (
                <View key={m.$id} style={{ borderRadius: 16, backgroundColor: '#F7F7F7', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#F5F0FF', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="clock" size={15} color="#8B5CF6" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: '#111111', fontSize: 14, fontWeight: '700' }}>{m.name || m.email}</Text>
                    <Text style={{ color: '#8B5CF6', fontSize: 12, fontWeight: '700', marginTop: 1 }}>Code : {m.inviteCode}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemove(m.$id)}
                    style={({ pressed }: { pressed: boolean }) => ({ opacity: pressed ? 0.5 : 1, padding: 4 })}
                  >
                    <Feather name="x" size={16} color="#BBBBBB" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {/* Inviter (owner) */}
          {isOwner ? (
            inviteVisible ? (
              <View style={{ borderRadius: 20, backgroundColor: '#F7F7F7', padding: 14, gap: 10 }}>
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>Inviter une vendeuse</Text>
                <TextInput
                  placeholder="Nom"
                  value={inviteName}
                  onChangeText={setInviteName}
                  placeholderTextColor="#AAAAAA"
                  style={{ height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, color: '#111111', fontWeight: '600' }}
                />
                <TextInput
                  placeholder="Email"
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#AAAAAA"
                  style={{ height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, color: '#111111', fontWeight: '600' }}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => { setInviteVisible(false); setInviteName(''); setInviteEmail(''); }}
                    style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#111111', fontSize: 14, fontWeight: '700' }}>Annuler</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleInvite}
                    style={({ pressed }: { pressed: boolean }) => ({ flex: 2, height: 42, borderRadius: 12, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', opacity: pressed || inviteLoading ? 0.68 : 1 })}
                  >
                    {inviteLoading
                      ? <ActivityIndicator size="small" color="#FFFFFF" />
                      : <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Generer le code</Text>}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setInviteVisible(true)}
                style={({ pressed }: { pressed: boolean }) => ({
                  height: 48, borderRadius: 18, backgroundColor: '#111111', flexDirection: 'row',
                  alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.68 : 1,
                })}
              >
                <Feather name="user-plus" size={16} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Inviter une vendeuse</Text>
              </Pressable>
            )
          ) : null}

          {/* Rejoindre (seller / new user) */}
          {!isOwner || (!loadingMembers && activeMembers.length === 0 && pendingMembers.length === 0) ? (
            joinVisible ? (
              <View style={{ borderRadius: 20, backgroundColor: '#F0F4FF', padding: 14, gap: 10 }}>
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>Rejoindre une boutique</Text>
                <TextInput
                  placeholder="Code d'invitation (ex. A3F9C2)"
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                  placeholderTextColor="#AAAAAA"
                  style={{ height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, color: '#111111', fontWeight: '700', letterSpacing: 2 }}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => { setJoinVisible(false); setJoinCode(''); }}
                    style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: '#DDEAFF', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#2A5BE8', fontSize: 14, fontWeight: '700' }}>Annuler</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleJoin}
                    style={({ pressed }: { pressed: boolean }) => ({ flex: 2, height: 42, borderRadius: 12, backgroundColor: '#2A5BE8', alignItems: 'center', justifyContent: 'center', opacity: pressed || joinLoading ? 0.68 : 1 })}
                  >
                    {joinLoading
                      ? <ActivityIndicator size="small" color="#FFFFFF" />
                      : <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Rejoindre</Text>}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setJoinVisible(true)}
                style={({ pressed }: { pressed: boolean }) => ({
                  height: 48, borderRadius: 18, backgroundColor: '#F0F4FF', flexDirection: 'row',
                  alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.68 : 1,
                })}
              >
                <Feather name="log-in" size={16} color="#2A5BE8" />
                <Text style={{ color: '#2A5BE8', fontSize: 14, fontWeight: '700' }}>Rejoindre une boutique</Text>
              </Pressable>
            )
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDateKey(key: string, days: number): string {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDayLabel(key: string): string {
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
}

async function shareExportFile(path: string, options: { mimeType: string; dialogTitle: string }) {
  try {
    const sharing = await import('expo-sharing');
    const available = await sharing.isAvailableAsync();

    if (available) {
      await sharing.shareAsync(path, options);
      return;
    }
  } catch {
    // The current development build may not include ExpoSharing yet.
  }

  throw new Error('Partage indisponible dans ce build. Rebuild le development build pour activer expo-sharing.');
}

function DataSettingsModal({
  visible,
  compact,
  onClose,
}: {
  visible: boolean;
  compact: boolean;
  onClose: () => void;
}) {
  const today = todayDateKey();
  const [pdfDate, setPdfDate] = useState(today);
  const [csvFrom, setCsvFrom] = useState(shiftDateKey(today, -6));
  const [csvTo, setCsvTo] = useState(today);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleExportPDF() {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const { data, filename } = await exportDailyReport(pdfDate);
      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, data, { encoding: FileSystem.EncodingType.Base64 });
      await shareExportFile(path, { mimeType: 'application/pdf', dialogTitle: 'Partager le bilan PDF' });
    } catch (error) {
      showFeedback(getControlErrorMessage(error));
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleExportCSV() {
    if (csvLoading) return;
    if (csvFrom > csvTo) {
      showFeedback('La date de début doit être avant la date de fin.');
      return;
    }
    setCsvLoading(true);
    try {
      const { data, filename } = await exportHistoryCSV(csvFrom, csvTo);
      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, data, { encoding: FileSystem.EncodingType.Base64 });
      await shareExportFile(path, { mimeType: 'text/csv', dialogTitle: "Partager l'historique CSV" });
    } catch (error) {
      showFeedback(getControlErrorMessage(error));
    } finally {
      setCsvLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.24)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 18,
            paddingBottom: compact ? 24 : 34,
            gap: 16,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>Données</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 13 }}>Export et historique</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F5F5F5',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.68 : 1,
              })}
            >
              <Feather name="x" size={20} color="#111111" />
            </Pressable>
          </View>

          {/* Feedback banner */}
          {feedback ? (
            <View style={{ backgroundColor: '#FFF3CD', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ color: '#856404', fontSize: 13, fontWeight: '600' }}>{feedback}</Text>
            </View>
          ) : null}

          {/* Bilan PDF */}
          <View style={{ borderRadius: 18, backgroundColor: '#F7F7F7', padding: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialCommunityIcons name="file-chart-outline" size={22} color="#111111" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>Bilan journalier</Text>
                <Text style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', marginTop: 1 }}>Export PDF</Text>
              </View>
            </View>
            {/* Date selector */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable
                onPress={() => setPdfDate(shiftDateKey(pdfDate, -1))}
                style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }}
              >
                <Feather name="chevron-left" size={16} color="#111111" />
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#EBEBEB', borderRadius: 10, paddingVertical: 6 }}>
                <Text style={{ color: '#111111', fontSize: 13, fontWeight: '700' }}>{formatDayLabel(pdfDate)}</Text>
              </View>
              <Pressable
                onPress={() => pdfDate < today && setPdfDate(shiftDateKey(pdfDate, 1))}
                style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center', opacity: pdfDate >= today ? 0.35 : 1 }}
              >
                <Feather name="chevron-right" size={16} color="#111111" />
              </Pressable>
            </View>
            <Pressable
              onPress={handleExportPDF}
              style={({ pressed }: { pressed: boolean }) => ({
                height: 42,
                borderRadius: 12,
                backgroundColor: '#111111',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed || pdfLoading ? 0.68 : 1,
              })}
            >
              {pdfLoading
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Exporter PDF</Text>
              }
            </Pressable>
          </View>

          {/* Historique CSV */}
          <View style={{ borderRadius: 18, backgroundColor: '#F7F7F7', padding: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialCommunityIcons name="table-arrow-down" size={22} color="#111111" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>Historique</Text>
                <Text style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', marginTop: 1 }}>Export CSV sur une période</Text>
              </View>
            </View>
            {/* From / To */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', width: 38 }}>Début</Text>
                <Pressable
                  onPress={() => setCsvFrom(shiftDateKey(csvFrom, -1))}
                  style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Feather name="chevron-left" size={14} color="#111111" />
                </Pressable>
                <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#EBEBEB', borderRadius: 8, paddingVertical: 5 }}>
                  <Text style={{ color: '#111111', fontSize: 13, fontWeight: '700' }}>{formatDayLabel(csvFrom)}</Text>
                </View>
                <Pressable
                  onPress={() => csvFrom < csvTo && setCsvFrom(shiftDateKey(csvFrom, 1))}
                  style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center', opacity: csvFrom >= csvTo ? 0.35 : 1 }}
                >
                  <Feather name="chevron-right" size={14} color="#111111" />
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', width: 38 }}>Fin</Text>
                <Pressable
                  onPress={() => csvTo > csvFrom && setCsvTo(shiftDateKey(csvTo, -1))}
                  style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center', opacity: csvTo <= csvFrom ? 0.35 : 1 }}
                >
                  <Feather name="chevron-left" size={14} color="#111111" />
                </Pressable>
                <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#EBEBEB', borderRadius: 8, paddingVertical: 5 }}>
                  <Text style={{ color: '#111111', fontSize: 13, fontWeight: '700' }}>{formatDayLabel(csvTo)}</Text>
                </View>
                <Pressable
                  onPress={() => csvTo < today && setCsvTo(shiftDateKey(csvTo, 1))}
                  style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center', opacity: csvTo >= today ? 0.35 : 1 }}
                >
                  <Feather name="chevron-right" size={14} color="#111111" />
                </Pressable>
              </View>
            </View>
            <Pressable
              onPress={handleExportCSV}
              style={({ pressed }: { pressed: boolean }) => ({
                height: 42,
                borderRadius: 12,
                backgroundColor: '#111111',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed || csvLoading ? 0.68 : 1,
              })}
            >
              {csvLoading
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Exporter CSV</Text>
              }
            </Pressable>
          </View>

          {/* Sauvegarde info */}
          <View
            style={{
              minHeight: 52,
              borderRadius: 18,
              backgroundColor: '#F7F7F7',
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <MaterialCommunityIcons name="cloud-check-outline" size={22} color="#111111" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>Sauvegarde</Text>
              <Text style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '600', marginTop: 1 }}>Données isolées par boutique sur Appwrite</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function HomeMenu({
  compact,
  onOpenReport,
  onOpenStock,
  onOpenSale,
  onOpenClosure,
  onOpenExpense,
}: {
  compact: boolean;
  onOpenReport: () => void;
  onOpenStock: () => void;
  onOpenSale: () => void;
  onOpenClosure: () => void;
  onOpenExpense: () => void;
}) {
  return (
    <>
      <View style={{ marginTop: compact ? 24 : 34, gap: compact ? 14 : 18 }}>
        <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>
          Actions rapides
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: compact ? 14 : 18,
          }}
        >
          {quickActions.map((action) => (
            <SellerActionTile
              key={action.title}
              action={action}
              compact={compact}
              onPress={
                action.title === 'Stock'
                  ? onOpenStock
                  : action.title === 'Vente'
                    ? onOpenSale
                    : action.title === 'Clôture'
                      ? onOpenClosure
                      : onOpenExpense
              }
            />
          ))}
        </View>
      </View>

      <Pressable
        onPress={onOpenReport}
        style={({ pressed }: { pressed: boolean }) => ({
          alignSelf: 'center',
          minHeight: compact ? 34 : 38,
          marginTop: compact ? 24 : 34,
          marginBottom: compact ? 46 : 62,
          paddingHorizontal: 18,
          borderRadius: 21,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: pressed ? 0.62 : 1,
        })}
      >
        <Text style={{ color: '#2A8DEB', fontSize: compact ? 15 : 16, fontWeight: '600' }}>
          Ouvrir le bilan
        </Text>
        <Feather name="arrow-right" size={compact ? 19 : 20} color="#2A8DEB" />
      </Pressable>
    </>
  );
}

function getLabelIndices(count: number): number[] {
  if (count === 0) return [];
  if (count <= 4) return Array.from({ length: count }, (_, i) => i);
  return [0, Math.floor((count - 1) * 0.33), Math.floor((count - 1) * 0.66), count - 1];
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTooltipDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatReportDate(dateStr?: string) {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatSectionDate(dateStr?: string) {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatStockMovementDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  return d
    .toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(',', ' à');
}

function getStockMovementLabel(type: StockMovementRow['type']) {
  switch (type) {
    case 'initial':
      return 'Stock initial';
    case 'supply':
      return 'Approvisionnement';
    case 'sale':
      return 'Vente';
    case 'missing':
      return 'Manquant';
    default:
      return 'Ajustement';
  }
}

function formatCalendarMonth(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function dateToKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateStr: string) {
  return new Date(dateStr + 'T12:00:00');
}

function shiftMonth(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1, 12);
}

function buildCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 12);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: firstWeekday }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12));
  }

  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function DashedVerticalLine({ top, height, left }: { top: number; height: number; left: number }) {
  const dashHeight = 6;
  const gap = 5;
  const dashCount = Math.max(0, Math.floor(height / (dashHeight + gap)));

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left, top, height, width: 1, zIndex: 1 }}>
      {Array.from({ length: dashCount }).map((_, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            top: index * (dashHeight + gap),
            width: 1,
            height: dashHeight,
            backgroundColor: '#111111',
            opacity: 0.82,
          }}
        />
      ))}
    </View>
  );
}

function ReportChart({
  data,
  selectedDate,
  amountsVisible,
}: {
  data: AnalyticsData;
  selectedDate: string;
  amountsVisible: boolean;
}) {
  const [chartWidth, setChartWidth] = useState(0);
  const chartHeight = 214;
  const plotTop = 8;
  const plotBottom = 42;
  const plotHeight = chartHeight - plotTop - plotBottom;
  const amountsByDate = new Map(data.chartData.map((point) => [point.date, point.amount]));
  const selectedDateValue = dateFromKey(selectedDate);
  const points = Array.from({ length: 15 }, (_, index) => {
    const date = new Date(selectedDateValue);
    date.setDate(date.getDate() + index - 9);
    const key = dateToKey(date);
    return { date: key, amount: amountsByDate.get(key) ?? 0 };
  });
  const labelIndices = getLabelIndices(points.length);
  const activeIndex = 9;
  const activePoint = points[activeIndex];
  const step = points.length > 1 ? chartWidth / (points.length - 1) : 0;
  const activeX = points.length > 1 ? activeIndex * step : chartWidth / 2;
  const dotY = plotTop + plotHeight * 0.52;
  const tooltipWidth = 128;
  const tooltipHeight = 62;
  const labelWidth = 74;
  const tooltipLeft = Math.min(
    Math.max(activeX - 12, 0),
    Math.max(chartWidth - tooltipWidth, 0)
  );
  const tooltipTop = Math.max(plotTop + 4, dotY - tooltipHeight - 18);

  if (points.length === 0) {
    return (
      <View style={{ height: chartHeight, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#BBBBBB', fontSize: 14, fontWeight: '600' }}>Aucune donnée</Text>
      </View>
    );
  }

  return (
    <View
      onLayout={(event: { nativeEvent: { layout: { width: number } } }) =>
        setChartWidth(event.nativeEvent.layout.width)
      }
      style={{ height: chartHeight, overflow: 'visible' }}
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: plotTop + (plotHeight / 5) * index,
            height: 1,
            backgroundColor: '#EFEFEF',
          }}
        />
      ))}

      {chartWidth > 0 && activePoint ? (
        <>
          <DashedVerticalLine top={plotTop} height={plotHeight} left={activeX} />
          <View
            style={{
              position: 'absolute',
              left: activeX - 4,
              top: dotY - 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#111111',
              zIndex: 4,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: tooltipLeft,
              top: tooltipTop,
              width: tooltipWidth,
              height: tooltipHeight,
              borderRadius: 12,
              borderCurve: 'continuous',
              backgroundColor: '#111111',
              paddingLeft: 22,
              paddingRight: 14,
              paddingVertical: 10,
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: 9,
                top: 13,
                width: 3,
                height: tooltipHeight - 26,
                borderRadius: 2,
                backgroundColor: '#D8D8D8',
              }}
            />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] }}
            >
              {amountsVisible ? formatMoney(activePoint.amount) : '•••'}
            </Text>
            <Text numberOfLines={1} style={{ color: '#8E8E8E', fontSize: 12, fontWeight: '700', marginTop: 3 }}>
              {formatTooltipDate(activePoint.date)}
            </Text>
          </View>
        </>
      ) : null}

      {chartWidth > 0
        ? labelIndices.map((i) => {
            const labelX = points.length > 1 ? i * step : chartWidth / 2;
            const labelLeft = Math.min(
              Math.max(labelX - labelWidth / 2, 0),
              Math.max(chartWidth - labelWidth, 0)
            );

            return (
              <Text
                key={points[i].date}
                numberOfLines={1}
                style={{
                  position: 'absolute',
                  left: labelLeft,
                  bottom: 0,
                  width: labelWidth,
                  color: i === activeIndex ? '#111111' : '#9B9B9B',
                  fontSize: 13,
                  fontWeight: i === activeIndex ? '800' : '600',
                  textAlign: i === 0 ? 'left' : i === points.length - 1 ? 'right' : 'center',
                }}
              >
                {formatDateLabel(points[i].date)}
              </Text>
            );
          })
        : null}
    </View>
  );
}

const emptyAnalytics: AnalyticsData = { total: 0, previousTotal: 0, chartData: [], transactions: [] };

function StockMovementItem({
  movement,
}: {
  movement: StockMovementRow;
}) {
  const isDecrease = movement.type === 'sale' || movement.type === 'missing';
  const accent = isDecrease ? '#E5484D' : '#34C875';
  const iconName: ComponentProps<typeof Feather>['name'] = isDecrease ? 'arrow-up-right' : 'arrow-down-left';
  const signedQuantity = `${isDecrease ? '-' : '+'}${Math.abs(movement.quantity).toLocaleString('fr-FR')} ${movement.unit}`;
  const details = [getStockMovementLabel(movement.type), formatStockMovementDate(movement.$createdAt)]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#F7F7F7',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={iconName} size={20} color={accent} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: '#111111', fontSize: 14, fontWeight: '700' }}>
          {movement.productName}
        </Text>
        <Text numberOfLines={1} style={{ color: '#A4A4A4', fontSize: 12, marginTop: 1 }}>
          {details}
        </Text>
      </View>

      <Text style={{ color: accent, fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
        {signedQuantity}
      </Text>
    </View>
  );
}

function ReportSectionTitle({
  title,
  date,
}: {
  title: string;
  date: string;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: '#111111', fontSize: 16, fontWeight: '800' }}>
        {title}
      </Text>
      <Text style={{ color: '#A4A4A4', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
        {date}
      </Text>
    </View>
  );
}

function ReportMenu({ compact, amountsVisible }: { compact: boolean; amountsVisible: boolean }) {
  const [type, setType] = useState<AnalyticsType>('sales');
  const [days] = useState(15);
  const [selectedDate, setSelectedDate] = useState(() => dateToKey(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [data, setData] = useState<AnalyticsData>(emptyAnalytics);
  const [stockMovements, setStockMovements] = useState<StockMovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    Promise.all([
      getAnalytics(type, days, selectedDate),
      getRecentStockMovements(50, selectedDate),
    ]).then(([result, movements]) => {
      if (cancelled) return;
      setData(result);
      setStockMovements(movements);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [type, days, selectedDate]);

  const trendPct =
    data.previousTotal > 0
      ? ((data.total - data.previousTotal) / data.previousTotal) * 100
      : data.total > 0
        ? 100
        : 0;
  const trendUp = trendPct >= 0;
  const accent = type === 'sales' ? '#2A8DEB' : '#FF6B35';
  const historyAccent = type === 'sales' ? '#34C875' : '#E5484D';
  const reportDateLabel = formatReportDate(selectedDate);
  const sectionDateLabel = formatSectionDate(selectedDate);
  const todayKey = dateToKey(new Date());
  const todayDate = dateFromKey(todayKey);
  const calendarDays = buildCalendarDays(calendarMonth);
  const canGoNextMonth =
    shiftMonth(calendarMonth, 1).getTime() <= new Date(todayDate.getFullYear(), todayDate.getMonth(), 1, 12).getTime();

  function applyDate(nextDate: string) {
    setSelectedDate(nextDate);
    const nextDateValue = dateFromKey(nextDate);
    setCalendarMonth(new Date(nextDateValue.getFullYear(), nextDateValue.getMonth(), 1, 12));
    setDateFilterOpen(false);
  }

  function toggleDateFilter() {
    const selectedDateValue = dateFromKey(selectedDate);
    setCalendarMonth(new Date(selectedDateValue.getFullYear(), selectedDateValue.getMonth(), 1, 12));
    setDateFilterOpen((open) => !open);
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      {/* Toggle Ventes / Sorties */}
      <View
        style={{
          marginTop: compact ? 20 : 28,
          flexDirection: 'row',
          backgroundColor: '#F0F0F0',
          borderRadius: 16,
          padding: 4,
        }}
      >
        {(['sales', 'expenses'] as AnalyticsType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 13,
              backgroundColor: type === t ? '#FFFFFF' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: type === t ? '#111111' : '#9A9A9A' }}>
              {t === 'sales' ? 'Ventes' : 'Sorties'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Date */}
      <View
        style={{
          minHeight: 44,
          marginTop: compact ? 18 : 22,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={toggleDateFilter}
          style={({ pressed }: { pressed: boolean }) => ({
            minHeight: 36,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            opacity: pressed ? 0.62 : 1,
          })}
        >
          <Text style={{ color: '#111111', fontSize: 16, fontWeight: '600' }}>
            {reportDateLabel}
          </Text>
          <MaterialCommunityIcons name="menu-down" size={22} color="#777777" />
        </Pressable>

        <Pressable
          onPress={toggleDateFilter}
          style={({ pressed }: { pressed: boolean }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.68 : 1,
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.045)',
          })}
        >
          <MaterialCommunityIcons name="calendar-month-outline" size={23} color="#2A8DEB" />
        </Pressable>
      </View>

      {dateFilterOpen ? (
        <View
          style={{
            marginTop: 8,
            borderRadius: 22,
            borderCurve: 'continuous',
            backgroundColor: '#F7F7F7',
            borderWidth: 1,
            borderColor: '#EEEEEE',
            padding: 12,
          }}
        >
          <View
            style={{
              minHeight: 36,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <Pressable
              onPress={() => setCalendarMonth((current) => shiftMonth(current, -1))}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.64 : 1,
              })}
            >
              <Feather name="chevron-left" size={20} color="#777777" />
            </Pressable>

            <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800', textTransform: 'capitalize' }}>
              {formatCalendarMonth(calendarMonth)}
            </Text>

            <Pressable
              disabled={!canGoNextMonth}
              onPress={() => setCalendarMonth((current) => shiftMonth(current, 1))}
              style={({ pressed }: { pressed: boolean }) => ({
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !canGoNextMonth ? 0.28 : pressed ? 0.64 : 1,
              })}
            >
              <Feather name="chevron-right" size={20} color="#777777" />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 6 }}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, index) => (
              <Text
                key={`${label}-${index}`}
                style={{
                  flex: 1,
                  color: '#A0A0A0',
                  fontSize: 11,
                  fontWeight: '800',
                  textAlign: 'center',
                }}
              >
                {label}
              </Text>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 }}>
            {calendarDays.map((day, index) => {
              const dayKey = day ? dateToKey(day) : '';
              const isSelected = dayKey === selectedDate;
              const isToday = dayKey === todayKey;
              const isFuture = day ? day.getTime() > todayDate.getTime() : false;

              return (
                <View key={dayKey || `empty-${index}`} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
                  {day ? (
                    <Pressable
                      disabled={isFuture}
                      onPress={() => applyDate(dayKey)}
                      style={({ pressed }: { pressed: boolean }) => ({
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? '#111111' : isToday ? '#EAF4FF' : 'transparent',
                        borderWidth: isToday && !isSelected ? 1 : 0,
                        borderColor: '#B8DCFF',
                        opacity: isFuture ? 0.28 : pressed ? 0.62 : 1,
                      })}
                    >
                      <Text
                        style={{
                          color: isSelected ? '#FFFFFF' : isToday ? '#2A8DEB' : '#111111',
                          fontSize: 14,
                          fontWeight: isSelected || isToday ? '800' : '700',
                        }}
                      >
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={{ width: 38, height: 38 }} />
                  )}
                </View>
              );
            })}
          </View>

          <Pressable
            onPress={() => applyDate(todayKey)}
            style={({ pressed }: { pressed: boolean }) => ({
              alignSelf: 'center',
              minHeight: 34,
              marginTop: 10,
              paddingHorizontal: 14,
              borderRadius: 17,
              backgroundColor: '#FFFFFF',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              opacity: pressed ? 0.64 : 1,
            })}
          >
            <MaterialCommunityIcons name="calendar-today" size={18} color="#2A8DEB" />
            <Text style={{ color: '#111111', fontSize: 13, fontWeight: '800' }}>{"Aujourd'hui"}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Total + tendance */}
      <View style={{ marginTop: compact ? 12 : 16 }}>
        <Text style={{ color: '#9A9A9A', fontSize: 13, fontWeight: '500' }}>
          Total {type === 'sales' ? 'Ventes' : 'Sorties'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
          <Text
            style={{
              color: '#111111',
              fontSize: compact ? 34 : 38,
              fontWeight: '800',
              fontVariant: ['tabular-nums'],
            }}
          >
            {amountsVisible ? formatMoney(data.total) : '•••'}
          </Text>
          {data.previousTotal > 0 && amountsVisible && (
            <Text
              style={{
                color: trendUp ? '#34C875' : '#E5484D',
                fontSize: 13,
                fontWeight: '700',
                paddingBottom: 6,
              }}
            >
              {trendUp ? '↗' : '↘'} {Math.abs(trendPct).toFixed(1)}% vs période préc.
            </Text>
          )}
        </View>
      </View>

      {/* Graphique bilan */}
      <View style={{ marginTop: compact ? 18 : 22 }}>
        {loading ? (
          <View style={{ height: 176, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={accent} />
          </View>
        ) : (
          <ReportChart data={data} selectedDate={selectedDate} amountsVisible={amountsVisible} />
        )}
      </View>

      {/* Historique transactions */}
      {!loading && data.transactions.length > 0 && (
        <View style={{ marginTop: compact ? 22 : 28 }}>
          <ReportSectionTitle title="Mouvements argent" date={sectionDateLabel} />
          <View
            style={{
              paddingVertical: 2,
            }}
          >
            {data.transactions.map((t) => (
              <View
                key={t.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  gap: 12,
                }}
              >
                <View
	                  style={{
	                    width: 40,
	                    height: 40,
	                    borderRadius: 20,
	                    backgroundColor: '#F7F7F7',
	                    alignItems: 'center',
	                    justifyContent: 'center',
	                  }}
	                >
	                  <Feather name="arrow-up-right" size={20} color={historyAccent} />
	                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ color: '#111111', fontSize: 14, fontWeight: '700' }}>
                    {t.label}
                  </Text>
                  {t.sub ? (
                    <Text numberOfLines={1} style={{ color: '#A4A4A4', fontSize: 12, marginTop: 1 }}>
                      {t.sub}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ color: '#111111', fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                  {amountsVisible ? formatMoney(t.amount) : '•••'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!loading && stockMovements.length > 0 && (
        <View style={{ marginTop: data.transactions.length > 0 ? 12 : compact ? 22 : 28 }}>
          <ReportSectionTitle title="Mouvements stock" date={sectionDateLabel} />

          <View style={{ paddingVertical: 2 }}>
            {stockMovements.map((movement) => (
              <StockMovementItem key={movement.$id} movement={movement} />
            ))}
          </View>
        </View>
      )}

      {!loading && data.transactions.length === 0 && stockMovements.length === 0 && (
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Text style={{ color: '#BBBBBB', fontSize: 15 }}>Aucune donnée pour cette date</Text>
        </View>
      )}
    </ScrollView>
  );
}

function EcartsTile({
  title,
  subtitle,
  icon,
  accent,
  compact,
  subtitleColor = '#A8A8A8',
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  accent: string;
  compact: boolean;
  subtitleColor?: string;
  onPress?: () => void;
}) {
  const iconSize = compact ? 40 : 44;
  const glyphSize = compact ? 20 : 22;

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => ({
        width: '48%',
        height: compact ? 158 : 176,
        borderRadius: 28,
        borderCurve: 'continuous',
        backgroundColor: '#F7F7F7',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        paddingTop: compact ? 22 : 24,
        paddingHorizontal: compact ? 22 : 24,
        paddingBottom: compact ? 20 : 22,
        opacity: pressed ? 0.68 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.018)',
      })}
    >
      <View
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: 14,
          borderCurve: 'continuous',
          backgroundColor: accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name={icon} size={glyphSize} color="#FFFFFF" />
      </View>

      <View style={{ gap: 5, marginTop: compact ? 30 : 40 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={{
            color: '#111111',
            fontSize: compact ? 17 : 18,
            lineHeight: compact ? 21 : 22,
            fontWeight: '700',
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: subtitleColor,
            fontSize: compact ? 14 : 15,
            lineHeight: compact ? 17 : 18,
            fontWeight: '400',
          }}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function MissingMenu({
  compact,
  amountsVisible,
  summary,
  onOpenMissing,
  onOpenMissingHistory,
}: {
  compact: boolean;
  amountsVisible: boolean;
  summary: TodaySummary;
  onOpenMissing: () => void;
  onOpenMissingHistory: () => void;
}) {
  const hiddenValue = '•••';
  const hasGap = summary.latestCashGap !== 0;
  const gapColor = summary.latestCashGap < 0 ? '#E5484D' : '#34C875';
  const expectedValue = amountsVisible ? formatMoney(summary.physicalCashExpected) : hiddenValue;
  const latestGapValue = amountsVisible ? formatMoney(summary.latestCashGap) : hiddenValue;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: compact ? 24 : 34,
        paddingBottom: compact ? 104 : 118,
        gap: 26,
      }}
    >
      <View style={{ gap: 14 }}>
        <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>Contrôle caisse</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
          <EcartsTile
            title="Cash attendu"
            subtitle={expectedValue}
            subtitleColor="#A8A8A8"
            icon="cash"
            accent="#4C9BFF"
            compact={compact}
          />
          <EcartsTile
            title="Dernier écart"
            subtitle={latestGapValue}
            subtitleColor={hasGap ? gapColor : '#A8A8A8'}
            icon={hasGap ? 'alert' : 'check'}
            accent="#FF8A4C"
            compact={compact}
          />
        </View>
      </View>

      <View style={{ gap: 14 }}>
        <Text style={{ color: '#111111', fontSize: 18, fontWeight: '700' }}>Actions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
          <EcartsTile
            title="Historique"
            subtitle="Manquants"
            icon="history"
            accent="#3B3B3B"
            compact={compact}
            onPress={onOpenMissingHistory}
          />
          <EcartsTile
            title="Manquant"
            subtitle="Manquant stock"
            icon="alert-outline"
            accent="#E5484D"
            compact={compact}
            onPress={onOpenMissing}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function ProfileMenu({
  compact,
  onEditShop,
  onEditCash,
  onEditDisplay,
  onEditAlerts,
  onEditTeam,
  onEditData,
}: {
  compact: boolean;
  onEditShop: () => void;
  onEditCash: () => void;
  onEditDisplay: () => void;
  onEditAlerts: () => void;
  onEditTeam: () => void;
  onEditData: () => void;
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

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: compact ? 18 : 26,
        paddingBottom: compact ? 38 : 54,
        gap: 18,
      }}
    >
      <View style={{ alignItems: 'center', gap: 9 }}>
        <View
          style={{
            width: compact ? 78 : 86,
            height: compact ? 78 : 86,
            borderRadius: compact ? 39 : 43,
            backgroundColor: '#E8F4EF',
            borderWidth: 1,
            borderColor: '#D8E9E1',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#08784F', fontSize: 24, fontWeight: '800' }}>
            {getInitials(shopName)}
          </Text>
        </View>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text
            numberOfLines={1}
            style={{ color: '#050505', fontSize: 25, lineHeight: 30, fontWeight: '800' }}
          >
            {shopName}
          </Text>
          <Text numberOfLines={1} style={{ color: '#6F6F6F', fontSize: 15, fontWeight: '500' }}>
            {email}
          </Text>
        </View>
        <Pressable
          onPress={onEditShop}
          style={({ pressed }: { pressed: boolean }) => ({
            height: 42,
            paddingHorizontal: 24,
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: '#08784F',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.65 : 1,
            marginTop: 8,
          })}
        >
          <Text style={{ color: '#08784F', fontSize: 14, fontWeight: '800' }}>
            Modifier
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 14, marginTop: compact ? 2 : 8 }}>
        <SettingsSection title="Boutique">
          <SettingsRow icon="store" title="Nom" value={shopName} onPress={onEditShop} />
          <SettingsRow icon="phone-outline" title="Contact" value={contact} onPress={onEditShop} />
          <SettingsRow icon="map-marker-outline" title="Adresse" value={address} onPress={onEditShop} />
          <SettingsRow icon="clock-outline" title="Horaires" value={openingHours} onPress={onEditShop} />
        </SettingsSection>

        <SettingsSection title="Caisse">
          <SettingsRow icon="cash-register" title="Devise" value={currency} onPress={onEditCash} />
          <SettingsRow icon="credit-card-outline" title="Paiements" value={paymentMethods} onPress={onEditCash} />
          <SettingsRow icon="calendar-clock" title="Clôture" value={defaultClosingTime} onPress={onEditCash} />
        </SettingsSection>

        <SettingsSection title="Préférences">
          <SettingsRow icon="bell-outline" title="Alertes" value={alertsSummary} onPress={onEditAlerts} />
          <SettingsRow icon="eye-outline" title="Affichage" value={displayPreference} onPress={onEditDisplay} />
          <SettingsRow icon="ruler-square" title="Unité" value={defaultUnit} onPress={onEditDisplay} />
          <SettingsRow icon="account-group" title="Équipe" value="1 membre" onPress={onEditTeam} />
          <SettingsRow icon="database-outline" title="Données" value="Exports" onPress={onEditData} />
        </SettingsSection>

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

function NotificationsCenterModal({
  visible,
  compact,
  notifications,
  onClose,
  onRead,
  onReadAll,
}: {
  visible: boolean;
  compact: boolean;
  notifications: NotificationRow[];
  onClose: () => void;
  onRead: (id: string) => void;
  onReadAll: () => void;
}) {
  const unreadCount = notifications.filter((n) => n.read === 'false').length;

  const typeLabel: Record<string, string> = {
    stock_low: 'Stock faible',
    closure_reminder: 'Clôture oubliée',
    cash_gap: 'Écart de caisse',
  };

  function formatRelativeDate(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days} j`;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.24)',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 18,
            paddingBottom: compact ? 24 : 34,
            maxHeight: '80%',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 24,
              marginBottom: 4,
            }}
          >
            <View style={{ gap: 2 }}>
              <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={{ color: '#8E8E8E', fontSize: 13 }}>
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {unreadCount > 0 && (
                <Pressable
                  onPress={onReadAll}
                  style={({ pressed }: { pressed: boolean }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 12,
                    backgroundColor: '#F5F5F5',
                    opacity: pressed ? 0.68 : 1,
                  })}
                >
                  <Text style={{ color: '#111111', fontSize: 13, fontWeight: '600' }}>
                    Tout lire
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                style={({ pressed }: { pressed: boolean }) => ({
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#F5F5F5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.68 : 1,
                })}
              >
                <Feather name="x" size={20} color="#111111" />
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={{ marginTop: 8 }}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MaterialCommunityIcons name="bell-outline" size={40} color="#D0D0D0" />
                <Text style={{ color: '#A0A0A0', fontSize: 15, marginTop: 12 }}>
                  Aucune notification
                </Text>
              </View>
            ) : (
              notifications.map((notif) => (
                <Pressable
                  key={notif.$id}
                  onPress={() => notif.read === 'false' && onRead(notif.$id)}
                  style={({ pressed }: { pressed: boolean }) => ({
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 12,
                    backgroundColor: notif.read === 'false' ? '#F5F8FF' : '#FAFAFA',
                    borderRadius: 16,
                    padding: 14,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: notif.read === 'false' ? '#E8F0FF' : '#F0F0F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={
                        notif.type === 'stock_low'
                          ? 'package-variant-closed'
                          : notif.type === 'cash_gap'
                            ? 'cash-minus'
                            : 'bell-ring-outline'
                      }
                      size={18}
                      color={notif.read === 'false' ? '#4C9BFF' : '#A0A0A0'}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text
                        style={{
                          color: '#111111',
                          fontSize: 14,
                          fontWeight: notif.read === 'false' ? '700' : '600',
                          flex: 1,
                        }}
                      >
                        {notif.title}
                      </Text>
                      {notif.read === 'false' && (
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 4,
                            backgroundColor: '#4C9BFF',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </View>
                    <Text style={{ color: '#5A5A5A', fontSize: 13, lineHeight: 18 }}>
                      {notif.message}
                    </Text>
                    <Text style={{ color: '#A0A0A0', fontSize: 12, marginTop: 2 }}>
                      {typeLabel[notif.type] ?? notif.type} · {formatRelativeDate(notif.$createdAt)}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { session, refreshSession } = useControlAuth();
  const isOffline = useNetworkStatus();
  const prevOfflineRef = useRef(false);
  const [activeMenu, setActiveMenu] = useState<NavKey>('home');
  const [amountsVisible, setAmountsVisible] = useState(true);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [shopSettingsVisible, setShopSettingsVisible] = useState(false);
  const [cashSettingsVisible, setCashSettingsVisible] = useState(false);
  const [displaySettingsVisible, setDisplaySettingsVisible] = useState(false);
  const [alertsSettingsVisible, setAlertsSettingsVisible] = useState(false);
  const [teamSettingsVisible, setTeamSettingsVisible] = useState(false);
  const [dataSettingsVisible, setDataSettingsVisible] = useState(false);
  const [todaySummary, setTodaySummary] = useState<TodaySummary>({
    cashSalesAmount: 0,
    mobileMoneySalesAmount: 0,
    expensesAmount: 0,
    physicalCashExpected: 0,
    salesCount: 0,
    expensesCount: 0,
    latestCashGap: 0,
    closureCount: 0,
    isClosed: false,
  });
  const promptedShopSetup = useRef(false);
  const appliedDisplayDefaults = useRef<string | null>(null);
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const compact = height < 900;
  const contentWidth = Math.min(width, 520);
  const alertText =
    todaySummary.salesCount === 0
      ? "Aucune vente aujourd'hui"
      : `${todaySummary.salesCount} vente${todaySummary.salesCount > 1 ? 's' : ''} aujourd'hui`;
  const expectedCashAmount = todaySummary.physicalCashExpected;
  const displayedCashAmount = amountsVisible ? formatMoney(expectedCashAmount) : '•••';
  const cashTrendText = amountsVisible ? 'à encaisser' : 'masqué';
  const dailySummary = amountsVisible
    ? `${todaySummary.salesCount} vente${todaySummary.salesCount > 1 ? 's' : ''} · ${
        todaySummary.expensesCount
      } sortie${todaySummary.expensesCount > 1 ? 's' : ''} · ${
        todaySummary.isClosed
          ? todaySummary.latestCashGap === 0
            ? 'cloturee'
            : `${formatMoney(todaySummary.latestCashGap)} ecart`
          : 'a cloturer'
      }`
    : 'Détails de caisse masqués';
  const headerTitle =
    activeMenu === 'report'
      ? 'Bilan'
      : activeMenu === 'missing'
        ? 'Écarts'
        : activeMenu === 'profile'
          ? 'Réglages'
          : '';

  function handleTabChange(key: NavKey) {
    if (key === activeMenu) return;
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: -8, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setActiveMenu(key);
      contentTranslateY.setValue(8);
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(contentTranslateY, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    });
  }

  useFocusEffect(useCallback(() => {
    let isMounted = true;

    getTodaySummary().then((summary) => {
      if (isMounted) setTodaySummary(summary);
    }).catch((error) => {
      logControlError('home-summary', error);
    });

    getNotifications().then((list) => {
      if (isMounted) setNotifications(list);
    }).catch((error) => {
      logControlError('home-notifications', error);
    });

    return () => {
      isMounted = false;
    };
  }, []));

  useEffect(() => {
    if (promptedShopSetup.current || !needsShopSetup(session)) return;

    promptedShopSetup.current = true;
    setShopSettingsVisible(true);
  }, [session]);

  useEffect(() => {
    if (!session) {
      appliedDisplayDefaults.current = null;
      return;
    }

    const preferenceKey = `${session.shop.$id}:${session.shop.amountsVisibleByDefault}`;
    if (appliedDisplayDefaults.current === preferenceKey) return;

    appliedDisplayDefaults.current = preferenceKey;
    setAmountsVisible(isAmountsVisibleByDefault(session.shop.amountsVisibleByDefault));
  }, [session]);

  useEffect(() => {
    if (prevOfflineRef.current && !isOffline) {
      flushOfflineQueue().then(() => {
        return getTodaySummary().then((s) => setTodaySummary(s));
      }).catch((error) => {
        logControlError('offline-flush', error);
      });
    }
    prevOfflineRef.current = isOffline;
  }, [isOffline]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {isOffline && (
        <View
          style={{
            backgroundColor: '#FFF3CD',
            paddingVertical: 8,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Feather name="wifi-off" size={13} color="#856404" />
          <Text style={{ color: '#856404', fontSize: 13, fontWeight: '600', flex: 1 }}>
            Hors ligne — données en cache affichées
          </Text>
        </View>
      )}
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <View
          style={{
            width: contentWidth,
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: compact ? 8 : 14,
            paddingBottom: compact ? 12 : 18,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                height: 38,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {headerTitle ? (
                <Text style={{ color: '#111111', fontSize: 22, fontWeight: '800' }}>{headerTitle}</Text>
              ) : (
                <Pressable
                  style={({ pressed }: { pressed: boolean }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.62 : 1,
                  })}
                >
                  <Image
                    source={require('../assets/icons/user-flaticon-1077114.png')}
                    style={{
                      width: 25,
                      height: 25,
                      resizeMode: 'contain',
                      tintColor: '#777777',
                    }}
                  />
                </Pressable>
              )}

              <Pressable
                onPress={() => setNotificationsVisible(true)}
                style={({ pressed }: { pressed: boolean }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.62 : 1,
                })}
              >
                <MaterialCommunityIcons name="bell" size={25} color="#777777" />
                {notifications.filter((n) => n.read === 'false').length > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      backgroundColor: '#FF3B30',
                      borderWidth: 1.5,
                      borderColor: '#FFFFFF',
                    }}
                  />
                )}
              </Pressable>
            </View>

            <Animated.View
              style={{
                flex: 1,
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY as unknown as number }],
              }}
            >
              {activeMenu === 'home' ? (
                <>
                  <View style={{ marginTop: compact ? 20 : 28, gap: compact ? 8 : 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: '#8D8D8D', fontSize: 16, fontWeight: '600' }}>
                        Caisse du jour
                      </Text>
                      <Pressable
                        onPress={() => setAmountsVisible((visible) => !visible)}
                        style={({ pressed }: { pressed: boolean }) => ({
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: pressed ? 0.62 : 1,
                        })}
                      >
                        <Feather name={amountsVisible ? 'eye' : 'eye-off'} size={18} color="#A7A7A7" />
                      </Pressable>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
                      <Text
                        selectable
                        style={{
                          color: '#050505',
                          fontSize: compact ? 43 : 46,
                          lineHeight: compact ? 48 : 52,
                          fontWeight: '700',
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {displayedCashAmount}
                      </Text>
                      <Text
                        style={{
                          color: expectedCashAmount >= 0 ? '#34C875' : '#E5484D',
                          fontSize: 15,
                          lineHeight: 29,
                          fontWeight: '700',
                        }}
                      >
                        {amountsVisible ? (expectedCashAmount >= 0 ? '↗' : '↘') : '•'} {cashTrendText}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleTabChange('report')}
                    style={({ pressed }: { pressed: boolean }) => ({
                      height: compact ? 62 : 66,
                      marginTop: compact ? 22 : 30,
                      borderRadius: 26,
                      borderCurve: 'continuous',
                      backgroundColor: '#FFFFFF',
                      paddingHorizontal: compact ? 13 : 15,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: compact ? 12 : 14,
                      opacity: pressed ? 0.72 : 1,
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.035)',
                    })}
                  >
                    <View
                      style={{
                        width: compact ? 42 : 46,
                        height: compact ? 42 : 46,
                        borderRadius: compact ? 21 : 23,
                        backgroundColor: '#F1FAF5',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather name="arrow-down-left" size={22} color="#32C171" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        numberOfLines={1}
                        style={{ color: '#111111', fontSize: compact ? 15 : 16, fontWeight: '600' }}
                      >
                        {alertText}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{ color: '#A8A8A8', fontSize: compact ? 13 : 14, fontWeight: '400' }}
                      >
                        {dailySummary}
                      </Text>
                    </View>
                    <Feather name="arrow-right" size={22} color="#111111" />
                  </Pressable>

                  <HomeMenu
                    compact={compact}
                    onOpenReport={() => handleTabChange('report')}
                    onOpenStock={() => router.push('/stock' as never)}
                    onOpenSale={() => router.push('/sale' as never)}
                    onOpenClosure={() => router.push('/closure' as never)}
                    onOpenExpense={() => router.push('/expense' as never)}
                  />
                </>
              ) : activeMenu === 'report' ? (
                <ReportMenu
                  compact={compact}
                  amountsVisible={amountsVisible}
                />
              ) : activeMenu === 'missing' ? (
                <MissingMenu
                  compact={compact}
                  amountsVisible={amountsVisible}
                  summary={todaySummary}
                  onOpenMissing={() => router.push('/missing' as never)}
                  onOpenMissingHistory={() =>
                    router.push({ pathname: '/missing', params: { view: 'history' } } as never)
                  }
                />
              ) : (
                <ProfileMenu
                  compact={compact}
                  onEditShop={() => setShopSettingsVisible(true)}
                  onEditCash={() => setCashSettingsVisible(true)}
                  onEditDisplay={() => setDisplaySettingsVisible(true)}
                  onEditAlerts={() => setAlertsSettingsVisible(true)}
                  onEditTeam={() => setTeamSettingsVisible(true)}
                  onEditData={() => setDataSettingsVisible(true)}
                />
              )}
            </Animated.View>
          </View>

          <BottomNav active={activeMenu} compact={compact} onChange={handleTabChange} />
        </View>
      </View>
      <NotificationsCenterModal
        visible={notificationsVisible}
        compact={compact}
        notifications={notifications}
        onClose={() => setNotificationsVisible(false)}
        onRead={(id) => {
          markNotificationRead(id).then((updated) =>
            setNotifications((prev) => prev.map((n) => (n.$id === id ? updated : n)))
          );
        }}
        onReadAll={() => {
          markAllNotificationsRead().then(() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, read: 'true' })))
          );
        }}
      />
      <ShopSettingsModal
        visible={shopSettingsVisible}
        compact={compact}
        onClose={() => setShopSettingsVisible(false)}
        onSaved={refreshSession}
      />
      <CashSettingsModal
        visible={cashSettingsVisible}
        compact={compact}
        onClose={() => setCashSettingsVisible(false)}
        onSaved={refreshSession}
      />
      <DisplaySettingsModal
        visible={displaySettingsVisible}
        compact={compact}
        onClose={() => setDisplaySettingsVisible(false)}
        onSaved={refreshSession}
      />
      <AlertsSettingsModal
        visible={alertsSettingsVisible}
        compact={compact}
        onClose={() => setAlertsSettingsVisible(false)}
        onSaved={refreshSession}
      />
      <TeamSettingsModal
        visible={teamSettingsVisible}
        compact={compact}
        onClose={() => setTeamSettingsVisible(false)}
      />
      <DataSettingsModal
        visible={dataSettingsVisible}
        compact={compact}
        onClose={() => setDataSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}
