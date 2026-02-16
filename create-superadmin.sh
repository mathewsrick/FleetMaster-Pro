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

# Crear script temporal de Node.js
cat > /tmp/create-superadmin-temp.js << 'SCRIPT_END'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Configurar Prisma con la ruta correcta del schema
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function createSuperAdmin() {
    const username = process.env.SA_USERNAME;
    const email = process.env.SA_EMAIL;
    const password = process.env.SA_PASSWORD;

    try {
        console.log('🔍 Verificando si el usuario ya existe...');
        
        // Verificar si ya existe
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        if (existing) {
            console.error('❌ ERROR: Ya existe un usuario con ese username o email');
            console.error('Username existente:', existing.username);
            console.error('Email existente:', existing.email);
            process.exit(1);
        }

        console.log('🔐 Hasheando password...');
        
        // Hash del password
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('📝 Creando SuperAdmin en la base de datos...');
        
        // Crear SuperAdmin
        const admin = await prisma.user.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword,
                role: 'SUPERADMIN',
                confirmed: true,
                plan: 'enterprise',
                dueDate: null, // Sin expiración
            }
        });

        console.log('✅ SuperAdmin creado exitosamente');
        console.log('ID:', admin.id);
        console.log('Username:', admin.username);
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error al crear SuperAdmin:', error.message);
        if (error.code) {
            console.error('Código de error:', error.code);
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createSuperAdmin();
SCRIPT_END

# Ejecutar según el modo
if [ "$EXEC_MODE" = "docker" ]; then
    echo -e "${BLUE}Ejecutando en contenedor Docker...${NC}"
    
    # Copiar script al contenedor (en el directorio del backend donde están los node_modules)
    docker cp /tmp/create-superadmin-temp.js fleetmaster:/app/backend/create-superadmin.js
    
    # Ejecutar dentro del contenedor desde el directorio del backend
    docker exec -w /app/backend \
                -e SA_USERNAME="$ADMIN_USERNAME" \
                -e SA_EMAIL="$ADMIN_EMAIL" \
                -e SA_PASSWORD="$ADMIN_PASSWORD" \
                fleetmaster \
                node create-superadmin.js
    
    RESULT=$?
    
    # Limpiar
    docker exec fleetmaster rm -f /app/backend/create-superadmin.js
    
else
    echo -e "${BLUE}Ejecutando localmente...${NC}"
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js no está instalado${NC}"
        exit 1
    fi
    
    # Verificar que exista .env o .env.prod
    if [ -f "backend/.env.prod" ]; then
        export $(cat backend/.env.prod | grep -v '^#' | xargs)
    elif [ -f "backend/.env" ]; then
        export $(cat backend/.env | grep -v '^#' | xargs)
    else
        echo -e "${RED}❌ No se encontró archivo .env${NC}"
        exit 1
    fi
    
    cd backend
    
    SA_USERNAME="$ADMIN_USERNAME" \
    SA_EMAIL="$ADMIN_EMAIL" \
    SA_PASSWORD="$ADMIN_PASSWORD" \
    node /tmp/create-superadmin-temp.js
    
    RESULT=$?
    
    cd ..
fi

# Limpiar script temporal
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
