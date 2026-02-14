import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (
  ...roles: (keyof typeof UserRole | 'ADMIN' | 'STAFF' | 'WORKER')[]
) => SetMetadata(ROLES_KEY, roles);
