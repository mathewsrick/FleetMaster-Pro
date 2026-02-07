export const ENV = {
  JWT_SECRET: process.env.JWT_SECRET || 'DEV_INSECURE_SECRET',
  PORT: process.env.PORT || 3001,
  DATABASE_PATH: process.env.DATABASE_PATH || 'fleet.db',
  // SMTP Config
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || '"FleetMaster Hub" <contacto@fleetmasterhub.com>',
  APP_URL: process.env.APP_URL || 'http://localhost:5173'
};