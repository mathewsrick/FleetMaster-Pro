import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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
import { authenticate } from './middlewares/auth.middleware';
import { requireActiveSubscription } from './middlewares/subscription.middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors() as any);
// Aumentar límite de JSON para otros metadatos, aunque las fotos ya no irán aquí
app.use(express.json({ limit: '10mb' }) as any);

// Crear carpetas de carga si no existen
const uploadDir = path.join(__dirname, '../public/uploads/vehicles');
const driverDir = path.join(__dirname, '../public/uploads/drivers');
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(driverDir, { recursive: true });

app.use(
  '/uploads',
  express.static(
    path.join(process.cwd(), 'backend', 'public', 'uploads')
  )
);

app.use(
  '/public',
  express.static(path.join(process.cwd(), 'src/public'))
);

app.use('/api/auth', authRoutes);
app.use('/api/subscription', authenticate, subscriptionRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/uploads', authenticate, uploadRoutes); // Nueva ruta de carga
app.use('/api/vehicles', authenticate, requireActiveSubscription, vehicleRoutes);
app.use('/api/drivers', authenticate, requireActiveSubscription, driverRoutes);
app.use('/api/expenses', authenticate, requireActiveSubscription, expenseRoutes);
app.use('/api/payments', authenticate, requireActiveSubscription, paymentRoutes);
app.use('/api/arrears', authenticate, requireActiveSubscription, arrearRoutes);
app.use('/api/assign', authenticate, requireActiveSubscription, assignmentRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')) as any);
  app.get('*', ((req: any, res: any) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }) as any);
}

export default app;