import { withAuth, res } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { TaskPriority, TaskStatus } from '@prisma/client';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) return res.badRequest('businessId is required');

  const assignedToId = searchParams.get('assignedToId');
  const status = searchParams.get('status') as TaskStatus | null;
  const priority = searchParams.get('priority') as TaskPriority | null;
  const dueBefore = searchParams.get('dueBefore');
  const dueAfter = searchParams.get('dueAfter');
  const relatedClientId = searchParams.get('relatedClientId');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const where: any = { businessId };
  if (assignedToId) where.assignedToId = assignedToId;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (relatedClientId) where.relatedClientId = relatedClientId;
  if (dueBefore || dueAfter) {
    where.dueDate = {};
    if (dueBefore) where.dueDate.lte = new Date(dueBefore);
    if (dueAfter) where.dueDate.gte = new Date(dueAfter);
  }

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, profileImageUrl: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        relatedClient: { select: { id: true, firstName: true, lastName: true } },
        relatedAppointment: { select: { id: true, startTime: true, serviceType: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return Response.json({
    success: true,
    data: tasks,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const { businessId, assignedToId, title, description, dueDate, priority, relatedClientId, relatedAppointmentId } = body;

  if (!businessId || !title) return res.badRequest('businessId and title are required');

  const task = await prisma.task.create({
    data: {
      businessId,
      createdById: user.id,
      assignedToId: assignedToId || null,
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: (priority as TaskPriority) || TaskPriority.MEDIUM,
      relatedClientId: relatedClientId || null,
      relatedAppointmentId: relatedAppointmentId || null,
    },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true, profileImageUrl: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      relatedClient: { select: { id: true, firstName: true, lastName: true } },
      relatedAppointment: { select: { id: true, startTime: true, serviceType: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      businessId,
      action: 'TASK_CREATED',
      entityType: 'Task',
      entityId: task.id,
      metadata: { title, assignedToId, priority },
    },
  });

  return res.created(task, 'Task created');
});
