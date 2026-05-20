import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { subHours } from 'date-fns';

@Injectable()
export class RemindersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Schedule a reminder for an appointment
   */
  async scheduleReminder(
    appointmentId: string,
    businessId: string,
    userId: string,
    data: {
      reminderType: string;
      hoursBeforeAppointment: number;
    }
  ) {
    // Get the appointment
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, businessId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Calculate when to send the reminder
    const scheduledFor = subHours(
      appointment.startTime,
      data.hoursBeforeAppointment
    );

    // Create reminder
    const reminder = await this.prisma.appointmentReminder.create({
      data: {
        appointmentId,
        businessId,
        reminderType: data.reminderType,
        scheduledFor,
        status: 'PENDING',
      },
      include: {
        appointment: {
          include: {
            client: true,
            therapist: { include: { user: true } },
          },
        },
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'REMINDER_SCHEDULED',
        entityType: 'AppointmentReminder',
        entityId: reminder.id,
        metadata: {
          appointmentId,
          reminderType: data.reminderType,
          scheduledFor,
        },
      },
    });

    return reminder;
  }

  /**
   * Get reminders for an appointment
   */
  async findByAppointment(appointmentId: string, businessId: string) {
    return this.prisma.appointmentReminder.findMany({
      where: { appointmentId, businessId },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  /**
   * Get all pending reminders
   */
  async findPending(businessId?: string) {
    const where: any = {
      status: 'PENDING',
      scheduledFor: { lte: new Date() },
    };

    if (businessId) {
      where.businessId = businessId;
    }

    return this.prisma.appointmentReminder.findMany({
      where,
      include: {
        appointment: {
          include: {
            client: true,
            therapist: { include: { user: true } },
          },
        },
      },
      orderBy: { scheduledFor: 'asc' },
      take: 100,
    });
  }

  /**
   * Mark reminder as sent
   */
  async markAsSent(id: string, businessId: string) {
    return this.prisma.appointmentReminder.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }

  /**
   * Mark reminder as failed
   */
  async markAsFailed(id: string, businessId: string, reason: string) {
    return this.prisma.appointmentReminder.update({
      where: { id },
      data: {
        status: 'FAILED',
        failureReason: reason,
      },
    });
  }

  /**
   * Cancel a reminder
   */
  async cancelReminder(id: string, businessId: string, userId: string) {
    const reminder = await this.prisma.appointmentReminder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'REMINDER_CANCELLED',
        entityType: 'AppointmentReminder',
        entityId: id,
      },
    });

    return reminder;
  }

  /**
   * Auto-schedule reminders for a new appointment
   * (Called when appointment is created)
   */
  async autoScheduleForAppointment(
    appointmentId: string,
    businessId: string,
    userId: string
  ) {
    // Default: schedule SMS reminder 24 hours before
    // In Stage 4, this will be configurable per business
    await this.scheduleReminder(appointmentId, businessId, userId, {
      reminderType: 'SMS',
      hoursBeforeAppointment: 24,
    });
  }
}
