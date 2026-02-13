# 🚀 Despliegue AWS + Supabase - FleetMaster Pro

## 🎯 Arquitectura

```
┌─────────────────────────────────────────────────┐
│         Supabase (PostgreSQL Cloud)             │
│   ✅ Gratis: 500MB + 2GB bandwidth/mes         │
│   💰 Pro: $25/mes (8GB + más features)         │
└────────────────┬────────────────────────────────┘
                 │ SSL Connection
                 │
┌────────────────▼────────────────────────────────┐
│       AWS EC2 t3.micro (Free Tier)              │
│  ┌──────────────────────────────────────────┐   │
│  │  Nginx (Reverse Proxy + SSL)             │   │
│  └────────┬─────────────────────────────────┘   │
│           │                                      │
│  ┌────────▼─────────────────────────────────┐   │
│  │  Docker Compose                          │   │
│  │  ┌──────────────────┐ ┌────────────────┐│   │
│  │  │ Frontend (Nginx) │ │ Backend (Node) ││   │
│  │  │ Port: 80         │ │ Port: 3001     ││   │
│  │  └──────────────────┘ └────────────────┘│   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 💰 Costos Comparados

### Opción 1: AWS Free Tier + Supabase Free
| Servicio | Costo | Límites |
|----------|-------|---------|
| **EC2 t3.micro** | $0 (12 meses) | 750 horas/mes |
| **Supabase Free** | $0 | 500MB DB, 2GB bandwidth |
| **Elastic IP** | $0 | Gratis siempre |
| **SSL** | $0 | Let's Encrypt |
| **TOTAL** | **$0/mes** | Perfecto para MVP |

### Opción 2: AWS Free Tier + Supabase Pro (Recomendado)
| Servicio | Costo |
|----------|-------|
| **EC2 t3.micro** | $0 (12 meses) |
| **Supabase Pro** | $25/mes |
| **SSL** | $0 |
| **TOTAL** | **$25/mes** |

**Ventajas sobre RDS:**
- ✅ Más barato ($25 vs $35+ con RDS + EC2)
- ✅ Panel de administración visual
- ✅ Backups automáticos (diarios)
- ✅ API REST automática
- ✅ Realtime subscriptions
- ✅ Storage incluido
- ✅ Auth incluido (opcional)

---

## 📝 Requisitos Previos

### 1. Cuenta de Supabase
- [ ] Cuenta creada en [supabase.com](https://supabase.com)
- [ ] Proyecto creado
- [ ] Connection string obtenida

### 2. Cuenta de AWS
- [ ] Cuenta de AWS creada
- [ ] AWS CLI instalado

### 3. Dominio
- [ ] Dominio registrado (opcional: Freenom gratis)

---

## 🚀 Paso 1: Configurar Supabase

### 1.1 Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Click en "Start your project"
3. Crear nuevo proyecto:
   - **Name:** `fleetmaster-prod`
   - **Database Password:** (genera uno seguro)
   - **Region:** Elige la más cercana (ej: `us-east-1`)
   - **Plan:** Free (para empezar)

### 1.2 Obtener Connection String

En tu proyecto de Supabase:

1. Ve a **Settings** → **Database**
2. Baja hasta **Connection string**
3. Selecciona **URI** (no Transaction pooler)
4. Copia la connection string:

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**⚠️ IMPORTANTE:** Reemplaza `[YOUR-PASSWORD]` con tu password real.

### 1.3 Configurar Pooler (Opcional pero Recomendado)

Para mejor performance:

1. En **Settings** → **Database**
2. Baja hasta **Connection pooling**
3. Copia la **Transaction pooler** connection string:

```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Usa esta para producción** (mejor para conexiones concurrentes).

### 1.4 Permitir IP de AWS (Si usas IP fija)

1. Ve a **Settings** → **Database**
2. Bajo **Connection pooling**, click en **Add new IP**
3. Agrega la IP de tu EC2 (o usa `0.0.0.0/0` temporalmente)

---

## 🚀 Paso 2: Crear EC2 en AWS

### 2.1 Crear Security Group

