import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { StaffSupportService } from './support.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateReplyDto,
  UpdateTicketStatusDto,
  SupportFilterDto,
} from './dto/support.dto';

@ApiTags('staff-support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
@Controller('staff/support')
export class StaffSupportController {
  constructor(private readonly supportService: StaffSupportService) {}

  @Get()
  @ApiOperation({ summary: 'Get all support tickets' })
  findAll(@Query() filter: SupportFilterDto) {
    return this.supportService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket details' })
  findOne(@Param('id') id: string) {
    return this.supportService.findOne(id);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to a ticket' })
  reply(@Param('id') id: string, @Body() dto: CreateReplyDto, @Req() req: any) {
    return this.supportService.reply(id, req.user.id, dto);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @Req() req: any,
  ) {
    return this.supportService.updateStatus(id, req.user.id, dto);
  }
}
