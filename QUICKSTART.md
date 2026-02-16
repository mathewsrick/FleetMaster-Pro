# 🚀 FleetMaster Pro - Quick Start Guide

## 📦 Instalación Rápida

```bash
# 1. Instalar dependencias raíz
npm install

# 2. Instalar dependencias del frontend
cd frontend && npm install && cd ..

# 3. Configurar variables de entorno
cp .env.example .env
cp frontend/.env.example frontend/.env
# Editar archivos .env con tus valores
```

## 🔧 Desarrollo Local

```bash
# Opción 1: Ejecutar todo (backend + frontend)
npm run dev

# Opción 2: Ejecutar por separado
npm run dev:server    # Backend en puerto 3001
npm run dev:client    # Frontend en puerto 3000
```

Abrir: http://localhost:3000

## 📦 Build para Producción

```bash
# Build completo
npm run build

# El output estará en:
# - frontend/dist/     (frontend)
# - backend/dist/      (backend)
```

## 🐳 Despliegue con Docker

### Desarrollo (docker-compose normal)

```bash
docker-compose up -d
```

### Producción (docker-compose.prod.yml)

```bash
# 1. Crear archivo .env.prod con variables de producción
cp .env.prod.example .env.prod
# Editar .env.prod

# 2. Build y ejecutar
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# 4. Detener
docker-compose -f docker-compose.prod.yml down
```

### AWS EC2 (Automatizado)

```bash
# Script de despliegue automatizado
./deploy-ec2.sh

# El script hace:
# - Backup automático
# - Pull del código
# - Build de imagen
# - Migraciones de BD
# - Deploy con zero-downtime
# - Health checks
# - Limpieza
```

## 📁 Estructura del Proyecto

```
FleetMaster-Pro/
├── frontend/          # Frontend React + Vite
│   ├── src/          # Código fuente
│   └── dist/         # Build output
├── backend/          # Backend Express + Prisma
│   ├── src/          # Código fuente
│   └── dist/         # Build output
└── nginx/            # Configuración Nginx
```

## 🔍 Comandos Útiles

```bash
# Type checking
npm run type-check:frontend

# Prisma
npm run prisma:generate
npm run prisma:migrate

# Scripts especiales
npm run hard:reset           # Reset completo de BD
npm run create:superadmin    # Crear usuario superadmin
```

## 🌐 URLs

| Servicio | URL Desarrollo | URL Producción |
|----------|----------------|----------------|
| Frontend | http://localhost:3000 | https://tudominio.com |
| Backend API | http://localhost:3001/api | https://tudominio.com/api |
| Health Check | http://localhost:3001/api/health | https://tudominio.com/api/health |

## 📚 Documentación Completa

- **DEPLOYMENT.md** - Guía completa de despliegue en AWS EC2
- **REFACTORING.md** - Documentación de la refactorización
- **REFACTORING_SUMMARY.md** - Resumen ejecutivo
- **CHECKLIST.md** - Estado de completación

## 🆘 Troubleshooting

### Frontend no compila
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Docker build falla
```bash
# Limpiar cache de Docker
docker system prune -a
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Prisma errors
```bash
npm run prisma:generate
npm run prisma:migrate
```

### Health check falla
```bash
# Ver logs del contenedor
docker logs fleetmaster-app

# Entrar al contenedor
docker exec -it fleetmaster-app sh
```

## 🔐 Variables de Entorno Importantes

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
EMAIL_HOST=...
WOMPI_PUBLIC_KEY=...
```

### Frontend (frontend/.env)
```env
VITE_API_URL=http://localhost:3001
```

## 📊 Monitoreo

```bash
# Ver logs en tiempo real
docker logs -f fleetmaster-app

# Ver métricas de Docker
docker stats

# Health check
curl http://localhost:3001/api/health
```

## 🎯 Próximos Pasos

1. ✅ Desarrollo local funcionando
2. ✅ Build exitoso
3. ⏳ Docker build y test
4. ⏳ Despliegue en EC2
5. ⏳ Configurar dominio y SSL
6. ⏳ Monitoreo y logs

---

**¿Necesitas ayuda?** Consulta la documentación completa en DEPLOYMENT.md
