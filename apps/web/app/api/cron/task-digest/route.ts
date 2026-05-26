import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { res } from '@/lib/api-auth';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

// Runs daily at 8am. Sends each staff member their tasks due today.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) return res.unauthorized('Invalid cron secret');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Tasks due today that are not done, grouped by assignedTo user
  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { gte: todayStart, lte: todayEnd },
      status: { not: 'DONE' },
      assignedToId: { not: null },
    },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      relatedClient: { select: { firstName: true, lastName: true } },
      business: { select: { name: true } },
    },
    orderBy: { priority: 'asc' },
  });

  // Group tasks by assignee email
  const byUser = new Map<string, { name: string; email: string; tasks: typeof tasks }>();
  for (const task of tasks) {
    if (!task.assignedTo?.email) continue;
    const key = task.assignedTo.email;
    if (!byUser.has(key)) {
      byUser.set(key, {
        name: `${task.assignedTo.firstName ?? ''} ${task.assignedTo.lastName ?? ''}`.trim(),
        email: key,
        tasks: [],
      });
    }
    byUser.get(key)!.tasks.push(task);
  }

  let sent = 0;
  for (const { name, email, tasks: userTasks } of byUser.values()) {
    const rows = userTasks.map((t) => {
      const client = t.relatedClient ? ` — ${t.relatedClient.firstName} ${t.relatedClient.lastName}` : '';
      const priority = t.priority.charAt(0) + t.priority.slice(1).toLowerCase();
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${t.title}${client}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666">${priority}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666">${t.business.name}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#1a1a1a}
.card{background:#fff;border-radius:8px;max-width:600px;margin:0 auto;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
h1{font-size:20px;font-weight:700;margin:0 0 4px}
.meta{color:#666;font-size:13px;margin:0 0 24px}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;padding:8px 12px;background:#f9f9f9;font-weight:600;color:#444;border-bottom:2px solid #e5e5e5}
.footer{margin-top:24px;font-size:12px;color:#999}
</style></head>
<body><div class="card">
<h1>Your tasks for today</h1>
<p class="meta">Hi ${name} — you have ${userTasks.length} task${userTasks.length === 1 ? '' : 's'} due today.</p>
<table>
  <tr><th>Task</th><th>Priority</th><th>Practice</th></tr>
  ${rows}
</table>
<p class="footer">Iris Care Suite &mdash; Task Digest</p>
</div></body></html>`;

    await resend.emails.send({
      from: FROM,
      to: [email],
      subject: `You have ${userTasks.length} task${userTasks.length === 1 ? '' : 's'} due today`,
      html,
    });
    sent++;
  }

  return Response.json({ success: true, emailsSent: sent });
}
