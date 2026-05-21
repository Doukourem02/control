export type ControlAuthSession = {
  sessionSecret: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  shop: {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    ownerUserId: string;
    ownerName: string;
    name: string;
    currency: string;
    contact: string;
    address: string;
    openingHours: string;
  };
};

const sessionKey = 'control.auth.session';
let memorySession: ControlAuthSession | null = null;

function canUseLocalStorage() {
  return process.env.EXPO_OS === 'web' && typeof localStorage !== 'undefined';
}

async function getSecureStore() {
  try {
    return await import('expo-secure-store');
  } catch {
    throw new Error(
      'Le stockage sécurisé natif est indisponible. Rebuild le development build après installation de expo-secure-store.'
    );
  }
}

export async function ensureAuthStorageAvailable() {
  if (canUseLocalStorage()) return;
  await getSecureStore();
}

export async function getStoredAuthSession(): Promise<ControlAuthSession | null> {
  if (memorySession) return memorySession;

  let rawSession: string | null = null;

  if (canUseLocalStorage()) {
    rawSession = localStorage.getItem(sessionKey);
  } else {
    const SecureStore = await getSecureStore();
    rawSession = await SecureStore.getItemAsync(sessionKey);
  }

  if (!rawSession) return null;

  try {
    memorySession = JSON.parse(rawSession) as ControlAuthSession;
    return memorySession;
  } catch {
    await clearStoredAuthSession();
    return null;
  }
}

export async function getStoredSessionSecret() {
  const session = await getStoredAuthSession();
  return session?.sessionSecret ?? '';
}

export async function saveStoredAuthSession(session: ControlAuthSession) {
  memorySession = session;
  const rawSession = JSON.stringify(session);

  if (canUseLocalStorage()) {
    localStorage.setItem(sessionKey, rawSession);
    return;
  }

  const SecureStore = await getSecureStore();
  await SecureStore.setItemAsync(sessionKey, rawSession);
}

export async function clearStoredAuthSession() {
  memorySession = null;

  if (canUseLocalStorage()) {
    localStorage.removeItem(sessionKey);
    return;
  }

  const SecureStore = await getSecureStore();
  await SecureStore.deleteItemAsync(sessionKey);
}
