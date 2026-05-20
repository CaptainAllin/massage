import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AppointmentStatus } from '@massage/types';
import { addDays, addWeeks, addMonths, isBefore, isAfter, setHours, setMinutes, startOfDay } from 'date-fns';

@Injectable()
export class RecurringAppointmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a recurring appointment series
   */
  async createSeries(businessId: string, userId: string, data: any) {
    const {
      clientId,
      therapistId,
      frequency,
      interval = 1,
      dayOfWeek,
      dayOfMonth,
      startTime,
      duration,
      startDate,
      endDate,
      occurrences,
      ...rest
    } = data;

    // Validate required fields
    if (!clientId || !therapistId || !frequency || !startTime || !duration || !startDate) {
      throw new BadRequestException(
        'Missing required fields: clientId, therapistId, frequency, startTime, duration, startDate'
      );
    }

    // Validate either endDate or occurrences is provided
    if (!endDate && !occurrences) {
      throw new BadRequestException(
        'Either endDate or occurrences must be provided'
      );
    }

    // Create the series
    const series = await this.prisma.recurringAppointmentSeries.create({
      data: {
        businessId,
        clientId,
        therapistId,
        frequency,
        interval,
        dayOfWeek,
        dayOfMonth,
        startTime,
        duration,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        occurrences,
        isActive: true,
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

    // Generate initial appointments
    await this.generateAppointments(series.id, businessId);

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'RECURRING_SERIES_CREATED',
        entityType: 'RecurringAppointmentSeries',
        entityId: series.id,
        metadata: { frequency, startDate, endDate, occurrences },
      },
    });

    return series;
  }

  /**
   * Get all recurring series
   */
  async findAll(filters?: any) {
    const {
      businessId,
      clientId,
      therapistId,
      isActive,
      frequency,
      page = 1,
      limit = 50,
    } = filters || {};

    const where: any = {};
    if (businessId) where.businessId = businessId;
    if (clientId) where.clientId = clientId;
    if (therapistId) where.therapistId = therapistId;
    if (isActive !== undefined) where.isActive = isActive;
    if (frequency) where.frequency = frequency;

    const total = await this.prisma.recurringAppointmentSeries.count({ where });

    const series = await this.prisma.recurringAppointmentSeries.findMany({
      where,
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
        appointments: {
          orderBy: { startTime: 'asc' },
          take: 5, // Include first 5 appointments
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: series,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single series by ID
   */
  async findById(id: string, businessId: string) {
    const series = await this.prisma.recurringAppointmentSeries.findFirst({
      where: { id, businessId },
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
        appointments: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!series) {
      throw new NotFoundException(`Recurring series with ID ${id} not found`);
    }

    return series;
  }

  /**
   * Update recurring series
   */
  async update(
    id: string,
    businessId: string,
    userId: string,
    data: any
  ) {
    await this.findById(id, businessId);

    const updated = await this.prisma.recurringAppointmentSeries.update({
      where: { id },
      data,
      include: {
        client: true,
        therapist: {
          include: {
            user: true,
          },
        },
      },
    });

    // If series was modified significantly, regenerate future appointments
    if (data.endDate || data.occurrences || data.startTime || data.duration) {
      await this.regenerateFutureAppointments(id, businessId);
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'RECURRING_SERIES_UPDATED',
        entityType: 'RecurringAppointmentSeries',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return updated;
  }

  /**
   * Delete/deactivate recurring series
   */
  async delete(id: string, businessId: string, userId: string) {
    await this.findById(id, businessId);

    // Deactivate instead of delete
    const series = await this.prisma.recurringAppointmentSeries.update({
      where: { id },
      data: { isActive: false },
    });

    // Cancel all future appointments
    await this.prisma.appointment.updateMany({
      where: {
        recurringSeriesId: id,
        startTime: { gte: new Date() },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      data: { status: AppointmentStatus.CANCELLED },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action: 'RECURRING_SERIES_DELETED',
        entityType: 'RecurringAppointmentSeries',
        entityId: id,
      },
    });

    return series;
  }

  /**
   * Generate appointments from a recurring series
   */
  async generateAppointments(seriesId: string, businessId: string) {
    const series = await this.prisma.recurringAppointmentSeries.findUnique({
      where: { id: seriesId },
    });

    if (!series || !series.isActive) {
      return;
    }

    const appointments = this.calculateOccurrences(series);

    // Create appointments
    for (const aptData of appointments) {
      // Check if appointment already exists
      const existing = await this.prisma.appointment.findFirst({
        where: {
          recurringSeriesId: seriesId,
          startTime: aptData.startTime,
        },
      });

      if (!existing) {
        await this.prisma.appointment.create({
          data: {
            businessId,
            clientId: series.clientId,
            therapistId: series.therapistId,
            recurringSeriesId: seriesId,
            startTime: aptData.startTime,
            endTime: aptData.endTime,
            duration: series.duration,
            serviceType: series.serviceType,
            price: series.price,
            notes: series.notes,
            status: AppointmentStatus.SCHEDULED,
          },
        });
      }
    }
  }

  /**
   * Regenerate future appointments after series update
   */
  async regenerateFutureAppointments(seriesId: string, businessId: string) {
    // Delete future SCHEDULED appointments
    await this.prisma.appointment.deleteMany({
      where: {
        recurringSeriesId: seriesId,
        startTime: { gte: new Date() },
        status: AppointmentStatus.SCHEDULED,
      },
    });

    // Generate new appointments
    await this.generateAppointments(seriesId, businessId);
  }

  /**
   * Calculate all occurrences for a recurring series
   */
  private calculateOccurrences(series: any): Array<{ startTime: Date; endTime: Date }> {
    const occurrences: Array<{ startTime: Date; endTime: Date }> = [];
    let currentDate = startOfDay(new Date(series.startDate));
    const endDate = series.endDate ? new Date(series.endDate) : null;
    const maxOccurrences = series.occurrences || 52; // Default to 1 year of weekly appointments

    // Parse start time
    const [hours, minutes] = series.startTime.split(':').map(Number);

    let count = 0;
    const maxIterations = 365; // Safety limit
    let iterations = 0;

    while (count < maxOccurrences && iterations < maxIterations) {
      iterations++;

      // Set the time for this occurrence
      let occurrenceDate = setMinutes(setHours(currentDate, hours), minutes);

      // Check if we've passed the end date
      if (endDate && isAfter(occurrenceDate, endDate)) {
        break;
      }

      // Only include if in the future
      if (isAfter(occurrenceDate, new Date())) {
        // For WEEKLY, check if it matches the dayOfWeek
        if (series.frequency === 'WEEKLY' || series.frequency === 'BIWEEKLY') {
          if (currentDate.getDay() === series.dayOfWeek) {
            const startTime = occurrenceDate;
            const endTime = new Date(startTime.getTime() + series.duration * 60000);
            occurrences.push({ startTime, endTime });
            count++;
          }
        }
        // For MONTHLY, check if it matches dayOfMonth
        else if (series.frequency === 'MONTHLY') {
          if (currentDate.getDate() === series.dayOfMonth) {
            const startTime = occurrenceDate;
            const endTime = new Date(startTime.getTime() + series.duration * 60000);
            occurrences.push({ startTime, endTime });
            count++;
          }
        }
        // For DAILY, add every occurrence
        else if (series.frequency === 'DAILY') {
          const startTime = occurrenceDate;
          const endTime = new Date(startTime.getTime() + series.duration * 60000);
          occurrences.push({ startTime, endTime });
          count++;
        }
      }

      // Move to next date based on frequency
      if (series.frequency === 'DAILY') {
        currentDate = addDays(currentDate, series.interval);
      } else if (series.frequency === 'WEEKLY') {
        currentDate = addWeeks(currentDate, series.interval);
      } else if (series.frequency === 'BIWEEKLY') {
        currentDate = addWeeks(currentDate, 2 * series.interval);
      } else if (series.frequency === 'MONTHLY') {
        currentDate = addMonths(currentDate, series.interval);
      }
    }

    return occurrences;
  }
}