```bash
# Configurar AWS
aws configure

# Obtener VPC default
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)

# Crear Security Group para EC2
EC2_SG_ID=$(aws ec2 create-security-group \
  --group-name fleetmaster-ec2-sg \
  --description "FleetMaster EC2 Security Group" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

echo "Security Group ID: $EC2_SG_ID"

# Permitir SSH, HTTP, HTTPS
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
```

### 2.2 Crear Key Pair

```bash
aws ec2 create-key-pair \
  --key-name fleetmaster-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/fleetmaster-key.pem

chmod 400 ~/.ssh/fleetmaster-key.pem
```

### 2.3 Crear EC2 Instance

```bash
# Obtener la AMI más reciente de Ubuntu
AMI_ID=$(aws ec2 describe-images \
  --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
  --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" \
  --output text)

echo "AMI ID: $AMI_ID"

# Crear instancia EC2 t3.micro (Free Tier)
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t3.micro \
  --key-name fleetmaster-key \
  --security-group-ids $EC2_SG_ID \
  --block-device-mappings "[{\"DeviceName\":\"/dev/sda1\",\"Ebs\":{\"VolumeSize\":20,\"VolumeType\":\"gp3\"}}]" \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=FleetMaster-Server}]' \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Instance ID: $INSTANCE_ID"

# Esperar a que esté running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Obtener IP pública
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "✅ Public IP: $PUBLIC_IP"
```

### 2.4 Asignar Elastic IP (IP Fija)

```bash
# Crear Elastic IP
ALLOCATION_ID=$(aws ec2 allocate-address \
  --domain vpc \
  --query 'AllocationId' \
  --output text)

# Asociar a la instancia
aws ec2 associate-address \
  --instance-id $INSTANCE_ID \
  --allocation-id $ALLOCATION_ID

# Obtener la Elastic IP
ELASTIC_IP=$(aws ec2 describe-addresses \
  --allocation-ids $ALLOCATION_ID \
  --query 'Addresses[0].PublicIp' \
  --output text)

echo "✅ Elastic IP: $ELASTIC_IP"
echo "📝 Apunta tu dominio a esta IP: $ELASTIC_IP"
```

---

## 🚀 Paso 3: Configurar el Servidor

### 3.1 Conectarse por SSH

```bash
ssh -i ~/.ssh/fleetmaster-key.pem ubuntu@$ELASTIC_IP
```

### 3.2 Instalar Docker y Dependencias

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Nginx
sudo apt install nginx -y

# Instalar Certbot (SSL gratuito)
sudo apt install certbot python3-certbot-nginx -y

# Instalar Node.js (para generar JWT secret)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalaciones
docker --version
docker-compose --version
nginx -v
node --version

echo "✅ Todas las herramientas instaladas"
```

### 3.3 Salir y Volver a Entrar

```bash
exit
ssh -i ~/.ssh/fleetmaster-key.pem ubuntu@$ELASTIC_IP
```

---

## 🚀 Paso 4: Clonar y Configurar Proyecto

### 4.1 Clonar Repositorio

```bash
# Clonar tu proyecto
git clone https://github.com/TU_USUARIO/FleetMaster-Pro.git
cd FleetMaster-Pro
```

### 4.2 Crear Archivo .env.prod

```bash
# Crear .env.prod
nano backend/.env.prod
```

**Contenido de `.env.prod`:**

```bash
# ===============================
# SERVIDOR
# ===============================
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tudominio.com

# ===============================
# BASE DE DATOS (Supabase Connection Pooler)
# ===============================
DATABASE_URL=postgresql://postgres.xxxxx:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# ===============================
# JWT SECRET (Generar nuevo)
# ===============================
JWT_SECRET=genera-uno-nuevo-con-el-comando-de-abajo

# ===============================
# SUPERADMIN (Solo primera vez)
# ===============================
CREATE_SUPERADMIN=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=TuPasswordSegura123!
ADMIN_EMAIL=admin@tudominio.com

# ===============================
# SMTP (Opcional - Gmail ejemplo)
# ===============================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM="FleetMaster <noreply@tudominio.com>"
APP_URL=https://tudominio.com

