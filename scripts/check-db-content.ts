import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'

// Cargar variables de entorno
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
dotenv.config({
    path: path.resolve(dirname, '../.env'),
})

async function main() {
    console.log('🔍 Verificando contenido de la base de datos...\n')

    const payloadConfig = await import('../payload.config.ts')
    const payload = await getPayload({
        config: payloadConfig.default,
    })

    const collections = [
        'platos',
        'menus',
        'categorias',
        'espacios',
        'experiencias',
        'menus-grupo',
        'paginas',
    ]

    for (const collection of collections) {
        try {
            const result = await payload.find({
                collection: collection,
                limit: 10,
                depth: 0,
            })
            console.log(`📚 ${collection}: ${result.totalDocs} documentos`)
        } catch (error) {
            console.log(`❌ ${collection}: Error - ${(error as any).message}`)
        }
    }

    // Verificar globales
    try {
        const paginaInicio = await payload.findGlobal({
            slug: 'pagina-inicio',
        })
        console.log(`\n🌐 pagina-inicio: encontrado`)
    } catch (error) {
        console.log(`\n❌ pagina-inicio: Error - ${(error as any).message}`)
    }

    try {
        const configSitio = await payload.findGlobal({
            slug: 'configuracion-sitio',
        })
        console.log(`🌐 configuracion-sitio: encontrado`)
    } catch (error) {
        console.log(`❌ configuracion-sitio: Error - ${(error as any).message}`)
    }

    process.exit(0)
}

main()