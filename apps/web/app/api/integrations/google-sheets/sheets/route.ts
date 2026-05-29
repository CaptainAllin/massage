import { requireAuth, requireBusinessAccess, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');
    await requireBusinessAccess(user, businessId);

    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { googleAccessToken: true, googleRefreshToken: true } as any,
    }) as any;

    if (!biz?.googleAccessToken) return res.badRequest('Google Sheets not connected');

    let accessToken: string = biz.googleAccessToken;
    const driveUrl = 'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%22application%2Fvnd.google-apps.spreadsheet%22&fields=files(id%2Cname)&pageSize=50&orderBy=modifiedTime+desc';

    let driveRes = await fetch(driveUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (driveRes.status === 401 && biz.googleRefreshToken && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: biz.googleRefreshToken,
          grant_type: 'refresh_token',
        }),
      });
      const refreshData = await refreshRes.json() as { access_token?: string };
      if (refreshData.access_token) {
        accessToken = refreshData.access_token;
        await prisma.business.update({
          where: { id: businessId },
          data: { googleAccessToken: accessToken } as any,
        });
        driveRes = await fetch(driveUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    }

    if (!driveRes.ok) {
      const errText = await driveRes.text().catch(() => '');
      console.error('[google-sheets/sheets] Drive API error', driveRes.status, errText.slice(0, 200));
      return res.error('Failed to list Google Sheets');
    }

    const driveData = await driveRes.json() as { files?: { id: string; name: string }[] };
    return res.ok({ sheets: driveData.files ?? [] });
  } catch (err: any) {
    if (err?.name === 'AuthError') return res.unauthorized(err.message);
    console.error('[google-sheets/sheets]', err);
    return res.error();
  }
}
