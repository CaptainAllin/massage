# File Storage Strategy - Cost-Effective Solution

## 📊 Storage Requirements Analysis

### What You Need to Store

Based on your PRD, you'll need to store:

1. **User Profile Images** (~500KB each)
   - Therapist photos
   - Client photos
   - Business logos

2. **Client Documents** (~2-5MB each)
   - Intake forms (PDF)
   - Medical records (PDF)
   - Consent forms (PDF, signed)
   - Insurance documents (PDF/images)

3. **Before/After Photos** (~2-3MB each)
   - Progress tracking images
   - Body condition photos
   - Treatment area photos

4. **Business Branding** (~1-2MB each)
   - Logos
   - Marketing materials
   - Email templates with images

### Usage Estimates (MVP)

**Assumptions:**
- 100 businesses (clinics)
- 5 therapists per business
- 500 clients total
- 20 appointments/day across all businesses
- 30% of appointments have document uploads

**Monthly Storage Needs:**
- Profile images: 605 users × 500KB = ~300MB
- Client documents: 500 clients × 3 docs × 3MB = ~4.5GB
- Progress photos: 150 uploads/mo × 2.5MB = ~375MB
- Business branding: 100 × 5MB = 500MB

**Total**: ~5.7GB/month (first year)
**Year 2**: ~20GB (with growth)

---

## 💰 Storage Provider Comparison (2026 Pricing)

### Option 1: Supabase Storage (RECOMMENDED ✅)

**Pricing:**
- **Free Tier**: 1GB storage, 2GB bandwidth/month
- **Pro**: $25/mo → 100GB storage, 200GB bandwidth
- **Scaling**: $0.021/GB storage, $0.09/GB bandwidth (beyond Pro limits)

**Pros:**
- ✅ Integrated with auth (RLS policies)
- ✅ CDN included
- ✅ Image transformations (resize, crop)
- ✅ No separate auth system needed
- ✅ Simple API (already using Supabase)
- ✅ Automatic backups
- ✅ Presigned URLs for secure access

**Cons:**
- ❌ More expensive at very high scale (100GB+)

**Cost for Your Use Case:**
- **MVP (< 1GB)**: $0/month (free tier)
- **Year 1 (6GB)**: $25/month (Pro plan)
- **Year 2 (20GB)**: $25/month (Pro plan)
- **Year 5 (150GB)**: $25 + $1.05 = $26.05/month

**Best for**: Integrated systems, you're using Supabase already ✅

---

### Option 2: Cloudflare R2

**Pricing:**
- **Storage**: $0.015/GB/month
- **Bandwidth**: FREE (egress)
- **Operations**: $4.50 per million writes, $0.36 per million reads
- **Minimum**: No minimum, pay for what you use

**Pros:**
- ✅ Cheapest storage cost
- ✅ FREE bandwidth (huge savings)
- ✅ S3-compatible API
- ✅ No egress fees
- ✅ Fast global CDN

**Cons:**
- ❌ Separate auth system needed
- ❌ No built-in image transformations
- ❌ More setup complexity
- ❌ Need to manage access control separately

**Cost for Your Use Case:**
- **MVP (1GB)**: $0.015/month
- **Year 1 (6GB)**: $0.09/month
- **Year 2 (20GB)**: $0.30/month
- **Year 5 (150GB)**: $2.25/month

**Best for**: Cost optimization at scale, already have separate storage needs

---

### Option 3: AWS S3

**Pricing:**
- **Storage**: $0.023/GB/month (Standard)
- **Bandwidth**: $0.09/GB egress (after 100GB/mo free)
- **Operations**: $0.005 per 1,000 PUT, $0.0004 per 1,000 GET
- **Minimum**: No minimum

**Pros:**
- ✅ Industry standard
- ✅ Extremely reliable (99.999999999% durability)
- ✅ Comprehensive features
- ✅ Good documentation
- ✅ CloudFront CDN integration

