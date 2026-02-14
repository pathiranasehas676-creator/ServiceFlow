import { Controller, Get, Post, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('worker/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) { }

  @Get()
  async findAll(
    @GetUser() user: any,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
  ) {
    return this.notificationsService.findAll(user.id, page);
  }

  @Get('unread-count')
  async getUnreadCount(@GetUser() user: any) {
    return { count: await this.notificationsService.getUnreadCount(user.id) };
  }

  @Post(':id/read')
  async markAsRead(
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Post('read-all')
  async markAllRead(@GetUser() user: any) {
    return this.notificationsService.markAllRead(user.id);
  }
}
