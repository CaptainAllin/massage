import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getCurrentUser(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findById(userId);

    return {
      success: true,
      data: user,
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateData: { firstName?: string; lastName?: string; phoneNumber?: string },
  ) {
    const user = await this.usersService.updateProfile(userId, updateData);

    return {
      success: true,
      data: user,
    };
  }
}