**Cons:**
- ❌ Complex pricing
- ❌ Expensive bandwidth
- ❌ Requires AWS expertise
- ❌ Separate auth management

**Cost for Your Use Case:**
- **MVP (1GB)**: $0.023/mo storage + ~$0.20/mo bandwidth = $0.22/month
- **Year 1 (6GB)**: $0.14 + ~$5/mo bandwidth = $5.14/month
- **Year 2 (20GB)**: $0.46 + ~$18/mo bandwidth = $18.46/month
- **Year 5 (150GB)**: $3.45 + ~$135/mo bandwidth = $138.45/month

**Best for**: Enterprise, complex requirements, need AWS ecosystem

---

### Option 4: UploadThing

**Pricing:**
- **Free**: 2GB storage, 2GB bandwidth
- **Pro**: $10/mo → 100GB storage, 100GB bandwidth
- **Scaling**: $0.10/GB storage, $0.10/GB bandwidth (overage)

**Pros:**
- ✅ Dead simple API
- ✅ Built for Next.js
- ✅ File upload UI components
- ✅ Automatic image optimization
- ✅ Type-safe
- ✅ Webhook events

**Cons:**
- ❌ More expensive than R2/S3 at scale
- ❌ Less control than raw storage
- ❌ Vendor lock-in

**Cost for Your Use Case:**
- **MVP (< 2GB)**: $0/month (free tier)
- **Year 1 (6GB)**: $10/month (Pro plan)
- **Year 2 (20GB)**: $10/month (Pro plan)
- **Year 5 (150GB)**: $10 + $5 = $15/month

**Best for**: Fast prototyping, developer experience focus

---

### Option 5: Vercel Blob

**Pricing:**
- **Hobby**: $0 → No storage
- **Pro**: $20/mo base + $0.15/GB storage + $0.15/GB bandwidth
- **Minimum**: $20/month (Pro plan required)

**Pros:**
- ✅ Native Vercel integration
- ✅ Edge-optimized
- ✅ Simple API
- ✅ Automatic CDN

**Cons:**
- ❌ Most expensive option
- ❌ Requires Vercel Pro
- ❌ Limited features vs competitors

**Cost for Your Use Case:**
- **MVP (1GB)**: $20 + $0.15 + $0.15 = $20.30/month
- **Year 1 (6GB)**: $20 + $0.90 + $0.90 = $21.80/month
- **Year 2 (20GB)**: $20 + $3 + $3 = $26/month
- **Year 5 (150GB)**: $20 + $22.50 + $22.50 = $65/month

**Best for**: Already on Vercel Pro, need tight integration

---

## 🏆 Cost Comparison Summary

| Provider | Year 1 (6GB) | Year 2 (20GB) | Year 5 (150GB) | Best For |
|----------|--------------|---------------|----------------|----------|
| **Supabase** ✅ | $25/mo | $25/mo | $26/mo | Integrated auth/DB/storage |
| **Cloudflare R2** | $0.09/mo | $0.30/mo | $2.25/mo | Lowest cost at scale |
| **AWS S3** | $5.14/mo | $18.46/mo | $138/mo | Enterprise needs |
| **UploadThing** | $10/mo | $10/mo | $15/mo | Fast development |
| **Vercel Blob** | $21.80/mo | $26/mo | $65/mo | Vercel-only apps |

---

## 🎯 RECOMMENDATION: Hybrid Approach

### **Best Strategy for Your Project:**

**Use Supabase Storage for everything**

### Why This is Best:

1. **Unified System**
   - Auth, database, storage all in one platform
   - Single source of truth
   - RLS policies apply to files
   - No sync issues

2. **Cost-Effective for MVP**
   - Free for first 1GB
   - Only $25/mo for first few years
   - Predictable pricing
   - No bandwidth surprises

3. **Built-in Security**
   - Row Level Security on buckets
   - Signed URLs automatically
   - Access control via policies
   - HIPAA-ready infrastructure

