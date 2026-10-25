#!/usr/bin/env bash

# 🚀 Despliegue de FleetMaster Hub en el VPS compartido (srv1722607)
#
# Uso:
#   cd /opt/fleetmasterhub
#   git pull --ff-only origin main
#   ./deploy.sh
#
# No usar redeploy.sh ni docker-compose.prod.yml en este servidor:
# publican los puertos 80/443 (los ocupa edge-caddy) y construyen con el
# Dockerfile del repo en vez de Dockerfile.vps.

set -euo pipefail

cd /opt/fleetmasterhub

if ! command -v docker >/dev/null 2>&1; then
    echo "❌ docker no está disponible en este servidor" >&2
    exit 1
fi

if [ ! -f Dockerfile.vps ]; then
    echo "❌ FALTA Dockerfile.vps (variante local del VPS). Ver README-VPS.md" >&2
    exit 1
fi

if [ ! -f backend/.env.prod ]; then
    echo "❌ FALTA backend/.env.prod (variables de producción)" >&2
    exit 1
fi

echo "🐳 Construyendo y recreando el contenedor..."
docker compose -f docker-compose.vps.yml up -d --build --remove-orphans

echo ""
echo "✅ Contenedores de FleetMaster:"
docker ps --filter "name=fleetmaster" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
