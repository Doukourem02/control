import {
  clearStoredAuthSession,
  ensureAuthStorageAvailable,
  getStoredAuthSession,
  saveStoredAuthSession,
  type ControlAuthSession,
} from '@/lib/control-auth-storage';
import {
  ControlApiError,
  createApiError,
  createNetworkError,
  getControlErrorMessage,
  logControlError,
} from '@/lib/control-errors';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type AuthModeInput = {
  email: string;
  password: string;
  name?: string;
};

type AuthContextValue = {
  session: ControlAuthSession | null;
  loading: boolean;
  signIn: (input: AuthModeInput) => Promise<void>;
  signUp: (input: AuthModeInput) => Promise<void>;
  requestPasswordRecovery: (email: string) => Promise<void>;
  completePasswordRecovery: (input: { userId: string; secret: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'facebook' | 'twitter' | 'apple') => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const backendBaseUrl = (process.env.EXPO_PUBLIC_CONTROL_API_URL ?? 'http://localhost:4000').replace(
  /\/$/,
  ''
);

async function authRequest<ResponseBody = ControlAuthSession>(path: string, options: RequestInit = {}) {
  let response: Response;

  try {
    response = await fetch(`${backendBaseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (error) {
    throw createNetworkError(error);
  }

  if (!response.ok) {
    throw await createApiError(response, 'Impossible de contacter CONTROL.');
  }

  return response.json() as Promise<ResponseBody>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ControlAuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const storedSession = await getStoredAuthSession().catch(() => null);

    if (!storedSession) {
      setSession(null);
      return;
    }

    try {
      const nextSession = await authRequest('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${storedSession.sessionSecret}`,
        },
      });

      await saveStoredAuthSession(nextSession);
      setSession(nextSession);
    } catch (error) {
      logControlError('refresh-session', error);

      if (error instanceof ControlApiError && error.status === 0) {
        // Network unreachable — keep the cached session, don't force logout
        setSession(storedSession);
        return;
      }

      await clearStoredAuthSession();
      setSession(null);
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  const signIn = useCallback(async (input: AuthModeInput) => {
    await ensureAuthStorageAvailable();

    const nextSession = await authRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    await saveStoredAuthSession(nextSession);
    setSession(nextSession);
  }, []);

  const signUp = useCallback(async (input: AuthModeInput) => {
    await ensureAuthStorageAvailable();

    const nextSession = await authRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    await saveStoredAuthSession(nextSession);
    setSession(nextSession);
  }, []);

  const requestPasswordRecovery = useCallback(async (email: string) => {
    const redirectUrl = 'appwrite-callback-6a099f2e000a6c4556d8://auth?mode=reset';

    await authRequest<{ ok: true }>('/api/auth/recovery/request', {
      method: 'POST',
      body: JSON.stringify({ email, redirectUrl }),
    });
  }, []);

  const completePasswordRecovery = useCallback(
    async (input: { userId: string; secret: string; password: string }) => {
      await authRequest<{ ok: true }>('/api/auth/recovery/confirm', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    []
  );

  const signOut = useCallback(async () => {
    const currentSession = await getStoredAuthSession().catch(() => null);

    if (currentSession?.sessionSecret) {
      await fetch(`${backendBaseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentSession.sessionSecret}`,
        },
      }).catch(() => null);
    }

    await clearStoredAuthSession().catch(() => null);
    setSession(null);
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'facebook' | 'twitter' | 'apple') => {
    await ensureAuthStorageAvailable();

    const redirectUri = 'appwrite-callback-6a099f2e000a6c4556d8://auth/callback';

    let urlResponse: Response;

    try {
      urlResponse = await fetch(
        `${backendBaseUrl}/api/auth/oauth/${provider}/url?success=${encodeURIComponent(redirectUri)}&failure=${encodeURIComponent(redirectUri + '?error=oauth_failed')}`
      );
    } catch (error) {
      throw createNetworkError(error);
    }

    if (!urlResponse.ok) {
      throw await createApiError(urlResponse, "Impossible d'obtenir l'URL OAuth.");
    }

    const { url } = (await urlResponse.json()) as { url: string };
    const result = await WebBrowser.openAuthSessionAsync(url, redirectUri, {
      preferEphemeralSession: true,
    });

    if (result.type !== 'success') {
      throw new Error('Connexion annulée.');
    }

    const callbackUrl = new URL(result.url);
    const userId = callbackUrl.searchParams.get('userId');
    const oauthSecret = callbackUrl.searchParams.get('secret');
    const oauthError = callbackUrl.searchParams.get('error');

    if (oauthError || !userId || !oauthSecret) {
      throw new Error('Connexion OAuth échouée. Vérifie ta configuration Appwrite.');
    }

    const session = await authRequest('/api/auth/oauth/session', {
      method: 'POST',
      body: JSON.stringify({ userId, secret: oauthSecret }),
    });

    await saveStoredAuthSession(session);
    setSession(session);
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      signIn,
      signUp,
      requestPasswordRecovery,
      completePasswordRecovery,
      signOut,
      refreshSession,
      signInWithOAuth,
    }),
    [
      completePasswordRecovery,
      loading,
      refreshSession,
      requestPasswordRecovery,
      session,
      signIn,
      signInWithOAuth,
      signOut,
      signUp,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useControlAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useControlAuth doit etre utilise dans AuthProvider.');
  }

  return context;
}

export { getControlErrorMessage as getAuthErrorMessage };
