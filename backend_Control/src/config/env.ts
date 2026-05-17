import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  appwriteEndpoint: process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1',
  appwriteProjectId: process.env.APPWRITE_PROJECT_ID ?? '',
  appwriteApiKey: process.env.APPWRITE_API_KEY ?? '',
  appwriteDatabaseId: process.env.APPWRITE_DATABASE_ID ?? '',
};
