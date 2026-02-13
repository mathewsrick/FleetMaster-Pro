# 🔧 Solución: Configuración de Variables de Entorno

## ❌ Problema Identificado

Hay **inconsistencia** en la ubicación de archivos `.env`:

```
FleetMaster-Pro/
├── .env.prod              ← Docker Compose apunta aquí ❌
└── backend/
    └── .env               ← Backend lee desde aquí ✅
```

**Docker Compose** carga variables desde `.env.prod` (root)  
**Backend** (dotenv) busca variables en `backend/.env`

---

## ✅ Solución Recomendada: Usar `backend/.env.prod`

### Opción 1: Mantener todo en `backend/` (✅ RECOMENDADO)

Esta es la solución más limpia y consistente.

#### 1. Corregir `docker-compose.yml`

```yaml
version: "3.9"

services:
  fleetmaster:
    build: .
    container_name: fleetmaster-pro
    restart: unless-stopped
    expose:
      - "3001"
    env_file:
      - backend/.env.prod  # ✅ Cambiar a backend/.env.prod
    volumes:
      - uploads-data:/app/backend/public/uploads
    networks:
      - fleetmaster-network

  nginx:
    image: nginx:latest
    container_name: fleetmaster-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - fleetmaster
    networks:
      - fleetmaster-network

volumes:
  uploads-data:

networks:
  fleetmaster-network:
    driver: bridge
```

#### 2. Estructura de archivos correcta

```
FleetMaster-Pro/
├── backend/
│   ├── .env                  (desarrollo local)
│   ├── .env.example          (plantilla desarrollo)
│   └── .env.prod.example     (plantilla producción)
│
├── .env.prod                 ❌ ELIMINAR (no se usa)
└── docker-compose.yml        ✅ Apunta a backend/.env.prod
```

#### 3. En producción crear `backend/.env.prod`

```bash
# En el servidor AWS
cd /home/ubuntu/FleetMaster-Pro

# Crear el archivo en la ubicación correcta
nano backend/.env.prod
```

#### 4. Actualizar guías de despliegue

Todas las referencias deben ser:
```bash
# ✅ CORRECTO
nano backend/.env.prod

# ❌ INCORRECTO
nano .env.prod
```

---

### Opción 2: Usar archivo en root (alternativa)

Si prefieres mantener `.env.prod` en el root, necesitas modificar el backend.

#### Modificar `backend/src/server.ts`

```typescript
// backend/src/server.ts
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Buscar .env.prod en el root del proyecto
const rootDir = path.resolve(__dirname, '..', '..');
const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(rootDir, '.env.prod')
  : path.join(rootDir, 'backend', '.env');

config({ path: envPath });

// ... resto del código
```

**Desventaja:** Más complejo y propenso a errores.

---

## 🚀 Implementación de la Solución (Opción 1)

### Paso 1: Actualizar docker-compose.yml

```bash
cd /Users/developer5/dev/FleetMaster-Pro
```

**Editar `docker-compose.yml`:**

```yaml
env_file:
  - backend/.env.prod  # ← Cambiar esta línea
```

### Paso 2: Mover archivo .env.prod (si existe en root)

```bash
# Si existe .env.prod en root, moverlo a backend/
if [ -f .env.prod ]; then
  mv .env.prod backend/.env.prod
  echo "✅ Movido .env.prod a backend/"
fi
```

### Paso 3: Actualizar .gitignore

```bash
# .gitignore
backend/.env
backend/.env.prod
backend/.env.local

# No ignorar los .example
!backend/.env.example
!backend/.env.prod.example
```

### Paso 4: Verificar localmente

```bash
# Verificar que el archivo existe
ls -la backend/.env.prod.example

# Crear .env.prod de prueba
cp backend/.env.prod.example backend/.env.prod

# Probar Docker Compose
docker-compose config  # Validar configuración
docker-compose up --build  # Probar
```

---

## 📝 Actualizar Documentación

### Archivos que necesitan actualización:

1. **AWS-SUPABASE-DEPLOYMENT.md**
   ```bash
   # ❌ ANTES
   nano .env.prod
   
   # ✅ DESPUÉS
   nano backend/.env.prod
   ```

2. **AWS-SUPABASE-QUICK.md**
   ```bash
   # ❌ ANTES
   nano .env.prod
   
   # ✅ DESPUÉS
   nano backend/.env.prod
   ```

3. **DEPLOYMENT-SUMMARY.md**
   ```bash
   # ❌ ANTES
   Configurar `.env.prod` correctamente
   
   # ✅ DESPUÉS
   Configurar `backend/.env.prod` correctamente
   ```

