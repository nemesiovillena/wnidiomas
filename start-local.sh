#!/bin/bash

# Script para iniciar el entorno de desarrollo local con Docker

echo "🚀 Iniciando entorno de desarrollo local..."
echo ""
echo "Este script iniciará:"
echo "  - Astro (Frontend)"
echo "  - Payload CMS (Admin Panel + API)"
echo "  - PostgreSQL (Base de datos)"
echo ""
echo "Panel de administración: http://localhost:3000/admin"
echo "Sitio web: http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener"
echo ""

# Iniciar Docker Compose con configuración local
docker-compose -f docker-compose.local.yml up --build