import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import driverRoutes from './modules/drivers/driver.routes.js';
import vehicleRoutes from './modules/vehicles/vehicle.routes.js';
import expenseRoutes from './modules/expenses/expense.routes.js';
import arrearRoutes from './modules/arrears/arrear.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import subscriptionRoutes from './modules/subscription/subscription.routes.js';
import superadminRoutes from './modules/superadmin/superadmin.routes.js';
import assignmentRoutes from './modules/assignment/assignment.routes.js';
import uploadRoutes from './modules/uploads/upload.routes.js';
import contactRoutes from './modules/contact/contact.routes.js';
import wompiRoutes from './modules/wompi/wompi.routes.js';
import { authenticate } from './middlewares/auth.middleware.js';
import { requireActiveSubscription } from './middlewares/subscription.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuración de CORS según entorno
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Lista de orígenes permitidos según el entorno
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          process.env.FRONTEND_URL || 'https://fleetmasterhub.com',
          // Agregar otros dominios de producción si es necesario
          // 'https://www.fleetmasterhub.com',
          // 'https://app.fleetmasterhub.com'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000'
        ];

    // Permitir requests sin origin (como mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }

    // Verificar si el origin está en la lista de permitidos
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 horas
};

// 🔒 Helmet con configuración personalizada para producción
const helmetConfig = process.env.NODE_ENV === 'production' 
  ? {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://checkout.wompi.co"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https://production.wompi.co", "https://sandbox.wompi.co"],
          fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
          frameSrc: ["'self'", "https://checkout.wompi.co"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  : {}; // En desarrollo, configuración por defecto

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions) as any);

// ⚡ Compresión de responses (gzip/deflate)
app.use(compression({
  level: 6,              // Nivel óptimo de compresión
  threshold: 1024,       // Solo comprimir si la respuesta es > 1KB
  filter: (req, res) => {
    // No comprimir si el cliente lo solicita
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Usar filtro por defecto (comprime JSON, HTML, CSS, JS)
    return compression.filter(req, res);
  }
}));

// 🔥 WEBHOOK RAW PRIMERO
app.use('/api/wompi/webhook',
  express.raw({ type: 'application/json' }) as any
);
app.use(express.json({ limit: '10kb' }) as any);

// Rate limiters específicos por ruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: 'Demasiados intentos. Por favor intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: { error: 'Demasiadas solicitudes. Por favor intenta en una hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100,
  message: { error: 'Rate limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  message: { error: 'Demasiadas solicitudes administrativas.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicPath = path.join((process as any).cwd(), 'backend/public');

['uploads/vehicles', 'uploads/drivers'].forEach(dir => {
  const p = path.join(publicPath, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

app.use('/api/public', express.static(publicPath) as any);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter as any, authRoutes as any);
app.use('/api/contact', contactLimiter as any, contactRoutes as any);
app.use('/api/wompi/webhook', webhookLimiter as any);
app.use('/api/wompi', wompiRoutes as any);
app.use('/api/uploads', authenticate as any, uploadRoutes as any);
app.use('/api/subscription', authenticate as any, subscriptionRoutes as any);
app.use('/api/superadmin', authenticate as any, adminLimiter as any, superadminRoutes as any);
app.use('/api/vehicles', authenticate as any, requireActiveSubscription as any, vehicleRoutes as any);
app.use('/api/drivers', authenticate as any, requireActiveSubscription as any, driverRoutes as any);
app.use('/api/expenses', authenticate as any, requireActiveSubscription as any, expenseRoutes as any);
app.use('/api/payments', authenticate as any, requireActiveSubscription as any, paymentRoutes as any);
app.use('/api/arrears', authenticate as any, requireActiveSubscription as any, arrearRoutes as any);
app.use('/api/assign', authenticate as any, requireActiveSubscription as any, assignmentRoutes as any);

// Servir frontend en producción
const frontendPath = path.join(process.cwd(), 'dist');

if (fs.existsSync(frontendPath)) {

  app.use(express.static(frontendPath, {
    index: false,   // 👈 importante
    fallthrough: true
  }));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).end();
    }

    res.sendFile(path.join(frontendPath, 'index.html'));
  });

}
export default app;