4. **Developer Experience**
   - Same SDK for auth + DB + storage
   - TypeScript support
   - Easy to use
   - Great documentation

5. **Performance**
   - Global CDN included
   - Image transformations
   - Automatic optimization
   - Fast delivery

### When to Switch:

If you reach **200GB+ storage** and **>1TB bandwidth/month**, consider:
- Migrate large files (progress photos, PDFs) to Cloudflare R2
- Keep profile images and critical files on Supabase
- Use hybrid approach with smart routing

**But this won't happen until Year 3-4 at earliest**

---

## 🔧 Implementation Guide

### 1. Supabase Storage Setup

#### Create Storage Buckets

```sql
-- In Supabase SQL Editor

-- 1. Profile images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true);

-- 2. Client documents bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- 3. Progress photos bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', false);

-- 4. Business branding bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true);
```

#### Storage RLS Policies

```sql
-- ============================================================
-- PROFILE IMAGES BUCKET (Public read, owner write)
-- ============================================================

-- Anyone can view profile images
CREATE POLICY "Public can view profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');

-- Users can upload their own profile image
CREATE POLICY "Users can upload own profile image"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profiles'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own profile image
CREATE POLICY "Users can update own profile image"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profiles'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- DOCUMENTS BUCKET (Private, business-level access)
-- ============================================================

-- Staff can view documents in their business
CREATE POLICY "Staff can view business documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.users u
      LEFT JOIN public.therapists t ON t."userId" = u.id
      LEFT JOIN public.businesses b ON b.id = t."businessId" OR b."ownerId" = u.id
      WHERE u."authUserId" = auth.uid()
      AND b.id::text = (storage.foldername(name))[1]
    )
  );

-- Staff can upload documents
CREATE POLICY "Staff can upload business documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.users u
      LEFT JOIN public.therapists t ON t."userId" = u.id
      LEFT JOIN public.businesses b ON b.id = t."businessId" OR b."ownerId" = u.id
      WHERE u."authUserId" = auth.uid()
      AND b.id::text = (storage.foldername(name))[1]
    )
  );

-- Clients can view their own documents
CREATE POLICY "Clients can view own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.clients c ON c."userId" = u.id
      WHERE u."authUserId" = auth.uid()
      AND c.id::text = (storage.foldername(name))[2]
    )
  );

-- ============================================================
-- PROGRESS PHOTOS BUCKET (Private, client-specific)
-- ============================================================

-- Therapists can view progress photos for their clients
CREATE POLICY "Therapists can view client progress photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'progress-photos'
    AND EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.therapists t ON t."userId" = u.id
      JOIN public.clients c ON c."businessId" = t."businessId"
      WHERE u."authUserId" = auth.uid()
      AND c.id::text = (storage.foldername(name))[2]
    )
  );

-- Therapists can upload progress photos
CREATE POLICY "Therapists can upload progress photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.therapists t ON t."userId" = u.id
      WHERE u."authUserId" = auth.uid()
    )
  );

-- ============================================================
-- BRANDING BUCKET (Public read, business owner write)
-- ============================================================

-- Anyone can view branding assets
CREATE POLICY "Public can view branding"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'branding');

-- Business owners can upload branding
CREATE POLICY "Business owners can upload branding"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'branding'
    AND EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.businesses b ON b."ownerId" = u.id
      WHERE u."authUserId" = auth.uid()
      AND b.id::text = (storage.foldername(name))[1]
    )
  );
```

---

### 2. Upload Service (NestJS)

