import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignRolePermissionsDto,
  OverrideUserPermissionsDto,
} from './dto/rbac.dto';

@Controller('admin/rbac')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Central management limited to Admin
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions')
  async getAllPermissions() {
    return this.rbacService.getAllPermissions();
  }

  @Post('permissions')
  async createPermission(
    @Body() dto: CreatePermissionDto,
    @Request() req: any,
  ) {
    return this.rbacService.createPermission(dto, req.user.id);
  }

  @Put('permissions/:code')
  async updatePermission(
    @Param('code') code: string,
    @Body() dto: UpdatePermissionDto,
    @Request() req: any,
  ) {
    return this.rbacService.updatePermission(code, dto, req.user.id);
  }

  @Get('roles')
  async getRoles() {
    // Return the UserRole enum values
    return Object.values(UserRole);
  }

  @Get('role-permissions/:role')
  async getRolePermissions(@Param('role') role: UserRole) {
    return this.rbacService.getPermissionsByRole(role);
  }

  @Post('role-permissions')
  async assignRolePermissions(
    @Body() dto: AssignRolePermissionsDto,
    @Request() req: any,
  ) {
    return this.rbacService.assignPermissionsToRole(dto, req.user.id);
  }

  @Get('user-overrides/:userId')
  async getUserOverrides(@Param('userId') userId: string) {
    return this.rbacService.getUserOverrides(userId);
  }

  @Post('user-overrides')
  async overrideUserPermission(
    @Body() dto: OverrideUserPermissionsDto,
    @Request() req: any,
  ) {
    return this.rbacService.overrideUserPermission(dto, req.user.id);
  }

  @Delete('user-overrides/:userId/:permissionCode')
  async removeUserOverride(
    @Param('userId') userId: string,
    @Param('permissionCode') code: string,
    @Request() req: any,
  ) {
    return this.rbacService.removeUserOverride(userId, code, req.user.id);
  }
}
