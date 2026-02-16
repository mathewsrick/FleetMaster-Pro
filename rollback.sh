#!/bin/bash

# 🔄 Script de Rollback - FleetMaster Hub

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Iniciando rollback de FleetMaster Hub...${NC}"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ ERROR: Docker no está instalado${NC}"
    exit 1
fi

# Mostrar últimas imágenes
echo -e "${YELLOW}📦 Imágenes disponibles:${NC}"
docker images | grep fleetmaster-hub

# Obtener la última imagen anterior
CURRENT_IMAGE=$(docker ps -a --filter "name=fleetmaster-hub" --format "{{.Image}}" | head -1)
echo -e "${YELLOW}🔍 Imagen actual: ${CURRENT_IMAGE}${NC}"

# Confirmar rollback
read -p "¿Estás seguro de hacer rollback? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Rollback cancelado${NC}"
    exit 0
fi

# Stop contenedor actual
echo -e "${YELLOW}🛑 Deteniendo contenedor actual...${NC}"
docker-compose down

# Aquí podrías especificar una imagen específica o tag anterior
# Por ejemplo: docker-compose up -d --force-recreate

echo -e "${YELLOW}💡 Para hacer rollback a una versión específica:${NC}"
echo "   1. Edita docker-compose.yml y especifica el tag de imagen deseado"
echo "   2. Ejecuta: docker-compose up -d"
echo ""
echo -e "${GREEN}✅ Contenedor detenido. Listo para rollback manual.${NC}"
