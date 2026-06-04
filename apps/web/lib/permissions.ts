/**
 * 6.0.1 — All gated actions in the app.
 * Use these constants everywhere: API guards, frontend hooks, and nav filtering.
 */
export const Permission = {
  DASHBOARD_VIEW: 'dashboard:view',

  APPOINTMENTS_VIEW: 'appointments:view',
  APPOINTMENTS_MANAGE: 'appointments:manage',

  CLIENTS_VIEW: 'clients:view',
  CLIENTS_MANAGE: 'clients:manage',

  MESSAGES_VIEW: 'messages:view',
  MESSAGES_SEND: 'messages:send',

  PAYMENTS_VIEW: 'payments:view',
  PAYMENTS_PROCESS: 'payments:process',

  INTAKE_FORMS_VIEW: 'intake_forms:view',
  INTAKE_FORMS_MANAGE: 'intake_forms:manage',

  TASKS_VIEW: 'tasks:view',
  TASKS_MANAGE: 'tasks:manage',

  TREATMENT_NOTES_VIEW: 'treatment_notes:view',
  TREATMENT_NOTES_MANAGE: 'treatment_notes:manage',

  THERAPISTS_VIEW: 'therapists:view',
  THERAPISTS_MANAGE: 'therapists:manage',

  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_MANAGE: 'inventory:manage',

  TELEHEALTH_VIEW: 'telehealth:view',

  INSURANCE_VIEW: 'insurance:view',
  INSURANCE_MANAGE: 'insurance:manage',

  PROMOTIONS_VIEW: 'promotions:view',
  PROMOTIONS_MANAGE: 'promotions:manage',

  GIFT_CARDS_VIEW: 'gift_cards:view',
  GIFT_CARDS_MANAGE: 'gift_cards:manage',

  LOYALTY_VIEW: 'loyalty:view',
  LOYALTY_MANAGE: 'loyalty:manage',

  ANALYTICS_VIEW: 'analytics:view',
  REPORTS_VIEW: 'reports:view',
  REPORTS_FINANCIAL: 'reports:financial',
  DELIVERY_REPORTS_VIEW: 'delivery_reports:view',

  AUTOMATION_VIEW: 'automation:view',
  AUTOMATION_MANAGE: 'automation:manage',

  PAYROLL_VIEW: 'payroll:view',
  PAYROLL_MANAGE: 'payroll:manage',

  EXPORTS_VIEW: 'exports:view',

  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MANAGE: 'settings:manage',

  STAFF_VIEW: 'staff:view',
  STAFF_INVITE: 'staff:invite',
  STAFF_MANAGE: 'staff:manage',

  DEVELOPER_VIEW: 'developer:view',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const ALL: Permission[] = Object.values(Permission);

/**
 * 6.0.2 / 6.1 — Default permission sets per BusinessMemberRole.
 *
 * OWNER        → everything (6.1.1)
 * SENIOR_THERAPIST → all bookings + client records + performance reports + staff schedules;
 *                    no financials, payroll, or business settings (6.1.2)
 * THERAPIST    → own schedule, own clients, own notes, own performance only (6.1.3)
 * RECEPTIONIST → all bookings + client records; no financials, payroll, or settings (6.1.4)
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: ALL,

  SENIOR_THERAPIST: [
    Permission.DASHBOARD_VIEW,
    Permission.APPOINTMENTS_VIEW,
    Permission.APPOINTMENTS_MANAGE,
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_MANAGE,
    Permission.MESSAGES_VIEW,
    Permission.MESSAGES_SEND,
    Permission.INTAKE_FORMS_VIEW,
    Permission.INTAKE_FORMS_MANAGE,
    Permission.TASKS_VIEW,
    Permission.TASKS_MANAGE,
    Permission.TREATMENT_NOTES_VIEW,
    Permission.TREATMENT_NOTES_MANAGE,
    Permission.THERAPISTS_VIEW,
    Permission.INVENTORY_VIEW,
    Permission.TELEHEALTH_VIEW,
    Permission.INSURANCE_VIEW,
    Permission.GIFT_CARDS_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.REPORTS_VIEW,
    Permission.DELIVERY_REPORTS_VIEW,
    Permission.EXPORTS_VIEW,
    Permission.SETTINGS_VIEW,
    Permission.STAFF_VIEW,
  ],

  THERAPIST: [
    Permission.DASHBOARD_VIEW,
    Permission.APPOINTMENTS_VIEW,
    Permission.CLIENTS_VIEW,
    Permission.INTAKE_FORMS_VIEW,
    Permission.TASKS_VIEW,
    Permission.TREATMENT_NOTES_VIEW,
    Permission.TREATMENT_NOTES_MANAGE,
    Permission.TELEHEALTH_VIEW,
    Permission.SETTINGS_VIEW,
  ],

  RECEPTIONIST: [
    Permission.DASHBOARD_VIEW,
    Permission.APPOINTMENTS_VIEW,
    Permission.APPOINTMENTS_MANAGE,
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_MANAGE,
    Permission.MESSAGES_VIEW,
    Permission.MESSAGES_SEND,
    Permission.PAYMENTS_VIEW,
    Permission.PAYMENTS_PROCESS,
    Permission.INTAKE_FORMS_VIEW,
    Permission.INTAKE_FORMS_MANAGE,
    Permission.TASKS_VIEW,
    Permission.TASKS_MANAGE,
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_MANAGE,
    Permission.INSURANCE_VIEW,
    Permission.INSURANCE_MANAGE,
    Permission.GIFT_CARDS_VIEW,
    Permission.GIFT_CARDS_MANAGE,
    Permission.ANALYTICS_VIEW,
    Permission.REPORTS_VIEW,
    Permission.DELIVERY_REPORTS_VIEW,
    Permission.EXPORTS_VIEW,
    Permission.SETTINGS_VIEW,
  ],
};

/** Per-member or per-role overrides — grant adds, revoke removes. */
export type PermissionOverrides = { grant?: string[]; revoke?: string[] };

/**
 * 6.0.3 / 6.2 — Resolve effective permissions for a member.
 *
 * Order:
 *  1. Start with ROLE_PERMISSIONS[role] defaults
 *  2. Apply business-level role overrides (roleOverrides)
 *  3. Apply member-level overrides (memberOverrides)
 *
 * memberOverrides may be the legacy string[] format (add-only) or the new
 * { grant, revoke } format.
 */
export function resolvePermissions(
  role: string,
  memberOverrides?: PermissionOverrides | string[] | null,
  roleOverrides?: PermissionOverrides | null,
): Set<Permission> {
  const base = ROLE_PERMISSIONS[role] ?? [];
  const set = new Set<Permission>(base);

  if (roleOverrides) {
    for (const p of (roleOverrides.grant ?? []) as Permission[]) set.add(p);
    for (const p of roleOverrides.revoke ?? []) set.delete(p as Permission);
  }

  if (memberOverrides) {
    if (Array.isArray(memberOverrides)) {
      for (const p of memberOverrides as Permission[]) set.add(p);
    } else {
      for (const p of (memberOverrides.grant ?? []) as Permission[]) set.add(p);
      for (const p of memberOverrides.revoke ?? []) set.delete(p as Permission);
    }
  }

  return set;
}

// ─── Display metadata (used by the permission customisation UI) ───────────────

export const PERMISSION_LABELS: Record<string, string> = {
  'dashboard:view': 'View dashboard',
  'appointments:view': 'View appointments',
  'appointments:manage': 'Manage appointments',
  'clients:view': 'View clients',
  'clients:manage': 'Edit client records',
  'messages:view': 'View messages',
  'messages:send': 'Send messages',
  'payments:view': 'View payments',
  'payments:process': 'Process payments',
  'intake_forms:view': 'View intake forms',
  'intake_forms:manage': 'Manage intake forms',
  'tasks:view': 'View tasks',
  'tasks:manage': 'Manage tasks',
  'treatment_notes:view': 'View treatment notes',
  'treatment_notes:manage': 'Edit treatment notes',
  'therapists:view': 'View therapists',
  'therapists:manage': 'Manage therapists',
  'inventory:view': 'View inventory',
  'inventory:manage': 'Manage inventory',
  'telehealth:view': 'Access telehealth',
  'insurance:view': 'View insurance',
  'insurance:manage': 'Manage insurance',
  'promotions:view': 'View promotions',
  'promotions:manage': 'Manage promotions',
  'gift_cards:view': 'View gift cards',
  'gift_cards:manage': 'Manage gift cards',
  'loyalty:view': 'View loyalty',
  'loyalty:manage': 'Manage loyalty',
  'analytics:view': 'View analytics',
  'reports:view': 'View reports',
  'reports:financial': 'View financial reports',
  'delivery_reports:view': 'View delivery reports',
  'automation:view': 'View automation',
  'automation:manage': 'Manage automation',
  'payroll:view': 'View payroll',
  'payroll:manage': 'Manage payroll',
  'exports:view': 'Export data',
  'settings:view': 'View settings',
  'settings:manage': 'Manage settings',
  'staff:view': 'View staff',
  'staff:invite': 'Invite staff',
  'staff:manage': 'Manage staff',
  'developer:view': 'Developer tools',
};

export const PERMISSION_GROUPS: Array<{ label: string; permissions: Permission[] }> = [
  { label: 'Dashboard', permissions: [Permission.DASHBOARD_VIEW] },
  { label: 'Appointments', permissions: [Permission.APPOINTMENTS_VIEW, Permission.APPOINTMENTS_MANAGE] },
  { label: 'Clients', permissions: [Permission.CLIENTS_VIEW, Permission.CLIENTS_MANAGE] },
  { label: 'Payments', permissions: [Permission.PAYMENTS_VIEW, Permission.PAYMENTS_PROCESS] },
  { label: 'Clinical', permissions: [Permission.INTAKE_FORMS_VIEW, Permission.INTAKE_FORMS_MANAGE, Permission.TREATMENT_NOTES_VIEW, Permission.TREATMENT_NOTES_MANAGE, Permission.TELEHEALTH_VIEW] },
  { label: 'Messages', permissions: [Permission.MESSAGES_VIEW, Permission.MESSAGES_SEND] },
  { label: 'Tasks', permissions: [Permission.TASKS_VIEW, Permission.TASKS_MANAGE] },
  { label: 'Staff', permissions: [Permission.STAFF_VIEW, Permission.STAFF_INVITE, Permission.STAFF_MANAGE] },
  { label: 'Reports & Analytics', permissions: [Permission.ANALYTICS_VIEW, Permission.REPORTS_VIEW, Permission.REPORTS_FINANCIAL, Permission.DELIVERY_REPORTS_VIEW, Permission.EXPORTS_VIEW] },
  { label: 'Inventory', permissions: [Permission.INVENTORY_VIEW, Permission.INVENTORY_MANAGE] },
  { label: 'Insurance', permissions: [Permission.INSURANCE_VIEW, Permission.INSURANCE_MANAGE] },
  { label: 'Promotions', permissions: [Permission.PROMOTIONS_VIEW, Permission.PROMOTIONS_MANAGE] },
  { label: 'Gift Cards', permissions: [Permission.GIFT_CARDS_VIEW, Permission.GIFT_CARDS_MANAGE] },
  { label: 'Loyalty', permissions: [Permission.LOYALTY_VIEW, Permission.LOYALTY_MANAGE] },
  { label: 'Automation', permissions: [Permission.AUTOMATION_VIEW, Permission.AUTOMATION_MANAGE] },
  { label: 'Payroll', permissions: [Permission.PAYROLL_VIEW, Permission.PAYROLL_MANAGE] },
  { label: 'Settings', permissions: [Permission.SETTINGS_VIEW, Permission.SETTINGS_MANAGE] },
  { label: 'Therapists', permissions: [Permission.THERAPISTS_VIEW, Permission.THERAPISTS_MANAGE] },
  { label: 'Developer', permissions: [Permission.DEVELOPER_VIEW] },
];
