import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdminServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/services.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin Services')
@ApiBearerAuth()
@Controller('admin/services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminServicesController {
  constructor(private readonly servicesService: AdminServicesService) { }

  @Get()
  @Roles('ADMIN', 'STAFF', 'USER', 'WORKER')
  @ApiOperation({ summary: 'List all active services' })
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service by ID' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  create(@Body() createServiceDto: CreateServiceDto, @Req() req: any) {
    return this.servicesService.create(createServiceDto, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a service' })
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Req() req: any,
  ) {
    return this.servicesService.update(id, updateServiceDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a service' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.servicesService.remove(id, req.user.id);
  }
}
