#!/bin/bash

# ===================================================================
# 🔧 Fix FRONTEND_URL en Producción
# ===================================================================
# Este script corrige la variable FRONTEND_URL en el servidor
# para que los emails muestren la URL correcta de producción
# ===================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║     🔧 Fix FRONTEND_URL en Producción                   ║"
echo "║         FleetMaster Pro v2.0                            ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# ===================================================================
# Verificar que estamos en el directorio correcto
# ===================================================================

if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Error: Este script debe ejecutarse desde la raíz del proyecto${NC}"
    echo -e "${YELLOW}Ejemplo: cd ~/fleetmasterhub && ./fix-production-url.sh${NC}"
    exit 1
fi

echo -e "${YELLOW}Verificando configuración actual...${NC}\n"

# ===================================================================
# Verificar archivo .env.prod
# ===================================================================

ENV_FILE="backend/.env.prod"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: No existe el archivo $ENV_FILE${NC}"
    echo -e "${YELLOW}Creando archivo desde .env.prod.example...${NC}"
    
    if [ -f "backend/.env.prod.example" ]; then
        cp backend/.env.prod.example "$ENV_FILE"
        echo -e "${GREEN}✅ Archivo $ENV_FILE creado${NC}\n"
    else
        echo -e "${RED}❌ Tampoco existe .env.prod.example${NC}"
        exit 1
    fi
fi

# ===================================================================
# Verificar si ya existe FRONTEND_URL
# ===================================================================

