import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BodyMapsService } from './body-maps.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole } from '@massage/types';

@ApiTags('body-maps')
@ApiBearerAuth()
@Controller('body-maps')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUSINESS_OWNER, UserRole.THERAPIST)
export class BodyMapsController {
  constructor(private bodyMapsService: BodyMapsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a body map' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createData: {
      businessId: string;
      clientId: string;
      appointmentId?: string;
      treatmentNoteId?: string;
      view: string;
      regions: any[];
      notes?: string;
    },
  ) {
    const { businessId, ...data } = createData;
    const bodyMap = await this.bodyMapsService.create(businessId, userId, data);

    return {
      success: true,
      data: bodyMap,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all body maps' })
  async findAll(
    @Query('businessId') businessId: string,
    @Query('clientId') clientId?: string,
    @Query('appointmentId') appointmentId?: string,
    @Query('treatmentNoteId') treatmentNoteId?: string,
    @Query('view') view?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.bodyMapsService.findAll(businessId, {
      clientId,
      appointmentId,
      treatmentNoteId,
      view,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get body map by ID' })
  async findOne(@Param('id') id: string, @Query('businessId') businessId: string) {
    const bodyMap = await this.bodyMapsService.findById(id, businessId);

    return {
      success: true,
      data: bodyMap,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update body map' })
  async update(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body() updateData: {
      view?: string;
      regions?: any[];
      notes?: string;
    },
  ) {
    const bodyMap = await this.bodyMapsService.update(id, businessId, userId, updateData);

    return {
      success: true,
      data: bodyMap,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete body map' })
  async delete(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
  ) {
    const bodyMap = await this.bodyMapsService.delete(id, businessId, userId);

    return {
      success: true,
      data: bodyMap,
    };
  }
}
