import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole } from '@massage/types';

@ApiTags('reminders')
@ApiBearerAuth()
@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST)
export class RemindersController {
  constructor(private remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a reminder for an appointment' })
  async scheduleReminder(
    @CurrentUser('id') userId: string,
    @Body()
    data: {
      appointmentId: string;
      businessId: string;
      reminderType: string;
      hoursBeforeAppointment: number;
    }
  ) {
    const { appointmentId, businessId, ...reminderData } = data;
    const reminder = await this.remindersService.scheduleReminder(
      appointmentId,
      businessId,
      userId,
      reminderData
    );

    return {
      success: true,
      data: reminder,
      message: 'Reminder scheduled successfully',
    };
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get reminders for an appointment' })
  async getAppointmentReminders(
    @Param('appointmentId') appointmentId: string,
    @Query('businessId') businessId: string
  ) {
    const reminders = await this.remindersService.findByAppointment(
      appointmentId,
      businessId
    );

    return {
      success: true,
      data: reminders,
    };
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get all pending reminders' })
  async getPendingReminders(@Query('businessId') businessId?: string) {
    const reminders = await this.remindersService.findPending(businessId);

    return {
      success: true,
      data: reminders,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a reminder' })
  async cancelReminder(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string
  ) {
    const reminder = await this.remindersService.cancelReminder(
      id,
      businessId,
      userId
    );

    return {
      success: true,
      data: reminder,
      message: 'Reminder cancelled successfully',
    };
  }
}
