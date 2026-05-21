import { ID, Query } from 'node-appwrite';

import { adminAccount, createSessionAccount, users } from '../../config/appwrite';
import { env } from '../../config/env';
import { HttpError } from '../../utils/http';
import { getOrCreateCurrentShop } from '../shops/shops.service';

const SUPPORTED_OAUTH_PROVIDERS = ['google', 'facebook', 'twitter', 'apple'] as const;
type OAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number];

type AuthInput = {
  email: unknown;
  password: unknown;
  name?: unknown;
};

function readCredentials(input: AuthInput) {
  const email = String(input.email ?? '').trim().toLowerCase();
  const password = String(input.password ?? '');
  const name = String(input.name ?? '').trim();

  if (!email) {
    throw new HttpError('Renseigne ton email.', 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError('Adresse email invalide.', 400);
  }

  if (password.length < 8) {
    throw new HttpError('Le mot de passe doit contenir au moins 8 caracteres.', 400);
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
    throw new HttpError('Renseigne le nom de la boutique ou du proprietaire.', 400);
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
      throw new HttpError('Un compte existe deja avec cet email.', 409);
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
      throw new HttpError('Aucun compte CONTROL ne correspond a cet email. Cree une boutique pour commencer.', 404);
    }

    throw new HttpError('Email ou mot de passe incorrect.', 401);
  }

  if (!session.secret) {
    throw new HttpError('Impossible de creer une session Appwrite.', 502);
  }

  return createSessionPayload(session.secret);
}

export async function getCurrentUser(sessionSecret: string) {
  return createSessionPayload(sessionSecret);
}

export async function logoutUser(sessionSecret: string) {
  const account = createSessionAccount(sessionSecret);
  await account.deleteSession({ sessionId: 'current' });
}

export async function getOAuthUrl(provider: string, successUrl: string, failureUrl: string) {
  if (!SUPPORTED_OAUTH_PROVIDERS.includes(provider as OAuthProvider)) {
    throw new HttpError(`Fournisseur OAuth non supporté: ${provider}`, 400);
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
    throw new HttpError('userId et secret requis.', 400);
  }

  let session;

  try {
    session = await adminAccount.createSession({ userId, secret });
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error) {
      throw new HttpError(String(error.message), 401);
    }

    throw new HttpError('Connexion OAuth échouée.', 401);
  }

  if (!session.secret) {
    throw new HttpError('Session OAuth invalide.', 502);
  }

  return createSessionPayload(session.secret);
}
