import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemService } from './system.service';

@ApiTags('admin-system')
@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SystemController {
  constructor(private systemService: SystemService) { }

  @Get('health')
  @ApiOperation({ summary: 'Get system health' })
  getHealth() {
    return this.systemService.getHealth();
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get background queue status' })
  getQueueStatus() {
    return this.systemService.getQueueStatus();
  }
}
