'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugPage() {
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
        <p>Loading user info...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🔍 Debug Information</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Supabase User Info</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID (Copy this!)
            </label>
            <div className="flex gap-2">
              <code className="flex-1 bg-gray-100 p-3 rounded font-mono text-sm break-all">
                {user.id}
              </code>
              <button
                onClick={() => copyToClipboard(user.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <code className="block bg-gray-100 p-3 rounded font-mono text-sm">
              {user.email}
            </code>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created At
            </label>
            <code className="block bg-gray-100 p-3 rounded font-mono text-sm">
              {new Date(user.created_at).toLocaleString()}
            </code>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">📝 Next Steps</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Copy your User ID above</li>
          <li>
            Open Terminal and run:
            <code className="block bg-white p-2 rounded mt-1 ml-6">
              cd packages/database && npx tsx prisma/link-user.ts
            </code>
          </li>
          <li>Paste your User ID when prompted</li>
          <li>Refresh the app to see your data!</li>
        </ol>
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Full User Object</h3>
        <pre className="bg-white p-4 rounded overflow-auto text-xs">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
}
