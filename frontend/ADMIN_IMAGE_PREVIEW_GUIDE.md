# Admin Image Preview - Secure Implementation Guide

## 🎯 **Overview**

Secure image preview system for ServiceFlow Admin Panel using **signed GET URLs** from the backend. All images are stored in private MinIO buckets and accessed only through time-limited signed URLs.

---

## 🔐 **Why Signed URLs?**

### **Security Benefits:**
1. **Private Storage** - Images never publicly accessible
2. **Time-Limited Access** - URLs expire in 2 minutes
3. **RBAC Enforcement** - Backend validates admin/staff role before signing
4. **No Token Exposure** - Signed URLs don't contain auth tokens
5. **Audit Trail** - Backend logs all preview requests

### **Without Signed URLs (Insecure):**
```
❌ Direct MinIO URL: https://minio:9000/bucket/id_front_123.jpg
   - Anyone with URL can access
   - No expiry
   - No access control
   - No audit trail
```

### **With Signed URLs (Secure):**
```
✅ Signed URL: https://minio:9000/bucket/id_front_123.jpg?signature=...&expires=...
   - Only accessible with valid signature
   - Expires in 2 minutes
   - Backend validates role before signing
   - All requests logged
```

---

## 🔄 **Preview Flow**

```
1. Admin opens Proofs page
   ↓
2. Component renders <PreviewThumb objectKey="..." />
   ↓
3. Hook calls GET /api/storage/preview?objectKey=...
   ↓
4. Backend validates:
   - User is authenticated
   - User has ADMIN or STAFF role
   - User has permission to view this file
   ↓
5. Backend generates signed URL (2min expiry)
   ↓
6. Frontend receives: { getUrl, mimeType, sizeBytes }
   ↓
7. Image displayed using signed URL
   ↓
8. URL cached for 60 seconds (React Query)
   ↓
9. After 60s, new signed URL requested automatically
```

---

## ✅ **What's Been Implemented**

### **1. Hooks** (`lib/hooks/useSignedPreviewUrl.ts`)
- **`useSignedPreviewUrl`** - Fetch single signed URL
- **`useSignedPreviewUrls`** - Fetch multiple signed URLs (batch)
- React Query caching (60s stale time)
- Automatic refetch on expiry

### **2. Components**

#### **`PreviewThumb`** (`components/PreviewThumb.tsx`)
- Thumbnail with signed URL
- Loading skeleton
- Error state with retry
- Configurable sizes (sm/md/lg)
- Click handler for gallery

#### **`PreviewThumbStack`** (`components/PreviewThumb.tsx`)
- Multiple thumbnails in stack
- Shows "+N" for overflow
- Click to open gallery

#### **`ImageGallery`** (`components/ImageGallery.tsx`)
- Full-size image viewer
- Navigation (prev/next)
- Metadata display (type, size, date)
- Download button
- Open in new tab
- Thumbnail strip

#### **`IDVerificationPreview`** (`components/IDVerificationPreview.tsx`)
- Front/back ID preview
- Grid layout
- Click to open gallery

---

## 📡 **API Integration**

### **Backend Endpoint:**
```
GET /api/storage/preview?objectKey=<objectKey>
Authorization: Bearer <accessToken>

Response:
{
  "getUrl": "https://minio:9000/bucket/...?signature=...&expires=...",
  "expiresIn": 120,
  "mimeType": "image/jpeg",
  "sizeBytes": 1024000
}
```

### **Authorization:**
- **ADMIN** - Can preview all images
- **STAFF** - Can preview job proofs only
- **WORKER** - Can preview own uploads only

---

## 🎨 **Usage Examples**

### **1. Single Thumbnail:**
```tsx
import { PreviewThumb } from '@/components/PreviewThumb';

<PreviewThumb
  objectKey="dev/job_proof/user-123/job-456/uuid.jpg"
  alt="Job Proof"
  size="md"
  onClick={() => setGalleryOpen(true)}
/>
```

### **2. Thumbnail Stack:**
```tsx
import { PreviewThumbStack } from '@/components/PreviewThumb';

<PreviewThumbStack
  objectKeys={proof.images}
  maxVisible={3}
  size="sm"
  onClick={() => setGalleryOpen(true)}
/>
```

### **3. Image Gallery:**
```tsx
import { ImageGallery } from '@/components/ImageGallery';

<ImageGallery
  objectKeys={proof.images}
  open={galleryOpen}
  onOpenChange={setGalleryOpen}
  initialIndex={0}
  metadata={{
    [objectKey]: {
      mimeType: 'image/jpeg',
      sizeBytes: 1024000,
      uploadedAt: '2026-02-12T...',
    },
  }}
/>
```

