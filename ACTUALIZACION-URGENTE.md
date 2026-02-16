# ⚡ Actualización Urgente - Fix SuperAdmin y Emails

**Fecha:** 16 de Febrero, 2026  
**Problema detectado:** Archivos de scripts no incluidos en el contenedor Docker


---

## 🚨 Acción Requerida

Debes hacer **rebuild** del contenedor una vez para que funcione el script de SuperAdmin.

---

## 🚀 Pasos Rápidos (10 minutos)

### En el Servidor de Producción

```bash
# 1. Conecta al servidor
ssh -i ~/.ssh/fleetmaster-key.pem ubuntu@TU_IP
cd ~/fleetmasterhub

# 2. Pull de cambios
git pull

# 3. Rebuild completo (necesario una vez)
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# 4. Espera a que inicie (30 segundos)
sleep 30

# 5. Verifica que esté corriendo
docker-compose -f docker-compose.prod.yml ps

# 6. Fix de URL de emails
./fix-production-url.sh
# Escribe: https://fleetmasterhub.com
# Confirma: y
# Reiniciar: y

# 7. Crea SuperAdmin
./create-superadmin.sh
# Ingresa username, email y password
```

---

## 📋 Cambios Aplicados en Esta Actualización

### 1. Dockerfile
- ✅ Agregada copia de `backend/scripts` al contenedor
- ✅ Agregada copia de `backend/src` para dependencias
- ✅ Agregado `tsconfig.json` del backend

### 2. create-superadmin.sh
- ✅ Usa `npx -y tsx` para auto-instalar tsx si no está
- ✅ Ejecuta desde `/app/backend` con ruta correcta

### 3. Documentación
- ✅ Actualizada con instrucciones de rebuild

---

## ✅ Verificación Paso a Paso

### 1. Verifica que los contenedores estén corriendo
```bash
docker-compose -f docker-compose.prod.yml ps
```

Debe mostrar todos los servicios "Up".

### 2. Verifica que los scripts existan en el contenedor
```bash
docker exec fleetmaster ls -la /app/backend/scripts/
```

Debe mostrar:
```
CreateSuperAdmin.ts
HardReset.ts
```

### 3. Verifica FRONTEND_URL
```bash
docker exec fleetmaster printenv FRONTEND_URL
```

Debe mostrar:
```
https://fleetmasterhub.com
```

### 4. Crea SuperAdmin
```bash
./create-superadmin.sh
```

Debe crear exitosamente sin errores.

### 5. Prueba Email
1. Registra usuario nuevo en https://fleetmasterhub.com
2. Verifica email con URL correcta y logo visible

---

## 🐛 Troubleshooting

### Error: "Cannot find module CreateSuperAdmin.ts"

**Causa:** No se hizo el rebuild del contenedor.

**Solución:**
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Error: "Docker not found" al ejecutar scripts

**Causa:** Docker no está corriendo.

**Solución:**
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Contenedores no inician después del rebuild

**Solución:**
```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Si hay error de migraciones
docker exec fleetmaster npx prisma migrate deploy --schema=/app/backend/prisma/schema.prisma
```

### Email sigue con localhost después del fix

**Solución:**
```bash
# Verifica que la variable esté en el archivo
cat backend/.env.prod | grep FRONTEND_URL

# Si no está, agrégala manualmente
nano backend/.env.prod
# Agrega: FRONTEND_URL=https://fleetmasterhub.com

# Reinicia
docker-compose -f docker-compose.prod.yml restart
```

---

## 📊 Checklist Completo

- [ ] SSH al servidor
- [ ] `git pull` exitoso
- [ ] Rebuild con `--no-cache` completado
- [ ] Contenedores iniciados (`docker-compose ps`)
- [ ] Scripts visibles en contenedor (`docker exec ... ls`)
- [ ] `fix-production-url.sh` ejecutado
- [ ] `FRONTEND_URL` verificado en contenedor
- [ ] `create-superadmin.sh` ejecutado exitosamente
- [ ] SuperAdmin creado
- [ ] Login con SuperAdmin funcional
- [ ] Registro de usuario de prueba
- [ ] Email verificado con URL correcta
- [ ] Logo visible en email

---

## 🎯 Comando Todo en Uno

Si quieres hacer todo de una vez (requiere interacción):

```bash
cd ~/fleetmasterhub && \
git pull && \
docker-compose -f docker-compose.prod.yml down && \
docker-compose -f docker-compose.prod.yml build --no-cache && \
docker-compose -f docker-compose.prod.yml up -d && \
echo "Esperando 30 segundos..." && sleep 30 && \
docker-compose -f docker-compose.prod.yml ps && \
echo -e "\n✅ Rebuild completado. Ahora ejecuta:\n./fix-production-url.sh\n./create-superadmin.sh"
```

---

## 💾 Backup Antes del Rebuild

Si quieres hacer backup de la base de datos primero:

```bash
# Crear directorio de backups
mkdir -p ~/backups

# Backup de la base de datos (si es SQLite local)
docker exec fleetmaster cp /app/fleet.db /tmp/fleet.db.backup
docker cp fleetmaster:/tmp/fleet.db.backup ~/backups/fleet.db.$(date +%Y%m%d_%H%M%S)

# Si usas PostgreSQL/Supabase, el backup está en la nube
echo "Base de datos en Supabase - backup automático"
```

---

## 📞 Soporte

Si algo sale mal:

1. **Revisa los logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f --tail=100
   ```

2. **Verifica variables de entorno:**
   ```bash
   docker exec fleetmaster env | grep -E "FRONTEND_URL|DATABASE_URL|NODE_ENV"
   ```

3. **Restart limpio:**
   ```bash
   docker-compose -f docker-compose.prod.yml down -v
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

**✅ Después de seguir estos pasos, todo funcionará correctamente.**  
**⏱️ Tiempo estimado total: 10-15 minutos**  
**📅 Fecha:** 16 de Febrero, 2026
