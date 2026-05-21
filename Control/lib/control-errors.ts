export type ControlApiErrorKind = 'user' | 'dev';

type ApiErrorBody = {
  message?: string;
  error?: {
    type?: ControlApiErrorKind;
    code?: string;
    message?: string;
  };
};

const defaultUserMessage = 'Un probleme est survenu. Reessaie dans un instant.';
const defaultNetworkMessage = 'Impossible de joindre CONTROL. Verifie ta connexion.';
const defaultSessionMessage = 'Ta session a expire. Reconnecte-toi pour continuer.';

const userMessagesByCode: Record<string, string> = {
  AUTH_ACCOUNT_NOT_FOUND: 'Aucun compte CONTROL ne correspond a cet email. Cree une boutique pour commencer.',
  AUTH_ACCOUNT_EXISTS: 'Un compte existe deja avec cet email.',
  AUTH_EMAIL_INVALID: 'Adresse email invalide.',
  AUTH_EMAIL_REQUIRED: 'Renseigne ton email.',
  AUTH_INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  AUTH_NAME_REQUIRED: 'Renseigne le nom de la boutique ou du proprietaire.',
  AUTH_OAUTH_FAILED: 'Connexion sociale echouee. Reessaie ou utilise email/mot de passe.',
  AUTH_PASSWORD_TOO_SHORT: 'Le mot de passe doit contenir au moins 8 caracteres.',
  AUTH_RECOVERY_TOKEN_INVALID: 'Lien de recuperation invalide ou expire.',
  AUTH_RECOVERY_URL_REQUIRED: 'Lien de recuperation invalide.',
  AUTH_REQUIRED: 'Connecte-toi pour continuer.',
  AUTH_SESSION_EXPIRED: defaultSessionMessage,
  CASH_AMOUNT_INVALID: 'Le montant compte doit etre valide.',
  CATEGORY_ID_REQUIRED: 'Categorie introuvable.',
  CATEGORY_NAME_REQUIRED: 'Le nom de la categorie est requis.',
  CATEGORY_NOT_FOUND: 'Categorie introuvable pour cette boutique.',
  EXPENSE_AMOUNT_INVALID: 'Le montant de la sortie doit etre superieur a 0.',
  EXPENSE_CATEGORY_INVALID: 'Selectionne une categorie valide.',
  FIELD_TOO_LONG: 'Ce champ est trop long.',
  MISSING_REASON_INVALID: 'Selectionne une raison valide.',
  PAYMENT_METHOD_INVALID: 'Selectionne un mode de paiement valide.',
  PRODUCT_NAME_CATEGORY_REQUIRED: 'Renseigne le nom et la categorie.',
  PRODUCT_NOT_FOUND: 'Produit introuvable.',
  PRODUCT_REQUIRED: 'Selectionne un produit.',
  PURCHASE_TOTAL_INVALID: 'Le cout achat total doit etre valide.',
  QUANTITY_INVALID: 'La quantite doit etre superieure a 0.',
  SELLING_PRICE_INVALID: 'Le prix de vente par unite doit etre superieur a 0.',
  SHOP_NAME_TOO_SHORT: 'Donne un nom de boutique plus complet.',
  SHOP_REQUIRED: 'Boutique active introuvable.',
  STOCK_INSUFFICIENT: 'Stock insuffisant pour cette operation.',
  UNIT_INVALID: 'Selectionne une unite valide.',
};

export class ControlApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public kind: ControlApiErrorKind,
    public developerMessage?: string
  ) {
    super(message);
    this.name = 'ControlApiError';
  }
}

function isDevelopment() {
  return Boolean((globalThis as { __DEV__?: boolean }).__DEV__);
}

function readApiErrorBody(body: unknown): ApiErrorBody | null {
  if (!body || typeof body !== 'object') return null;
  return body as ApiErrorBody;
}

export async function createApiError(response: Response, fallbackMessage = defaultUserMessage) {
  const body = readApiErrorBody(await response.json().catch(() => null));
  const error = body?.error;
  const kind = error?.type === 'dev' ? 'dev' : 'user';
  const code = error?.code ?? `HTTP_${response.status}`;
  const backendMessage = error?.message ?? body?.message;
  const message =
    kind === 'user'
      ? userMessagesByCode[code] ?? backendMessage ?? fallbackMessage
      : defaultUserMessage;

  return new ControlApiError(
    message,
    response.status,
    code,
    kind,
    backendMessage ?? response.statusText
  );
}

export function createNetworkError(error: unknown) {
  const developerMessage = error instanceof Error ? error.message : String(error);
  return new ControlApiError(defaultNetworkMessage, 0, 'NETWORK_ERROR', 'user', developerMessage);
}

export function getControlErrorMessage(error: unknown) {
  if (error instanceof ControlApiError) {
    if (error.status === 401) return userMessagesByCode[error.code] ?? defaultSessionMessage;
    return userMessagesByCode[error.code] ?? error.message;
  }

  if (error instanceof Error) {
    return error.message || defaultUserMessage;
  }

  return defaultUserMessage;
}

export function shouldSurfaceControlError(error: unknown) {
  return error instanceof ControlApiError && (error.status === 401 || error.status === 403);
}

export function logControlError(context: string, error: unknown) {
  if (!isDevelopment()) return;

  if (error instanceof ControlApiError) {
    console.warn(`[${context}]`, {
      status: error.status,
      code: error.code,
      type: error.kind,
      developerMessage: error.developerMessage,
      userMessage: error.message,
    });
    return;
  }

  console.warn(`[${context}]`, error);
}
