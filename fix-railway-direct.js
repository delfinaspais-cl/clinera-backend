const { Client } = require('pg');

async function fixRailwayDatabase() {
  const client = new Client({
    connectionString: 'postgresql://postgres:jEOzyzhJOYOWjFyEyqDfMPuqbZSORIiC@maglev.proxy.rlwy.net:29247/railway'
  });

  try {
    console.log('🔍 Conectando a Railway...');
    await client.connect();
    console.log('✅ Conectado a Railway');

    console.log('🔍 Verificando restricciones actuales...');
    const constraints = await client.query(`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = '"User"'::regclass 
      AND conname LIKE '%email%'
    `);
    
    console.log('📋 Restricciones actuales:', constraints.rows);

    console.log('🔧 Eliminando restricción única global en email...');
    await client.query(`
      ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key"
    `);
    console.log('✅ Restricción única global eliminada');

    console.log('🔧 Creando restricción única compuesta (email, clinicaId)...');
    await client.query(`
      ALTER TABLE "User" ADD CONSTRAINT "unique_email_per_clinica" UNIQUE ("email", "clinicaId")
    `);
    console.log('✅ Restricción única compuesta creada');

    console.log('🔍 Verificando restricciones después del cambio...');
    const newConstraints = await client.query(`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = '"User"'::regclass 
      AND conname LIKE '%email%'
    `);
    
    console.log('📋 Restricciones después del cambio:', newConstraints.rows);

    console.log('✅ Base de datos de Railway corregida exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

fixRailwayDatabase();
