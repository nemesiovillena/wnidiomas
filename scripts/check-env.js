#!/usr/bin/env node

/**
 * Script para verificar que todas las variables de entorno necesarias
 * estén configuradas antes de ejecutar scripts
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');

console.log('🔍 Verificando configuración de entorno...\n');

// Verificar que .env existe
if (!fs.existsSync(envPath)) {
    console.error('❌ ERROR: El archivo .env no existe');
    console.error('   Crea el archivo a partir de .env.example:');
    console.error('   cp .env.example .env');
    console.error('\n   Luego edita .env y completa las variables necesarias.');
    process.exit(1);
}

console.log('✅ Archivo .env encontrado\n');

// Cargar variables
dotenv.config({ path: envPath });

// Variables obligatorias para el script de traducción
const requiredVars = [
    {
        name: 'PAYLOAD_SECRET',
        description: 'Clave secreta de Payload CMS',
        example: 'your-super-secret-key-change-this'
    },
    {
        name: 'DATABASE_URL',
        description: 'URL de conexión a PostgreSQL',
        example: 'postgresql://user:password@localhost:5432/warynessy'
    },
    {
        name: 'DEEPL_API_KEY',
        description: 'API Key de DeepL para traducciones',
        example: '033d5257-52f5-454f-bae6-9aa6d048519b:fx'
    }
];

let allPresent = true;

console.log('Variables de entorno requeridas:');
console.log('─────────────────────────────\n');

requiredVars.forEach(({ name, description, example }) => {
    const value = process.env[name];
    if (!value) {
        console.error(`❌ ${name}`);
        console.error(`   ${description}`);
        console.error(`   Ejemplo: ${example}\n`);
        allPresent = false;
    } else {
        console.log(`✅ ${name}`);
        console.log(`   ${description}`);
        console.log(`   Valor: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}\n`);
    }
});

if (!allPresent) {
    console.error('\n❌ Faltan variables de entorno obligatorias');
    console.error('   Por favor, completa estas variables en el archivo .env');
    console.error('   Referencia: .env.example\n');
    process.exit(1);
}

console.log('\n✅ Todas las variables de entorno están configuradas correctamente');
console.log('   Puedes ejecutar el script de traducción:\n');
console.log('   npx tsx scripts/translate-content.ts\n');

process.exit(0);