### **4. ID Verification:**
```tsx
import { IDVerificationPreview } from '@/components/IDVerificationPreview';

<IDVerificationPreview
  frontObjectKey={verification.idFrontObjectKey}
  backObjectKey={verification.idBackObjectKey}
  metadata={{
    front: { mimeType: 'image/jpeg', sizeBytes: 1024000 },
    back: { mimeType: 'image/jpeg', sizeBytes: 950000 },
  }}
/>
```

---

## 🔧 **Integration with Admin Pages**

### **Proofs Page:**
```tsx
// In table cell
<PreviewThumbStack
  objectKeys={proof.images}
  onClick={() => {
    setSelectedProof(proof);
    setGalleryOpen(true);
  }}
/>

// In detail modal
<ImageGallery
  objectKeys={selectedProof.images}
  open={galleryOpen}
  onOpenChange={setGalleryOpen}
/>
```

### **Verifications Page:**
```tsx
// In verification drawer/modal
<IDVerificationPreview
  frontObjectKey={verification.idFrontObjectKey}
  backObjectKey={verification.idBackObjectKey}
/>
```

---

## ⚡ **Performance Optimizations**

### **1. Caching:**
- Signed URLs cached for 60 seconds
- Prevents excessive backend requests
- Automatic refetch before expiry

### **2. Batch Fetching:**
- Gallery fetches all URLs at once
- Reduces sequential requests
- Better UX (no loading per image)

### **3. Lazy Loading:**
- Thumbnails only fetch when visible
- Gallery only fetches when opened
- Reduces initial page load

---

## 🛡️ **Security Best Practices**

### **✅ Implemented:**
- Never store signed URLs permanently
- Always request fresh URLs when needed
- Don't expose object keys in public URLs
- Backend validates role before signing
- Short expiry (2 minutes)
- HTTPS in production

### **❌ Avoid:**
- Storing signed URLs in localStorage
- Sharing signed URLs between users
- Using signed URLs after expiry
- Exposing object keys in client-side code

---

## 🧪 **Testing**

### **1. Test Thumbnail Loading:**
```tsx
// Should show skeleton → image
<PreviewThumb objectKey="valid-key" />

// Should show error → retry button
<PreviewThumb objectKey="invalid-key" />
```

### **2. Test Gallery:**
```tsx
// Should fetch all URLs on open
<ImageGallery objectKeys={[...]} open={true} />

// Should navigate between images
// Click next/prev buttons

// Should download image
// Click download button
```

### **3. Test Expiry:**
```tsx
// Wait 2 minutes
// Signed URL should expire
// Component should auto-refetch
```

---

## 🔍 **Troubleshooting**

### **Image Not Loading:**
1. Check object key is correct
2. Verify backend is running
3. Check user has permission
4. Verify MinIO is accessible
5. Check browser console for errors

### **403 Forbidden:**
- User doesn't have permission
- Check role (ADMIN/STAFF required)
- Verify access token is valid

### **Signed URL Expired:**
- URLs expire in 2 minutes
- Component should auto-refetch
- Check React Query cache settings

### **Slow Loading:**
- Check MinIO network latency
- Verify signed URL generation is fast
- Consider CDN for production

---

## 📊 **Data Flow Example**

### **Proof Preview:**
```typescript
// 1. Backend returns proof data
{
  id: 'proof-123',
  jobId: 'job-456',
  images: [
    'dev/job_proof/user-123/job-456/uuid1.jpg',
    'dev/job_proof/user-123/job-456/uuid2.jpg',
  ],
}

// 2. Component renders thumbnails
<PreviewThumbStack objectKeys={proof.images} />

// 3. Hook fetches signed URLs
GET /api/storage/preview?objectKey=dev/job_proof/...

// 4. Backend validates and signs
if (user.role === 'ADMIN' || user.role === 'STAFF') {
  return generateSignedUrl(objectKey);
}

// 5. Frontend displays images
<Image src={signedUrl} />
```

---

## 🎉 **Summary**

The Admin Image Preview system is **production-ready** with:
- ✅ Secure signed URLs (2min expiry)
- ✅ RBAC enforcement
- ✅ Caching and performance optimization
- ✅ Beautiful UI with shadcn
- ✅ Error handling and retry
- ✅ Gallery with navigation
- ✅ Download support
- ✅ Metadata display

**All images are secure and never publicly accessible!** 🔐
