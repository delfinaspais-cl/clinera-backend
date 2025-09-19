const { Client } = require('pg');

async function checkEmailInClinic() {
  const client = new Client({
    connectionString: 'postgresql://postgres:jEOzyzhJOYOWjFyEyqDfMPuqbZSORIiC@maglev.proxy.rlwy.net:29247/railway'
  });

  try {
    console.log('🔍 Verificando si delfina.spais@oacg.cl existe en clínica cmforbc6i0000pj31mipssih5...');
    await client.connect();
    console.log('✅ Conectado a Railway');

    // Buscar el email en la clínica específica
    const result = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u."clinicaId",
        c.name as clinica_name
      FROM "User" u
      LEFT JOIN "Clinica" c ON u."clinicaId" = c.id
      WHERE u.email = 'delfina.spais@oacg.cl'
      AND u."clinicaId" = 'cmforbc6i0000pj31mipssih5'
    `);
    
    console.log('📋 Usuarios encontrados con email delfina.spais@oacg.cl en clínica cmforbc6i0000pj31mipssih5:');
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nombre: ${user.name}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Clínica ID: ${user.clinicaId}`);
      console.log(`   Clínica Nombre: ${user.clinica_name}`);
      console.log('');
    });

    if (result.rows.length === 0) {
      console.log('❌ No se encontró el email delfina.spais@oacg.cl en la clínica cmforbc6i0000pj31mipssih5');
    } else {
      console.log(`✅ Se encontraron ${result.rows.length} usuarios con ese email en esa clínica`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkEmailInClinic();
