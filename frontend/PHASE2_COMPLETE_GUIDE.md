# Phase 2 Admin Panel Integration - Complete Implementation Guide

## 🎯 **Status: READY FOR IMPLEMENTATION**

This document provides ALL code needed to integrate the Admin Panel with the real backend.

---

## ⚠️ **CRITICAL: Backend Must Be Running**

Before starting frontend integration, ensure:
1. Backend Phase 1 is complete (all admin endpoints implemented)
2. Backend is running on `http://localhost:3001`
3. CORS is configured to allow `http://localhost:3000`
4. Database is seeded with test data

---

## 📋 **STEP-BY-STEP IMPLEMENTATION**

### **STEP 1: Update Endpoints (5 min)**

**File:** `lib/endpoints.ts`

**Action:** Add `/api/v1` prefix to all admin endpoints

**Find and replace:**
- `/admin/` → `/api/v1/admin/`
- `/storage/` → `/api/v1/storage/`
- `/jobs/` → `/api/v1/jobs/`
- `/auth/` → `/api/v1/auth/`

**Result:**
```typescript
admin: {
  dashboard: {
    kpis: '/api/v1/admin/dashboard/kpis',
  },
  verifications: {
    list: '/api/v1/admin/verifications',
    approve: (id: string) => `/api/v1/admin/verifications/${id}/approve`,
    reject: (id: string) => `/api/v1/admin/verifications/${id}/reject`,
  },
  // ... etc
}
```

---

### **STEP 2: Disable Mock Data (2 min)**

**File:** `src/lib/mock/admin-api.ts`

**Action:** Add deprecation notice at top:

```typescript
/**
 * @deprecated This file is NO LONGER USED.
 * All admin pages now use real backend APIs via hooks in /lib/hooks/
 * 
 * DO NOT IMPORT FROM THIS FILE.
 * 
 * This file is kept for reference only and will be deleted after Phase 2 verification.
 */

// ... rest of file
```

---

### **STEP 3: Update useDashboard Hook (10 min)**

**File:** `lib/hooks/useDashboard.ts`

**Current Code:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { endpoints } from '../endpoints';
import { apiClient } from '../apiClient';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const response = await apiClient(endpoints.admin.dashboard.kpis);
      return response;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
```

**This is ALREADY CORRECT!** No changes needed.

---

### **STEP 4: Update useVerifications Hook (15 min)**

**File:** `lib/hooks/useVerifications.ts`

**Replace entire file with:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tantml:parameter>
<parameter name="Complexity">5
