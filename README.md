<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🚚 FleetMaster Hub

Sistema completo de gestión de flotas vehiculares con pagos Wompi, autenticación JWT, subscripciones y reportes avanzados.

[![Production Ready](https://img.shields.io/badge/Production-Ready-green.svg)](./DEPLOYMENT.md)
[![Security](https://img.shields.io/badge/Security-Hardened-blue.svg)](./SECURITY-CHANGES-APPLIED.md)

---

## 🚀 Inicio Rápido

### Desarrollo Local

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
nano backend/.env  # Editar con tus valores

# 3. Iniciar base de datos (con Docker)
docker-compose -f docker-compose.dev.yml up -d

# 4. Ejecutar migraciones
pnpm prisma:migrate

# 5. Crear SuperAdmin
pnpm create:superadmin admin admin@example.com Password123!

# 6. Iniciar desarrollo
pnpm dev
```

**Aplicación corriendo en:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## 📚 Documentación

### Despliegue a Producción

| Guía | Descripción | Tiempo |
|------|-------------|--------|
| **[AWS-SUPABASE-QUICK.md](./AWS-SUPABASE-QUICK.md)** | ⚡ Resumen rápido AWS + Supabase | 5 min |
| **[AWS-SUPABASE-DEPLOYMENT.md](./AWS-SUPABASE-DEPLOYMENT.md)** | 📖 Guía completa paso a paso | 45 min |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | 🐳 Despliegue general con Docker | 15 min |
| **[PRE-DEPLOY-CHECKLIST.md](./PRE-DEPLOY-CHECKLIST.md)** | ✅ Checklist antes de producción | 5 min |

### Seguridad

| Documento | Descripción |
|-----------|-------------|
| **[SECURITY-PERFORMANCE-AUDIT.md](./SECURITY-PERFORMANCE-AUDIT.md)** | Auditoría completa |
| **[SECURITY-CHANGES-APPLIED.md](./SECURITY-CHANGES-APPLIED.md)** | Mejoras implementadas |

---

## ✨ Características

- 🚗 **Gestión de Vehículos**: CRUD completo con uploads de imágenes
- 👤 **Gestión de Conductores**: Perfiles, licencias, documentación
- 💰 **Pagos Wompi**: Integración completa con webhooks
- 💳 **Subscripciones**: Planes mensuales/anuales
- 📊 **Reportes**: Analytics y métricas de flota
- 🔐 **Autenticación**: JWT segura con rate limiting
- 📧 **Emails**: Sistema de notificaciones

---

## 🛠️ Tech Stack

**Frontend:** React 18, TypeScript, Vite, TailwindCSS  
**Backend:** Node.js 20, Express, TypeScript, Prisma  
**Database:** PostgreSQL  
**Payments:** Wompi (Colombia)  
**Auth:** JWT + Bcrypt  
**Security:** Helmet, Rate Limiting, CORS configurado  

---

## 🔐 CORS Configurado

CORS ya está configurado para usar automáticamente:
- **Producción**: Tu dominio desde `FRONTEND_URL` (env var)
- **Desarrollo**: localhost:3000, localhost:5173

Solo configura `FRONTEND_URL=https://tudominio.com` en `.env.prod`

---

## 💰 Despliegue AWS + Supabase

### Costos
- **Free Tier (12 meses):** $0/mes
- **Después de 12 meses:** ~$32.50/mes

### Incluye
- ✅ EC2 t3.micro (1 vCPU, 1GB RAM) - $20/mes
- ✅ Supabase PostgreSQL (500MB DB + 2GB bandwidth) - $12.50/mes
- ✅ Ahorro vs RDS: $10/mes menos
- ✅ Backups automáticos en Supabase
- ✅ SSL gratuito (Let's Encrypt)
- ✅ Elastic IP (IP fija)
- ✅ Panel visual de Supabase Database

**Ver guía completa:** [AWS-SUPABASE-DEPLOYMENT.md](./AWS-SUPABASE-DEPLOYMENT.md)

---

## 📝 Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Iniciar dev server
pnpm build            # Build de producción

# Base de Datos
pnpm prisma:generate  # Generar Prisma Client
pnpm prisma:migrate   # Ejecutar migraciones
pnpm prisma:studio    # Abrir GUI de BD

# Administración
pnpm create:superadmin <username> <email> <password>

# Despliegue
./deploy.sh          # Deploy manual
./rollback.sh        # Rollback
```

---

## 🔒 Seguridad

### Mejoras Implementadas
- ✅ JWT con expiración (7 días)
- ✅ Rate limiting en rutas críticas
- ✅ Helmet con CSP y HSTS
- ✅ Input sanitization
- ✅ CORS configurado por dominio
- ✅ Bcrypt para contraseñas
- ✅ Secrets en variables de entorno

---

## 📊 Estado del Proyecto

- [x] Core features completos
- [x] Integración Wompi
- [x] Subscripciones
- [x] Autenticación y autorización
- [x] Seguridad hardened
- [x] Performance optimizations
- [x] Docker & Docker Compose
- [x] Documentación completa
- [x] Guía de despliegue AWS

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado y propietario.

---

## 🆘 Soporte

- 📚 Docs: [AWS-SUPABASE-DEPLOYMENT.md](./AWS-SUPABASE-DEPLOYMENT.md)
- ⚡ Quick Start: [AWS-SUPABASE-QUICK.md](./AWS-SUPABASE-QUICK.md)
- 📋 Checklist: [PRE-DEPLOY-CHECKLIST.md](./PRE-DEPLOY-CHECKLIST.md)
- 🔐 Seguridad: [SECURITY-CHANGES-APPLIED.md](./SECURITY-CHANGES-APPLIED.md)

---

<div align="center">

**Construido con ❤️ para gestión de flotas profesional**

[⬆ Volver arriba](#-fleetmaster-pro)

</div>
