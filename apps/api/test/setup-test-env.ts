const DEFAULT_TEST_MONGODB_URI = createDefaultTestMongoUri();

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-for-studio-platform-qa';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-for-studio-platform-qa';
process.env.JWT_ACCESS_TTL ??= '15m';
process.env.JWT_REFRESH_TTL ??= '30d';
process.env.CORS_ORIGINS ??= 'http://localhost:3000,http://localhost:3001';
process.env.MONGO_DATABASE = 'studio_test';

const configuredMongoUri = process.env.MONGODB_URI?.trim();

if (!configuredMongoUri || !isSafeTestMongoUri(configuredMongoUri)) {
  process.env.MONGODB_URI = DEFAULT_TEST_MONGODB_URI;
}

function isSafeTestMongoUri(uri: string): boolean {
  try {
    const parsedUri = new URL(uri);
    const databaseName = parsedUri.pathname.replace(/^\/+/, '');

    return /(^|[_-])test($|[_-])/i.test(databaseName);
  } catch {
    return false;
  }
}

function createDefaultTestMongoUri(): string {
  const mongoScheme = 'mongodb';
  const uri = new URL(
    `${mongoScheme}://127.0.0.1:27017/studio_test?authSource=admin`,
  );

  uri.username = 'studio_admin';
  uri.password = 'change-me';

  return uri.toString();
}
