# Stage 6 Analytics - Quick Validation Checklist

**Date**: 2026-05-21
**Purpose**: Quick reference for testing
**Time**: ~30 minutes for quick check, 4-6 hours for comprehensive

---

## 🚀 Quick Start (5 min)

```bash
# Terminal 1
cd services/api && npm run start:dev

# Terminal 2
cd apps/web && npm run dev

# Browser
http://localhost:3000/analytics
```

---

## ✅ 30-Minute Quick Check

### 1. Analytics Dashboard (10 min)
- [ ] Navigate to `/analytics`
- [ ] All 16 KPI cards load
- [ ] Click "Last 7 Days" - data updates
- [ ] Click "Last 30 Days" - data updates
- [ ] Check mobile view (responsive)
- [ ] No console errors

**✅ PASS** if all KPIs show real numbers and date filtering works.

---

### 2. Reports (10 min)
- [ ] Navigate to `/reports`
- [ ] Generate Revenue Report
- [ ] Generate Client Report
- [ ] Change date range
- [ ] Apply a filter
- [ ] Reports show data

**✅ PASS** if all reports generate without errors.

---

### 3. Exports (5 min)
- [ ] Click "Export" button
- [ ] Select CSV format
- [ ] Select "Appointments" type
- [ ] Download file
- [ ] Open in Excel
- [ ] Data looks correct

**✅ PASS** if export downloads and opens correctly.

---

### 4. Security (5 min)
- [ ] Logout and try accessing `/analytics` - redirects to login
- [ ] Login as receptionist - cannot access financial data
- [ ] Login as business owner - full access
- [ ] Check Network tab - Authorization header present

**✅ PASS** if RBAC works correctly.

---

## ✅ Comprehensive Check (4-6 hours)

### Phase 1: Analytics (1 hour)
- [ ] Test 1.1: Initial Load
- [ ] Test 1.2: Date Range Filtering
- [ ] Test 1.3: Auto-Refresh (5 min wait)
- [ ] Test 1.4: Error Handling (stop API)
- [ ] Test 1.5: Responsive Design

### Phase 2: Reports (1-2 hours)
- [ ] Test 2.1: Revenue Report
- [ ] Test 2.2: Client Report
- [ ] Test 2.3: Therapist Performance Report
- [ ] Test 2.4: Appointment Report
- [ ] Test 2.5: Financial Summary Report
- [ ] Test 2.6: Report Filters
- [ ] Test 2.7: Saved Reports

### Phase 3: Exports (1 hour)
- [ ] Test 3.1: CSV Export
- [ ] Test 3.2: PDF Export
- [ ] Test 3.3: Excel Export
- [ ] Test 3.4: Export History

### Phase 4: Scheduled Reports (30 min)
- [ ] Test 4.1: Create Scheduled Report
- [ ] Test 4.2: Manual Trigger
- [ ] Test 4.3: Schedule Management

### Phase 5: User Workflows (1 hour)
- [ ] Workflow 1: Monthly Business Review
- [ ] Workflow 2: Weekly Report for Management
- [ ] Workflow 3: Therapist Self-Review (if applicable)

---

## 🐛 Quick Troubleshooting

| Issue | Quick Fix |
|-------|-----------|
| 401 Unauthorized | Logout and login again |
| 403 Forbidden | Check user role (need BUSINESS_OWNER) |
| Data shows 0 | Check date range, verify DB has data |
| Slow loading | Check backend logs for query time |
| Export fails | Check backend logs, verify exports/ folder exists |
| No data | Seed database with test data |

---

## ✅ Go/No-Go Criteria

### 🟢 GO if:
- ✅ All 16 KPIs load
- ✅ Date filtering works
- ✅ All 5 reports generate
- ✅ Exports download successfully
- ✅ RBAC enforced
- ✅ No critical errors
- ✅ Mobile usable

### 🔴 NO-GO if:
- ❌ KPIs show NaN or crash
- ❌ Reports fail to generate
- ❌ Security bypass possible
- ❌ Data accuracy issues
- ❌ Critical bugs found

---

## 📊 Sign-Off

### Developer Testing
- [ ] All features tested locally
- [ ] Known issues documented
- [ ] Code reviewed
- Date: ___________
- Signature: ___________

### QA Testing
- [ ] All test cases passed
- [ ] Edge cases tested
- [ ] RBAC verified
- Date: ___________
- Signature: ___________

### Product Owner
- [ ] User workflows validated
- [ ] Acceptance criteria met
- [ ] Ready for demo/production
- Date: ___________
- Signature: ___________

---

## 🎯 Next Steps After Validation

### If All Tests Pass:
1. ✅ Mark Stage 6 as complete
2. ✅ Prepare demo for stakeholders
3. ✅ Document known limitations
4. ✅ Plan email integration (if needed)
5. ✅ Move to Stage 7 or production

### If Issues Found:
1. 🔧 Document all issues
2. 🔧 Prioritize (critical vs nice-to-have)
3. 🔧 Fix critical issues
4. 🔧 Retest
5. 🔧 Repeat until pass

---

**Checklist Created**: 2026-05-21
**Format**: Quick reference for efficient testing
**Use Case**: Daily validation, pre-demo checks, pre-production sign-off
