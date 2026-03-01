# Profile Completion Policy - System Audit

**Date**: 2026-02-17  
**Auditor**: Senior Full-Stack Engineer  
**System**: ServiceFlow (NestJS + Next.js)

---

## PHASE 0 AUDIT RESULTS

### 1. DATABASE SCHEMA AUDIT

#### SystemConfig Model
**Status**: ✅ **DONE**  
**Location**: `backend/prisma/schema.prisma` (lines 1001-1013)

```prisma
model SystemConfig {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique @db.VarChar(100)
  value       Json
  description String?  @db.Text
  updatedBy   String?  @db.Uuid
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())
  @@map("system_config")
}
```

**Assessment**: Perfect structure for storing profile policy configuration.

---

#### WorkerProfile Model
**Status**: ✅ **DONE**  
**Location**: `backend/prisma/schema.prisma` (lines 1120-1151)

```prisma
model WorkerProfile {
  id                  String    @id @default(uuid()) @db.Uuid
  userId              String    @unique @db.Uuid
  
  // Profile fields
  fullName            String?   @db.VarChar(255)
  nicNumber           String?   @db.VarChar(50)
  address             String?   @db.Text
  bio                 String?   @db.Text
  skills              Json?
  hourlyRateCents     Int?
  profilePhotoFileKey String?   @db.VarChar(500)
  
  // Verification
  verificationStatus  VerificationStatus @default(NOT_SUBMITTED)
  
  // ✅ Profile Completion Fields (ALREADY EXIST)
  profileCompleted    Boolean   @default(false)
  completionScore     Int       @default(0) // 0-100
  missingProfileItems Json?
  lastComputedAt      DateTime?
  isOnline            Boolean   @default(false)
  
  // Relations
  bankDetails         BankDetails?
  idVerifications     IdVerification[]
  jobs                Job[]
  ratings             Rating[]
  performance         WorkerPerformance?
  jobPayments         JobPayment[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  @@map("worker_profiles")
}
```

**Assessment**: All required fields already exist! No migration needed for worker_profiles.

---

### 2. BACKEND ENDPOINTS AUDIT

#### Job Accept Endpoint
**Status**: ✅ **EXISTS** (No policy enforcement yet)  
**Location**: `backend/src/jobs/jobs.controller.ts` (line 79-81)  
**Method**: `POST /jobs/:id/accept`  
**Current Implementation**: `JobsController.accept()` → `JobsService.acceptJob()`

**Required Changes**:
- Add profile policy check before accepting job
- Return 403 with missing items if policy fails

---

#### Payout Request Endpoint
**Status**: ✅ **EXISTS** (No policy enforcement yet)  
**Location**: `backend/src/payouts/payouts.controller.ts` (line 106-112)  
**Method**: `POST /worker/payouts/request`  
**Current Implementation**: `WorkerPayoutsController.request()` → `PayoutsService.requestPayout()`

**Required Changes**:
- Add profile policy check before creating payout request
- Return 403 with missing items if policy fails

---

#### Worker Online Toggle Endpoint
**Status**: ❌ **MISSING**  
**Expected**: `PATCH /worker/profile/online-status`

**Required Changes**:
- Create new endpoint in worker profile controller
- Implement policy check for going online
- Update `worker_profiles.isOnline` field

---

#### Profile Status Endpoint
**Status**: ❌ **MISSING**  
**Expected**: `GET /worker/profile/completion-status`

**Required Changes**:
- Create new endpoint to return profile completion data
- Return: `{ score, missingItems, canAcceptJobs, canRequestPayouts, canGoOnline }`

---

#### Admin Policy Management Endpoints
**Status**: ❌ **MISSING**  
**Expected**:
- `GET /admin/system/profile-policy`
- `PATCH /admin/system/profile-policy`

**Required Changes**:
- Create SystemConfigController or extend existing admin controller
- Implement RBAC with `MANAGE_SETTINGS` permission
- Add audit logging for policy changes

---

### 3. SERVICES AUDIT

#### ProfilePolicyService
**Status**: ❌ **MISSING**  
**Required**: New service to handle all policy logic

