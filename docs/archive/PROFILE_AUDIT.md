# Profile Module Audit

## Prisma Models
- [x] **User**: `fullName`, `email`, `role`, `passwordHash`, `phoneNumber`, `verificationLevel`, `verificationScore`, `riskFlags`.
  - *Location*: `prisma/schema.prisma`
- [PARTIAL] **WorkerProfile**: `userId`, `bio`, `skills`, `hourlyRateCents`, `verificationStatus`.
  - *Missing*: `nicNumber`, `address`, `profilePhotoFileKey`, `profileCompleted`, `completionScore`.
  - *Location*: `prisma/schema.prisma`
- [x] **BankDetails**: `workerProfileId`, `bankName`, `encryptedAccountNumber`, `accountNumberIV`, `accountNumberAuthTag`, `accountNumberLast4`, `encryptionVersion`, `accountName`, `branchCode`, `swiftCode`, `isVerified`.
  - *Location*: `prisma/schema.prisma`
- [x] **IdVerification**: `workerProfileId`, `documentType`, `documentNumber`, `frontImageKey`, `backImageKey`, `selfieKey`, `status`, `reviewedBy`, `reviewedAt`, `rejectionReason`.
  - *Location*: `prisma/schema.prisma`
- [x] **AdminAuditLog**: Complete.
  - *Location*: `prisma/schema.prisma`

## Backend Endpoints
- [x] **Storage**: `Post /storage/id/presign`, `Post /storage/id/confirm`.
  - *Location*: `src/storage/storage.controller.ts`
- [PARTIAL] **Users**: `Get /users/profile`, `Patch /users/profile`.
  - *Note*: Current endpoints needs refactoring for the new module requirements.
  - *Location*: `src/users/users.controller.ts`
- [PARTIAL] **Worker**: `Put /worker/bank`, `Put /worker/profile`.
  - *Note*: Needs migration to the new module structure.
  - *Location*: `src/users/worker-profile.controller.ts`

## Missing Components
- **EncryptionService**: Required for AES-256-GCM encryption of bank account numbers.
- **Admin View Endpoints**: Missing specific profile view and action endpoints for admins.
- **Profile Completion Logic**: Missing logic to calculate and gate actions based on completion status.
- **Frontend UI**: All profile-related UI components and pages need implementation.
