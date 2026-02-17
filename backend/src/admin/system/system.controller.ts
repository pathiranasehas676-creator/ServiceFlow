import { Controller, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemService } from './system.service';

@ApiTags('admin-system')
@ApiBearerAuth()
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

  @Get('config')
  @ApiOperation({ summary: 'Get system configuration' })
  async getConfigs() {
    return this.systemService.getConfigs();
  }

  @Put('config')
  @ApiOperation({ summary: 'Update system configuration' })
  async updateConfigs(@Body() body: Record<string, any>, @Req() req: any) {
    return this.systemService.bulkUpdateConfigs(body, req.user.id);
  }
}