**Required Methods**:
- `getPolicy()`: Load and cache policy from SystemConfig
- `evaluateWorkerProfile(workerId)`: Compute score, missing items, eligibility
- `recomputeAndPersist(workerId)`: Update worker_profiles table
- `canAcceptJobs(workerId)`: Boolean check
- `canRequestPayouts(workerId)`: Boolean check
- `canGoOnline(workerId)`: Boolean check

---

### 4. DATABASE SEED AUDIT

**Status**: ⚠️ **PARTIAL**  
**Location**: `backend/prisma/seed.ts` (lines 615-636)

**Current Seed**:
```typescript
const profilePolicy = [
  { key: 'REQUIRE_PHONE', value: true, description: 'Mandatory phone number' },
  { key: 'REQUIRE_ADDRESS', value: true, description: 'Mandatory home address' },
  { key: 'REQUIRE_NIC', value: true, description: 'Mandatory National ID/NIC number' },
  { key: 'REQUIRE_PROFILE_PHOTO', value: false, description: 'Is profile photo mandatory?' },
  { key: 'REQUIRE_BANK_DETAILS', value: true, description: 'Mandatory bank account details' },
  { key: 'REQUIRE_ID_VERIFICATION_FOR_JOBS', value: true, description: 'ID verification required to accept jobs' },
  { key: 'REQUIRE_ID_VERIFICATION_FOR_PAYOUTS', value: true, description: 'ID verification required to request payouts' },
  { key: 'REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS', value: 80, description: 'Min completion score to accept jobs' },
  { key: 'REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE', value: 70, description: 'Min completion score to go online' },
  { key: 'REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS', value: 100, description: 'Min completion score to request payout' },
];
```

**Assessment**: ✅ Seed data already exists! Just need to add missing key:
- `REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS` (optional)

---

### 5. FRONTEND AUDIT

#### Worker Profile Completion UI
**Status**: ❌ **MISSING**  
**Expected**: `/worker/profile` page with completion progress

**Required Components**:
- Progress bar showing completion score
- Missing items checklist with action buttons
- Modal for blocked actions (job accept, payout request)

---

#### Admin Policy Settings UI
**Status**: ✅ **EXISTS**  
**Location**: `frontend/src/app/admin/settings/profile-policy/page.tsx`

**Assessment**: Page exists but needs implementation of:
- Form with switches and number inputs
- Save functionality with API integration
- Audit log confirmation

---

## SUMMARY

### ✅ DONE (No Changes Needed)
1. SystemConfig database model
2. WorkerProfile completion fields (profileCompleted, completionScore, missingProfileItems, lastComputedAt)
3. Basic seed data for profile policy
4. Job accept endpoint structure
5. Payout request endpoint structure
6. Admin settings page structure

### ⚠️ PARTIAL (Needs Enhancement)
1. Seed data - add REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS
2. Admin settings UI - needs full implementation

### ❌ MISSING (Must Create)
1. **ProfilePolicyService** - Core business logic
2. **Worker online toggle endpoint**
3. **Profile completion status endpoint**
4. **Admin policy management endpoints**
5. **Policy enforcement in job accept flow**
6. **Policy enforcement in payout request flow**
7. **Policy enforcement in online toggle flow**
8. **Worker profile completion UI**
9. **Blocked action modals**

---

## IMPLEMENTATION PRIORITY

### Phase 1 - Backend Core (Critical)
1. Create ProfilePolicyService
2. Add policy enforcement to existing endpoints
3. Create worker online toggle endpoint
4. Create profile status endpoint
5. Create admin policy management endpoints

### Phase 2 - Frontend (High)
1. Implement worker profile completion UI
2. Implement admin policy settings form
3. Add blocked action modals

### Phase 3 - Testing (High)
1. Manual testing scenarios
2. Edge case validation
3. Audit log verification

---

## ESTIMATED EFFORT
- **Backend**: 4-6 hours
- **Frontend**: 3-4 hours
- **Testing**: 2 hours
- **Total**: 9-12 hours

---

## NEXT STEPS
Proceed with Phase 1 implementation starting with ProfilePolicyService creation.
