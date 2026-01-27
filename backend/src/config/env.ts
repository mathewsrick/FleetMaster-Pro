export const ENV = {
  JWT_SECRET: process.env.JWT_SECRET || 'DEV_INSECURE_SECRET',
  PORT: process.env.PORT || 3001,
  DATABASE_PATH: process.env.DATABASE_PATH || 'fleet.db',
};