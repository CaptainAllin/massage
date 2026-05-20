import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IntakeFormsService } from './intake-forms.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole } from '@massage/types';

@ApiTags('intake-forms')
@ApiBearerAuth()
@Controller('intake-forms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntakeFormsController {
  constructor(private intakeFormsService: IntakeFormsService) {}

  @Post()
  @Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST, UserRole.THERAPIST, UserRole.CLIENT)
  @ApiOperation({ summary: 'Submit an intake form' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createData: {
      businessId: string;
      clientId: string;
      templateId?: string;
      formData: any;
    },
  ) {
    const { businessId, ...data } = createData;
    const intakeForm = await this.intakeFormsService.create(businessId, userId, data);

    return {
      success: true,
      data: intakeForm,
    };
  }

  @Get()
  @Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST, UserRole.THERAPIST)
  @ApiOperation({ summary: 'List all intake form submissions' })
  async findAll(
    @Query('businessId') businessId: string,
    @Query('clientId') clientId?: string,
    @Query('templateId') templateId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.intakeFormsService.findAll(businessId, {
      clientId,
      templateId,
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
  @Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST, UserRole.THERAPIST, UserRole.CLIENT)
  @ApiOperation({ summary: 'Get intake form by ID' })
  async findOne(@Param('id') id: string, @Query('businessId') businessId: string) {
    const intakeForm = await this.intakeFormsService.findById(id, businessId);

    return {
      success: true,
      data: intakeForm,
    };
  }

  @Patch(':id')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Update intake form' })
  async update(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body() updateData: { formData: any },
  ) {
    const intakeForm = await this.intakeFormsService.update(id, businessId, userId, updateData);

    return {
      success: true,
      data: intakeForm,
    };
  }

  @Delete(':id')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Delete intake form' })
  async delete(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
  ) {
    const intakeForm = await this.intakeFormsService.delete(id, businessId, userId);

    return {
      success: true,
      data: intakeForm,
    };
  }
}
