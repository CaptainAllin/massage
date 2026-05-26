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
  authUserId: string;
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
  isVirtual: boolean;
  isGroup: boolean;
  capacity: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum GroupBookingStatus {
  REGISTERED = 'REGISTERED',
  ATTENDED = 'ATTENDED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
}

export interface GroupBooking {
  id: string;
  appointmentId: string;
  clientId: string;
  status: GroupBookingStatus;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupBookingWithClient extends GroupBooking {
  client: Client;
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
  noteTemplateId: string | null;
  noteTemplateName: string | null;
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

// Note Template Types
export type NoteTemplateFieldType = 'text' | 'checkbox' | 'scale' | 'body-map' | 'signature';

export interface NoteTemplateField {
  label: string;
  type: NoteTemplateFieldType;
  required: boolean;
  placeholder?: string;
}

export type NoteTemplateCategory = 'Massage' | 'Chiro' | 'Physio' | 'General';

export interface NoteTemplate {
  id: string;
  businessId: string | null;
  name: string;
  category: string;
  fields: NoteTemplateField[];
  isGlobal: boolean;
  isArchived: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Community Template Types
export type CommunityTemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CommunityTemplate {
  id: string;
  name: string;
  category: string;
  fields: NoteTemplateField[];
  description: string | null;
  status: CommunityTemplateStatus;
  usageCount: number;
  submittedByUserId: string;
  submittedByBusinessId: string | null;
  rejectionReason: string | null;
  moderatedBy: string | null;
  moderatedAt: Date | null;
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
  videoSession?: VideoSession;
  groupBookings?: GroupBookingWithClient[];
  invoiceId?: string | null;
  paymentId?: string | null;
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
  isVirtual?: boolean;
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

// ============================================================================
// STAGE 4: Communication Center Types
// ============================================================================

// Message Enums
export enum MessageType {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ',
}

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum SenderType {
  USER = 'USER',
  CLIENT = 'CLIENT',
  SYSTEM = 'SYSTEM',
}

export enum RecipientType {
  CLIENT = 'CLIENT',
  USER = 'USER',
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  CLOSED = 'CLOSED',
}

export enum TemplateCategory {
  REMINDER = 'REMINDER',
  CONFIRMATION = 'CONFIRMATION',
  FOLLOW_UP = 'FOLLOW_UP',
  MARKETING = 'MARKETING',
  CUSTOM = 'CUSTOM',
}

// Message Interface
export interface Message {
  id: string;
  businessId: string;
  conversationId: string | null;
  senderId: string | null;
  senderType: SenderType | string;
  recipientId: string;
  recipientType: RecipientType | string;
  type: MessageType | string;
  subject: string | null;
  content: string;
  status: MessageStatus | string;
  direction: MessageDirection | string;
  externalId: string | null;
  externalStatus: string | null;
  failureReason: string | null;
  metadata: any;
  scheduledFor: Date | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Conversation Interface
export interface Conversation {
  id: string;
  businessId: string;
  clientId: string;
  type: MessageType | string;
  subject: string | null;
  status: ConversationStatus | string;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Message Template Interface
export interface MessageTemplate {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  type: MessageType | string;
  category: TemplateCategory | string | null;
  subject: string | null;
  content: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Communication Settings Interface
export interface CommunicationSettings {
  id: string;
  businessId: string;
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioPhoneNumber: string | null;
  sendGridApiKey: string | null;
  sendGridFromEmail: string | null;
  sendGridFromName: string | null;
  whatsappPhoneNumberId: string | null;
  whatsappAccessToken: string | null;
  smsEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  defaultReminderHours: number;
  autoSendReminders: boolean;
  emailSignature: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs for Communication Center
export interface SendMessageDto {
  businessId: string;
  recipientId: string;
  recipientType: RecipientType | string;
  type: MessageType | string;
  subject?: string;
  content: string;
  senderId?: string;
  senderType?: SenderType | string;
  scheduledFor?: Date | string;
  metadata?: any;
}

export interface SendBulkMessagesDto {
  businessId: string;
  recipientIds: string[];
  type: MessageType | string;
  subject?: string;
  content: string;
  scheduledFor?: Date | string;
  metadata?: any;
}

export interface CreateMessageTemplateDto {
  businessId: string;
  name: string;
  description?: string;
  type: MessageType | string;
  category?: TemplateCategory | string;
  subject?: string;
  content: string;
  isDefault?: boolean;
}

export interface UpdateMessageTemplateDto {
  name?: string;
  description?: string;
  type?: MessageType | string;
  category?: TemplateCategory | string;
  subject?: string;
  content?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface PreviewTemplateDto {
  templateId: string;
  variables: Record<string, any>;
}

export interface UpdateCommunicationSettingsDto {
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  sendGridApiKey?: string;
  sendGridFromEmail?: string;
  sendGridFromName?: string;
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
  whatsappEnabled?: boolean;
  defaultReminderHours?: number;
  autoSendReminders?: boolean;
  emailSignature?: string;
}

export interface CreateConversationDto {
  businessId: string;
  clientId: string;
  type: MessageType | string;
  subject?: string;
}

export interface UpdateConversationDto {
  status?: ConversationStatus | string;
  subject?: string;
}

// Relations
export interface MessageWithRelations extends Message {
  conversation?: Conversation;
}

export interface ConversationWithRelations extends Conversation {
  client?: Client;
  messages?: Message[];
}

// Filters
export interface MessageFilters extends PaginationParams {
  businessId?: string;
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
  type?: MessageType | MessageType[];
  status?: MessageStatus | MessageStatus[];
  direction?: MessageDirection;
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface ConversationFilters extends PaginationParams {
  businessId?: string;
  clientId?: string;
  type?: MessageType | MessageType[];
  status?: ConversationStatus | ConversationStatus[];
  search?: string;
  hasUnread?: boolean;
}

export interface MessageTemplateFilters extends PaginationParams {
  businessId?: string;
  type?: MessageType | MessageType[];
  category?: TemplateCategory;
  isActive?: boolean;
  search?: string;
}

// Statistics
export interface MessageStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalRead: number;
  deliveryRate: number;
  readRate: number;
  byType: {
    [key in MessageType]?: {
      sent: number;
      delivered: number;
      failed: number;
    };
  };
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

// ============================================================================
// STAGE 5: Payments & Billing Types
// ============================================================================

// Payment Enums
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentMethod {
  STRIPE_CARD = 'STRIPE_CARD',
  CASH = 'CASH',
  CHECK = 'CHECK',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PackageStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  FULLY_USED = 'FULLY_USED',
  CANCELLED = 'CANCELLED',
}

// Stripe Customer Interface
export interface StripeCustomer {
  id: string;
  businessId: string;
  clientId: string;
  stripeCustomerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Interface
export interface Payment {
  id: string;
  businessId: string;
  clientId: string;
  invoiceId: string | null;
  appointmentId: string | null;
  membershipId: string | null;
  packagePurchaseId: string | null;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod | string;
  status: PaymentStatus | string;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  stripeFee: number;
  refundedAmount: number;
  refundReason: string | null;
  description: string | null;
  notes: string | null;
  metadata: any;
  paidAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice Line Item
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  appointmentId?: string;
}

// Invoice Interface
export interface Invoice {
  id: string;
  businessId: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus | string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes: string | null;
  dueDate: Date | null;
  issuedAt: Date | null;
  paidAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Membership Interface
export interface Membership {
  id: string;
  businessId: string;
  clientId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  sessionsPerMonth: number;
  sessionsUsed: number;
  rolledOverSessions: number;
  allowRollover: boolean;
  status: MembershipStatus | string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  stripePriceId: string | null;
  billingCycleStart: Date;
  billingCycleEnd: Date;
  nextBillingDate: Date | null;
  startDate: Date;
  endDate: Date | null;
  pausedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Membership Session Interface
export interface MembershipSession {
  id: string;
  membershipId: string;
  appointmentId: string;
  businessId: string;
  redeemedAt: Date;
  createdAt: Date;
}

// Package Purchase Interface
export interface PackagePurchase {
  id: string;
  businessId: string;
  clientId: string;
  name: string;
  description: string | null;
  totalSessions: number;
  sessionsUsed: number;
  totalPrice: number;
  currency: string;
  status: PackageStatus | string;
  expirationDate: Date | null;
  expiredAt: Date | null;
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Package Session Interface
export interface PackageSession {
  id: string;
  packagePurchaseId: string;
  appointmentId: string;
  businessId: string;
  redeemedAt: Date;
  createdAt: Date;
}

// DTOs for Payments
export interface CreatePaymentDto {
  businessId: string;
  clientId: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod | string;
  invoiceId?: string;
  appointmentId?: string;
  membershipId?: string;
  packagePurchaseId?: string;
  description?: string;
  notes?: string;
  metadata?: any;
}

export interface ProcessStripePaymentDto {
  paymentId: string;
  paymentMethodId?: string;
  saveCard?: boolean;
}

export interface ProcessCashPaymentDto {
  paymentId: string;
  notes?: string;
}

export interface ProcessCheckPaymentDto {
  paymentId: string;
  checkNumber?: string;
  notes?: string;
}

export interface RefundPaymentDto {
  paymentId: string;
  amount?: number; // Optional for partial refund
  reason?: string;
}

// DTOs for Invoices
export interface CreateInvoiceDto {
  businessId: string;
  clientId: string;
  lineItems: InvoiceLineItem[];
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
  dueDate?: Date | string;
}

export interface UpdateInvoiceDto {
  status?: InvoiceStatus | string;
  lineItems?: InvoiceLineItem[];
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
  dueDate?: Date | string;
}

export interface AddLineItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
  appointmentId?: string;
}

export interface UpdateLineItemDto {
  index: number;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  appointmentId?: string;
}

// DTOs for Memberships
export interface CreateMembershipDto {
  businessId: string;
  clientId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  sessionsPerMonth: number;
  allowRollover?: boolean;
  startDate: Date | string;
}

export interface CreateMembershipWithStripeDto extends CreateMembershipDto {
  paymentMethodId: string;
  stripePriceId?: string;
}

export interface UpdateMembershipDto {
  name?: string;
  description?: string;
  price?: number;
  sessionsPerMonth?: number;
  allowRollover?: boolean;
}

export interface RedeemMembershipSessionDto {
  membershipId: string;
  appointmentId: string;
}

// DTOs for Packages
export interface CreatePackagePurchaseDto {
  businessId: string;
  clientId: string;
  name: string;
  description?: string;
  totalSessions: number;
  totalPrice: number;
  currency?: string;
  expirationDate?: Date | string;
}

export interface UpdatePackagePurchaseDto {
  name?: string;
  description?: string;
  expirationDate?: Date | string;
}

export interface RedeemPackageSessionDto {
  packagePurchaseId: string;
  appointmentId: string;
}

// Relations
export interface PaymentWithRelations extends Payment {
  client?: Client;
  invoice?: Invoice;
  appointment?: Appointment;
  membership?: Membership;
  packagePurchase?: PackagePurchase;
}

export interface InvoiceWithRelations extends Invoice {
  client?: Client;
  payments?: Payment[];
}

export interface MembershipWithRelations extends Membership {
  client?: Client;
  payments?: Payment[];
  membershipSessions?: MembershipSession[];
}

export interface PackagePurchaseWithRelations extends PackagePurchase {
  client?: Client;
  payments?: Payment[];
  packageSessions?: PackageSession[];
}

// Filters
export interface PaymentFilters extends PaginationParams {
  businessId?: string;
  clientId?: string;
  status?: PaymentStatus | PaymentStatus[];
  paymentMethod?: PaymentMethod | PaymentMethod[];
  startDate?: Date | string;
  endDate?: Date | string;
  minAmount?: number;
  maxAmount?: number;
}

export interface InvoiceFilters extends PaginationParams {
  businessId?: string;
  clientId?: string;
  status?: InvoiceStatus | InvoiceStatus[];
  startDate?: Date | string;
  endDate?: Date | string;
  overdue?: boolean;
}

export interface MembershipFilters extends PaginationParams {
  businessId?: string;
  clientId?: string;
  status?: MembershipStatus | MembershipStatus[];
}

export interface PackagePurchaseFilters extends PaginationParams {
  businessId?: string;
  clientId?: string;
  status?: PackageStatus | PackageStatus[];
  expiringSoon?: boolean;
}

// Statistics
export interface PaymentStats {
  totalRevenue: number;
  totalPending: number;
  totalRefunded: number;
  totalPayments: number;
  averagePayment: number;
  byMethod: {
    [key in PaymentMethod]?: {
      count: number;
      total: number;
    };
  };
  byStatus: {
    [key in PaymentStatus]?: {
      count: number;
      total: number;
    };
  };
  recentActivity: Array<{
    date: string;
    count: number;
    total: number;
  }>;
}

export interface InvoiceStats {
  totalInvoiced: number;
  totalPaid: number;
  totalOverdue: number;
  totalOutstanding: number;
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
  averageInvoice: number;
}

export interface MembershipStats {
  activeCount: number;
  pausedCount: number;
  cancelledCount: number;
  totalRevenue: number;
  averageSessionsUsed: number;
}

// ============================================================================
// STAGE 7: AI & Smart Features Types
// ============================================================================

// AI Enums
export enum AIProvider {
  OPENAI = 'OPENAI',
  CLAUDE = 'CLAUDE',
}

export enum AIFeature {
  NOTE_SUMMARY = 'NOTE_SUMMARY',
  TREATMENT_SUGGESTION = 'TREATMENT_SUGGESTION',
  SOAP_ASSIST = 'SOAP_ASSIST',
  SMART_REMINDER = 'SMART_REMINDER',
  ANALYTICS_INSIGHT = 'ANALYTICS_INSIGHT',
  VOICE_TRANSCRIPTION = 'VOICE_TRANSCRIPTION',
  VOICE_TO_SOAP = 'VOICE_TO_SOAP',
}

// AI Usage Interface
export interface AIUsage {
  id: string;
  businessId: string;
  userId: string;
  voiceNoteId: string | null;
  provider: AIProvider | string;
  model: string;
  feature: AIFeature | string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  metadata: any;
  requestDuration: number | null;
  createdAt: Date;
}

// ============================================================================
// STAGE 8: Voice-to-Text Notes Types
// ============================================================================

// Voice Note Enums
export enum VoiceNoteStatus {
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED',
  TRANSCRIBING = 'TRANSCRIBING',
  TRANSCRIBED = 'TRANSCRIBED',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

// Voice Note Interface
export interface VoiceNote {
  id: string;
  businessId: string;
  clientId: string;
  therapistId: string;
  appointmentId: string | null;
  treatmentNoteId: string | null;
  audioFileUrl: string;
  audioFileName: string;
  audioFileSize: number;
  audioMimeType: string;
  audioDuration: number | null;
  transcription: string | null;
  transcriptionCost: number;
  status: VoiceNoteStatus | string;
  recordedAt: Date;
  transcribedAt: Date | null;
  linkedToNoteAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs for Voice Notes
export interface CreateVoiceNoteDto {
  businessId: string;
  clientId: string;
  therapistId: string;
  appointmentId?: string;
  treatmentNoteId?: string;
  audioFile: File | Blob;
}

export interface UploadVoiceNoteDto {
  businessId: string;
  clientId: string;
  therapistId: string;
  appointmentId?: string;
  audioFileName: string;
  audioFileSize: number;
  audioMimeType: string;
  audioDuration?: number;
}

export interface UpdateVoiceNoteDto {
  appointmentId?: string;
  treatmentNoteId?: string;
  transcription?: string;
  status?: VoiceNoteStatus | string;
}

export interface TranscribeVoiceNoteDto {
  voiceNoteId: string;
}

export interface GenerateSOAPFromVoiceDto {
  voiceNoteId: string;
}

export interface VoiceNoteSearchDto {
  query: string;
  businessId: string;
  clientId?: string;
  therapistId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

// Relations
export interface VoiceNoteWithRelations extends VoiceNote {
  client?: Client;
  therapist?: Therapist & { user?: User };
  appointment?: Appointment;
  treatmentNote?: TreatmentNote;
}

// Filters
export interface VoiceNoteFilters extends PaginationParams {
  businessId?: string;
  clientId?: string;
  therapistId?: string;
  appointmentId?: string;
  treatmentNoteId?: string;
  status?: VoiceNoteStatus | VoiceNoteStatus[];
  startDate?: Date | string;
  endDate?: Date | string;
  hasTranscription?: boolean;
}

// Voice Note Statistics
export interface VoiceNoteStats {
  totalRecordings: number;
  totalTranscribed: number;
  totalDuration: number; // in seconds
  totalCost: number;
  averageDuration: number;
  transcriptionSuccessRate: number;
  recentActivity: Array<{
    date: string;
    count: number;
    duration: number;
  }>;
}

// ============================================================================
// STAGE 8: Telehealth Video Sessions (MVP - No Recording)
// ============================================================================

export enum VideoSessionStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export interface VideoSession {
  id: string;
  businessId: string;
  appointmentId: string;
  therapistId: string;
  clientId: string;
  dailyRoomName: string;
  dailyRoomUrl: string;
  therapistToken: string | null;
  clientToken: string | null;
  status: VideoSessionStatus;
  scheduledFor: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  actualDuration: number | null;
  screenShareEnabled: boolean;
  chatEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoSessionWithRelations extends VideoSession {
  appointment?: Appointment;
  therapist?: Therapist & { user?: User };
  client?: Client;
}
