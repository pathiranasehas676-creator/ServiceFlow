import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SecurityAlertsService } from './security-alerts.service';

@ApiTags('admin-security')
@Controller('admin/security-alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class SecurityAlertsController {
  constructor(private alertsService: SecurityAlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get security alerts' })
  getAlerts(@Query('page') page?: number) {
    return this.alertsService.getAlerts(page ? Number(page) : 1);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Mark an alert as resolved' })
  resolveAlert(@Param('id') id: string, @Req() req: any) {
    return this.alertsService.resolveAlert(id, req.user.id);
  }
}
