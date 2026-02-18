# 🍽️ wnIdiomas - Proyecto Local de Warynessy

Este es el proyecto local de desarrollo para Warynessy, basado en el proyecto de producción `web-warynessy-2026`.

## 📌 Importante - Diferencia con Producción

**Este proyecto (`wnidiomas`)** es una copia para desarrollo local:
- **Repositorio:** https://github.com/nemesiovillena/wnidiomas.git
- **Propósito:** Desarrollo y pruebas locales
- **Base de datos:** PostgreSQL local (en Docker)
- **URL local:** http://localhost:3000

**Proyecto de producción (`web-warynessy-2026`):**
- **Repositorio:** https://github.com/nemesiovillena/web-warynessy-2026.git
- **Propósito:** Sitio en producción
- **Base de datos:** PostgreSQL remoto (72.62.183.215:5436)
- **URL producción:** https://web-warynessy-2026.vercel.app

## 🚀 Empezar Rápido - Desarrollo Local

### Requisitos Previos
- Docker instalado
- Docker Compose instalado (incluido con Docker Desktop)

### 1. Iniciar el Entorno Local

```bash
# Opción A: Usar el script (recomendado)
./start-local.sh

# Opción B: Usar Docker Compose directamente
docker-compose -f docker-compose.local.yml up --build
```

### 2. Acceder a la Aplicación

Una vez iniciado (puede tardar 2-3 minutos la primera vez):

- **Panel de administración (Payload CMS):** http://localhost:3000/admin
- **Sitio web:** http://localhost:3000
- **API:** http://localhost:3000/api

### 3. Primer Acceso al Admin

Al acceder a http://localhost:3000/admin por primera vez:
1. Payload te pedirá crear un usuario administrador
2. Completa el formulario con email y contraseña
3. ¡Listo! Puedes empezar a gestionar contenido

## 🛠️ Comandos Útiles

### Ver Logs
```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.local.yml logs -f app

# Ver solo los últimos 50 logs
docker-compose -f docker-compose.local.yml logs --tail=50 app
```

### Detener el Servidor
```bash
# Detener (mantener datos)
docker-compose -f docker-compose.local.yml down

# Detener y eliminar base de datos (⚠️ se borran datos)
docker-compose -f docker-compose.local.yml down -v
```

### Reiniciar
```bash
docker-compose -f docker-compose.local.yml restart
```

### Reconstruir (después de cambios en dependencias)
```bash
docker-compose -f docker-compose.local.yml up --build
```

### Acceder al Contenedor
```bash
# Abrir terminal en el contenedor
docker-compose -f docker-compose.local.yml exec app sh

# Acceder a PostgreSQL directamente
docker-compose -f docker-compose.local.yml exec app psql -U warynessy -d warynessy
```

## 📂 Estructura de Archivos de Configuración

```
wnIdiomas/
├── .env                    # Configuración para producción (NO usar en local)
├── .env.local              # ✅ Configuración para desarrollo local (USAR ESTE)
├── .gitignore              # Archivos ignorados por Git
├── start-local.sh          # Script para iniciar desarrollo local
├── docker-compose.local.yml # Configuración Docker para desarrollo
├── Dockerfile.local        # Imagen Docker para desarrollo
├── docker-entrypoint.local.sh # Script de inicio del contenedor
├── README-WNIDIOMAS.md     # Este archivo
├── README-LOCAL.md         # Guía detallada de desarrollo local
└── README.md               # README general del proyecto
```

## 🔧 Configuración de Entorno

### Archivo `.env.local` (USAR ESTE)

Este archivo contiene la configuración para desarrollo local:
- **Base de datos:** PostgreSQL local en el mismo contenedor
- **URLs:** http://localhost:3000
- **NUNCA se sube a GitHub** (está en .gitignore)

### Archivo `.env` (NO USAR EN LOCAL)

Este archivo apunta a producción:
- **Base de datos:** PostgreSQL remoto (72.62.183.215)
- **URLs:** https://web-warynessy-2026.vercel.app
- Solo se usa para scripts de backup/traducción de producción

## 🎯 Flujo de Trabajo Recomendado

### 1. Desarrollo Local
```bash
# Iniciar entorno local
./start-local.sh

# Hacer cambios en el código
# Los cambios se reflejan automáticamente (hot reload)

# Ver cambios en: http://localhost:3000/admin
```

