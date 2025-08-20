import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactoDto } from './dto/create-contacto.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class ContactosService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(createContactoDto: CreateContactoDto, requestInfo?: any) {
    try {
      // 1. Verificar rate limiting por email
      await this.checkRateLimit(createContactoDto.email);

      // 2. Crear el contacto en la base de datos
      const contacto = await this.prisma.contacto.create({
        data: {
          nombre: createContactoDto.nombre,
          email: createContactoDto.email,
          telefono: createContactoDto.telefono,
          empresa: createContactoDto.empresa,
          tipoConsulta: createContactoDto.tipoConsulta,
          plan: createContactoDto.plan,
          mensaje: createContactoDto.mensaje,
          metadata: requestInfo ? JSON.stringify(requestInfo) : null,
        },
      });

      // 3. Enviar email de confirmación al usuario
      await this.sendConfirmationEmail(contacto);

      // 4. Enviar notificación al equipo de ventas
      await this.notifySalesTeam(contacto);

      // 5. Registrar log de actividad
      await this.logContactActivity(contacto, requestInfo);

      return {
        success: true,
        message: 'Consulta enviada exitosamente. Nos pondremos en contacto contigo en las próximas 24 horas.',
        data: {
          id: contacto.id,
          timestamp: contacto.createdAt,
          nombre: contacto.nombre,
          email: contacto.email,
          telefono: contacto.telefono,
          empresa: contacto.empresa,
          tipoConsulta: contacto.tipoConsulta,
          plan: contacto.plan,
          mensaje: contacto.mensaje,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error creating contact:', error);
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  private async checkRateLimit(email: string): Promise<void> {
    // En desarrollo o Railway, ser más permisivo con el rate limiting
    const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.RAILWAY_ENVIRONMENT;
    const maxContacts = isDevelopment ? 50 : 3; // 50 en desarrollo/Railway, 3 en producción real
    
    // Verificar si ya se enviaron consultas en las últimas 24 horas desde este email
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentContacts = await this.prisma.contacto.count({
      where: {
        email: email,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    if (recentContacts >= maxContacts) {
      const message = isDevelopment 
        ? `Has alcanzado el límite de consultas diarias (${maxContacts}). Intenta nuevamente mañana.`
        : 'Has alcanzado el límite de consultas diarias. Intenta nuevamente mañana.';
      throw new BadRequestException(message);
    }
  }

  private async sendConfirmationEmail(contacto: any): Promise<void> {
    try {
      const emailData = {
        to: contacto.email,
        subject: 'Consulta recibida - Clinera',
        template: 'contact-confirmation',
        data: {
          nombre: contacto.nombre,
          tipoConsulta: this.getTipoConsultaLabel(contacto.tipoConsulta),
          fecha: contacto.createdAt.toISOString(),
          mensaje: contacto.mensaje,
        },
      };

      await this.emailService.sendEmail(emailData);
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // No lanzar error para no afectar el flujo principal
    }
  }

  private async notifySalesTeam(contacto: any): Promise<void> {
    try {
      const priority = this.getPriority(contacto.tipoConsulta);
      
      const emailData = {
        to: process.env.SALES_EMAIL || 'ventas@clinera.com',
        subject: `Nueva consulta: ${this.getTipoConsultaLabel(contacto.tipoConsulta)} - ${priority}`,
        template: 'contact-notification',
        data: {
          ...contacto,
          tipoConsultaLabel: this.getTipoConsultaLabel(contacto.tipoConsulta),
          planLabel: this.getPlanLabel(contacto.plan),
          priority,
          fecha: contacto.createdAt.toISOString(),
        },
      };

      await this.emailService.sendEmail(emailData);
    } catch (error) {
      console.error('Error notifying sales team:', error);
      // No lanzar error para no afectar el flujo principal
    }
  }

  private async logContactActivity(contacto: any, requestInfo?: any): Promise<void> {
    try {
      // Aquí podrías implementar logging a un servicio externo como DataDog, LogRocket, etc.
      console.log('Contact activity logged:', {
        contactId: contacto.id,
        email: contacto.email,
        tipoConsulta: contacto.tipoConsulta,
        timestamp: new Date().toISOString(),
        requestInfo,
      });
    } catch (error) {
      console.error('Error logging contact activity:', error);
    }
  }

  private getTipoConsultaLabel(tipoConsulta: string): string {
    const labels = {
      contratacion: 'Contratación de servicios',
      demo: 'Solicitar demo',
      precios: 'Consulta de precios',
      soporte: 'Soporte técnico',
      personalizacion: 'Personalización',
      otro: 'Otro tipo de consulta',
    };
    return labels[tipoConsulta] || tipoConsulta;
  }

  private getPlanLabel(plan?: string): string {
    if (!plan) return 'No especificado';
    
    const labels = {
      basico: 'Plan Básico ($99/mes)',
      profesional: 'Plan Profesional ($199/mes)',
      empresarial: 'Plan Empresarial ($399/mes)',
      personalizado: 'Plan personalizado',
    };
    return labels[plan] || plan;
  }

  private getPriority(tipoConsulta: string): string {
    const priorities = {
      contratacion: 'alta',
      demo: 'alta',
      precios: 'media',
      soporte: 'alta',
      personalizacion: 'media',
      otro: 'baja',
    };
    return priorities[tipoConsulta] || 'media';
  }

  // Métodos adicionales para administración
  async findAll(page = 1, limit = 10, estado?: string) {
    const skip = (page - 1) * limit;
    
    const where = estado ? { estado } : {};
    
    const [contactos, total] = await Promise.all([
      this.prisma.contacto.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contacto.count({ where }),
    ]);

    return {
      data: contactos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const contacto = await this.prisma.contacto.findUnique({
      where: { id },
    });

    if (!contacto) {
      throw new BadRequestException('Contacto no encontrado');
    }

    return contacto;
  }

  async updateEstado(id: string, estado: string, notas?: string) {
    const contacto = await this.prisma.contacto.update({
      where: { id },
      data: {
        estado,
        notas,
        procesado: estado === 'cerrado',
        updatedAt: new Date(),
      },
    });

    return contacto;
  }

  async clearTestContacts() {
    const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.RAILWAY_ENVIRONMENT;
    if (!isDevelopment) {
      throw new BadRequestException('Este método solo está disponible en desarrollo');
    }

    // Eliminar contactos de prueba (emails que contengan 'test' o 'example')
    const deletedContacts = await this.prisma.contacto.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test', mode: 'insensitive' } },
          { email: { contains: 'example', mode: 'insensitive' } },
          { email: { contains: 'delfina.spais@oacg.cl' } }, // Tu email de prueba
        ],
      },
    });

    return {
      message: 'Contactos de prueba eliminados',
      deletedCount: deletedContacts.count,
    };
  }
}
