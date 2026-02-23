import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';

@ApiTags('admin/system')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/system')
export class SystemConfigController {
  constructor(private prisma: PrismaService) {}

  @Get('profile-policy')
  @Permissions('MANAGE_SETTINGS')
  @ApiOperation({ summary: 'Get current profile completion policy' })
  async getProfilePolicy() {
    const configs = await this.prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'REQUIRE_PHONE',
            'REQUIRE_ADDRESS',
            'REQUIRE_NIC',
            'REQUIRE_PROFILE_PHOTO',
            'REQUIRE_BANK_DETAILS',
            'REQUIRE_ID_VERIFICATION_FOR_JOBS',
            'REQUIRE_ID_VERIFICATION_FOR_PAYOUTS',
            'REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS',
            'REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS',
            'REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE',
            'REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS',
          ],
        },
      },
    });

    const policy: Record<string, any> = {};
    configs.forEach((config: any) => {
      policy[config.key] = config.value;
    });

    return policy;
  }

  @Patch('profile-policy')
  @Permissions('MANAGE_SETTINGS')
  @ApiOperation({ summary: 'Update profile completion policy' })
  async updateProfilePolicy(
    @Body() updates: Record<string, any>,
    @GetUser() user: any,
  ) {
    const allowedKeys = [
      'REQUIRE_PHONE',
      'REQUIRE_ADDRESS',
      'REQUIRE_NIC',
      'REQUIRE_PROFILE_PHOTO',
      'REQUIRE_BANK_DETAILS',
      'REQUIRE_ID_VERIFICATION_FOR_JOBS',
      'REQUIRE_ID_VERIFICATION_FOR_PAYOUTS',
      'REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS',
      'REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS',
      'REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE',
      'REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS',
    ];

    // Validate keys
    const invalidKeys = Object.keys(updates).filter(
      (key) => !allowedKeys.includes(key),
    );
    if (invalidKeys.length > 0) {
      throw new ForbiddenException(
        `Invalid policy keys: ${invalidKeys.join(', ')}`,
      );
    }

    // Validate types
    for (const [key, value] of Object.entries(updates)) {
      if (key.startsWith('REQUIRE_MIN_')) {
        if (typeof value !== 'number' || value < 0 || value > 100) {
          throw new ForbiddenException(
            `${key} must be a number between 0 and 100`,
          );
        }
      } else {
        if (typeof value !== 'boolean') {
          throw new ForbiddenException(`${key} must be a boolean`);
        }
      }
    }

    // Get old values for audit log
    const oldConfigs = await this.prisma.systemConfig.findMany({
      where: { key: { in: Object.keys(updates) } },
    });

    const oldValues: Record<string, any> = {};
    oldConfigs.forEach((config: any) => {
      oldValues[config.key] = config.value;
    });

    // Update each config
    await this.prisma.$transaction(async (tx) => {
      for (const [key, value] of Object.entries(updates)) {
        await tx.systemConfig.upsert({
          where: { key },
          update: { value, updatedBy: user.id },
          create: {
            key,
            value,
            updatedBy: user.id,
            description: `Profile policy: ${key}`,
          },
        });
      }

      // Create audit log
      await tx.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: AuditAction.UPDATE,
          entityType: 'SystemConfig',
          entityId: 'PROFILE_POLICY',
          actionDetail: 'Updated profile completion policy',
          oldValue: oldValues,
          newValue: updates,
        },
      });
    });

    return {
      message: 'Profile policy updated successfully',
      updated: Object.keys(updates),
    };
  }
}
