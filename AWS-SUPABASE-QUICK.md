# ⚡ AWS + Supabase - Guía Rápida

## 💰 Costos
- **Free Tier (12 meses):** $0/mes
- **Después de Free Tier:** ~$32.50/mes (EC2 + Supabase Pro)
- **Ahorro vs RDS:** ~$8/mes

---

## ✅ Checklist Rápido

### 1. Supabase
- [ ] Cuenta creada en [supabase.com](https://supabase.com)
- [ ] Proyecto creado
- [ ] Connection Pooler URL copiada
- [ ] IP de AWS whitelisted (o `0.0.0.0/0`)

### 2. AWS
- [ ] EC2 t3.micro creada
- [ ] Security Group configurado (22, 80, 443)
- [ ] Elastic IP asignada
- [ ] SSH key pair creada

### 3. Servidor
- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Nginx instalado
- [ ] Certbot instalado

### 4. Configuración
- [ ] `.env.prod` creado con DATABASE_URL de Supabase
- [ ] `docker-compose.yml` sin servicio `db`
- [ ] Migraciones ejecutadas en Supabase
- [ ] Nginx configurado
- [ ] SSL configurado

---

## 🚀 Comandos Rápidos

### Setup AWS (Local)

```bash
# 1. Configurar AWS CLI
aws configure

# 2. Variables
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)

# 3. Security Group
EC2_SG_ID=$(aws ec2 create-security-group --group-name fleetmaster-sg --description "FleetMaster" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0

# 4. Key Pair
aws ec2 create-key-pair --key-name fleetmaster-key --query 'KeyMaterial' --output text > ~/.ssh/fleetmaster-key.pem
chmod 400 ~/.ssh/fleetmaster-key.pem

# 5. EC2
AMI_ID=$(aws ec2 describe-images --owners 099720109477 --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" --output text)
INSTANCE_ID=$(aws ec2 run-instances --image-id $AMI_ID --instance-type t3.micro --key-name fleetmaster-key --security-group-ids $EC2_SG_ID --query 'Instances[0].InstanceId' --output text)
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# 6. Elastic IP
ALLOCATION_ID=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
aws ec2 associate-address --instance-id $INSTANCE_ID --allocation-id $ALLOCATION_ID
ELASTIC_IP=$(aws ec2 describe-addresses --allocation-ids $ALLOCATION_ID --query 'Addresses[0].PublicIp' --output text)

echo "✅ Tu servidor: $ELASTIC_IP"
```

### Configurar Servidor (SSH)

```bash
# Conectarse
ssh -i ~/.ssh/fleetmaster-key.pem ubuntu@TU_ELASTIC_IP

# Instalar todo de una vez
curl -fsSL https://get.docker.com | sudo sh && \
sudo usermod -aG docker ubuntu && \
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
sudo chmod +x /usr/local/bin/docker-compose && \
sudo apt update && \
sudo apt install nginx certbot python3-certbot-nginx nodejs npm -y && \
sudo npm install -g pnpm

# Salir y volver a entrar
exit
ssh -i ~/.ssh/fleetmaster-key.pem ubuntu@TU_ELASTIC_IP

# Clonar proyecto
git clone https://github.com/TU_USUARIO/FleetMaster-Pro.git
cd FleetMaster-Pro
```

### Configurar .env.prod

```bash
nano backend/.env.prod
```

```bash
# Servidor
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tudominio.com

# Supabase (Connection Pooler URL)
DATABASE_URL=postgresql://postgres.xxxxx:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# JWT (generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=tu-secret-de-64-caracteres

# SuperAdmin (primera vez)
CREATE_SUPERADMIN=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=TuPassword123!
ADMIN_EMAIL=admin@tudominio.com

# Wompi (producción)
WOMPI_PUBLIC_KEY=pub_prod_xxxxx
WOMPI_INTEGRITY_SECRET=prod_integrity_xxxxx
WOMPI_WEBHOOK_SECRET=prod_webhook_xxxxx
WOMPI_API_URL=https://production.wompi.co/v1
```

### Ejecutar Migraciones

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate:deploy
```

### Deploy

```bash
# Build y iniciar
sudo docker-compose build
sudo docker-compose up -d

# Verificar
curl http://localhost:3001/api/health
```

### Nginx

```bash
sudo nano /etc/nginx/sites-available/fleetmaster
```

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        root /home/ubuntu/FleetMaster-Pro/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        alias /home/ubuntu/FleetMaster-Pro/backend/public/uploads;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/fleetmaster /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### SSL

```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
# Elegir opción 2 (redirect)
```

---

## 📋 docker-compose.yml (Sin DB)

Asegúrate de que tu `docker-compose.yml` **NO** tenga servicio `db`:

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

## 🔍 Verificación

```bash
# Health check
curl https://tudominio.com/api/health

# Logs
sudo docker-compose logs -f

# Status Docker
sudo docker ps

# Status Nginx
sudo systemctl status nginx

# SSL check
curl -I https://tudominio.com
```

---

## 🔄 Actualizar App

```bash
cd ~/FleetMaster-Pro
git pull origin main
sudo docker-compose build
sudo docker-compose down && sudo docker-compose up -d
```

---

## 💾 Backups

### Base de Datos (Supabase)
- Automático: Diario en Supabase Pro
- Manual: Dashboard → Database → Backups → Create

### Uploads
```bash
cd ~/FleetMaster-Pro
tar -czf uploads_backup.tar.gz backend/public/uploads
```

---

## 🆘 Troubleshooting

### Cannot connect to database
```bash
# Verificar URL
cat backend/.env.prod | grep DATABASE_URL

# Probar conexión
psql "TU_CONNECTION_STRING_DE_SUPABASE"
```

### Port 80 in use
```bash
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### CORS errors
Verifica que `FRONTEND_URL` en `.env.prod` sea correcto (sin `/` al final).

---

## 💰 Costos Comparados

| Config | EC2 | Base de Datos | Total |
|--------|-----|---------------|-------|
| **AWS + Supabase Free** | $0 (12m) | $0 | **$0** |
| **AWS + Supabase Pro** | $0 (12m) | $25 | **$25/mes** |
| **Después Free Tier** | $7.50 | $25 | **$32.50/mes** |
| **AWS + RDS** | $7.50 | $35 | **$42.50/mes** |

**Ahorro:** ~$10/mes con Supabase 💰

---

## 📚 Documentación Completa

Ver: `AWS-SUPABASE-DEPLOYMENT.md`

---

**Tiempo estimado:** 45-60 minutos  
**Nivel:** Intermedio  
**Costo Free Tier:** $0/mes (12 meses)
