import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TherapistsService } from './therapists.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole } from '@massage/types';

@ApiTags('therapists')
@ApiBearerAuth()
@Controller('therapists')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
export class TherapistsController {
  constructor(private therapistsService: TherapistsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new therapist' })
  async create(
    @CurrentUser('id') userId: string,
    @Body()
    createData: {
      businessId: string;
      userId: string;
      specializations?: string[];
      bio?: string;
      licenseNumber?: string;
      licenseExpiry?: Date;
      hourlyRate?: number;
    },
  ) {
    const { businessId, ...data } = createData;
    const therapist = await this.therapistsService.create(businessId, userId, data);

    return {
      success: true,
      data: therapist,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all therapists' })
  async findAll(@Query('businessId') businessId: string) {
    const therapists = await this.therapistsService.findAll(businessId);

    return {
      success: true,
      data: therapists,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get therapist by ID' })
  async findOne(@Param('id') id: string, @Query('businessId') businessId: string) {
    const therapist = await this.therapistsService.findById(id, businessId);

    return {
      success: true,
      data: therapist,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update therapist' })
  async update(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body() updateData: any,
  ) {
    const therapist = await this.therapistsService.update(id, businessId, userId, updateData);

    return {
      success: true,
      data: therapist,
    };
  }
}
