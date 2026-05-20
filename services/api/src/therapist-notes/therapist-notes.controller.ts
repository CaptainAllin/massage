import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TherapistNotesService } from './therapist-notes.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { UserRole } from '@massage/types';

@ApiTags('therapist-notes')
@ApiBearerAuth()
@Controller('therapist-notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUSINESS_OWNER, UserRole.THERAPIST)
export class TherapistNotesController {
  constructor(private notesService: TherapistNotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a private therapist note' })
  async create(
    @CurrentUser('id') userId: string,
    @CurrentUser('therapistId') therapistId: string,
    @Body() createData: {
      businessId: string;
      clientId: string;
      content: string;
      isPinned?: boolean;
    },
  ) {
    const { businessId, ...data } = createData;
    const note = await this.notesService.create(businessId, userId, therapistId, data);

    return {
      success: true,
      data: note,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List therapist notes (filtered by RBAC)' })
  async findAll(
    @Query('businessId') businessId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentUser('therapistId') therapistId: string | null,
    @Query('clientId') clientId?: string,
    @Query('isPinned') isPinned?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.notesService.findAll(
      businessId,
      userRole,
      therapistId,
      {
        clientId,
        isPinned: isPinned !== undefined ? isPinned === true : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }
    );

    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get therapist note by ID' })
  async findOne(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentUser('therapistId') therapistId: string | null,
  ) {
    const note = await this.notesService.findById(id, businessId, userRole, therapistId);

    return {
      success: true,
      data: note,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update therapist note' })
  async update(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentUser('therapistId') therapistId: string | null,
    @Body() updateData: {
      content?: string;
      isPinned?: boolean;
    },
  ) {
    const note = await this.notesService.update(
      id,
      businessId,
      userId,
      userRole,
      therapistId,
      updateData
    );

    return {
      success: true,
      data: note,
    };
  }

  @Patch(':id/toggle-pin')
  @ApiOperation({ summary: 'Toggle pin status of therapist note' })
  async togglePin(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentUser('therapistId') therapistId: string | null,
  ) {
    const note = await this.notesService.togglePin(id, businessId, userId, userRole, therapistId);

    return {
      success: true,
      data: note,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete therapist note' })
  async delete(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentUser('therapistId') therapistId: string | null,
  ) {
    const note = await this.notesService.delete(id, businessId, userId, userRole, therapistId);

    return {
      success: true,
      data: note,
    };
  }
}
