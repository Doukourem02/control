import { ID, Query } from 'node-appwrite';

import { adminAccount, createSessionAccount, users } from '../../config/appwrite';
import { env } from '../../config/env';
import { devError, userError } from '../../utils/http';
import { getOrCreateCurrentShop } from '../shops/shops.service';

const SUPPORTED_OAUTH_PROVIDERS = ['google', 'facebook', 'twitter', 'apple'] as const;
type OAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number];

type AuthInput = {
  email: unknown;
  password: unknown;
  name?: unknown;
};

function readEmail(value: unknown) {
  const email = String(value ?? '').trim().toLowerCase();

  if (!email) {
    throw userError('Renseigne ton email.', 400, 'AUTH_EMAIL_REQUIRED');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw userError('Adresse email invalide.', 400, 'AUTH_EMAIL_INVALID');
  }

  return email;
}

function readCredentials(input: AuthInput) {
  const email = readEmail(input.email);
  const password = String(input.password ?? '');
  const name = String(input.name ?? '').trim();

  if (password.length < 8) {
    throw userError('Le mot de passe doit contenir au moins 8 caracteres.', 400, 'AUTH_PASSWORD_TOO_SHORT');
  }

  return { email, password, name };
}

async function createSessionPayload(sessionSecret: string) {
  const account = createSessionAccount(sessionSecret);
  const user = await account.get();
  const shop = await getOrCreateCurrentShop(user.$id, user.name || user.email);

  return {
    sessionSecret,
    user: {
      id: user.$id,
      email: user.email,
      name: user.name,
    },
    shop,
  };
}

export async function registerUser(input: AuthInput) {
  const { email, password, name } = readCredentials(input);

  if (!name) {
    throw userError('Renseigne le nom de la boutique ou du proprietaire.', 400, 'AUTH_NAME_REQUIRED');
  }

  try {
    await users.create({
      userId: ID.unique(),
      email,
      password,
      name,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 409) {
      throw userError('Un compte existe deja avec cet email.', 409, 'AUTH_ACCOUNT_EXISTS');
    }

    throw error;
  }

  return loginUser({ email, password });
}

export async function loginUser(input: AuthInput) {
  const { email, password } = readCredentials(input);
  let session;

  try {
    session = await adminAccount.createEmailPasswordSession({ email, password });
  } catch {
    const existingUsers = await users.list({
      queries: [Query.equal('email', email), Query.limit(1)],
    });

    if (existingUsers.total === 0) {
      throw userError('Aucun compte CONTROL ne correspond a cet email. Cree une boutique pour commencer.', 404, 'AUTH_ACCOUNT_NOT_FOUND');
    }

    throw userError('Email ou mot de passe incorrect.', 401, 'AUTH_INVALID_CREDENTIALS');
  }

  if (!session.secret) {
    throw devError('Impossible de creer une session Appwrite.', 502, 'AUTH_SESSION_CREATE_FAILED');
  }

  return createSessionPayload(session.secret);
}

export async function getCurrentUser(sessionSecret: string) {
  try {
    return await createSessionPayload(sessionSecret);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 401) {
      throw userError('Session expiree. Reconnecte-toi.', 401, 'AUTH_SESSION_EXPIRED');
    }
    throw error;
  }
}

export async function logoutUser(sessionSecret: string) {
  const account = createSessionAccount(sessionSecret);
  await account.deleteSession({ sessionId: 'current' });
}

export async function requestPasswordRecovery(input: { email: unknown; redirectUrl: unknown }) {
  const email = readEmail(input.email);
  const redirectUrl = String(input.redirectUrl ?? '').trim();

  if (!redirectUrl) {
    throw userError('Lien de recuperation invalide.', 400, 'AUTH_RECOVERY_URL_REQUIRED');
  }

  const existingUsers = await users.list({
    queries: [Query.equal('email', email), Query.limit(1)],
  });

  if (existingUsers.total === 0) {
    return { ok: true };
  }

  try {
    await adminAccount.createRecovery({ email, url: redirectUrl });
  } catch {
    throw devError('Impossible de demarrer la recuperation du mot de passe.', 502, 'AUTH_RECOVERY_CREATE_FAILED');
  }

  return { ok: true };
}

export async function confirmPasswordRecovery(input: {
  userId: unknown;
  secret: unknown;
  password: unknown;
}) {
  const userId = String(input.userId ?? '').trim();
  const secret = String(input.secret ?? '').trim();
  const password = String(input.password ?? '');

  if (!userId || !secret) {
    throw userError('Lien de recuperation invalide ou expire.', 400, 'AUTH_RECOVERY_TOKEN_INVALID');
  }

  if (password.length < 8) {
    throw userError('Le mot de passe doit contenir au moins 8 caracteres.', 400, 'AUTH_PASSWORD_TOO_SHORT');
  }

  try {
    await adminAccount.updateRecovery({ userId, secret, password });
  } catch {
    throw userError('Lien de recuperation invalide ou expire.', 400, 'AUTH_RECOVERY_TOKEN_INVALID');
  }

  return { ok: true };
}

export async function getOAuthUrl(provider: string, successUrl: string, failureUrl: string) {
  if (!SUPPORTED_OAUTH_PROVIDERS.includes(provider as OAuthProvider)) {
    throw userError(`Fournisseur OAuth non supporte: ${provider}`, 400, 'AUTH_PROVIDER_UNSUPPORTED');
  }

  const url = new URL(`${env.appwriteEndpoint}/account/tokens/oauth2/${provider}`);
  url.searchParams.set('project', env.appwriteProjectId);
  url.searchParams.set('success', successUrl);
  url.searchParams.set('failure', failureUrl);

  return { url: url.toString() };
}

export async function createOAuthSession(input: { userId: unknown; secret: unknown }) {
  const userId = String(input.userId ?? '').trim();
  const secret = String(input.secret ?? '').trim();

  if (!userId || !secret) {
    throw userError('Parametres OAuth invalides.', 400, 'AUTH_OAUTH_PARAMS_INVALID');
  }

  let session;

  try {
    session = await adminAccount.createSession({ userId, secret });
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error) {
      throw userError('Connexion OAuth echouee. Reessaie ou utilise email/mot de passe.', 401, 'AUTH_OAUTH_FAILED');
    }

    throw userError('Connexion OAuth echouee. Reessaie ou utilise email/mot de passe.', 401, 'AUTH_OAUTH_FAILED');
  }

  if (!session.secret) {
    throw devError('Session OAuth invalide.', 502, 'AUTH_OAUTH_SESSION_INVALID');
  }

  return createSessionPayload(session.secret);
}
