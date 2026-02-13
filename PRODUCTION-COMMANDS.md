# 🛠️ Comandos Útiles para Producción

## 🚀 Comandos Diarios

### Ver Logs
```bash
# Logs en tiempo real
docker logs -f fleetmaster-pro --tail 100

# Logs de últimas 24 horas
docker logs --since 24h fleetmaster-pro

# Buscar errores
docker logs fleetmaster-pro 2>&1 | grep -i error

# Logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Estado del Sistema
```bash
# Estado de containers
docker ps -a

# Uso de recursos
docker stats fleetmaster-pro

# Estado de Nginx
sudo systemctl status nginx

# Espacio en disco
df -h
```

### Reiniciar Servicios
```bash
# Reiniciar container
docker restart fleetmaster-pro

# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar todo
docker-compose restart
```

---

## 🔄 Despliegue de Actualizaciones

### Opción 1: Pull y Rebuild
```bash
cd /var/www/fleetmaster-pro
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Opción 2: Con Backup
```bash
cd /var/www/fleetmaster-pro

# 1. Backup de uploads
tar -czf backup-uploads-$(date +%Y%m%d).tar.gz backend/public/uploads/

# 2. Pull cambios
git pull origin main

# 3. Rebuild
docker-compose down
docker-compose up -d --build

# 4. Ver logs
docker logs -f fleetmaster-pro --tail 50
```

---

## 💾 Base de Datos (Supabase)

### Ejecutar Migraciones
```bash
# Entrar al container
docker exec -it fleetmaster-pro sh

# Ejecutar migraciones
cd backend
npx prisma migrate deploy

# Salir
exit
```

### Ver Estado de Migraciones
```bash
docker exec -it fleetmaster-pro sh
cd backend
npx prisma migrate status
exit
```

### Seed (Datos de prueba)
```bash
docker exec -it fleetmaster-pro sh
cd backend
npx prisma db seed
exit
```

### Prisma Studio (GUI)
```bash
# En tu máquina local (con SSH tunnel)
ssh -L 5555:localhost:5555 ubuntu@tu-elastic-ip

# En otra terminal local
cd FleetMaster-Pro/backend
DATABASE_URL="postgresql://postgres.xxx:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres" npx prisma studio
```

---

## 📊 Monitoreo

### Supabase Dashboard
```
https://supabase.com/dashboard/project/[tu-project-id]

Revisar:
- Database size
- Active connections
- Query performance
- Logs
- Backups
```

### AWS CloudWatch
```
https://console.aws.amazon.com/cloudwatch

Revisar EC2:
- CPU utilization
- Network in/out
- Disk usage
```

### Health Check
```bash
# Desde tu máquina local
curl https://tudominio.com/api/health

# Desde el servidor
curl http://localhost:3001/api/health
```

---

## 🔐 Seguridad

### Ver Intentos de Acceso SSH
```bash
# Últimos accesos
sudo tail -100 /var/log/auth.log

# Intentos fallidos
sudo grep "Failed password" /var/log/auth.log | tail -20
```

### Renovar SSL (Manual)
```bash
sudo certbot renew --dry-run  # Test
sudo certbot renew            # Renovar
sudo systemctl reload nginx
```

### Ver Certificado SSL
```bash
sudo certbot certificates
```

### Actualizar Sistema
```bash
sudo apt update
sudo apt upgrade -y
sudo reboot  # Si es necesario
```

---

## 📦 Backups

### Backup de Uploads
```bash
cd /var/www/fleetmaster-pro
tar -czf backup-uploads-$(date +%Y%m%d-%H%M).tar.gz backend/public/uploads/

# Mover a S3 (opcional)
aws s3 cp backup-uploads-*.tar.gz s3://tu-bucket/backups/
```

### Backup de Base de Datos (Supabase)
```bash
# Supabase tiene backups automáticos
# Ver en: Dashboard > Database > Backups

# Backup manual:
# 1. Ir a Supabase Dashboard
# 2. Database > Backups
# 3. Create backup
```

### Restaurar Uploads
```bash
cd /var/www/fleetmaster-pro
tar -xzf backup-uploads-YYYYMMDD.tar.gz
docker-compose restart
```

---

## 🚨 Troubleshooting

