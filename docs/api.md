# API Reference

All endpoints are Next.js Route Handlers under `apps/web/app/api/`.

## Authentication

Every protected endpoint requires:

```
Authorization: Bearer <supabase-jwt>
```

The JWT is obtained from `supabase.auth.getSession().data.session.access_token`.

**Auth helpers** (`lib/api-auth.ts`):
- `requireAuth(req)` — validates JWT; auto-creates `public.users` row on first call
- `requireBusinessAccess(user, businessId)` — verifies user belongs to the business

Public endpoints (no auth required) are prefixed `/api/public/`.

---

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check; returns `{ status: "ok" }` |

---

## Users

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update current user profile |
| GET | `/api/users/[id]` | Get user by ID (admin only) |
| PATCH | `/api/users/[id]` | Update user by ID (admin only) |

---

## Businesses

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/businesses` | Create a new business (BUSINESS_OWNER) |
| GET | `/api/businesses` | List businesses for current user |
| GET | `/api/businesses/[id]` | Get business details |
| PATCH | `/api/businesses/[id]` | Update business settings |
| DELETE | `/api/businesses/[id]` | Delete business (BUSINESS_OWNER) |

---

## Therapists

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/therapists` | Add therapist to business |
| GET | `/api/therapists` | List therapists (`?businessId=`) |
| GET | `/api/therapists/[id]` | Get therapist profile |
| PATCH | `/api/therapists/[id]` | Update therapist profile |
| DELETE | `/api/therapists/[id]` | Remove therapist |

### Therapist Availability

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/therapist-availability` | Get availability schedules (`?therapistId=`) |
| POST | `/api/therapist-availability` | Create availability schedule |
| GET | `/api/therapist-availability/[id]` | Get schedule by ID |
| PATCH | `/api/therapist-availability/[id]` | Update schedule |
| DELETE | `/api/therapist-availability/[id]` | Delete schedule |
| GET | `/api/therapist-availability/slots` | Get available time slots (`?therapistId=&date=`) |
| GET | `/api/therapist-availability/time-off` | List time-off entries |
| POST | `/api/therapist-availability/time-off` | Create time-off entry |
| DELETE | `/api/therapist-availability/time-off/[id]` | Delete time-off entry |

---

## Clients

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/clients` | Create client |
| GET | `/api/clients` | List clients (`?businessId=&search=&page=&limit=`) |
| GET | `/api/clients/[id]` | Get client details (includes medical history, appointments) |
| PATCH | `/api/clients/[id]` | Update client |
| DELETE | `/api/clients/[id]` | Soft-delete client |

---

## Appointments

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments` | List appointments (`?businessId=&from=&to=&therapistId=&status=`) |
| GET | `/api/appointments/[id]` | Get appointment details |
| PATCH | `/api/appointments/[id]` | Update appointment |
| DELETE | `/api/appointments/[id]` | Cancel appointment |
| POST | `/api/appointments/[id]/confirm` | Confirm appointment |
| POST | `/api/appointments/[id]/cancel` | Cancel with reason |
| POST | `/api/appointments/[id]/start` | Mark as in-progress |
| POST | `/api/appointments/[id]/complete` | Mark as completed |
| POST | `/api/appointments/[id]/no-show` | Mark as no-show |
| GET | `/api/appointments/availability/check` | Check slot availability (`?therapistId=&start=&end=`) |

### Recurring Appointments

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/recurring-appointments` | Create recurring series |
| GET | `/api/recurring-appointments` | List recurring series |
| GET | `/api/recurring-appointments/[id]` | Get series details |
| PATCH | `/api/recurring-appointments/[id]` | Update series |
| DELETE | `/api/recurring-appointments/[id]` | Cancel series |

---

## Intake Forms

### Templates

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/intake-form-templates` | Create form template |
| GET | `/api/intake-form-templates` | List templates (`?businessId=`) |
| GET | `/api/intake-form-templates/[id]` | Get template |
| PATCH | `/api/intake-form-templates/[id]` | Update template |
| DELETE | `/api/intake-form-templates/[id]` | Delete template |

### Instances

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/intake-forms` | Assign form to client |
| GET | `/api/intake-forms` | List forms (`?clientId=&businessId=`) |
| GET | `/api/intake-forms/[id]` | Get form with responses |
| PATCH | `/api/intake-forms/[id]` | Update form responses |
| DELETE | `/api/intake-forms/[id]` | Delete form |

### Public (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/intake-forms/[id]` | Get form for client to fill |
| POST | `/api/public/intake-forms/[id]/submit` | Submit completed form |

---

## Body Maps

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/body-maps` | Create body map annotation |
| GET | `/api/body-maps` | List body maps (`?clientId=`) |
| GET | `/api/body-maps/[id]` | Get body map |
| PATCH | `/api/body-maps/[id]` | Update annotations |
| DELETE | `/api/body-maps/[id]` | Delete body map |

---

## Medical Conditions

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/medical-conditions` | Add condition to client |
| GET | `/api/medical-conditions` | List conditions (`?clientId=`) |
| PATCH | `/api/medical-conditions/[id]` | Update condition |
| DELETE | `/api/medical-conditions/[id]` | Remove condition |

