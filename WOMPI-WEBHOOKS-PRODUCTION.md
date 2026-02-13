# 🔔 Configuración de Webhooks Wompi para Producción

## 📋 Estado Actual

✅ **El código está listo para producción** - No hay referencias a ngrok  
✅ **Webhooks implementados con validación de firma**  
✅ **Protección antifraude y anti-replay**

---

## 🎯 Diferencias entre Desarrollo y Producción

### Desarrollo (con ngrok)
```bash
# Variables en .env de desarrollo
WOMPI_PUBLIC_KEY=pub_test_xxxxx
WOMPI_INTEGRITY_SECRET=test_integrity_xxxxx
WOMPI_WEBHOOK_SECRET=test_webhook_xxxxx
WOMPI_API_URL=https://sandbox.wompi.co/v1

# URL de webhook temporal con ngrok
https://xxxx-xx-xxx-xxx-xxx.ngrok-free.app/api/wompi/webhook
```

### Producción (sin ngrok)
```bash
# Variables en .env.prod
WOMPI_PUBLIC_KEY=pub_prod_xxxxx
WOMPI_INTEGRITY_SECRET=prod_integrity_xxxxx
WOMPI_WEBHOOK_SECRET=prod_webhook_xxxxx
WOMPI_API_URL=https://production.wompi.co/v1

# URL de webhook permanente
https://tudominio.com/api/wompi/webhook
```

---

## 🚀 Pasos para Configurar Webhooks en Producción

### 1️⃣ Obtener Credenciales de Producción de Wompi

