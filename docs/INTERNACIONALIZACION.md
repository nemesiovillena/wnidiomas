# 🌐 Internacionalización de Warynessy

## 📋 Resumen

Este documento describe el proceso de internacionalización del sitio web de Warynessy para soportar múltiples idiomas usando Payload CMS, Astro y DeepL para traducciones automáticas.

## 🎯 Objetivos

- ✅ Soporte para 4 idiomas: Español (origen), Inglés, Francés, Alemán
- ✅ Traducción automática de contenido existente con DeepL
- ✅ Sin reintroducción manual de datos
- ✅ Migraciones seguras y versionadas
- ✅ Interfaz de administración multilenguaje

## 🏗️ Arquitectura

### Backend (Payload CMS)

#### Configuración de Localización

**Archivo:** `payload.config.ts`

```typescript
localization: {
  locales: ['es', 'en', 'fr', 'de'],
  defaultLocale: 'es',
  fallback: true,
}
```

#### Campos Localizados

Los campos de texto que necesitan traducción están marcados con `localized: true`:

**Colecciones actualizadas:**
- `paginas`: heroTitle, heroSubtitle, metaTitle, metaDescription
- `menus`: nombre, etiqueta, descripcion_menu, fechasDias, descripcion
- `platos`: nombre, descripcion, etiquetas[]
- `categorias`: nombre, descripcion
- `espacios`: nombre, descripcion, caracteristicas[]
- `experiencias`: titulo, descripcion, resumen, incluye[], validez

**Globales actualizados:**
- `pagina-inicio`: heroTitle, heroSubtitle, welcomeTitle, welcomeText, ctaTitle, ctaText, ctaButtonText, seoTitle, seoDescription
- `configuracion-sitio`: title, description, whatsappMessage, address, openingHours[].days, openingHours[].hours, copyright

### API de DeepL

**Archivo:** `scripts/translate-content.ts`

Script para traducir automáticamente todo el contenido existente:

```bash
npx tsx scripts/translate-content.ts
```

**Características:**
- Traducción automática de todos los campos localizados
- Traducción recursiva de objetos anidados
- Manejo de errores con fallback al texto original
- Progresión detallada del proceso

**Configuración de DeepL:**

```env
DEEPL_API_KEY=033d5257-52f5-454f-bae6-9aa6d048519b:fx
```

## 📝 Proceso de Traducción

### Paso 1: Preparación del Entorno

1. Asegúrate de que el archivo `.env` contenga la API key de DeepL
2. Verifica que la base de datos esté accesible
3. Haz backup de la base de datos antes de ejecutar traducciones

### Paso 2: Ejecutar Script de Traducción

```bash
# Desde la raíz del proyecto
npx tsx scripts/translate-content.ts
```

El script realizará lo siguiente:

1. Inicializar Payload CMS
2. Leer todos los documentos en español (idioma origen)
3. Traducir a inglés, francés y alemán
4. Guardar traducciones en la base de datos
5. Mostrar resumen del proceso

### Paso 3: Verificar Traducciones

1. Accede al panel de administración de Payload
2. Navega por las colecciones
3. Cambia el idioma en el selector de locale
4. Verifica que las traducciones sean correctas

## 🔧 Configuración del Frontend (Astro)

### Pasos Pendientes

1. **Configurar i18n en Astro**

   Actualizar `astro.config.mjs`:
   ```astro
   export default defineConfig({
     i18n: {
       defaultLocale: 'es',
       locales: ['es', 'en', 'fr', 'de'],
       routing: {
         prefixDefaultLocale: false,
       },
     },
     // ... resto de configuración
   })
   ```

2. **Crear selector de idioma**

   Componente para cambiar entre idiomas:
   ```astro
   ---
   import { getLocales, locale } from 'astro:i18n'
   
   const locales = getLocales()
   const currentLocale = locale()
   ---
   
   <select onchange="window.location.href = this.value">
     {locales.map((loc) => (
       <option value={loc.path} selected={loc.code === currentLocale}>
         {loc.name}
       </option>
     ))}
   </select>
   ```

