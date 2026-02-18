# Desarrollo Local - Contenedor Único

Esta configuración permite ejecutar todo el proyecto (Astro, Payload CMS y PostgreSQL) en un solo contenedor Docker para desarrollo local.

## Arquitectura

El contenedor incluye:
- **Node.js 22** con todas las dependencias del proyecto
- **PostgreSQL** ejecutándose en localhost dentro del mismo contenedor
- **Payload CMS** (Admin Panel + API) en el puerto 3000
- **Astro Frontend** servido por el servidor unificado en el puerto 3000
- **Base de datos PostgreSQL** persistente en volumen Docker

## Requisitos Previos

- Docker instalado
- Docker Compose instalado (generalmente incluido con Docker Desktop)

## Inicialización

1. **Iniciar el contenedor:**

```bash
docker-compose -f docker-compose.local.yml up -d
```

2. **Verificar los logs:**

```bash
docker-compose -f docker-compose.local.yml logs -f
```

Deberías ver algo como:
```
🚀 Inicializando entorno local con PostgreSQL integrado...
📦 Inicializando base de datos PostgreSQL...
👤 Creando usuario y base de datos...
✅ Base de datos inicializada
🔧 Iniciando PostgreSQL...
⏳ Esperando a que PostgreSQL esté listo...
✅ PostgreSQL está listo
🌐 Iniciando aplicación...
🚀 Servidor unificado corriendo en 0.0.0.0:3000!
```

3. **Acceder a la aplicación:**

- **Sitio web:** http://localhost:3000
- **Admin Payload:** http://localhost:3000/admin
- **API Payload:** http://localhost:3000/api

## Comandos Útiles

### Ver logs en tiempo real
```bash
docker-compose -f docker-compose.local.yml logs -f app
```

### Detener el contenedor
```bash
docker-compose -f docker-compose.local.yml down
```

### Reiniciar el contenedor
```bash
docker-compose -f docker-compose.local.yml restart
```

### Reconstruir el contenedor (después de cambios en Dockerfile)
```bash
docker-compose -f docker-compose.local.yml up -d --build
```

### Acceder al contenedor en modo interactivo
```bash
docker-compose -f docker-compose.local.yml exec app sh
```

### Acceder a PostgreSQL dentro del contenedor
```bash
docker-compose -f docker-compose.local.yml exec app psql -U warynessy -d warynessy
```

### Eliminar todo (incluyendo base de datos)
```bash
docker-compose -f docker-compose.local.yml down -v
```

⚠️ **Advertencia:** Este comando eliminará toda la base de datos y los datos almacenados.

## Variables de Entorno

Puedes crear un archivo `.env` en la raíz del proyecto para personalizar la configuración:

```env
POSTGRES_USER=warynessy
POSTGRES_PASSWORD=warynessy_dev
POSTGRES_DB=warynessy
PAYLOAD_SECRET=tu-secreto-aqui
```

## Persistencia de Datos

- **Base de datos:** Se almacena en el volumen Docker `postgres_data`
- **Media uploads:** Se almacena en el directorio local `./media`
- **Código fuente:** Se monta como volume para hot reload

## Hot Reload

Los cambios en el código fuente se reflejan automáticamente gracias a los bind mounts:
- `./src` → `/app/src`
- `./public` → `/app/public`
- `./payload.config.ts` → `/app/payload.config.ts`
- `./server.ts` → `/app/server.ts`
- `./astro.config.mjs` → `/app/astro.config.mjs`
- `./next.config.mjs` → `/app/next.config.mjs`

## Solución de Problemas

### El contenedor no inicia

1. Verifica los logs:
```bash
docker-compose -f docker-compose.local.yml logs
```

2. Si hay problemas con PostgreSQL, elimina el volumen y vuelve a crear:
```bash
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d
```

### Cannot connect to database

1. Verifica que PostgreSQL esté corriendo dentro del contenedor:
```bash
docker-compose -f docker-compose.local.yml exec app pg_isready -U warynessy -h localhost
```

2. Revisa la configuración de `DATABASE_URL` en las variables de entorno

### Puertos en uso

Si el puerto 3000 ya está en uso, puedes cambiar el puerto mapeado en `docker-compose.local.yml`:
```yaml
ports:
  - "3001:3000"  # Cambia 3001 al puerto que prefieras
```

## Diferencias con Producción

**Local (este archivo):**
- Un solo contenedor con todo integrado
- PostgreSQL en localhost dentro del contenedor
- Hot reload activado
- Optimizado para desarrollo

**Producción (`docker-compose.prod.yml`):**
- Contenedores separados (app + db)
- Mejor escalabilidad
- Build optimizado
- Sin hot reload

## Script de Inicialización

El archivo `docker-entrypoint.local.sh` se encarga de:
1. Inicializar PostgreSQL si no existe
2. Crear usuario y base de datos
3. Iniciar el servicio PostgreSQL
4. Esperar a que PostgreSQL esté listo
5. Iniciar la aplicación Node.js