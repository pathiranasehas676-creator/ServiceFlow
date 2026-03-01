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
import { WorkerSupportService } from './worker-support.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateTicketDto,
  ReplyToTicketDto,
  WorkerSupportFilterDto,
} from './dto/worker-support.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('worker-support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('WORKER', 'ADMIN') // Workers and admins can access
@Controller('worker/support')
export class WorkerSupportController {
  constructor(private readonly supportService: WorkerSupportService) {}

  @Get()
  @ApiOperation({ summary: 'Get my support tickets' })
  findMyTickets(@Query() filter: WorkerSupportFilterDto, @Req() req: any) {
    return this.supportService.findMyTickets(req.user.id, filter);
  }

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tickets per minute
  @ApiOperation({ summary: 'Create a new support ticket' })
  createTicket(@Body() dto: CreateTicketDto, @Req() req: any) {
    return this.supportService.createTicket(req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get my ticket details' })
  findMyTicket(@Param('id') id: string, @Req() req: any) {
    return this.supportService.findMyTicket(req.user.id, id);
  }

  @Post(':id/reply')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 replies per minute
  @ApiOperation({ summary: 'Reply to my ticket' })
  replyToTicket(
    @Param('id') id: string,
    @Body() dto: ReplyToTicketDto,
    @Req() req: any,
  ) {
    return this.supportService.replyToTicket(req.user.id, id, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close my ticket' })
  closeTicket(@Param('id') id: string, @Req() req: any) {
    return this.supportService.closeTicket(req.user.id, id);
  }
}