3. **Actualizar componentes del frontend**

   - Modificar peticiones a Payload para incluir el locale
   - Usar `Astro.currentLocale` para detectar idioma actual
   - Actualizar componentes SEO con meta tags multilenguaje

4. **Crear estructura de rutas**

   ```
   src/pages/
     index.astro          # Español (default)
     en/index.astro       # Inglés
     fr/index.astro       # Francés
     de/index.astro       # Alemán
     carta.astro
     en/carta.astro
     fr/carta.astro
     de/carta.astro
     # ... resto de páginas
   ```

## 📊 Estructura de Datos

### Ejemplo de Documento con Traducciones

```json
{
  "id": "123",
  "slug": "menu-degustacion",
  "nombre": "Menú Degustación",
  "locales": {
    "en": {
      "nombre": "Tasting Menu"
    },
    "fr": {
      "nombre": "Menu Dégustation"
    },
    "de": {
      "nombre": "Verkostungs-Menü"
    }
  },
  "precio": 85,
  "activo": true
}
```

## 🚀 Despliegue

### Variables de Entorno en Producción

Añadir las siguientes variables en Dokploy/Vercel:

```env
DEEPL_API_KEY=033d5257-52f5-454f-bae6-9aa6d048519b:fx
DEFAULT_LOCALE=es
SUPPORTED_LOCALES=en,fr,de
```

### Migraciones de Base de Datos

Payload CMS detectará automáticamente los cambios en el esquema y creará las columnas necesarias para almacenar las traducciones.

## ✅ Checklist de Implementación

### Backend (Payload CMS)
- [x] Configurar localización en payload.config.ts
- [x] Marcar campos como localizados en colecciones
- [x] Marcar campos como localizados en globales
- [x] Crear script de traducción con DeepL
- [ ] Ejecutar script de traducción en producción
- [ ] Verificar traducciones en panel de administración

### Frontend (Astro)
- [x] Configurar i18n en astro.config.mjs
- [x] Crear estructura de rutas por idioma (páginas de inicio para en/fr/de)
- [x] Implementar selector de idioma (LanguageSelector.astro)
- [x] Actualizar componentes para usar locale actual (Header, SEO)
- [x] Actualizar API calls a Payload con locale (lib/payload.ts)
- [x] Implementar hreflang para SEO (SEO.astro)
- [ ] Crear rutas para el resto de páginas (carta, menus, etc.)
- [ ] Traducir textos estáticos en componentes

### SEO
- [x] Configurar etiquetas hreflang en cada página
- [ ] Actualizar sitemap.xml con todos los idiomas
- [x] Verificar meta tags para cada idioma
- [ ] Test en Google Search Console para cada idioma

## 🔍 Solución de Problemas

### Problema: Traducciones no aparecen en el frontend

**Solución:**
1. Verifica que el locale se esté pasando correctamente en las peticiones a Payload
2. Revisa que los campos tengan `localized: true` en el esquema
3. Verifica que las traducciones existan en la base de datos

### Problema: Error de API de DeepL

**Solución:**
1. Verifica la API key en `.env`
2. Confirma que no se haya excedido el límite de caracteres
3. Revisa el estado del servicio de DeepL en https://status.deepl.com

### Problema: Traducciones incorrectas

**Solución:**
1. Ejecuta el script de traducción nuevamente para sobrescribir
2. Edita manualmente las traducciones en el panel de administración
3. Considera usar glosarios de DeepL para términos específicos

## 📚 Recursos

- [Payload CMS Localization](https://payloadcms.com/docs/configuration/localization)
- [Astro i18n Routing](https://docs.astro.build/en/guides/internationalization/)
- [DeepL API Documentation](https://www.deepl.com/docs-api)

## 📞 Soporte

Para dudas o problemas durante la internacionalización, consulta con el equipo técnico o revisa los logs de errores de Payload y Astro.

---

**Última actualización:** 17/02/2026
**Versión:** 1.1.0
**Estado:** ✅ Backend completado, ✅ Frontend parcialmente implementado
