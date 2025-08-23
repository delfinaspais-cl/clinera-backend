import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  ConversationDto, 
  CreateConversationDto, 
  UpdateConversationDto,
  MessageDto,
  CreateMessageDto,
  UpdateMessageDto,
  ConversationFiltersDto
} from './dto/conversation.dto';

@Injectable()
export class ChatMessagingService {
  constructor(private prisma: PrismaService) {}

  // ===== CONVERSACIONES =====

  async getConversations(clinicaUrl: string, filters?: ConversationFiltersDto) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });
      
      if (!clinica) {
        throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
      }

      const whereClause: any = {
        clinicaId: clinica.id,
      };

      if (filters?.stage) {
        whereClause.stage = filters.stage;
      }

      if (filters?.search) {
        whereClause.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters?.tags && filters.tags.length > 0) {
        whereClause.tags = {
          hasSome: filters.tags,
        };
      }

      if (filters?.isOnline !== undefined) {
        whereClause.isOnline = filters.isOnline;
      }

      const conversations = await this.prisma.conversation.findMany({
        where: whereClause,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              messages: {
                where: {
                  isFromUser: false,
                  status: { not: 'read' },
                },
              },
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      });

      return {
        success: true,
        conversations: conversations.map(conv => ({
          id: conv.id,
          name: conv.name,
          role: conv.role,
          avatar: conv.avatar || this.generateAvatar(conv.name),
          lastMessage: conv.messages[0]?.content || '',
          timestamp: this.formatTimestamp(conv.lastMessageAt),
          tags: conv.tags,
          isOnline: conv.isOnline,
          phone: conv.phone,
          email: conv.email,
          stage: conv.stage,
          unreadCount: conv._count.messages,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        })),
      };
    } catch (error) {
      console.error('Error en getConversations:', error);
      throw new InternalServerErrorException('Error al obtener conversaciones');
    }
  }

  async getConversation(clinicaUrl: string, conversationId: string) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });
      
      if (!clinica) {
        throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
      }

      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          clinicaId: clinica.id,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              messages: {
                where: {
                  isFromUser: false,
                  status: { not: 'read' },
                },
              },
            },
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversación no encontrada');
      }

      return {
        success: true,
        conversation: {
          id: conversation.id,
          name: conversation.name,
          role: conversation.role,
          avatar: conversation.avatar || this.generateAvatar(conversation.name),
          lastMessage: conversation.messages[conversation.messages.length - 1]?.content || '',
          timestamp: this.formatTimestamp(conversation.lastMessageAt),
          tags: conversation.tags,
          isOnline: conversation.isOnline,
          phone: conversation.phone,
          email: conversation.email,
          stage: conversation.stage,
          unreadCount: conversation._count.messages,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      };
    } catch (error) {
      console.error('Error en getConversation:', error);
      throw new InternalServerErrorException('Error al obtener conversación');
    }
  }

  async createConversation(clinicaUrl: string, dto: CreateConversationDto) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });
      
      if (!clinica) {
        throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
      }

      const conversation = await this.prisma.conversation.create({
        data: {
          name: dto.name,
          role: dto.role,
          phone: dto.phone,
          email: dto.email,
          stage: dto.stage || 'prospectos',
          tags: dto.tags || [],
          avatar: this.generateAvatar(dto.name),
          clinicaId: clinica.id,
        },
      });

      return {
        success: true,
        conversation: {
          id: conversation.id,
          name: conversation.name,
          role: conversation.role,
          avatar: conversation.avatar,
          lastMessage: '',
          timestamp: this.formatTimestamp(conversation.createdAt),
          tags: conversation.tags,
          isOnline: conversation.isOnline,
          phone: conversation.phone,
          email: conversation.email,
          stage: conversation.stage,
          unreadCount: 0,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      };
    } catch (error) {
      console.error('Error en createConversation:', error);
      throw new InternalServerErrorException('Error al crear conversación');
    }
  }

  async updateConversation(clinicaUrl: string, conversationId: string, dto: UpdateConversationDto) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });
      
      if (!clinica) {
        throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
      }

      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          clinicaId: clinica.id,
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversación no encontrada');
      }

      const updatedConversation = await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          name: dto.name,
          role: dto.role,
          stage: dto.stage,
          tags: dto.tags,
          isOnline: dto.isOnline,
        },
      });

      return {
        success: true,
        conversation: {
          id: updatedConversation.id,
          name: updatedConversation.name,
          role: updatedConversation.role,
          avatar: updatedConversation.avatar,
          lastMessage: '',
          timestamp: this.formatTimestamp(updatedConversation.updatedAt),
          tags: updatedConversation.tags,
          isOnline: updatedConversation.isOnline,
          phone: updatedConversation.phone,
          email: updatedConversation.email,
          stage: updatedConversation.stage,
          unreadCount: 0,
          createdAt: updatedConversation.createdAt,
          updatedAt: updatedConversation.updatedAt,
        },
      };
    } catch (error) {
      console.error('Error en updateConversation:', error);
      throw new InternalServerErrorException('Error al actualizar conversación');
    }
  }

  async moveConversationToStage(clinicaUrl: string, conversationId: string, stage: string) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });
      
      if (!clinica) {
        throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
      }

      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          clinicaId: clinica.id,
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversación no encontrada');
      }

      const validStages = ['prospectos', 'activas', 'agendados', 'completados', 'cerradas'];
      if (!validStages.includes(stage)) {
        throw new Error('Etapa no válida');
      }

      const updatedConversation = await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { stage },
      });

      return {
        success: true,
        message: `Conversación movida a etapa: ${stage}`,
        conversation: {
          id: updatedConversation.id,
          stage: updatedConversation.stage,
        },
      };
    } catch (error) {
      console.error('Error en moveConversationToStage:', error);
      throw new InternalServerErrorException('Error al mover conversación');
    }
  }

  // ===== MENSAJES =====

  async getMessages(clinicaUrl: string, conversationId: string) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });
      
      if (!clinica) {
        throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
      }

      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          clinicaId: clinica.id,
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversación no encontrada');
      }

      const messages = await this.prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
            },
          },
        },
      });

      return {
        success: true,
        messages: messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          timestamp: this.formatTimestamp(msg.createdAt),
          isFromUser: msg.isFromUser,
          conversationId: msg.conversationId,
          messageType: msg.messageType,
          status: msg.status,
          createdAt: msg.createdAt,
          user: msg.user ? {
            id: msg.user.id,
            name: msg.user.name,
            avatar: msg.user.avatar_url,
          } : null,
        })),
      };
    } catch (error) {
      console.error('Error en getMessages:', error);
      throw new InternalServerErrorException('Error al obtener mensajes');
    }
  }

  async createMessage(clinicaUrl: string, dto: CreateMessageDto, userId?: string) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });
      
      if (!clinica) {
        throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
      }

      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: dto.conversationId,
          clinicaId: clinica.id,
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversación no encontrada');
      }

      const message = await this.prisma.chatMessage.create({
        data: {
          content: dto.content,
          isFromUser: dto.isFromUser,
          messageType: dto.messageType || 'text',
          conversationId: dto.conversationId,
          userId: dto.isFromUser ? userId : null,
          status: 'sent',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
            },
          },
        },
      });

      // Actualizar lastMessageAt de la conversación
      await this.prisma.conversation.update({
        where: { id: dto.conversationId },
        data: { lastMessageAt: new Date() },
      });

      return {
        success: true,
        message: {
          id: message.id,
          content: message.content,
          timestamp: this.formatTimestamp(message.createdAt),
          isFromUser: message.isFromUser,
          conversationId: message.conversationId,
          messageType: message.messageType,
          status: message.status,
          createdAt: message.createdAt,
          user: message.user ? {
            id: message.user.id,
            name: message.user.name,
            avatar: message.user.avatar_url,
          } : null,
        },
      };
    } catch (error) {
      console.error('Error en createMessage:', error);
      throw new InternalServerErrorException('Error al crear mensaje');
    }
  }

  async markMessagesAsRead(clinicaUrl: string, conversationId: string) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });
      
      if (!clinica) {
        throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
      }

      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          clinicaId: clinica.id,
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversación no encontrada');
      }

      await this.prisma.chatMessage.updateMany({
        where: {
          conversationId,
          isFromUser: false,
          status: { not: 'read' },
        },
        data: { status: 'read' },
      });

      return {
        success: true,
        message: 'Mensajes marcados como leídos',
      };
    } catch (error) {
      console.error('Error en markMessagesAsRead:', error);
      throw new InternalServerErrorException('Error al marcar mensajes como leídos');
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  private generateAvatar(name: string): string {
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Ahora';
    } else if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Hace ${hours} h`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
    }
  }

  // ===== ESTADÍSTICAS =====

  async getConversationStats(clinicaUrl: string) {
    try {
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });
      
      if (!clinica) {
        throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
      }

      const stats = await this.prisma.conversation.groupBy({
        by: ['stage'],
        where: { clinicaId: clinica.id },
        _count: { id: true },
      });

      const totalConversations = await this.prisma.conversation.count({
        where: { clinicaId: clinica.id },
      });

      const unreadMessages = await this.prisma.chatMessage.count({
        where: {
          conversation: {
            clinicaId: clinica.id,
          },
          isFromUser: false,
          status: { not: 'read' },
        },
      });

      const statsMap = {
        prospectos: 0,
        activas: 0,
        agendados: 0,
        completados: 0,
        cerradas: 0,
      };

      stats.forEach(stat => {
        statsMap[stat.stage] = stat._count.id;
      });

      return {
        success: true,
        stats: {
          totalConversations,
          unreadMessages,
          byStage: statsMap,
        },
      };
    } catch (error) {
      console.error('Error en getConversationStats:', error);
      throw new InternalServerErrorException('Error al obtener estadísticas');
    }
  }
}
