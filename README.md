<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🚚 FleetMaster Hub

Sistema completo de gestión de flotas vehiculares con pagos Wompi, autenticación JWT, subscripciones y reportes avanzados.

[![Production Ready](https://img.shields.io/badge/Production-Ready-green.svg)](./DEPLOYMENT.md)
[![Security](https://img.shields.io/badge/Security-A+-blue.svg)](./DEPLOYMENT.md)
[![Docker Optimized](https://img.shields.io/badge/Docker-Optimized-2496ED.svg)](./Dockerfile)

---

## ✨ Refactorización v1.1.0

Este proyecto ha sido completamente refactorizado con:

- ✅ **Frontend organizado** en carpeta dedicada (`frontend/`)
- ✅ **Dockerfile multi-stage** optimizado (75% más pequeño)
- ✅ **Configuraciones optimizadas** para producción
- ✅ **Listo para AWS EC2** con scripts automatizados
- ✅ **Documentación completa** de despliegue

📖 **[Ver cambios completos →](./REFACTORING_SUMMARY.md)**

---

## 🚀 Inicio Rápido

### 📦 Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/fleetmaster-hub.git
cd fleetmaster-hub

# 2. Instalar dependencias raíz
npm install

# 3. Instalar dependencias frontend
cd frontend && npm install && cd ..

# 4. Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Editar archivos .env con tus valores
```

### 🔧 Desarrollo Local

```bash
# Opción 1: Todo junto (recomendado)
npm run dev

# Opción 2: Por separado
npm run dev:server    # Backend en puerto 3001
npm run dev:client    # Frontend en puerto 3000
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Health Check: http://localhost:3001/api/health

### 📦 Build para Producción

```bash
# Build completo (frontend + backend)
npm run build

# Solo frontend
npm run build:client

# Solo backend
npm run build:server
```

---

## 🐳 Despliegue con Docker

### Opción 1: Docker Compose (Recomendado)

```bash
# Producción con Nginx
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Detener
docker-compose -f docker-compose.prod.yml down
```

### Opción 2: Script Automatizado (AWS EC2)

```bash
# Deploy completo con backups y health checks
./deploy-ec2.sh
```

**El script incluye:**
- ✅ Backups automáticos
- ✅ Pull del código más reciente
- ✅ Build optimizado
- ✅ Migraciones de BD
- ✅ Health checks con reintentos
- ✅ Limpieza automática

📖 **[Guía completa AWS EC2 →](./DEPLOYMENT.md)**

---

## 📂 Estructura del Proyecto

```
fleetmaster-hub/
├── frontend/              # ✨ Frontend React + Vite
│   ├── src/
│   │   ├── pages/        # Páginas de la aplicación
│   │   ├── services/     # API client
│   │   ├── types/        # TypeScript definitions
│   │   ├── App.tsx       # Componente raíz
│   │   └── index.tsx     # Entry point
│   ├── package.json      # Dependencias frontend
│   ├── tsconfig.json     # Config TypeScript
│   └── vite.config.ts    # Config Vite
│
├── backend/              # Backend Express + Prisma
│   ├── src/
│   │   ├── modules/      # Módulos de negocio
│   │   ├── middlewares/  # Auth, rate limiting
│   │   ├── config/       # Configuraciones
│   │   └── server.ts     # Entry point
│   ├── prisma/           # Schema y migraciones
│   └── public/           # Assets públicos
│
├── nginx/                # Configuración Nginx
│   └── default.conf      # Reverse proxy optimizado
│
├── Dockerfile            # Multi-stage optimizado
├── docker-compose.prod.yml
├── deploy-ec2.sh         # Script de despliegue
└── DEPLOYMENT.md         # Documentación completa
```

---

## 📚 Documentación

### Despliegue a Producción

| Guía | Descripción | Tiempo |
|------|-------------|--------|
| **[AWS-SUPABASE-QUICK.md](./AWS-SUPABASE-QUICK.md)** | ⚡ Resumen rápido AWS + Supabase | 5 min |
| **[AWS-SUPABASE-DEPLOYMENT.md](./AWS-SUPABASE-DEPLOYMENT.md)** | 📖 Guía completa paso a paso | 45 min |
| **[WOMPI-WEBHOOKS-PRODUCTION.md](./WOMPI-WEBHOOKS-PRODUCTION.md)** | 💳 Configurar webhooks de pagos | 15 min |
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
npm run dev              # Iniciar dev server
npm run build            # Build de producción

# Base de Datos
npm run prisma:generate  # Generar Prisma Client
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir GUI de BD

# Administración
npm run create:superadmin <username> <email> <password>

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

[⬆ Volver arriba](#-fleetmaster-hub)

</div>
