#!/bin/bash

# ===================================================================
# 🔐 FleetMaster Pro - Generador de SuperAdmin
# ===================================================================
# Script interactivo para crear un usuario SuperAdmin
# ===================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║          🔐 Generador de SuperAdmin                     ║"
echo "║             FleetMaster Pro v2.0                        ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ===================================================================
# Verificar prerequisitos
# ===================================================================

echo -e "${YELLOW}Verificando prerequisitos...${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -f "backend/package.json" ]; then
    echo -e "${RED}❌ Error: Debes ejecutar este script desde la raíz del proyecto${NC}"
    exit 1
fi

# Verificar que Docker esté corriendo
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Error: Docker no está corriendo o no tienes permisos${NC}"
    echo "Intenta: sudo usermod -aG docker \$USER"
    exit 1
fi

# Verificar que el contenedor exista
if ! docker ps -q -f name=fleetmaster &> /dev/null; then
    echo -e "${YELLOW}⚠️  El contenedor 'fleetmaster' no está corriendo${NC}"
    echo -e "${BLUE}¿Deseas ejecutar el script localmente (requiere Node.js)? (y/n)${NC}"
    read -r USE_LOCAL
    
    if [[ ! $USE_LOCAL =~ ^[Yy]$ ]]; then
        echo -e "${RED}Abortado. Inicia los contenedores primero: docker-compose -f docker-compose.prod.yml up -d${NC}"
        exit 1
    fi
    
    EXEC_MODE="local"
else
    EXEC_MODE="docker"
fi

echo -e "${GREEN}✓ Prerequisitos OK${NC}\n"

# ===================================================================
# Recolectar datos del SuperAdmin
# ===================================================================

echo -e "${BOLD}${BLUE}Ingresa los datos del SuperAdmin:${NC}\n"

# Username
while true; do
    echo -e "${CYAN}👤 Username (sin espacios):${NC}"
    read -r ADMIN_USERNAME
    
    if [ -z "$ADMIN_USERNAME" ]; then
        echo -e "${RED}❌ El username no puede estar vacío${NC}\n"
        continue
    fi
    
    if [[ ! "$ADMIN_USERNAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        echo -e "${RED}❌ El username solo puede contener letras, números, guiones y guiones bajos${NC}\n"
        continue
    fi
    
    break
done

# Email
while true; do
    echo -e "\n${CYAN}📧 Email:${NC}"
    read -r ADMIN_EMAIL
    
    if [ -z "$ADMIN_EMAIL" ]; then
        echo -e "${RED}❌ El email no puede estar vacío${NC}"
        continue
    fi
    
    if [[ ! "$ADMIN_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        echo -e "${RED}❌ Email inválido${NC}"
        continue
    fi
    
    break
done

# Password
while true; do
    echo -e "\n${CYAN}🔒 Password (mínimo 8 caracteres):${NC}"
    read -rs ADMIN_PASSWORD
    echo
    
    if [ -z "$ADMIN_PASSWORD" ]; then
        echo -e "${RED}❌ El password no puede estar vacío${NC}"
        continue
    fi
    
    if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
        echo -e "${RED}❌ El password debe tener al menos 8 caracteres${NC}"
        continue
    fi
    
    echo -e "${CYAN}🔒 Confirma el password:${NC}"
    read -rs ADMIN_PASSWORD_CONFIRM
    echo
    
    if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
        echo -e "${RED}❌ Los passwords no coinciden${NC}"
        continue
    fi
    
    break
done

# ===================================================================
# Confirmar datos
# ===================================================================

echo -e "\n${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ Confirma los datos del SuperAdmin:                      ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BOLD}Username:${NC} $ADMIN_USERNAME"
echo -e "${BOLD}Email:${NC}    $ADMIN_EMAIL"
echo -e "${BOLD}Password:${NC}  $(echo $ADMIN_PASSWORD | sed 's/./*/g')"

echo -e "\n${BLUE}¿Los datos son correctos? (y/n):${NC}"
read -r CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo -e "${RED}Operación cancelada${NC}"
    exit 0
fi

# ===================================================================
# Crear el SuperAdmin
# ===================================================================

echo -e "\n${YELLOW}Creando SuperAdmin...${NC}"

# Ejecutar según el modo
if [ "$EXEC_MODE" = "docker" ]; then
    echo -e "${BLUE}Ejecutando en contenedor Docker...${NC}"
    
    # Verificar que tsx esté disponible o instalarlo temporalmente
    echo -e "${YELLOW}Verificando dependencias...${NC}"
    
    # Ejecutar el script TypeScript que ya existe usando npx tsx
    docker exec -w /app/backend \
                fleetmaster \
                npx -y tsx scripts/CreateSuperAdmin.ts "$ADMIN_USERNAME" "$ADMIN_EMAIL" "$ADMIN_PASSWORD"
    
    RESULT=$?
    
else
    echo -e "${BLUE}Ejecutando localmente...${NC}"
    
    # Ejecutar en modo local usando el script TypeScript
    cd backend
    npx tsx scripts/CreateSuperAdmin.ts "$ADMIN_USERNAME" "$ADMIN_EMAIL" "$ADMIN_PASSWORD"
    RESULT=$?
    cd ..
fi

# Limpiar archivos temporales si existen
rm -f /tmp/create-superadmin-temp.js

# ===================================================================
# Resultado
# ===================================================================

echo ""

if [ $RESULT -eq 0 ]; then
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║              ✅ SUPERADMIN CREADO                       ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${BOLD}Credenciales de acceso:${NC}"
    echo -e "  ${CYAN}Username:${NC} $ADMIN_USERNAME"
    echo -e "  ${CYAN}Email:${NC}    $ADMIN_EMAIL"
    echo -e "  ${CYAN}Password:${NC}  $(echo $ADMIN_PASSWORD | sed 's/./*/g')"
    echo ""
    echo -e "${YELLOW}⚠️  Guarda estas credenciales en un lugar seguro${NC}"
    echo -e "${BLUE}🌐 Accede a: https://fleetmasterhub.com/#/login${NC}"
    echo ""
else
    echo -e "${RED}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║              ❌ ERROR AL CREAR SUPERADMIN               ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${YELLOW}Posibles causas:${NC}"
    echo "  • Ya existe un usuario con ese username o email"
    echo "  • Error de conexión a la base de datos"
    echo "  • Permisos insuficientes"
    echo ""
    echo -e "${BLUE}Revisa los logs: docker logs fleetmaster --tail=50${NC}"
fi

exit $RESULT
