#!/bin/sh
set -e

echo "🚀 Inicializando entorno local con PostgreSQL integrado..."

# Configuración de PostgreSQL
export PGUSER=${POSTGRES_USER:-warynessy}
export PGPASSWORD=${POSTGRES_PASSWORD:-warynessy_dev}
export PGDATABASE=${POSTGRES_DB:-warynessy}
export PGHOST=localhost
export PGPORT=5432

# Crear directorios necesarios
mkdir -p "$PGDATA/log"
mkdir -p /tmp
chmod 777 /tmp 2>/dev/null || true

# Verificar si ya está inicializado
if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "📦 Inicializando base de datos PostgreSQL..."
    
    # Inicializar con UTF-8 y configuraciones locales
    initdb -D "$PGDATA" --encoding=UTF8 --locale=C --no-locale
    
    # Configurar postgresql.conf
    cat >> "$PGDATA/postgresql.conf" <<EOF
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 128MB
dynamic_shared_memory_type = posix
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
EOF
    
    # Configurar pg_hba.conf para permitir conexiones locales
    cat > "$PGDATA/pg_hba.conf" <<EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                  trust
EOF
    
    echo "✅ Base de datos inicializada correctamente"
else
    echo "✅ Base de datos ya existe, iniciando..."
fi

# Limpiar socket antiguo si existe
rm -f /tmp/.s.PGSQL.5432 2>/dev/null || true

# Iniciar PostgreSQL
echo "🔧 Iniciando PostgreSQL..."
pg_ctl -D "$PGDATA" \
    -l "$PGDATA/log/postmaster.log" \
    -o "-k /tmp -c listen_addresses='localhost'" \
    start

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
max_tries=30
counter=0
until pg_isready -U node -h localhost -p 5432 > /dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -ge $max_tries ]; then
        echo "❌ PostgreSQL no inició en el tiempo esperado"
        echo "📋 Últimas líneas del log:"
        tail -20 "$PGDATA/log/postmaster.log" 2>/dev/null || echo "No log file found"
        exit 1
    fi
    echo "  ⏱️  Intento $counter/$max_tries..."
    sleep 1
done

echo "✅ PostgreSQL está listo en localhost:5432"

# Crear usuario wearynessy y base de datos usando el usuario node (siempre ejecutar esto)
echo "🔍 Verificando/creando usuario $PGUSER y base de datos $PGDATABASE..."

# Verificar si el usuario wearynessy existe usando psql con el usuario node
USER_EXISTS=$(psql -U node -h localhost -tAc "SELECT 1 FROM pg_user WHERE usename = '$PGUSER'" 2>/dev/null || echo "")

if [ "$USER_EXISTS" != "1" ]; then
    echo "👤 Usuario $PGUSER no existe, creándolo..."
    psql -U node -h localhost <<EOF
CREATE USER $PGUSER WITH SUPERUSER PASSWORD '$PGPASSWORD';
EOF
    echo "✅ Usuario $PGUSER creado"
else
    echo "✅ Usuario $PGUSER ya existe"
fi

# Verificar si la base de datos wearynessy existe
DB_EXISTS=$(psql -U node -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname = '$PGDATABASE'" 2>/dev/null || echo "")

if [ "$DB_EXISTS" != "1" ]; then
    echo "📊 Base de datos $PGDATABASE no existe, creándola..."
    psql -U node -h localhost <<EOF
CREATE DATABASE $PGDATABASE OWNER $PGUSER;
GRANT ALL PRIVILEGES ON DATABASE $PGDATABASE TO $PGUSER;
EOF
    echo "✅ Base de datos $PGDATABASE creada"
else
    echo "✅ Base de datos $PGDATABASE ya existe"
fi

echo "📊 Usuario: $PGUSER"
echo "📊 Base de datos: $PGDATABASE"

# Ejecutar el comando pasado como argumento (por defecto: npm run dev:unified)
if [ -z "$1" ]; then
    echo "🌐 Iniciando servidor unificado..."
    exec npm run dev:unified
else
    echo "🌐 Iniciando aplicación..."
    exec "$@"
fi