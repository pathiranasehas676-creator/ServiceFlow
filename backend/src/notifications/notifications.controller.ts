import { Controller, Get, Post, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all notifications with pagination' })
  async findAll(
    @GetUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
  ) {
    return this.notificationsService.findAll(user.id, page);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@GetUser() user: any) {
    return { count: await this.notificationsService.getUnreadCount(user.id) };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@GetUser() user: any) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markAsRead(
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }
}
