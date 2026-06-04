'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Plus, AlertTriangle, X, ChevronDown, Calendar, Tag, CheckSquare, ArrowRight,
} from 'lucide-react';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useTasks, useCreateTask, useUpdateTask } from '@/lib/hooks/use-tasks';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { useClients } from '@/lib/hooks/use-clients';

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg: '#F3F4F7',
  surface: '#FFFFFF',
  panel: '#FBF8FD',
  ink: '#1E1830',
  ink2: '#3D3450',
  muted: '#7A7090',
  faint: '#9E96B0',
  line: '#E5DEEC',
  line2: '#EFE9F2',
  primary: '#5D4AA8',
  primary2: '#7665C2',
  primaryDk: '#3F2F87',
  ok: '#1B8A5A',
  okBg: '#E9F7F0',
  okLine: '#C2E8D5',
  danger: '#B3261E',
  dangerBg: '#FBEAE8',
  dangerLine: '#F3CFCB',
  warn: '#B5701A',
  warnBg: '#FBF0DD',
  accentDk: '#C97E68',
  soft1: '#EDE5F4',
  soft2: '#F7E5DD',
};

// ── Priority config ───────────────────────────────────────────────────────────

const PRI: Record<string, { label: string; color: string; bg: string; stripe: string }> = {
  URGENT: { label: 'Urgent', color: C.danger, bg: C.dangerBg, stripe: C.danger },
  HIGH:   { label: 'High',   color: C.warn,   bg: C.warnBg,   stripe: C.warn   },
  MEDIUM: { label: 'Medium', color: C.primary, bg: C.soft1,   stripe: C.primary },
  LOW:    { label: 'Low',    color: C.muted,   bg: '#EEF0F4', stripe: C.faint   },
};

const STATUS_COLS = [
  { key: 'TODO',        label: 'To Do',       dot: '#8B8398' },
  { key: 'IN_PROGRESS', label: 'In Progress',  dot: C.primary },
  { key: 'DONE',        label: 'Done',         dot: C.ok      },
];

// ── Avatar ────────────────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: '#EDE5F4', color: '#5D4AA8' },
  { bg: '#E5EAF5', color: '#7A92D2' },
  { bg: '#F7E5DD', color: '#C97E68' },
  { bg: '#F0E8F8', color: '#8A6FBE' },
];

function avatarPalette(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) & 0xffff;
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length];
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const initials = name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const { bg, color } = avatarPalette(name);
  return (
    <span style={{
      width: size, height: size, borderRadius: size / 2,
      background: bg, color, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, letterSpacing: 0,
    }}>
      {initials}
    </span>
  );
}

// ── Due chip ──────────────────────────────────────────────────────────────────

const todayMidnight = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

function dueTone(dateStr: string | null, isDone: boolean): 'over' | 'today' | 'future' | 'done' {
  if (isDone) return 'done';
  if (!dateStr) return 'future';
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - todayMidnight.getTime()) / 86400000);
  if (diff < 0) return 'over';
  if (diff === 0) return 'today';
  return 'future';
}

function formatDueLabel(dateStr: string): string {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - todayMidnight.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function DueChip({ dueDate, isDone }: { dueDate: string | null; isDone: boolean }) {
  if (!dueDate) return null;
  const tone = dueTone(dueDate, isDone);
  const label = formatDueLabel(dueDate);
  const toneStyle: Record<string, { color: string; background: string }> = {
    over:   { color: C.danger,   background: C.dangerBg },
    today:  { color: C.accentDk, background: C.soft2    },
    future: { color: C.muted,    background: 'transparent' },
    done:   { color: C.faint,    background: 'transparent' },
  };
  const s = toneStyle[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px 2px 6px', borderRadius: 7,
      fontSize: 11.5, fontWeight: 600, ...s,
    }}>
      {tone === 'over'
        ? <AlertTriangle style={{ width: 12, height: 12 }} />
        : <Calendar style={{ width: 12, height: 12 }} />}
      {label}
    </span>
  );
}

// ── Priority badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRI[priority] ?? PRI.MEDIUM;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 9px', borderRadius: 999,
      background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: cfg.color }}></span>
      {cfg.label}
    </span>
  );
}

// ── Check icon ────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

// ── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  businessId,
  onEdit,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  task: any;
  businessId: string;
  onEdit: (t: any) => void;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const updateTask = useUpdateTask();
  const isDone = task.status === 'DONE';
  const pri = PRI[task.priority] ?? PRI.MEDIUM;
  const assigneeName = task.assignedTo
    ? `${task.assignedTo.firstName} ${task.assignedTo.lastName ?? ''}`.trim()
    : null;

  const toggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask.mutate({ id: task.id, businessId, status: isDone ? 'TODO' : 'DONE' });
  };

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={onDragEnd}
      onClick={() => onEdit(task)}
      className="iris-task-card"
      style={{
        position: 'relative', background: C.surface, borderRadius: 14,
        border: `1px solid ${C.line2}`, boxShadow: '0 1px 2px rgba(28,20,54,0.05)',
        padding: '14px 15px 13px 18px',
        opacity: dragging ? 0.4 : isDone ? 0.78 : 1,
        cursor: 'grab', overflow: 'hidden',
      }}
    >
      <span style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: pri.stripe, opacity: isDone ? 0.4 : 1,
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <button
          onClick={toggleDone}
          title={isDone ? 'Mark not done' : 'Mark done'}
          className="iris-check-btn"
          style={{
            flexShrink: 0, marginTop: 1, width: 20, height: 20, borderRadius: 10,
            cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: isDone ? 'none' : `1.6px solid ${C.line}`,
            background: isDone ? C.ok : 'transparent', color: '#fff',
          }}
        >
          {isDone && <CheckIcon />}
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, letterSpacing: -0.1,
            color: isDone ? C.muted : C.ink,
            textDecoration: isDone ? 'line-through' : 'none',
          }}>
            {task.title}
          </div>
          {task.description && (
            <div style={{
              fontSize: 12, color: C.muted, lineHeight: 1.5, marginTop: 5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            } as React.CSSProperties}>
              {task.description}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11, paddingLeft: 30, flexWrap: 'wrap' }}>
        <PriorityBadge priority={task.priority} />
        <DueChip dueDate={task.dueDate} isDone={isDone} />
        {task.relatedClient && (
          <Link
            href={`/clients/${task.relatedClient.id}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: C.muted, fontWeight: 500, textDecoration: 'none',
            }}
          >
            <Tag style={{ width: 12, height: 12 }} />
            {task.relatedClient.firstName} {task.relatedClient.lastName}
          </Link>
        )}
        {assigneeName && (
          <span style={{ marginLeft: 'auto' }} title={assigneeName}>
            <Avatar name={assigneeName} size={24} />
          </span>
        )}
      </div>
    </div>
  );
}

// ── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  tasks,
  businessId,
  onEdit,
  dragId,
  onDragStart,
  onDragEnd,
  onDrop,
}: {
  col: (typeof STATUS_COLS)[number];
  tasks: any[];
  businessId: string;
  onEdit: (t: any) => void;
  dragId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (status: string) => void;
}) {
  const [isHot, setIsHot] = useState(false);

  return (
    <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 4px 12px' }}>
        <span style={{ width: 9, height: 9, borderRadius: 5, background: col.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, letterSpacing: -0.1 }}>{col.label}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, color: C.muted,
          padding: '1px 8px', borderRadius: 999,
          background: C.surface, border: `1px solid ${C.line2}`,
        }}>
          {tasks.length}
        </span>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!isHot) setIsHot(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsHot(false); }}
        onDrop={() => { onDrop(col.key); setIsHot(false); }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', gap: 10, padding: 10,
          borderRadius: 16, minHeight: 120,
          background: isHot ? 'rgba(237,229,244,0.4)' : C.bg,
          outline: isHot ? `1.5px dashed ${C.primary}` : `1px solid ${C.line2}`,
          transition: 'background .15s ease, outline-color .15s ease',
        }}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            businessId={businessId}
            onEdit={onEdit}
            dragging={dragId === task.id}
            onDragStart={() => onDragStart(task.id)}
            onDragEnd={onDragEnd}
          />
        ))}
        {tasks.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 7, padding: '26px 12px',
            color: C.faint, textAlign: 'center',
          }}>
            <CheckSquare style={{ width: 22, height: 22, opacity: 0.5 }} />
            <span style={{ fontSize: 11.5 }}>Nothing here</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, tone, active, onClick,
}: {
  label: string; value: number;
  tone: 'neutral' | 'todo' | 'today' | 'over';
  active: boolean; onClick: () => void;
}) {
  const toneStyles = {
    neutral: { valColor: C.ink,    activeBorder: C.line2,     activeBg: C.surface  },
    todo:    { valColor: C.ink,    activeBorder: C.line2,     activeBg: C.surface  },
    today:   { valColor: C.primary, activeBorder: C.primary,  activeBg: '#F6F3FC'  },
    over:    { valColor: C.danger,  activeBorder: C.dangerLine, activeBg: C.dangerBg },
  };
  const ts = toneStyles[tone];
  return (
    <button
      onClick={onClick}
      className="iris-stat-card"
      style={{
        textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
        flex: '1 1 0', minWidth: 0,
        background: active ? ts.activeBg : C.surface,
        borderRadius: 16, padding: '16px 18px',
        border: `1.5px solid ${active ? ts.activeBorder : C.line2}`,
        boxShadow: '0 1px 2px rgba(28,20,54,0.05)',
        transition: 'all .15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</span>
        {active && tone !== 'neutral' && (
          <span style={{ fontSize: 10, color: ts.valColor, fontWeight: 600 }}>Filtered</span>
        )}
      </div>
      <div style={{
        fontSize: 30, fontWeight: 700, letterSpacing: -1, lineHeight: 1, marginTop: 6,
        color: active && tone !== 'neutral' ? ts.valColor : C.ink,
      }}>
        {value}
      </div>
    </button>
  );
}

// ── Styled filter select ──────────────────────────────────────────────────────

function FSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center',
      height: 38, padding: '0 10px 0 12px', borderRadius: 10,
      border: `1px solid ${C.line}`, background: C.surface,
    }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          fontSize: 12.5, color: C.ink2, fontFamily: 'inherit',
          fontWeight: 500, appearance: 'none', cursor: 'pointer', paddingRight: 18,
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown style={{ position: 'absolute', right: 8, width: 15, height: 15, color: C.muted, pointerEvents: 'none' }} />
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────

function ListView({ tasks, businessId, onEdit }: {
  tasks: any[]; businessId: string; onEdit: (t: any) => void;
}) {
  const updateTask = useUpdateTask();
  return (
    <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.line2}`, boxShadow: '0 1px 2px rgba(28,20,54,0.05)', overflow: 'hidden' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) 100px 130px 140px',
        gap: 14, padding: '11px 18px', borderBottom: `1px solid ${C.line2}`,
        fontSize: 10.5, color: C.muted, letterSpacing: 0.8,
        textTransform: 'uppercase', fontWeight: 600, background: C.panel,
      }}>
        <span /><span>Task</span><span>Priority</span><span>Due</span><span>Assignee</span>
      </div>
      {tasks.map((task, i) => {
        const isDone = task.status === 'DONE';
        const col = STATUS_COLS.find((c) => c.key === task.status);
        const assigneeName = task.assignedTo
          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName ?? ''}`.trim()
          : null;
        return (
          <div
            key={task.id}
            onClick={() => onEdit(task)}
            className="iris-list-row"
            style={{
              display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) 100px 130px 140px',
              gap: 14, padding: '13px 18px',
              borderTop: i ? `1px solid ${C.line2}` : 'none',
              alignItems: 'center', cursor: 'pointer',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateTask.mutate({ id: task.id, businessId, status: isDone ? 'TODO' : 'DONE' });
              }}
              className="iris-check-btn"
              style={{
                width: 20, height: 20, borderRadius: 10, cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: isDone ? 'none' : `1.6px solid ${C.line}`,
                background: isDone ? C.ok : 'transparent', color: '#fff',
              }}
            >
              {isDone && <CheckIcon />}
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: isDone ? C.muted : C.ink,
                textDecoration: isDone ? 'line-through' : 'none',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {task.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 11, color: C.muted }}>
                <span style={{ width: 7, height: 7, borderRadius: 4, background: col?.dot }} />
                {col?.label}
                {task.relatedClient && (
                  <>
                    <span style={{ color: C.faint }}>·</span>
                    {task.relatedClient.firstName} {task.relatedClient.lastName}
                  </>
                )}
              </div>
            </div>
            <PriorityBadge priority={task.priority} />
            <DueChip dueDate={task.dueDate} isDone={isDone} />
            {assigneeName ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Avatar name={assigneeName} size={26} />
                <span style={{ fontSize: 12, color: C.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {assigneeName.split(' ')[0]}
                </span>
              </span>
            ) : (
              <span style={{ fontSize: 12, color: C.faint }}>Unassigned</span>
            )}
          </div>
        );
      })}
      {tasks.length === 0 && (
        <div style={{ padding: '50px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
          No tasks match these filters.
        </div>
      )}
    </div>
  );
}

// ── New task modal ────────────────────────────────────────────────────────────

type ModalTask = {
  id?: string; title: string; description: string; priority: string;
  status: string; assignedToId: string; dueDate: string;
  relatedClientId: string; clientSearch: string;
};

function TaskModal({
  businessId, task, therapists, clients, onClose,
}: {
  businessId: string; task?: any; therapists: any[]; clients: any[];
  onClose: () => void;
}) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const titleRef = useRef<HTMLInputElement>(null);

  const [f, setF] = useState<ModalTask>({
    id: task?.id,
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'MEDIUM',
    status: task?.status ?? 'TODO',
    assignedToId: task?.assignedTo?.id ?? '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
    relatedClientId: task?.relatedClient?.id ?? '',
    clientSearch: task?.relatedClient
      ? `${task.relatedClient.firstName} ${task.relatedClient.lastName}`
      : '',
  });
  const [showClientDrop, setShowClientDrop] = useState(false);

  const isEditing = !!task;
  const isPending = createTask.isPending || updateTask.isPending;
  const valid = f.title.trim().length > 0;

  const filteredClients = f.clientSearch.trim()
    ? clients.filter((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(f.clientSearch.toLowerCase())
      )
    : clients;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const payload = {
      businessId, title: f.title.trim(),
      description: f.description.trim() || undefined,
      priority: f.priority, status: f.status,
      assignedToId: f.assignedToId || undefined,
      dueDate: f.dueDate || undefined,
      relatedClientId: f.relatedClientId || undefined,
    };
    if (isEditing) {
      await updateTask.mutateAsync({ id: task.id, ...payload });
    } else {
      await createTask.mutateAsync(payload);
    }
    onClose();
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 13px', borderRadius: 11,
    border: `1px solid ${C.line}`, background: '#FCFBFE',
    fontSize: 13.5, color: C.ink, fontFamily: 'inherit', outline: 'none',
  };

  const Lab = ({ children }: { children: React.ReactNode }) => (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.ink2, marginBottom: 7 }}>
      {children}
    </label>
  );

  const PriBtn = ({ value }: { value: string }) => {
    const p = PRI[value];
    const on = f.priority === value;
    return (
      <button
        type="button"
        onClick={() => setF((s) => ({ ...s, priority: value }))}
        style={{
          flex: 1, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
          background: on ? C.surface : 'transparent',
          color: on ? p.color : C.muted,
          boxShadow: on ? '0 1px 2px rgba(28,20,54,0.08)' : 'none',
          transition: 'all .14s ease',
        }}
      >
        {p.label}
      </button>
    );
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        background: 'rgba(30,24,48,0.34)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '9vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 540, maxWidth: '92vw', background: C.surface, borderRadius: 18,
          boxShadow: '0 18px 50px rgba(28,20,54,0.22), 0 4px 12px rgba(28,20,54,0.12)',
          border: `1px solid ${C.line2}`, overflow: 'hidden',
          animation: 'iris-pop .16s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '17px 20px', borderBottom: `1px solid ${C.line2}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 30, height: 30, borderRadius: 9, background: C.soft1, color: C.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckSquare style={{ width: 16, height: 16 }} />
            </span>
            <span style={{ fontSize: 15.5, fontWeight: 600, color: C.ink, letterSpacing: -0.2 }}>
              {isEditing ? 'Edit task' : 'New task'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'transparent', color: C.muted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 15, maxHeight: '62vh', overflowY: 'auto' }}>
            <div>
              <Lab>Task title</Lab>
              <input
                ref={titleRef}
                autoFocus
                value={f.title}
                onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e as any); }}
                placeholder="e.g. Follow up with new client"
                style={fieldStyle}
              />
            </div>

            <div>
              <Lab>Description</Lab>
              <textarea
                value={f.description}
                onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))}
                rows={3}
                placeholder="Add context, links or next steps…"
                style={{ ...fieldStyle, height: 'auto', padding: '11px 13px', resize: 'vertical', lineHeight: 1.55, display: 'block' }}
              />
            </div>

            <div>
              <Lab>Priority</Lab>
              <div style={{
                display: 'flex', gap: 3, padding: 3, borderRadius: 11,
                background: C.bg, border: `1px solid ${C.line2}`,
              }}>
                {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((v) => <PriBtn key={v} value={v} />)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Lab>Assignee</Lab>
                <div style={{ position: 'relative' }}>
                  <select
                    value={f.assignedToId}
                    onChange={(e) => setF((s) => ({ ...s, assignedToId: e.target.value }))}
                    style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer', paddingRight: 34 }}
                  >
                    <option value="">Unassigned</option>
                    {therapists.map((t) => (
                      <option key={t.user.id} value={t.user.id}>
                        {t.user.firstName} {t.user.lastName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown style={{ position: 'absolute', right: 11, top: 13, width: 16, height: 16, color: C.muted, pointerEvents: 'none' }} />
                </div>
              </div>
              <div>
                <Lab>Due date</Lab>
                <input
                  type="date"
                  value={f.dueDate}
                  onChange={(e) => setF((s) => ({ ...s, dueDate: e.target.value }))}
                  style={{ ...fieldStyle, cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Lab>Column</Lab>
                <div style={{
                  display: 'flex', gap: 3, padding: 3, borderRadius: 11,
                  background: C.bg, border: `1px solid ${C.line2}`,
                }}>
                  {[{ v: 'TODO', l: 'To Do' }, { v: 'IN_PROGRESS', l: 'In Progress' }].map(({ v, l }) => {
                    const on = f.status === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setF((s) => ({ ...s, status: v }))}
                        style={{
                          flex: 1, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
                          fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                          background: on ? C.surface : 'transparent',
                          color: on ? C.primary : C.muted,
                          boxShadow: on ? '0 1px 2px rgba(28,20,54,0.08)' : 'none',
                        }}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Lab>Related client <span style={{ color: C.faint, fontWeight: 500 }}>· optional</span></Lab>
                <div style={{ position: 'relative' }}>
                  <input
                    value={f.clientSearch}
                    onChange={(e) => {
                      setF((s) => ({ ...s, clientSearch: e.target.value, relatedClientId: '' }));
                      setShowClientDrop(true);
                    }}
                    onFocus={() => setShowClientDrop(true)}
                    onBlur={() => setTimeout(() => setShowClientDrop(false), 150)}
                    placeholder="Search clients…"
                    style={{ ...fieldStyle, paddingRight: f.clientSearch ? 34 : 13 }}
                  />
                  {f.clientSearch && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setF((s) => ({ ...s, clientSearch: '', relatedClientId: '' }));
                        setShowClientDrop(false);
                      }}
                      style={{ position: 'absolute', right: 11, top: 13, background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex' }}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                  {showClientDrop && (
                    <div style={{
                      position: 'absolute', zIndex: 20, top: '100%', marginTop: 4, width: '100%',
                      background: C.surface, border: `1px solid ${C.line2}`, borderRadius: 11,
                      boxShadow: '0 8px 28px rgba(28,20,54,0.12)', maxHeight: 180, overflowY: 'auto',
                    }}>
                      <div
                        onMouseDown={(e) => { e.preventDefault(); setF((s) => ({ ...s, clientSearch: '', relatedClientId: '' })); setShowClientDrop(false); }}
                        style={{ padding: '10px 13px', fontSize: 12, color: C.muted, cursor: 'pointer' }}
                        className="iris-list-row"
                      >
                        None
                      </div>
                      {filteredClients.slice(0, 20).map((c) => (
                        <div
                          key={c.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setF((s) => ({ ...s, relatedClientId: c.id, clientSearch: `${c.firstName} ${c.lastName}` }));
                            setShowClientDrop(false);
                          }}
                          style={{ padding: '10px 13px', fontSize: 13, color: C.ink, cursor: 'pointer' }}
                          className="iris-list-row"
                        >
                          {c.firstName} {c.lastName}
                        </div>
                      ))}
                      {filteredClients.length === 0 && (
                        <div style={{ padding: '10px 13px', fontSize: 12, color: C.muted }}>No clients found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
            padding: '14px 20px', borderTop: `1px solid ${C.line2}`, background: C.panel,
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 38, padding: '0 17px', borderRadius: 10,
                border: `1px solid ${C.line}`, background: C.surface,
                color: C.ink2, fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!valid || isPending}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                height: 38, padding: '0 17px', borderRadius: 10, border: 'none',
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDk})`,
                color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                cursor: valid ? 'pointer' : 'default',
                opacity: valid && !isPending ? 1 : 0.5,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 1px 2px rgba(28,20,54,0.16)',
              }}
            >
              <Plus style={{ width: 15, height: 15 }} />
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page stylesheet ───────────────────────────────────────────────────────────

const PAGE_STYLES = `
  @keyframes iris-pop { from { opacity:0; transform:translateY(8px) scale(.98); } to { opacity:1; transform:none; } }
  .iris-task-card { transition: box-shadow .15s ease, border-color .15s ease, transform .12s ease; }
  .iris-task-card:hover { box-shadow: 0 8px 28px rgba(28,20,54,0.12), 0 2px 6px rgba(28,20,54,0.06); border-color: #E5DEEC !important; transform: translateY(-1px); }
  .iris-task-card:active { cursor: grabbing; }
  .iris-check-btn { transition: border-color .14s ease, background .14s ease; }
  .iris-check-btn:hover { border-color: #5D4AA8 !important; }
  .iris-stat-card:hover { box-shadow: 0 8px 28px rgba(28,20,54,0.12), 0 2px 6px rgba(28,20,54,0.06); transform: translateY(-1px); }
  .iris-list-row:hover { background: #F3F4F7; }
`;

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const businessId = useBusinessId();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'todo' | 'today' | 'over'>('all');
  const [dragId, setDragId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const { data: tasksData, isLoading } = useTasks(businessId, {
    priority: filterPriority || undefined,
    assignedToId: filterAssignee || undefined,
    limit: 200,
  });
  const { data: therapistsData } = useTherapists(businessId, { isActive: true });
  const { data: clientsData } = useClients(businessId);
  const updateTask = useUpdateTask();

  const tasks: any[] = tasksData?.data ?? [];
  const therapists: any[] = therapistsData ?? [];
  const clients: any[] = clientsData ?? [];

  // stats (client-side, over the full fetched set)
  const openTasks = tasks.filter((t) => t.status !== 'DONE');
  const todayStr = todayMidnight.toDateString();
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'TODO').length,
    today: openTasks.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === todayStr).length,
    over: openTasks.filter((t) => t.dueDate && new Date(t.dueDate) < todayMidnight).length,
  };

  // filter tasks for display
  const shown = tasks.filter((t) => {
    if (quickFilter === 'todo' && t.status !== 'TODO') return false;
    if (quickFilter === 'today' && (t.status === 'DONE' || dueTone(t.dueDate, false) !== 'today')) return false;
    if (quickFilter === 'over' && (t.status === 'DONE' || dueTone(t.dueDate, false) !== 'over')) return false;
    return true;
  });
  const sortedShown = [...shown].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const toggleQuick = (k: typeof quickFilter) => setQuickFilter((q) => (q === k ? 'all' : k));
  const hasFilter = filterPriority || filterAssignee || quickFilter !== 'all';
  const clearFilters = () => { setFilterPriority(''); setFilterAssignee(''); setQuickFilter('all'); };

  const drop = (status: string) => {
    if (dragId) updateTask.mutate({ id: dragId, businessId: businessId ?? '', status });
    setDragId(null);
  };

  const openCreate = () => { setEditingTask(null); setShowModal(true); };
  const openEdit = (task: any) => { setEditingTask(task); setShowModal(true); };
  const closeModal = () => { setEditingTask(null); setShowModal(false); };

  const priOpts = [
    { value: '', label: 'All Priorities' },
    ...Object.entries(PRI).map(([k, v]) => ({ value: k, label: v.label })),
  ];
  const whoOpts = [
    { value: '', label: 'All Assignees' },
    ...therapists.map((t) => ({ value: t.user.id, label: `${t.user.firstName} ${t.user.lastName}` })),
  ];

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div style={{ maxWidth: 1400, display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.ink, letterSpacing: -0.8 }}>Tasks</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: C.muted }}>
              Assign and track follow-up tasks for your team
            </p>
          </div>
          <button
            onClick={openCreate}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              height: 38, padding: '0 17px', borderRadius: 10, border: 'none',
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDk})`,
              color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 1px 2px rgba(28,20,54,0.16)',
            }}
          >
            <Plus style={{ width: 15, height: 15 }} />
            New Task
          </button>
        </div>

        {/* stat cards */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
          <StatCard label="Total"     value={stats.total} tone="neutral" active={quickFilter === 'all' && !hasFilter} onClick={clearFilters} />
          <StatCard label="To Do"     value={stats.todo}  tone="todo"    active={quickFilter === 'todo'}   onClick={() => toggleQuick('todo')} />
          <StatCard label="Due Today" value={stats.today} tone="today"   active={quickFilter === 'today'}  onClick={() => toggleQuick('today')} />
          <StatCard label="Overdue"   value={stats.over}  tone="over"    active={quickFilter === 'over'}   onClick={() => toggleQuick('over')} />
        </div>

        {/* filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <FSelect value={filterPriority} onChange={setFilterPriority} options={priOpts} />
          <FSelect value={filterAssignee} onChange={setFilterAssignee} options={whoOpts} />
          {hasFilter && (
            <button
              onClick={clearFilters}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 38, padding: '0 12px', borderRadius: 10,
                border: 'none', background: 'transparent',
                color: C.muted, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <X style={{ width: 13, height: 13 }} /> Clear
            </button>
          )}
          <div style={{
            marginLeft: 'auto', display: 'flex', gap: 3, padding: 3,
            borderRadius: 11, background: C.bg, border: `1px solid ${C.line2}`,
          }}>
            {([['board', 'Board'], ['list', 'List']] as const).map(([v, lbl]) => {
              const on = viewMode === v;
              return (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    height: 30, padding: '0 12px', borderRadius: 8, border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
                    background: on ? C.surface : 'transparent',
                    color: on ? C.primary : C.muted,
                    boxShadow: on ? '0 1px 2px rgba(28,20,54,0.08)' : 'none',
                  }}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>

        {/* overdue banner */}
        {stats.over > 0 && quickFilter !== 'over' && (
          <button
            onClick={() => toggleQuick('over')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 11,
              padding: '12px 16px', borderRadius: 13, marginBottom: 16,
              border: `1px solid ${C.dangerLine}`, background: C.dangerBg,
              color: C.danger, fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              <strong style={{ fontWeight: 700 }}>
                {stats.over} {stats.over === 1 ? 'task is' : 'tasks are'} overdue.
              </strong>{' '}
              They need attention before new work piles up.
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              Review <ArrowRight style={{ width: 14, height: 14 }} />
            </span>
          </button>
        )}

        {/* views */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted, fontSize: 13 }}>
            Loading tasks…
          </div>
        ) : viewMode === 'board' ? (
          <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
            {STATUS_COLS.map((col) => (
              <KanbanColumn
                key={col.key}
                col={col}
                tasks={sortedShown.filter((t) => t.status === col.key)}
                businessId={businessId ?? ''}
                onEdit={openEdit}
                dragId={dragId}
                onDragStart={setDragId}
                onDragEnd={() => setDragId(null)}
                onDrop={drop}
              />
            ))}
          </div>
        ) : (
          <ListView
            tasks={[...sortedShown].sort(
              (a, b) =>
                STATUS_COLS.findIndex((c) => c.key === a.status) -
                STATUS_COLS.findIndex((c) => c.key === b.status)
            )}
            businessId={businessId ?? ''}
            onEdit={openEdit}
          />
        )}
      </div>

      {showModal && (
        <TaskModal
          businessId={businessId ?? ''}
          task={editingTask}
          therapists={therapists}
          clients={clients}
          onClose={closeModal}
        />
      )}
    </>
  );
}
