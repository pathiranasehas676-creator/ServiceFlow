
# ServiceFlow Admin Panel Plan

## 1. UI Sitemap & Component Map

### Global Layout
- **Sidebar**: Logo, User Card (compact), Navigation Links (Dashboard, Verifications, Proofs, Payouts, Users, Services, Analytics, Audit Logs, Settings).
- **Topbar**: Page Title (dynamic), Global Search, Notifications Bell, User Menu (Profile, Logout).

### Routes
| Route | Features | Key Components |
| :--- | :--- | :--- |
| `/admin/dashboard` | KPI Cards, 3 Queue Tabs (IDs, Proofs, Payouts), Quick Actions, Recent Activity (Audit Log Preview). | `<KpiCard>`, `<QueueTabs>`, `<ActionCard>`, `<AuditLogList>` |
| `/admin/verifications` | Table of pending IDs, Drawer for details. | `<DataTable>`, `<StatusBadge>`, `<VerificationDrawer>` |
| `/admin/proofs` | Table of pending proofs, Modal gallery. | `<DataTable>`, `<ProofThumbnail>`, `<GalleryModal>` |
| `/admin/payouts` | Table of requests, Modal for payment/receipt. | `<DataTable>`, `<BankDetails>`, `<PayoutModal>` |
| `/admin/users` | Tabbed view (Workers, Staff, Admin), Action menus. | `<Tabs>`, `<UserTable>`, `<RoleManager>` |
| `/admin/services` | CRUD Table, Add/Edit Modal. | `<DataTable>`, `<ServiceForm>` |
| `/admin/analytics` | Charts, Top performers, Export buttons. | `<ChartOverview>`, `<ExportButtons>` |
| `/admin/audit-logs` | Filterable table, JSON diff viewer. | `<DataTable>`, `<FilterBar>`, `<JsonDiff>` |
| `/admin/settings` | Form sections (Jobs, Payouts, Security). | `<SettingsForm>`, `<SectionHeader>` |

## 2. Component Library (Custom)
- `components/admin/KpiCard.tsx`: Stats display with trend indicator.
- `components/admin/StatusBadge.tsx`: Reusable badge with variant mapping.
- `components/admin/DataTable.tsx`: Generic wrapper for shadcn/ui table with pagination & sorting headers.
- `components/admin/FilterBar.tsx`: Search input + DateRangePicker + Select filters.
- `components/admin/ConfirmDialog.tsx`: Reusable alert dialog for destructive actions.
- `components/admin/UserDrawer.tsx`: Detailed view of a user profile.
- `components/admin/ImageGallery.tsx`: Modal to view proof/id images.

## 3. Mock Data Structure (`lib/mock/admin.ts`)
- `mockStats`: Global KPIs.
- `mockVerifications`: List of pending ID verifications.
- `mockProofs`: List of job proofs awaiting approval.
- `mockPayouts`: List of wallet withdrawals.
- `mockUsers`: User lists by role.
- `mockServices`: Service definitions.
- `mockAuditLogs`: System activity log.

## 4. Folder Structure
```
frontend/src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── admin/
│   │   ├── layout.tsx (Sidebar + Topbar)
│   │   ├── dashboard/page.tsx
│   │   ├── verifications/page.tsx
│   │   ├── proofs/page.tsx
│   │   ├── payouts/page.tsx
│   │   ├── users/page.tsx
│   │   ├── services/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── audit-logs/page.tsx
│   │   └── settings/page.tsx
│   └── layout.tsx
├── components/
│   ├── admin/ ... (Custom admin components)
│   ├── ui/ ... (shadcn components)
│   └── user/ ... (User components if any)
├── lib/
│   ├── utils.ts
│   └── mock/
│       └── admin-api.ts (Mock services)
├── types/
│   └── admin.ts (DTOs)
```
