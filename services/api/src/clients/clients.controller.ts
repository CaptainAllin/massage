import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole } from '@massage/types';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUSINESS_OWNER, UserRole.RECEPTIONIST, UserRole.THERAPIST)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createData: {
      businessId: string;
      firstName: string;
      lastName: string;
      email?: string;
      phoneNumber?: string;
      dateOfBirth?: Date;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    },
  ) {
    const { businessId, ...data } = createData;
    const client = await this.clientsService.create(businessId, userId, data);

    return {
      success: true,
      data: client,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all clients' })
  async findAll(@Query('businessId') businessId: string, @Query('isActive') isActive?: boolean) {
    const clients = await this.clientsService.findAll(businessId, { isActive });

    return {
      success: true,
      data: clients,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  async findOne(@Param('id') id: string, @Query('businessId') businessId: string) {
    const client = await this.clientsService.findById(id, businessId);

    return {
      success: true,
      data: client,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client' })
  async update(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @Body() updateData: any,
  ) {
    const client = await this.clientsService.update(id, businessId, userId, updateData);

    return {
      success: true,
      data: client,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete client' })
  async delete(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
  ) {
    const client = await this.clientsService.delete(id, businessId, userId);

    return {
      success: true,
      data: client,
    };
  }
}
