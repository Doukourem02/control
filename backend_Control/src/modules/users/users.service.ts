import { AppwriteException, ID, Query } from 'node-appwrite';

import { adminAccount, createSessionAccount, users } from '../../config/appwrite';
import { env } from '../../config/env';
import { devError, userError } from '../../utils/http';
import { getOrCreateCurrentShop } from '../shops/shops.service';
import { getShopById, type ShopRow } from '../shops/shops.repository';
import { getActiveMemberByUserId, getMemberByInviteCode } from '../team/team.repository';
import { joinShop } from '../team/team.service';
import {
  getUserProfileByUserId,
  upsertUserProfile,
  type AccountRole,
} from './users.repository';

const SUPPORTED_OAUTH_PROVIDERS = ['google', 'facebook', 'twitter', 'apple'] as const;
type OAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number];

type AuthInput = {
  email: unknown;
  password: unknown;
  name?: unknown;
  accountRole?: unknown;
  inviteCode?: unknown;
};

type InviteCheckInput = {
  email: unknown;
  inviteCode: unknown;
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

function readAccountRole(value: unknown): AccountRole {
  const role = String(value ?? 'owner').trim().toLowerCase();

  if (role === 'owner' || role === 'seller') return role;

  throw userError('Selectionne proprietaire ou vendeur.', 400, 'AUTH_ROLE_INVALID');
}

function needsCompletedShop(shopName: string, ownerName: string) {
  const name = shopName.trim();
  const owner = ownerName.trim();

  return !!name && name !== 'Ma boutique' && (!owner || name.toLowerCase() !== `boutique ${owner}`.toLowerCase());
}

function createPendingSellerShop(ownerName: string): ShopRow {
  return {
    $id: '',
    $createdAt: '',
    $updatedAt: '',
    ownerUserId: '',
    ownerName,
    name: '',
    currency: 'FCFA',
    contact: '',
    address: '',
    openingHours: '',
    paymentMethods: 'Cash,Mobile Money',
    defaultClosingTime: '20:00',
    amountsVisibleByDefault: 'true',
    displayLanguage: 'fr',
    defaultUnit: 'piece',
    stockLowAlertsEnabled: 'true',
    closureReminderEnabled: 'true',
    cashGapAlertsEnabled: 'true',
    defaultLowStockThreshold: '5',
  };
}

async function createSessionPayload(sessionSecret: string) {
  const account = createSessionAccount(sessionSecret);
  const user = await account.get();
  const [profile, membership] = await Promise.all([
    getUserProfileByUserId(user.$id),
    getActiveMemberByUserId(user.$id),
  ]);
  const accountRole = profile?.accountRole ?? (membership ? 'seller' : null);
  let shop = profile?.shopId ? await getShopById(profile.shopId) : null;

  if (!shop && membership) {
    shop = await getShopById(membership.shopId);
  }

  if (!shop && accountRole !== 'seller') {
    shop = await getOrCreateCurrentShop(user.$id, user.name || user.email);
  }

  return {
    sessionSecret,
    user: {
      id: user.$id,
      email: user.email,
      name: user.name,
      accountRole,
    },
    shop: shop ?? createPendingSellerShop(user.name || user.email),
  };
}

function isSessionAuthError(error: unknown) {
  return error instanceof AppwriteException && (error.code === 401 || error.code === 403);
}

export async function registerUser(input: AuthInput) {
  const { email, password, name } = readCredentials(input);
  const accountRole = readAccountRole(input.accountRole);
  const inviteCode = String(input.inviteCode ?? '').trim().toUpperCase();
  let sellerInviteShopId = '';

  if (!name) {
    throw userError(
      accountRole === 'seller' ? 'Renseigne le nom du vendeur.' : 'Renseigne le nom de la boutique.',
      400,
      'AUTH_NAME_REQUIRED'
    );
  }

  if (accountRole === 'seller' && !inviteCode) {
    throw userError('Renseigne le code d\'invitation de la boutique.', 400, 'TEAM_CODE_REQUIRED');
  }

  if (accountRole === 'seller') {
    const invite = await getMemberByInviteCode(inviteCode);

    if (!invite) {
      throw userError('Code d\'invitation invalide.', 404, 'TEAM_CODE_INVALID');
    }

    if (invite.status === 'removed') {
      throw userError('Cette invitation a ete revoquee.', 410, 'TEAM_CODE_REVOKED');
    }

    if (invite.status === 'active') {
      throw userError('Ce code a deja ete utilise.', 409, 'TEAM_CODE_USED');
    }

    if (invite.email.toLowerCase().trim() !== email) {
      throw userError('Ce code ne correspond pas a cet email.', 403, 'TEAM_CODE_EMAIL_MISMATCH');
    }

    sellerInviteShopId = invite.shopId;
  }

  let createdUserId = '';

  try {
    const createdUser = await users.create({
      userId: ID.unique(),
      email,
      password,
      name,
    });
    createdUserId = createdUser.$id;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 409) {
      throw userError('Un compte existe deja avec cet email.', 409, 'AUTH_ACCOUNT_EXISTS');
    }

    throw error;
  }

  let session;

  try {
    session = await adminAccount.createEmailPasswordSession({ email, password });
  } catch {
    throw devError('Impossible de creer une session Appwrite.', 502, 'AUTH_SESSION_CREATE_FAILED');
  }

  if (!session.secret) {
    throw devError('Impossible de creer une session Appwrite.', 502, 'AUTH_SESSION_CREATE_FAILED');
  }

  if (accountRole === 'seller') {
    const member = await joinShop(createdUserId, { inviteCode });
    await upsertUserProfile({
      userId: createdUserId,
      accountRole: 'seller',
      shopId: member.shopId || sellerInviteShopId,
      onboardingCompleted: 'true',
    });
  } else {
    const shop = await getOrCreateCurrentShop(createdUserId, name);
    await upsertUserProfile({
      userId: createdUserId,
      accountRole: 'owner',
      shopId: shop.$id,
      onboardingCompleted: 'false',
    });
  }

  return createSessionPayload(session.secret);
}

