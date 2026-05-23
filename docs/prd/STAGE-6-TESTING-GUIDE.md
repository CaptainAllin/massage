# Stage 6 Analytics - Testing & Validation Guide

**Date**: 2026-05-21
**Purpose**: Step-by-step guide to test frontend-backend integration
**Status**: Ready to Execute

---

## 🚀 Quick Start

### Prerequisites
1. **Database**: PostgreSQL running with seed data
2. **Backend API**: Running on `http://localhost:3001`
3. **Frontend**: Running on `http://localhost:3000`
4. **Auth**: User account with BUSINESS_OWNER role

### Starting the Apps

```bash
# Terminal 1 - Start API Server
cd /Users/amit/Desktop/Apps/massage/services/api
npm run start:dev

# Terminal 2 - Start Frontend
cd /Users/amit/Desktop/Apps/massage/apps/web
npm run dev

# Terminal 3 - (Optional) Watch for changes
npm run test -- --watch
```

Wait for both servers to start (about 30 seconds).

---

## ✅ Phase 1: Analytics Dashboard Testing

### Test 1.1: Initial Load
**What to Test**: Dashboard loads without errors

**Steps**:
1. Navigate to `http://localhost:3000/analytics`
2. Observe loading state (should show skeleton cards)
3. Wait for data to load

**Expected Result**:
- ✅ 16 KPI cards appear
- ✅ All cards show numbers (not "0" or "NaN")
- ✅ Loading states disappear
- ✅ No console errors

**What You Should See**:
```
Revenue Metrics:
- Total Revenue: $XX,XXX.XX ↑ X.X%
- Average Transaction: $XXX.XX
- Transactions: XXX
- Outstanding: $X,XXX.XX

Client Metrics:
- Active Clients: XXX
- New Clients: XX ↑ X.X%
- Returning Rate: XX.X%
- Lifetime Value: $X,XXX.XX

Appointment Metrics:
- Total Appointments: XXX ↑ X.X%
- Completion Rate: XX.X%
- Cancellation Rate: X.X%
- No-Show Rate: X.X%

Therapist Metrics:
- Active Therapists: X
- Avg Sessions: XX.X
- Top Performer: [Name]
- Utilization Rate: XX.X%
```

**If Something's Wrong**:
- Check browser console (F12) for errors
- Verify API is running: `curl http://localhost:3001/api/v1/analytics/overview`
- Check network tab for failed requests
- Verify you're logged in (check for Authorization header)

---

### Test 1.2: Date Range Filtering
**What to Test**: Date range buttons work

**Steps**:
1. Click "Last 7 Days" button
2. Observe KPIs update
3. Click "Last 30 Days"
4. Observe KPIs update again
5. Try "Last 90 Days" and "Last Year"

**Expected Result**:
- ✅ KPIs reload when clicking date buttons
- ✅ Numbers change based on date range
- ✅ Loading state shows briefly
- ✅ Trend percentages update
- ✅ "vs previous period" reflects correct comparison

**Debugging**:
- Check Network tab: Should see GET requests to `/analytics/overview?startDate=...&endDate=...`
- Verify query parameters are correct dates
- Check response data in Network tab

---

### Test 1.3: Auto-Refresh
**What to Test**: Data refreshes every 5 minutes

**Steps**:
1. Note the current KPI values
2. Wait 5 minutes (or change system time)
3. Observe if data refreshes

**Expected Result**:
- ✅ Green pulsing dot visible (indicates auto-refresh active)
- ✅ Data refreshes automatically after 5 minutes
- ✅ No page reload required
- ✅ Loading state appears briefly during refresh

**Note**: This is handled by React Query's `refetchInterval`.

---

### Test 1.4: Error Handling
**What to Test**: Graceful error display

**Steps**:
1. Stop the API server
2. Reload analytics page
3. Observe error message

**Expected Result**:
- ✅ Red error banner appears: "Error loading analytics data. Please try again later."
- ✅ No crash or blank page
- ✅ Error message is user-friendly

**Then**:
1. Restart API server
2. Click "Retry" or reload page
3. Data should load normally

---

### Test 1.5: Responsive Design
**What to Test**: Mobile and tablet views

**Steps**:
1. Open Chrome DevTools (F12)
2. Click device toolbar (or Ctrl+Shift+M)
3. Test on:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

**Expected Result**:
- ✅ Cards stack vertically on mobile
- ✅ Grid adjusts (1 column → 2 columns → 4 columns)
- ✅ Text remains readable
- ✅ Buttons are touchable (44px+ tap target)
- ✅ No horizontal scrolling

