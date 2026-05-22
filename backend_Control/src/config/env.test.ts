import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validateEnv } from './env';

describe('validateEnv', () => {
  it('accepts a complete backend environment', () => {
    assert.doesNotThrow(() =>
      validateEnv({
        port: 4000,
        appwriteEndpoint: 'https://cloud.appwrite.io/v1',
        appwriteProjectId: 'project',
        appwriteApiKey: 'key',
        appwriteDatabaseId: 'database',
      })
    );
  });

  it('throws with a clear list of missing values', () => {
    assert.throws(
      () =>
        validateEnv({
          port: Number.NaN,
          appwriteEndpoint: '',
          appwriteProjectId: '',
          appwriteApiKey: 'key',
          appwriteDatabaseId: '',
        }),
      /PORT, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_DATABASE_ID/
    );
  });
});
