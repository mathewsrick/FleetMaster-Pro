# 🚀 Despliegue en AWS Free Tier - FleetMaster Hub

## 💰 Costos Estimados

| Servicio | Configuración | Costo Mensual | Free Tier |
|----------|---------------|---------------|-----------|
| **EC2** | t3.micro (1 vCPU, 1GB RAM) | $0.0104/hora × 730h = ~$7.50 | ✅ 750 horas gratis/mes (12 meses) |
| **RDS PostgreSQL** | db.t3.micro (1 vCPU, 1GB RAM) | $0.017/hora × 730h = ~$12.50 | ✅ 750 horas gratis/mes (12 meses) |
| **EBS Storage** | 20GB SSD | ~$2.00 | ✅ 30GB gratis (12 meses) |
| **Data Transfer** | 15GB salida | ~$1.35 | ✅ 15GB gratis/mes |
| **Elastic IP** | 1 IP fija | $0 (mientras esté asociada) | ✅ Gratis |
| **TOTAL (con Free Tier)** | | **$0/mes** | **Primeros 12 meses** |
| **TOTAL (sin Free Tier)** | | **~$23/mes** | **Después de 12 meses** |

---

## 📋 Requisitos Previos

### 1. Cuenta de AWS
- ✅ Cuenta de AWS creada
- ✅ Tarjeta de crédito agregada (no se cobrará en Free Tier)
- ✅ Verificación de identidad completada

### 2. Herramientas Locales
```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Verificar instalación
aws --version

# Configurar credenciales
aws configure
# AWS Access Key ID: [Tu Access Key]
# AWS Secret Access Key: [Tu Secret Key]
# Default region name: us-east-1
# Default output format: json
```

### 3. Dominio (Opcional pero Recomendado)
- Puedes usar un subdominio gratuito de servicios como:
  - **Freenom** (gratuito)
  - **No-IP** (subdominio gratuito)
  - O comprar uno en Namecheap (~$10/año)

---

## 🎯 Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────┐
│            Internet (Tu Dominio)                │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         EC2 t3.micro (Free Tier)                │
│  ┌──────────────────────────────────────────┐   │
│  │  Nginx (Reverse Proxy)                   │   │
│  │  Port 80 → 443 (SSL)                     │   │
│  └────────┬─────────────────────────────────┘   │
│           │                                      │
│           ▼                                      │
│  ┌──────────────────────────────────────────┐   │
│  │  Docker Container                        │   │
│  │  - Backend (Node.js)    Port: 3001      │   │
│  │  - Frontend (Static)    Port: 80/443    │   │
│  └──────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│    RDS PostgreSQL db.t3.micro (Free Tier)       │
│    - Storage: 20GB SSD                          │
│    - Backups automáticos: 7 días                │
└─────────────────────────────────────────────────┘
```

---

## 📝 Paso a Paso - Despliegue Completo

### PASO 1: Crear VPC y Security Groups

```bash
# 1.1 Crear VPC (o usar la default)
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
echo "VPC ID: $VPC_ID"

