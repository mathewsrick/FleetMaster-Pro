import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import driverRoutes from './modules/drivers/driver.routes';
import vehicleRoutes from './modules/vehicles/vehicle.routes';
import expenseRoutes from './modules/expenses/expense.routes';
import arrearRoutes from './modules/arrears/arrear.routes';
import paymentRoutes from './modules/payments/payment.routes';
import authRoutes from './modules/auth/auth.routes';
import subscriptionRoutes from './modules/subscription/subscription.routes';
import { authenticate } from './middlewares/auth.middleware';
import { requireActiveSubscription } from './middlewares/subscription.middleware';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// middlewares base
app.use(cors() as any);
app.use(express.json() as any);

app.use('/api/auth', authRoutes);
app.use('/api/subscription', authenticate, subscriptionRoutes);
app.use('/api/vehicles', authenticate, requireActiveSubscription, vehicleRoutes);
app.use('/api/drivers', authenticate, requireActiveSubscription, driverRoutes);
app.use('/api/expenses', authenticate, requireActiveSubscription, expenseRoutes);
app.use('/api/payments', authenticate, requireActiveSubscription, paymentRoutes);
app.use('/api/arrears', authenticate, requireActiveSubscription, arrearRoutes);

// --------------------
// FRONTEND
// --------------------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

export default app;