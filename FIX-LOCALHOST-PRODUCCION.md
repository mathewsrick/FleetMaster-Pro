# 🚀 Solución Rápida: Emails con Localhost en Producción

**Problema:** Los emails en producción muestran `http://localhost:3000` en lugar de `https://fleetmasterhub.com`

---

## ✅ Solución Rápida (5 minutos)

### Paso 1: Conecta al Servidor
```bash
ssh -i ~/.ssh/fleetmaster-key.pem ubuntu@TU_IP_SERVIDOR
cd ~/fleetmasterhub
```

### Paso 2: Pull de Cambios
```bash
git pull
```

### Paso 3: Ejecuta el Script de Fix
```bash
chmod +x fix-production-url.sh
./fix-production-url.sh
```

El script te pedirá:
1. La URL del frontend → Escribe: `https://fleetmasterhub.com`
2. Confirmar → Escribe: `y`
3. Reiniciar contenedores → Escribe: `y`

**¡Listo!** El problema está resuelto.

---

## 🔍 Verificación

### 1. Verifica la Variable
```bash
cat backend/.env.prod | grep FRONTEND_URL
```

Debe mostrar:
```
FRONTEND_URL=https://fleetmasterhub.com
```

### 2. Verifica en el Contenedor
```bash
docker exec fleetmaster printenv FRONTEND_URL
```

Debe mostrar:
```
https://fleetmasterhub.com
```

### 3. Prueba el Email
1. Ve a `https://fleetmasterhub.com`
2. Registra un usuario nuevo
3. Revisa el email
4. La URL debe ser: `https://fleetmasterhub.com/#/confirm/TOKEN`
5. El logo debe verse correctamente

---

## 🐛 Si NO Funciona Después del Script

### Opción A: Restart Simple
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Opción B: Rebuild Completo (recomendado)
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Opción C: Manual
```bash
# 1. Edita el archivo
nano backend/.env.prod

# 2. Asegúrate que tenga esta línea (sin barra final):
FRONTEND_URL=https://fleetmasterhub.com

# 3. Guarda (Ctrl+O, Enter, Ctrl+X)

# 4. Reinicia
docker-compose -f docker-compose.prod.yml restart
```

---

## 📋 Archivo .env.prod Completo (Referencia)

Tu archivo `backend/.env.prod` debe verse así:

```bash
# ===============================
# SERVIDOR
# ===============================
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://fleetmasterhub.com

# ===============================
# DATABASE
# ===============================
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# ===============================
# JWT
# ===============================
JWT_SECRET=tu_secret_largo_64_caracteres_minimo

# ===============================
# SMTP
# ===============================
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=contacto@fleetmasterhub.com
SMTP_PASS="Math327**"
SMTP_FROM="FleetMaster Hub <contacto@fleetmasterhub.com>"

# ===============================
# WOMPI
# ===============================
WOMPI_PUBLIC_KEY=pub_prod_xxxxx
WOMPI_INTEGRITY_SECRET=prod_integrity_xxxxx
WOMPI_WEBHOOK_SECRET=prod_webhook_xxxxx
WOMPI_API_URL=https://production.wompi.co/v1
```

---

## 🎯 Checklist de Verificación

- [ ] Script `fix-production-url.sh` ejecutado exitosamente
- [ ] Variable `FRONTEND_URL=https://fleetmasterhub.com` en `backend/.env.prod`
- [ ] Contenedores reiniciados
- [ ] Variable verificada en contenedor con `docker exec`
- [ ] Registro de usuario de prueba realizado
- [ ] Email recibido con URL correcta
- [ ] Logo visible en el email

---

## ⚡ Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f --tail=50

# Ver logs solo del backend
docker logs fleetmaster --tail=50 -f

# Verificar contenedores corriendo
docker-compose -f docker-compose.prod.yml ps

# Restart rápido
docker-compose -f docker-compose.prod.yml restart

# Ver variables de entorno en contenedor
docker exec fleetmaster env | grep FRONTEND_URL
```

---

## 📞 Soporte

Si después de seguir estos pasos el problema persiste:

1. Verifica los logs: `docker logs fleetmaster --tail=100`
2. Asegúrate que el archivo `.env.prod` exista y tenga la variable
3. Haz rebuild completo (no solo restart)
4. Verifica que no haya otro archivo `.env` conflictivo

---

**✅ Estado:** Script de fix creado y listo para usar  
**📅 Fecha:** 16 de Febrero, 2026  
**🚀 Tiempo estimado:** 5 minutos