4. **PRODUCTION-COMMANDS.md**
   ```bash
   # ❌ ANTES
   cat .env.prod | grep DATABASE_URL
   
   # ✅ DESPUÉS
   cat backend/.env.prod | grep DATABASE_URL
   ```

5. **help.sh**
   ```bash
   # Actualizar referencias a .env.prod
   ```

---

## 🧪 Testing

### Test 1: Validar configuración de Docker Compose

```bash
# Validar sintaxis
docker-compose config

# Debe mostrar:
# services:
#   fleetmaster:
#     env_file:
#       - backend/.env.prod
```

### Test 2: Verificar que el backend lee las variables

```bash
# Iniciar container
docker-compose up -d --build

# Ver las variables de entorno cargadas
docker exec fleetmaster-pro env | grep DATABASE_URL

# Debe mostrar el DATABASE_URL de backend/.env.prod
```

### Test 3: Verificar que la app funciona

```bash
# Health check
docker exec fleetmaster-pro wget -qO- http://localhost:3001/api/health

# Debe responder: {"status":"ok","timestamp":"..."}
```

---

## 🎯 Checklist de Corrección

### En desarrollo local:
- [ ] Actualizar `docker-compose.yml` para usar `backend/.env.prod`
- [ ] Mover `.env.prod` de root a `backend/` (si existe)
- [ ] Actualizar `.gitignore`
- [ ] Probar localmente con Docker Compose
- [ ] Commit y push cambios

### En servidor de producción:
- [ ] Crear `backend/.env.prod` (no `.env.prod` en root)
- [ ] Configurar todas las variables necesarias
- [ ] Pull últimos cambios del repositorio
- [ ] Rebuild containers: `docker-compose up -d --build`
- [ ] Verificar que el backend lee las variables correctamente
- [ ] Probar health check

### En documentación:
- [ ] Actualizar AWS-SUPABASE-DEPLOYMENT.md
- [ ] Actualizar AWS-SUPABASE-QUICK.md
- [ ] Actualizar DEPLOYMENT-SUMMARY.md
- [ ] Actualizar PRODUCTION-COMMANDS.md
- [ ] Actualizar PRODUCTION-READY-SUMMARY.md
- [ ] Actualizar help.sh

---

## 📂 Estructura Final Correcta

```
FleetMaster-Pro/
├── backend/
│   ├── .env                    ✅ Desarrollo local
│   ├── .env.example            ✅ Plantilla dev
│   ├── .env.prod               ✅ Producción (en servidor, gitignored)
│   └── .env.prod.example       ✅ Plantilla prod (versionado)
│
├── docker-compose.yml          ✅ env_file: backend/.env.prod
├── docker-compose.dev.yml      ✅ env_file: backend/.env
└── .gitignore                  ✅ Ignora backend/.env*
```

---

## 🚨 Errores Comunes

### Error 1: Variables no se cargan

**Síntoma:**
```
DATABASE_URL is not defined
```

**Solución:**
```bash
# Verificar que el archivo existe
ls -la backend/.env.prod

# Verificar que docker-compose lo referencia
docker-compose config | grep env_file

# Debe mostrar: - backend/.env.prod
```

### Error 2: Docker no encuentra el archivo

**Síntoma:**
```
ERROR: Couldn't find env file: backend/.env.prod
```

**Solución:**
```bash
# Crear el archivo
cp backend/.env.prod.example backend/.env.prod

# Editar con tus valores reales
nano backend/.env.prod
```

### Error 3: Permisos incorrectos

**Síntoma:**
```
Permission denied: backend/.env.prod
```

**Solución:**
```bash
chmod 600 backend/.env.prod
```

---

## 💡 Recomendación Final

**✅ Opción 1 (Mantener todo en `backend/`)** es la mejor porque:

- ✅ Más limpio y organizado
- ✅ Consistente con la estructura del proyecto
- ✅ No requiere modificar código de backend
- ✅ Fácil de entender para otros desarrolladores
- ✅ Backend y sus configuraciones están juntos

**Estructura lógica:**
```
backend/          ← Todo lo del backend
├── src/          ← Código
├── prisma/       ← DB schema
└── .env.prod     ← Configuración ✅
```

---

## 📚 Próximos Pasos

1. **Ahora:** Corregir `docker-compose.yml`
2. **Luego:** Actualizar toda la documentación
3. **Después:** Probar localmente
4. **Finalmente:** Actualizar en servidor de producción

---

<div align="center">

**🔧 Configuración de .env corregida**

[Ver solución](#-solución-recomendada-usar-backendenvprod)

</div>
