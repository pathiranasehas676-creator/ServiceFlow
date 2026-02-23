# ServiceFlow RBAC Audit

## Detailed Audit of Existing Security and Access Control System

### 1. Existing Database Models (Prisma)
- **UserRole Enum**: `USER`, `WORKER`, `STAFF`, `ADMIN`.
- **User Model**: Has a `role` field using `UserRole` enum.
- **Permission Model**: `code` (string), `label` (string).
- **UserPermission Model**: Join table for direct user-permission assignment.
- **RolePermission Model**: Join table for role-permission assignment (uses `UserRole` enum).
- **AdminAuditLog**: Stores actor, action, entity, and snapshots.
- **ApiRequestLog**: Logs all API requests with user ID, role, and context.

### 2. Existing Guards (NestJS)
- **RolesGuard**: Simple check against `user.role` from request.
- **PermissionsGuard**: Checks database for `rolePermission` and `userPermission`. Currently:
  - Bypasses for `user.role === 'ADMIN'`.
  - Performs multiple database lookups per request (Optimizable).
- **JwtAuthGuard**: Standard JWT verification.
- **ElevatedGuard**: Likely used for sensitive actions requiring recent re-auth (e.g., 2FA or recent login).

### 3. Existing Frontend Structure
- **/admin**: Main administration area (Jobs, Users, Requests).
- **/staff**: Staff-specific operational area (Jobs, Reports).
- **/worker**: Worker-specific portal.
- **/auth**: Login, registration, 2FA, password reset.

### 4. Gaps and Conflicts
- **Missing Role**: `SUPER_ADMIN` is not in the `UserRole` enum.
- **Permission Model**: Lacks `group` and `description` fields for better UI organization.
- **Performance**: `PermissionsGuard` hits the database twice per protected request. Permissions should be cached or embedded in JWT.
- **Dynamic UI**: No centralized system for the frontend to know "can the user do X?" without repeating logic.
- **Staff Complexity**: Staff role exists but lacks a robust way to manage varying operational scopes (e.g., a "Support Staff" vs. "Finance Staff").
- **Audit Logs**: Need verification that permission changes are being logged properly.

### 5. Planned Refactoring
- Add `SUPER_ADMIN` to `UserRole`.
- Add `group` and `description` to `Permission` model.
- Implement permission synchronization in JWT.
- Create a centralized Permission Management UI in the Admin panel.
- Implement dynamic sidebar/navigation gating based on permissions.
