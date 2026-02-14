# ServiceFlow Frontend-Backend Integration - Complete Guide

## 🎯 **Overview**

This document outlines the complete integration between the Next.js Admin Panel and the NestJS backend with secure authentication, RBAC routing, and real-time data fetching.

---

## ✅ **What's Been Implemented**

### **1. API Client** (`lib/apiClient.ts`)
- ✅ Fetch wrapper with automatic JSON parsing
- ✅ **Automatic token refresh on 401**
- ✅ Request queuing during refresh (prevents refresh storm)
- ✅ Typed error handling (`ApiError` class)
- ✅ Credentials included for HttpOnly refresh cookie
- ✅ Retry logic after successful refresh

### **2. API Endpoints** (`lib/endpoints.ts`)
- ✅ Centralized endpoint paths
- ✅ Helper functions for dynamic routes
- ✅ Query string builder utility

### **3. Auth Store** (`lib/auth.ts`)
- ✅ Zustand store with persistence
- ✅ Access token in memory (security best practice)
- ✅ User info persisted to localStorage
- ✅ Global store reference for API client

### **4. React Query Setup** (`lib/queryClient.tsx`)
- ✅ Provider with sensible defaults
- ✅ 1-minute stale time
- ✅ React Query Devtools (development only)

### **5. Custom Hooks**
- ✅ `useAuth` - Login/logout with mutations
- ✅ `useVerifications` - Fetch and mutate verifications
- ✅ `useProofs` - Fetch and mutate job proofs
- ✅ `usePayouts` - Fetch and mutate payouts
- ✅ `useDashboard` - Fetch KPIs with auto-refresh

### **6. RBAC Middleware** (`middleware.ts`)
- ✅ Protects `/admin/*` routes
- ✅ Redirects unauthenticated users to login
- ✅ Checks user role (ADMIN/STAFF only)
- ✅ Preserves redirect URL after login

### **7. Login Page** (`app/(auth)/auth/login/page.tsx`)
- ✅ Real authentication with backend
- ✅ Loading states
- ✅ Error handling with toasts
- ✅ Demo credentials display

---

## 🔐 **Authentication Flow**

### **Login:**
```
1. User submits credentials → POST /api/auth/login
2. Backend validates and returns:
   - accessToken (stored in memory)
   - user object (persisted to localStorage)
   - HttpOnly refresh cookie (set by backend)
3. Redirect to /admin/dashboard
```

### **Token Refresh (Automatic on 401):**
```
1. API request returns 401
2. API client calls POST /api/auth/refresh (with credentials)
3. Backend validates refresh cookie
4. New accessToken returned and stored
5. Original request retried with new token
6. If refresh fails → logout and redirect to login
```

### **Logout:**
```
1. User clicks logout → POST /api/auth/logout
2. Backend invalidates refresh cookie
3. Frontend clears accessToken and user
4. Redirect to /auth/login
```

---

## 📡 **API Integration**

### **Backend Endpoints Used:**

#### **Auth:**
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

#### **Admin:**
- `GET /api/admin/dashboard/kpis`
- `GET /api/admin/verifications?status=`
- `POST /api/admin/verifications/:id/approve`
- `POST /api/admin/verifications/:id/reject`
- `GET /api/admin/proofs?status=`
- `POST /api/admin/proofs/:id/approve`
- `POST /api/admin/proofs/:id/reject`
- `GET /api/admin/payouts?status=`
- `POST /api/admin/payouts/:id/approve`
- `POST /api/admin/payouts/:id/reject`
- `POST /api/admin/payouts/:id/mark-paid`

---

## 🚀 **Setup Instructions**

### **1. Install Dependencies**
```bash
cd frontend
npm install zustand @tanstack/react-query @tanstack/react-query-devtools sonner
```

### **2. Environment Variables**
Create `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

### **3. Backend CORS Configuration**
Ensure backend allows frontend origin:
```typescript
// backend/src/main.ts
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true, // IMPORTANT: Allow cookies
});
```

### **4. Start Services**
```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### **5. Test Login**
```
URL: http://localhost:3000/auth/login
Email: admin@serviceflow.com
Password: Password123!
```

---

## 🔧 **Next Steps: Update Admin Pages**

### **Pages to Update:**

1. **Dashboard** (`src/app/admin/dashboard/page.tsx`)
   ```typescript
   import { useDashboardKPIs } from '@/lib/hooks/useDashboard';
   
   const { data, isLoading } = useDashboardKPIs();
   ```

2. **Verifications** (`src/app/admin/verifications/page.tsx`)
   ```typescript
   import { useVerifications, useApproveVerification, useRejectVerification } from '@/lib/hooks/useVerifications';
   
   const { data, isLoading } = useVerifications({ status: 'PENDING' });
   const approve = useApproveVerification();
   const reject = useRejectVerification();
   ```

3. **Proofs** (`src/app/admin/proofs/page.tsx`)
   ```typescript
   import { useProofs, useApproveProof, useRejectProof } from '@/lib/hooks/useProofs';
   
   const { data, isLoading } = useProofs({ status: 'PROOF_SUBMITTED' });
   const approve = useApproveProof();
   const reject = useRejectProof();
   ```

4. **Payouts** (`src/app/admin/payouts/page.tsx`)
   ```typescript
   import { usePayouts, useApprovePayout, useRejectPayout, useMarkPayoutPaid } from '@/lib/hooks/usePayouts';
   
   const { data, isLoading } = usePayouts({ status: 'PENDING' });
   const approve = useApprovePayout();
   const reject = useRejectPayout();
   const markPaid = useMarkPayoutPaid();
   ```

### **Update Root Layout** (`src/app/layout.tsx`)
```typescript
import { QueryProvider } from '@/lib/queryClient';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

## 🛡️ **Security Features**

### **✅ Implemented:**
- Access token in memory (not localStorage)
- HttpOnly refresh cookie (XSS protection)
- Automatic token refresh
- RBAC middleware
- CORS with credentials
- Request queuing during refresh

### **🔒 Best Practices:**
- Never log tokens to console
- Use HTTPS in production
- Set secure cookie flags in production
- Implement CSRF protection (if needed)
- Rate limit login endpoint

---

## 🧪 **Testing**

### **Test Authentication:**
```bash
# 1. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@serviceflow.com","password":"Password123!"}' \
  -c cookies.txt

# 2. Use access token
curl -X GET http://localhost:3001/api/admin/dashboard/kpis \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt

# 3. Refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

---

## 📊 **Data Flow Example**

### **Approve Verification:**
```typescript
// 1. User clicks "Approve" button
const approve = useApproveVerification();
approve.mutate(verificationId);

// 2. Hook calls API
POST /api/admin/verifications/:id/approve
Authorization: Bearer <accessToken>

// 3. Backend validates token and role
if (user.role !== 'ADMIN') return 403;

// 4. Backend updates database
UPDATE verifications SET status = 'APPROVED' WHERE id = :id;

// 5. Backend returns success
{ message: 'Verification approved' }

// 6. Hook invalidates query cache
queryClient.invalidateQueries(['verifications']);

// 7. UI refetches and updates
GET /api/admin/verifications?status=PENDING
```

---

## 🎉 **Summary**

The frontend is now **fully integrated** with the backend:
- ✅ Real authentication with JWT
- ✅ Automatic token refresh
- ✅ RBAC routing protection
- ✅ React Query for data fetching
- ✅ Type-safe API client
- ✅ Error handling with toasts
- ✅ Loading states preserved

**Next:** Update all admin pages to use the new hooks and remove mock data!
