# 🚀 Resumen Rápido - Despliegue AWS Free Tier

## 💰 Costos
- **Free Tier (12 meses):** $0/mes
- **Después de 12 meses:** ~$23/mes

---

## 📝 Lista de Requisitos

### 1. Cuenta y Configuración AWS
- [ ] Cuenta de AWS creada
- [ ] AWS CLI instalado y configurado
- [ ] Access Key y Secret Key obtenidas

### 2. Dominio
- [ ] Dominio registrado (opcional: Freenom gratis o Namecheap ~$10/año)
- [ ] O usar subdominio de No-IP (gratis)

### 3. Configuración de Producción
- [ ] **DATABASE_URL** - RDS PostgreSQL endpoint
- [ ] **JWT_SECRET** - 64+ caracteres aleatorios
- [ ] **FRONTEND_URL** - Tu dominio (https://tudominio.com)
- [ ] **WOMPI Keys** - Claves de producción
- [ ] **SMTP** - Configuración de email (opcional)

### 4. CORS Configurado
- [ ] `FRONTEND_URL` en `.env.prod` correctamente configurado
- [ ] Dominio agregado en la whitelist de CORS (ya hecho en `app.ts`)

---

## ⚡ Comandos Rápidos (Copiar y Pegar)

### Setup Inicial (En tu máquina local)

```bash
# 1. Configurar AWS CLI
aws configure

# 2. Guardar estas variables
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)

# 3. Crear Security Groups
EC2_SG_ID=$(aws ec2 create-security-group --group-name fleetmaster-ec2-sg --description "FleetMaster EC2" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0

RDS_SG_ID=$(aws ec2 create-security-group --group-name fleetmaster-rds-sg --description "FleetMaster RDS" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $RDS_SG_ID --protocol tcp --port 5432 --source-group $EC2_SG_ID

# 4. Crear RDS (cambiar password)
aws rds create-db-instance \
  --db-instance-identifier fleetmaster-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.5 \
  --master-username fleetmaster_admin \
  --master-user-password 'CambiaEstePassword123!' \
  --allocated-storage 20 \
  --vpc-security-group-ids $RDS_SG_ID \
  --backup-retention-period 7 \
  --no-publicly-accessible \
  --db-name fleetmaster

# 5. Esperar a que RDS esté listo (~10 min)
aws rds wait db-instance-available --db-instance-identifier fleetmaster-db

# 6. Obtener RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier fleetmaster-db --query "DBInstances[0].Endpoint.Address" --output text)
echo "DATABASE_URL=postgresql://fleetmaster_admin:CambiaEstePassword123!@${RDS_ENDPOINT}:5432/fleetmaster"

# 7. Crear Key Pair
aws ec2 create-key-pair --key-name fleetmaster-key --query 'KeyMaterial' --output text > ~/.ssh/fleetmaster-key.pem
chmod 400 ~/.ssh/fleetmaster-key.pem

# 8. Crear EC2
AMI_ID=$(aws ec2 describe-images --owners 099720109477 --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" --output text)
INSTANCE_ID=$(aws ec2 run-instances --image-id $AMI_ID --instance-type t3.micro --key-name fleetmaster-key --security-group-ids $EC2_SG_ID --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=FleetMaster}]' --query 'Instances[0].InstanceId' --output text)

# 9. Esperar y obtener IP
aws ec2 wait instance-running --instance-ids $INSTANCE_ID
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

# 10. Crear Elastic IP
ALLOCATION_ID=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
aws ec2 associate-address --instance-id $INSTANCE_ID --allocation-id $ALLOCATION_ID
ELASTIC_IP=$(aws ec2 describe-addresses --allocation-ids $ALLOCATION_ID --query 'Addresses[0].PublicIp' --output text)

echo "✅ Tu servidor está en: $ELASTIC_IP"
echo "✅ Apunta tu dominio a esta IP"
```

### Configurar Servidor (Conectarse por SSH)

```bash
# Conectarse
ssh -i ~/.ssh/fleetmaster-key.pem ubuntu@TU_ELASTIC_IP

# Instalar Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Nginx y Certbot
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

# Salir y volver a entrar
exit
ssh -i ~/.ssh/fleetmaster-key.pem ubuntu@TU_ELASTIC_IP

# Clonar proyecto
git clone https://github.com/TU_USUARIO/FleetMaster-Pro.git
cd FleetMaster-Pro

# Crear .env.prod
nano backend/.env.prod
# (Pegar configuración - ver abajo)

# Build
sudo docker-compose build

# Iniciar
sudo docker-compose up -d

# Verificar
curl http://localhost:3001/api/health
```

### Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/fleetmaster
# (Copiar configuración del archivo AWS-FREE-TIER-DEPLOYMENT.md)

sudo ln -s /etc/nginx/sites-available/fleetmaster /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Configurar SSL (GRATIS)

```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
# Seguir instrucciones, elegir opción 2 (redirect)
```

---

## 📋 Configuración .env.prod Completa

```bash
# ===============================
# SERVIDOR
# ===============================
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tudominio.com

# ===============================
# BASE DE DATOS (Copiar del comando anterior)
# ===============================
DATABASE_URL=postgresql://fleetmaster_admin:TuPassword@tu-rds-endpoint.us-east-1.rds.amazonaws.com:5432/fleetmaster

# ===============================
# JWT (Generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# ===============================
JWT_SECRET=tu-secret-aleatorio-de-64-caracteres-o-mas-generado-arriba

# ===============================
# SUPERADMIN (Solo primera vez, luego comentar)
# ===============================
CREATE_SUPERADMIN=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=TuPasswordAdmin123!
ADMIN_EMAIL=admin@tudominio.com

# ===============================
# SMTP (Opcional - Gmail ejemplo)
# ===============================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password-de-gmail
SMTP_FROM="FleetMaster <noreply@tudominio.com>"
APP_URL=https://tudominio.com

# ===============================
# WOMPI (Usar claves de PRODUCCIÓN)
# ===============================
WOMPI_PUBLIC_KEY=pub_prod_xxxxxxxxxxxxx
WOMPI_INTEGRITY_SECRET=prod_integrity_xxxxxxxxxxxxx
WOMPI_WEBHOOK_SECRET=prod_webhook_xxxxxxxxxxxxx
WOMPI_API_URL=https://production.wompi.co/v1
```

---

## ✅ CORS ya está configurado

En `backend/src/app.ts` ya tienes configurado CORS para usar automáticamente:
- En **producción**: Tu dominio desde `process.env.FRONTEND_URL`
- En **desarrollo**: localhost:3000 y localhost:5173

Solo asegúrate de que `FRONTEND_URL` en `.env.prod` sea tu dominio real.

---

## 🎯 Verificación Final

```bash
# 1. Health check
curl https://tudominio.com/api/health

# 2. Login en la app
# Ir a: https://tudominio.com
# User: admin
# Pass: TuPasswordAdmin123!

# 3. Probar crear un vehículo

# 4. Verificar logs
sudo docker-compose logs -f
```

---

## 📊 Costos Desglosados

| Item | Free Tier | Después de 12 meses |
|------|-----------|---------------------|
| EC2 t3.micro | ✅ Gratis | ~$7.50/mes |
| RDS db.t3.micro | ✅ Gratis | ~$12.50/mes |
| EBS 20GB | ✅ Gratis | ~$2.00/mes |
| Data Transfer 15GB | ✅ Gratis | ~$1.35/mes |
| Elastic IP | ✅ Gratis | ✅ Gratis |
| SSL (Let's Encrypt) | ✅ Gratis | ✅ Gratis |
| **TOTAL** | **$0** | **~$23/mes** |

---

## 🆘 Comandos de Emergencia

```bash
# Ver logs
sudo docker-compose logs -f

# Reiniciar todo
sudo docker-compose restart

# Parar todo
sudo docker-compose down

# Iniciar todo
sudo docker-compose up -d

# Backup de base de datos
aws rds create-db-snapshot \
  --db-instance-identifier fleetmaster-db \
  --db-snapshot-identifier emergency-backup-$(date +%Y%m%d-%H%M)

# Ver uso de disco
df -h

# Ver uso de memoria
free -h

# Ver procesos de Docker
sudo docker ps

# Limpiar Docker (si te quedas sin espacio)
sudo docker system prune -a
```

---

## 📞 Soporte

**Documentación completa:** `AWS-FREE-TIER-DEPLOYMENT.md`

**Problemas comunes:**
1. **No se conecta a RDS:** Verifica security groups
2. **SSL no funciona:** Espera propagación de DNS (5-30 min)
3. **Puerto 80 ocupado:** `sudo systemctl stop apache2` si existe
4. **Sin espacio:** `sudo docker system prune -a`

---

**Tiempo estimado de setup:** 45-60 minutos
**Costo con Free Tier:** $0/mes por 12 meses
