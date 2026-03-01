import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SoftDeleteService } from './soft-delete.service';
import { SoftDeleteDto } from './dto/soft-delete.dto';

@ApiTags('admin-data-integrity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class SoftDeleteController {
  constructor(private readonly service: SoftDeleteService) {}

  @Post(':entity/:id/soft-delete')
  @ApiOperation({ summary: 'Soft delete an entity' })
  async softDelete(
    @Param('entity') entity: string,
    @Param('id') id: string,
    @Body() dto: SoftDeleteDto,
    @Req() req: any,
  ) {
    return this.service.softDelete(entity, id, req.user.id, dto);
  }

  @Post(':entity/:id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted entity' })
  async restore(
    @Param('entity') entity: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.service.restore(entity, id, req.user.id);
  }
}
