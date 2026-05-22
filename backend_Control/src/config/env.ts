import dotenv from 'dotenv';

dotenv.config();

function readPort(value: string | undefined) {
  const port = Number(value ?? 4000);

  return Number.isInteger(port) && port > 0 ? port : Number.NaN;
}

export const env = {
  port: readPort(process.env.PORT),
  appwriteEndpoint: process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1',
  appwriteProjectId: process.env.APPWRITE_PROJECT_ID ?? '',
  appwriteApiKey: process.env.APPWRITE_API_KEY ?? '',
  appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID ?? '',
};

export function validateEnv(currentEnv = env) {
  const missing: string[] = [];

  if (!Number.isInteger(currentEnv.port) || currentEnv.port <= 0) {
    missing.push('PORT');
  }

  if (!currentEnv.appwriteEndpoint.trim()) missing.push('APPWRITE_ENDPOINT');
  if (!currentEnv.appwriteProjectId.trim()) missing.push('APPWRITE_PROJECT_ID');
  if (!currentEnv.appwriteApiKey.trim()) missing.push('APPWRITE_API_KEY');
  if (!currentEnv.appwriteDatabaseId.trim()) missing.push('APPWRITE_DATABASE_ID');

  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes ou invalides: ${missing.join(', ')}`);
  }
}
