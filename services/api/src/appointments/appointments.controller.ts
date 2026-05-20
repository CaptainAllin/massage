import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole, AppointmentStatus } from '@massage/types';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST, UserRole.THERAPIST)
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new appointment with conflict detection' })
  async create(
    @CurrentUser('id') userId: string,
    @Body()
    createData: {
      businessId: string;
      clientId: string;
      therapistId: string;
      startTime: Date | string;
      duration: number;
      serviceType?: string;
      price?: number;
      notes?: string;
    }
  ) {
    const { businessId, ...data } = createData;
    const appointment = await this.appointmentsService.create(
      businessId,
      userId,
      data
    );

    return {
      success: true,
      data: appointment,
      message: 'Appointment created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List appointments with filters and pagination' })
  async findAll(
    @Query('businessId') businessId: string,
    @Query('status') status?: AppointmentStatus | string,
    @Query('therapistId') therapistId?: string,
    @Query('clientId') clientId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ) {
    const filters = {
      status: status ? status.split(',') : undefined,
      therapistId,
      clientId,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      sortBy,
      sortOrder,
    };

    const result = await this.appointmentsService.findAll(businessId, filters);

    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  async findOne(
    @Param('id') id: string,
    @Query('businessId') businessId: string
  ) {
    const appointment = await this.appointmentsService.findById(id, businessId);

    return {
      success: true,
      data: appointment,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment with conflict recheck' })
  async update(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body()
    updateData: {
      clientId?: string;
      therapistId?: string;
      startTime?: Date | string;
      duration?: number;
      serviceType?: string;
      price?: number;
      notes?: string;
    }
  ) {
    const appointment = await this.appointmentsService.update(
      id,
      businessId,
      userId,
      updateData
    );

    return {
      success: true,
      data: appointment,
      message: 'Appointment updated successfully',
    };
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm appointment (SCHEDULED -> CONFIRMED)' })
  async confirm(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string
  ) {
    const appointment = await this.appointmentsService.confirmAppointment(
      id,
      businessId,
      userId
    );

    return {
      success: true,
      data: appointment,
      message: 'Appointment confirmed',
    };
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start appointment (CONFIRMED -> IN_PROGRESS)' })
  async start(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string
  ) {
    const appointment = await this.appointmentsService.startAppointment(
      id,
      businessId,
      userId
    );

    return {
      success: true,
      data: appointment,
      message: 'Appointment started',
    };
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete appointment (IN_PROGRESS -> COMPLETED)' })
  async complete(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string
  ) {
    const appointment = await this.appointmentsService.completeAppointment(
      id,
      businessId,
      userId
    );

    return {
      success: true,
      data: appointment,
      message: 'Appointment completed',
    };
  }

  @Patch(':id/no-show')
  @ApiOperation({ summary: 'Mark appointment as no-show' })
  async noShow(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string
  ) {
    const appointment = await this.appointmentsService.markNoShow(
      id,
      businessId,
      userId
    );

    return {
      success: true,
      data: appointment,
      message: 'Appointment marked as no-show',
    };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel appointment with reason tracking' })
  async cancel(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body()
    cancellationData: {
      reason?: string;
      cancellationType: 'client' | 'therapist' | 'business';
    }
  ) {
    const appointment = await this.appointmentsService.cancelAppointment(
      id,
      businessId,
      userId,
      cancellationData
    );

    return {
      success: true,
      data: appointment,
      message: 'Appointment cancelled',
    };
  }

  @Get('availability/check')
  @ApiOperation({ summary: 'Check therapist availability for a time slot' })
  async checkAvailability(
    @Query('therapistId') therapistId: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('excludeAppointmentId') excludeAppointmentId?: string
  ) {
    const result = await this.appointmentsService.checkAvailability(
      therapistId,
      new Date(startTime),
      new Date(endTime),
      excludeAppointmentId
    );

    return {
      success: true,
      data: result,
    };
  }
}
