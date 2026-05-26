'use client';

interface WhatsNewItem {
  date: string;
  title: string;
  description: string;
  tag: 'New' | 'Improved' | 'Fix';
}

const WHATS_NEW: WhatsNewItem[] = [
  {
    date: 'May 2026',
    title: 'AI treatment note summaries',
    description: 'Generate SOAP note summaries in one click using AI.',
    tag: 'New',
  },
  {
    date: 'May 2026',
    title: 'Push notifications',
    description: 'Get browser push alerts for new bookings and upcoming appointments.',
    tag: 'New',
  },
  {
    date: 'Apr 2026',
    title: 'Therapist color-coding',
    description: 'Calendar now color-codes each therapist for faster scanning.',
    tag: 'Improved',
  },
  {
    date: 'Apr 2026',
    title: 'Data exports',
    description: 'Export clients, appointments, and payments to CSV anytime.',
    tag: 'New',
  },
];

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  New: { bg: '#E8F5E9', color: '#2D8A67' },
  Improved: { bg: '#EDE5F4', color: '#5D4AA8' },
  Fix: { bg: '#FFF3E0', color: '#C97E68' },
};

interface WhatsNewPanelProps {
  onDismiss: () => void;
}

export function WhatsNewPanel({ onDismiss }: WhatsNewPanelProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#fff', border: '1px solid #EFE9F2', boxShadow: '0 2px 12px rgba(93,74,168,0.06)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold" style={{ fontSize: '15px', color: '#1E1830' }}>
            What&apos;s New
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>
            Recent updates to Iris Care Suite
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs font-medium px-2.5 py-1 rounded-lg"
          style={{ color: '#7A7090', background: '#F3F4F7' }}
        >
          Dismiss
        </button>
      </div>

      <div className="space-y-3">
        {WHATS_NEW.map((item, i) => {
          const ts = TAG_STYLES[item.tag];
          return (
            <div
              key={i}
              className="flex items-start gap-3 pb-3"
              style={{ borderBottom: i < WHATS_NEW.length - 1 ? '1px solid #F0EDF5' : 'none' }}
            >
              <span
                className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
                style={{ background: ts.bg, color: ts.color }}
              >
                {item.tag}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: '#1E1830' }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#7A7090' }}>{item.description}</p>
              </div>
              <span className="flex-shrink-0 text-xs" style={{ color: '#B0A8C0' }}>{item.date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
