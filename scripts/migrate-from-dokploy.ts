import { Translator } from 'deepl-node'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { Pool } from 'pg'

// Cargar variables de entorno
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
dotenv.config({
    path: path.resolve(dirname, '../.env'),
})

console.log('🚀 Iniciando migración desde Dokploy con traducción...\n')

// Configuración de DeepL
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || ''
const translator = new Translator(DEEPL_API_KEY)

// Pool de PostgreSQL local
const localPool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

// Pool de PostgreSQL Dokploy
const dokployPool = new Pool({
    host: 'panel.eneweb.es',
    port: 5436,
    user: 'warynessy',
    password: 'Warynessy2026SecurePass',
    database: 'warynessy',
})

// DeepL target language codes - IMPORTANTE: usar códigos exactos de DeepL
// https://developers.deepl.com/docs/resources/supported-languages
const localeMapping: Record<string, 'EN-GB' | 'EN-US' | 'FR' | 'DE'> = {
    'en': 'EN-GB',  // o EN-US
    'fr': 'FR',
    'de': 'DE',
}

const targetLocales = ['en', 'fr', 'de']

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Traducción con retry y backoff exponencial
async function translateText(text: string, targetLang: string, retries = 3): Promise<string> {
    if (!text || typeof text !== 'string' || text.trim() === '') return text || ''

    const deeplTargetLang = localeMapping[targetLang]
    if (!deeplTargetLang) {
        console.error(`   ❌ Idioma no soportado: ${targetLang}`)
        return text
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await translator.translateText(text, 'ES', deeplTargetLang)
            // Delay después de cada traducción exitosa para evitar rate limit
            await delay(200)
            return result.text
        } catch (error: any) {
            if (error.message?.includes('Too many requests') && attempt < retries) {
                // Backoff exponencial: 2s, 4s, 8s...
                const waitTime = Math.pow(2, attempt) * 1000
                console.log(`   ⏳ Rate limit, esperando ${waitTime/1000}s...`)
                await delay(waitTime)
            } else if (attempt === retries) {
                console.error(`   ❌ Error traduciendo a ${targetLang} después de ${retries} intentos`)
                return text
            }
        }
    }
    return text
}

// Colecciones con sus campos de texto traducibles
// NOTA: Omitimos campos richText (jsonb) por complejidad
const collections = [
    {
        table: 'platos',
        localesTable: 'platos_locales',
        fields: ['nombre', 'descripcion'],
    },
    {
        table: 'menus',
        localesTable: 'menus_locales',
        fields: ['nombre', 'etiqueta', 'descripcion_menu', 'fechas_dias'],
    },
    {
        table: 'categorias',
        localesTable: 'categorias_locales',
        fields: ['nombre', 'descripcion'],
    },
    {
        table: 'paginas',
        localesTable: 'paginas_locales',
        fields: ['hero_title', 'hero_subtitle', 'meta_title', 'meta_description'],
    },
    {
        table: 'espacios',
        localesTable: 'espacios_locales',
        fields: ['nombre'],
        // descripcion es richText (jsonb)
    },
    {
        table: 'experiencias',
        localesTable: 'experiencias_locales',
        fields: ['titulo', 'resumen', 'validez'],
        // descripcion es richText (jsonb)
    },
]

async function migrate() {
    let totalTranslations = 0
    let successfulTranslations = 0

    try {
        // Limpiar tablas locales primero para evitar conflictos
        console.log('🧹 Limpiando tablas locales...')
        for (const { localesTable } of collections) {
            try {
                await localPool.query(`DELETE FROM "${localesTable}"`)
                console.log(`   ✓ ${localesTable}`)
            } catch (e) {
                // Tabla puede no existir, ignorar
            }
        }
        console.log('')

        for (const { table, localesTable, fields } of collections) {
            console.log(`📚 Migrando: ${table}`)

            try {
                // Leer datos de Dokploy
                const dokployQuery = `SELECT id, ${fields.map(f => `"${f}"`).join(', ')} FROM "${table}"`
                const dokployResult = await dokployPool.query(dokployQuery)

                console.log(`   📥 Leídos ${dokployResult.rows.length} registros de Dokploy`)

                let recordCount = 0
                for (const row of dokployResult.rows) {
                    recordCount++
                    const parentId = row.id

                    // Insertar en español primero
                    const esValues = fields.map(f => row[f] || null)
                    const esPlaceholders = fields.map((_, i) => `$${i + 2}`).join(', ')
                    const esQuery = `
                        INSERT INTO "${localesTable}" (_locale, _parent_id, ${fields.map(f => `"${f}"`).join(', ')})
                        VALUES ('es', $1, ${esPlaceholders})
                    `

                    try {
                        await localPool.query(esQuery, [parentId, ...esValues])
                    } catch (e: any) {
                        if (!e.message?.includes('duplicate')) {
                            console.error(`   ❌ Error insertando ES:`, e.message)
                        }
                    }

                    // Traducir a otros idiomas
                    process.stdout.write(`   [${recordCount}/${dokployResult.rows.length}] `)

                    for (const targetLang of targetLocales) {
                        const translations: Record<string, any> = {}
                        totalTranslations++

                        for (const field of fields) {
                            if (row[field] && typeof row[field] === 'string') {
                                translations[field] = await translateText(row[field], targetLang)
                            } else {
                                translations[field] = row[field] || null
                            }
                        }

                        const transValues = fields.map(f => translations[f])
                        const transPlaceholders = fields.map((_, i) => `$${i + 3}`).join(', ')
                        const transQuery = `
                            INSERT INTO "${localesTable}" (_locale, _parent_id, ${fields.map(f => `"${f}"`).join(', ')})
                            VALUES ($1, $2, ${transPlaceholders})
                        `

                        try {
                            await localPool.query(transQuery, [targetLang, parentId, ...transValues])
                            process.stdout.write(`✅`)
                            successfulTranslations++
                        } catch (error: any) {
                            if (error.message?.includes('duplicate')) {
                                process.stdout.write(`⏭️`)
                                successfulTranslations++
                            } else {
                                process.stdout.write(`❌`)
                            }
                        }
                    }

                    console.log()
                }

                console.log(`   ✅ ${table} completado\n`)
            } catch (error) {
                console.error(`   ❌ Error en ${table}:`, error)
            }
        }

        console.log(`\n✅ Migración completada!`)
        console.log(`   📊 Traducciones: ${successfulTranslations}/${totalTranslations}`)
    } finally {
        await dokployPool.end()
        await localPool.end()
    }
}

migrate().catch(console.error)
