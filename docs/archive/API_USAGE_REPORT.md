# ServiceFlow System API Audit

This document lists all available API endpoints in the backend and identifies which are actively used by the frontend system.

## 🟢 Public / Auth APIs
| Method | Endpoint | Role | Frontend Usage | Module |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | ✅ Register Page | Auth |
| POST | `/api/v1/auth/login` | Public | ✅ Login Page | Auth |
| POST | `/api/v1/auth/refresh` | Public | ✅ Auto-Refresh | Auth |
| POST | `/api/v1/auth/logout` | Auth | ✅ Navbar | Auth |
| POST | `/api/v1/auth/verify-email` | Public | ✅ Verify Page | Auth |
| POST | `/api/v1/auth/resend-verification` | Public | ✅ Verify Page | Auth |
| POST | `/api/v1/auth/forgot-password` | Public | ✅ Forgot Pass | Auth |
| POST | `/api/v1/auth/reset-password` | Public | ✅ Reset Pass | Auth |
| GET | `/api/v1/auth/me` | Auth | ✅ App Init | Auth |
| GET | `/api/v1/auth/csrf` | Public | ✅ Global | Auth |

## 👷 Worker APIs
| Method | Endpoint | Role | Frontend Usage | Module |
|---|---|---|---|---|
| GET | `/api/v1/jobs/available` | Worker | ✅ Job Feed | Jobs |
| POST | `/api/v1/jobs/:id/accept` | Worker | ✅ Job Card | Jobs |
| POST | `/api/v1/jobs/:id/arrive` | Worker | ✅ Job Card | Jobs |
| POST | `/api/v1/jobs/:id/proof/presign` | Worker | ✅ Job Upload | Jobs |
| POST | `/api/v1/jobs/:id/proof/submit` | Worker | ✅ Job Upload | Jobs |
| GET | `/api/v1/worker/wallet` | Worker | ✅ Wallet Page | Wallet |
| GET | `/api/v1/worker/wallet/transactions` | Worker | ✅ Wallet Page | Wallet |
| GET | `/api/v1/worker/payouts` | Worker | ✅ Payouts Page | Payouts |
| GET | `/api/v1/worker/payouts/:id/receipt-url` | Worker | ✅ Payouts Page | Payouts |
| POST | `/api/v1/worker/payouts/request` | Worker | ✅ Payouts Page | Payouts |

## 🛡️ Admin / Staff APIs
| Method | Endpoint | Role | Frontend Usage | Module |
|---|---|---|---|---|
| GET | `/api/v1/jobs/admin/all` | Admin/Staff | ✅ Jobs Dashboard | Jobs |
| POST | `/api/v1/jobs/:id/decide` | Admin/Staff | ✅ Proof Review | Jobs |
| GET | `/api/v1/admin/finance/wallets` | Admin | ✅ Finance/Wallets | Finance |
| GET | `/api/v1/admin/finance/transactions` | Admin | ✅ Finance/Trans. | Finance |
| POST | `/api/v1/admin/finance/wallets/:id/adjust` | Admin | ❓ | Finance |
| GET | `/api/v1/admin/finance/payouts` | Admin/Staff | ✅ Payouts Tab | Payouts |
| POST | `/api/v1/admin/finance/payouts/:id/approve` | Admin/Staff | ✅ Payouts Tab | Payouts |
| POST | `/api/v1/admin/finance/payouts/:id/mark-processing`| Admin/Staff | ✅ Payouts Tab | Payouts |
| POST | `/api/v1/admin/finance/payouts/:id/mark-paid` | Admin/Staff | ✅ Payouts Tab | Payouts |
| POST | `/api/v1/admin/finance/payouts/:id/reject` | Admin/Staff | ✅ Payouts Tab | Payouts |
| POST | `/api/v1/admin/finance/payouts/:id/bank-details` | Admin | ✅ Payouts Tab | Payouts |
| GET | `/api/v1/admin/stats` | Admin/Staff | ✅ Dashboard | Admin |
| GET | `/api/v1/admin/audit-logs` | Admin | ✅ Audit Page | Admin |
| POST | `/api/v1/admin/users/:id/blacklist` | Admin | ❓ | Admin |

## 👤 User Profile APIs
| Method | Endpoint | Role | Frontend Usage | Module |
|---|---|---|---|---|
| GET | `/api/v1/users/profile` | Auth | ✅ Profile Page | Users |
| PATCH | `/api/v1/users/profile` | Auth | ✅ Profile Page | Users |
| POST | `/api/v1/users/worker-profile` | Auth | ✅ Onboarding | Users |
| GET | `/api/v1/users/id-upload-url` | Auth | ✅ Verification | Users |
| POST | `/api/v1/users/submit-verification` | Auth | ✅ Verification | Users |

## Notes
- **Frontend Usage**: "✅" confirms active usage in current frontend codebase. "❓" indicates endpoint exists but usage not recently verified/edited. "⏳" indicates planned feature.
- **Role Hierarchy**: Admin > Staff > Worker > User > Public.
