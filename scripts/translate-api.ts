import { Translator } from 'deepl-node'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
dotenv.config({
    path: path.resolve(dirname, '../.env'),
})

const API_URL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
const API_KEY = process.env.PAYLOAD_API_KEY || ''

const DEEPL_API_KEY = process.env.DEEPL_API_KEY || ''
const translator = new Translator(DEEPL_API_KEY)

const localeMapping: Record<string, string> = {
    'es': 'es',
    'en': 'en-US',
    'fr': 'fr-FR',
    'de': 'de-DE',
}

const targetLocales = ['en', 'fr', 'de']
const sourceLocale = 'es'

// Colecciones a traducir
const collections = [
    'platos',
    'menus',
    'menus-grupo',
    'categorias',
    'paginas',
    'espacios',
    'experiencias',
]

async function translateText(text: string, targetLang: string): Promise<string> {
    if (!text || text.trim() === '') return text
    try {
        const deeplTargetLang = localeMapping[targetLang] || targetLang
        const result = await translator.translateText(text, sourceLocale, deeplTargetLang as any)
        return result.text
    } catch (error) {
        console.error(`Error traduciendo a ${targetLang}:`, error)
        return text
    }
}

async function fetchFromAPI(endpoint: string) {
    const url = `${API_URL}/api${endpoint}`
    console.log(`📡 GET ${url}`)
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
    }
    return response.json()
}

async function updateViaAPI(endpoint: string, data: any) {
    const url = `${API_URL}/api${endpoint}`
    console.log(`📡 PATCH ${url}`)
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
    }
    return response.json()
}

async function main() {
    console.log('🚀 Iniciando traducción vía API de Payload...\n')

    if (!DEEPL_API_KEY) {
        console.error('❌ ERROR: DEEPL_API_KEY no está configurada')
        process.exit(1)
    }

    for (const collection of collections) {
        console.log(`\n📚 Traduciendo colección: ${collection}`)

        try {
            // Obtener documentos en español
            const { docs } = await fetchFromAPI(`/${collection}?locale=${sourceLocale}&limit=1000`)
            console.log(`   📄 Encontrados ${docs.length} documentos`)

            for (const doc of docs) {
                console.log(`   🔄 Traduciendo: ${doc.id}`)

                for (const targetLang of targetLocales) {
                    try {
                        // Crear objeto de actualización con campos traducidos
                        const updateData: any = { locale: targetLang }

                        // Traducir campos comunes de texto
                        if (doc.nombre) updateData.nombre = await translateText(doc.nombre, targetLang)
                        if (doc.descripcion) updateData.descripcion = await translateText(doc.descripcion, targetLang)
                        if (doc.title) updateData.title = await translateText(doc.title, targetLang)
                        if (doc.description) updateData.description = await translateText(doc.description, targetLang)
                        if (doc.etiqueta) updateData.etiqueta = await translateText(doc.etiqueta, targetLang)

                        // Actualizar documento
                        await updateViaAPI(`/${collection}/${doc.id}`, updateData)
                        console.log(`      ✅ ${targetLang}: completado`)
                    } catch (error) {
                        console.error(`      ❌ ${targetLang}: error`, error)
                    }
                }
            }

            console.log(`   ✅ Colección ${collection} completada`)
        } catch (error) {
            console.error(`   ❌ Error en colección ${collection}:`, error)
        }
    }

    console.log('\n✅ Traducción completada con éxito!')
}

main().catch(console.error)
