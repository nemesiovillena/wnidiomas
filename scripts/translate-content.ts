import { Translator } from 'deepl-node'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import payload from 'payload'
import { getPayload } from 'payload'

// Cargar variables de entorno
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
dotenv.config({
    path: path.resolve(dirname, '../.env'),
})

// Verificar variables de entorno críticas
if (!process.env.PAYLOAD_SECRET) {
    console.error('❌ ERROR: PAYLOAD_SECRET no está definida en el archivo .env')
    console.error('   Asegúrate de que el archivo .env existe y contiene PAYLOAD_SECRET')
    process.exit(1)
}

if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL no está definida en el archivo .env')
    console.error('   Asegúrate de que el archivo .env existe y contiene DATABASE_URL')
    process.exit(1)
}

console.log('✅ Variables de entorno cargadas correctamente')
console.log(`   PAYLOAD_SECRET: ${process.env.PAYLOAD_SECRET ? '✓' : '✗'}`)
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓' : '✗'}`)
console.log(`   DEEPL_API_KEY: ${process.env.DEEPL_API_KEY ? '✓' : '✗'}\n`)

// Configuración de DeepL
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || '033d5257-52f5-454f-bae6-9aa6d048519b:fx'
const translator = new Translator(DEEPL_API_KEY)

// Mapeo de idiomas Payload -> DeepL
// DeepL usa códigos de idioma simples (no variantes regionales)
const localeMapping: Record<string, string> = {
    'es': 'ES',
    'en': 'EN-GB',
    'fr': 'FR',
    'de': 'DE',
}

// Idiomas de destino (códigos Payload)
const targetLocales = ['en', 'fr', 'de']
const sourceLocale = 'es'

// Función para traducir texto
async function translateText(text: string, targetLang: string): Promise<string> {
    if (!text || text.trim() === '') return text

    try {
        const deeplTargetLang = localeMapping[targetLang] || targetLang
        const result = await translator.translateText(text, sourceLocale, deeplTargetLang as any)
        return result.text
    } catch (error) {
        console.error(`Error traduciendo texto a ${targetLang}:`, error)
        return text // Devolver original en caso de error
    }
}

// Función para traducir objeto recursivamente
async function translateObject(
    obj: any,
    targetLang: string,
    schema: any
): Promise<any> {
    const translated: any = {}

    for (const key in obj) {
        const value = obj[key]

        // Ignorar campos internos de Payload
        if (['id', 'createdAt', 'updatedAt', 'locale'].includes(key)) {
            continue
        }

        // Si el campo está marcado como localized en el esquema, traducirlo
        const fieldConfig = schema.fields?.find((f: any) => f.name === key)
        const isLocalized = fieldConfig?.localized || false

        if (isLocalized) {
            if (typeof value === 'string') {
                translated[key] = await translateText(value, targetLang)
            } else if (typeof value === 'object' && value !== null) {
                // Si es un array, traducir cada elemento
                if (Array.isArray(value)) {
                    translated[key] = await Promise.all(
                        value.map(item =>
                            typeof item === 'object'
                                ? translateObject(item, targetLang, schema)
                                : item
                        )
                    )
                } else {
                    translated[key] = await translateObject(value, targetLang, schema)
                }
            } else {
                translated[key] = value
            }
        } else {
            // No traducir campos no localizados, pero mantener su valor
            translated[key] = value
        }
    }

    return translated
}

// Variable para guardar la instancia de Payload
let payloadInstance: any = null

