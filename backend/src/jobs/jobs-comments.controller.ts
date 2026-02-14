import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JobsCommentsService } from './jobs-comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('jobs/:id/comments')
@UseGuards(JwtAuthGuard)
export class JobsCommentsController {
  constructor(private commentsService: JobsCommentsService) {}

  @Post()
  async addComment(
    @Param('id') jobId: string,
    @GetUser() user: any,
    @Body('message') message: string,
  ) {
    return this.commentsService.createComment(jobId, user.id, message);
  }

  @Get()
  async getComments(@Param('id') jobId: string, @GetUser() user: any) {
    return this.commentsService.getComments(jobId, user.id);
  }
}
