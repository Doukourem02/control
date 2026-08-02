import { getAuthErrorMessage, useControlAuth, verifySellerInvite, type SellerInvitePreview } from '@/lib/control-auth';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/lib/theme';

type AuthMode = 'login' | 'register' | 'recover' | 'reset';
type RegisterRole = 'owner' | 'seller';
type SocialProvider = 'google' | 'facebook' | 'twitter' | 'apple';

const socialProviders: {
  provider: SocialProvider;
  label: string;
  icon: 'google' | 'facebook' | 'x' | 'apple';
  color: string;
}[] = [
  { provider: 'google', label: 'Google', icon: 'google', color: '#4285F4' },
  { provider: 'facebook', label: 'Facebook', icon: 'facebook', color: '#1877F2' },
  { provider: 'twitter', label: 'X', icon: 'x', color: '#000000' },
  { provider: 'apple', label: 'Apple', icon: 'apple', color: '#000000' },
];

function GoogleLogo({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.2 4 9.4 8.5 6.3 14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.8l-6.5 5C9.2 39.6 16 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C36.9 39.3 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </Svg>
  );
}

function XLogo({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#000000"
        d="M18.9 2h3.3l-7.3 8.3L23.5 22h-6.7l-5.2-6.8L5.6 22H2.3l7.8-8.9L1.9 2h6.9l4.7 6.2L18.9 2Zm-1.2 17.9h1.8L7.8 4H5.9l11.8 15.9Z"
      />
    </Svg>
  );
}

function SocialProviderIcon({
  icon,
  color,
}: {
  icon: (typeof socialProviders)[number]['icon'];
  color: string;
}) {
  if (icon === 'google') {
    return <GoogleLogo size={22} />;
  }

  if (icon === 'x') {
    return <XLogo size={20} />;
  }

  return <MaterialCommunityIcons name={icon} size={22} color={color} />;
}

