# Stage 5: Payments & Billing - Testing Guide

This guide provides comprehensive testing procedures for all payment and billing features implemented in Stage 5.

---

## Prerequisites

### 1. Environment Setup

**Backend** (`services/api/.env`):
```bash
# Stripe Test Mode Keys
STRIPE_SECRET_KEY=sk_test_51xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
ENABLE_STRIPE_PAYMENTS=true

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/wellness_crm
```

**Frontend** (`apps/web/.env.local`):
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 2. Stripe Test Mode Setup

1. Create a Stripe account at https://stripe.com
2. Use **Test Mode** (toggle in dashboard)
3. Get test API keys from Dashboard → Developers → API keys
4. Create webhook endpoint for local testing

### 3. Stripe CLI (for Webhook Testing)

Install Stripe CLI:
```bash
brew install stripe/stripe-brew/stripe
```

Login and forward webhooks:
```bash
stripe login
stripe listen --forward-to localhost:3001/stripe/webhook
```

This will output a webhook signing secret (`whsec_xxxxx`) - add it to your `.env` file.

---

## Test Data

### Stripe Test Cards

| Card Number | Purpose | Expected Behavior |
|------------|---------|-------------------|
| 4242 4242 4242 4242 | Success | Payment succeeds |
| 4000 0000 0000 9995 | Decline | Payment declined (insufficient funds) |
| 4000 0000 0000 0002 | Decline | Card declined |
| 4000 0025 0000 3155 | 3D Secure | Requires authentication |
| 4000 0000 0000 3220 | 3D Secure | Authentication required and fails |

**For all cards:**
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- Postal Code: Any valid code (e.g., 10001)

---

## Testing Checklist

### 1. Database & Migrations

- [ ] Run migrations: `cd packages/database && npm run migrate:dev`
- [ ] Verify 7 new tables created:
  - `StripeCustomer`
  - `Payment`
  - `Invoice`
  - `Membership`
  - `MembershipSession`
  - `PackagePurchase`
  - `PackageSession`
- [ ] Check relations between models
- [ ] Verify indexes created

### 2. Stripe Integration

#### Payment Processing
- [ ] Create payment with test card (4242 4242 4242 4242)
- [ ] Verify payment intent created in Stripe dashboard
- [ ] Confirm payment succeeds
- [ ] Check webhook received (`payment_intent.succeeded`)
- [ ] Verify Payment record updated to `COMPLETED`
- [ ] Verify `stripePaymentIntentId` saved

#### Failed Payments
- [ ] Create payment with declined card (4000 0000 0000 9995)
- [ ] Verify payment fails with error message
- [ ] Check webhook received (`payment_intent.payment_failed`)
- [ ] Verify Payment record updated to `FAILED`

#### Refunds
- [ ] Process full refund on completed payment
- [ ] Check webhook received (`charge.refunded`)
- [ ] Verify Payment status updated to `REFUNDED`
- [ ] Verify refund shows in Stripe dashboard
- [ ] Process partial refund ($50 of $100)
- [ ] Verify status updated to `PARTIALLY_REFUNDED`

#### Stripe Customer Management
- [ ] Create payment for new client
- [ ] Verify StripeCustomer record created
- [ ] Verify Stripe customer created in dashboard
- [ ] Create second payment for same client
- [ ] Verify same Stripe customer ID reused

### 3. Payment Management

#### Cash Payments
- [ ] Create cash payment for appointment
- [ ] Verify Payment record created with `method: CASH`
- [ ] Verify status is `COMPLETED`
- [ ] Verify no Stripe fields populated

#### Check Payments
- [ ] Create check payment with check number
- [ ] Verify Payment record created with `method: CHECK`
- [ ] Verify check number saved in metadata
- [ ] Verify status is `COMPLETED`

#### Payment List
- [ ] View payments page
- [ ] Verify all payments displayed
- [ ] Filter by status (COMPLETED, PENDING, REFUNDED)
- [ ] Filter by payment method (STRIPE, CASH, CHECK)
- [ ] Filter by date range
- [ ] Filter by client
- [ ] Test pagination

#### Payment Details
- [ ] Click on payment in list
- [ ] Verify payment detail page shows:
  - Amount and currency
  - Payment method and status
  - Client information
  - Stripe payment intent ID (if Stripe)
  - Stripe fee (if Stripe)
  - Timeline (created, processed, refunded)
- [ ] Test refund button (should only show for completed payments)

