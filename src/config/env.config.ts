export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
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

  database: {
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    user: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'secret',
    name: process.env.DATABASE_NAME ?? 'erp',
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10),
  },
});