**File**: `services/api/src/common/storage/storage.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface UploadOptions {
  bucket: string;
  path: string;
  file: Buffer;
  contentType?: string;
  cacheControl?: string;
}

@Injectable()
export class StorageService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(options: UploadOptions): Promise<string> {
    const { bucket, path, file, contentType, cacheControl } = options;

    const { data, error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .upload(path, file, {
        contentType,
        cacheControl: cacheControl || '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    return this.getPublicUrl(bucket, data.path);
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase
      .getClient()
      .storage.from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Get signed URL for private files (expires in 1 hour)
   */
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Delete file
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(bucket: string, folder: string) {
    const { data, error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .list(folder);

    if (error) {
      throw new Error(`List failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Upload profile image with resizing
   */
  async uploadProfileImage(
    userId: string,
    file: Buffer,
    contentType: string
  ): Promise<string> {
    const path = `${userId}/avatar.${contentType.split('/')[1]}`;

    return this.uploadFile({
      bucket: 'profiles',
      path,
      file,
      contentType,
      cacheControl: '86400', // 24 hours
    });
  }

  /**
   * Upload client document
   */
  async uploadClientDocument(
    businessId: string,
    clientId: string,
    fileName: string,
    file: Buffer,
    contentType: string
  ): Promise<string> {
    const path = `${businessId}/${clientId}/${Date.now()}-${fileName}`;

    return this.uploadFile({
      bucket: 'documents',
      path,
      file,
      contentType,
    });
  }

  /**
   * Upload progress photo
   */
  async uploadProgressPhoto(
    businessId: string,
    clientId: string,
    fileName: string,
    file: Buffer,
    contentType: string
  ): Promise<string> {
    const path = `${businessId}/${clientId}/${Date.now()}-${fileName}`;

    return this.uploadFile({
      bucket: 'progress-photos',
      path,
      file,
      contentType,
    });
  }

  /**
   * Upload business logo
   */
  async uploadBusinessLogo(
    businessId: string,
    file: Buffer,
    contentType: string
  ): Promise<string> {
    const path = `${businessId}/logo.${contentType.split('/')[1]}`;

    return this.uploadFile({
      bucket: 'branding',
      path,
      file,
      contentType,
      cacheControl: '86400', // 24 hours
    });
  }
}
```

---

### 3. Frontend Upload Component

**File**: `apps/web/components/FileUpload.tsx`

```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@massage/ui';

interface FileUploadProps {
  bucket: string;
  path: string;
  accept?: string;
  maxSize?: number; // in MB
  onUpload: (url: string) => void;
  onError?: (error: string) => void;
}

