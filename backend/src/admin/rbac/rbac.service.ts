import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignRolePermissionsDto,
  OverrideUserPermissionsDto,
} from './dto/rbac.dto';
import { UserRole, AuditAction, Prisma } from '@prisma/client';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // PERMISSIONS CRUD
  // ============================================

  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { group: 'asc' },
    });
  }

  async createPermission(dto: CreatePermissionDto, adminId: string) {
    const existing = await this.prisma.permission.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException('Permission code already exists');

    const permission = await this.prisma.permission.create({
      data: dto,
    });

    await this.logAudit(
      adminId,
      AuditAction.CREATE,
      'Permission',
      permission.id,
      null,
      permission,
    );
    return permission;
  }

  async updatePermission(
    code: string,
    dto: UpdatePermissionDto,
    adminId: string,
  ) {
    const permission = await this.prisma.permission.findUnique({
      where: { code },
    });
    if (!permission) throw new NotFoundException('Permission not found');

    const updated = await this.prisma.permission.update({
      where: { code },
      data: dto,
    });

    await this.logAudit(
      adminId,
      AuditAction.UPDATE,
      'Permission',
      updated.id,
      permission,
      updated,
    );
    return updated;
  }

  // ============================================
  // ROLE ASSIGNMENTS
  // ============================================

  async getPermissionsByRole(role: UserRole) {
    return this.prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    });
  }

  async assignPermissionsToRole(
    dto: AssignRolePermissionsDto,
    adminId: string,
  ) {
    const { role, permissionCodes } = dto;

    // Verify all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });

    if (permissions.length !== permissionCodes.length) {
      throw new NotFoundException('Some permission codes were not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Get old permissions for audit
      const oldAssignments = await tx.rolePermission.findMany({
        where: { role },
      });

      // Remove existing
      await tx.rolePermission.deleteMany({
        where: { role },
      });

      // Create new
      const newAssignments = await tx.rolePermission.createMany({
        data: permissions.map((p) => ({
          role,
          permissionId: p.id,
        })),
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.STAFF_PERMISSIONS_UPDATE,
          actionDetail: `Updated permissions for role: ${role}`,
          entityType: 'RolePermission',
          oldValue: oldAssignments as any,
          newValue: { role, permissions: permissionCodes } as any,
        },
      });

      return newAssignments;
    });
  }

  // ============================================
  // USER OVERRIDES
  // ============================================

  async getUserOverrides(userId: string) {
    return this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });
  }

  async overrideUserPermission(
    dto: OverrideUserPermissionsDto,
    adminId: string,
  ) {
    const permission = await this.prisma.permission.findUnique({
      where: { code: dto.permissionCode },
    });
    if (!permission) throw new NotFoundException('Permission not found');

    const existing = await this.prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId: dto.userId,
          permissionId: permission.id,
        },
      },
    });

    const result = await this.prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: dto.userId,
          permissionId: permission.id,
        },
      },
      create: {
        userId: dto.userId,
        permissionId: permission.id,
        mode: dto.mode,
      },
      update: {
        mode: dto.mode,
      },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        actorId: adminId,
        action: 'PERMISSION_OVERRIDE_UPDATE' as any,
        actionDetail: `Overrode permission ${dto.permissionCode} for user ${dto.userId} to ${dto.mode}`,
        entityType: 'UserPermission',
        entityId: dto.userId,
        oldValue: existing as any,
        newValue: result as any,
      },
    });

    return result;
  }

  async removeUserOverride(
    userId: string,
    permissionCode: string,
    adminId: string,
  ) {
    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode },
    });
    if (!permission) throw new NotFoundException('Permission not found');

    const deleted = await this.prisma.userPermission.delete({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        actorId: adminId,
        action: 'PERMISSION_OVERRIDE_UPDATE' as any,
        actionDetail: `Removed permission override ${permissionCode} for user ${userId}`,
        entityType: 'UserPermission',
        entityId: userId,
        oldValue: deleted as any,
        newValue: Prisma.DbNull,
      },
    });

    return deleted;
  }

  // ============================================
  // HELPERS
  // ============================================

  private async logAudit(
    actorId: string,
    action: AuditAction,
    entityType: string,
    entityId: string,
    oldValue: any,
    newValue: any,
  ) {
    await this.prisma.adminAuditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        oldValue: oldValue,
        newValue: newValue,
      },
    });
  }
}