#### Payment Stats
- [ ] View payment stats cards on dashboard
- [ ] Verify total revenue calculation
- [ ] Verify pending payments count
- [ ] Verify refunded amount total
- [ ] Change date range filter
- [ ] Verify stats update

### 4. Invoice System

#### Invoice Creation
- [ ] Create manual invoice
- [ ] Add line items
- [ ] Set tax percentage
- [ ] Set discount (percentage and fixed amount)
- [ ] Verify totals calculated correctly: `subtotal + tax - discount = total`
- [ ] Save invoice as DRAFT
- [ ] Verify invoice number auto-generated (INV-2026-0001)

#### Invoice from Appointment
- [ ] Complete an appointment
- [ ] Click "Create Invoice" button
- [ ] Verify invoice pre-filled with:
  - Client information
  - Service description from appointment
  - Price from appointment
  - Current date as issue date
  - 30 days from now as due date
- [ ] Save invoice
- [ ] Verify invoice linked to appointment

#### Invoice Line Items
- [ ] Open existing invoice
- [ ] Add new line item
- [ ] Edit existing line item
- [ ] Delete line item
- [ ] Verify totals recalculate after each change
- [ ] Test quantity and unit price calculations

#### Invoice Status Transitions
- [ ] Create invoice (status: DRAFT)
- [ ] Mark as SENT
- [ ] Verify `sentAt` timestamp set
- [ ] Record payment (mark as PAID)
- [ ] Verify `paidAt` timestamp set
- [ ] Verify `amountPaid` equals `total`
- [ ] Verify `amountDue` is 0

#### Partial Payments
- [ ] Create invoice for $100
- [ ] Record payment of $50
- [ ] Verify `amountPaid` is $50
- [ ] Verify `amountDue` is $50
- [ ] Verify status still SENT
- [ ] Record payment of $50
- [ ] Verify status updated to PAID

#### Invoice List
- [ ] View invoices page
- [ ] Filter by status (DRAFT, SENT, PAID, OVERDUE)
- [ ] Filter by client
- [ ] Filter by date range
- [ ] Check "overdue" filter
- [ ] Test pagination

#### Invoice Stats
- [ ] Verify total invoiced amount
- [ ] Verify total paid amount
- [ ] Verify overdue count and amount
- [ ] Test date range filters

### 5. Membership System

#### Membership Creation (Cash)
- [ ] Create membership without Stripe
- [ ] Set monthly price
- [ ] Set sessions per month
- [ ] Set start date
- [ ] Save membership
- [ ] Verify status is ACTIVE
- [ ] Verify sessions count is 0

#### Membership Creation (Stripe Subscription)
- [ ] Create membership with Stripe
- [ ] Enter client details
- [ ] Enter payment method (4242 4242 4242 4242)
- [ ] Verify Stripe subscription created
- [ ] Check webhook received (`customer.subscription.created`)
- [ ] Verify `stripeSubscriptionId` saved
- [ ] Verify `stripePriceId` and `stripeCustomerId` saved
- [ ] Check Stripe dashboard for subscription

#### Session Redemption
- [ ] Create appointment for client with membership
- [ ] Complete appointment
- [ ] Redeem membership session for appointment
- [ ] Verify `sessionsUsed` incremented
- [ ] Verify MembershipSession record created
- [ ] Verify sessions remaining decremented
- [ ] Try to redeem same appointment twice (should fail)

#### Session Rollover
- [ ] Create membership with rollover enabled
- [ ] Use 2 of 4 monthly sessions
- [ ] Wait for cron job to run (or trigger manually)
- [ ] Verify `rolledOverSessions` is 2
- [ ] Verify `sessionsUsed` reset to 0
- [ ] Verify total available sessions is 4 (new) + 2 (rollover) = 6

#### Membership Pause/Resume
- [ ] Pause active membership
- [ ] Verify status updated to PAUSED
- [ ] Check webhook received (`customer.subscription.paused`)
- [ ] Verify Stripe subscription paused
- [ ] Resume membership
- [ ] Verify status updated to ACTIVE
- [ ] Check webhook received (`customer.subscription.resumed`)

#### Membership Cancellation
- [ ] Cancel membership
- [ ] Confirm cancellation
- [ ] Verify status updated to CANCELLED
- [ ] Check webhook received (`customer.subscription.deleted`)
- [ ] Verify `endDate` set
- [ ] Verify Stripe subscription cancelled

