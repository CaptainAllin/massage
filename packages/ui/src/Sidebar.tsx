'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from './utils';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  MessageSquare,
  CreditCard,
  Megaphone,
  BarChart3,
  FileText,
  Download,
  UserCog,
  Settings,
  Menu,
  X,
  Gift,
  Star,
  Package,
  Video,
  DollarSign,
  Zap,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  allowedRoles?: string[];
  badge?: number;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export interface SidebarProps {
  menuItems?: MenuItem[];
  userRole?: string | null;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  onSignOut?: () => void;
}

const defaultMenuGroups: MenuGroup[] = [
  {
    label: 'Practice',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST', 'THERAPIST'],
      },
      {
        label: 'Appointments',
        href: '/appointments',
        icon: Calendar,
        badge: 6,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST', 'THERAPIST'],
      },
      {
        label: 'Clients',
        href: '/clients',
        icon: Users,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST', 'THERAPIST'],
      },
      {
        label: 'Intake Forms',
        href: '/intake-forms',
        icon: ClipboardList,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST', 'THERAPIST'],
      },
      {
        label: 'Messages',
        href: '/messages',
        icon: MessageSquare,
        badge: 3,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST'],
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Payments',
        href: '/payments',
        icon: CreditCard,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST'],
      },
      {
        label: 'Therapists',
        href: '/therapists',
        icon: UserCog,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER'],
      },
      {
        label: 'Inventory',
        href: '/inventory',
        icon: Package,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST'],
      },
      {
        label: 'Telehealth',
        href: '/telehealth',
        icon: Video,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'THERAPIST'],
      },
      {
        label: 'Insurance',
        href: '/insurance',
        icon: ShieldCheck,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST'],
      },
    ],
  },
  {
    label: 'Growth',
    items: [
      {
        label: 'Promotions',
        href: '/promotions',
        icon: Megaphone,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER'],
      },
      {
        label: 'Gift Cards',
        href: '/gift-cards',
        icon: Gift,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST'],
      },
      {
        label: 'Loyalty',
        href: '/loyalty',
        icon: Star,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER'],
      },
      {
        label: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST'],
      },
      {
        label: 'Reports',
        href: '/reports',
        icon: FileText,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST'],
      },
    ],
  },
  {
    label: 'Tools',
    items: [
      {
        label: 'Automation',
        href: '/automation',
        icon: Zap,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER'],
      },
      {
        label: 'Payroll',
        href: '/payroll',
        icon: DollarSign,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER'],
      },
      {
        label: 'Exports',
        href: '/exports',
        icon: Download,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST'],
      },
      {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST', 'THERAPIST'],
      },
    ],
  },
];

function IrisLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-5 py-4 border-b border-[#EFE9F2]">
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)' }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 2C9 2 5 5.5 5 9.5C5 11.985 6.791 14 9 14C11.209 14 13 11.985 13 9.5C13 5.5 9 2 9 2Z"
            fill="white"
            opacity="0.9"
          />
          <path
            d="M9 14V16M6 15.5H12"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: '15px', fontWeight: 600, color: '#1E1830', letterSpacing: '-0.3px' }}>
          Iris
        </span>
        <span style={{ fontFamily: 'Sora, system-ui, sans-serif', fontSize: '10px', fontWeight: 400, color: '#7A7090', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '1px' }}>
          Care Suite
        </span>
      </div>
    </Link>
  );
}

function NavItem({ item, active, onClick }: { item: MenuItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all relative group"
      style={
        active
          ? {
              background: 'linear-gradient(90deg, #5D4AA8, #7665C2)',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(93,74,168,0.20)',
            }
          : {
              color: '#3D3450',
            }
      }
    >
      <span
        className={cn('transition-opacity', active ? 'opacity-100' : 'opacity-60 group-hover:opacity-90')}
      >
        <Icon size={16} />
      </span>
      <span className="flex-1 truncate" style={{ fontSize: '13.5px' }}>{item.label}</span>
      {item.badge != null && (
        <span
          className="text-xs font-semibold rounded-full px-1.5 py-0.5 leading-none"
          style={
            active
              ? { background: 'rgba(255,255,255,0.22)', color: '#fff', fontSize: '11px' }
              : { background: '#E8A893', color: '#fff', fontSize: '11px' }
          }
        >
          {item.badge}
        </span>
      )}
      {!active && (
        <span
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: '#EDE5F4' }}
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

function MenuContent({
  userRole,
  userName,
  userEmail,
  userInitials,
  onSignOut,
  onClose,
}: {
  userRole?: string | null;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  onSignOut?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const filteredGroups = defaultMenuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.allowedRoles) return true;
        if (!userRole) return false;
        return item.allowedRoles.includes(userRole);
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex h-full flex-col" style={{ background: '#FBF8FD' }}>
      <IrisLogo />

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5" style={{ scrollbarWidth: 'none' }}>
        {filteredGroups.map((group) => (
          <div key={group.label}>
            <p
              className="mb-1.5 px-3"
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '1.4px',
                textTransform: 'uppercase',
                color: '#7A7090',
                fontFamily: 'Sora, system-ui, sans-serif',
              }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile card */}
      <div
        className="mx-3 mb-3 rounded-2xl p-3 flex items-center gap-2.5"
        style={{ background: '#EDE5F4', border: '1px solid #E5DEEC' }}
      >
        <div
          className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg, #5D4AA8, #7665C2)', color: '#fff' }}
        >
          {userInitials ?? 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: '#1E1830' }}>
            {userName ?? 'My Account'}
          </p>
          <p className="text-xs truncate" style={{ color: '#7A7090', fontSize: '11px' }}>
            {userEmail ?? ''}
          </p>
        </div>
        {onSignOut && (
          <button
            onClick={onSignOut}
            title="Sign out"
            className="flex-shrink-0 rounded-lg p-1 transition-colors"
            style={{ color: '#7A7090' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#5D4AA8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#7A7090')}
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export function Sidebar({
  menuItems,
  userRole,
  userName,
  userEmail,
  userInitials,
  onSignOut,
}: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const sharedProps = {
    userRole,
    userName,
    userEmail,
    userInitials,
    onSignOut,
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-xl p-2 shadow-soft"
        style={{ background: '#FBF8FD', border: '1px solid #EFE9F2' }}
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5" style={{ color: '#1E1830' }} />
        ) : (
          <Menu className="h-5 w-5" style={{ color: '#1E1830' }} />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[230px] transition-transform duration-300 lg:hidden border-r',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ borderColor: '#EFE9F2' }}
      >
        <MenuContent {...sharedProps} onClose={() => setIsMobileMenuOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-[230px] flex-col fixed inset-y-0 left-0 border-r"
        style={{ borderColor: '#EFE9F2' }}
      >
        <MenuContent {...sharedProps} />
      </aside>
    </>
  );
}
