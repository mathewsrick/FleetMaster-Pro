#!/bin/bash

# 🔄 Script de Redespliegue Rápido - FleetMaster Hub
# Usa este script cuando hagas cambios al frontend

set -e

echo "🔄 Redespliegue Rápido de FleetMaster Hub"
echo "=========================================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Actualizar código
echo -e "${YELLOW}📥 1/5 Actualizando código...${NC}"
git pull origin main

# 2. Construir imagen SIN bajar el sitio (el contenedor viejo sigue sirviendo)
echo -e "${YELLOW}🐳 2/5 Construyendo imagen Docker...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache

# 3. Recrear contenedores. --remove-orphans elimina el contenedor huérfano
#    fleetmaster-nginx si todavía existe. No se hace "down" antes para no
#    dejar el sitio caído durante el build.
echo -e "${YELLOW}🔄 3/5 Recreando contenedores...${NC}"
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# 4. Limpiar SOLO imágenes dangling.
#    El VPS es compartido con otros proyectos (auditcore, ubora360, censo):
#    nunca usar "docker system prune", "-a" ni "--volumes", porque afectaría
#    a todos los contenedores y volúmenes del host.
echo -e "${YELLOW}🧹 4/5 Limpiando imágenes dangling...${NC}"
docker image prune -f

# 5. Verificar
echo -e "${YELLOW}✅ 5/5 Verificando despliegue...${NC}"

# Esperar hasta 90 s (loop de 5 s) a que el healthcheck reporte healthy
for i in $(seq 1 18); do
    HEALTH=$(docker inspect -f '{{.State.Health.Status}}' fleetmaster 2>/dev/null || echo "unknown")

    if [ "$HEALTH" = "healthy" ]; then
        echo -e "${GREEN}✅ Contenedor fleetmaster está healthy${NC}"
        break
    fi

    if [ "$i" -eq 18 ]; then
        echo -e "❌ ERROR: Contenedor fleetmaster no llegó a healthy (estado: ${HEALTH})"
        exit 1
    fi

    sleep 5
done

# Verificar que el contenedor esté en la red edge: Caddy resuelve el nombre ahí
if docker inspect -f '{{json .NetworkSettings.Networks}}' fleetmaster | grep -q '"edge"'; then
    echo -e "${GREEN}✅ Contenedor fleetmaster está en la red edge${NC}"
else
    echo -e "❌ ERROR: Contenedor fleetmaster no está en la red edge"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ ¡Despliegue completado exitosamente!${NC}"
echo ""
echo "🌐 Sitio: https://fleetmasterhub.com"
echo "📊 Ver logs: docker compose -f docker-compose.prod.yml logs -f fleetmaster"
echo ""
echo "💡 Prueba en modo incógnito para ver los cambios: Ctrl+Shift+N (Chrome) o Cmd+Shift+N (Mac)"
echo ""
