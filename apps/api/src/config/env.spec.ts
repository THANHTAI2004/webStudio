import {
  buildMongoUriFromParts,
  isPlaceholderConfigValue,
  validateProductionEnvironment,
} from './env';

describe('env helpers', () => {
  it('encodes MongoDB credentials built from parts', () => {
    const mongoScheme = 'mongodb';

    expect(
      buildMongoUriFromParts({
        host: 'mongodb',
        port: '27017',
        database: 'studio',
        username: 'studio@app',
        password: 'p@ss word/with symbols',
        authSource: 'studio',
      }),
    ).toBe(
      `${mongoScheme}://studio%40app:p%40ss%20word%2Fwith%20symbols@mongodb:27017/studio?authSource=studio`,
    );
  });

  it('detects placeholder production values', () => {
    expect(isPlaceholderConfigValue('CHANGE_ME_LONG_RANDOM')).toBe(true);
    expect(isPlaceholderConfigValue('change-this-password')).toBe(true);
    expect(isPlaceholderConfigValue('strong-random-secret')).toBe(false);
  });

  it('does not require production values outside production', () => {
    expect(() =>
      validateProductionEnvironment({
        NODE_ENV: 'development',
      }),
    ).not.toThrow();
  });

  it('fails production startup when placeholders remain', () => {
    expect(() =>
      validateProductionEnvironment({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'CHANGE_ME_LONG_RANDOM_ACCESS_SECRET',
        JWT_REFRESH_SECRET: 'strong-refresh-secret',
        CORS_ORIGINS: 'https://studio.test',
        MONGO_DATABASE: 'studio',
        MONGO_APP_USERNAME: 'studio_app',
        MONGO_APP_PASSWORD: 'strong-mongo-password',
        MONGO_AUTH_SOURCE: 'studio',
      }),
    ).toThrow('JWT_ACCESS_SECRET must be replaced before production startup.');
  });

  it('requires explicit production CORS origins', () => {
    expect(() =>
      validateProductionEnvironment({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'strong-access-secret',
        JWT_REFRESH_SECRET: 'strong-refresh-secret',
        MONGO_DATABASE: 'studio',
        MONGO_APP_USERNAME: 'studio_app',
        MONGO_APP_PASSWORD: 'strong-mongo-password',
        MONGO_AUTH_SOURCE: 'studio',
      }),
    ).toThrow('CORS_ORIGINS is required to start the Studio API.');
  });

  it('rejects wildcard production CORS origins', () => {
    expect(() =>
      validateProductionEnvironment({
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'strong-access-secret',
        JWT_REFRESH_SECRET: 'strong-refresh-secret',
        CORS_ORIGINS: '*',
        MONGO_DATABASE: 'studio',
        MONGO_APP_USERNAME: 'studio_app',
        MONGO_APP_PASSWORD: 'strong-mongo-password',
        MONGO_AUTH_SOURCE: 'studio',
      }),
    ).toThrow('CORS_ORIGINS must not include wildcard origins.');
  });
});