1. Ir a **[Dashboard de Wompi](https://comercios.wompi.co)**
2. Iniciar sesión con tu cuenta de comercio
3. Ir a **Configuración > Credenciales**
4. Copiar las credenciales de **PRODUCCIÓN**:
   - `Public Key` (empieza con `pub_prod_`)
   - `Integrity Secret` (prod_integrity_)
   - `Webhook Secret` (prod_webhook_)

⚠️ **IMPORTANTE:** Usar SOLO credenciales de producción, NO de sandbox/test

---

### 2️⃣ Configurar Variables de Entorno en el Servidor

**Editar `backend/.env.prod` en tu servidor AWS:**

```bash
# Conectarse al servidor
ssh -i tu-key.pem ubuntu@tu-elastic-ip

# Editar .env.prod
cd /home/ubuntu/FleetMaster-Pro
nano backend/.env.prod
```

**Agregar/actualizar:**

```bash
# ===============================
# WOMPI PRODUCCIÓN
# ===============================
WOMPI_PUBLIC_KEY=pub_prod_xxxxx_TU_CLAVE_REAL
WOMPI_INTEGRITY_SECRET=prod_integrity_xxxxx_TU_CLAVE_REAL
WOMPI_WEBHOOK_SECRET=prod_webhook_xxxxx_TU_CLAVE_REAL
WOMPI_API_URL=https://production.wompi.co/v1

# App URL (necesario para webhooks)
APP_URL=https://tudominio.com
```

**Guardar:** `Ctrl + O`, `Enter`, `Ctrl + X`

---

### 3️⃣ Reiniciar Aplicación

```bash
# Reiniciar Docker container para cargar nuevas variables
docker-compose restart

# Verificar que levantó correctamente
docker logs -f fleetmaster-pro --tail 50
```

---

### 4️⃣ Configurar URL de Webhook en Dashboard de Wompi

1. Ir a **[Dashboard de Wompi](https://comercios.wompi.co)**
2. **Configuración > Webhooks**
3. Agregar nueva URL de webhook:
   ```
   https://tudominio.com/api/wompi/webhook
   ```

4. Seleccionar eventos a recibir:
   - ✅ `transaction.updated` (⭐ REQUERIDO)
   - ✅ `transaction.created` (opcional)

5. **Guardar configuración**

⚠️ **CRÍTICO:** La URL debe usar **HTTPS** (no HTTP)

---

### 5️⃣ Verificar Configuración

#### Test 1: Verificar que el endpoint existe

```bash
# Desde tu máquina local
curl https://tudominio.com/api/health

# Debe responder:
# {"status":"ok","timestamp":"2024-XX-XXTXX:XX:XX.XXXZ"}
```

#### Test 2: Verificar CORS

```bash
curl -X OPTIONS https://tudominio.com/api/wompi/webhook \
  -H "Origin: https://production.wompi.co" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

#### Test 3: Hacer un pago real de prueba

1. Ir a tu sitio: `https://tudominio.com`
2. Comprar un plan (usa tarjeta de prueba de Wompi si es sandbox)
3. Verificar en logs del servidor:

```bash
# Ver logs en tiempo real
docker logs -f fleetmaster-pro --tail 100

# Buscar mensajes de webhook
docker logs fleetmaster-pro 2>&1 | grep -i webhook
docker logs fleetmaster-pro 2>&1 | grep -i wompi
```

---

## 🔒 Seguridad Implementada

### ✅ Validación de Firma (Checksum)

El código valida TODAS las peticiones del webhook usando SHA256:

```typescript
// backend/src/modules/wompi/wompi.service.ts
export const validateWebhookSignature = (event: any, checksum: string): boolean => {
  const transaction = event.data.transaction;
  const chain = `${transaction.id}${transaction.status}${transaction.amount_in_cents}${event.timestamp}${ENV.WOMPI_WEBHOOK_SECRET}`;
  const generated = crypto.createHash('sha256').update(chain).digest('hex');
  return generated === checksum;
};
```

**Protege contra:**
- ❌ Webhooks falsos
- ❌ Man-in-the-middle attacks
- ❌ Requests no autorizados

---

### ✅ Validación Antifraude

```typescript
// Valida que el monto no fue alterado
if (amount_in_cents !== localTx.amount * 100) {
  throw new Error('Monto alterado');
}

// Valida la moneda
if (currency !== 'COP') {
  throw new Error('Moneda inválida');
}
```

**Protege contra:**
- ❌ Alteración de montos
- ❌ Cambio de moneda
- ❌ Manipulación de transacciones

---

### ✅ Protección Anti-Replay

```typescript
// Si ya fue procesado, no hacer nada
if (localTx.status === 'APPROVED') return;

// Detectar intentos de replay
const existingWompi = await tx.transaction.findUnique({
  where: { wompiId }
});

if (existingWompi && existingWompi.reference !== reference) {
  throw new Error('Replay attack detectado');
}
```

**Protege contra:**
- ❌ Procesamiento duplicado
- ❌ Replay attacks
- ❌ Doble activación de suscripciones

---

### ✅ Rate Limiting en Webhooks

```typescript
// backend/src/app.ts
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100,
  message: { error: 'Rate limit exceeded' }
});

app.use('/api/wompi/webhook', webhookLimiter as any);
```

**Protege contra:**
- ❌ DDoS
- ❌ Spam de webhooks
- ❌ Sobrecarga del servidor

---

## 🧪 Testing de Webhooks

### Opción 1: Test Manual con curl

```bash
# Crear un payload de prueba (⚠️ NO funcionará sin firma válida)
curl -X POST https://tudominio.com/api/wompi/webhook \
  -H "Content-Type: application/json" \
  -H "X-Event-Checksum: firma-invalida" \
  -d '{
    "event": "transaction.updated",
    "data": {
      "transaction": {
        "id": "test123",
        "status": "APPROVED",
        "reference": "FMP-TEST",
        "amount_in_cents": 5990000
      }
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }'

# Respuesta esperada: 401 Unauthorized (firma inválida)
```

### Opción 2: Test desde Dashboard de Wompi

1. Ir a **Dashboard de Wompi**
2. **Configuración > Webhooks**
3. Buscar tu webhook configurado
4. Click en **"Probar Webhook"** o **"Send Test Event"**
5. Verificar logs del servidor

### Opción 3: Pago Real de Prueba

**Si estás en modo producción:**
- Usa tarjetas reales (se procesarán pagos reales)
- O configura temporalmente en sandbox y usa tarjetas de prueba:

**Tarjetas de Prueba de Wompi (solo sandbox):**
```
APROBADA:
Número: 4242 4242 4242 4242
CVV: cualquier 3 dígitos
Fecha: cualquier fecha futura

RECHAZADA:
Número: 4000 0000 0000 0002
```

---

## 📊 Monitoreo de Webhooks

### Ver Logs en Tiempo Real

```bash
# Conectar al servidor
ssh -i tu-key.pem ubuntu@tu-elastic-ip

# Ver logs filtrados por webhook
docker logs -f fleetmaster-pro 2>&1 | grep -i webhook

# Ver todos los eventos de Wompi
docker logs -f fleetmaster-pro 2>&1 | grep -i wompi
```

### Logs Esperados (Exitoso)

```
[2024-XX-XX] ✅ Webhook recibido: transaction.updated
[2024-XX-XX] ✅ Firma válida
[2024-XX-XX] ✅ Transacción aprobada: FMP-XXXXX
[2024-XX-XX] ✅ Suscripción activada para usuario: xxxxx
[2024-XX-XX] ✅ Email de confirmación enviado
```

### Logs de Error (Rechazado)

```
[2024-XX-XX] ❌ Firma inválida
[2024-XX-XX] ❌ Webhook error: Monto alterado
[2024-XX-XX] ❌ Replay attack detectado
```

---

## 🚨 Troubleshooting

### Problema 1: Webhook no llega

**Síntomas:**
- Pago se procesa en Wompi
- Pero la suscripción no se activa en tu app

**Soluciones:**

1. **Verificar URL configurada en Wompi:**
   ```
   ✅ https://tudominio.com/api/wompi/webhook
   ❌ http://tudominio.com/api/wompi/webhook (sin HTTPS)
   ❌ https://tudominio.com/api/webhook (ruta incorrecta)
   ```

2. **Verificar SSL:**
   ```bash
   curl -I https://tudominio.com
   # Debe responder con HTTP/2 200
   ```

3. **Verificar que el container esté corriendo:**
   ```bash
   docker ps | grep fleetmaster
   ```

4. **Ver logs de Nginx:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log | grep webhook
   ```

---

### Problema 2: Firma inválida

**Síntomas:**
```
❌ Firma inválida
```

**Soluciones:**

1. **Verificar `WOMPI_WEBHOOK_SECRET` en `.env.prod`:**
   ```bash
   cat backend/.env.prod | grep WOMPI_WEBHOOK_SECRET
   # Debe coincidir con el del Dashboard de Wompi
   ```

2. **Reiniciar container después de cambiar variables:**
   ```bash
   docker-compose restart
   ```

3. **Verificar que estés usando credenciales de producción:**
   - ✅ `prod_webhook_xxxxx`
   - ❌ `test_webhook_xxxxx`

---

### Problema 3: Monto alterado

**Síntomas:**
```
❌ Webhook error: Monto alterado
```

**Solución:**

Verificar que los precios en el código coincidan con Wompi:

```typescript
// backend/src/modules/wompi/wompi.controller.ts
const BASE_PRICES: Record<string, number> = {
  'basico': 59900,     // $59,900 COP
  'pro': 95900,        // $95,900 COP
  'enterprise': 145900 // $145,900 COP
};
```

---

### Problema 4: Rate limit excedido

**Síntomas:**
```json
{"error":"Rate limit exceeded"}
```

**Solución:**

Aumentar el límite de rate limiting (solo si es legítimo):

```typescript
// backend/src/app.ts
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200, // Aumentar de 100 a 200
  message: { error: 'Rate limit exceeded' }
});
```

---

## ✅ Checklist Final

### Antes de ir a producción:

- [ ] Credenciales de Wompi de **producción** obtenidas
- [ ] `WOMPI_PUBLIC_KEY` en `.env.prod` actualizado
- [ ] `WOMPI_INTEGRITY_SECRET` en `.env.prod` actualizado
- [ ] `WOMPI_WEBHOOK_SECRET` en `.env.prod` actualizado
- [ ] `WOMPI_API_URL=https://production.wompi.co/v1` configurado
- [ ] `APP_URL=https://tudominio.com` configurado
- [ ] Container reiniciado después de cambios
- [ ] URL de webhook configurada en Dashboard de Wompi
- [ ] SSL/HTTPS funcionando correctamente
- [ ] Test de pago realizado y exitoso
- [ ] Logs verificados sin errores
- [ ] Email de confirmación recibido

---

## 📚 Documentación Relacionada

- **Wompi Docs:** https://docs.wompi.co/docs/en/eventos
- **Dashboard Wompi:** https://comercios.wompi.co
- **Código del webhook:** `backend/src/modules/wompi/wompi.controller.ts`
- **Configuración:** `backend/.env.prod.example`

---

## 🎉 Resumen

✅ **Tu código ya está listo para producción**  
✅ **No hay referencias a ngrok**  
✅ **Webhooks con validación de firma implementados**  
✅ **Protección antifraude y anti-replay activa**  
✅ **Rate limiting configurado**

**Solo necesitas:**
1. Obtener credenciales de producción de Wompi
2. Configurar `.env.prod` con las claves reales
3. Configurar la URL del webhook en Dashboard de Wompi
4. ¡Listo para recibir pagos!

---

<div align="center">

**💳 Webhooks de Wompi listos para producción**

[⬆ Volver al índice](./DOCUMENTATION-INDEX.md)

</div>