# ===============================
# WOMPI (Producción)
# ===============================
WOMPI_PUBLIC_KEY=pub_prod_xxxxx
WOMPI_INTEGRITY_SECRET=prod_integrity_xxxxx
WOMPI_WEBHOOK_SECRET=prod_webhook_xxxxx
WOMPI_API_URL=https://production.wompi.co/v1
```

**Generar JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copia el resultado y pégalo en `JWT_SECRET`.

### 4.3 Actualizar docker-compose.yml

Asegúrate de que tu `docker-compose.yml` **NO** incluya el servicio de PostgreSQL (ya que usamos Supabase):

```bash
nano docker-compose.yml
```

Debe verse así (sin servicio `db`):

```yaml
version: '3.8'

services:
  fleetmaster:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: fleetmaster-app
    restart: unless-stopped
    ports:
      - "3001:3001"
    env_file:
      - backend/.env.prod
    environment:
      - NODE_ENV=production
    volumes:
      - ./backend/public/uploads:/app/backend/public/uploads
    networks:
      - fleetmaster-network

networks:
  fleetmaster-network:
    driver: bridge
```

---

## 🚀 Paso 5: Ejecutar Migraciones en Supabase

Antes de hacer el build, necesitas ejecutar las migraciones en Supabase:

```bash
# Instalar pnpm
npm install -g pnpm

# Instalar dependencias
pnpm install

# Generar Prisma Client
pnpm prisma:generate

# Ejecutar migraciones
pnpm prisma:migrate:deploy
```

Si te da error, verifica que `DATABASE_URL` esté correcto en `.env.prod`.

---

## 🚀 Paso 6: Build y Deploy

```bash
# Build de la aplicación
sudo docker-compose build

# Iniciar servicios
sudo docker-compose up -d

# Ver logs
sudo docker-compose logs -f

# Verificar que esté corriendo
curl http://localhost:3001/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2026-02-13T...",
  "uptime": 5.123,
  "database": "connected"
}
```

---

## 🚀 Paso 7: Configurar Nginx

### 7.1 Crear Configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/fleetmaster
```

**Contenido:**

```nginx
# Frontend + API en el mismo dominio
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Logs
    access_log /var/log/nginx/fleetmaster_access.log;
    error_log /var/log/nginx/fleetmaster_error.log;

    # Frontend (React app)
    location / {
        root /home/ubuntu/FleetMaster-Pro/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploads
    location /uploads {
        alias /home/ubuntu/FleetMaster-Pro/backend/public/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

### 7.2 Habilitar Sitio

```bash
# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/fleetmaster /etc/nginx/sites-enabled/

# Remover sitio default
sudo rm /etc/nginx/sites-enabled/default

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar estado
sudo systemctl status nginx
```

---

## 🚀 Paso 8: Configurar SSL con Let's Encrypt

```bash
# Obtener certificado SSL (cambiar tudominio.com)
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Sigue las instrucciones:
1. Ingresa tu email
2. Acepta los términos
3. Elige opción **2** (Redirect HTTP to HTTPS)

Certbot configurará automáticamente Nginx y renovará el certificado cada 90 días.

**Verificar renovación automática:**

```bash
sudo certbot renew --dry-run
```

---

## 🚀 Paso 9: Configurar DNS

En tu proveedor de dominio (Namecheap, GoDaddy, Cloudflare, etc.):

### Registros DNS:

1. **Registro A (root domain):**
   - Type: `A`
   - Name: `@`
   - Value: `TU_ELASTIC_IP`
   - TTL: `3600`

2. **Registro A (www):**
   - Type: `A`
   - Name: `www`
   - Value: `TU_ELASTIC_IP`
   - TTL: `3600`

**Espera 5-30 minutos** para que se propague el DNS.

---

## ✅ Paso 10: Verificación Final

```bash
# 1. Health check
curl https://tudominio.com/api/health

# 2. Ver logs
sudo docker-compose logs -f

# 3. Verificar Docker
sudo docker ps

# 4. Verificar Nginx
sudo systemctl status nginx

# 5. Verificar SSL
curl -I https://tudominio.com
```