### 2. Probar Cambios
```bash
# Si algo falla, ver logs
docker-compose -f docker-compose.local.yml logs -f app

# Si necesitas reiniciar todo
docker-compose -f docker-compose.local.yml restart
```

### 3. Commit a GitHub
```bash
# Detener el servidor (Ctrl+C o en otra terminal)
docker-compose -f docker-compose.local.yml down

# Hacer commit
git add .
git commit -m "tu mensaje"
git push origin main
```

### 4. Backup de Producción (opcional)
```bash
# Para hacer backup o traducir producción
bash scripts/backup-prod-remote.sh

# Para traducir contenido de producción
yes | PAYLOAD_DROP_SCHEMA=true PGPASSWORD='Warynessy2026SecurePass' DATABASE_URL='postgresql://warynessy:Warynessy2026SecurePass@72.62.183.215:5436/warynessy' npx tsx scripts/translate-content.ts
```

## 📚 Internacionalización (i18n)

El proyecto tiene internacionalización implementada con 4 idiomas:
- **es** - Español (idioma por defecto)
- **en** - Inglés
- **fr** - Francés
- **de** - Alemán

### Rutas por Idioma
- Español: http://localhost:3000/
- Inglés: http://localhost:3000/en/
- Francés: http://localhost:3000/fr/
- Alemán: http://localhost:3000/de/

### Cambiar Idioma en Payload Admin
1. Accede a http://localhost:3000/admin
2. En el sidebar derecho, verás el selector de idiomas
3. Haz clic en el idioma que quieres editar
4. Los campos marcados con 🌐 son localizables (se traducen)

### Traducir Contenido Manualmente
1. Ve a una colección (ej: Platos)
2. Selecciona un documento
3. Cambia el idioma en el selector (arriba a la derecha)
4. Edita los campos localizados
5. Guarda cambios

## 🐛 Solución de Problemas Comunes

### "Cannot connect to database"
```bash
# Verificar que PostgreSQL está corriendo
docker-compose -f docker-compose.local.yml exec app pg_isready -U warynessy -h localhost

# Si falla, reiniciar el contenedor
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up --build
```

### "Port 3000 is already in use"
```bash
# Ver qué está usando el puerto
lsof -i :3000

# Cambiar el puerto en docker-compose.local.yml
# ports:
#   - "3001:3000"  # Usa 3001 en tu máquina
```

### "Hot reload no funciona"
```bash
# Verificar que los volumes están montados correctamente
docker-compose -f docker-compose.local.yml config | grep volumes

# Reiniciar el contenedor
docker-compose -f docker-compose.local.yml restart
```

### "Base de datos vacía"
```bash
# Verificar si el volumen de datos existe
docker volume ls | grep postgres

# Crear datos de prueba (opcional)
docker-compose -f docker-compose.local.yml exec app npm run seed
```

## 📖 Documentación Adicional

- **[README-LOCAL.md](README-LOCAL.md)** - Guía detallada de desarrollo local con Docker
- **[README.md](README.md)** - Documentación general del proyecto
- **[docs/INTERNACIONALIZACION.md](docs/INTERNACIONALIZACION.md)** - Guía completa de internacionalización
- **[docs/BACKUP-PROD-TRADUCCION.md](docs/BACKUP-PROD-TRADUCCION.md)** - Backup y traducción de producción

## 🎨 Stack Tecnológico

- **Frontend:** Astro + TypeScript + Tailwind CSS
- **Backend:** Payload CMS + Express
- **Base de datos:** PostgreSQL
- **Infraestructura:** Docker
- **Internacionalización:** Payload i18n + DeepL

## 🤝 Contribución

Este proyecto está conectado a GitHub: https://github.com/nemesiovillena/wnidiomas

**Nunca hagas commit de:**
- `.env.local` (tiene credenciales locales)
- `.env` (tiene credenciales de producción)
- `node_modules/`
- `media/` (uploads locales)

**Always commit de:**
- Cambios en código
- Nuevos componentes
- Cambios en configuración
- Documentación

## 📞 Soporte

- **Repositorio:** https://github.com/nemesiovillena/wnidiomas
- **Issues:** https://github.com/nemesiovillena/wnidiomas/issues

---

**Versión:** 1.0.0
**Última actualización:** 2026-02-18
**Estado:** 🟢 Activo para desarrollo local