#### Membership List
- [ ] View memberships page
- [ ] Filter by status (ACTIVE, PAUSED, CANCELLED)
- [ ] Filter by client
- [ ] Verify session progress bars
- [ ] Verify stats cards (active count, revenue, paused count)

#### Membership Detail
- [ ] Click on membership
- [ ] Verify session usage progress bar
- [ ] Verify billing information (Stripe IDs, next billing date)
- [ ] View session history tab
- [ ] Test pause/resume/cancel buttons

### 6. Package System

#### Package Creation
- [ ] Create package (e.g., 5-session pack)
- [ ] Set total sessions
- [ ] Set total price
- [ ] Set expiration date (30 days from now)
- [ ] Save package
- [ ] Verify status is ACTIVE
- [ ] Verify `sessionsUsed` is 0

#### Session Redemption
- [ ] Create appointment for client with package
- [ ] Complete appointment
- [ ] Redeem package session for appointment
- [ ] Verify `sessionsUsed` incremented
- [ ] Verify PackageSession record created
- [ ] Verify sessions remaining decremented
- [ ] Try to redeem same appointment twice (should fail)

#### Package Expiration
- [ ] Create package with expiration date in past
- [ ] Wait for cron job to run (or trigger manually)
- [ ] Verify status updated to EXPIRED
- [ ] Try to redeem session from expired package (should fail)
- [ ] Verify expiration warning shows on detail page

#### Package Fully Used
- [ ] Create 3-session package
- [ ] Redeem all 3 sessions
- [ ] Verify status updated to FULLY_USED
- [ ] Try to redeem another session (should fail)

#### Package List
- [ ] View packages page
- [ ] Filter by status (ACTIVE, EXPIRED, FULLY_USED)
- [ ] Filter by client
- [ ] Verify session progress bars
- [ ] Verify expiration warnings for packages expiring soon
- [ ] Verify stats cards (active count, revenue, expiring soon)

#### Package Detail
- [ ] Click on package
- [ ] Verify session usage progress bar
- [ ] Verify expiration date and countdown
- [ ] Verify expiration warnings (expiring soon vs. expired)
- [ ] View session history tab

### 7. Integration Testing

#### Appointment → Payment Flow
- [ ] Create appointment
- [ ] Complete appointment
- [ ] View appointment detail
- [ ] Verify "Create Invoice" button shows
- [ ] Click "Create Invoice"
- [ ] Verify redirected to invoice detail
- [ ] Verify invoice pre-filled with appointment data
- [ ] Mark invoice as paid
- [ ] Go back to appointment detail
- [ ] Verify payment status shows "Paid"
- [ ] Verify link to invoice

#### Appointment → Membership Flow
- [ ] Client has active membership
- [ ] Create appointment for client
- [ ] Complete appointment
- [ ] Redeem membership session
- [ ] Verify appointment linked to membership
- [ ] View client profile → Memberships tab
- [ ] Verify session count updated

#### Client Profile Integration
- [ ] Go to client profile
- [ ] Click "Payments" tab
- [ ] Verify all client payments displayed
- [ ] Click "Memberships" tab
- [ ] Verify all client memberships with progress bars
- [ ] Click "Packages" tab
- [ ] Verify all client packages with expiration info
- [ ] Click on membership/package card
- [ ] Verify redirected to detail page

### 8. RBAC Testing

#### Business Owner
- [ ] View all payments
- [ ] Process refunds
- [ ] View all invoices
- [ ] Create/edit/delete invoices
- [ ] View all memberships and packages
- [ ] View financial stats

#### Receptionist
- [ ] Process payments
- [ ] Create invoices
- [ ] View payment history
- [ ] Try to process refund (should be denied)
- [ ] Create memberships and packages
- [ ] View limited financial data

#### Therapist
- [ ] View own appointment payments only
- [ ] Cannot access payments page (should redirect or show error)
- [ ] Cannot create invoices
- [ ] Can view read-only client payment info

#### Client
- [ ] View own invoices only
- [ ] View own payment history
- [ ] View own membership status
- [ ] View own packages
- [ ] Cannot access other clients' data

### 9. Edge Cases & Error Handling

#### Payment Errors
- [ ] Test insufficient Stripe balance
- [ ] Test expired card
- [ ] Test card declined
- [ ] Test network error during payment
- [ ] Verify user-friendly error messages

#### Invoice Errors
- [ ] Try to delete PAID invoice (should fail)
- [ ] Try to edit PAID invoice (should warn)
- [ ] Create invoice with negative amount (should fail)
- [ ] Create invoice with no line items (should fail)