### Container no inicia
```bash
# Ver logs completos
docker logs fleetmaster-pro

# Ver último error
docker logs fleetmaster-pro --tail 50

# Reconstruir desde cero
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Error de Conexión a Base de Datos
```bash
# 1. Verificar DATABASE_URL
cat backend/.env.prod | grep DATABASE_URL

# 2. Test de conexión desde container
docker exec -it fleetmaster-pro sh
nc -zv aws-0-us-east-1.pooler.supabase.com 6543
exit

# 3. Verificar IP en whitelist de Supabase
# Dashboard > Settings > Database > Connection pooling
```

### Nginx Error 502
```bash
# Verificar que container esté corriendo
docker ps

# Ver logs de Nginx
sudo tail -50 /var/log/nginx/error.log

# Reiniciar Nginx
sudo systemctl restart nginx

# Test de configuración
sudo nginx -t
```

### Puerto Ocupado
```bash
# Ver qué está usando el puerto 3001
sudo lsof -i :3001

# Matar proceso
sudo kill -9 [PID]
```

### Disco Lleno
```bash
# Ver uso de disco
df -h

# Ver archivos grandes
du -h --max-depth=1 / | sort -hr | head -20

# Limpiar Docker
docker system prune -a --volumes
```

---

## 🔍 Debugging

### Entrar al Container
```bash
# Shell interactivo
docker exec -it fleetmaster-pro sh

# Ver variables de entorno
docker exec fleetmaster-pro env

# Ver archivos
docker exec fleetmaster-pro ls -la /app
```

### Ver Variables de Entorno
```bash
# En el servidor
cat backend/.env.prod

# Desde container
docker exec fleetmaster-pro cat backend/.env.prod
```

### Test de CORS
```bash
# Desde tu máquina local
curl -H "Origin: https://tudominio.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://tudominio.com/api/health -v
```

### Test de Wompi Webhook
```bash
# Simular webhook (desde tu máquina)
curl -X POST https://tudominio.com/api/webhooks/wompi \
  -H "Content-Type: application/json" \
  -d '{"event":"transaction.updated","data":{"status":"APPROVED","reference":"test"}}'
```

---

## 📈 Performance

### Ver Memoria Usada
```bash
# Memoria del servidor
free -h

# Memoria de containers
docker stats --no-stream
```

### Ver Conexiones Activas
```bash
# Supabase Dashboard
# Settings > Database > Connection pooling
# Ver: Active connections, Idle connections
```

### Optimizar Base de Datos
```bash
# Conectar a Supabase
psql "postgresql://postgres.xxx:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Vacuum
VACUUM ANALYZE;

# Ver índices
\di

# Salir
\q
```

---

## 🆘 Comandos de Emergencia

### Rollback Rápido
```bash
cd /var/www/fleetmaster-pro
git reset --hard HEAD~1  # Volver a commit anterior
docker-compose down
docker-compose up -d --build
```

### Modo Mantenimiento
```bash
# Crear página de mantenimiento
sudo nano /var/www/maintenance.html

# Configurar Nginx para mostrarla
sudo nano /etc/nginx/sites-available/fleetmaster
# Comentar location / y agregar:
# return 503;
# error_page 503 /maintenance.html;
# location = /maintenance.html { root /var/www; }

sudo systemctl reload nginx
```

### Quitar Modo Mantenimiento
```bash
# Revertir cambios en Nginx
sudo nano /etc/nginx/sites-available/fleetmaster
sudo systemctl reload nginx
```

---

## 📞 Contactos Útiles

- **Supabase Support:** https://supabase.com/support
- **AWS Support:** https://console.aws.amazon.com/support
- **Wompi Support:** https://docs.wompi.co

---

## 📚 Documentación Relacionada

- [AWS-SUPABASE-DEPLOYMENT.md](./AWS-SUPABASE-DEPLOYMENT.md)
- [AWS-SUPABASE-QUICK.md](./AWS-SUPABASE-QUICK.md)
- [PRODUCTION-READY-SUMMARY.md](./PRODUCTION-READY-SUMMARY.md)
- [PRE-DEPLOY-CHECKLIST.md](./PRE-DEPLOY-CHECKLIST.md)

---

<div align="center">

**🛠️ Mantén FleetMaster Pro funcionando sin problemas**

</div>
