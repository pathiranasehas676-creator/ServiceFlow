# ServiceFlow Admin Panel

## 🎯 Overview
Production-grade admin panel for ServiceFlow built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui.

## ✅ Completed Components

### Core Infrastructure
- ✅ TypeScript types for all entities (UserDTO, WorkerProfileDTO, VerificationDTO, ProofDTO, PayoutDTO, ServiceDTO, AuditLogDTO)
- ✅ Mock API layer with realistic async delays (`lib/mock/admin-api.ts`)
- ✅ Utility functions (formatting, cn helper)

### UI Components (shadcn/ui)
- ✅ Button
- ✅ Card
- ✅ Badge (with status variants)
- ✅ Table
- ✅ Input
- ✅ Skeleton

### Custom Admin Components
- ✅ KpiCard - Stats display with icons
- ✅ StatusBadge - Consistent status indicators
- ✅ EmptyState - Empty state with icons and CTAs
- ✅ LoadingSkeletonTable - Loading states for tables

### Layout
- ✅ AdminSidebar - Navigation with all routes
- ✅ AdminTopbar - Search and notifications
- ✅ AdminLayout - Main layout wrapper

### Pages Implemented
1. ✅ **Dashboard** (`/admin/dashboard`)
   - KPI cards (5 metrics)
   - Action queues with tabs (Verifications, Proofs, Payouts)
   - Quick actions
   - Recent activity feed
   
2. ✅ **Verifications** (`/admin/verifications`)
   - Table with search
   - Approve/Reject actions
   - Detail modal with worker info
   - Image preview

## 📋 Remaining Pages to Implement

3. **Proof Approvals** (`/admin/proofs`)
   - Table with job proofs
   - Image gallery modal
   - Approve/Reject with reason
   - Job timeline

4. **Payouts** (`/admin/payouts`)
   - Payout requests table
   - Approve modal (transaction ref + receipt upload)
   - Wallet summary drawer
   - Payout history

5. **Users & Roles** (`/admin/users`)
   - Tabbed view (Workers, Staff, Admins)
   - User management actions
   - Create staff modal
   - Role assignment

6. **Services** (`/admin/services`)
   - CRUD table
   - Add/Edit modal
   - Active toggle
   - Delete confirmation

7. **Analytics** (`/admin/analytics`)
   - Chart placeholders
   - Summary cards
   - Worker performance table
   - CSV export buttons

8. **Audit Logs** (`/admin/audit-logs`)
   - Filterable table
   - JSON diff viewer
   - Date range picker
   - Expandable rows

9. **Settings** (`/admin/settings`)
   - Form sections (Jobs, Payouts, Security, Notifications)
   - Save/Reset buttons
   - Validation

## 🚀 How to Run

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000/admin/dashboard`

## 🔌 Connecting to Backend

The admin panel uses a mock API layer in `lib/mock/admin-api.ts`. To connect to the real NestJS backend:

1. Create `lib/api/admin-api.ts`
2. Replace mock functions with real API calls using `axios` or `fetch`
3. Update the imports in page components

Example:
```typescript
// lib/api/admin-api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const adminApi = {
  async getStats(): Promise<KPIStats> {
    const { data } = await axios.get(`${API_URL}/admin/stats`);
    return data;
  },
  // ... other methods
};
```

## 📁 Project Structure

```
frontend/src/
├── app/
│   └── admin/
│       ├── layout.tsx (Sidebar + Topbar)
│       ├── dashboard/page.tsx ✅
│       ├── verifications/page.tsx ✅
│       ├── proofs/page.tsx (TODO)
│       ├── payouts/page.tsx (TODO)
│       ├── users/page.tsx (TODO)
│       ├── services/page.tsx (TODO)
│       ├── analytics/page.tsx (TODO)
│       ├── audit-logs/page.tsx (TODO)
│       └── settings/page.tsx (TODO)
├── components/
│   ├── admin/
│   │   ├── sidebar.tsx ✅
│   │   ├── topbar.tsx ✅
│   │   ├── kpi-card.tsx ✅
│   │   ├── status-badge.tsx ✅
│   │   ├── empty-state.tsx ✅
│   │   └── loading-skeleton-table.tsx ✅
│   └── ui/ (shadcn components) ✅
├── lib/
│   ├── utils.ts ✅
│   └── mock/
│       └── admin-api.ts ✅
└── types/
    └── admin.ts ✅
```

## 🎨 Design System

### Colors
- Primary: Blue (customizable via CSS variables)
- Success: Green
- Warning: Yellow
- Destructive: Red

### Spacing
- Page padding: 24px (p-6)
- Card padding: 24px (p-6)
- Card border radius: 16px (rounded-2xl)

### Typography
- Page title: text-3xl font-bold
- Section heading: text-2xl font-semibold
- Body: text-sm

### Status Badge Colors
- PENDING/POSTED: Yellow (warning)
- APPROVED/COMPLETED/PAID: Green (success)
- REJECTED/CANCELLED: Red (destructive)
- ACCEPTED/ARRIVED/PROOF_SUBMITTED: Blue (info)

## 🔐 Authentication (TODO)

Add middleware protection:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check auth token
  const token = request.cookies.get('auth-token');
  
  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
```

## 📊 Features Implemented

- ✅ Responsive layout (desktop-first)
- ✅ Dark mode support (via CSS variables)
- ✅ Loading states (skeletons)
- ✅ Empty states
- ✅ Search functionality
- ✅ Status badges
- ✅ Mock API with delays
- ✅ TypeScript strict mode
- ✅ Consistent spacing
- ✅ Icon integration (lucide-react)

## 🎯 Next Steps

1. Complete remaining 7 pages (Proofs, Payouts, Users, Services, Analytics, Audit Logs, Settings)
2. Add Dialog/Modal components for forms
3. Add Tabs component for Users page
4. Add DateRangePicker for Analytics
5. Implement CSV export functionality
6. Add toast notifications
7. Connect to real backend API
8. Add authentication middleware
9. Add form validation
10. Add pagination for tables

## 📸 Screenshots

### Dashboard
- 5 KPI cards in a row
- Action queues with 3 tabs
- Quick actions card
- Recent activity feed

### Verifications
- Searchable table
- ID document thumbnails
- Approve/Reject buttons
- Detail modal with full image

## 🛠️ Technologies

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui + Radix UI
- **Icons**: lucide-react
- **State**: React hooks (useState, useEffect)
- **Data Fetching**: Mock API (ready for React Query/SWR)

## 📝 Notes

- All components are client-side ('use client') for interactivity
- Mock data includes realistic delays (300-1000ms)
- Images use placeholder service (placehold.co)
- Ready for backend integration with minimal changes
- Follows enterprise design patterns
- Fully typed with TypeScript