export async function verifySellerInvite(input: InviteCheckInput) {
  const email = readEmail(input.email);
  const inviteCode = String(input.inviteCode ?? '').trim().toUpperCase();

  if (!inviteCode) {
    throw userError('Renseigne le code d\'invitation de la boutique.', 400, 'TEAM_CODE_REQUIRED');
  }

  const invite = await getMemberByInviteCode(inviteCode);

  if (!invite) {
    throw userError('Code d\'invitation invalide.', 404, 'TEAM_CODE_INVALID');
  }

  if (invite.status === 'removed') {
    throw userError('Cette invitation a ete revoquee.', 410, 'TEAM_CODE_REVOKED');
  }

  if (invite.status === 'active') {
    throw userError('Ce code a deja ete utilise.', 409, 'TEAM_CODE_USED');
  }

  if (invite.email.toLowerCase().trim() !== email) {
    throw userError('Ce code ne correspond pas a cet email.', 403, 'TEAM_CODE_EMAIL_MISMATCH');
  }

  const shop = await getShopById(invite.shopId);

  return {
    ok: true,
    invite: {
      email: invite.email,
      name: invite.name,
      shopId: invite.shopId,
      shopName: shop?.name ?? 'la boutique',
    },
  };
}

export async function defineAccountRole(sessionSecret: string, input: { accountRole: unknown }) {
  const account = createSessionAccount(sessionSecret);
  const user = await account.get();
  const accountRole = readAccountRole(input.accountRole);

  if (accountRole === 'seller') {
    const member = await getActiveMemberByUserId(user.$id);
    await upsertUserProfile({
      userId: user.$id,
      accountRole: 'seller',
      shopId: member?.shopId ?? '',
      onboardingCompleted: member ? 'true' : 'false',
    });

    return createSessionPayload(sessionSecret);
  }

  const shop = await getOrCreateCurrentShop(user.$id, user.name || user.email);
  await upsertUserProfile({
    userId: user.$id,
    accountRole: 'owner',
    shopId: shop.$id,
    onboardingCompleted: needsCompletedShop(shop.name, user.name || user.email) ? 'true' : 'false',
  });

  return createSessionPayload(sessionSecret);
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
  const account = createSessionAccount(sessionSecret);

  try {
    await account.get();
  } catch (error) {
    if (isSessionAuthError(error)) {
      throw userError('Session expiree. Reconnecte-toi.', 401, 'AUTH_SESSION_EXPIRED');
    }
    throw error;
  }

  return createSessionPayload(sessionSecret);
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
