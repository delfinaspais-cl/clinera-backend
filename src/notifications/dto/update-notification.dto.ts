import { z } from 'zod';

export const UpdateNotificationSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').optional(),
  mensaje: z.string().min(1, 'El mensaje es requerido').optional(),
  tipo: z.enum(['info', 'warning', 'error', 'success']).optional(),
  prioridad: z.enum(['baja', 'media', 'alta']).optional(),
  leida: z.boolean().optional(),
  fechaVencimiento: z.string().optional(),
});

export type UpdateNotificationDto = z.infer<typeof UpdateNotificationSchema>;
