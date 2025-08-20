import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface NotificationJob {
  id: string;
  type: 'whatsapp' | 'email' | 'sms';
  recipient: string;
  template: string;
  variables: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);
  private readonly queue: NotificationJob[] = [];
  private readonly processing = new Set<string>();

  constructor(private prisma: PrismaService) {
    // Start processing queue
    this.processQueue();
  }

  async addToQueue(
    job: Omit<NotificationJob, 'id' | 'retryCount' | 'status'>,
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const notificationJob: NotificationJob = {
      ...job,
      id: jobId,
      retryCount: 0,
      status: 'pending',
    };

    this.queue.push(notificationJob);
    this.logger.log(`Job ${jobId} added to queue`);

    // Notify both clinic and Clinera.io about queue addition
    await this.notifyQueueAddition(job);

    return jobId;
  }

  private async processQueue() {
    setInterval(async () => {
      const pendingJobs = this.queue.filter(
        (job) =>
          job.status === 'pending' &&
          !this.processing.has(job.id) &&
          (!job.nextRetryAt || job.nextRetryAt <= new Date()),
      );

      for (const job of pendingJobs) {
        await this.processJob(job);
      }
    }, 1000); // Check every second
  }

  private async processJob(job: NotificationJob) {
    this.processing.add(job.id);
    job.status = 'processing';

    try {
      this.logger.log(
        `Processing job ${job.id} (attempt ${job.retryCount + 1})`,
      );

      // Simulate sending notification
      const success = await this.sendNotification(job);

      if (success) {
        job.status = 'completed';
        this.logger.log(`Job ${job.id} completed successfully`);

        // Remove from queue
        const index = this.queue.findIndex((j) => j.id === job.id);
        if (index > -1) {
          this.queue.splice(index, 1);
        }
      } else {
        throw new Error('Notification sending failed');
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);

      job.retryCount++;

      if (job.retryCount >= job.maxRetries) {
        job.status = 'failed';
        this.logger.error(
          `Job ${job.id} permanently failed after ${job.maxRetries} attempts`,
        );

        // Notify about permanent failure
        await this.notifyPermanentFailure(job);
      } else {
        job.status = 'pending';
        // Exponential backoff: 2^retryCount seconds
        const delaySeconds = Math.pow(2, job.retryCount);
        job.nextRetryAt = new Date(Date.now() + delaySeconds * 1000);

        this.logger.log(
          `Job ${job.id} scheduled for retry in ${delaySeconds} seconds`,
        );
      }
    } finally {
      this.processing.delete(job.id);
    }
  }

  private async sendNotification(job: NotificationJob): Promise<boolean> {
    // Simulate different success rates based on type
    const successRates = {
      whatsapp: 0.95, // 95% success rate
      email: 0.98, // 98% success rate
      sms: 0.9, // 90% success rate
    };

    const successRate = successRates[job.type];
    const random = Math.random();

    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200),
    );

    return random < successRate;
  }

  private async notifyQueueAddition(
    job: Omit<NotificationJob, 'id' | 'retryCount' | 'status'>,
  ) {
    // Create notification for clinic
    await this.prisma.notificacion.create({
      data: {
        titulo: 'Notificación en cola',
        mensaje: `Se ha agregado una notificación ${job.type} a la cola de envío`,
        tipo: 'info',
        prioridad: 'baja',
        clinicaId: 'system', // You'll need to get the actual clinic ID
      },
    });

    // Create notification for Clinera.io (system notification)
    await this.prisma.notificacion.create({
      data: {
        titulo: 'Nueva notificación en cola',
        mensaje: `Tipo: ${job.type}, Destinatario: ${job.recipient}`,
        tipo: 'info',
        prioridad: 'baja',
        clinicaId: 'clinera-system', // Special ID for system notifications
      },
    });
  }

  private async notifyPermanentFailure(job: NotificationJob) {
    // Notify clinic about permanent failure
    await this.prisma.notificacion.create({
      data: {
        titulo: 'Error de envío permanente',
        mensaje: `No se pudo enviar la notificación ${job.type} después de ${job.maxRetries} intentos`,
        tipo: 'error',
        prioridad: 'alta',
        clinicaId: 'system',
      },
    });

    // Notify Clinera.io about permanent failure
    await this.prisma.notificacion.create({
      data: {
        titulo: 'FALLO MASIVO DETECTADO',
        mensaje: `Fallo permanente en notificación ${job.type} para ${job.recipient}. Revisar sistema de envío.`,
        tipo: 'error',
        prioridad: 'alta',
        clinicaId: 'clinera-system',
      },
    });

    // Log for monitoring
    this.logger.error(
      `PERMANENT FAILURE: ${job.type} notification to ${job.recipient}`,
    );
  }

  getQueueStatus() {
    const stats = {
      total: this.queue.length,
      pending: this.queue.filter((j) => j.status === 'pending').length,
      processing: this.processing.size,
      completed: this.queue.filter((j) => j.status === 'completed').length,
      failed: this.queue.filter((j) => j.status === 'failed').length,
    };

    return stats;
  }
}