export function FileUpload({
  bucket,
  path,
  accept = 'image/*',
  maxSize = 5,
  onUpload,
  onError,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      onError?.(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Upload file
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${path}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onUpload(urlData.publicUrl);
      setProgress(100);
    } catch (error: any) {
      onError?.(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept={accept}
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload">
        <Button as="span" disabled={uploading} loading={uploading}>
          {uploading ? `Uploading... ${progress}%` : 'Choose File'}
        </Button>
      </label>
    </div>
  );
}
```

---

### 4. Image Transformation (Supabase)

Supabase includes automatic image transformations:

```typescript
// Get resized image
const imageUrl = supabase.storage
  .from('profiles')
  .getPublicUrl('user-123/avatar.jpg', {
    transform: {
      width: 200,
      height: 200,
      resize: 'cover',
      quality: 80,
    },
  }).data.publicUrl;

// Multiple sizes for responsive images
const sizes = {
  thumbnail: { width: 100, height: 100 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
};
```

---

## 📁 Folder Structure Best Practices

```
supabase-storage/
├── profiles/
│   ├── {userId}/
│   │   ├── avatar.jpg
│   │   └── avatar-thumb.jpg
│
├── documents/
│   ├── {businessId}/
│   │   ├── {clientId}/
│   │   │   ├── intake-form-{timestamp}.pdf
│   │   │   ├── consent-{timestamp}.pdf
│   │   │   └── insurance-{timestamp}.jpg
│
├── progress-photos/
│   ├── {businessId}/
│   │   ├── {clientId}/
│   │   │   ├── before-{timestamp}.jpg
│   │   │   ├── after-{timestamp}.jpg
│   │   │   └── progress-{timestamp}.jpg
│
└── branding/
    ├── {businessId}/
    │   ├── logo.png
    │   ├── header.jpg
    │   └── email-template.jpg
```

---

## 🔒 Security Best Practices

### 1. File Validation

```typescript
// Validate file types
const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}

// Validate file size
const maxSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxSize) {
  throw new Error('File too large');
}

// Sanitize filename
const sanitizedName = file.name
  .replace(/[^a-zA-Z0-9.-]/g, '_')
  .toLowerCase();
```

### 2. Signed URLs for Sensitive Files

```typescript
// Generate temporary access (1 hour)
const signedUrl = await storageService.getSignedUrl(
  'documents',
  'business-123/client-456/medical-record.pdf',
  3600
);

// Use signed URL in frontend
<a href={signedUrl} download>Download Document</a>
```

### 3. Virus Scanning (Optional)

For production, consider integrating ClamAV or cloud scanning:

```typescript
import { ClamScan } from 'clamscan';

async function scanFile(buffer: Buffer) {
  const clamscan = new ClamScan();
  const { isInfected } = await clamscan.scanBuffer(buffer);
  if (isInfected) {
    throw new Error('File contains malware');
  }
}
```

---

## 📈 Optimization Tips

### 1. Lazy Loading Images

```typescript
<img
  src={imageUrl}
  loading="lazy"
  alt="Client photo"
/>
```

### 2. Progressive Image Loading

```typescript
// Generate blur placeholder
const blurUrl = supabase.storage
  .from('progress-photos')
  .getPublicUrl('path/to/image.jpg', {
    transform: {
      width: 20,
      height: 20,
      quality: 10,
    },
  }).data.publicUrl;

// Use with next/image
<Image
  src={imageUrl}
  placeholder="blur"
  blurDataURL={blurUrl}
  alt="Progress photo"
/>
```

### 3. CDN Caching

```typescript
// Set long cache times for static assets
const { data } = await supabase.storage
  .from('branding')
  .upload(path, file, {
    cacheControl: '31536000', // 1 year
  });
```

---

## 🚀 Future Scalability

### When to Migrate to Hybrid Storage

**Triggers:**
- > 200GB total storage
- > 1TB bandwidth/month
- > $50/month Supabase storage costs

**Migration Strategy:**
1. Keep critical files on Supabase (profiles, recent documents)
2. Move large files to Cloudflare R2 (progress photos, old PDFs)
3. Use smart routing based on file age/type
4. Implement background migration job

**Code:**
```typescript
// Storage router
function getStorageProvider(fileType: string, fileAge: number) {
  // Recent files or critical types → Supabase
  if (fileAge < 90 || fileType === 'profile') {
    return supabaseStorage;
  }
  // Old or large files → Cloudflare R2
  return r2Storage;
}
```

---

## ✅ Implementation Checklist

- [ ] Create Supabase storage buckets
- [ ] Configure RLS policies
- [ ] Implement StorageService in NestJS
- [ ] Create FileUpload component
- [ ] Add file validation
- [ ] Implement signed URLs for private files
- [ ] Test upload/download flows
- [ ] Add image transformations
- [ ] Configure CDN caching
- [ ] Add progress indicators
- [ ] Test RLS policies with different roles
- [ ] Monitor storage usage

---

## 📚 Additional Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)
- [Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
- [CDN Caching](https://supabase.com/docs/guides/storage/cdn)

---

## 💡 Summary

**Recommended Stack:**
- **Supabase Storage** for everything (auth, DB, storage unified)
- **Cost**: $0 (MVP) → $25/mo (Year 1-2) → ~$26/mo (Year 5)
- **Migration**: None needed until 200GB+ (Year 3-4)
- **Security**: RLS policies, signed URLs, integrated with auth
- **Performance**: Global CDN, image transformations, fast delivery

**This gives you the best balance of cost, simplicity, and scalability for your wellness CRM platform.**
