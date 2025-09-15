const { PrismaClient } = require('@prisma/client');

async function checkClinicaDemo() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando clínica demo...');
    
    // Buscar clínica-demo
    const clinicaDemo = await prisma.clinica.findUnique({
      where: { url: 'clinica-demo' }
    });
    
    console.log('Clínica demo encontrada:', clinicaDemo ? 'Sí' : 'No');
    
    if (clinicaDemo) {
      console.log('Datos de clínica-demo:', JSON.stringify(clinicaDemo, null, 2));
    }
    
    // También verificar clinica-lumina
    const clinicaLumina = await prisma.clinica.findUnique({
      where: { url: 'clinica-lumina' }
    });
    
    console.log('Clínica lumina encontrada:', clinicaLumina ? 'Sí' : 'No');
    
    if (clinicaLumina) {
      console.log('Datos de clinica-lumina:', JSON.stringify(clinicaLumina, null, 2));
    }
    
    // Listar todas las clínicas
    const allClinicas = await prisma.clinica.findMany({
      select: { id: true, name: true, url: true, estado: true }
    });
    
    console.log('Todas las clínicas:');
    allClinicas.forEach(clinica => {
      console.log(`- ${clinica.name} (${clinica.url}) - Estado: ${clinica.estado}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClinicaDemo();
