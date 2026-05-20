// User and Authentication Types
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  RECEPTIONIST = 'RECEPTIONIST',
  THERAPIST = 'THERAPIST',
  CLIENT = 'CLIENT',
}

export interface User {
  id: string;
  authProviderId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  phoneNumber: string | null;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Business Types
export interface Business {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  website: string | null;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Therapist Types
export interface Therapist {
  id: string;
  userId: string;
  businessId: string;
  specializations: string[];
  bio: string | null;
  licenseNumber: string | null;
  licenseExpiry: Date | null;
  hourlyRate: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Client Types
export interface Client {
  id: string;
  businessId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  dateOfBirth: Date | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  medicalHistory: any;
  allergies: string[];
  medications: string[];
  // Stage 2 additions
  primaryPhysician: string | null;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  occupation: string | null;
  goals: string | null;
  preferredTherapistId: string | null;
  lastVisitDate: Date | null;
  totalVisits: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Appointment Types
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface Appointment {
  id: string;
  businessId: string;
  clientId: string;
  therapistId: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  serviceType: string | null;
  duration: number;
  price: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Intake Form Types
export interface IntakeForm {
  id: string;
  businessId: string;
  clientId: string;
  templateId: string | null;
  formData: any;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Treatment Note Types
export interface TreatmentNote {
  id: string;
  businessId: string;
  appointmentId: string;
  clientId: string;
  therapistId: string;
  subjectiveFindings: string | null;
  objectiveFindings: string | null;
  assessment: string | null;
  plan: string | null;
  areasWorked: string[];
  techniques: string[];
  sessionDuration: number | null;
  followUpDate: Date | null;
  aiSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter Types
export interface ClientFilters extends PaginationParams {
  search?: string;
  isActive?: boolean;
  businessId?: string;
}

export interface TherapistFilters extends PaginationParams {
  search?: string;
  isActive?: boolean;
  businessId?: string;
  specialization?: string;
}

// ============================================================================
// STAGE 2: Core CRM Types
// ============================================================================

// Intake Form Template Types
export interface IntakeFormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'number' | 'email' | 'phone' | 'bodymap';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  order: number;
}

export interface IntakeFormTemplate {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  fields: IntakeFormField[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Body Map Types
export interface BodyMapRegion {
  name: string;
  coordinates: string; // SVG path coordinates
  painLevel: number; // 0-10 scale
  notes?: string;
}

export enum BodyMapView {
  FRONT = 'front',
  BACK = 'back',
  LEFT = 'left',
  RIGHT = 'right',
}

export interface BodyMap {
  id: string;
  businessId: string;
  clientId: string;
  appointmentId: string | null;
  treatmentNoteId: string | null;
  view: BodyMapView | string;
  regions: BodyMapRegion[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Therapist Note Types
export interface TherapistNote {
  id: string;
  businessId: string;
  clientId: string;
  therapistId: string;
  content: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Medical Condition Types
export enum MedicalConditionStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  MANAGED = 'managed',
}

export enum MedicalConditionSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

export interface MedicalCondition {
  id: string;
  businessId: string;
  clientId: string;
  name: string;
  diagnosisDate: Date | null;
  status: MedicalConditionStatus | string;
  severity: MedicalConditionSeverity | string | null;
  notes: string | null;
  treatmentPlan: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Client Types
export interface ClientProfile extends Client {
  medicalConditions?: MedicalCondition[];
  therapistNotes?: TherapistNote[];
  bodyMaps?: BodyMap[];
  recentAppointments?: Appointment[];
  intakeForms?: IntakeForm[];
  treatmentNotes?: TreatmentNote[];
}

export interface ClientStatistics {
  totalVisits: number;
  lastVisitDate: Date | null;
  upcomingAppointments: number;
  totalSpent?: number;
  preferredTherapist?: Therapist;
}

// Timeline Types
export type TimelineEventType =
  | 'appointment'
  | 'treatment_note'
  | 'intake_form'
  | 'therapist_note'
  | 'medical_condition'
  | 'body_map';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: Date;
  title: string;
  description?: string;
  metadata?: any;
  // Type-specific data
  appointment?: Appointment;
  treatmentNote?: TreatmentNote;
  intakeForm?: IntakeForm;
  therapistNote?: TherapistNote;
  medicalCondition?: MedicalCondition;
  bodyMap?: BodyMap;
}

export interface ClientTimeline {
  clientId: string;
  events: TimelineEvent[];
  totalEvents: number;
}

// Treatment Note with Relations
export interface TreatmentNoteWithRelations extends TreatmentNote {
  client?: Client;
  therapist?: Therapist;
  appointment?: Appointment;
  bodyMaps?: BodyMap[];
}

// Filter Types for Stage 2
export interface IntakeFormFilters extends PaginationParams {
  clientId?: string;
  businessId?: string;
  templateId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface TreatmentNoteFilters extends PaginationParams {
  clientId?: string;
  therapistId?: string;
  businessId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface TherapistNoteFilters extends PaginationParams {
  clientId?: string;
  therapistId?: string;
  businessId?: string;
  isPinned?: boolean;
}

export interface MedicalConditionFilters extends PaginationParams {
  clientId?: string;
  businessId?: string;
  status?: MedicalConditionStatus;
}

export interface BodyMapFilters extends PaginationParams {
  clientId?: string;
  businessId?: string;
  appointmentId?: string;
  treatmentNoteId?: string;
  view?: BodyMapView;
}

// ============================================================================
// STAGE 3: Scheduling & Calendar Types
// ============================================================================

// Therapist Availability Types
export interface TherapistAvailability {
  id: string;
  businessId: string;
  therapistId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TherapistTimeOff {
  id: string;
  businessId: string;
  therapistId: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  isAllDay: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Appointment Cancellation Types
export enum CancellationType {
  CLIENT = 'client',
  THERAPIST = 'therapist',
  BUSINESS = 'business',
}

export interface AppointmentCancellation {
  id: string;
  appointmentId: string;
  businessId: string;
  cancelledBy: string;
  reason: string | null;
  cancellationType: CancellationType | string;
  cancelledAt: Date;
}

// Availability Check Types
export enum AvailabilityCheckReason {
  NO_AVAILABILITY = 'NO_AVAILABILITY',
  OUTSIDE_HOURS = 'OUTSIDE_HOURS',
  TIME_OFF = 'TIME_OFF',
  CONFLICT = 'CONFLICT',
}

export interface AvailabilityCheck {
  available: boolean;
  reason?: AvailabilityCheckReason;
  conflicts?: Appointment[];
  message?: string;
}

// Enhanced Appointment Types
export interface AppointmentWithRelations extends Appointment {
  client?: Client;
  therapist?: Therapist & { user?: User };
  cancellation?: AppointmentCancellation;
  treatmentNotes?: TreatmentNote[];
}

// Appointment Request Types
export interface CreateAppointmentDto {
  businessId: string;
  clientId: string;
  therapistId: string;
  startTime: Date | string;
  duration: number; // in minutes
  serviceType?: string;
  price?: number;
  notes?: string;
}

export interface UpdateAppointmentDto {
  clientId?: string;
  therapistId?: string;
  startTime?: Date | string;
  duration?: number;
  serviceType?: string;
  price?: number;
  notes?: string;
  status?: AppointmentStatus;
}

export interface CancelAppointmentDto {
  reason?: string;
  cancellationType: CancellationType | string;
}

// Therapist Availability Request Types
export interface CreateAvailabilityDto {
  businessId: string;
  therapistId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface UpdateAvailabilityDto {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

export interface CreateTimeOffDto {
  businessId: string;
  therapistId: string;
  startDate: Date | string;
  endDate: Date | string;
  reason?: string;
  isAllDay?: boolean;
}

// Available Time Slots
export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

export interface AvailableSlotsQuery {
  therapistId: string;
  date: Date | string;
  duration?: number; // in minutes, default 60
}

// Enhanced Appointment Filters
export interface AppointmentFilters extends PaginationParams {
  status?: AppointmentStatus | AppointmentStatus[];
  therapistId?: string;
  clientId?: string;
  businessId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

// Therapist Availability Filters
export interface TherapistAvailabilityFilters extends PaginationParams {
  therapistId?: string;
  businessId?: string;
  dayOfWeek?: number;
  isActive?: boolean;
}

export interface TherapistTimeOffFilters extends PaginationParams {
  therapistId?: string;
  businessId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

// ============================================================================
// Recurring Appointments Types
// ============================================================================

export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface RecurringAppointmentSeries {
  id: string;
  businessId: string;
  clientId: string;
  therapistId: string;
  frequency: RecurrenceFrequency | string;
  interval: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  startTime: string;
  duration: number;
  startDate: Date;
  endDate: Date | null;
  occurrences: number | null;
  serviceType: string | null;
  price: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecurringSeriesDto {
  businessId: string;
  clientId: string;
  therapistId: string;
  frequency: RecurrenceFrequency | string;
  interval?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  startTime: string;
  duration: number;
  startDate: Date | string;
  endDate?: Date | string;
  occurrences?: number;
  serviceType?: string;
  price?: number;
  notes?: string;
}

export interface UpdateRecurringSeriesDto {
  frequency?: RecurrenceFrequency | string;
  interval?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  startTime?: string;
  duration?: number;
  endDate?: Date | string;
  occurrences?: number;
  serviceType?: string;
  price?: number;
  notes?: string;
  isActive?: boolean;
}

export interface RecurringSeriesWithRelations extends RecurringAppointmentSeries {
  client?: Client;
  therapist?: Therapist & { user?: User };
  appointments?: Appointment[];
}

// ============================================================================
// Appointment Reminders Types
// ============================================================================

export enum ReminderType {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
}

export enum ReminderStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  businessId: string;
  reminderType: ReminderType | string;
  scheduledFor: Date;
  status: ReminderStatus | string;
  sentAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReminderDto {
  appointmentId: string;
  businessId: string;
  reminderType: ReminderType | string;
  scheduledFor: Date | string;
}

export interface ReminderSettings {
  enabled: boolean;
  types: ReminderType[];
  hoursBeforeAppointment: number;
  customMessage?: string;
}

// Filters
export interface RecurringSeriesFilters extends PaginationParams {
  clientId?: string;
  therapistId?: string;
  businessId?: string;
  isActive?: boolean;
  frequency?: RecurrenceFrequency;
}

export interface ReminderFilters extends PaginationParams {
  appointmentId?: string;
  businessId?: string;
  status?: ReminderStatus;
  reminderType?: ReminderType;
}
