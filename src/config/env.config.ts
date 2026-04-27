export default () => ({
  port: parseInt(process.env.PORT ?? '8080', 10),
  env: process.env.NODE_ENV ?? 'development',

  cache: {
    ttl: parseInt(process.env.CACHE_TTL_MS ?? '5000', 10),
    namespace: process.env.CACHE_NAMESPACE ?? 'erp',
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['*'],
  },
  databaseUrl: process.env.DATABASE_URL ?? '',

  jwt: {
    secret: process.env.JWT_SECRET ?? 'secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10),
  },

  vietqr: {
    bankCode: process.env.VIETQR_BANK_CODE ?? '',
    accountNumber: process.env.VIETQR_ACCOUNT_NUMBER ?? '',
    accountName: process.env.VIETQR_ACCOUNT_NAME ?? '',
  },
});
