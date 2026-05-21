import { getAuthErrorMessage, useControlAuth } from '@/lib/control-auth';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

type AuthMode = 'login' | 'register' | 'recover' | 'reset';

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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [socialMessage, setSocialMessage] = useState('');

  const isRegister = mode === 'register';
  const isRecover = mode === 'recover';
  const isReset = mode === 'reset';
  const compact = height < 760;
  const screenTitle = isReset
    ? 'Nouveau mot de passe'
    : isRecover
      ? 'Mot de passe oublié'
      : isRegister
        ? 'Créer un compte'
        : 'Connexion';

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
        await signUp({ name, email, password });
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
    setMode((current) => (current === 'login' ? 'register' : 'login'));
  }

  function openRecovery() {
    setErrorMessage('');
    setSocialMessage('');
    setPassword('');
    setPasswordConfirm('');
    setMode('recover');
  }

  function backToLogin() {
    setErrorMessage('');
    setSocialMessage('');
    setPassword('');
    setPasswordConfirm('');
    setMode('login');
  }

  async function handleSocialPress(provider: 'google' | 'facebook' | 'twitter' | 'apple') {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 22,
            paddingTop: compact ? 16 : 24,
            paddingBottom: 24,
          }}
        >
          <View
            style={{
              flex: 1,
              justifyContent: compact ? 'flex-start' : 'center',
              gap: compact ? 18 : 22,
            }}
          >
            <View style={{ gap: compact ? 18 : 24 }}>
              <Text style={{ color: '#111111', fontSize: 16, fontWeight: '900' }}>CONTROL</Text>

              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    color: '#111111',
                    fontSize: compact ? 29 : 32,
                    lineHeight: compact ? 34 : 37,
                    fontWeight: '900',
                  }}
                >
                  {screenTitle}
                </Text>
                {!isRecover && !isReset ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 5, rowGap: 2 }}>
                    <Text style={{ color: '#646464', fontSize: 15 }}>
                      {isRegister ? 'Déjà inscrit ?' : 'Nouveau sur CONTROL ?'}
                    </Text>
                    <Pressable onPress={toggleMode} disabled={saving} hitSlop={8}>
                      <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>
                        {isRegister ? 'Se connecter' : 'Créer une boutique'}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable onPress={backToLogin} disabled={saving} hitSlop={8}>
                    <Text style={{ color: '#111111', fontSize: 15, fontWeight: '800' }}>
                      Retour a la connexion
                    </Text>
                  </Pressable>
                )}
              </View>

              <View style={{ gap: 12 }}>
                {isRegister ? (
                  <View
                    style={{
                      height: 54,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderRadius: 14,
                      borderCurve: 'continuous',
                      backgroundColor: '#F5F5F5',
                      paddingHorizontal: 16,
                    }}
                  >
                    <Feather name="briefcase" size={21} color="#292929" />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Nom de la boutique"
                      placeholderTextColor="#8A8A8A"
                      autoCapitalize="words"
                      style={{ flex: 1, color: '#111111', fontSize: 16, fontWeight: '600' }}
                    />
                  </View>
                ) : null}

                {!isReset ? (
                  <View
                    style={{
                      height: 54,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderRadius: 14,
                      borderCurve: 'continuous',
                      backgroundColor: '#F5F5F5',
                      paddingHorizontal: 16,
                    }}
                  >
                    <Feather name="mail" size={21} color="#292929" />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Adresse email"
                      placeholderTextColor="#8A8A8A"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="emailAddress"
                      style={{ flex: 1, color: '#111111', fontSize: 16, fontWeight: '600' }}
                    />
                  </View>
                ) : null}

                {!isRecover ? (
                  <View
                    style={{
                      height: 54,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderRadius: 14,
                      borderCurve: 'continuous',
                      backgroundColor: '#F5F5F5',
                      paddingHorizontal: 16,
                    }}
                  >
                    <Feather name="lock" size={21} color="#292929" />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder={isReset ? 'Nouveau mot de passe' : 'Mot de passe'}
                      placeholderTextColor="#8A8A8A"
                      secureTextEntry={!passwordVisible}
                      textContentType={isRegister || isReset ? 'newPassword' : 'password'}
                      style={{ flex: 1, color: '#111111', fontSize: 16, fontWeight: '600' }}
                    />
                    <Pressable onPress={() => setPasswordVisible((current) => !current)} hitSlop={10}>
                      <Feather name={passwordVisible ? 'eye-off' : 'eye'} size={21} color="#8A8A8A" />
                    </Pressable>
                  </View>
                ) : null}

                {isReset ? (
                  <View
                    style={{
                      height: 54,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      borderRadius: 14,
                      borderCurve: 'continuous',
                      backgroundColor: '#F5F5F5',
                      paddingHorizontal: 16,
                    }}
                  >
                    <Feather name="lock" size={21} color="#292929" />
                    <TextInput
                      value={passwordConfirm}
                      onChangeText={setPasswordConfirm}
                      placeholder="Confirmer le mot de passe"
                      placeholderTextColor="#8A8A8A"
                      secureTextEntry={!passwordVisible}
                      textContentType="newPassword"
                      style={{ flex: 1, color: '#111111', fontSize: 16, fontWeight: '600' }}
                    />
                  </View>
                ) : null}

                {!isRegister && !isRecover && !isReset ? (
                  <Pressable onPress={openRecovery} disabled={saving} hitSlop={8}>
                    <Text style={{ color: '#252525', fontSize: 14, fontWeight: '700' }}>
                      Mot de passe oublié ?
                    </Text>
                  </Pressable>
                ) : null}

                {errorMessage ? (
                  <Text selectable style={{ color: '#B42318', fontSize: 14, fontWeight: '700' }}>
                    {errorMessage}
                  </Text>
                ) : null}
                {socialMessage ? (
                  <Text selectable style={{ color: '#08784F', fontSize: 14, fontWeight: '700' }}>
                    {socialMessage}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={saving}
                style={({ pressed }: { pressed: boolean }) => ({
                  height: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 28,
                  backgroundColor: saving ? '#2A2A2A' : '#000000',
                  opacity: pressed ? 0.86 : 1,
                })}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>
                    {isReset
                      ? 'Mettre a jour'
                      : isRecover
                        ? 'Envoyer le lien'
                        : isRegister
                          ? 'Créer le compte'
                          : 'Se connecter'}
                  </Text>
                )}
              </Pressable>

              {!isRecover && !isReset ? (
                <View style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5E5' }} />
                  <Text style={{ color: '#8A8A8A', fontSize: 13, fontWeight: '700' }}>ou</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#E5E5E5' }} />
                </View>

                <Text
                  style={{
                    color: '#3A3A3A',
                    fontSize: 13,
                    lineHeight: 18,
                    textAlign: 'center',
                    fontWeight: '700',
                  }}
                >
                  Continuer avec Google
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <Pressable
                    onPress={() => handleSocialPress('google')}
                    style={({ pressed }: { pressed: boolean }) => ({
                      flex: 1,
                      height: 54,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 15,
                      borderCurve: 'continuous',
                      backgroundColor: '#F7F7F7',
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <GoogleLogo size={27} />
                  </Pressable>

                </View>
              </View>
              ) : null}
            </View>

            <Text
              style={{
                color: '#5F5F5F',
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