---

## ✅ Phase 2: Reports Testing

### Test 2.1: Revenue Report
**What to Test**: Revenue report generates

**Steps**:
1. Navigate to `http://localhost:3000/reports`
2. Select "Revenue Report" from dropdown
3. Choose date range (Last 30 Days)
4. Click "Generate Report"

**Expected Result**:
- ✅ Loading indicator appears
- ✅ Report displays with:
  - Total revenue number
  - Revenue by therapist (table)
  - Revenue by service type (table)
  - Revenue by payment method (table)
  - Refunds total
- ✅ All tables show real data
- ✅ Numbers add up correctly

**Validation**:
- Check total revenue matches sum of all therapist revenues
- Verify payment method breakdown adds to total
- Confirm refunds are subtracted from gross

---

### Test 2.2: Client Report
**What to Test**: Client report generates

**Steps**:
1. Select "Client Report"
2. Generate for Last 30 Days

**Expected Result**:
- ✅ New clients count
- ✅ Returning clients count
- ✅ Top clients list (top 10)
- ✅ Inactive clients list (> 90 days)
- ✅ Client lifetime value displayed

**Validation**:
- Top clients sorted by total spent (highest first)
- Inactive clients show "days since last visit"
- LTV numbers look reasonable

---

### Test 2.3: Therapist Performance Report
**What to Test**: Therapist report generates

**Steps**:
1. Select "Therapist Performance Report"
2. Generate report

**Expected Result**:
- ✅ List of all therapists
- ✅ Sessions completed per therapist
- ✅ Revenue generated per therapist
- ✅ Utilization rate percentages
- ✅ Rebooking rate percentages

**Validation**:
- Utilization rates between 0-100%
- Revenue numbers match analytics dashboard
- All active therapists included

---

### Test 2.4: Appointment Report
**What to Test**: Appointment report generates

**Steps**:
1. Select "Appointment Report"
2. Generate report

**Expected Result**:
- ✅ Total appointments count
- ✅ Status breakdown (Completed, Cancelled, No-Show)
- ✅ Service type distribution
- ✅ Peak times heatmap/table
- ✅ Average duration

**Validation**:
- Status percentages add to 100%
- Peak times show busiest hours/days
- Average duration seems reasonable (30-90 min typical)

---

### Test 2.5: Financial Summary Report
**What to Test**: Financial report generates

**Steps**:
1. Select "Financial Summary Report"
2. Generate report

**Expected Result**:
- ✅ Gross revenue
- ✅ Net revenue (after refunds)
- ✅ Taxes collected (if applicable)
- ✅ Payment method breakdown
- ✅ Refunds total
- ✅ Chargebacks (if implemented)

**Validation**:
- Net = Gross - Refunds - Chargebacks
- Payment methods add to gross revenue
- All currency formatted correctly

---

### Test 2.6: Report Filters
**What to Test**: Filters work correctly

**Steps**:
1. Generate Revenue Report
2. Apply therapist filter (select specific therapist)
3. Click "Generate Report" again
4. Verify results are filtered

**Try All Filters**:
- Date range (custom dates)
- Therapist filter
- Service type filter
- Client filter

**Expected Result**:
- ✅ Filtered results match selected criteria
- ✅ Totals recalculate correctly
- ✅ "Showing X results" message updates

---

### Test 2.7: Saved Reports
**What to Test**: Save and load reports

**Steps**:
1. Generate a report
2. Click "Save Report"
3. Enter name: "Weekly Revenue"
4. Save
5. Navigate away and come back
6. Load saved report
7. Click "Load"

**Expected Result**:
- ✅ Report saves successfully
- ✅ Saved reports list shows your report
- ✅ Loading saved report applies same filters
- ✅ Can update saved report
- ✅ Can delete saved report

---

## ✅ Phase 3: Export Testing

### Test 3.1: CSV Export
**What to Test**: CSV download works

**Steps**:
1. Click "Export" button (in reports or client list)
2. Select "CSV" format
3. Choose "Appointments" export type
4. Click "Download"
5. Wait for export to complete
6. Open downloaded CSV in Excel

**Expected Result**:
- ✅ File downloads successfully
- ✅ Filename includes timestamp
- ✅ CSV opens in Excel/Google Sheets
- ✅ All columns present
- ✅ Data formatted correctly
- ✅ No encoding issues (special characters work)

**Validation**:
- Check row count matches expected
- Verify all required columns present
- Test with different export types (clients, payments, etc.)

---

### Test 3.2: PDF Export
**What to Test**: PDF generation works

