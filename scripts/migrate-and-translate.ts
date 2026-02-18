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

console.log('🚀 Iniciando migración y traducción de BD...\n')
console.log('✅ Variables de entorno:')
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓' : '✗'}`)
console.log(`   DEEPL_API_KEY: ${process.env.DEEPL_API_KEY ? '✓' : '✗'}\n`)

// Configuración de DeepL
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || ''
const translator = new Translator(DEEPL_API_KEY)

// Pool de PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

const localeMapping: Record<string, string> = {
    'es': 'es',
    'en': 'en-US',
    'fr': 'fr-FR',
    'de': 'de-DE',
}

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
        console.error(`   ❌ Error traduciendo a ${targetLang}:`, error)
        return text
    }
}

// Definición de colecciones con sus campos localizables
const collections = [
    {
        baseTable: 'platos',
        localesTable: 'platos_locales',
        fields: ['nombre', 'descripcion', 'etiqueta']
    },
    {
        baseTable: 'menus',
        localesTable: 'menus_locales',
        fields: ['nombre', 'descripcion']
    },
    {
        baseTable: 'categorias',
        localesTable: 'categorias_locales',
        fields: ['nombre', 'descripcion']
    },
    {
        baseTable: 'paginas',
        localesTable: 'paginas_locales',
        fields: ['nombre', 'descripcion', 'titulo', 'contenido']
    },
    {
        baseTable: 'espacios',
        localesTable: 'espacios_locales',
        fields: ['nombre', 'descripcion']
    },
    {
        baseTable: 'experiencias',
        localesTable: 'experiencias_locales',
        fields: ['nombre', 'descripcion']
    },
]

async function migrateAndTranslate() {
    const client = await pool.connect()

    try {
        for (const { baseTable, localesTable, fields } of collections) {
            console.log(`📚 Procesando: ${baseTable}`)

            try {
                // Obtener todos los registros de la tabla base
                const query = `SELECT id, ${fields.map(f => `"${f}"`).join(', ')} FROM "${baseTable}" LIMIT 1000`
                const result = await client.query(query)

                console.log(`   📄 Encontrados ${result.rows.length} registros\n`)

                for (const row of result.rows) {
                    const parentId = row.id

                    // 1. Insertar en tabla de locales para español (Spanish source)
                    const esValues = fields.map(f => row[f])
                    const esPlaceholders = fields.map((_, i) => `$${i + 3}`).join(', ')
                    const esInsertQuery = `
                        INSERT INTO "${localesTable}" (_locale, _parent_id, ${fields.map(f => `"${f}"`).join(', ')})
                        VALUES ('es', $1, ${esPlaceholders})
                        ON CONFLICT DO NOTHING
                    `

                    try {
                        await client.query(esInsertQuery, [parentId, ...esValues])
                    } catch (e) {
                        // Ignorar conflictos
                    }

                    // 2. Traducir y insertar para otros idiomas
                    for (const targetLang of targetLocales) {
                        const translations: Record<string, string> = {}

                        for (const field of fields) {
                            if (row[field]) {
                                translations[field] = await translateText(row[field], targetLang)
                            }
                        }

                        const transValues = fields.map(f => translations[f] || '')
                        const transPlaceholders = fields.map((_, i) => `$${i + 3}`).join(', ')
                        const transInsertQuery = `
                            INSERT INTO "${localesTable}" (_locale, _parent_id, ${fields.map(f => `"${f}"`).join(', ')})
                            VALUES ($2, $1, ${transPlaceholders})
                            ON CONFLICT DO NOTHING
                        `

                        try {
                            await client.query(transInsertQuery, [parentId, targetLang, ...transValues])
                            console.log(`      ✅ ${targetLang}: registrado`)
                        } catch (error) {
                            console.error(`      ❌ ${targetLang}: error`, error)
                        }
                    }
                }

                console.log(`   ✅ ${baseTable} completado\n`)
            } catch (error) {
                console.error(`   ❌ Error en ${baseTable}:`, error)
            }
        }

        console.log('✅ Migración y traducción completada!')
    } finally {
        client.release()
        await pool.end()
    }
}

migrateAndTranslate().catch(console.error)
