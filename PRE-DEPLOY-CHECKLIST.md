# ✅ Checklist Pre-Despliegue - FleetMaster Hub

## 🔐 Seguridad

- [ ] **JWT_SECRET** cambiado y seguro (mínimo 64 caracteres aleatorios)
- [ ] **DATABASE_URL** configurada con credenciales de producción
- [ ] **Wompi Keys** de PRODUCCIÓN (no test)
- [ ] Archivo `.env.prod` configurado y **NO** en Git
- [ ] CORS configurado solo para tu dominio
- [ ] Rate limiting configurado
- [ ] Helmet configurado

## 📧 Email / SMTP

- [ ] **SMTP_HOST** correcto
- [ ] **SMTP_PORT** correcto (587 o 465)
- [ ] **SMTP_USER** y **SMTP_PASS** válidos
- [ ] **SMTP_FROM** con email verificado
- [ ] **APP_URL** con URL de producción
- [ ] Prueba de envío de correo realizada

## 💳 Pagos (Wompi)

- [ ] **WOMPI_PUBLIC_KEY** de producción
- [ ] **WOMPI_INTEGRITY_SECRET** de producción
- [ ] **WOMPI_WEBHOOK_SECRET** de producción
- [ ] **WOMPI_API_URL** apunta a producción: `https://production.wompi.co/v1`
- [ ] Webhook configurado en panel de Wompi: `https://tudominio.com/api/wompi/webhook`
- [ ] Prueba de pago realizada
- [ ] Ver guía completa: [WOMPI-WEBHOOKS-PRODUCTION.md](./WOMPI-WEBHOOKS-PRODUCTION.md)

## 🗄️ Base de Datos

- [ ] PostgreSQL de producción instalado y accesible
- [ ] **DATABASE_URL** con formato correcto: `postgresql://user:pass@host:5432/dbname`
- [ ] Backup de base de datos configurado
- [ ] Migraciones probadas
- [ ] Conexión desde aplicación verificada

## 🌐 Frontend

- [ ] **FRONTEND_URL** en `.env.prod` correcto
- [ ] **VITE_API_URL** en frontend apunta a producción
- [ ] Build del frontend exitoso
- [ ] Assets cargando correctamente

## 🐳 Docker

- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Volúmenes para uploads configurados
- [ ] Health check funcionando
- [ ] Dockerfile probado localmente

## 🔄 Infraestructura

- [ ] Servidor/VPS preparado
- [ ] Dominio configurado
- [ ] DNS apuntando al servidor
- [ ] Firewall configurado (puerto 80, 443, 3001)
- [ ] SSL/HTTPS configurado (Let's Encrypt recomendado)
- [ ] Nginx/Reverse proxy configurado (opcional)

## 📊 Monitoreo

- [ ] Logs funcionando
- [ ] Health check endpoint `/api/health` responde
- [ ] Plan de backup definido
- [ ] Estrategia de rollback definida

## 🧪 Testing

- [ ] Build local exitoso: `pnpm build`
- [ ] Docker build exitoso: `docker-compose build`
- [ ] API endpoints respondiendo
- [ ] Autenticación funcionando
- [ ] Pagos funcionando
- [ ] Emails enviándose
- [ ] Uploads funcionando

## 📝 Documentación

- [ ] README actualizado
- [ ] DEPLOYMENT.md revisado
- [ ] Credenciales documentadas (en lugar seguro)
- [ ] Procedimientos de emergencia documentados

## 🚀 Despliegue Final

Una vez completado el checklist:

```bash
# 1. Copiar y configurar variables
cp .env.prod.example .env.prod
nano .env.prod  # Completar todas las variables

# 2. Ejecutar script de despliegue
./deploy.sh

# 3. Verificar logs
docker-compose logs -f

# 4. Verificar health check
curl http://localhost:3001/api/health

# 5. Pruebas manuales
- Registro de usuario
- Login
- CRUD de vehículos
- CRUD de conductores
- Pago de suscripción
- Recepción de emails
```

## 🆘 En Caso de Problemas

1. **Revisar logs**: `docker-compose logs fleetmaster`
2. **Verificar variables**: `docker-compose config`
3. **Rollback**: `./rollback.sh`
4. **Contactar soporte**: [Tu contacto]

---

**Fecha de última revisión**: ________________  
**Responsable**: ________________  
**Estado**: [ ] Pendiente [ ] Completado [ ] Desplegado
