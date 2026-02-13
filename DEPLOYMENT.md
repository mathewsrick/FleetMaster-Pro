# 🚀 Guía de Despliegue a Producción - FleetMaster Pro

## 📋 Pre-requisitos

- Docker y Docker Compose instalados
- Base de datos PostgreSQL disponible
- Credenciales SMTP configuradas
- Cuenta Wompi con keys de producción

## 🔧 Pasos para Desplegar

### 1. Configurar Variables de Entorno

Copia el archivo de ejemplo y configura tus variables:

```bash
cp .env.prod.example .env.prod
```

Edita `.env.prod` y completa:

- ✅ `DATABASE_URL` - Tu conexión a PostgreSQL
- ✅ `JWT_SECRET` - Genera uno seguro (mínimo 64 caracteres aleatorios)
- ✅ `FRONTEND_URL` - URL de tu dominio
- ✅ `SMTP_*` - Credenciales de tu servidor de correo
- ✅ `WOMPI_*` - Keys de PRODUCCIÓN de Wompi (no test)

### 2. Generar JWT Secret Seguro

```bash
# Genera un secret aleatorio de 64 caracteres
openssl rand -base64 64
```

Copia el resultado en `JWT_SECRET` en tu `.env.prod`

### 3. Build y Deploy con Docker

```bash
# Build de la imagen
docker-compose build

# Iniciar en producción
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 4. Verificar Despliegue

```bash
# Verificar que el contenedor esté corriendo
docker ps

# Verificar health check
curl http://localhost:3001/api/health
```

Deberías ver: `{"status":"ok","timestamp":"..."}`

## 🔒 Seguridad

### Checklist de Seguridad:

- [ ] JWT_SECRET único y seguro (64+ caracteres)
- [ ] DATABASE_URL con credenciales seguras
- [ ] CORS configurado solo para tu dominio
- [ ] SMTP con credenciales válidas
- [ ] Wompi con keys de PRODUCCIÓN
- [ ] Rate limiting activo
- [ ] Helmet configurado

## 🗄️ Base de Datos

Las migraciones se ejecutan automáticamente al iniciar el contenedor.

Si necesitas ejecutarlas manualmente:

```bash
docker-compose exec fleetmaster pnpm prisma:migrate
```

## 📁 Persistencia de Archivos

Los uploads se guardan en un volumen Docker. Para respaldar:

```bash
# Backup de uploads
docker run --rm -v fleetmaster-pro_uploads-data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# Restaurar uploads
docker run --rm -v fleetmaster-pro_uploads-data:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

## 🔄 Actualizar la Aplicación

```bash
# Pull cambios
git pull origin main

# Rebuild y restart
docker-compose down
docker-compose build
docker-compose up -d
```

## 📊 Monitoreo

### Ver logs en tiempo real:
```bash
docker-compose logs -f fleetmaster
```

### Estado del contenedor:
```bash
docker-compose ps
```

### Entrar al contenedor:
```bash
docker-compose exec fleetmaster sh
```

## ⚠️ Troubleshooting

### Contenedor no inicia:
```bash
# Ver logs de error
docker-compose logs fleetmaster

# Verificar variables de entorno
docker-compose config
```

### Error de conexión a base de datos:
- Verifica que `DATABASE_URL` sea correcta
- Asegúrate que PostgreSQL esté accesible desde el contenedor

### Error de migraciones:
```bash
# Reintentar migraciones
docker-compose exec fleetmaster pnpm prisma:migrate
```

## 🌐 Nginx (Opcional)

Si usas Nginx como reverse proxy:

```nginx
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📞 Soporte

Si encuentras problemas, verifica:
1. Los logs del contenedor
2. Que todas las variables de entorno estén configuradas
3. Que la base de datos esté accesible
4. Que el puerto 3001 no esté en uso

---

**✅ Listo!** Tu aplicación debería estar corriendo en producción.