// Función para traducir colección
async function translateCollection(
    collectionSlug: string,
    schema: any
): Promise<void> {
    console.log(`\n📚 Traduciendo colección: ${collectionSlug}`)

    try {
        // Obtener todos los documentos
        const docs = await payloadInstance.find({
            collection: collectionSlug,
            limit: 1000,
            locale: sourceLocale,
        })

        console.log(`   📄 Encontrados ${docs.totalDocs} documentos`)

        for (const doc of docs.docs) {
            console.log(`   🔄 Traduciendo: ${doc.id}`)

            for (const targetLang of targetLocales) {
                try {
                    // Traducir campos
                    const translatedData = await translateObject(
                        { ...doc },
                        targetLang,
                        schema
                    )

                    // Actualizar documento con traducciones
                    await payloadInstance.update({
                        collection: collectionSlug,
                        id: doc.id,
                        data: translatedData,
                        locale: targetLang,
                    })

                    console.log(`      ✅ ${targetLang}: completado`)
                } catch (error) {
                    console.error(`      ❌ ${targetLang}: error`, error)
                }
            }
        }

        console.log(`   ✅ Colección ${collectionSlug} completada`)
    } catch (error) {
        console.error(`   ❌ Error en colección ${collectionSlug}:`, error)
    }
}

// Función para traducir globales
async function translateGlobal(globalSlug: string, schema: any): Promise<void> {
    console.log(`\n🌐 Traduciendo global: ${globalSlug}`)

    try {
        // Obtener documento global
        const doc = await payloadInstance.findGlobal({
            slug: globalSlug,
            locale: sourceLocale,
        })

        console.log(`   📄 Global encontrado`)

        for (const targetLang of targetLocales) {
            try {
                // Traducir campos (solo campos localizados)
                const translatedData = await translateObject(
                    { ...doc },
                    targetLang,
                    schema
                )

                console.log(`   🔄 Traduciendo a ${targetLang}...`)

                // Actualizar global con traducciones
                await payloadInstance.updateGlobal({
                    slug: globalSlug,
                    data: translatedData,
                    locale: targetLang,
                })

                console.log(`      ✅ ${targetLang}: completado`)
            } catch (error: any) {
                console.error(`      ❌ ${targetLang}: error`)
                if (error.message) {
                    console.error(`         ${error.message}`)
                }
            }
        }

        console.log(`   ✅ Global ${globalSlug} completado`)
    } catch (error: any) {
        console.error(`   ❌ Error en global ${globalSlug}:`, error?.message || error)
    }
}

// Función principal
async function main() {
    console.log('🚀 Iniciando traducción automática con DeepL...\n')

    try {
        // Inicializar Payload con la configuración completa
        const payloadConfig = await import('../payload.config.ts')

        payloadInstance = await getPayload({
            config: payloadConfig.default,
        })

        console.log('✅ Payload inicializado')

        // Lista de colecciones a traducir
        const collections = [
            { slug: 'paginas', schema: (await import('../src/payload/collections/Paginas')).Paginas },
            { slug: 'menus', schema: (await import('../src/payload/collections/Menus')).Menus },
            { slug: 'menus-grupo', schema: (await import('../src/payload/collections/MenusGrupo')).MenusGrupo },
            { slug: 'platos', schema: (await import('../src/payload/collections/Platos')).Platos },
            { slug: 'categorias', schema: (await import('../src/payload/collections/Categorias')).Categorias },
            { slug: 'espacios', schema: (await import('../src/payload/collections/Espacios')).Espacios },
            { slug: 'experiencias', schema: (await import('../src/payload/collections/Experiencias')).Experiencias },
        ]

        // Lista de globales a traducir
        const globals = [
            { slug: 'pagina-inicio', schema: (await import('../src/payload/globals/PaginaInicio')).PaginaInicio },
            { slug: 'configuracion-sitio', schema: (await import('../src/payload/globals/ConfiguracionSitio')).ConfiguracionSitio },
        ]

        // Traducir colecciones
        for (const collection of collections) {
            await translateCollection(collection.slug, collection.schema)
        }

        // Traducir globales
        for (const global of globals) {
            await translateGlobal(global.slug, global.schema)
        }

        console.log('\n✅ Traducción completada con éxito!')
        console.log('📊 Resumen:')
        console.log(`   - Idioma origen: ${sourceLocale}`)
        console.log(`   - Idiomas destino: ${targetLocales.join(', ')}`)
        console.log(`   - Colecciones: ${collections.length}`)
        console.log(`   - Globales: ${globals.length}`)

        process.exit(0)
    } catch (error) {
        console.error('❌ Error en el proceso de traducción:', error)
        process.exit(1)
    }
}

// Ejecutar script
main()