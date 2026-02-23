import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ErrorLogsService } from './error-logs.service';
import { ErrorLogFilterDto } from './dto/error-log.dto';

@ApiTags('admin-system-errors')
@ApiBearerAuth()
@Controller('admin/system/errors')
export class ErrorLogsController {
  constructor(private readonly service: ErrorLogsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List system errors' })
  async findAll(@Query() dto: ErrorLogFilterDto) {
    return this.service.findAll(dto);
  }

  @Post('client')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Log client-side errors' })
  async createFrontEndLog(@Body() body: any, @Req() req: any) {
    return this.service.create({
      ...body,
      source: 'frontend',
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get error log details' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