### Probar la Aplicación

1. Ve a: `https://tudominio.com`
2. Login con:
   - **User:** admin
   - **Pass:** TuPasswordAdmin123!
3. Probar crear un vehículo
4. Probar crear un conductor

---

## 🔒 Seguridad Adicional

### 1. Firewall UFW (Opcional)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2Ban (Opcional)

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 📊 Monitoreo de Supabase

### Panel de Supabase

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Dashboard muestra:
   - Uso de base de datos
   - Queries ejecutadas
   - Bandwidth usado
   - Backups

### Crear Backup Manual

En Supabase Dashboard:
1. Ve a **Database** → **Backups**
2. Click en **Create backup**

---

## 🔄 Actualizar la Aplicación

```bash
# Conectarse al servidor
ssh -i ~/.ssh/fleetmaster-key.pem ubuntu@$ELASTIC_IP

# Ir al directorio
cd ~/FleetMaster-Pro

# Pull de cambios
git pull origin main

# Rebuild
sudo docker-compose build

# Reiniciar
sudo docker-compose down
sudo docker-compose up -d

# Verificar
curl http://localhost:3001/api/health
```

---

## 💾 Backup y Restauración

### Backup de Base de Datos (Supabase)

Supabase hace backups automáticos diarios. Para backup manual:

**Opción 1: Desde Supabase Dashboard**
1. Database → Backups → Create backup

**Opción 2: Con pg_dump (desde tu máquina local)**

```bash
# Instalar PostgreSQL client
sudo apt install postgresql-client -y

# Hacer backup
pg_dump "postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres" > backup_$(date +%Y%m%d).sql
```

### Backup de Uploads

```bash
# Desde el servidor
cd ~/FleetMaster-Pro
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/public/uploads

# Descargar a tu máquina local
scp -i ~/.ssh/fleetmaster-key.pem ubuntu@$ELASTIC_IP:~/FleetMaster-Pro/uploads_backup_*.tar.gz ./
```

---

## 🆘 Troubleshooting

### Problema: "Cannot connect to database"

**Solución:**
```bash
# Verificar DATABASE_URL
cat backend/.env.prod | grep DATABASE_URL

# Probar conexión desde el servidor
psql "postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

### Problema: "Port 80 already in use"

**Solución:**
```bash
# Ver qué está usando el puerto
sudo lsof -i :80

# Si es Apache, detenerlo
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Problema: CORS errors

**Solución:**
Verifica que `FRONTEND_URL` en `.env.prod` coincida con tu dominio:
```bash
FRONTEND_URL=https://tudominio.com  # Sin trailing slash
```

---

## 📊 Costos Finales

### Con Free Tier (12 meses)

| Servicio | Costo |
|----------|-------|
| AWS EC2 t3.micro | $0 |
| Supabase Free | $0 |
| Elastic IP | $0 |
| SSL | $0 |
| **TOTAL** | **$0/mes** |

### Después de Free Tier

| Servicio | Costo |
|----------|-------|
| AWS EC2 t3.micro | ~$7.50/mes |
| Supabase Pro | $25/mes |
| **TOTAL** | **~$32.50/mes** |

**Más barato que RDS:** Ahorras ~$8/mes vs EC2 + RDS (~$40/mes).

---

## 🎉 ¡Listo!

Tu aplicación ahora está corriendo en:
- ✅ AWS EC2 (Free Tier)
- ✅ Supabase PostgreSQL
- ✅ SSL con Let's Encrypt
- ✅ Docker containerizada
- ✅ Nginx como reverse proxy

**URL:** https://tudominio.com

**Tiempo de setup:** ~45-60 minutos  
**Costo con Free Tier:** $0/mes (12 meses)  
**Costo después:** ~$32.50/mes

---

## 📚 Próximos Pasos

1. **Configurar dominio personalizado**
2. **Configurar SMTP para emails**
3. **Configurar claves de Wompi de producción**
4. **Configurar monitoreo (Sentry, etc.)**
5. **Configurar backups automáticos de uploads**
