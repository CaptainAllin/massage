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
import { TherapistAvailabilityService } from './therapist-availability.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole } from '@massage/types';

@ApiTags('therapist-availability')
@ApiBearerAuth()
@Controller('therapist-availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TherapistAvailabilityController {
  constructor(
    private therapistAvailabilityService: TherapistAvailabilityService
  ) {}

  // ===== WEEKLY AVAILABILITY =====

  @Post()
  @Roles(UserRole.BUSINESS_OWNER, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Create or update therapist weekly availability' })
  async create(
    @CurrentUser('id') userId: string,
    @Body()
    createData: {
      businessId: string;
      therapistId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }
  ) {
    const { businessId, ...data } = createData;
    const availability =
      await this.therapistAvailabilityService.createAvailability(
        businessId,
        userId,
        data
      );

    return {
      success: true,
      data: availability,
      message: 'Availability set successfully',
    };
  }

  @Get()
  @Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST, UserRole.THERAPIST)
  @ApiOperation({ summary: 'List therapist availability' })
  async findAll(
    @Query('businessId') businessId?: string,
    @Query('therapistId') therapistId?: string,
    @Query('dayOfWeek') dayOfWeek?: string,
    @Query('isActive') isActive?: string
  ) {
    const availability = await this.therapistAvailabilityService.findAll({
      businessId,
      therapistId,
      dayOfWeek: dayOfWeek ? parseInt(dayOfWeek, 10) : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });

    return {
      success: true,
      data: availability,
    };
  }

  @Get(':id')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get availability by ID' })
  async findOne(
    @Param('id') id: string,
    @Query('businessId') businessId: string
  ) {
    const availability = await this.therapistAvailabilityService.findById(
      id,
      businessId
    );

    return {
      success: true,
      data: availability,
    };
  }

  @Patch(':id')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Update availability' })
  async update(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body()
    updateData: {
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      isActive?: boolean;
    }
  ) {
    const availability = await this.therapistAvailabilityService.update(
      id,
      businessId,
      userId,
      updateData
    );

    return {
      success: true,
      data: availability,
      message: 'Availability updated successfully',
    };
  }

  @Delete(':id')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Delete availability' })
  async delete(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string
  ) {
    const availability = await this.therapistAvailabilityService.delete(
      id,
      businessId,
      userId
    );

    return {
      success: true,
      data: availability,
      message: 'Availability deleted successfully',
    };
  }

  // ===== TIME OFF =====

  @Post('time-off')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Create time off period' })
  async createTimeOff(
    @CurrentUser('id') userId: string,
    @Body()
    createData: {
      businessId: string;
      therapistId: string;
      startDate: Date | string;
      endDate: Date | string;
      reason?: string;
      isAllDay?: boolean;
    }
  ) {
    const { businessId, ...data } = createData;
    const timeOff = await this.therapistAvailabilityService.createTimeOff(
      businessId,
      userId,
      data
    );

    return {
      success: true,
      data: timeOff,
      message: 'Time off created successfully',
    };
  }

  @Get('time-off')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST, UserRole.THERAPIST)
  @ApiOperation({ summary: 'List time off periods' })
  async findAllTimeOff(
    @Query('businessId') businessId?: string,
    @Query('therapistId') therapistId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const timeOff = await this.therapistAvailabilityService.findAllTimeOff({
      businessId,
      therapistId,
      startDate,
      endDate,
    });

    return {
      success: true,
      data: timeOff,
    };
  }

  @Delete('time-off/:id')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Delete time off period' })
  async deleteTimeOff(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string
  ) {
    const timeOff = await this.therapistAvailabilityService.deleteTimeOff(
      id,
      businessId,
      userId
    );

    return {
      success: true,
      data: timeOff,
      message: 'Time off deleted successfully',
    };
  }

  // ===== AVAILABLE SLOTS =====

  @Get('slots')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get available time slots for a therapist on a specific date' })
  async getAvailableSlots(
    @Query('therapistId') therapistId: string,
    @Query('date') date: string,
    @Query('duration') duration?: string
  ) {
    const slots = await this.therapistAvailabilityService.getAvailableSlots(
      therapistId,
      date,
      duration ? parseInt(duration, 10) : 60
    );

    return {
      success: true,
      data: slots,
    };
  }
}