---

## Treatment Notes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/treatment-notes` | Create SOAP note |
| GET | `/api/treatment-notes` | List notes (`?clientId=&appointmentId=`) |
| GET | `/api/treatment-notes/[id]` | Get note with AI summary |
| PATCH | `/api/treatment-notes/[id]` | Update note |
| DELETE | `/api/treatment-notes/[id]` | Delete note |
| GET | `/api/treatment-notes/[id]/ai-summary` | Get AI summary |
| POST | `/api/treatment-notes/[id]/ai-summary/regenerate` | Regenerate AI summary |

### Therapist Notes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/therapist-notes` | Create internal note |
| GET | `/api/therapist-notes` | List notes (`?clientId=`) |
| GET | `/api/therapist-notes/[id]` | Get note |
| PATCH | `/api/therapist-notes/[id]` | Update note |
| DELETE | `/api/therapist-notes/[id]` | Delete note |
| POST | `/api/therapist-notes/[id]/toggle-pin` | Pin/unpin note |

---

## Payments

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/payments` | List payments (`?businessId=&clientId=&from=&to=`) |
| POST | `/api/payments/process-stripe` | Charge via Stripe card |
| POST | `/api/payments/process-cash` | Record cash payment |
| POST | `/api/payments/process-check` | Record check payment |
| GET | `/api/payments/[id]` | Get payment details |
| POST | `/api/payments/[id]/refund` | Issue refund (`{ amount?, reason }`) |
| GET | `/api/payments/stats/summary` | Payment summary stats |
| GET | `/api/payments/revenue-report` | Revenue report (`?from=&to=&groupBy=`) |
| GET | `/api/payments/reconciliation` | Reconciliation report |

### Saved Payment Methods

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/payments/setup-intent` | Create Stripe SetupIntent for saving card |
| GET | `/api/payments/saved-methods` | List saved methods for client |
| DELETE | `/api/payments/saved-methods/[id]` | Remove saved method |

### Invoices

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices` | List invoices (`?businessId=&clientId=&status=`) |
| GET | `/api/invoices/[id]` | Get invoice with line items |
| PATCH | `/api/invoices/[id]` | Update invoice |
| DELETE | `/api/invoices/[id]` | Delete draft invoice |
| POST | `/api/invoices/[id]/mark-sent` | Mark as sent |
| POST | `/api/invoices/[id]/mark-paid` | Mark as paid (offline payment) |
| POST | `/api/invoices/[id]/send` | Email invoice to client |
| POST | `/api/invoices/[id]/send-sms` | Send invoice link via SMS/WhatsApp |
| POST | `/api/invoices/[id]/line-items` | Add line item |
| PATCH | `/api/invoices/[id]/line-items/[index]` | Update line item |
| DELETE | `/api/invoices/[id]/line-items/[index]` | Delete line item |
| POST | `/api/invoices/from-appointment/[appointmentId]` | Create invoice pre-filled from appointment |
| GET | `/api/invoices/stats/summary` | Invoice summary stats |

### Memberships

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/memberships` | Create membership (creates Stripe subscription) |
| GET | `/api/memberships` | List memberships (`?businessId=&clientId=&status=`) |
| GET | `/api/memberships/[id]` | Get membership details |
| PATCH | `/api/memberships/[id]` | Update membership |
| POST | `/api/memberships/[id]/cancel` | Cancel membership |
| POST | `/api/memberships/[id]/pause` | Pause membership |
| POST | `/api/memberships/[id]/resume` | Resume membership |
| POST | `/api/memberships/[id]/redeem-session` | Redeem one session |
| GET | `/api/memberships/[id]/sessions-remaining` | Get session balance |
| POST | `/api/memberships/with-stripe` | Create membership with immediate Stripe charge |

### Packages

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/packages` | Create session package |
| GET | `/api/packages` | List packages (`?clientId=`) |
| GET | `/api/packages/[id]` | Get package details |
| PATCH | `/api/packages/[id]` | Update package |
| DELETE | `/api/packages/[id]` | Delete package |
| POST | `/api/packages/[id]/redeem-session` | Redeem one session |
| GET | `/api/packages/[id]/sessions-remaining` | Get session balance |

### Stripe Webhooks

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/stripe/webhook` | Stripe event handler (signature-validated) |

Handled events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

## Messaging

### Conversations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/conversations` | Start conversation with client |
| GET | `/api/conversations` | List conversations (`?businessId=&status=`) |
| GET | `/api/conversations/[id]` | Get conversation |
| GET | `/api/conversations/[id]/messages` | Get messages in conversation |
| POST | `/api/conversations/[id]/messages` | Send message |
| POST | `/api/conversations/[id]/read` | Mark as read |
| POST | `/api/conversations/[id]/archive` | Archive conversation |
| POST | `/api/conversations/[id]/close` | Close conversation |
| POST | `/api/conversations/[id]/reopen` | Reopen conversation |
| DELETE | `/api/conversations/[id]` | Delete conversation |
| GET | `/api/conversations/unread-count` | Get unread count |

