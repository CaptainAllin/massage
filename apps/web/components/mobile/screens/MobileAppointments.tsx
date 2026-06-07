'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LargeHeader } from '../LargeHeader';
import { Card, Chip, StatusChip } from '../primitives';
import type { MobileRouter } from '../MobileShell';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { useAppointments } from '@/lib/hooks/use-appointments';
import { useTherapists } from '@/lib/hooks/use-therapists';
import { useNewSession } from '@/components/new-session/NewSessionContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LocalAppt {
  id: string;
  clientName: string;
  service: string;
  therapistName: string;
  therapistId: string;
  therapistColor: string;
  room: string;
  startHour: number; // e.g. 9.5 = 9:30 AM
  duration: number;  // in hours
  status: string;
  date: Date;
}

interface AppointmentsProps {
  router: MobileRouter;
  param: unknown;
}

type CalView = 'agenda' | 'day' | 'week';

// ─── Constants ───────────────────────────────────────────────────────────────

const TODAY = new Date();
const THERAPIST_COLORS = ['#5D4AA8', '#3E9E7A', '#3A87D4', '#DE9277', '#7665C2'];

const DAY_ABBR        = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_ABBR_SHORT  = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_ABBR      = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth() &&
         a.getDate()     === b.getDate();
}

function getWeekNumber(): number {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

function formatHour(h: number): string {
  const hour = Math.floor(h);
  const mins = h % 1 === 0.5 ? '30' : '00';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${mins} ${suffix}`;
}

function hashColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return THERAPIST_COLORS[Math.abs(h) % THERAPIST_COLORS.length];
}

function getWeekDays(anchor: Date): Date[] {
  const dow = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// 14-day strip: 3 days before today through 10 after
function getStrip(): Date[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() - 3 + i);
    return d;
  });
}

// Transform API appointment (with relations) → LocalAppt
function toLocalAppt(a: any, colorMap: Map<string, string>): LocalAppt {
  const start = new Date(a.startTime);
  const end   = new Date(a.endTime);
  const startHour  = start.getHours() + start.getMinutes() / 60;
  const durationHr = (end.getTime() - start.getTime()) / 3600000 || (a.duration ?? 60) / 60;

  const tid   = a.therapistId ?? '';
  const tUser = a.therapist?.user;
  const tFirst = tUser?.firstName ?? '';
  const tLast  = tUser?.lastName ?? '';
  const therapistName = tLast
    ? `${tFirst} ${tLast.charAt(0)}.`
    : tFirst || 'Staff';

  const cFirst = a.client?.firstName ?? '';
  const cLast  = a.client?.lastName  ?? '';

  return {
    id:             a.id,
    clientName:     `${cFirst} ${cLast}`.trim() || 'Unknown',
    service:        a.serviceType || 'Session',
    therapistName,
    therapistId:    tid,
    therapistColor: colorMap.get(tid) ?? hashColor(tid),
    room:           '',
    startHour,
    duration:       durationHr,
    status:         (a.status as string).toLowerCase(),
    date:           start,
  };
}

// ─── Segmented Control ────────────────────────────────────────────────────────

interface SegmentedControlProps<T extends string> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}

function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--m-surface)',
        border: '1px solid var(--m-line)',
        borderRadius: 14,
        padding: 3,
        gap: 3,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="im-tab"
            style={{
              flex: 1,
              padding: '7px 0',
              borderRadius: 11,
              border: 'none',
              background: active ? 'var(--m-grad)' : 'transparent',
              color: active ? '#fff' : 'var(--m-muted)',
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Day Strip ────────────────────────────────────────────────────────────────

interface DayStripProps {
  days: Date[];
  selected: Date;
  onSelect: (d: Date) => void;
}

function DayStrip({ days, selected, onSelect }: DayStripProps) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = days.findIndex((d) => isSameDay(d, selected));
    if (idx < 0) return;
    const itemW = 58; // 52px width + 6px gap
    const left  = idx * itemW - el.clientWidth / 2 + itemW / 2;
    el.scrollTo({ left, behavior: mountedRef.current ? 'smooth' : 'auto' });
    mountedRef.current = true;
  }, [selected, days]);

  return (
    <div
      ref={scrollRef}
      className="im-scroll"
      style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}
    >
      {days.map((d, i) => {
        const isToday    = isSameDay(d, TODAY);
        const isSelected = isSameDay(d, selected);
        return (
          <button
            key={i}
            onClick={() => onSelect(d)}
            className="im-tab im-press"
            style={{
              width: 52,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '8px 4px',
              borderRadius: 14,
              border: isSelected ? 'none' : '1px solid var(--m-line)',
              background: isSelected ? 'var(--m-grad)' : 'var(--m-surface)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--m-muted)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {DAY_ABBR_SHORT[d.getDay()]}
            </span>
            <span
              style={{
                fontSize: 17,
                fontWeight: isToday ? 700 : 500,
                color: isSelected ? '#fff' : isToday ? 'var(--m-primary)' : 'var(--m-ink)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {d.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Therapist Filter Chips ───────────────────────────────────────────────────

interface TherapistChipItem {
  id: string;
  name: string;
  color: string;
}

interface TherapistChipsProps {
  therapists: TherapistChipItem[];
  selected: string | null; // null = all
  onSelect: (id: string | null) => void;
}

function TherapistChips({ therapists, selected, onSelect }: TherapistChipsProps) {
  return (
    <div className="im-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
      <Chip label="All therapists" active={selected === null} onClick={() => onSelect(null)} />
      {therapists.map((t) => (
        <Chip
          key={t.id}
          label={t.name}
          active={selected === t.id}
          dot={t.color}
          onClick={() => onSelect(t.id)}
        />
      ))}
    </div>
  );
}

// ─── Agenda Card ──────────────────────────────────────────────────────────────

function AgendaCard({ appt }: { appt: LocalAppt }) {
  const durationLabel =
    appt.duration === 1   ? '60 min' :
    appt.duration === 1.5 ? '90 min' :
    `${Math.round(appt.duration * 60)} min`;

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
      {/* Time + spine */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          width: 50,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--m-ink2)',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatHour(appt.startHour)}
        </span>
        <div
          style={{
            flex: 1,
            width: 3,
            borderRadius: 2,
            background: appt.therapistColor,
            minHeight: 24,
          }}
        />
        <span
          style={{
            fontSize: 10.5,
            color: 'var(--m-muted)',
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            whiteSpace: 'nowrap',
          }}
        >
          {durationLabel}
        </span>
      </div>

      {/* Card */}
      <Card
        padding="12px 14px"
        style={{
          flex: 1,
          borderLeft: `3px solid ${appt.therapistColor}`,
          borderRadius: '0 16px 16px 0',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <span
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: 'var(--m-ink)',
              fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            }}
          >
            {appt.clientName}
          </span>
          <StatusChip status={appt.status} />
        </div>
        <div style={{ fontSize: 13, color: 'var(--m-ink2)', marginTop: 3, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
          {appt.service}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: appt.therapistColor,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            {appt.therapistName}
          </span>
        </div>
      </Card>
    </div>
  );
}

// ─── Agenda View ──────────────────────────────────────────────────────────────

function AgendaView({ appts, selectedDate, onAddTap }: { appts: LocalAppt[]; selectedDate: Date; onAddTap?: () => void }) {
  if (appts.length === 0) {
    const dayLabel = isSameDay(selectedDate, TODAY)
      ? 'today'
      : `on ${DAY_ABBR[selectedDate.getDay()]} ${selectedDate.getDate()} ${MONTH_ABBR[selectedDate.getMonth()]}`;
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
        <div style={{ fontSize: 14, color: 'var(--m-muted)', marginBottom: 12 }}>
          No appointments {dayLabel}
        </div>
        <button
          onClick={onAddTap}
          className="im-press im-tab"
          style={{
            background: 'var(--m-grad)',
            color: '#fff',
            border: 'none',
            borderRadius: 14,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            cursor: 'pointer',
          }}
        >
          Tap + to add one
        </button>
      </div>
    );
  }

  // Show date header for context
  const dateLabel = `${DAY_ABBR[selectedDate.getDay()]}, ${MONTH_ABBR[selectedDate.getMonth()]} ${selectedDate.getDate()}`;
  const sorted = [...appts].sort((a, b) => a.startHour - b.startHour);

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--m-muted)',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: 12,
          fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
        }}
      >
        {dateLabel}
      </div>
      {sorted.map((appt) => <AgendaCard key={appt.id} appt={appt} />)}
    </div>
  );
}

// ─── Day Column View ──────────────────────────────────────────────────────────

const DAY_START = 9;
const DAY_END   = 18;
const HOUR_PX   = 64;

function DayColumn({ appts }: { appts: LocalAppt[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now    = new Date();
  const nowH   = now.getHours() + now.getMinutes() / 60;
  const showNow = nowH >= DAY_START && nowH <= DAY_END;
  const nowTop  = (nowH - DAY_START) * HOUR_PX;

  // Auto-scroll to current time on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !showNow) return;
    const scrollTarget = Math.max(0, nowTop - el.clientHeight / 3);
    el.scrollTo({ top: scrollTarget, behavior: 'auto' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hours = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i);
  const totalHeight = (DAY_END - DAY_START) * HOUR_PX;

  return (
    <div ref={scrollRef} style={{ overflowY: 'auto', maxHeight: 480, position: 'relative' }}>
      <div style={{ position: 'relative', paddingTop: 4, height: totalHeight + HOUR_PX }}>
        {/* Hour rows */}
        {hours.map((h) => (
          <div key={h} style={{ position: 'absolute', top: (h - DAY_START) * HOUR_PX, left: 0, right: 0, height: HOUR_PX }}>
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                fontSize: 11,
                color: 'var(--m-faint)',
                fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {h > 12 ? `${h - 12}p` : `${h}a`}
            </span>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 36,
                right: 0,
                height: 1,
                background: 'var(--m-line2)',
              }}
            />
          </div>
        ))}

        {/* Now line */}
        {showNow && (
          <div
            style={{
              position: 'absolute',
              top: nowTop,
              left: 32,
              right: 0,
              height: 2,
              background: 'var(--m-accent)',
              zIndex: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--m-accent)',
                marginLeft: -4,
              }}
            />
          </div>
        )}

        {/* Appointment blocks */}
        {appts.map((appt) => {
          const top    = (appt.startHour - DAY_START) * HOUR_PX;
          const height = appt.duration * HOUR_PX - 4;
          return (
            <div
              key={appt.id}
              style={{
                position: 'absolute',
                top,
                left: 36,
                right: 0,
                height,
                borderRadius: 10,
                background: appt.therapistColor + '18',
                borderLeft: `3px solid ${appt.therapistColor}`,
                padding: '6px 10px',
                zIndex: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--m-ink)',
                  fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {appt.clientName}
              </div>
              {height > 40 && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--m-ink2)',
                    fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: 2,
                  }}
                >
                  {appt.service}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week Mini Grid ───────────────────────────────────────────────────────────

const WEEK_ROW_HOURS = [9, 11, 13, 15, 17];
const WEEK_ROW_PX    = 48;
const WEEK_COL_PX    = 88;

function WeekMini({ weekDays, appts, onDayPress }: { weekDays: Date[]; appts: LocalAppt[]; onDayPress: (d: Date) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now    = new Date();
  const nowH   = now.getHours() + now.getMinutes() / 60;
  const showNow = nowH >= 9 && nowH <= 18;
  // Approximate top within week grid for current time
  const nowRowH  = WEEK_ROW_HOURS.findIndex((h) => nowH < h + 2);
  const baseRow  = nowRowH >= 0 ? nowRowH : WEEK_ROW_HOURS.length - 1;
  const baseHour = WEEK_ROW_HOURS[baseRow];
  const nowTop   = baseRow * WEEK_ROW_PX + (nowH - baseHour) * WEEK_ROW_PX * 0.5 + 52; // 52 = header height

  // Auto-scroll to current time
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !showNow) return;
    el.scrollTo({ top: Math.max(0, nowTop - el.clientHeight / 3), behavior: 'auto' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={scrollRef} className="im-scroll" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 480 }}>
      <div style={{ minWidth: 620, fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', position: 'relative' }}>
        {/* Header row */}
        <div style={{ display: 'flex', paddingLeft: 36 }}>
          {weekDays.map((d, i) => {
            const isToday = isSameDay(d, TODAY);
            return (
              <div
                key={i}
                onClick={() => onDayPress(d)}
                style={{
                  width: WEEK_COL_PX,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 0',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 10, color: 'var(--m-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {DAY_ABBR[d.getDay()].slice(0, 3)}
                </span>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isToday ? 'var(--m-grad)' : 'transparent',
                    color: isToday ? '#fff' : 'var(--m-ink)',
                    fontSize: 14,
                    fontWeight: isToday ? 700 : 500,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div style={{ position: 'relative' }}>
          {WEEK_ROW_HOURS.map((h) => (
            <div key={h} style={{ display: 'flex', height: WEEK_ROW_PX }}>
              <div style={{ width: 36, flexShrink: 0, paddingTop: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--m-faint)', fontVariantNumeric: 'tabular-nums' }}>
                  {h > 12 ? `${h - 12}p` : `${h}a`}
                </span>
              </div>
              {weekDays.map((d, di) => (
                <div
                  key={di}
                  style={{ width: WEEK_COL_PX, borderTop: '1px solid var(--m-line2)', position: 'relative' }}
                >
                  {appts
                    .filter((a) => isSameDay(a.date, d) && a.startHour >= h && a.startHour < h + 2)
                    .map((a) => {
                      const offsetPx = (a.startHour - h) * WEEK_ROW_PX;
                      const heightPx = Math.min(a.duration * WEEK_ROW_PX * 0.5, WEEK_ROW_PX - offsetPx - 2);
                      return (
                        <div
                          key={a.id}
                          style={{
                            position: 'absolute',
                            top: offsetPx + 1,
                            left: 2,
                            right: 2,
                            height: heightPx,
                            borderRadius: 6,
                            background: a.therapistColor + '28',
                            borderLeft: `3px solid ${a.therapistColor}`,
                            overflow: 'hidden',
                            padding: '2px 5px',
                          }}
                        >
                          <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--m-ink)', whiteSpace: 'nowrap', overflow: 'hidden', display: 'block', textOverflow: 'ellipsis' }}>
                            {a.clientName.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}

                  {/* Now line in week grid */}
                  {showNow && isSameDay(d, TODAY) && nowH >= h && nowH < h + 2 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: (nowH - h) * WEEK_ROW_PX * 0.5,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: 'var(--m-accent)',
                        zIndex: 4,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Booking CTA Card ─────────────────────────────────────────────────────────

function BookingCTA({ businessId }: { businessId: string | undefined }) {
  const [copied, setCopied] = useState(false);

  const bookingUrl = businessId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${businessId}`
    : '';

  function copyLink() {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card
      padding="16px"
      style={{ background: 'var(--m-soft2)', border: '1px solid var(--m-soft)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--m-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="var(--m-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="var(--m-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--m-ink)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>
            Client booking page
          </div>
          <div style={{ fontSize: 12, color: 'var(--m-muted)', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)', marginTop: 2 }}>
            Share so clients can self-book
          </div>
        </div>
        <button
          onClick={copyLink}
          disabled={!bookingUrl}
          className="im-tab im-press"
          style={{
            padding: '8px 14px',
            borderRadius: 12,
            border: 'none',
            background: copied ? 'var(--m-ok)' : 'var(--m-grad)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.2s',
            opacity: bookingUrl ? 1 : 0.5,
          }}
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </Card>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MobileAppointments({ router: _router }: AppointmentsProps) {
  const businessId = useBusinessId();
  const { openNewSession } = useNewSession();

  const [calView,         setCalView]         = useState<CalView>('agenda');
  const [selectedDate,    setSelectedDate]    = useState<Date>(TODAY);
  const [therapistFilter, setTherapistFilter] = useState<string | null>(null);

  const strip    = useMemo(() => getStrip(), []);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // Fetch a 2-week window (matches the 14-day strip)
  const stripStart = strip[0];
  const stripEnd   = strip[strip.length - 1];

  const { data: apptData, isLoading: apptLoading } = useAppointments(businessId, {
    startDate: stripStart.toISOString().split('T')[0],
    endDate:   stripEnd.toISOString().split('T')[0],
    limit: 500,
  });

  // Fetch active therapists for filter chips
  const { data: therapistList } = useTherapists(businessId, { isActive: true });

  // Build therapist color map (stable across renders via ID hash)
  const therapistChips: { id: string; name: string; color: string }[] = useMemo(() => {
    if (!therapistList) return [];
    return therapistList.map((t: any, idx: number) => {
      const u = t.user;
      const first = u?.firstName ?? '';
      const last  = u?.lastName  ?? '';
      const name  = last ? `${first} ${last.charAt(0)}.` : first || 'Staff';
      return {
        id:    t.id,
        name,
        color: THERAPIST_COLORS[idx % THERAPIST_COLORS.length],
      };
    });
  }, [therapistList]);

  const colorMap = useMemo(() => {
    const m = new Map<string, string>();
    therapistChips.forEach((t) => m.set(t.id, t.color));
    return m;
  }, [therapistChips]);

  // Transform raw API appointments
  const allAppts: LocalAppt[] = useMemo(() => {
    const raw = (apptData as any)?.data ?? [];
    return raw
      .filter((a: any) => a.status !== 'CANCELLED')
      .map((a: any) => toLocalAppt(a, colorMap));
  }, [apptData, colorMap]);

  // Filter based on current view + therapist chip
  const filteredAppts = useMemo(() => {
    return allAppts.filter((a) => {
      const dateMatch = calView === 'week'
        ? weekDays.some((d) => isSameDay(a.date, d))
        : isSameDay(a.date, selectedDate);
      const therapistMatch = therapistFilter === null || a.therapistId === therapistFilter;
      return dateMatch && therapistMatch;
    });
  }, [allAppts, calView, weekDays, selectedDate, therapistFilter]);

  // Header stats for the current week
  const weekAppts = useMemo(
    () => allAppts.filter((a) => weekDays.some((d) => isSameDay(a.date, d))),
    [allAppts, weekDays],
  );

  const weekNum           = getWeekNumber();
  const weekSessionCount  = weekAppts.length;
  const weekTherapistIds  = useMemo(() => new Set(weekAppts.map((a) => a.therapistId)), [weekAppts]);
  const weekTherapistCount = weekTherapistIds.size || therapistChips.length;

  // Sum prices for the week (price comes from raw data)
  const weekBookedRaw = useMemo(() => {
    const raw = (apptData as any)?.data ?? [];
    return raw
      .filter((a: any) => a.status !== 'CANCELLED' && weekDays.some((d) => isSameDay(new Date(a.startTime), d)))
      .reduce((sum: number, a: any) => sum + (a.price ?? 0), 0);
  }, [apptData, weekDays]);

  const weekBookedLabel = weekBookedRaw > 0
    ? `$${(weekBookedRaw / 1000).toFixed(1)}k booked`
    : apptLoading ? '...' : '—';

  const subtitleStr = apptLoading
    ? 'Loading…'
    : `${weekSessionCount} session${weekSessionCount !== 1 ? 's' : ''} · ${weekTherapistCount} therapist${weekTherapistCount !== 1 ? 's' : ''} · ${weekBookedLabel}`;

  return (
    <div style={{ padding: '0 0 8px', fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)' }}>

      <LargeHeader
        eyebrow={`Calendar · Week ${weekNum}`}
        title="Appointments"
        subtitle={subtitleStr}
      />

      <div style={{ padding: '16px 16px 0' }}>

        {/* View Toggle */}
        <SegmentedControl<CalView>
          options={[
            { label: 'Agenda', value: 'agenda' },
            { label: 'Day',    value: 'day'    },
            { label: 'Week',   value: 'week'   },
          ]}
          value={calView}
          onChange={setCalView}
        />

        {/* Day Strip (hidden in week view) */}
        {calView !== 'week' && (
          <div style={{ marginTop: 14 }}>
            <DayStrip days={strip} selected={selectedDate} onSelect={setSelectedDate} />
          </div>
        )}

        {/* Therapist Filter Chips */}
        <div style={{ marginTop: 12 }}>
          <TherapistChips
            therapists={therapistChips}
            selected={therapistFilter}
            onSelect={setTherapistFilter}
          />
        </div>

        {/* Views */}
        <div style={{ marginTop: 16 }}>

          {calView === 'agenda' && (
            <AgendaView appts={filteredAppts} selectedDate={selectedDate} onAddTap={openNewSession} />
          )}

          {calView === 'day' && (
            <Card padding="12px" style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--m-ink2)',
                  marginBottom: 8,
                  fontFamily: 'var(--font-sora, Sora, system-ui, sans-serif)',
                }}
              >
                {DAY_ABBR[selectedDate.getDay()]}, {MONTH_ABBR[selectedDate.getMonth()]} {selectedDate.getDate()}
              </div>
              <DayColumn appts={filteredAppts} />
            </Card>
          )}

          {calView === 'week' && (
            <Card padding="12px" style={{ overflow: 'hidden' }}>
              <WeekMini
                weekDays={weekDays}
                appts={filteredAppts}
                onDayPress={(d) => {
                  setSelectedDate(d);
                  setCalView('day');
                }}
              />
            </Card>
          )}
        </div>

        <div style={{ marginTop: 20, marginBottom: 8 }}>
          <BookingCTA businessId={businessId} />
        </div>

      </div>
    </div>
  );
}
