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

console.log('✅ Variables de entorno cargadas correctamente')
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓' : '✗'}`)
console.log(`   DEEPL_API_KEY: ${process.env.DEEPL_API_KEY ? '✓' : '✗'}\n`)

// Configuración de DeepL
const DEEPL_API_KEY = process.env.DEEPL_API_KEY || ''
const translator = new Translator(DEEPL_API_KEY)

// Configuración de PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

// Mapeo de idiomas
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
        console.error(`Error traduciendo a ${targetLang}:`, error)
        return text
    }
}

// Colecciones a traducir con sus campos localizables
const collections = [
    { table: 'platos', fields: ['nombre', 'descripcion'] },
    { table: 'menus', fields: ['nombre', 'descripcion'] },
    { table: 'menus_grupo', fields: ['nombre', 'descripcion'] },
    { table: 'categorias', fields: ['nombre', 'descripcion'] },
    { table: 'paginas', fields: ['nombre', 'descripcion', 'titulo', 'contenido'] },
    { table: 'espacios', fields: ['nombre', 'descripcion'] },
    { table: 'experiencias', fields: ['nombre', 'descripcion'] },
]

async function main() {
    console.log('🚀 Iniciando traducción directa en base de datos...\n')

    try {
        const client = await pool.connect()

        for (const { table, fields } of collections) {
            console.log(`📚 Traduciendo tabla: ${table}`)

            try {
                // Obtener documentos en español
                const result = await client.query(
                    `SELECT id FROM "${table}" WHERE "createdAt" IS NOT NULL LIMIT 1000`
                )
                console.log(`   📄 Encontrados ${result.rows.length} documentos`)

                for (const row of result.rows) {
                    const docId = row.id
                    console.log(`   🔄 Traduciendo documento: ${docId}`)

                    for (const targetLang of targetLocales) {
                        try {
                            // Obtener documento en idioma fuente
                            const sourceResult = await client.query(
                                `SELECT ${fields.map(f => `"${f}"`).join(', ')} FROM "${table}" WHERE id = $1 AND "locale" = $2`,
                                [docId, sourceLocale]
                            )

                            if (sourceResult.rows.length === 0) continue

                            const sourceDoc = sourceResult.rows[0]

                            // Traducir cada campo
                            const translations: Record<string, string> = {}
                            for (const field of fields) {
                                if (sourceDoc[field]) {
                                    translations[field] = await translateText(sourceDoc[field], targetLang)
                                }
                            }

                            // Upsert en tabla de traducciones
                            const setClause = fields
                                .map((f, i) => `"${f}" = $${i + 3}`)
                                .join(', ')
                            const values = fields.map(f => translations[f] || '')

                            await client.query(
                                `UPDATE "${table}" SET ${setClause}, "updatedAt" = NOW()
                                 WHERE id = $1 AND "locale" = $2`,
                                [docId, targetLang, ...values]
                            )

                            console.log(`      ✅ ${targetLang}: completado`)
                        } catch (error) {
                            console.error(`      ❌ ${targetLang}: error`, error)
                        }
                    }
                }

                console.log(`   ✅ Tabla ${table} completada\n`)
            } catch (error) {
                console.error(`   ❌ Error en tabla ${table}:`, error)
            }
        }

        console.log('✅ Traducción completada con éxito!')
        client.release()
    } catch (error) {
        console.error('❌ Error en el proceso de traducción:', error)
    } finally {
        await pool.end()
    }
}

main()
