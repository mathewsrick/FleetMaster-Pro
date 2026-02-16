#!/bin/bash

# ================================================================
# FleetMaster Pro - Advanced Deployment Script for AWS EC2
# ================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="fleetmaster-pro"
DOCKER_IMAGE="${APP_NAME}:latest"
CONTAINER_NAME="${APP_NAME}-app"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with docker permissions
check_docker_permissions() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker no está disponible o no tienes permisos. Ejecuta con sudo o añade tu usuario al grupo docker."
        exit 1
    fi
}

# Backup current deployment
backup_deployment() {
    log_info "Creando backup de la implementación actual..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup environment file
    if [ -f .env.prod ]; then
        cp .env.prod "$BACKUP_DIR/.env.prod.$TIMESTAMP"
        log_success "Backup de variables de entorno creado"
    fi
    
    # Backup uploads
    if [ -d backend/public/uploads ]; then
        tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" backend/public/uploads
        log_success "Backup de archivos subidos creado"
    fi
    
    # Export current Docker image
    if docker image inspect "$DOCKER_IMAGE" >/dev/null 2>&1; then
        docker save "$DOCKER_IMAGE" | gzip > "$BACKUP_DIR/${APP_NAME}_$TIMESTAMP.tar.gz"
        log_success "Backup de imagen Docker creado"
    fi
}

# Pull latest code
pull_latest_code() {
    log_info "Obteniendo última versión del código..."
    
    if [ -d .git ]; then
        git pull origin main
        log_success "Código actualizado desde repositorio"
    else
        log_warn "No es un repositorio git. Saltando actualización de código."
    fi
}

# Build Docker image
build_image() {
    log_info "Construyendo imagen Docker..."
    
    docker build -t "$DOCKER_IMAGE" .
    
    if [ $? -eq 0 ]; then
        log_success "Imagen Docker construida exitosamente"
    else
        log_error "Error al construir la imagen Docker"
        exit 1
    fi
}

# Stop and remove old container
stop_old_container() {
    log_info "Deteniendo contenedor anterior..."
    
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker stop "$CONTAINER_NAME" || true
        docker rm "$CONTAINER_NAME" || true
        log_success "Contenedor anterior eliminado"
    else
        log_info "No hay contenedor anterior para eliminar"
    fi
}

# Run database migrations
run_migrations() {
    log_info "Ejecutando migraciones de base de datos..."
    
    docker run --rm \
        --env-file .env.prod \
        "$DOCKER_IMAGE" \
        sh -c "pnpm exec prisma migrate deploy"
    
    if [ $? -eq 0 ]; then
        log_success "Migraciones ejecutadas exitosamente"
    else
        log_error "Error al ejecutar migraciones"
        exit 1
    fi
}

# Start new container
start_container() {
    log_info "Iniciando nuevo contenedor..."
    
    docker run -d \
        --name "$CONTAINER_NAME" \
        --restart unless-stopped \
        -p 3001:3001 \
        --env-file .env.prod \
        -v "$(pwd)/backend/public/uploads:/app/backend/public/uploads" \
        "$DOCKER_IMAGE"
    
    if [ $? -eq 0 ]; then
        log_success "Contenedor iniciado exitosamente"
    else
        log_error "Error al iniciar el contenedor"
        exit 1
    fi
}

# Health check
health_check() {
    log_info "Verificando salud de la aplicación..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
            log_success "✓ Aplicación funcionando correctamente"
            return 0
        fi
        
        log_info "Intento $attempt/$max_attempts - Esperando..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "La aplicación no responde después de $max_attempts intentos"
    return 1
}

# Cleanup old images
cleanup_images() {
    log_info "Limpiando imágenes antiguas..."
    
    docker image prune -f
    
    log_success "Limpieza completada"
}

# Main deployment flow
main() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║       FleetMaster Pro - Deployment Script            ║"
    echo "║       AWS EC2 Production Deployment                   ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_docker_permissions
    
    # Confirm deployment
    read -p "¿Deseas continuar con el despliegue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warn "Despliegue cancelado"
        exit 0
    fi
    
    # Execute deployment steps
    backup_deployment
    pull_latest_code
    build_image
    run_migrations
    stop_old_container
    start_container
    
    # Wait and check health
    sleep 5
    if health_check; then
        cleanup_images
        
        echo -e "\n${GREEN}"
        echo "╔═══════════════════════════════════════════════════════╗"
        echo "║           🎉 DEPLOYMENT SUCCESSFUL 🎉                 ║"
        echo "╚═══════════════════════════════════════════════════════╝"
        echo -e "${NC}"
        
        log_info "Aplicación disponible en: http://localhost:3001"
        log_info "Health check: http://localhost:3001/api/health"
        log_info "Logs: docker logs -f $CONTAINER_NAME"
    else
        log_error "Health check falló. Revisa los logs: docker logs $CONTAINER_NAME"
        exit 1
    fi
}

# Run main function
main "$@"
