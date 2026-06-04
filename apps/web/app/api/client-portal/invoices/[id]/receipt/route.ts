import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { res } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization') ?? req.cookies.get('sb-access-token')?.value;
    // Try cookie-based auth for browser navigation
    const supabase = createServiceClient();
    let userEmail: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const { data } = await supabase.auth.getUser(authHeader.substring(7));
      userEmail = data.user?.email ?? null;
    } else {
      const { data } = await supabase.auth.getUser();
      userEmail = data.user?.email ?? null;
    }

    if (!userEmail) return res.unauthorized();

    const client = await prisma.client.findFirst({ where: { email: userEmail }, select: { id: true } });
    if (!client) return res.notFound();

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { business: { select: { name: true, email: true } }, client: { select: { firstName: true, lastName: true, email: true } } },
    });

    if (!invoice || invoice.clientId !== client.id) return res.notFound();

    const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems as any[] : [];
    const statusColor = invoice.status === 'PAID' ? '#065F46' : invoice.status === 'OVERDUE' ? '#92400E' : '#1E40AF';

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice #${invoice.invoiceNumber}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 24px; color: #1a1a1a; }
  .card { background: #fff; border-radius: 8px; max-width: 640px; margin: 0 auto; padding: 40px; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .business { font-size: 18px; font-weight: 700; }
  .status { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; color: ${statusColor}; background: ${statusColor}18; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
  .meta-item label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: .5px; }
  .meta-item p { font-size: 14px; margin: 2px 0 0; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #888; padding: 8px 0; border-bottom: 1px solid #eee; }
  td { padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f5f5f5; }
  td:last-child, th:last-child { text-align: right; }
  .totals { margin-left: auto; width: 240px; }
  .totals .row { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; color: #555; }
  .totals .total { font-size: 16px; font-weight: 700; color: #1a1a1a; padding-top: 8px; border-top: 2px solid #1a1a1a; }
  .footer { margin-top: 32px; font-size: 12px; color: #aaa; text-align: center; }
  @media print { body { background: #fff; padding: 0; } .card { box-shadow: none; padding: 24px; } }
</style></head>
<body>
<div class="card">
  <div class="header">
    <div>
      <div class="business">${invoice.business.name}</div>
      <div style="font-size:12px;color:#888;margin-top:2px">Invoice #${invoice.invoiceNumber}</div>
    </div>
    <span class="status">${invoice.status}</span>
  </div>
  <div class="meta">
    <div class="meta-item"><label>Billed to</label><p>${invoice.client.firstName} ${invoice.client.lastName}</p>${invoice.client.email ? `<p style="font-size:12px;color:#888">${invoice.client.email}</p>` : ''}</div>
    <div class="meta-item"><label>Issue date</label><p>${invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date(invoice.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
    ${invoice.dueDate ? `<div class="meta-item"><label>Due date</label><p>${new Date(invoice.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>` : ''}
    ${invoice.paidAt ? `<div class="meta-item"><label>Paid on</label><p>${new Date(invoice.paidAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>` : ''}
  </div>
  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
    <tbody>
      ${lineItems.map((li: any) => `<tr><td>${li.description ?? ''}</td><td>${li.quantity ?? 1}</td><td>${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(li.unitPrice ?? 0)}</td><td>${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format((li.total ?? (li.unitPrice ?? 0) * (li.quantity ?? 1)))}</td></tr>`).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(invoice.subtotal)}</span></div>
    ${invoice.taxAmount > 0 ? `<div class="row"><span>Tax</span><span>${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(invoice.taxAmount)}</span></div>` : ''}
    ${invoice.discountAmount > 0 ? `<div class="row"><span>Discount</span><span>-${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(invoice.discountAmount)}</span></div>` : ''}
    <div class="row total"><span>Total</span><span>${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(invoice.total)}</span></div>
    ${invoice.amountPaid > 0 ? `<div class="row" style="color:#065F46"><span>Amount paid</span><span>${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(invoice.amountPaid)}</span></div>` : ''}
    ${invoice.amountDue > 0 ? `<div class="row" style="font-weight:600"><span>Balance due</span><span>${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(invoice.amountDue)}</span></div>` : ''}
  </div>
  ${invoice.notes ? `<div style="margin-top:24px;padding:16px;background:#f9f9f9;border-radius:6px;font-size:13px;color:#555">${invoice.notes}</div>` : ''}
  <div class="footer">Powered by Iris Care Suite</div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body></html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('[RECEIPT]', err);
    return res.error();
  }
}
