import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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
import wompiRoutes from './modules/wompi/wompi.routes';
import { authenticate } from './middlewares/auth.middleware';
import { requireActiveSubscription } from './middlewares/subscription.middleware';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// Configuración de CORS según entorno
const corsOptions = {
    origin: (origin, callback) => {
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
        }
        else {
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
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
// ⚡ Compresión de responses (gzip/deflate)
app.use(compression({
    level: 6, // Nivel óptimo de compresión
    threshold: 1024, // Solo comprimir si la respuesta es > 1KB
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
app.use('/api/wompi/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' }));
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
const publicPath = path.join(process.cwd(), 'backend/public');
['uploads/vehicles', 'uploads/drivers'].forEach(dir => {
    const p = path.join(publicPath, dir);
    if (!fs.existsSync(p))
        fs.mkdirSync(p, { recursive: true });
});
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
});
app.use('/api/public', express.static(publicPath));
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contact', contactLimiter, contactRoutes);
app.use('/api/wompi/webhook', webhookLimiter);
app.use('/api/wompi', wompiRoutes);
app.use('/api/uploads', authenticate, uploadRoutes);
app.use('/api/subscription', authenticate, subscriptionRoutes);
app.use('/api/superadmin', authenticate, adminLimiter, superadminRoutes);
app.use('/api/vehicles', authenticate, requireActiveSubscription, vehicleRoutes);
app.use('/api/drivers', authenticate, requireActiveSubscription, driverRoutes);
app.use('/api/expenses', authenticate, requireActiveSubscription, expenseRoutes);
app.use('/api/payments', authenticate, requireActiveSubscription, paymentRoutes);
app.use('/api/arrears', authenticate, requireActiveSubscription, arrearRoutes);
app.use('/api/assign', authenticate, requireActiveSubscription, assignmentRoutes);
// Servir frontend en producción
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '..', '..', 'dist');
    app.use(express.static(frontendPath));
    app.get('*', ((req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(frontendPath, 'index.html'));
        }
    }));
}
export default app;
//# sourceMappingURL=app.js.map