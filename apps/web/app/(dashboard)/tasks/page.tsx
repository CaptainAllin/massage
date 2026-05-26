'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus, List, LayoutGrid, Trash2, CheckCircle2, Circle, Clock,
  AlertTriangle, X, Calendar, User, Tag,
} from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/lib/hooks/use-tasks';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { useClients } from '@/lib/hooks/use-clients';

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  LOW:    { label: 'Low',    color: '#6B7280', bg: '#F3F4F6' },
  MEDIUM: { label: 'Medium', color: '#1565C0', bg: '#E3F2FD' },
  HIGH:   { label: 'High',   color: '#C07C2F', bg: '#FFF3E0' },
  URGENT: { label: 'Urgent', color: '#C62828', bg: '#FFEBEE' },
};

const STATUS_COLUMNS = [
  { key: 'TODO',        label: 'To Do',       color: '#6B7280' },
  { key: 'IN_PROGRESS', label: 'In Progress',  color: '#1565C0' },
  { key: 'DONE',        label: 'Done',         color: '#2E7D32' },
];

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function isOverdue(task: any) {
  if (!task.dueDate || task.status === 'DONE') return false;
  return new Date(task.dueDate) < new Date();
}

function formatDue(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  businessId,
  onEdit,
}: {
  task: any;
  businessId: string;
  onEdit: (task: any) => void;
}) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const overdue = isOverdue(task);
  const isDone = task.status === 'DONE';

  const cycleStatus = () => {
    const next = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
    updateTask.mutate({ id: task.id, businessId, status: next });
  };

  return (
    <div
      className="bg-white border rounded-[12px] p-3.5 space-y-2 hover:shadow-sm transition-shadow cursor-pointer group"
      style={{ borderColor: overdue ? '#FFCDD2' : '#EFE9F2', opacity: isDone ? 0.65 : 1 }}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); cycleStatus(); }}
          className="mt-0.5 flex-shrink-0 transition-colors"
          title="Toggle status"
        >
          {isDone ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : task.status === 'IN_PROGRESS' ? (
            <Clock className="w-4 h-4 text-blue-600" />
          ) : (
            <Circle className="w-4 h-4 text-gray-400" />
          )}
        </button>
        <p className={`flex-1 text-[13px] font-medium leading-snug ${isDone ? 'line-through text-iris-muted' : 'text-iris-ink'}`}>
          {task.title}
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); deleteTask.mutate({ id: task.id, businessId }); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>

      {task.description && (
        <p className="text-[12px] text-iris-muted line-clamp-2 pl-6">{task.description}</p>
      )}

      <div className="flex items-center gap-2 pl-6 flex-wrap">
        <PriorityBadge priority={task.priority} />

        {task.dueDate && (
          <span
            className="inline-flex items-center gap-1 text-[11px]"
            style={{ color: overdue ? '#C62828' : '#6B7280' }}
          >
            {overdue && <AlertTriangle className="w-3 h-3" />}
            <Calendar className="w-3 h-3" />
            {formatDue(task.dueDate)}
          </span>
        )}

        {task.assignedTo && (
          <span className="inline-flex items-center gap-1 text-[11px] text-iris-muted">
            <User className="w-3 h-3" />
            {task.assignedTo.firstName} {task.assignedTo.lastName?.charAt(0)}.
          </span>
        )}

        {task.relatedClient && (
          <Link
            href={`/clients/${task.relatedClient.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] text-iris-purple hover:underline"
          >
            <Tag className="w-3 h-3" />
            {task.relatedClient.firstName} {task.relatedClient.lastName}
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────

function TaskModal({
  businessId,
  task,
  therapists,
  clients,
  onClose,
}: {
  businessId: string;
  task?: any;
  therapists: any[];
  clients: any[];
  onClose: () => void;
}) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [assignedToId, setAssignedToId] = useState(task?.assignedTo?.id ?? '');
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ''
  );
  const [priority, setPriority] = useState(task?.priority ?? 'MEDIUM');
  const [status, setStatus] = useState(task?.status ?? 'TODO');
  const [relatedClientId, setRelatedClientId] = useState(task?.relatedClient?.id ?? '');

  const isEditing = !!task;
  const isPending = createTask.isPending || updateTask.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      businessId,
      title,
      description: description || undefined,
      assignedToId: assignedToId || undefined,
      dueDate: dueDate || undefined,
      priority,
      status,
      relatedClientId: relatedClientId || undefined,
    };
    if (isEditing) {
      await updateTask.mutateAsync({ id: task.id, ...payload });
    } else {
      await createTask.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-[20px] w-full max-w-md shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-iris-ink">
            {isEditing ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-iris-surface">
            <X className="w-4 h-4 text-iris-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-iris-muted mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full border border-iris-line2 rounded-[10px] px-3 py-2 text-[13px] focus:outline-none focus:border-iris-purple"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-iris-muted mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional details"
              className="w-full border border-iris-line2 rounded-[10px] px-3 py-2 text-[13px] focus:outline-none focus:border-iris-purple resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-iris-muted mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-iris-line2 rounded-[10px] px-3 py-2 text-[13px] focus:outline-none focus:border-iris-purple"
              >
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-iris-muted mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-iris-line2 rounded-[10px] px-3 py-2 text-[13px] focus:outline-none focus:border-iris-purple"
              >
                {STATUS_COLUMNS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-iris-muted mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-iris-line2 rounded-[10px] px-3 py-2 text-[13px] focus:outline-none focus:border-iris-purple"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-iris-muted mb-1">Assign To</label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full border border-iris-line2 rounded-[10px] px-3 py-2 text-[13px] focus:outline-none focus:border-iris-purple"
              >
                <option value="">Unassigned</option>
                {therapists.map((t) => (
                  <option key={t.user.id} value={t.user.id}>
                    {t.user.firstName} {t.user.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-iris-muted mb-1">Linked Client</label>
            <select
              value={relatedClientId}
              onChange={(e) => setRelatedClientId(e.target.value)}
              className="w-full border border-iris-line2 rounded-[10px] px-3 py-2 text-[13px] focus:outline-none focus:border-iris-purple"
            >
              <option value="">None</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-iris-line2 rounded-[10px] px-4 py-2 text-[13px] font-medium text-iris-ink2 hover:bg-iris-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-[10px] px-4 py-2 text-[13px] font-semibold text-white transition-colors disabled:opacity-60"
              style={{ background: 'linear-gradient(90deg, #5D4AA8, #7665C2)' }}
            >
              {isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Kanban Column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  tasks,
  businessId,
  onEdit,
}: {
  column: (typeof STATUS_COLUMNS)[0];
  tasks: any[];
  businessId: string;
  onEdit: (task: any) => void;
}) {
  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: column.color }}
        />
        <span className="text-[13px] font-semibold text-iris-ink">{column.label}</span>
        <span
          className="ml-auto text-[11px] font-medium rounded-full px-2 py-0.5"
          style={{ background: '#EDE5F4', color: '#5D4AA8' }}
        >
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2.5 flex-1">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} businessId={businessId} onEdit={onEdit} />
        ))}
        {tasks.length === 0 && (
          <div className="border-2 border-dashed border-iris-line2 rounded-[12px] p-6 text-center text-[12px] text-iris-muted">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

// ── List Row ──────────────────────────────────────────────────────────────────

function ListRow({
  task,
  businessId,
  onEdit,
}: {
  task: any;
  businessId: string;
  onEdit: (task: any) => void;
}) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const overdue = isOverdue(task);
  const isDone = task.status === 'DONE';
  const statusCol = STATUS_COLUMNS.find((s) => s.key === task.status);

  return (
    <tr
      className="border-b border-iris-line2 hover:bg-iris-surface/50 cursor-pointer"
      onClick={() => onEdit(task)}
    >
      <td className="py-3 px-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const next = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
            updateTask.mutate({ id: task.id, businessId, status: next });
          }}
          title="Toggle status"
        >
          {isDone ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : task.status === 'IN_PROGRESS' ? (
            <Clock className="w-4 h-4 text-blue-600" />
          ) : (
            <Circle className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </td>
      <td className="py-3 px-4 max-w-[240px]">
        <p className={`text-[13px] font-medium truncate ${isDone ? 'line-through text-iris-muted' : 'text-iris-ink'}`}>
          {task.title}
        </p>
        {task.relatedClient && (
          <p className="text-[11px] text-iris-purple truncate mt-0.5">
            {task.relatedClient.firstName} {task.relatedClient.lastName}
          </p>
        )}
      </td>
      <td className="py-3 px-4">
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: `${statusCol?.color}18`, color: statusCol?.color }}
        >
          {statusCol?.label}
        </span>
      </td>
      <td className="py-3 px-4">
        <PriorityBadge priority={task.priority} />
      </td>
      <td className="py-3 px-4">
        {task.dueDate ? (
          <span
            className="flex items-center gap-1 text-[12px]"
            style={{ color: overdue ? '#C62828' : '#6B7280' }}
          >
            {overdue && <AlertTriangle className="w-3 h-3" />}
            {formatDue(task.dueDate)}
          </span>
        ) : (
          <span className="text-[12px] text-iris-muted">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        {task.assignedTo ? (
          <span className="text-[12px] text-iris-ink2">
            {task.assignedTo.firstName} {task.assignedTo.lastName}
          </span>
        ) : (
          <span className="text-[12px] text-iris-muted">Unassigned</span>
        )}
      </td>
      <td className="py-3 px-4">
        <button
          onClick={(e) => { e.stopPropagation(); deleteTask.mutate({ id: task.id, businessId }); }}
          className="p-1 rounded hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const businessId = useBusinessId();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const { data: tasksData, isLoading } = useTasks(businessId, {
    status: filterStatus || undefined,
    priority: filterPriority || undefined,
    assignedToId: filterAssignee || undefined,
    limit: 200,
  });

  const { data: therapistsData } = useTherapists(businessId, { isActive: true });
  const { data: clientsData } = useClients(businessId);

  const tasks: any[] = tasksData?.data ?? [];
  const therapists: any[] = therapistsData ?? [];
  const clients: any[] = clientsData ?? [];

  const today = new Date().toDateString();
  const dueTodayCount = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate).toDateString() === today && t.status !== 'DONE'
  ).length;
  const overdueCount = tasks.filter(isOverdue).length;

  const grouped = STATUS_COLUMNS.reduce<Record<string, any[]>>((acc, col) => {
    acc[col.key] = tasks.filter((t) => t.status === col.key);
    return acc;
  }, {});

  const openCreate = () => { setEditingTask(null); setShowModal(true); };
  const openEdit = (task: any) => { setEditingTask(task); setShowModal(true); };
  const closeModal = () => { setEditingTask(null); setShowModal(false); };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-iris-ink tracking-tight">Tasks</h1>
          <p className="text-[13px] text-iris-muted mt-0.5">
            Assign and track follow-up tasks for your team
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(90deg, #5D4AA8, #7665C2)' }}
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total',       value: tasks.length,                                   accent: undefined },
          { label: 'To Do',       value: grouped['TODO']?.length ?? 0,                   accent: '#6B7280' },
          { label: 'Due Today',   value: dueTodayCount,                                  accent: '#1565C0' },
          { label: 'Overdue',     value: overdueCount,                                   accent: overdueCount > 0 ? '#C62828' : undefined },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-iris-line2 rounded-[16px] px-5 py-4">
            <p className="text-[12px] text-iris-muted font-medium">{s.label}</p>
            <p className="text-[22px] font-semibold mt-1" style={{ color: s.accent ?? '#1E1830' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-iris-line2 rounded-[10px] px-3 py-1.5 text-[12px] text-iris-ink bg-white focus:outline-none focus:border-iris-purple"
        >
          <option value="">All Statuses</option>
          {STATUS_COLUMNS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-iris-line2 rounded-[10px] px-3 py-1.5 text-[12px] text-iris-ink bg-white focus:outline-none focus:border-iris-purple"
        >
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="border border-iris-line2 rounded-[10px] px-3 py-1.5 text-[12px] text-iris-ink bg-white focus:outline-none focus:border-iris-purple"
        >
          <option value="">All Assignees</option>
          {therapists.map((t) => (
            <option key={t.user.id} value={t.user.id}>
              {t.user.firstName} {t.user.lastName}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center border border-iris-line2 rounded-[10px] overflow-hidden bg-white">
          <button
            onClick={() => setViewMode('kanban')}
            className="px-3 py-1.5 transition-colors"
            style={viewMode === 'kanban' ? { background: '#EDE5F4', color: '#5D4AA8' } : { color: '#6B7280' }}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="px-3 py-1.5 transition-colors"
            style={viewMode === 'list' ? { background: '#EDE5F4', color: '#5D4AA8' } : { color: '#6B7280' }}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-[12px] text-[13px]"
          style={{ background: '#FFEBEE', color: '#C62828', border: '1px solid #FFCDD2' }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {overdueCount} task{overdueCount > 1 ? 's are' : ' is'} overdue.
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-iris-muted text-[13px]">Loading tasks…</div>
      ) : viewMode === 'kanban' ? (
        /* Kanban */
        <div className="flex gap-5 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              column={col}
              tasks={grouped[col.key] ?? []}
              businessId={businessId ?? ''}
              onEdit={openEdit}
            />
          ))}
        </div>
      ) : (
        /* List */
        <div className="bg-white border border-iris-line2 rounded-[16px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-iris-line2 text-[11px] font-semibold text-iris-muted uppercase tracking-wide">
                <th className="py-3 px-4 w-8" />
                <th className="py-3 px-4 text-left">Task</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Priority</th>
                <th className="py-3 px-4 text-left">Due</th>
                <th className="py-3 px-4 text-left">Assignee</th>
                <th className="py-3 px-4 w-8" />
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <ListRow key={t.id} task={t} businessId={businessId ?? ''} onEdit={openEdit} />
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[13px] text-iris-muted">
                    No tasks yet. Click &ldquo;New Task&rdquo; to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TaskModal
          businessId={businessId ?? ''}
          task={editingTask}
          therapists={therapists}
          clients={clients}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
