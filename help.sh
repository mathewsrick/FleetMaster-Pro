#!/bin/bash
# FleetMaster Pro - Script de Ayuda Rápida
# Muestra información útil sobre el proyecto

clear

cat << 'EOF'
╔════════════════════════════════════════════════════════════════════╗
║                  FLEETMASTER PRO - AYUDA RÁPIDA                   ║
╚════════════════════════════════════════════════════════════════════╝

📚 DOCUMENTACIÓN PRINCIPAL
══════════════════════════════════════════════════════════════════════

🎯 COMENZAR AQUÍ:
   ./DEPLOYMENT-SUMMARY.md              Resumen ejecutivo completo

📖 DESPLIEGUE:
   ./AWS-SUPABASE-DEPLOYMENT.md         Guía paso a paso (60 min)
   ./AWS-SUPABASE-QUICK.md              Comandos rápidos (45 min)
   ./PRE-DEPLOY-CHECKLIST.md            Checklist antes de desplegar

🛠️ OPERACIONES:
   ./PRODUCTION-COMMANDS.md             Comandos del día a día
   ./PRODUCTION-READY-SUMMARY.md        Estado completo del proyecto

📚 ÍNDICES:
   ./DOCUMENTATION-INDEX.md             Índice maestro

══════════════════════════════════════════════════════════════════════

💰 COSTOS DE DESPLIEGUE
══════════════════════════════════════════════════════════════════════

   AWS EC2 t3.micro + Supabase PostgreSQL

   Primeros 12 meses:  $0/mes (Free Tier)
   Después:           $32.50/mes
   Ahorro vs RDS:     -$10/mes

══════════════════════════════════════════════════════════════════════

⚡ COMANDOS RÁPIDOS
══════════════════════════════════════════════════════════════════════

DESARROLLO LOCAL:
   pnpm install                         Instalar dependencias
   pnpm dev                            Iniciar dev server
   pnpm prisma:migrate                 Ejecutar migraciones
   pnpm create:superadmin              Crear super admin

DOCKER:
   docker-compose up -d                Iniciar producción
   docker logs -f fleetmaster-pro      Ver logs
   docker-compose restart              Reiniciar

DOCUMENTACIÓN:
   cat DEPLOYMENT-SUMMARY.md           Ver resumen
   cat PRODUCTION-COMMANDS.md          Ver comandos útiles
   cat AWS-SUPABASE-QUICK.md          Ver guía rápida

══════════════════════════════════════════════════════════════════════

🔧 ARCHIVOS DE CONFIGURACIÓN
══════════════════════════════════════════════════════════════════════

DESARROLLO:
   backend/.env.example                Plantilla para .env
   docker-compose.dev.yml              Docker con DB local

PRODUCCIÓN:
   backend/.env.prod.example           Plantilla para .env.prod
   docker-compose.yml                  Docker sin DB (usa Supabase)

══════════════════════════════════════════════════════════════════════

🚀 FLUJO DE DESPLIEGUE RÁPIDO
══════════════════════════════════════════════════════════════════════

1. Crear cuenta Supabase → https://supabase.com
2. Crear cuenta AWS → https://aws.amazon.com
3. Leer PRE-DEPLOY-CHECKLIST.md
4. Seguir AWS-SUPABASE-QUICK.md
5. Configurar .env.prod
6. Deploy: docker-compose up -d --build
7. Verificar: https://tudominio.com/api/health

Tiempo total: ~45-60 minutos

══════════════════════════════════════════════════════════════════════

📞 SOPORTE
══════════════════════════════════════════════════════════════════════

Documentación:  cat DOCUMENTATION-INDEX.md
Troubleshooting: cat PRODUCTION-COMMANDS.md
Estado:         cat PRODUCTION-READY-SUMMARY.md

══════════════════════════════════════════════════════════════════════

✅ ESTADO: LISTO PARA PRODUCCIÓN ✅

EOF