### Messages

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/messages` | Send standalone message |
| POST | `/api/messages/bulk` | Send bulk message to multiple recipients |

### Communication Settings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/communication-settings` | Get channel settings for business |
| POST | `/api/communication-settings` | Create settings |
| PATCH | `/api/communication-settings` | Update channel toggles and credentials |

---

## Promotions

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/promotions` | Create promotion |
| GET | `/api/promotions` | List promotions (`?businessId=&status=`) |
| GET | `/api/promotions/[id]` | Get promotion |
| PATCH | `/api/promotions/[id]` | Update promotion |
| DELETE | `/api/promotions/[id]` | Delete promotion |
| POST | `/api/promotions/[id]/send` | Send promotion (or schedule) |
| GET | `/api/promotions/[id]/analytics` | Delivery analytics (sent/opened/clicked/converted) |

---

## Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/overview` | KPI overview (`?businessId=&from=&to=`) |
| GET | `/api/analytics/appointments` | Appointment analytics |
| GET | `/api/analytics/revenue` | Revenue analytics |
| GET | `/api/analytics/clients` | Client analytics (new, retention, churn) |
| GET | `/api/analytics/therapists` | Therapist performance metrics |

---

## Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reports/appointments` | Appointment report |
| GET | `/api/reports/clients` | Client report |
| GET | `/api/reports/revenue` | Revenue report |
| GET | `/api/reports/therapists` | Therapist report |
| GET | `/api/reports/financial-summary` | Financial summary |
| POST | `/api/reports/export` | Export report and email as attachment |

### Saved Reports

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/reports/saved` | Save report configuration |
| GET | `/api/reports/saved` | List saved reports |
| GET | `/api/reports/saved/[id]` | Get saved report config |
| PATCH | `/api/reports/saved/[id]` | Update saved report |
| DELETE | `/api/reports/saved/[id]` | Delete saved report |
| POST | `/api/reports/saved/[id]/trigger` | Trigger report run and email results |

All report endpoints accept `?from=&to=` (ISO dates) and `?businessId=`. Responses include `_durationMs` for performance monitoring.

---

## AI Features

All AI endpoints require auth. Input is capped to prevent prompt injection.

### SOAP Note Assist

| Method | Path | Description | Input limit |
|--------|------|-------------|-------------|
| POST | `/api/ai/soap-assist/autocomplete` | Autocomplete SOAP note field | 1,000 chars |
| POST | `/api/ai/soap-assist/format` | Format and structure note text | 3,000 chars |
| POST | `/api/ai/soap-assist/improve` | Improve clinical note quality | 3,000 chars |

Request body:
```json
{
  "field": "subjective",
  "text": "...",
  "context": { "appointmentType": "deep tissue" }
}
```

### Treatment Suggestions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ai/treatment-suggestions/[clientId]` | Get AI treatment suggestions for client |
| POST | `/api/ai/treatment-suggestions/[clientId]/feedback` | Submit feedback on suggestion quality |

Suggestions are generated from anonymised medical conditions and SOAP history — no PII is sent to the AI provider.

---

## Telehealth (Video Sessions)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/video-sessions/appointment/[appointmentId]` | Get or create session for appointment |
| POST | `/api/video-sessions/[id]/start` | Start session (host) |
| POST | `/api/video-sessions/[id]/join` | Join session (participant) |
| POST | `/api/video-sessions/[id]/end` | End session |

Powered by Twilio Video. Returns a room token valid for the session duration.

---

## Online Booking (Public)

No auth required.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/booking/[businessId]` | Get business info, services, therapists |
| GET | `/api/public/booking/[businessId]/slots` | Get available slots (`?therapistId=&date=`) |
| POST | `/api/public/booking/[businessId]` | Create booking (sends confirmation to client + therapist) |

---

## Push Notifications

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/push/subscribe` | Register push subscription (FCM/APNs token) |
| POST | `/api/push/send` | Send push notification to device |

---

## Cron Jobs

These endpoints are called by Vercel Cron (or equivalent scheduler) and are protected by a `CRON_SECRET` header.

| Method | Path | Schedule | Description |
|--------|------|----------|-------------|
| POST | `/api/cron/membership-reminders` | Daily | Send renewal reminders 7 days before membership expiry |
| POST | `/api/cron/invoice-reminders` | Daily | Send overdue reminders for unpaid invoices |

---

## Error Responses

All endpoints return standard JSON errors:

```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Missing or invalid JWT |
| 403 | Insufficient role or business access |
| 404 | Resource not found |
| 409 | Conflict (e.g., appointment overlap) |
| 500 | Internal server error |
