import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole } from '@massage/types';

@ApiTags('businesses')
@ApiBearerAuth()
@Controller('businesses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  @Post()
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new business' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createData: {
      name: string;
      email?: string;
      phoneNumber?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    },
  ) {
    const business = await this.businessesService.create(userId, createData);

    return {
      success: true,
      data: business,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all businesses' })
  async findAll(@CurrentUser('id') userId: string, @CurrentUser('role') userRole: UserRole) {
    const businesses = await this.businessesService.findAll(userId, userRole);

    return {
      success: true,
      data: businesses,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    const business = await this.businessesService.findById(id, userId, userRole);

    return {
      success: true,
      data: business,
    };
  }

  @Patch(':id')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update business' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() updateData: Partial<{
      name: string;
      email: string;
      phoneNumber: string;
      address: string;
      city: string;
      state: string;
      postalCode: string;
      website: string;
      logo: string;
      primaryColor: string;
      secondaryColor: string;
    }>,
  ) {
    const business = await this.businessesService.update(id, userId, userRole, updateData);

    return {
      success: true,
      data: business,
    };
  }
}
