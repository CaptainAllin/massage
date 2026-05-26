import { AppointmentWithRelations, Therapist } from '@massage/types';
import { AppointmentCard } from './AppointmentCard';
import { format, setHours, setMinutes, isSameDay } from 'date-fns';
import { useMemo, useRef } from 'react';
import { APT_COLORS } from '@/lib/appointment-colors';

interface StaffViewProps {
  currentDate: Date;
  appointments: AppointmentWithRelations[];
  therapists: Therapist[];
  onAppointmentClick: (appointment: AppointmentWithRelations) => void;
  onSlotClick: (date: Date, therapistId: string) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
const ROW_HEIGHT = 56;
const COL_MIN_WIDTH = 160;

export function StaffView({
  currentDate,
  appointments,
  therapists,
  onAppointmentClick,
  onSlotClick,
}: StaffViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const isToday = isSameDay(currentDate, now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = 7 * 60;
  const nowTopPx = ((nowMinutes - startMinutes) / 60) * ROW_HEIGHT;
  const showNowLine = isToday && nowMinutes >= startMinutes && nowMinutes <= (7 + 14) * 60;

  const grouped = useMemo(() => {
    const result: Record<string, AppointmentWithRelations[]> = {};
    appointments.forEach((appt) => {
      const startTime = new Date(appt.startTime);
      if (!isSameDay(startTime, currentDate)) return;
      const tIdx = therapists.findIndex((t) => t.id === appt.therapistId);
      if (tIdx === -1) return;
      const key = `${tIdx}-${startTime.getHours()}`;
      if (!result[key]) result[key] = [];
      result[key].push(appt);
    });
    return result;
  }, [appointments, therapists, currentDate]);

  if (therapists.length === 0) {
    return (
      <div
        className="rounded-2xl p-12 text-center"
        style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
      >
        <p className="text-sm" style={{ color: '#7A7090' }}>
          No therapists found. Add therapists to use staff view.
        </p>
      </div>
    );
  }

  const TIME_COL = 64;
  const gridTemplateColumns = `${TIME_COL}px repeat(${therapists.length}, minmax(${COL_MIN_WIDTH}px, 1fr))`;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
    >
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${TIME_COL + therapists.length * COL_MIN_WIDTH}px` }}>

          {/* Therapist header row */}
          <div className="grid" style={{ gridTemplateColumns, borderBottom: '1px solid #EFE9F2' }}>
            <div style={{ background: '#FBF8FD' }} />
            {therapists.map((therapist, idx) => {
              const tAny = therapist as any;
              const name = tAny.user
                ? `${tAny.user.firstName || ''} ${tAny.user.lastName || ''}`.trim()
                : 'Unknown';
              const color = APT_COLORS[idx % APT_COLORS.length];
              const initial = name ? name[0].toUpperCase() : '?';
              return (
                <div
                  key={therapist.id}
                  className="py-3 px-3 flex items-center gap-2"
                  style={{ background: '#FBF8FD', borderLeft: '1px solid #EFE9F2' }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: color + '22', border: `1.5px solid ${color}`, color }}
                  >
                    {initial}
                  </div>
                  <span className="text-sm font-semibold truncate" style={{ color: '#3D3450' }}>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Scrollable time grid */}
          <div
            ref={scrollRef}
            className="overflow-y-auto relative"
            style={{ maxHeight: 'calc(100vh - 340px)' }}
          >
            {/* Now-line */}
            {showNowLine && (
              <div
                className="absolute left-0 right-0 pointer-events-none z-10"
                style={{ top: `${nowTopPx}px` }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `${TIME_COL}px`,
                    right: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#5D4AA8',
                      flexShrink: 0,
                      marginLeft: '-4px',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: '1.5px',
                      background: '#5D4AA8',
                      boxShadow: '0 0 8px rgba(93,74,168,0.55)',
                    }}
                  />
                </div>
              </div>
            )}

            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid"
                style={{
                  gridTemplateColumns,
                  borderBottom: '1px solid #EFE9F2',
                  minHeight: `${ROW_HEIGHT}px`,
                }}
              >
                {/* Hour label */}
                <div
                  className="px-2 py-1 text-xs flex items-start justify-end pt-1.5"
                  style={{
                    background: '#FBF8FD',
                    color: '#7A7090',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {format(setHours(new Date(), hour), 'h a')}
                </div>

                {therapists.map((therapist, tIdx) => {
                  const key = `${tIdx}-${hour}`;
                  const appts = grouped[key] || [];
                  const slotDateTime = setMinutes(setHours(currentDate, hour), 0);

                  return (
                    <div
                      key={therapist.id}
                      className="p-1 cursor-pointer"
                      style={{ borderLeft: '1px solid #EFE9F2' }}
                      onMouseEnter={(e) => {
                        if (!appts.length) e.currentTarget.style.background = '#F5F0FA';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                      onClick={() => onSlotClick(slotDateTime, therapist.id)}
                    >
                      {appts.length > 0 && (
                        <div className="space-y-1">
                          {appts.map((appt) => (
                            <div
                              key={appt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAppointmentClick(appt);
                              }}
                            >
                              <AppointmentCard appointment={appt} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
