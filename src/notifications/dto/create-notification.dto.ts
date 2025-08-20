import { z } from 'zod';

export const CreateNotificationSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  mensaje: z.string().min(1, 'El mensaje es requerido'),
  tipo: z.enum(['info', 'warning', 'error', 'success']).default('info'),
  prioridad: z.enum(['baja', 'media', 'alta']).default('media'),
  destinatarioId: z.string().optional(), // Si es null, es para todos los usuarios de la clínica
  fechaVencimiento: z.string().optional(), // ISO date string
});

export type CreateNotificationDto = z.infer<typeof CreateNotificationSchema>;
