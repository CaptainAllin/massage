import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AppointmentStatus } from '@massage/types';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new appointment with conflict detection
   */
  async create(businessId: string, userId: string, data: any) {
    const { clientId, therapistId, startTime, duration, ...rest } = data;

    // Validate required fields
    if (!clientId || !therapistId || !startTime || !duration) {
      throw new BadRequestException(
        'Missing required fields: clientId, therapistId, startTime, duration'
      );
    }

    // Calculate end time
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    // Check for conflicts
    const availabilityCheck = await this.checkAvailability(
      therapistId,
      start,
      end
    );

    if (!availabilityCheck.available) {
      throw new BadRequestException(
        availabilityCheck.message || 'Appointment slot not available'
      );
    }

    // Create appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        businessId,
        clientId,
        therapistId,
        startTime: start,
        endTime: end,
        duration,
        status: AppointmentStatus.SCHEDULED,
        ...rest,
      },
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'APPOINTMENT_CREATED',
        entityType: 'Appointment',
        entityId: appointment.id,
        metadata: {
          clientId,
          therapistId,
          startTime: start,
          duration,
        },
      },
    });

    return appointment;
  }

  /**
   * Find all appointments with filters and pagination
   */
  async findAll(businessId: string, filters?: any) {
    const {
      status,
      therapistId,
      clientId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'startTime',
      sortOrder = 'asc',
    } = filters || {};

    // Build where clause
    const where: any = { businessId };

    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = status;
      }
    }

    if (therapistId) {
      where.therapistId = therapistId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await this.prisma.appointment.count({ where });

    // Get paginated results
    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
        cancellation: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: appointments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a single appointment by ID
   */
  async findById(id: string, businessId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
        cancellation: true,
        treatmentNotes: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  /**
   * Update an appointment (with conflict recheck if time/therapist changed)
   */
  async update(id: string, businessId: string, userId: string, data: any) {
    const appointment = await this.findById(id, businessId);

    const { startTime, duration, therapistId, ...rest } = data;

    // If time or therapist changed, recalculate end time and check conflicts
    if (startTime || duration || therapistId) {
      const newStart = startTime ? new Date(startTime) : appointment.startTime;
      const newDuration = duration || appointment.duration;
      const newTherapistId = therapistId || appointment.therapistId;
      const newEnd = new Date(newStart.getTime() + newDuration * 60000);

      // Check for conflicts (excluding current appointment)
      const availabilityCheck = await this.checkAvailability(
        newTherapistId,
        newStart,
        newEnd,
        id
      );

      if (!availabilityCheck.available) {
        throw new BadRequestException(
          availabilityCheck.message || 'Appointment slot not available'
        );
      }

      // Update with new times
      const updated = await this.prisma.appointment.update({
        where: { id },
        data: {
          startTime: newStart,
          endTime: newEnd,
          duration: newDuration,
          therapistId: newTherapistId,
          ...rest,
        },
        include: {
          client: true,
          therapist: {
            include: {
              user: true,
            },
          },
        },
      });

      // Audit log
      await this.prisma.auditLog.create({
        data: {
          userId,
          businessId,
          action: 'APPOINTMENT_UPDATED',
          entityType: 'Appointment',
          entityId: id,
          metadata: {
            updatedFields: Object.keys(data),
            timeChanged: !!(startTime || duration),
          },
        },
      });

      return updated;
    }

    // No time changes, simple update
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: rest,
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'APPOINTMENT_UPDATED',
        entityType: 'Appointment',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return updated;
  }

  /**
   * Confirm an appointment (SCHEDULED -> CONFIRMED)
   */
  async confirmAppointment(id: string, businessId: string, userId: string) {
    const appointment = await this.findById(id, businessId);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(
        'Only SCHEDULED appointments can be confirmed'
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CONFIRMED },
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'APPOINTMENT_CONFIRMED',
        entityType: 'Appointment',
        entityId: id,
      },
    });

    return updated;
  }

  /**
   * Start an appointment (CONFIRMED -> IN_PROGRESS)
   */
  async startAppointment(id: string, businessId: string, userId: string) {
    const appointment = await this.findById(id, businessId);

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException(
        'Only CONFIRMED appointments can be started'
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.IN_PROGRESS },
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'APPOINTMENT_STARTED',
        entityType: 'Appointment',
        entityId: id,
      },
    });

    return updated;
  }

  /**
   * Complete an appointment (IN_PROGRESS -> COMPLETED)
   */
  async completeAppointment(id: string, businessId: string, userId: string) {
    const appointment = await this.findById(id, businessId);

    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Only IN_PROGRESS appointments can be completed'
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.COMPLETED },
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'APPOINTMENT_COMPLETED',
        entityType: 'Appointment',
        entityId: id,
      },
    });

    return updated;
  }

  /**
   * Mark appointment as no-show
   */
  async markNoShow(id: string, businessId: string, userId: string) {
    const appointment = await this.findById(id, businessId);

    if (
      appointment.status !== AppointmentStatus.SCHEDULED &&
      appointment.status !== AppointmentStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'Only SCHEDULED or CONFIRMED appointments can be marked as no-show'
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.NO_SHOW },
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'APPOINTMENT_NO_SHOW',
        entityType: 'Appointment',
        entityId: id,
      },
    });

    return updated;
  }

  /**
   * Cancel an appointment with reason tracking
   */
  async cancelAppointment(
    id: string,
    businessId: string,
    userId: string,
    cancellationData: { reason?: string; cancellationType: string }
  ) {
    const appointment = await this.findById(id, businessId);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }

    // Update appointment status
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
      },
    });

    // Create cancellation record
    await this.prisma.appointmentCancellation.create({
      data: {
        appointmentId: id,
        businessId,
        cancelledBy: userId,
        reason: cancellationData.reason || null,
        cancellationType: cancellationData.cancellationType,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'APPOINTMENT_CANCELLED',
        entityType: 'Appointment',
        entityId: id,
        metadata: {
          reason: cancellationData.reason,
          type: cancellationData.cancellationType,
        },
      },
    });

    return updated;
  }

  /**
   * Check if a therapist is available for a time slot
   */
  async checkAvailability(
    therapistId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<{
    available: boolean;
    reason?: string;
    conflicts?: any[];
    message?: string;
  }> {
    // 1. Check if therapist has availability set for this day of week
    const dayOfWeek = startTime.getDay();
    const timeString = startTime.toTimeString().substring(0, 5); // "HH:MM"
    const endTimeString = endTime.toTimeString().substring(0, 5);

    const availability = await this.prisma.therapistAvailability.findFirst({
      where: {
        therapistId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!availability) {
      return {
        available: false,
        reason: 'NO_AVAILABILITY',
        message: 'Therapist has no availability set for this day',
      };
    }

    // 2. Check if time is within working hours
    if (
      timeString < availability.startTime ||
      endTimeString > availability.endTime
    ) {
      return {
        available: false,
        reason: 'OUTSIDE_HOURS',
        message: `Therapist works ${availability.startTime} - ${availability.endTime} on this day`,
      };
    }

    // 3. Check for time-off conflicts
    const timeOff = await this.prisma.therapistTimeOff.findFirst({
      where: {
        therapistId,
        OR: [
          {
            AND: [
              { startDate: { lte: startTime } },
              { endDate: { gte: startTime } },
            ],
          },
          {
            AND: [
              { startDate: { lte: endTime } },
              { endDate: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startDate: { gte: startTime } },
              { endDate: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (timeOff) {
      return {
        available: false,
        reason: 'TIME_OFF',
        message: 'Therapist is on time off during this period',
      };
    }

    // 4. Check for appointment conflicts
    const where: any = {
      therapistId,
      status: {
        notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      },
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        {
          AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    };

    if (excludeAppointmentId) {
      where.id = { not: excludeAppointmentId };
    }

    const conflicts = await this.prisma.appointment.findMany({
      where,
      include: {
        client: true,
      },
    });

    if (conflicts.length > 0) {
      return {
        available: false,
        reason: 'CONFLICT',
        conflicts,
        message: `Therapist has ${conflicts.length} conflicting appointment(s)`,
      };
    }

    return {
      available: true,
    };
  }

  /**
   * Find conflicts for a given time slot
   */
  async findConflicts(therapistId: string, startTime: Date, endTime: Date) {
    return this.prisma.appointment.findMany({
      where: {
        therapistId,
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}
