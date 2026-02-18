#!/bin/sh
set -e

echo "🚀 Inicializando entorno local con PostgreSQL integrado..."

# Configuración de PostgreSQL
export PGUSER=${POSTGRES_USER:-warynessy}
export PGPASSWORD=${POSTGRES_PASSWORD:-warynessy_dev}
export PGDATABASE=${POSTGRES_DB:-warynessy}
export PGHOST=localhost
export PGPORT=5432

# Crear directorio para logs si no existe
mkdir -p "$PGDATA/log"

# Verificar si ya está inicializado
if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "📦 Inicializando base de datos PostgreSQL..."
    
    # Verificar que el directorio esté vacío (solo debe tener lost+found si es un volumen)
    if [ "$(ls -A $PGDATA 2>/dev/null)" ]; then
        echo "⚠️  Directorio $PGDATA no está vacío, limpiando..."
        # Remover todo excepto lost+found si existe
        find "$PGDATA" -mindepth 1 -maxdepth 1 ! -name 'lost+found' -exec rm -rf {} + 2>/dev/null || true
    fi
    
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
    
    # Crear directorio para socket de UNIX
    mkdir -p /tmp
    chmod 777 /tmp
    
    # Iniciar PostgreSQL temporalmente
    echo "🔧 Iniciando PostgreSQL temporalmente..."
    pg_ctl -D "$PGDATA" \
        -l "$PGDATA/log/postmaster.log" \
        -o "-k /tmp -c listen_addresses='localhost'" \
        start
    
    # Esperar a que esté listo
    echo "⏳ Esperando a que PostgreSQL esté listo..."
    max_tries=10
    counter=0
    until pg_isready -U postgres -h localhost -p 5432 > /dev/null 2>&1; do
        counter=$((counter + 1))
        if [ $counter -ge $max_tries ]; then
            echo "❌ PostgreSQL no inició en el tiempo esperado"
            cat "$PGDATA/log/postmaster.log" 2>/dev/null || echo "No log file found"
            exit 1
        fi
        echo "  ⏱️  Intento $counter/$max_tries..."
        sleep 1
    done
    
    echo "✅ PostgreSQL está listo"
    
    # Crear usuario y base de datos
    echo "👤 Creando usuario y base de datos..."
    psql -U postgres -h localhost <<EOF
CREATE USER $PGUSER WITH SUPERUSER PASSWORD '$PGPASSWORD';
CREATE DATABASE $PGDATABASE OWNER $PGUSER;
GRANT ALL PRIVILEGES ON DATABASE $PGDATABASE TO $PGUSER;
EOF
    
    # Detener PostgreSQL temporalmente
    echo "🛑 Deteniendo PostgreSQL temporalmente..."
    pg_ctl -D "$PGDATA" stop
    
    echo "✅ Base de datos inicializada correctamente"
else
    echo "✅ Base de datos ya existe, iniciando..."
fi

# Limpiar socket antiguo si existe
rm -f /tmp/.s.PGSQL.5432

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
until pg_isready -U $PGUSER -d $PGDATABASE -h localhost -p 5432 > /dev/null 2>&1; do
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
echo "📊 Usuario: $PGUSER"
echo "📊 Base de datos: $PGDATABASE"

# Ejecutar el comando pasado como argumento (por defecto: npm run dev)
echo "🌐 Iniciando aplicación..."
exec "$@"