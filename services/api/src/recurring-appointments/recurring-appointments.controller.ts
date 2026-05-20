import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecurringAppointmentsService } from './recurring-appointments.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole } from '@massage/types';

@ApiTags('recurring-appointments')
@ApiBearerAuth()
@Controller('recurring-appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST, UserRole.THERAPIST)
export class RecurringAppointmentsController {
  constructor(
    private recurringAppointmentsService: RecurringAppointmentsService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create recurring appointment series' })
  async create(
    @CurrentUser('id') userId: string,
    @Body()
    createData: {
      businessId: string;
      clientId: string;
      therapistId: string;
      frequency: string;
      interval?: number;
      dayOfWeek?: number;
      dayOfMonth?: number;
      startTime: string;
      duration: number;
      startDate: Date | string;
      endDate?: Date | string;
      occurrences?: number;
      serviceType?: string;
      price?: number;
      notes?: string;
    }
  ) {
    const { businessId, ...data } = createData;
    const series = await this.recurringAppointmentsService.createSeries(
      businessId,
      userId,
      data
    );

    return {
      success: true,
      data: series,
      message: 'Recurring series created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List recurring appointment series' })
  async findAll(
    @Query('businessId') businessId?: string,
    @Query('clientId') clientId?: string,
    @Query('therapistId') therapistId?: string,
    @Query('isActive') isActive?: string,
    @Query('frequency') frequency?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const filters = {
      businessId,
      clientId,
      therapistId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      frequency,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    };

    const result = await this.recurringAppointmentsService.findAll(filters);

    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recurring series by ID' })
  async findOne(
    @Param('id') id: string,
    @Query('businessId') businessId: string
  ) {
    const series = await this.recurringAppointmentsService.findById(
      id,
      businessId
    );

    return {
      success: true,
      data: series,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update recurring series' })
  async update(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body()
    updateData: {
      frequency?: string;
      interval?: number;
      dayOfWeek?: number;
      dayOfMonth?: number;
      startTime?: string;
      duration?: number;
      endDate?: Date | string;
      occurrences?: number;
      serviceType?: string;
      price?: number;
      notes?: string;
      isActive?: boolean;
    }
  ) {
    const series = await this.recurringAppointmentsService.update(
      id,
      businessId,
      userId,
      updateData
    );

    return {
      success: true,
      data: series,
      message: 'Recurring series updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete/deactivate recurring series' })
  async delete(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string
  ) {
    const series = await this.recurringAppointmentsService.delete(
      id,
      businessId,
      userId
    );

    return {
      success: true,
      data: series,
      message: 'Recurring series cancelled successfully',
    };
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'Manually generate appointments from series' })
  async generate(
    @Param('id') id: string,
    @Query('businessId') businessId: string
  ) {
    await this.recurringAppointmentsService.generateAppointments(
      id,
      businessId
    );

    return {
      success: true,
      message: 'Appointments generated successfully',
    };
  }
}
