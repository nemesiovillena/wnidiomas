#!/bin/bash

# Script para hacer backup de producción y traducir contenido

echo "🚀 Iniciando backup de producción y traducción..."

# Variables
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_prod_${TIMESTAMP}.sql"

# Paso 1: Hacer dump de la base de datos de producción
echo ""
echo "📦 Paso 1: Haciendo dump de la base de datos de producción..."
docker exec warynessy-db-prod pg_dump -U warynessy warynessy > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup completado: $BACKUP_FILE"
else
    echo "❌ Error al hacer el backup de producción"
    exit 1
fi

# Paso 2: Parar el contenedor local de la base de datos
echo ""
echo "🛑 Paso 2: Parando base de datos local..."
docker compose -f docker-compose.local.yml down db

# Paso 3: Eliminar volumen local de datos
echo ""
echo "🗑️  Paso 3: Eliminando datos locales..."
docker volume rm wnidiomas_postgres_data_local 2>/dev/null || echo "   ⚠️  Volumen no existe o ya eliminado"

# Paso 4: Crear nuevo volumen
echo ""
echo "📁 Paso 4: Creando nuevo volumen de datos..."
docker volume create wnidiomas_postgres_data_local

# Paso 5: Iniciar base de datos local
echo ""
echo "▶️  Paso 5: Iniciando base de datos local..."
docker compose -f docker-compose.local.yml up -d db

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 10

# Paso 6: Restaurar el backup
echo ""
echo "💾 Paso 6: Restaurando backup localmente..."
docker exec -i wnidiomas-db-local psql -U warynessy warynessy < $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup restaurado correctamente"
else
    echo "❌ Error al restaurar el backup"
    exit 1
fi

# Paso 7: Ejecutar traducciones
echo ""
echo "🌍 Paso 7: Ejecutando traducciones automáticas..."
npx tsx scripts/translate-content.ts

# Paso 8: Verificar traducciones
echo ""
echo "🔍 Paso 8: Verificando contenido traducido..."
npx tsx scripts/check-db-content.ts

echo ""
echo "✅ Proceso completado!"
echo "📊 Backup guardado en: $BACKUP_FILE"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Revisa el panel de administración: http://localhost:3000/admin"
echo "   2. Verifica las traducciones en cada idioma"
echo "   3. Comprueba que todo esté correcto antes de hacer deploy"