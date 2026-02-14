import { Controller, Put, Body, UseGuards, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('worker')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.WORKER)
export class WorkerProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Put('bank')
  async updateBankDetails(
    @GetUser() user: any,
    @Body() body: any, // Should be DTO
  ) {
    return this.usersService.updateBankDetails(user.id, body);
  }

  @Put('profile')
  async updateProfile(@GetUser() user: any, @Body() body: any) {
    return this.usersService.updateProfile(user.id, body);
  }
}