**Steps**:
1. Export same data as PDF
2. Wait for generation
3. Download and open PDF

**Expected Result**:
- ✅ PDF downloads successfully
- ✅ Professional formatting (landscape orientation)
- ✅ Header with title and date
- ✅ Table with data (first 10 columns, first 100 rows)
- ✅ Readable fonts and spacing
- ✅ No text overflow

**Check**:
- PDF opens in browser
- Print preview looks good
- File size reasonable (< 5MB for 100 rows)

---

### Test 3.3: Excel Export
**What to Test**: Excel file works

**Steps**:
1. Export as Excel (.xlsx)
2. Open in Microsoft Excel or LibreOffice

**Expected Result**:
- ✅ File opens without errors
- ✅ Formatted headers (bold, colored background)
- ✅ Auto-sized columns
- ✅ Data in proper format (dates, currency, numbers)
- ✅ Can edit and save

---

### Test 3.4: Export History
**What to Test**: Export tracking works

**Steps**:
1. Create 3 exports (different types)
2. Navigate to "Export History" (if page exists)
3. Or check export status indicator

**Expected Result**:
- ✅ All exports listed
- ✅ Shows export type, format, date
- ✅ File size and row count displayed
- ✅ Download count increments
- ✅ Can re-download previous exports
- ✅ Old exports (> 7 days) are cleaned up

---

## ✅ Phase 4: Scheduled Reports Testing

### Test 4.1: Create Scheduled Report
**What to Test**: Scheduling interface works

