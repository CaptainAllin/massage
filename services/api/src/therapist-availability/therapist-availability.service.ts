import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class TherapistAvailabilityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create or update therapist weekly availability
   */
  async createAvailability(
    businessId: string,
    userId: string,
    data: {
      therapistId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }
  ) {
    const { therapistId, dayOfWeek, startTime, endTime } = data;

    // Validate day of week
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new BadRequestException('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new BadRequestException('Time must be in HH:MM format (e.g., 09:00)');
    }

    // Validate start time is before end time
    if (startTime >= endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }

    // Check if availability already exists for this therapist and day
    const existing = await this.prisma.therapistAvailability.findFirst({
      where: {
        therapistId,
        dayOfWeek,
        businessId,
      },
    });

    let availability;
    if (existing) {
      // Update existing
      availability = await this.prisma.therapistAvailability.update({
        where: { id: existing.id },
        data: {
          startTime,
          endTime,
          isActive: true,
        },
      });
    } else {
      // Create new
      availability = await this.prisma.therapistAvailability.create({
        data: {
          businessId,
          therapistId,
          dayOfWeek,
          startTime,
          endTime,
          isActive: true,
        },
      });
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: existing ? 'AVAILABILITY_UPDATED' : 'AVAILABILITY_CREATED',
        entityType: 'TherapistAvailability',
        entityId: availability.id,
        metadata: { therapistId, dayOfWeek, startTime, endTime },
      },
    });

    return availability;
  }

  /**
   * Get all availability for a therapist or business
   */
  async findAll(filters?: {
    businessId?: string;
    therapistId?: string;
    dayOfWeek?: number;
    isActive?: boolean;
  }) {
    const where: any = {};

    if (filters?.businessId) where.businessId = filters.businessId;
    if (filters?.therapistId) where.therapistId = filters.therapistId;
    if (filters?.dayOfWeek !== undefined) where.dayOfWeek = filters.dayOfWeek;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return this.prisma.therapistAvailability.findMany({
      where,
      include: {
        therapist: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Get single availability by ID
   */
  async findById(id: string, businessId: string) {
    const availability = await this.prisma.therapistAvailability.findFirst({
      where: { id, businessId },
      include: {
        therapist: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    return availability;
  }

  /**
   * Update availability
   */
  async update(
    id: string,
    businessId: string,
    userId: string,
    data: {
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      isActive?: boolean;
    }
  ) {
    await this.findById(id, businessId);

    // Validate if provided
    if (data.dayOfWeek !== undefined && (data.dayOfWeek < 0 || data.dayOfWeek > 6)) {
      throw new BadRequestException('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
    }

    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (data.startTime && !timeRegex.test(data.startTime)) {
      throw new BadRequestException('startTime must be in HH:MM format');
    }
    if (data.endTime && !timeRegex.test(data.endTime)) {
      throw new BadRequestException('endTime must be in HH:MM format');
    }

    const updated = await this.prisma.therapistAvailability.update({
      where: { id },
      data,
      include: {
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
        action: 'AVAILABILITY_UPDATED',
        entityType: 'TherapistAvailability',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return updated;
  }

  /**
   * Delete availability
   */
  async delete(id: string, businessId: string, userId: string) {
    await this.findById(id, businessId);

    const deleted = await this.prisma.therapistAvailability.delete({
      where: { id },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'AVAILABILITY_DELETED',
        entityType: 'TherapistAvailability',
        entityId: id,
      },
    });

    return deleted;
  }

  /**
   * Create time off
   */
  async createTimeOff(
    businessId: string,
    userId: string,
    data: {
      therapistId: string;
      startDate: Date | string;
      endDate: Date | string;
      reason?: string;
      isAllDay?: boolean;
    }
  ) {
    const { therapistId, startDate, endDate, reason, isAllDay = true } = data;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (start >= end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const timeOff = await this.prisma.therapistTimeOff.create({
      data: {
        businessId,
        therapistId,
        startDate: start,
        endDate: end,
        reason,
        isAllDay,
      },
      include: {
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
        action: 'TIME_OFF_CREATED',
        entityType: 'TherapistTimeOff',
        entityId: timeOff.id,
        metadata: { therapistId, startDate: start, endDate: end },
      },
    });

    return timeOff;
  }

  /**
   * Get all time off records
   */
  async findAllTimeOff(filters?: {
    businessId?: string;
    therapistId?: string;
    startDate?: Date | string;
    endDate?: Date | string;
  }) {
    const where: any = {};

    if (filters?.businessId) where.businessId = filters.businessId;
    if (filters?.therapistId) where.therapistId = filters.therapistId;

    // Filter by date range
    if (filters?.startDate || filters?.endDate) {
      where.OR = [];
      if (filters.startDate) {
        where.OR.push({ endDate: { gte: new Date(filters.startDate) } });
      }
      if (filters.endDate) {
        where.OR.push({ startDate: { lte: new Date(filters.endDate) } });
      }
    }

    return this.prisma.therapistTimeOff.findMany({
      where,
      include: {
        therapist: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Delete time off
   */
  async deleteTimeOff(id: string, businessId: string, userId: string) {
    const timeOff = await this.prisma.therapistTimeOff.findFirst({
      where: { id, businessId },
    });

    if (!timeOff) {
      throw new NotFoundException(`Time off with ID ${id} not found`);
    }

    const deleted = await this.prisma.therapistTimeOff.delete({
      where: { id },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'TIME_OFF_DELETED',
        entityType: 'TherapistTimeOff',
        entityId: id,
      },
    });

    return deleted;
  }

  /**
   * Get available time slots for a therapist on a specific date
   */
  async getAvailableSlots(
    therapistId: string,
    date: Date | string,
    duration: number = 60
  ) {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Get therapist availability for this day
    const availability = await this.prisma.therapistAvailability.findFirst({
      where: {
        therapistId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!availability) {
      return [];
    }

    // Check for time off
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const timeOff = await this.prisma.therapistTimeOff.findFirst({
      where: {
        therapistId,
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
    });

    if (timeOff) {
      return []; // Therapist is off this day
    }

    // Get existing appointments for this day
    const appointments = await this.prisma.appointment.findMany({
      where: {
        therapistId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Generate time slots
    const slots: Array<{
      startTime: Date;
      endTime: Date;
      available: boolean;
    }> = [];

    const [startHour, startMinute] = availability.startTime.split(':').map(Number);
    const [endHour, endMinute] = availability.endTime.split(':').map(Number);

    let currentTime = new Date(targetDate);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(targetDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    while (currentTime < endTime) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);

      if (slotEnd > endTime) break;

      // Check if this slot conflicts with any appointment
      const hasConflict = appointments.some((apt) => {
        return (
          (slotStart >= apt.startTime && slotStart < apt.endTime) ||
          (slotEnd > apt.startTime && slotEnd <= apt.endTime) ||
          (slotStart <= apt.startTime && slotEnd >= apt.endTime)
        );
      });

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        available: !hasConflict,
      });

      // Move to next slot (30-minute increments)
      currentTime = new Date(currentTime.getTime() + 30 * 60000);
    }

    return slots;
  }
}