# 1.2 Crear Security Group para EC2
EC2_SG_ID=$(aws ec2 create-security-group \
  --group-name fleetmaster-ec2-sg \
  --description "Security group for FleetMaster EC2" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

echo "EC2 Security Group: $EC2_SG_ID"

# 1.3 Permitir tráfico HTTP/HTTPS/SSH en EC2
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0

# 1.4 Crear Security Group para RDS
RDS_SG_ID=$(aws ec2 create-security-group \
  --group-name fleetmaster-rds-sg \
  --description "Security group for FleetMaster RDS" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

echo "RDS Security Group: $RDS_SG_ID"

# 1.5 Permitir PostgreSQL solo desde EC2
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $EC2_SG_ID
```

### PASO 2: Crear RDS PostgreSQL

```bash
# 2.1 Crear subnet group para RDS
aws rds create-db-subnet-group \
  --db-subnet-group-name fleetmaster-subnet-group \
  --db-subnet-group-description "Subnet group for FleetMaster" \
  --subnet-ids $(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text)

# 2.2 Crear instancia RDS PostgreSQL (Free Tier)
aws rds create-db-instance \
  --db-instance-identifier fleetmaster-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.5 \
  --master-username fleetmaster_admin \
  --master-user-password 'TuPasswordSegura123!' \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids $RDS_SG_ID \
  --db-subnet-group-name fleetmaster-subnet-group \
  --backup-retention-period 7 \
  --no-publicly-accessible \
  --db-name fleetmaster \
  --tags Key=Name,Value=FleetMaster-DB Key=Environment,Value=Production

echo "⏳ RDS está creándose... esto toma ~10 minutos"
echo "Verifica el estado con: aws rds describe-db-instances --db-instance-identifier fleetmaster-db"
```

**⚠️ IMPORTANTE:** Guarda estas credenciales:
- **Master username:** `fleetmaster_admin`
- **Master password:** `TuPasswordSegura123!` (cambia esto)
- **Database name:** `fleetmaster`

```bash
# 2.3 Esperar a que RDS esté disponible
aws rds wait db-instance-available --db-instance-identifier fleetmaster-db

# 2.4 Obtener el endpoint de RDS
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier fleetmaster-db \
  --query "DBInstances[0].Endpoint.Address" \
  --output text)

echo "✅ RDS Endpoint: $RDS_ENDPOINT"
echo "DATABASE_URL=postgresql://fleetmaster_admin:TuPasswordSegura123!@${RDS_ENDPOINT}:5432/fleetmaster"
```

### PASO 3: Crear EC2 Instance

```bash
# 3.1 Crear Key Pair para SSH
aws ec2 create-key-pair \
  --key-name fleetmaster-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/fleetmaster-key.pem

chmod 400 ~/.ssh/fleetmaster-key.pem

# 3.2 Encontrar la AMI de Ubuntu más reciente
AMI_ID=$(aws ec2 describe-images \
  --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
  --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" \
  --output text)

echo "AMI ID: $AMI_ID"

# 3.3 Crear instancia EC2 (Free Tier)
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t3.micro \
  --key-name fleetmaster-key \
  --security-group-ids $EC2_SG_ID \
  --block-device-mappings "[{\"DeviceName\":\"/dev/sda1\",\"Ebs\":{\"VolumeSize\":20,\"VolumeType\":\"gp2\"}}]" \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=FleetMaster-Server},{Key=Environment,Value=Production}]' \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Instance ID: $INSTANCE_ID"

# 3.4 Esperar a que la instancia esté running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# 3.5 Obtener la IP pública
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "✅ EC2 Public IP: $PUBLIC_IP"
```

### PASO 4: Asignar Elastic IP (Opcional pero Recomendado)

```bash
# 4.1 Asignar Elastic IP (IP fija gratis)
ALLOCATION_ID=$(aws ec2 allocate-address \
  --domain vpc \
  --query 'AllocationId' \
  --output text)

# 4.2 Asociar Elastic IP a la instancia
aws ec2 associate-address \
  --instance-id $INSTANCE_ID \
  --allocation-id $ALLOCATION_ID

# 4.3 Obtener la nueva IP fija
ELASTIC_IP=$(aws ec2 describe-addresses \
  --allocation-ids $ALLOCATION_ID \
  --query 'Addresses[0].PublicIp' \
  --output text)

echo "✅ Elastic IP: $ELASTIC_IP"
echo "Apunta tu dominio a esta IP: $ELASTIC_IP"
```

### PASO 5: Configurar el Servidor EC2

```bash
# 5.1 Conectarse por SSH
ssh -i ~/.ssh/fleetmaster-key.pem ubuntu@$ELASTIC_IP

# 5.2 Una vez dentro del servidor, ejecutar:
```

Dentro del servidor:

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

# Instalar Certbot para SSL gratuito
sudo apt install certbot python3-certbot-nginx -y

# Verificar instalaciones
docker --version
docker-compose --version
nginx -v

# Salir y volver a entrar para aplicar permisos de Docker
exit
```

### PASO 6: Clonar y Configurar el Proyecto

