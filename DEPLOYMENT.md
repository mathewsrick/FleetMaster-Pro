# FleetMaster Pro - Deployment Guide

## 📁 Estructura del Proyecto

```
FleetMaster-Pro/
├── frontend/              # Frontend React + Vite
│   ├── src/
│   │   ├── pages/        # Páginas de la aplicación
│   │   ├── services/     # Servicios API
│   │   ├── types/        # Definiciones TypeScript
│   │   ├── components/   # Componentes reutilizables
│   │   ├── App.tsx       # Componente principal
│   │   └── index.tsx     # Entry point
│   ├── public/           # Archivos estáticos
│   ├── package.json      # Dependencias frontend
│   ├── tsconfig.json     # Config TypeScript
│   └── vite.config.ts    # Config Vite
├── backend/              # Backend Express + Prisma
│   ├── src/
│   │   ├── modules/      # Módulos de negocio
│   │   ├── middlewares/  # Middlewares
│   │   ├── config/       # Configuraciones
│   │   └── server.ts     # Entry point
│   ├── prisma/           # Schema y migraciones
│   └── public/           # Assets públicos
├── package.json          # Dependencias raíz
├── tsconfig.server.json  # Config TypeScript backend
└── Dockerfile            # Multi-stage build optimizado
```

## 🚀 Despliegue en AWS EC2

### Prerrequisitos

1. **Instancia EC2**
   - Amazon Linux 2023 o Ubuntu 22.04 LTS
   - t3.small mínimo (2 vCPU, 2GB RAM)
   - 20GB de almacenamiento
   - Security Group con puertos 80, 443, 3001 abiertos

2. **Servicios**
   - PostgreSQL (RDS recomendado)
   - Dominio configurado en Route 53
   - Certificado SSL en ACM (opcional, para ALB)

### Paso 1: Preparar la Instancia EC2

```bash
# Conectar a EC2
ssh -i "tu-key.pem" ec2-user@tu-instancia.amazonaws.com

# Actualizar sistema
sudo yum update -y  # Amazon Linux
# o
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Instalar Docker
sudo yum install docker -y  # Amazon Linux
# o
sudo apt install docker.io -y  # Ubuntu

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sesión para aplicar permisos
exit
# Volver a conectar
```

### Paso 2: Configurar Variables de Entorno

```bash
# Crear archivo .env.prod
cat > .env.prod << 'EOF'
NODE_ENV=production
PORT=3001

# Database (RDS PostgreSQL)
DATABASE_URL="postgresql://user:password@your-rds-endpoint:5432/fleetmaster?schema=public"

# JWT
JWT_SECRET="tu-secreto-super-seguro-aqui"

# Email (SES o SMTP)
EMAIL_HOST="email-smtp.us-east-1.amazonaws.com"
EMAIL_PORT=587
EMAIL_USER="tu-smtp-user"
EMAIL_PASS="tu-smtp-password"
EMAIL_FROM="noreply@tudominio.com"

# Wompi
WOMPI_PUBLIC_KEY="pub_test_xxxxx"
WOMPI_PRIVATE_KEY="prv_test_xxxxx"
WOMPI_EVENTS_SECRET="test_events_xxxxx"

# Frontend URL
FRONTEND_URL="https://tudominio.com"

# Gemini API (opcional)
GEMINI_API_KEY="tu-api-key"
EOF
```

### Paso 3: Construir y Desplegar

#### Opción A: Docker Compose (Recomendado)

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/FleetMaster-Pro.git
cd FleetMaster-Pro

# Construir imagen
docker build -t fleetmaster-pro:latest .

# Ejecutar con Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

**docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  app:
    image: fleetmaster-pro:latest
    container_name: fleetmaster-app
    restart: unless-stopped
    ports:
      - "3001:3001"
    env_file:
      - .env.prod
    volumes:
      - ./backend/public/uploads:/app/backend/public/uploads
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/api/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    container_name: fleetmaster-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
```

#### Opción B: Ejecutar Docker Directamente

```bash
# Construir
docker build -t fleetmaster-pro:latest .

# Ejecutar
docker run -d \
  --name fleetmaster-app \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file .env.prod \
  -v $(pwd)/backend/public/uploads:/app/backend/public/uploads \
  fleetmaster-pro:latest
```

### Paso 4: Configurar Nginx como Reverse Proxy

```nginx
# /etc/nginx/sites-available/fleetmaster
server {
    listen 80;
    server_name tudominio.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy al backend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Assets estáticos con caché
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Paso 5: Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo yum install certbot python3-certbot-nginx -y  # Amazon Linux
# o
sudo apt install certbot python3-certbot-nginx -y  # Ubuntu

# Obtener certificado
sudo certbot --nginx -d tudominio.com

# Renovación automática (ya configurada por certbot)
sudo certbot renew --dry-run
```

### Paso 6: Monitoreo y Logs

```bash
# Ver logs de la aplicación
docker logs -f fleetmaster-app

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitorear recursos
docker stats

# Health check
curl http://localhost:3001/api/health
```

## 🔧 Mantenimiento

### Actualizar la Aplicación

```bash
# Pull últimos cambios
git pull origin main

# Rebuild
docker build -t fleetmaster-pro:latest .

# Reiniciar
docker-compose down
docker-compose up -d

# O con Docker directo
docker stop fleetmaster-app
docker rm fleetmaster-app
docker run -d ... # (mismo comando anterior)
```

### Backup de Base de Datos

```bash
# Backup automático (cron job)
0 2 * * * pg_dump $DATABASE_URL > /backups/fleetmaster-$(date +\%Y\%m\%d).sql
```

### Monitoreo con CloudWatch

```bash
# Instalar CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configurar métricas personalizadas
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

## 📊 Optimizaciones de Producción

1. **Base de Datos**: Usar RDS PostgreSQL con Multi-AZ
2. **Archivos**: S3 para uploads en lugar de volumen local
3. **CDN**: CloudFront para assets estáticos
4. **Load Balancer**: ALB con Auto Scaling Group
5. **Caché**: ElastiCache Redis para sesiones
6. **Logs**: CloudWatch Logs para centralización

## 🔒 Seguridad

- ✅ Non-root user en Docker
- ✅ Security headers en Nginx
- ✅ SSL/TLS con certificados válidos
- ✅ Variables de entorno encriptadas
- ✅ Rate limiting habilitado
- ✅ CORS configurado correctamente
- ✅ Health checks implementados

## 📞 Soporte

Para problemas o preguntas, contactar al equipo de desarrollo.
