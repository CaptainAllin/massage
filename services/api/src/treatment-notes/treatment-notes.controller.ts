import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TreatmentNotesService } from './treatment-notes.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole } from '@massage/types';

@ApiTags('treatment-notes')
@ApiBearerAuth()
@Controller('treatment-notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUSINESS_OWNER, UserRole.THERAPIST)
export class TreatmentNotesController {
  constructor(private notesService: TreatmentNotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a treatment note (SOAP note)' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createData: {
      businessId: string;
      appointmentId: string;
      clientId: string;
      therapistId: string;
      subjectiveFindings?: string;
      objectiveFindings?: string;
      assessment?: string;
      plan?: string;
      areasWorked?: string[];
      techniques?: string[];
      sessionDuration?: number;
      followUpDate?: string;
    },
  ) {
    const { businessId, followUpDate, ...data } = createData;
    const note = await this.notesService.create(businessId, userId, {
      ...data,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
    });

    return {
      success: true,
      data: note,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all treatment notes' })
  async findAll(
    @Query('businessId') businessId: string,
    @Query('clientId') clientId?: string,
    @Query('therapistId') therapistId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.notesService.findAll(businessId, {
      clientId,
      therapistId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get treatment note by ID' })
  async findOne(@Param('id') id: string, @Query('businessId') businessId: string) {
    const note = await this.notesService.findById(id, businessId);

    return {
      success: true,
      data: note,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update treatment note' })
  async update(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body() updateData: {
      subjectiveFindings?: string;
      objectiveFindings?: string;
      assessment?: string;
      plan?: string;
      areasWorked?: string[];
      techniques?: string[];
      sessionDuration?: number;
      followUpDate?: string;
    },
  ) {
    const { followUpDate, ...data } = updateData;
    const note = await this.notesService.update(id, businessId, userId, {
      ...data,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
    });

    return {
      success: true,
      data: note,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete treatment note' })
  async delete(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
  ) {
    const note = await this.notesService.delete(id, businessId, userId);

    return {
      success: true,
      data: note,
    };
  }
}