```bash
# Conectarse nuevamente
ssh -i ~/.ssh/fleetmaster-key.pem ubuntu@$ELASTIC_IP

# Clonar repositorio
git clone https://github.com/TU_USUARIO/FleetMaster-Pro.git
cd FleetMaster-Pro

# Crear archivo .env.prod
nano backend/.env.prod
```

Contenido de `.env.prod`:

```bash
# ===============================
# SERVIDOR
# ===============================
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tudominio.com

# ===============================
# BASE DE DATOS POSTGRESQL
# ===============================
DATABASE_URL=postgresql://fleetmaster_admin:TuPasswordSegura123!@fleetmaster-db.xxxxx.us-east-1.rds.amazonaws.com:5432/fleetmaster
JWT_SECRET=genera-un-secret-aleatorio-muy-largo-y-seguro-de-minimo-64-caracteres

# ===============================
# SUPERADMIN (Solo primera vez)
# ===============================
CREATE_SUPERADMIN=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=TuPasswordAdmin123!
ADMIN_EMAIL=admin@tudominio.com

# ===============================
# SMTP CONFIGURATION (Opcional - puedes configurar después)
# ===============================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM="FleetMaster <noreply@tudominio.com>"
APP_URL=https://tudominio.com

# ===============================
# WOMPI CONFIGURATION
# ===============================
WOMPI_PUBLIC_KEY=pub_prod_tu_key_de_produccion
WOMPI_INTEGRITY_SECRET=prod_integrity_tu_secret
WOMPI_WEBHOOK_SECRET=prod_webhook_tu_secret
WOMPI_API_URL=https://production.wompi.co/v1
```

**Generar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### PASO 7: Build y Deploy

```bash
# Hacer build de la aplicación
sudo docker-compose build

# Iniciar servicios
sudo docker-compose up -d

# Ver logs
sudo docker-compose logs -f

# Verificar que esté corriendo
curl http://localhost:3001/api/health
```

### PASO 8: Configurar Nginx como Reverse Proxy

```bash
# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/fleetmaster
```

Contenido:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # SSL certificates (Certbot configurará esto)
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # SSL optimization
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (static files)
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

    # Logs
    access_log /var/log/nginx/fleetmaster_access.log;
    error_log /var/log/nginx/fleetmaster_error.log;
}
```

```bash
# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/fleetmaster /etc/nginx/sites-enabled/

# Remover sitio default
sudo rm /etc/nginx/sites-enabled/default

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### PASO 9: Configurar SSL con Let's Encrypt (GRATIS)

```bash
# Obtener certificado SSL
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Seguir las instrucciones:
# 1. Ingresar email
# 2. Aceptar términos
# 3. Elegir opción 2 (Redirect HTTP to HTTPS)

# Verificar renovación automática
sudo certbot renew --dry-run

# Certbot renovará automáticamente cada 90 días
```

### PASO 10: Configurar DNS

En tu proveedor de dominio (Namecheap, GoDaddy, Cloudflare, etc.):

1. **Registro A:**
   - Name: `@`
   - Type: `A`
   - Value: `TU_ELASTIC_IP`
   - TTL: `3600`

2. **Registro A para www:**
   - Name: `www`
   - Type: `A`
   - Value: `TU_ELASTIC_IP`
   - TTL: `3600`

**Espera 5-30 minutos** para que se propague el DNS.

### PASO 11: Verificar Despliegue

```bash
# 1. Health check
curl https://tudominio.com/api/health

# 2. Verificar que Docker esté corriendo
sudo docker ps

# 3. Ver logs
sudo docker-compose logs -f backend

# 4. Acceder a la aplicación
# Abre tu navegador: https://tudominio.com
```

---

## 🔒 Configuración Post-Despliegue

### 1. Configurar Backups Automáticos de RDS

Ya está configurado con 7 días de retención. Para crear snapshot manual:

```bash
aws rds create-db-snapshot \
  --db-instance-identifier fleetmaster-db \
  --db-snapshot-identifier fleetmaster-snapshot-$(date +%Y%m%d)
```

### 2. Configurar Monitoreo

