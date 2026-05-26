import { NextRequest } from 'next/server';
import { requireAuth, res, AuthError } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { TaskPriority, TaskStatus } from '@prisma/client';

const taskInclude = {
  assignedTo: { select: { id: true, firstName: true, lastName: true, profileImageUrl: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  relatedClient: { select: { id: true, firstName: true, lastName: true } },
  relatedAppointment: { select: { id: true, startTime: true, serviceType: true } },
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { businessId, title, description, assignedToId, dueDate, priority, status, relatedClientId, relatedAppointmentId } = body;

    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.task.findFirst({ where: { id: params.id, businessId } });
    if (!existing) return res.notFound('Task not found');

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) data.priority = priority as TaskPriority;
    if (relatedClientId !== undefined) data.relatedClientId = relatedClientId || null;
    if (relatedAppointmentId !== undefined) data.relatedAppointmentId = relatedAppointmentId || null;
    if (status !== undefined) {
      data.status = status as TaskStatus;
      if (status === TaskStatus.DONE && existing.status !== TaskStatus.DONE) {
        data.completedAt = new Date();
      } else if (status !== TaskStatus.DONE) {
        data.completedAt = null;
      }
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data,
      include: taskInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'TASK_UPDATED',
        entityType: 'Task',
        entityId: params.id,
        metadata: { changes: Object.keys(data) },
      },
    });

    return res.ok(task, 'Task updated');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return res.badRequest('businessId is required');

    const existing = await prisma.task.findFirst({ where: { id: params.id, businessId } });
    if (!existing) return res.notFound('Task not found');

    await prisma.task.delete({ where: { id: params.id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        businessId,
        action: 'TASK_DELETED',
        entityType: 'Task',
        entityId: params.id,
        metadata: { title: existing.title },
      },
    });

    return res.ok(null, 'Task deleted');
  } catch (err) {
    if (err instanceof AuthError) return res.unauthorized(err.message);
    return res.error();
  }
}