#### Membership Errors
- [ ] Try to redeem session from PAUSED membership (should fail)
- [ ] Try to redeem session when no sessions remaining (should fail)
- [ ] Try to create duplicate subscription (should prevent)

#### Package Errors
- [ ] Try to redeem from EXPIRED package (should fail)
- [ ] Try to redeem from FULLY_USED package (should fail)
- [ ] Try to create package with 0 sessions (should fail)

### 10. Performance Testing

- [ ] Load 100+ payments in list (test pagination)
- [ ] Load 100+ invoices in list (test pagination)
- [ ] Test concurrent payment processing (10 simultaneous)
- [ ] Test webhook processing under load
- [ ] Test invoice calculations with 50+ line items

### 11. Webhook Testing

#### Using Stripe CLI
1. Start webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3001/stripe/webhook
   ```

2. In another terminal, trigger test events:
   ```bash
   # Test successful payment
   stripe trigger payment_intent.succeeded

   # Test failed payment
   stripe trigger payment_intent.payment_failed

   # Test refund
   stripe trigger charge.refunded

   # Test subscription created
   stripe trigger customer.subscription.created

   # Test subscription updated
   stripe trigger customer.subscription.updated

   # Test subscription deleted
   stripe trigger customer.subscription.deleted
   ```

3. Verify each webhook:
   - [ ] Received in backend logs
   - [ ] Signature verified
   - [ ] Database updated correctly
   - [ ] Audit log created

### 12. Multi-Tenant Testing

- [ ] Create payments for Business A
- [ ] Switch to Business B
- [ ] Verify cannot see Business A payments
- [ ] Create invoice for Business B
- [ ] Verify `businessId` correctly set
- [ ] Test all filters respect `businessId` boundary

---

## Automation Testing (Future)

### Unit Tests
- Payment service methods
- Invoice calculations
- Membership session tracking
- Package expiration logic

### Integration Tests
- Payment processing flow
- Invoice generation from appointment
- Membership session redemption
- Webhook handling

### E2E Tests
- Complete payment flow (UI → API → Stripe)
- Complete invoice flow (create → send → pay)
- Complete membership flow (create → redeem → renew)

---

## Production Checklist

Before deploying to production:

- [ ] Replace test Stripe keys with production keys
- [ ] Update webhook endpoint to production URL
- [ ] Verify webhook signing secret updated
- [ ] Test with real (small) payment
- [ ] Configure Stripe webhook in production dashboard
- [ ] Enable Stripe Connect (if multi-business)
- [ ] Set up monitoring for failed webhooks
- [ ] Configure alert for failed payments
- [ ] Test refund in production
- [ ] Document refund policy
- [ ] Train staff on payment processing
- [ ] Create backup plan for Stripe outage

---

## Troubleshooting

### Common Issues

**Webhook not receiving events:**
- Check Stripe CLI is running: `stripe listen --forward-to localhost:3001/stripe/webhook`
- Verify webhook secret in `.env` matches CLI output
- Check backend logs for signature verification errors

**Payment failing:**
- Verify Stripe publishable key is correct (pk_test_...)
- Check test card number (4242 4242 4242 4242)
- Look for error in Stripe dashboard → Logs

**Invoice total wrong:**
- Check calculation: `subtotal + tax - discount = total`
- Verify line item quantities and prices
- Check for rounding errors

**Membership sessions not resetting:**
- Check cron job is running
- Verify timezone settings
- Check `nextBillingDate` field
- Manually trigger: `POST /memberships/reset-sessions` (create endpoint for testing)

**Package not expiring:**
- Check cron job is running
- Verify `expirationDate` in past
- Manually trigger: `POST /packages/expire-packages` (create endpoint for testing)

---

## Test Results Template

```markdown
## Test Results - [Date]

### Environment
- Backend: ✅ Running on localhost:3001
- Frontend: ✅ Running on localhost:3000
- Database: ✅ PostgreSQL connected
- Stripe: ✅ Test mode

### Results Summary
- Total Tests: X
- Passed: X
- Failed: X
- Skipped: X

### Failed Tests
1. [Test Name]: [Reason]
2. [Test Name]: [Reason]

### Notes
- [Any observations or issues discovered]
```

---

## Next Steps After Testing

1. Document any bugs found
2. Create tickets for failed tests
3. Update implementation if needed
4. Retest failed scenarios
5. Get stakeholder sign-off
6. Prepare for production deployment
