import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalConditionsService } from './medical-conditions.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole } from '@massage/types';

@ApiTags('medical-conditions')
@ApiBearerAuth()
@Controller('medical-conditions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUSINESS_OWNER, UserRole.THERAPIST)
export class MedicalConditionsController {
  constructor(private conditionsService: MedicalConditionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a medical condition' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createData: {
      businessId: string;
      clientId: string;
      name: string;
      diagnosisDate?: string;
      status?: string;
      severity?: string;
      notes?: string;
      treatmentPlan?: string;
    },
  ) {
    const { businessId, diagnosisDate, ...data } = createData;
    const condition = await this.conditionsService.create(businessId, userId, {
      ...data,
      diagnosisDate: diagnosisDate ? new Date(diagnosisDate) : undefined,
    });

    return {
      success: true,
      data: condition,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all medical conditions' })
  async findAll(
    @Query('businessId') businessId: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.conditionsService.findAll(businessId, {
      clientId,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get medical condition by ID' })
  async findOne(@Param('id') id: string, @Query('businessId') businessId: string) {
    const condition = await this.conditionsService.findById(id, businessId);

    return {
      success: true,
      data: condition,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update medical condition' })
  async update(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body() updateData: {
      name?: string;
      diagnosisDate?: string;
      status?: string;
      severity?: string;
      notes?: string;
      treatmentPlan?: string;
      resolvedAt?: string;
    },
  ) {
    const { diagnosisDate, resolvedAt, ...data } = updateData;
    const condition = await this.conditionsService.update(id, businessId, userId, {
      ...data,
      diagnosisDate: diagnosisDate ? new Date(diagnosisDate) : undefined,
      resolvedAt: resolvedAt ? new Date(resolvedAt) : undefined,
    });

    return {
      success: true,
      data: condition,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete medical condition' })
  async delete(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
  ) {
    const condition = await this.conditionsService.delete(id, businessId, userId);

    return {
      success: true,
      data: condition,
    };
  }
}
