import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// Nota: En un entorno real, instalarías helmet y express-rate-limit.
// Aquí se implementan lógicas equivalentes o se asume su disponibilidad vía esm.sh.
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import driverRoutes from './modules/drivers/driver.routes';
import vehicleRoutes from './modules/vehicles/vehicle.routes';
import expenseRoutes from './modules/expenses/expense.routes';
import arrearRoutes from './modules/arrears/arrear.routes';
import paymentRoutes from './modules/payments/payment.routes';
import authRoutes from './modules/auth/auth.routes';
import subscriptionRoutes from './modules/subscription/subscription.routes';
import superadminRoutes from './modules/superadmin/superadmin.routes';
import assignmentRoutes from './modules/assignment/assignment.routes';
import uploadRoutes from './modules/uploads/upload.routes';
import contactRoutes from './modules/contact/contact.routes';
import { authenticate } from './middlewares/auth.middleware';
import { requireActiveSubscription } from './middlewares/subscription.middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuración de Seguridad Global
app.use(helmet() as any); // Protege contra vulnerabilidades web conocidas
app.use(cors() as any);
app.use(express.json({ limit: '10kb' }) as any); // Limita el tamaño del body para prevenir ataques DoS

// Limitador de peticiones para rutas sensibles (Login/Register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos por ventana para Login/Registro
  message: { error: 'Demasiados intentos. Por favor intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicPath = path.join((process as any).cwd(), 'backend/public');

// asegurar uploads
['uploads/vehicles', 'uploads/drivers'].forEach(dir => {
  const p = path.join(publicPath, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

app.use('/api/public', express.static(publicPath) as any);

// Aplicar limitador a rutas de autenticación
app.use('/api/auth', authLimiter as any, authRoutes as any);

app.use('/api/contact', contactRoutes as any);
app.use('/api/uploads', authenticate as any, uploadRoutes as any);
app.use('/api/subscription', authenticate as any, subscriptionRoutes as any);
app.use('/api/superadmin', superadminRoutes as any);
app.use('/api/vehicles', authenticate as any, requireActiveSubscription as any, vehicleRoutes as any);
app.use('/api/drivers', authenticate as any, requireActiveSubscription as any, driverRoutes as any);
app.use('/api/expenses', authenticate as any, requireActiveSubscription as any, expenseRoutes as any);
app.use('/api/payments', authenticate as any, requireActiveSubscription as any, paymentRoutes as any);
app.use('/api/arrears', authenticate as any, requireActiveSubscription as any, arrearRoutes as any);
app.use('/api/assign', authenticate as any, requireActiveSubscription as any, assignmentRoutes as any);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')) as any);
  app.get('*', ((req: any, res: any) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }) as any);
}

export default app;