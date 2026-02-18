# Backup de Producción y Traducción

## 📋 Resumen

Este documento explica cómo hacer un backup de la base de datos de producción y traducir todo el contenido a los 3 idiomas adicionales (inglés, francés, alemán).

## 🔍 Identificar Fuente de Base de Datos de Producción

### Opción 1: Vercel Postgres (Más probable)

Si usas Vercel para hosting, puedes tener Vercel Postgres:

```bash
# Verificar si tienes variables de entorno de Vercel
grep -i "vercel\|postgres" .env
```

**Cómo hacer backup desde Vercel Postgres:**

1. Ve a [vercel.com](https://vercel.com)
2. Selecciona tu proyecto
3. Ve a "Storage" > "Postgres"
4. Clic en tu base de datos
5. Busca "Backups" o "Export"
6. Descarga el backup en formato SQL

**O usando la CLI de Vercel:**

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Exportar base de datos
vercel pg dump warynessy > backup_prod.sql
```

### Opción 2: Supabase

```bash
# Verificar si usas Supabase
grep -i "supabase" .env
```

**Backup desde Supabase:**

1. Ve a [supabase.com](https://supabase.com)
2. Selecciona tu proyecto
3. Ve a "Settings" > "Database"
4. Busca "Backups" o "Export database"
5. Descarga el backup en formato SQL

**O usando CLI:**

```bash
# Instalar Supabase CLI
npm install -g supabase

# Exportar
supabase db dump -f backup_prod.sql
```

### Opción 3: Servidor PostgreSQL Remoto

Si tienes un servidor PostgreSQL accesible:

```bash
# Copia remota del backup
ssh usuario@tu-servidor "pg_dump -U warynessy warynessy" > backup_prod.sql
```

## 📦 Proceso de Backup y Traducción

### Paso 1: Obtener Backup de Producción

Elige el método según tu proveedor de base de datos:

```bash
# Ejemplo: Descargar backup de Vercel Postgres
vercel pg dump warynessy > backup_prod_$(date +%Y%m%d_%H%M%S).sql
```

### Paso 2: Restaurar Backup Localmente

```bash
# 1. Parar contenedor local
docker compose -f docker-compose.local.yml down db

# 2. Eliminar volumen de datos local
docker volume rm wnidiomas_postgres_data_local

# 3. Crear nuevo volumen
docker volume create wnidiomas_postgres_data_local

# 4. Iniciar base de datos local
docker compose -f docker-compose.local.yml up -d db

# 5. Esperar a que esté lista (10-15 segundos)
sleep 15

# 6. Restaurar backup
docker exec -i wnidiomas-db-local psql -U warynessy warynessy < backup_prod_20260218_HHMMSS.sql
```

### Paso 3: Verificar Contenido

```bash
npx tsx scripts/check-db-content.ts
```

Deberías ver datos en las colecciones, no solo en los globales.

### Paso 4: Ejecutar Traducciones

```bash
npx tsx scripts/translate-content.ts
```

Este script traducirá:
- ✅ Colecciones con contenido (platos, menus, categorias, etc.)
- ✅ Globales (pagina-inicio, configuracion-sitio)
- ✅ Campos localizados a inglés, francés y alemán

### Paso 5: Verificar Traducciones

```bash
npx tsx scripts/check-db-content.ts
```

Accede al panel de administración para verificar:
- http://localhost:3000/admin

## 🔧 Script Automatizado

He creado un script que automatiza todo el proceso:

```bash
# Dar permisos de ejecución
chmod +x scripts/backup-prod-and-translate.sh

# Ejecutar (requiere que warynessy-db-prod esté corriendo localmente)
./scripts/backup-prod-and-translate.sh
```

**Nota:** Este script solo funciona si tienes el contenedor de producción corriendo localmente con el nombre `warynessy-db-prod`.

## 📝 Variables de Entorno Requeridas

Asegúrate de que `.env` contiene:

```env
# Base de datos
DATABASE_URL=postgresql://warynessy:password@localhost:5432/warynessy
POSTGRES_USER=warynessy
POSTGRES_PASSWORD=your_password
POSTGRES_DB=warynessy

# Payload
PAYLOAD_SECRET=your-secret-key-here

# DeepL
DEEPL_API_KEY=your-deepl-api-key
```

## 🚨 Solución de Problemas

### El backup está vacío (0B)

**Causa:** El comando de backup no se ejecutó correctamente o no hay datos en la base de datos.

**Solución:**
1. Verifica que estás conectado a la base de datos correcta
2. Verifica que la base de datos de producción tiene datos
3. Reintenta el comando de backup

### Error: "No such container"

**Causa:** El contenedor de producción no está corriendo o tiene otro nombre.

**Solución:**
```bash
# Ver todos los contenedores
docker ps -a

# Si usas docker-compose.prod.yml, inicia producción
docker compose -f docker-compose.prod.yml up -d db
```

### Error: "collection can't be found"

**Causa:** Payload no se inicializó correctamente o el esquema no está sincronizado.

**Solución:**
```bash
# Ejecutar migraciones
npm run payload migrate:latest

# O reiniciar contenedor
docker compose -f docker-compose.local.yml restart
```

### Error de DeepL: "Bad request"

**Causa:** API key inválida o límite de cuota alcanzado.

**Solución:**
1. Verifica `DEEPL_API_KEY` en `.env`
2. Verifica tu cuota en [DeepL Developer Portal](https://www.deepl.com/pro-api)
3. Si estás usando el plan gratuito, el límite es 500,000 caracteres/mes

## 📊 Verificar Traducciones

En el panel de administración de Payload:

1. **Ver globales:**
   - Ir a Globals > Pagina Inicio
   - Verificar que hay idiomas en/es/fr/de
   - Cada idioma debe tener su contenido traducido

2. **Ver colecciones:**
   - Ir a Collections > Categorías
   - Abrir cualquier categoría
   - Cambiar el selector de idioma (arriba a la derecha)
   - Verificar que cada idioma tiene contenido

## 🎯 Próximos Pasos Despúes de Traducir

1. **Crear rutas multilingües** (Fase 2)
   - Crear páginas para cada idioma
   
2. **Actualizar componentes UI** (Fase 3)
   - Header, Footer, LanguageSelector
   
3. **Configurar SEO** (Fase 4)
   - hreflang, sitemap, meta tags
   
4. **Probar localmente** (Fase 5)
   - Verificar cada idioma funciona correctamente
   
5. **Deploy a producción** (Fase 6)
   - Hacer commit y push de cambios

## 📚 Recursos Adicionales

- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase Backups](https://supabase.com/docs/guides/database/backups)
- [DeepL API Docs](https://www.deepl.com/docs-api/)
- [Payload Localization](https://payloadcms.com/docs/configuration/localization)

---

**Estado actual:** ⏳ Esperando backup de producción
**Próxima acción:** Obtener backup de base de datos de producción