if grep -q "^FRONTEND_URL=" "$ENV_FILE"; then
    CURRENT_URL=$(grep "^FRONTEND_URL=" "$ENV_FILE" | cut -d'=' -f2)
    echo -e "${BLUE}📋 URL actual: ${BOLD}$CURRENT_URL${NC}\n"
    
    if [[ "$CURRENT_URL" == *"localhost"* ]]; then
        echo -e "${RED}⚠️  PROBLEMA DETECTADO: URL apunta a localhost${NC}\n"
    else
        echo -e "${GREEN}✅ URL parece correcta${NC}\n"
        echo -e "${YELLOW}¿Deseas cambiarla de todos modos? (y/n):${NC}"
        read -r CHANGE
        
        if [[ ! $CHANGE =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}Operación cancelada${NC}"
            exit 0
        fi
    fi
fi

# ===================================================================
# Solicitar nueva URL
# ===================================================================

echo -e "${CYAN}🌐 Ingresa la URL del frontend (sin barra final):${NC}"
echo -e "${YELLOW}Ejemplo: https://fleetmasterhub.com${NC}"
read -r NEW_URL

# Validar URL
if [[ ! "$NEW_URL" =~ ^https?:// ]]; then
    echo -e "${RED}❌ Error: La URL debe comenzar con http:// o https://${NC}"
    exit 1
fi

# Remover barra final si existe
NEW_URL="${NEW_URL%/}"

echo -e "\n${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ Confirma la nueva URL:                                  ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BOLD}Nueva URL:${NC} $NEW_URL"
echo -e "\n${BLUE}¿Es correcta? (y/n):${NC}"
read -r CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo -e "${RED}Operación cancelada${NC}"
    exit 0
fi

# ===================================================================
# Actualizar archivo .env.prod
# ===================================================================

echo -e "\n${YELLOW}Actualizando $ENV_FILE...${NC}"

# Crear backup
cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✅ Backup creado${NC}"

# Actualizar o agregar FRONTEND_URL
if grep -q "^FRONTEND_URL=" "$ENV_FILE"; then
    # Ya existe, reemplazar
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^FRONTEND_URL=.*|FRONTEND_URL=$NEW_URL|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$NEW_URL|" "$ENV_FILE"
    fi
    echo -e "${GREEN}✅ FRONTEND_URL actualizado${NC}"
else
    # No existe, agregar
    echo "" >> "$ENV_FILE"
    echo "# Frontend URL (agregado por fix-production-url.sh)" >> "$ENV_FILE"
    echo "FRONTEND_URL=$NEW_URL" >> "$ENV_FILE"
    echo -e "${GREEN}✅ FRONTEND_URL agregado${NC}"
fi

# Verificar
echo -e "\n${CYAN}Verificando cambio...${NC}"
NEW_VALUE=$(grep "^FRONTEND_URL=" "$ENV_FILE" | cut -d'=' -f2)
echo -e "${GREEN}✅ Nuevo valor: $NEW_VALUE${NC}\n"

# ===================================================================
# Reiniciar contenedores
# ===================================================================

echo -e "${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ Los contenedores deben reiniciarse para aplicar cambios ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}¿Deseas reiniciar los contenedores ahora? (y/n):${NC}"
read -r RESTART

if [[ $RESTART =~ ^[Yy]$ ]]; then
    echo -e "\n${YELLOW}Reiniciando contenedores...${NC}\n"
    
    docker-compose -f docker-compose.prod.yml restart
    
    echo -e "\n${GREEN}✅ Contenedores reiniciados${NC}"
    
    # Esperar un poco para que inicien
    echo -e "${YELLOW}Esperando 5 segundos...${NC}"
    sleep 5
    
    # Verificar que estén corriendo
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        echo -e "${GREEN}✅ Contenedores funcionando correctamente${NC}"
    else
        echo -e "${RED}⚠️  Advertencia: Algunos contenedores podrían tener problemas${NC}"
        echo -e "${BLUE}Revisa los logs: docker-compose -f docker-compose.prod.yml logs -f${NC}"
    fi
else
    echo -e "\n${YELLOW}⚠️  IMPORTANTE: Debes reiniciar manualmente los contenedores:${NC}"
    echo -e "${BLUE}docker-compose -f docker-compose.prod.yml restart${NC}"
fi

# ===================================================================
# Verificación final
# ===================================================================

echo -e "\n${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ Verificación en contenedor                              ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}\n"

if docker ps | grep -q "fleetmaster"; then
    echo -e "${CYAN}Variable FRONTEND_URL en el contenedor:${NC}"
    CONTAINER_URL=$(docker exec fleetmaster printenv FRONTEND_URL 2>/dev/null || echo "No configurada")
    echo -e "${BOLD}$CONTAINER_URL${NC}\n"
    
    if [[ "$CONTAINER_URL" == "$NEW_URL" ]]; then
        echo -e "${GREEN}✅ Configuración correcta en el contenedor${NC}"
    else
        echo -e "${RED}⚠️  La variable en el contenedor no coincide${NC}"
        echo -e "${YELLOW}Intenta hacer rebuild completo:${NC}"
        echo -e "${BLUE}docker-compose -f docker-compose.prod.yml down${NC}"
        echo -e "${BLUE}docker-compose -f docker-compose.prod.yml up -d${NC}"
    fi
else
    echo -e "${RED}⚠️  Contenedor 'fleetmaster' no está corriendo${NC}"
fi

# ===================================================================
# Instrucciones finales
# ===================================================================

echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║              ✅ CONFIGURACIÓN ACTUALIZADA               ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

echo -e "${BOLD}📋 Próximos pasos:${NC}\n"
echo -e "${CYAN}1.${NC} Prueba registrando un nuevo usuario en: $NEW_URL"
echo -e "${CYAN}2.${NC} Verifica que el email llegue con la URL correcta"
echo -e "${CYAN}3.${NC} Revisa que el logo se vea correctamente en el email"
echo ""
echo -e "${YELLOW}Si el problema persiste, haz rebuild completo:${NC}"
echo -e "${BLUE}docker-compose -f docker-compose.prod.yml down${NC}"
echo -e "${BLUE}docker-compose -f docker-compose.prod.yml build --no-cache${NC}"
echo -e "${BLUE}docker-compose -f docker-compose.prod.yml up -d${NC}"
echo ""

exit 0
