import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IntakeFormTemplatesService } from './intake-form-templates.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole } from '@massage/types';

@ApiTags('intake-form-templates')
@ApiBearerAuth()
@Controller('intake-form-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntakeFormTemplatesController {
  constructor(private templatesService: IntakeFormTemplatesService) {}

  @Post()
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Create intake form template' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createData: {
      businessId: string;
      name: string;
      description?: string;
      fields: any[];
      isDefault?: boolean;
    },
  ) {
    const { businessId, ...data } = createData;
    const template = await this.templatesService.create(businessId, userId, data);

    return {
      success: true,
      data: template,
    };
  }

  @Get()
  @Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST, UserRole.THERAPIST)
  @ApiOperation({ summary: 'List all intake form templates' })
  async findAll(
    @Query('businessId') businessId: string,
    @Query('isActive') isActive?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.templatesService.findAll(businessId, {
      isActive: isActive !== undefined ? isActive === true : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get intake form template by ID' })
  async findOne(@Param('id') id: string, @Query('businessId') businessId: string) {
    const template = await this.templatesService.findById(id, businessId);

    return {
      success: true,
      data: template,
    };
  }

  @Patch(':id')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Update intake form template' })
  async update(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body() updateData: {
      name?: string;
      description?: string;
      fields?: any[];
      isActive?: boolean;
      isDefault?: boolean;
    },
  ) {
    const template = await this.templatesService.update(id, businessId, userId, updateData);

    return {
      success: true,
      data: template,
    };
  }

  @Delete(':id')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Delete intake form template' })
  async delete(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
  ) {
    const template = await this.templatesService.delete(id, businessId, userId);

    return {
      success: true,
      data: template,
    };
  }
}