```bash
# Instalar CloudWatch Agent (opcional)
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

### 3. Configurar Auto-Start de Docker

```bash
# Docker ya inicia automáticamente, pero verificar:
sudo systemctl enable docker
sudo systemctl enable nginx

# Configurar restart automático del container
# Ya está en docker-compose.yml con: restart: unless-stopped
```

---

## 📊 Monitoreo y Mantenimiento

### Ver Logs

```bash
# Logs de la aplicación
sudo docker-compose logs -f

# Logs de Nginx
sudo tail -f /var/log/nginx/fleetmaster_error.log
sudo tail -f /var/log/nginx/fleetmaster_access.log

# Logs del sistema
sudo journalctl -u docker -f
```

### Actualizar la Aplicación

```bash
# 1. Hacer pull de cambios
cd ~/FleetMaster-Pro
git pull origin main

# 2. Rebuild
sudo docker-compose build

# 3. Reiniciar
sudo docker-compose down
sudo docker-compose up -d

# 4. Verificar
curl https://tudominio.com/api/health
```

### Backup Manual de Base de Datos

```bash
# Crear backup
sudo docker exec -t fleetmaster-db pg_dump -U fleetmaster_admin -d fleetmaster > backup_$(date +%Y%m%d).sql

# Descargar a tu máquina local
scp -i ~/.ssh/fleetmaster-key.pem ubuntu@$ELASTIC_IP:~/backup_*.sql ./
```

---

## 💰 Optimización de Costos

### 1. Después del Free Tier (12 meses)

Para reducir costos después:

```bash
# Opción A: Cambiar a instancias más pequeñas (no disponible en Free Tier)
# EC2: t4g.micro ($6/mes) - ARM processor
# RDS: db.t4g.micro ($10/mes)

# Opción B: Usar PostgreSQL en la misma EC2 (no recomendado para producción)
# Ahorro: ~$12/mes pero menos confiable

# Opción C: Usar Lightsail de AWS
# $10/mes todo incluido (menos flexible)
```

### 2. Reducir Data Transfer

```bash
# Usar CloudFront (CDN) para servir assets estáticos
# Primeros 50GB gratis/mes
```

### 3. Reserved Instances (si planeas usar por 1-3 años)

Ahorra hasta 60% en EC2 y RDS.

---

## 🆘 Troubleshooting

### Problema: No puedo conectarme por SSH

```bash
# Verificar que el security group permite SSH
aws ec2 describe-security-groups --group-ids $EC2_SG_ID

# Verificar que la instancia está corriendo
aws ec2 describe-instances --instance-ids $INSTANCE_ID

# Verificar permisos de la key
chmod 400 ~/.ssh/fleetmaster-key.pem
```

### Problema: La aplicación no se conecta a RDS

```bash
# Verificar que el security group de RDS permite conexiones desde EC2
aws ec2 describe-security-groups --group-ids $RDS_SG_ID

# Probar conexión desde EC2
ssh -i ~/.ssh/fleetmaster-key.pem ubuntu@$ELASTIC_IP
psql -h RDS_ENDPOINT -U fleetmaster_admin -d fleetmaster
```

### Problema: SSL no funciona

```bash
# Verificar que Certbot instaló correctamente
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --force-renewal

# Verificar configuración de Nginx
sudo nginx -t
```

---

## 📚 Recursos Adicionales

- [AWS Free Tier](https://aws.amazon.com/free/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

## ✅ Checklist Final

- [ ] RDS creado y accesible
- [ ] EC2 creada y configurada
- [ ] Docker y Docker Compose instalados
- [ ] Proyecto clonado y configurado
- [ ] `.env.prod` con todas las variables
- [ ] Nginx configurado
- [ ] SSL configurado con Let's Encrypt
- [ ] DNS apuntando al Elastic IP
- [ ] Aplicación accesible vía HTTPS
- [ ] Backups automáticos configurados
- [ ] Health check respondiendo

---

**¡Felicitaciones!** 🎉 Tu aplicación está corriendo en AWS con Free Tier.

**Costo Total:** $0/mes por 12 meses, luego ~$23/mes
