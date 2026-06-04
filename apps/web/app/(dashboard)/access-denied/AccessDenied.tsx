'use client';

import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { PERMISSION_LABELS } from '@/lib/permissions';

interface AccessDeniedProps {
  permission?: string;
}

export default function AccessDenied({ permission }: AccessDeniedProps) {
  const label = permission ? PERMISSION_LABELS[permission] : undefined;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div
        className="h-16 w-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(93,74,168,0.08)' }}
      >
        <ShieldOff className="h-8 w-8" style={{ color: '#5D4AA8' }} />
      </div>

      <div className="space-y-2">
        <h1
          className="text-xl font-semibold"
          style={{ color: '#1E1830', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          Access denied
        </h1>
        <p className="text-sm max-w-sm" style={{ color: '#7A7090' }}>
          {label
            ? `You don't have permission to "${label}". Ask your business owner if you need access.`
            : "You don't have permission to view this page. Ask your business owner if you need access."}
        </p>
      </div>

      <Link
        href="/dashboard"
        className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        style={{
          background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)',
          color: '#fff',
        }}
      >
        Back to dashboard
      </Link>
    </div>
  );
}
