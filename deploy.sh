#!/bin/bash

# 🚀 Script de Despliegue - FleetMaster Pro

set -e

echo "🚀 Iniciando despliegue de FleetMaster Pro..."

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que existe .env.prod
if [ ! -f .env.prod ]; then
    echo -e "${RED}❌ ERROR: No se encontró .env.prod${NC}"
    echo -e "${YELLOW}💡 Copia .env.prod.example y configúralo:${NC}"
    echo "   cp .env.prod.example .env.prod"
    exit 1
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ ERROR: Docker no está instalado${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ ERROR: Docker Compose no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-requisitos verificados${NC}"

# Build
echo -e "${YELLOW}📦 Construyendo imagen Docker...${NC}"
docker-compose build

# Stop contenedores anteriores
echo -e "${YELLOW}🛑 Deteniendo contenedores anteriores...${NC}"
docker-compose down

# Start
echo -e "${YELLOW}🚀 Iniciando aplicación...${NC}"
docker-compose up -d

# Wait for health check
echo -e "${YELLOW}⏳ Esperando que la aplicación esté lista...${NC}"
sleep 10

# Check health
if curl -f http://localhost:3001/api/health &> /dev/null; then
    echo -e "${GREEN}✅ Aplicación desplegada exitosamente!${NC}"
    echo -e "${GREEN}🌐 Accede a: http://localhost:3001${NC}"
    echo ""
    echo "📊 Ver logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Detener:"
    echo "   docker-compose down"
else
    echo -e "${RED}❌ ERROR: La aplicación no responde${NC}"
    echo "Ver logs con: docker-compose logs fleetmaster"
    exit 1
fi
