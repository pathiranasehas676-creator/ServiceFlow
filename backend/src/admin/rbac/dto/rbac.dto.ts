import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { UserRole, PermissionOverrideMode } from '@prisma/client';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  group: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  group?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class AssignRolePermissionsDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsArray()
  @IsString({ each: true })
  permissionCodes: string[];
}

export class OverrideUserPermissionsDto {
  @IsUUID()
  userId: string;

  @IsString()
  permissionCode: string;

  @IsEnum(PermissionOverrideMode)
  mode: PermissionOverrideMode;
}

export class BulkOverridePermissionsDto {
  @IsUUID()
  userId: string;

  @IsArray()
  overrides: {
    permissionCode: string;
    mode: PermissionOverrideMode;
  }[];
}
