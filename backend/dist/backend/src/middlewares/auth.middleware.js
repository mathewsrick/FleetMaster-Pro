import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        // 🔒 Seguridad: Especificar algoritmo y validar expiración
        const decoded = jwt.verify(token, ENV.JWT_SECRET, {
            algorithms: ['HS256'],
            maxAge: '7d' // Token expira en 7 días
        });
        req.user = {
            userId: decoded.userId,
            accessLevel: decoded.accessLevel,
            role: decoded.role, // Importante para SuperAdmin
        };
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};
//# sourceMappingURL=auth.middleware.js.map