export default function AuthScreen() {
  const { signIn, signUp, signInWithOAuth, requestPasswordRecovery, completePasswordRecovery } =
    useControlAuth();
  const params = useLocalSearchParams<{ mode?: string; userId?: string; secret?: string }>();
  const { height } = useWindowDimensions();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [registerRole, setRegisterRole] = useState<RegisterRole | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [sellerInvite, setSellerInvite] = useState<SellerInvitePreview | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [socialMessage, setSocialMessage] = useState('');

  const isRegister = mode === 'register';
  const isRecover = mode === 'recover';
  const isReset = mode === 'reset';
  const isRegisterRoleChoice = isRegister && !registerRole;
  const isSellerInviteStep = isRegister && registerRole === 'seller' && !sellerInvite;
  const compact = height < 760;
  const screenTitle = isReset
    ? 'Nouveau mot de passe'
    : isRecover
      ? 'Mot de passe oublié'
      : isRegister
        ? registerRole === 'owner'
          ? 'Créer une boutique'
          : registerRole === 'seller'
            ? 'Rejoindre une boutique'
            : 'Votre statut'
        : 'Connexion';
  const headerSubtitle = isReset
    ? 'Choisis un nouveau mot de passe pour sécuriser ton compte.'
    : isRecover
      ? 'Entre ton email pour recevoir un lien de récupération.'
      : isRegister
        ? registerRole === 'owner'
          ? 'Crée ton espace boutique et commence à suivre tes ventes.'
          : registerRole === 'seller'
            ? sellerInvite
              ? `Invitation validée pour ${sellerInvite.shopName}. Crée ton mot de passe.`
              : 'Entre ton email et le code donné par le propriétaire.'
            : 'Choisis comment tu veux utiliser CONTROL.'
        : 'CONTROL, gardez le contrôle sur votre business, où qu’il grandisse.';

  useEffect(() => {
    if (params.mode === 'reset' && params.userId && params.secret) {
      setMode('reset');
      setPassword('');
      setPasswordConfirm('');
      setErrorMessage('');
      setSocialMessage('');
    }
  }, [params.mode, params.secret, params.userId]);

  async function handleSubmit() {
    setErrorMessage('');
    setSocialMessage('');
    setSaving(true);

    try {
      if (isReset) {
        if (!params.userId || !params.secret) {
          throw new Error('Lien de recuperation invalide ou expire.');
        }

        if (password !== passwordConfirm) {
          throw new Error('Les deux mots de passe ne correspondent pas.');
        }

        await completePasswordRecovery({
          userId: params.userId,
          secret: params.secret,
          password,
        });
        setMode('login');
        setPassword('');
        setPasswordConfirm('');
        setSocialMessage('Mot de passe mis a jour. Tu peux te connecter.');
      } else if (isRecover) {
        await requestPasswordRecovery(email);
        setMode('login');
        setSocialMessage('Si un compte existe avec cet email, un lien de recuperation a ete envoye.');
      } else if (isRegister) {
        if (!registerRole) {
          throw new Error('Choisis proprietaire ou vendeur.');
        }

        if (registerRole === 'seller' && !inviteCode.trim()) {
          throw new Error("Renseigne le code d'invitation de la boutique.");
        }

        if (registerRole === 'seller' && !sellerInvite) {
          throw new Error("Valide d'abord ton invitation.");
        }

        await signUp({
          name,
          email,
          password,
          accountRole: registerRole,
          inviteCode: registerRole === 'seller' ? inviteCode.trim().toUpperCase() : undefined,
        });
      } else {
        await signIn({ email, password });
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function toggleMode() {
    setErrorMessage('');
    setSocialMessage('');
    setPassword('');
    setPasswordConfirm('');
    setInviteCode('');
    setSellerInvite(null);
    setRegisterRole(null);
    setMode((current) => (current === 'login' ? 'register' : 'login'));
  }

  function openRecovery() {
    setErrorMessage('');
    setSocialMessage('');
    setPassword('');
    setPasswordConfirm('');
    setInviteCode('');
    setSellerInvite(null);
    setRegisterRole(null);
    setMode('recover');
  }

  function backToLogin() {
    setErrorMessage('');
    setSocialMessage('');
    setPassword('');
    setPasswordConfirm('');
    setInviteCode('');
    setSellerInvite(null);
    setRegisterRole(null);
    setMode('login');
  }

  function backToRoleChoice() {
    setErrorMessage('');
    setSocialMessage('');
    setName('');
    setPassword('');
    setPasswordConfirm('');
    setInviteCode('');
    setSellerInvite(null);
    setRegisterRole(null);
  }

  async function handleVerifySellerInvite() {
    setErrorMessage('');
    setSocialMessage('');
    setSaving(true);

    try {
      const invite = await verifySellerInvite({
        email,
        inviteCode: inviteCode.trim().toUpperCase(),
      });

      setSellerInvite(invite);
      setName(invite.name);
      setEmail(invite.email);
      setInviteCode(inviteCode.trim().toUpperCase());
      setSocialMessage(`Invitation validée pour ${invite.shopName}.`);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleSocialPress(provider: SocialProvider) {
    setErrorMessage('');
    setSocialMessage('');
    setSaving(true);

    try {
      await signInWithOAuth(provider);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 22,
            paddingTop: compact ? 18 : 48,
            paddingBottom: 24,
          }}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'space-between',
              gap: compact ? 18 : 22,
            }}
          >
            <View style={{ gap: compact ? 16 : 22 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  overflow: 'hidden',
                  alignSelf: 'center',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  source={require('../assets/images/logo.png')}
                  accessibilityLabel="CONTROL"
                  style={{ width: 122, height: 122, resizeMode: 'contain' }}
                />
              </View>

              <View style={{ gap: 8, alignItems: 'center' }}>
                <Text
                  style={{
                    color: colors.gray900,
                    fontSize: compact ? 24 : 26,
                    lineHeight: compact ? 29 : 31,
                    fontWeight: '700',
                    textAlign: 'center',
                  }}
                >
                  {screenTitle}
                </Text>
                <Text
                  style={{
                    maxWidth: 300,
                    color: colors.gray600,
                    fontSize: 14,
                    lineHeight: 20,
                    fontWeight: '500',
                    textAlign: 'center',
                  }}
                >
                  {headerSubtitle}
                </Text>
                {isRecover || isReset ? (
                  <Pressable onPress={backToLogin} disabled={saving} hitSlop={8}>
                    <Text style={{ color: colors.gray900, fontSize: 14, fontWeight: '700' }}>
                      Retour a la connexion
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={{ gap: 12 }}>
                {isRegister ? (
                  isRegisterRoleChoice ? (
                    <View style={{ gap: 12 }}>
                      {(['owner', 'seller'] as RegisterRole[]).map((role) => (
                        <Pressable
                          key={role}
                          onPress={() => {
                            setRegisterRole(role);
                            setSellerInvite(null);
                            setSocialMessage('');
                            setErrorMessage('');
                          }}
                          disabled={saving}
                          style={({ pressed }: { pressed: boolean }) => ({
                            minHeight: 92,
                            borderRadius: 16,
                            borderCurve: 'continuous',
                            backgroundColor: colors.gray50,
                            borderWidth: 1,
                            borderColor: colors.gray100,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 14,
                            opacity: pressed ? 0.72 : 1,
                          })}
                        >
                          <View
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 14,
                              borderCurve: 'continuous',
                              backgroundColor: role === 'owner' ? colors.primarySoft : colors.accentDeepSoft,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <MaterialCommunityIcons
                              name={role === 'owner' ? 'storefront-outline' : 'account-outline'}
                              size={25}
                              color={role === 'owner' ? colors.primary : colors.accentDeep}
                            />
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ color: colors.gray900, fontSize: 17, fontWeight: '900' }}>
                              {role === 'owner' ? 'Je suis propriétaire' : 'Je suis vendeur'}
                            </Text>
                            <Text style={{ color: colors.gray600, fontSize: 13, lineHeight: 18, fontWeight: '600', marginTop: 3 }}>
                              {role === 'owner'
                                ? 'Créer et gérer ma boutique.'
                                : 'Rejoindre une boutique avec un code.'}
                            </Text>
                          </View>
                          <Feather name="chevron-right" size={22} color={colors.gray500} />
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <>
                      {isSellerInviteStep ? (
                        <>
                          <View
                            style={{
                              height: 50,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 12,
                              borderRadius: 12,
                              borderCurve: 'continuous',
                              backgroundColor: colors.gray50,
                              paddingHorizontal: 16,
                            }}
                          >
                            <Feather name="mail" size={18} color={colors.gray800} />
                            <TextInput
                              value={email}
                              onChangeText={setEmail}
                              placeholder="Email invité"
                              placeholderTextColor={colors.gray600}
                              keyboardType="email-address"
                              autoCapitalize="none"
                              autoCorrect={false}
                              textContentType="emailAddress"
                              style={{ flex: 1, color: colors.gray900, fontSize: 16, fontWeight: '600' }}
                            />
                          </View>
                          <View
                            style={{
                              height: 50,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 12,
                              borderRadius: 12,
                              borderCurve: 'continuous',
                              backgroundColor: colors.gray50,
                              paddingHorizontal: 16,
                            }}
                          >
                            <Feather name="key" size={18} color={colors.gray800} />
                            <TextInput
                              value={inviteCode}
                              onChangeText={(value) => setInviteCode(value.toUpperCase())}
                              placeholder="Code d'invitation"
                              placeholderTextColor={colors.gray600}
                              autoCapitalize="characters"
                              autoCorrect={false}
                              style={{ flex: 1, color: colors.gray900, fontSize: 16, fontWeight: '800', letterSpacing: 1.4 }}
                            />
                          </View>
                        </>
                      ) : (
                        <>
                          {registerRole === 'seller' && sellerInvite ? (
                            <View
                              style={{
                                borderRadius: 16,
                                borderCurve: 'continuous',
                                backgroundColor: colors.successSoft,
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                              }}
                            >
                              <Feather name="check-circle" size={20} color={colors.success} />
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ color: colors.success, fontSize: 14, fontWeight: '900' }}>
                                  Invitation validée
                                </Text>
                                <Text numberOfLines={1} style={{ color: colors.success, fontSize: 12, fontWeight: '700', marginTop: 1 }}>
                                  {sellerInvite.shopName}
                                </Text>
                              </View>
                            </View>
                          ) : null}

                          <View
                            style={{
                              height: 50,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 12,
                              borderRadius: 12,
                              borderCurve: 'continuous',
                              backgroundColor: colors.gray50,
                              paddingHorizontal: 16,
                            }}
                          >
                            <Feather name={registerRole === 'owner' ? 'briefcase' : 'user'} size={18} color={colors.gray800} />
                            <TextInput
                              value={name}
                              onChangeText={setName}
                              placeholder={registerRole === 'owner' ? 'Nom de la boutique' : 'Nom complet du vendeur'}
                              placeholderTextColor={colors.gray600}
                              autoCapitalize="words"
                              style={{ flex: 1, color: colors.gray900, fontSize: 16, fontWeight: '600' }}
                            />
                          </View>
                        </>
                      )}

                      <Pressable onPress={backToRoleChoice} disabled={saving} hitSlop={8}>
                        <Text style={{ color: colors.gray800, fontSize: 14, fontWeight: '800' }}>
                          Changer de statut
                        </Text>
                      </Pressable>
                    </>
                  )
                ) : null}

                {!isReset && !isRegisterRoleChoice && !isSellerInviteStep ? (
                  <View
                    style={{
                      height: 50,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderRadius: 12,
                      borderCurve: 'continuous',
                      backgroundColor: colors.gray50,
                      paddingHorizontal: 16,
                    }}
                  >
                    <Feather name="mail" size={18} color={colors.gray800} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Adresse email"
                      placeholderTextColor={colors.gray600}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="emailAddress"
                      style={{ flex: 1, color: colors.gray900, fontSize: 16, fontWeight: '600' }}
                    />
                  </View>
                ) : null}

                {!isRecover && !isRegisterRoleChoice && !isSellerInviteStep ? (
                  <View
                    style={{
                      height: 50,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderRadius: 12,
                      borderCurve: 'continuous',
                      backgroundColor: colors.gray50,
                      paddingHorizontal: 16,
                    }}
                  >
                    <Feather name="lock" size={18} color={colors.gray800} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder={isReset ? 'Nouveau mot de passe' : 'Mot de passe'}
                      placeholderTextColor={colors.gray600}
                      secureTextEntry={!passwordVisible}
                      textContentType={isRegister || isReset ? 'newPassword' : 'password'}
                      style={{ flex: 1, color: colors.gray900, fontSize: 16, fontWeight: '600' }}
                    />
                    <Pressable onPress={() => setPasswordVisible((current) => !current)} hitSlop={10}>
                      <Feather name={passwordVisible ? 'eye-off' : 'eye'} size={18} color={colors.gray600} />
                    </Pressable>
                  </View>
                ) : null}

                {isReset ? (
                  <View
                    style={{
                      height: 50,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderRadius: 12,
                      borderCurve: 'continuous',
                      backgroundColor: colors.gray50,
                      paddingHorizontal: 16,
                    }}
                  >
                    <Feather name="lock" size={18} color={colors.gray800} />
                    <TextInput
                      value={passwordConfirm}
                      onChangeText={setPasswordConfirm}
                      placeholder="Confirmer le mot de passe"
                      placeholderTextColor={colors.gray600}
                      secureTextEntry={!passwordVisible}
                      textContentType="newPassword"
                      style={{ flex: 1, color: colors.gray900, fontSize: 16, fontWeight: '600' }}
                    />
                  </View>
                ) : null}

                {!isRegister && !isRecover && !isReset ? (
                  <Pressable onPress={openRecovery} disabled={saving} hitSlop={8}>
                    <Text style={{ color: colors.gray800, fontSize: 14, fontWeight: '700' }}>
                      Mot de passe oublié ?
                    </Text>
                  </Pressable>
                ) : null}

                {errorMessage ? (
                  <Text selectable style={{ color: colors.dangerDark, fontSize: 14, fontWeight: '700' }}>
                    {errorMessage}
                  </Text>
                ) : null}
                {socialMessage ? (
                  <Text selectable style={{ color: colors.success, fontSize: 14, fontWeight: '700' }}>
                    {socialMessage}
                  </Text>
                ) : null}
              </View>

              {!isRegisterRoleChoice ? (
                <Pressable
                  onPress={isSellerInviteStep ? handleVerifySellerInvite : handleSubmit}
                  disabled={saving}
                  style={({ pressed }: { pressed: boolean }) => ({
                    height: 52,
                    marginTop: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 16,
                    backgroundColor: saving ? colors.primaryMuted : colors.primary,
                    opacity: pressed ? 0.86 : 1,
                  })}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={{ color: colors.white, fontSize: 16, fontWeight: '800' }}>
                      {isReset
                        ? 'Mettre a jour'
                        : isRecover
                          ? 'Envoyer le lien'
                          : isSellerInviteStep
                            ? "Valider l'invitation"
                          : isRegister
                            ? 'Créer le compte'
                            : 'Se connecter'}
                    </Text>
                  )}
                </Pressable>
              ) : null}

              {!isRecover && !isReset && !isRegisterRoleChoice && !isSellerInviteStep ? (
                <View style={{ gap: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: colors.gray200 }} />
                    <Text style={{ color: colors.gray600, fontSize: 13, fontWeight: '700' }}>ou</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: colors.gray200 }} />
                  </View>

                  <Text
                    style={{
                      color: colors.gray600,
                      fontSize: 12,
                      lineHeight: 17,
                      textAlign: 'center',
                      fontWeight: '600',
                    }}
                  >
                    Continuer avec vos réseaux préférés
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 12,
                    }}
                  >
                    {socialProviders.map((item) => (
                      <Pressable
                        key={item.provider}
                        accessibilityRole="button"
                        accessibilityLabel={`Continuer avec ${item.label}`}
                        onPress={() => handleSocialPress(item.provider)}
                        disabled={saving}
                        style={({ pressed }: { pressed: boolean }) => ({
                          width: 48,
                          height: 48,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 12,
                          borderCurve: 'continuous',
                          backgroundColor: colors.gray50,
                          opacity: saving ? 0.45 : pressed ? 0.7 : 1,
                        })}
                      >
                        <SocialProviderIcon icon={item.icon} color={item.color} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              {!isRecover && !isReset ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 3, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.gray500, fontSize: 13, lineHeight: 19, fontWeight: '500' }}>
                    {isRegister ? 'Déjà inscrit' : 'Nouveau ici'}
                  </Text>
                  <Text style={{ color: colors.gray300, fontSize: 13, lineHeight: 19 }}>·</Text>
                  <Pressable onPress={toggleMode} disabled={saving} hitSlop={8}>
                    <Text style={{ color: colors.gray900, fontSize: 13, lineHeight: 19, fontWeight: '700' }}>
                      {isRegister ? 'Connexion' : 'Créer un compte'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <Text
              style={{
                color: colors.gray700,
                fontSize: 12,
                lineHeight: 18,
                textAlign: 'center',
                paddingHorizontal: 10,
              }}
            >
              En continuant, vous acceptez les Conditions d’utilisation et la Politique de
              confidentialité de CONTROL.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
