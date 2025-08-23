import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedChatData() {
  try {
    console.log('🌱 Iniciando seed de datos de chat...');

    // Buscar una clínica existente o crear una de ejemplo
    let clinica = await prisma.clinica.findFirst();
    
    if (!clinica) {
      console.log('No se encontró ninguna clínica, creando una de ejemplo...');
      clinica = await prisma.clinica.create({
        data: {
          name: 'Clínica Ejemplo',
          url: 'clinica-ejemplo',
          address: 'Av. Principal 123',
          phone: '+56912345678',
          email: 'contacto@clinicaejemplo.cl',
          estado: 'activo',
        },
      });
    }

    console.log(`Usando clínica: ${clinica.name} (${clinica.url})`);

    // Crear conversaciones de ejemplo
    const conversations = [
      {
        name: 'Angelina Peña',
        role: 'Doctora',
        phone: '+56912345678',
        email: 'angelina.pena@clinica.cl',
        stage: 'activas',
        tags: ['Staff', 'Urgente'],
        isOnline: true,
      },
      {
        name: 'María José Contreras',
        role: 'Paciente',
        phone: '+56987654321',
        email: 'maria.contreras@email.com',
        stage: 'prospectos',
        tags: ['Paciente', 'Reagendar'],
        isOnline: true,
      },
      {
        name: 'Claudia Miranda',
        role: 'Paciente',
        phone: '+56911223344',
        email: 'claudia.miranda@email.com',
        stage: 'prospectos',
        tags: ['Paciente', 'Cotización'],
        isOnline: false,
      },
      {
        name: 'Dr. Carlos Martínez',
        role: 'Doctor',
        phone: '+56955667788',
        email: 'carlos.martinez@clinica.cl',
        stage: 'agendados',
        tags: ['Staff', 'Cardiología'],
        isOnline: true,
      },
      {
        name: 'Ana Sofía López',
        role: 'Paciente',
        phone: '+56999887766',
        email: 'ana.lopez@email.com',
        stage: 'completados',
        tags: ['Paciente', 'Consulta'],
        isOnline: false,
      },
    ];

    const createdConversations: any[] = [];

    for (const convData of conversations) {
      const conversation = await prisma.conversation.create({
        data: {
          name: convData.name,
          role: convData.role,
          phone: convData.phone,
          email: convData.email,
          stage: convData.stage,
          tags: convData.tags,
          isOnline: convData.isOnline,
          avatar: generateAvatar(convData.name),
          clinicaId: clinica.id,
        },
      });

      createdConversations.push(conversation);
      console.log(`✅ Conversación creada: ${conversation.name}`);
    }

    // Crear mensajes de ejemplo para cada conversación
    const messagesData = [
      // Angelina Peña
      [
        {
          content: 'Hola, necesito revisar el horario de mañana para una consulta urgente.',
          isFromUser: false,
          messageType: 'text',
        },
        {
          content: 'Buenas tardes. No pude llegar a tiempo a mi cita. Llegué con más de 30 minutos de retraso.',
          isFromUser: true,
          messageType: 'text',
        },
        {
          content: '¡Muchas gracias por avisarnos! No se preocupe, entendemos que pueden surgir imprevistos.',
          isFromUser: false,
          messageType: 'text',
        },
        {
          content: 'Hola Doctora Martinez. Quería consultar su agenda para una nueva cita lo antes posible.',
          isFromUser: true,
          messageType: 'text',
        },
        {
          content: 'Por favor tenga en cuenta que solo consideramos 15 minutos de tolerancia. Pasado ese tiempo, la sesión se considera cancelada.',
          isFromUser: false,
          messageType: 'text',
        },
      ],
      // María José Contreras
      [
        {
          content: 'Necesito reagendar mi cita del viernes, ¿tienen disponibilidad?',
          isFromUser: false,
          messageType: 'text',
        },
        {
          content: 'Perfecto, ¿qué horario le conviene?',
          isFromUser: true,
          messageType: 'text',
        },
        {
          content: '¿Podrían enviarme la cotización del tratamiento?',
          isFromUser: false,
          messageType: 'text',
        },
      ],
      // Claudia Miranda
      [
        {
          content: '¿Podrían enviarme la cotización del tratamiento de ortodoncia?',
          isFromUser: false,
          messageType: 'text',
        },
        {
          content: 'Por supuesto, le envío la cotización por email.',
          isFromUser: true,
          messageType: 'text',
        },
      ],
      // Dr. Carlos Martínez
      [
        {
          content: 'Consulta sobre turno de cardiología. Hola, quisiera consultar sobre la disponibilidad de turnos para cardiología.',
          isFromUser: false,
          messageType: 'text',
        },
        {
          content: 'Tenemos disponibilidad el próximo martes a las 10:00 AM.',
          isFromUser: true,
          messageType: 'text',
        },
        {
          content: 'Perfecto, me parece bien ese horario.',
          isFromUser: false,
          messageType: 'text',
        },
      ],
      // Ana Sofía López
      [
        {
          content: 'Gracias por la consulta, todo salió muy bien.',
          isFromUser: false,
          messageType: 'text',
        },
        {
          content: 'Me alegra saberlo. No dude en contactarnos si necesita algo más.',
          isFromUser: true,
          messageType: 'text',
        },
      ],
    ];

    for (let i = 0; i < createdConversations.length; i++) {
      const conversation = createdConversations[i];
      const messages = messagesData[i];

      for (const msgData of messages) {
        await prisma.chatMessage.create({
          data: {
            content: msgData.content,
            isFromUser: msgData.isFromUser,
            messageType: msgData.messageType,
            conversationId: conversation.id,
            status: 'sent',
          },
        });
      }

      // Actualizar lastMessageAt de la conversación
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      console.log(`✅ Mensajes creados para: ${conversation.name}`);
    }

    console.log('🎉 Seed de datos de chat completado exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - Clínica: ${clinica.name}`);
    console.log(`   - Conversaciones creadas: ${createdConversations.length}`);
    console.log(`   - Mensajes creados: ${messagesData.flat().length}`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateAvatar(name: string): string {
  const words = name.split(' ');
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
  seedChatData();
}

export { seedChatData };
