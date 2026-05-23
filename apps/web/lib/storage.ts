import { createClient } from '@/lib/supabase/client';

export const BUCKETS = {
  PROFILES: 'profiles',
  DOCUMENTS: 'documents',
  PROGRESS_PHOTOS: 'progress-photos',
  BRANDING: 'branding',
} as const;

export type Bucket = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Upload a file and return its storage path */
export async function uploadFile(bucket: Bucket, path: string, file: File): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return data.path;
}

/** Get a public URL for files in public buckets (profiles, branding) */
export function getPublicUrl(bucket: Bucket, path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Get a short-lived signed URL for files in private buckets (documents, progress-photos) */
export async function getSignedUrl(
  bucket: Bucket,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}

/** Delete a file from storage */
export async function deleteFile(bucket: Bucket, path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/** Build the storage path for a profile image */
export function profilePath(authUserId: string, fileName: string): string {
  return `${authUserId}/${fileName}`;
}

/** Build the storage path for a branding asset */
export function brandingPath(businessId: string, fileName: string): string {
  return `${businessId}/${fileName}`;
}

/** Build the storage path for a client document */
export function documentPath(businessId: string, clientId: string, fileName: string): string {
  return `${businessId}/${clientId}/${fileName}`;
}

/** Build the storage path for a progress photo */
export function progressPhotoPath(businessId: string, clientId: string, fileName: string): string {
  return `${businessId}/${clientId}/${fileName}`;
}

/** Generate a unique filename with the original extension */
export function uniqueFileName(originalName: string): string {
  const ext = originalName.split('.').pop();
  const id = Math.random().toString(36).slice(2, 10);
  const ts = Date.now();
  return ext ? `${ts}-${id}.${ext}` : `${ts}-${id}`;
}
