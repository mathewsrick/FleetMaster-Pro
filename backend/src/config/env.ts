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
  APP_URL: process.env.APP_URL || 'http://localhost:5173',
  // WOMPI Config
  WOMPI_PUBLIC_KEY: process.env.WOMPI_PUBLIC_KEY || 'pub_test_Q5yDA9xoKdePzhS8qn969p6M7Y6eT96e',
  WOMPI_INTEGRITY_SECRET: process.env.WOMPI_INTEGRITY_SECRET,
  WOMPI_WEBHOOK_SECRET: process.env.WOMPI_WEBHOOK_SECRET
};
