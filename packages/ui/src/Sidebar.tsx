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
  UserCog,
  Settings,
  Menu,
  X,
} from 'lucide-react';

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: string[];
}

export interface SidebarProps {
  menuItems?: MenuItem[];
  userRole?: string | null;
}

const defaultMenuItems: MenuItem[] = [
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
    allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST'],
  },
  {
    label: 'Payments',
    href: '/payments',
    icon: CreditCard,
    allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST'],
  },
  {
    label: 'Promotions',
    href: '/promotions',
    icon: Megaphone,
    allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER'],
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER'],
  },
  {
    label: 'Therapists',
    href: '/therapists',
    icon: UserCog,
    allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    allowedRoles: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'RECEPTIONIST', 'THERAPIST'],
  },
];

export function Sidebar({ menuItems = defaultMenuItems, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.allowedRoles) return true;
    if (!userRole) return false;
    return item.allowedRoles.includes(userRole);
  });

  const isActive = (href: string) => pathname === href;

  const MenuContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <span className="text-xl font-bold text-foreground font-display">
            Wellness CRM
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-white shadow-soft'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-xl bg-card p-2 shadow-soft"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transition-transform duration-300 lg:hidden',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <MenuContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-card border-r border-border">
        <MenuContent />
      </aside>
    </>
  );
}