**Steps**:
1. Navigate to scheduled reports section
2. Click "Create Schedule"
3. Configure:
   - Report type: Revenue
   - Schedule: Weekly (Monday 7 AM)
   - Email: your@email.com (note: won't send yet)
4. Save

**Expected Result**:
- ✅ Schedule saves successfully
- ✅ Shows in scheduled reports list
- ✅ Active status displayed
- ✅ Next run time calculated correctly
- ✅ Email field shows (with "Delivery pending" note)

---

### Test 4.2: Manual Trigger
**What to Test**: Manual trigger works

**Steps**:
1. Find saved schedule
2. Click "Run Now" button
3. Wait for generation

**Expected Result**:
- ✅ Report generates immediately
- ✅ Success message appears
- ✅ Last run time updates
- ✅ Can view generated report
- ✅ Email delivery skipped (with note)

**Check Backend Logs**:
- Should see: "Report generated successfully. Would send to: your@email.com"
- This confirms infrastructure is ready for email

---

### Test 4.3: Schedule Management
**What to Test**: CRUD operations work

**Steps**:
1. Edit schedule (change time or frequency)
2. Deactivate schedule (turn off)
3. Reactivate schedule
4. Delete schedule

**Expected Result**:
- ✅ Updates save correctly
- ✅ Inactive schedules don't run
- ✅ Active/inactive toggle works
- ✅ Delete removes schedule
- ✅ Confirmation dialog on delete

---

## ✅ Phase 5: User Workflows

### Workflow 1: Monthly Business Review
**Persona**: Business Owner

**Steps**:
1. Login as business owner
2. Go to analytics dashboard
3. Select "Last 30 Days"
4. Review all 16 KPIs
5. Compare to previous month (check growth %)
6. Generate Financial Summary Report
7. Generate Therapist Performance Report
8. Export client list to CSV
9. Schedule monthly revenue report

**Success Criteria**:
- ✅ Can complete entire workflow without errors
- ✅ All data makes sense together
- ✅ Workflow takes < 5 minutes
- ✅ Reports are useful and actionable

---

### Workflow 2: Weekly Report for Management
**Persona**: Receptionist

**Steps**:
1. Login as receptionist
2. Generate Appointment Report (last week)
3. Check completion rates
4. Review peak booking times
5. Generate Client Report
6. Export appointments to Excel
7. (Try to access Financial Report - should be blocked)

**Success Criteria**:
- ✅ Can access allowed reports
- ✅ Cannot access financial data (403 Forbidden)
- ✅ Export works for receptionist role
- ✅ RBAC enforced correctly

---

### Workflow 3: Therapist Self-Review
**Persona**: Therapist (if access implemented)

**Steps**:
1. Login as therapist
2. Try to access analytics dashboard
3. (Should be blocked or see only own data)

**Success Criteria**:
- ✅ Therapist cannot see business-wide analytics
- ✅ Can see own performance if implemented
- ✅ RBAC works as expected

---

## 🐛 Common Issues & Fixes

### Issue 1: "401 Unauthorized"
**Symptom**: All API calls fail with 401

**Causes**:
- Not logged in
- Session expired
- Token not being sent

**Fix**:
1. Check if logged in: `localStorage.getItem('supabase.auth.token')`
2. Try logging out and back in
3. Check Network tab: Verify `Authorization: Bearer ...` header present
4. Clear cookies and local storage

---

### Issue 2: "403 Forbidden"
**Symptom**: Some endpoints return 403

**Causes**:
- User role doesn't have permission
- Trying to access another business's data

**Fix**:
- Check user role: Should be BUSINESS_OWNER or RECEPTIONIST
- Verify businessId matches in request
- Check backend logs for RBAC rejection

---

### Issue 3: Data Shows "0" or "NaN"
**Symptom**: KPIs show zero or NaN

**Causes**:
- No data in database
- Date range outside data range
- Calculation error

**Fix**:
1. Check if database has data: `SELECT COUNT(*) FROM appointments;`
2. Try different date range
3. Check backend logs for calculation errors
4. Seed database if empty

---

### Issue 4: Slow Loading (> 5s)
**Symptom**: Dashboard takes forever to load

**Causes**:
- Large dataset
- Unoptimized queries
- Network issues

**Fix**:
1. Check query time in backend logs
2. Check Network tab: How long does API call take?
3. If query > 2s, need optimization
4. Consider adding indexes or caching

---

### Issue 5: Export Fails
**Symptom**: Export button doesn't work

**Causes**:
- Export service error
- File permissions
- Memory issue (large dataset)

**Fix**:
1. Check backend logs for export errors
2. Try smaller dataset
3. Check /exports directory exists and is writable
4. Verify PDFMake and ExcelJS installed

---

## ✅ Validation Checklist

### Analytics Dashboard
- [ ] All 16 KPIs load without errors
- [ ] Numbers are realistic (not 0 or NaN)
- [ ] Date range buttons work
- [ ] Auto-refresh works (5 min)
- [ ] Loading states display correctly
- [ ] Error handling works
- [ ] Mobile responsive
- [ ] No console errors

### Reports
- [ ] All 5 report types generate
- [ ] Filters work correctly
- [ ] Saved reports work
- [ ] Data accuracy verified
- [ ] Visual presentation good
- [ ] No calculation errors

### Exports
- [ ] CSV export works
- [ ] PDF export works
- [ ] Excel export works
- [ ] Export history tracked
- [ ] Download counts increment
- [ ] Old exports cleaned up

### Scheduled Reports
- [ ] Can create schedule
- [ ] Manual trigger works
- [ ] Can edit/delete schedules
- [ ] Active/inactive toggle works
- [ ] Next run time calculated correctly
- [ ] Email placeholder shows

### Security & RBAC
- [ ] Business owner has full access
- [ ] Receptionist has limited access
- [ ] Therapist cannot access analytics
- [ ] Authentication required on all endpoints
- [ ] BusinessId isolation works

### Performance
- [ ] Dashboard loads < 2s
- [ ] API queries < 2s
- [ ] Export generation < 10s
- [ ] No memory leaks
- [ ] Auto-refresh doesn't cause issues

### User Experience
- [ ] Navigation is intuitive
- [ ] Error messages are helpful
- [ ] Loading states are clear
- [ ] Success feedback provided
- [ ] No broken links

---

## 📊 Success Metrics

### Must Pass (Go/No-Go)
- ✅ All core features work without crashes
- ✅ No critical security issues
- ✅ RBAC enforced correctly
- ✅ Data accuracy verified
- ✅ Mobile usable

### Should Pass (Polish Required)
- ✅ Performance < 2s for queries
- ✅ No console warnings
- ✅ Visual polish complete
- ✅ All edge cases handled
- ✅ Documentation complete

### Nice to Have (Future)
- ⏸️ Email delivery working
- ⏸️ Advanced filters
- ⏸️ Custom dashboards
- ⏸️ Data export to third-party tools

---

## 🎯 Final Sign-Off

### Before Calling It Done:
1. [ ] All Must Pass criteria met
2. [ ] Should Pass criteria mostly met
3. [ ] Critical bugs fixed
4. [ ] Known issues documented
5. [ ] Stakeholder demo successful

### Before Production:
1. [ ] All tests passed in staging
2. [ ] Performance tested with production data
3. [ ] Security audit passed
4. [ ] Email integration complete
5. [ ] Monitoring setup
6. [ ] Rollback plan ready

---

**Testing Guide Created**: 2026-05-21
**Status**: Ready to Execute
**Estimated Test Time**: 4-6 hours for complete validation
**Next Action**: Start Phase 1 - Analytics Dashboard Testing
