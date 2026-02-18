#!/bin/bash

# Script para hacer backup de PostgreSQL remoto usando Docker
# Esto evita problemas de versión de pg_dump

# Configuración
DB_HOST="72.62.183.215"
DB_PORT="5436"
DB_USER="warynessy"
DB_PASS="Warynessy2026SecurePass"
DB_NAME="warynessy"
BACKUP_FILE="backup_prod_$(date +%Y%m%d_%H%M%S).sql"

echo "🚀 Haciendo backup de base de datos de producción..."
echo "📍 Host: $DB_HOST:$DB_PORT"
echo "👤 Usuario: $DB_USER"
echo "💾 Base de datos: $DB_NAME"
echo "📁 Archivo: $BACKUP_FILE"
echo ""

# Usar un contenedor Docker temporal de PostgreSQL 15 para hacer el dump
echo "📦 Usando contenedor PostgreSQL 15 para compatibilidad..."
docker run --rm \
  -e PGPASSWORD="$DB_PASS" \
  postgres:15 \
  pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-acl \
  > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Backup completado exitosamente!"
    echo "📊 Tamaño del archivo: $(ls -lh "$BACKUP_FILE" | awk '{print $5}')"
    echo ""
    echo "🔄 Siguientes pasos:"
    echo "   1. Restaurar backup localmente:"
    echo "      docker compose -f docker-compose.local.yml down db"
    echo "      docker volume rm wnidiomas_postgres_data_local"
    echo "      docker volume create wnidiomas_postgres_data_local"
    echo "      docker compose -f docker-compose.local.yml up -d db"
    echo "      sleep 15"
    echo "      docker exec -i wnidiomas-db-local psql -U warynessy warynessy < $BACKUP_FILE"
    echo ""
    echo "   2. Ejecutar traducciones:"
    echo "      npx tsx scripts/translate-content.ts"
else
    echo ""
    echo "❌ Error al hacer el backup"
    exit 1
fi