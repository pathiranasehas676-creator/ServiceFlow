# Job Form Upgrade Audit

## Prisma Models
| Model | Status | Notes |
|-------|--------|-------|
| `Job` | PARTIAL | Missing paymentType, pricing details, geofence, proofPolicy, eligibility, postMode, cancellation fields. |
| `JobAttachment` | MISSING | New model required for instruction/reference files. |
| `Service` | DONE | Standard model exists. |
| `JobStatusHistory` | DONE | Exists and used in status transitions. |
| `JobProof` | DONE | Exists but needs `proofType` for before/after support. |
| `Notification` | DONE | Exists and used. |
| `AdminAuditLog` | DONE | Exists and used. |

## Backend Implementation (NestJS)
| Feature | Status | Notes |
|---------|--------|-------|
| Admin Job Create | PARTIAL | basic creation at `POST /api/v1/admin/jobs`. Needs update to handle new fields and logical branches (FIXED vs HOURLY, PUBLIC vs DIRECT). |
| Worker Feed | PARTIAL | `GET /api/v1/jobs/available` lacks eligibility checks (verifiedOnly, rating, district). |
| Job Accept | PARTIAL | Lacks support for `DIRECT_ASSIGN` ownership checks. |
| Arrival Tracking | PARTIAL | Hardcoded geofence radius (150m) instead of per-job setting. |
| Proof Submission | PARTIAL | Lacks policy enforcement (min images, before/after). |
| Presigned URLs | DONE | `StorageService` exists and is used for proofs. Need to extend for job attachments. |

## Frontend UI (Next.js)
| Page | Status | Notes |
|------|--------|-------|
| Admin Create Job | PARTIAL | Basic shadcn/ui form. Needs upgrade to full production-ready unified component. |
| Staff Create Job | PARTIAL | Basic shadcn/ui form. Needs upgrade. |
| Eligibility Controls | MISSING | No toggles for verifiedOnly, rating filters, etc. |
| Pricing Breakdown | MISSING | No platform fee calculation or breakdown display. |
| Attachments | MISSING | No file upload for job instructions. |

## File Paths
- **Prisma Schema**: `backend/prisma/schema.prisma`
- **Admin Controller**: `backend/src/admin/admin-jobs.controller.ts`
- **Admin Service**: `backend/src/admin/admin-jobs.service.ts`
- **Jobs Controller**: `backend/src/jobs/jobs.controller.ts`
- **Jobs Service**: `backend/src/jobs/jobs.service.ts`
- **Admin UI Page**: `frontend/src/app/admin/jobs/create/page.tsx`
- **Staff UI Page**: `frontend/src/app/staff/jobs/create/page.tsx`
- **Geo Utils**: `backend/src/common/utils/geo.utils.ts`
- **Storage Service**: `backend/src/storage/storage.service.ts`
