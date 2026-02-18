# Pasos Pendientes - Internacionalización

## ✅ Fase 1: Configuración Base (COMPLETADA)

- [x] Instalar dependencias de internacionalización
- [x] Configurar variables de entorno DeepL
- [x] Configurar plugin de localización en Payload CMS
- [x] Actualizar colecciones con campos localizados
- [x] Actualizar globales con campos localizados
- [x] Crear script de migración para traducir contenido con DeepL
- [x] Ejecutar traducción automática del contenido existente

### Resultado Fase 1:
- **Categorías traducidas:** 5/5 ✅
- **Configuración del sitio traducida:** ✅
- **Página inicio:** ⚠️ Requiere manual (campos vacíos en español)

---

## ⏳ Fase 2: Rutas Multilingües

### Tareas Pendientes:
- [ ] Crear rutas para `/es/cart`, `/en/menu`, `/fr/menu`, `/de/speisekarte`
- [ ] Crear rutas para `/es/menus`, `/en/menus`, `/fr/menus`, `/de/menus`
- [ ] Crear rutas para `/es/espacios`, `/en/spaces`, `/fr/espaces`, `/de/raume`
- [ ] Crear rutas para `/es/experiencias`, `/en/experiences`, `/fr/experiences`, `/de/erlebnisse`
- [ ] Crear rutas para `/es/contacto`, `/en/contact`, `/fr/contact`, `/de/kontakt`
- [ ] Crear rutas para `/es/aviso-legal`, `/en/legal-notice`, `/fr/mentions-legales`, `/de/impressum`
- [ ] Crear rutas para `/es/privacidad`, `/en/privacy`, `/fr/privacite`, `/de/datenschutz`
- [ ] Crear rutas para `/es/cookies`, `/en/cookies`, `/fr/cookies`, `/de/cookies`

---

## ⏳ Fase 3: Componentes Multilingües

### Tareas Pendientes:

#### Header
- [ ] Actualizar navegación con textos traducidos
- [ ] Asegurar selector de idioma funcional
- [ ] Traducir botones de CTA

#### Footer
- [ ] Traducir enlaces de navegación
- [ ] Traducir información de contacto
- [ ] Traducir textos de derechos de autor
- [ ] Traducir enlaces legales

#### Componentes de Contenido
- [ ] LanguageSelector.astro - Verificar funcionalidad
- [ ] MenuCard.astro - Traducir etiquetas
- [ ] DishCard.astro - Traducir etiquetas
- [ ] SpaceCard.astro - Traducir etiquetas
- [ ] Button.astro - Traducir textos por defecto

---

## ⏳ Fase 4: SEO y hreflang

### Tareas Pendientes:
- [ ] Actualizar SEO.astro con hreflang para cada idioma
- [ ] Configurar sitemap.xml con todas las versiones
- [ ] Ajustar meta descripciones para cada idioma
- [ ] Configurar canonical URLs correctas
- [ ] Verificar Google Analytics multilingüe

---

## ⏳ Fase 5: Pruebas Locales

### Checklist de Pruebas:
- [ ] Probar `/en` - Inglés funciona correctamente
- [ ] Probar `/fr` - Francés funciona correctamente
- [ ] Probar `/de` - Alemán funciona correctamente
- [ ] Probar cambio de idioma desde selector
- [ ] Verificar todas las rutas funcionan
- [ ] Probar navegación entre idiomas
- [ ] Verificar traducciones de UI
- [ ] Probar envío de formularios multilingües
- [ ] Verificar imágenes y assets cargan correctamente

---

## ⏳ Fase 6: Deploy a Producción

### Tareas Pendientes:
- [ ] Revisar variables de entorno de producción
- [ ] Verificar DEEPL_API_KEY en producción
- [ ] Hacer commit de cambios
- [ ] Push al repositorio
- [ ] Verificar deploy en Dokploy
- [ ] Probar todas las rutas en producción
- [ ] Verificar traducciones en producción
- [ ] Probar selector de idioma en producción

---

## ⏳ Fase 7: Google Search Console

### Tareas Pendientes:
- [ ] Verificar propiedad hreflang en Google Search Console
- [ ] Enviar sitemap a Google
- [ ] Monitorear indexación de páginas en otros idiomas
- [ ] Verificar no hay errores de internacionalización
- [ ] Configurar informes de idiomas en Analytics
- [ ] Verificar tráfico orgánico por idioma

---

## 🔧 Correcciones Manuales Requeridas

### PaginaInicio Global
El global `pagina-inicio` tiene campos obligatorios vacíos:
1. **Título Principal (Hero)** - Necesita valor en español
2. **Imagen Hero** - Necesita imagen cargada

**Solución:**
1. Acceder al panel de administración
2. Ir a Globals > Pagina Inicio
3. Completar los campos en español
4. Ejecutar nuevamente el script de traducción
5. Verificar que se crearon las versiones en otros idiomas

---

## 📊 Progreso General

| Fase | Estado | Completado |
|------|--------|------------|
| Fase 1: Configuración Base | ✅ Completado | 100% |
| Fase 2: Rutas Multilingües | ⏳ Pendiente | 0% |
| Fase 3: Componentes Multilingües | ⏳ Pendiente | 0% |
| Fase 4: SEO y hreflang | ⏳ Pendiente | 0% |
| Fase 5: Pruebas Locales | ⏳ Pendiente | 0% |
| Fase 6: Deploy a Producción | ⏳ Pendiente | 0% |
| Fase 7: GSC | ⏳ Pendiente | 0% |

**Progreso Total: 17%**

---

## 🎯 Próximos Pasos Recomendados

1. **Inmediato:** Completar manualmente el global `pagina-inicio`
2. **Corto plazo:** Crear rutas para el resto de páginas
3. **Medio plazo:** Actualizar Header y Footer con traducciones
4. **Largo plazo:** Configurar SEO completo y hacer deploy

---

## 📚 Recursos Útiles

- [Documentación Payload i18n](https://payloadcms.com/docs/configuration/localization)
- [Documentación DeepL API](https://www.deepl.com/docs-api/)
- [Documentación Astro i18n](https://docs.astro.build/en/guides/internationalization/)
- [Google hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions)