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

# 1. Bajando imagen Docker
echo -e "${YELLOW}🐳 1/4 Bajando imagen Docker...${NC}"
docker compose -f docker-compose.prod.yml down

# 2. Limpiar imágenes Docker
echo -e "${YELLOW}🐳 2/4 Limpiando imágenes Docker...${NC}"
docker system prune -a --volumes -f

# 3. Reconstruyendo contenedores
echo -e "${YELLOW}🔄 3/4 Reconstruyendo contenedores...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# 4. Verificar
echo -e "${YELLOW}✅ 4/4 Verificando despliegue...${NC}"
sleep 5

# Verificar que el contenedor esté corriendo
if docker ps | grep -q fleetmaster; then
    echo -e "${GREEN}✅ Contenedor fleetmaster está corriendo${NC}"
else
    echo -e "❌ ERROR: Contenedor fleetmaster no está corriendo"
    exit 1
fi

# Verificar que nginx esté corriendo
if docker ps | grep -q fleetmaster-nginx; then
    echo -e "${GREEN}✅ Contenedor nginx está corriendo${NC}"
else
    echo -e "❌ ERROR: Contenedor nginx no está corriendo"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ ¡Despliegue completado exitosamente!${NC}"
echo ""
echo "🌐 Sitio: https://fleetmasterhub.com"
echo "📊 Ver logs: docker compose logs -f"
echo ""
echo "💡 Prueba en modo incógnito para ver los cambios: Ctrl+Shift+N (Chrome) o Cmd+Shift+N (Mac)"
echo ""
