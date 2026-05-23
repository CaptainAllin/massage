# Telehealth Video Consultations - Quick Testing Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Get Daily.co API Key
1. Go to https://dashboard.daily.co/
2. Sign up (free account is fine for testing)
3. Navigate to: **Settings** → **Developers**
4. Copy your **API Key**
5. Note your **Domain** (e.g., `your-name.daily.co`)

### Step 2: Configure Environment
```bash
# Add to .env file
DAILY_API_KEY=your_copied_api_key_here
DAILY_DOMAIN=your-name.daily.co
```

### Step 3: Restart API Server
```bash
# Terminal 1 - API Server
cd services/api
npm run dev

# Terminal 2 - Web App
cd apps/web
npm run dev
```

### Step 4: Create Test Appointment
1. Open http://localhost:3000
2. Login as therapist
3. Go to Calendar/Appointments
4. Click "Schedule Appointment"
5. Fill in:
   - Client: Any test client
   - Therapist: Yourself
   - Date: Today
   - Time: Current time + 5 minutes
   - Duration: 60 minutes
   - ✅ **Check "Virtual Appointment (Video Call)"**
6. Click "Schedule Appointment"

### Step 5: Create Video Session
1. Click on the appointment you just created
2. You'll see a blue box: "Virtual Appointment"
3. Click "Create Video Session"
4. Wait 2-3 seconds for confirmation
5. Button changes to "Join Video Call"

### Step 6: Test Video Call
1. Click "Join Video Call"
2. Allow camera and microphone permissions
3. You should see yourself in the video!

### Step 7: Test Two-Party Call (Optional)
1. Open a second browser (different profile or incognito)
2. Login as the client
3. Open the same appointment
4. Click "Join Video Call"
5. Both users should now see each other!

---

## 🧪 Full Test Scenarios

### Test 1: Create Virtual Appointment
**Goal:** Verify virtual appointment flag works

**Steps:**
1. Open "Schedule Appointment" modal
2. Check "Virtual Appointment" checkbox
3. Verify blue info banner appears
4. Submit form
5. Open appointment details
6. Verify "Virtual Appointment" section shows

**Expected Result:**
- [x] Checkbox toggles correctly
- [x] Info banner appears/disappears
- [x] Appointment saves with isVirtual=true
- [x] Detail modal shows virtual section

---

### Test 2: Create Video Session
**Goal:** Verify Daily.co room creation

**Steps:**
1. Open virtual appointment detail
2. Click "Create Video Session"
3. Check network tab for API call
4. Wait for button to change

**Expected Result:**
- [x] POST /video-sessions/appointment/{id} succeeds
- [x] Button shows "Creating..." during request
- [x] Button changes to "Join Video Call"
- [x] Daily.co room created (check dashboard)

**Troubleshooting:**
- If fails, check Daily.co API key is valid
- Check server logs for error messages
- Verify DAILY_API_KEY environment variable is set

---

### Test 3: Join Video Call (Single User)
**Goal:** Verify iframe loading and video preview

**Steps:**
1. Click "Join Video Call" button
2. Allow camera/microphone permissions
3. Wait for iframe to load
4. Check video preview

**Expected Result:**
- [x] Modal opens full-screen
- [x] Browser prompts for camera/mic
- [x] Daily.co iframe loads
- [x] Video preview shows your camera feed
- [x] UI controls visible (mute, camera, share screen)

---

### Test 4: Join Video Call (Two Users)
**Goal:** Verify multi-party video works

**Setup:**
- Browser 1: Therapist logged in
- Browser 2: Client logged in (incognito or different profile)

**Steps:**
1. Browser 1: Open appointment, join video call
2. Browser 2: Open same appointment, join video call
3. Verify both users see each other

**Expected Result:**
- [x] Therapist sees client's video
- [x] Client sees therapist's video
- [x] Audio works both ways
- [x] No echo or feedback

---

### Test 5: Screen Sharing
**Goal:** Verify screen sharing works

**Steps:**
1. Join video call
2. Click screen share button
3. Select screen/window to share
4. Verify other party sees shared screen

**Expected Result:**
- [x] Screen share button visible
- [x] Browser shows screen picker
- [x] Screen sharing starts
- [x] Other party sees shared screen

---

### Test 6: Chat Feature
**Goal:** Verify in-call chat works

**Steps:**
1. Join video call with 2 users
2. Open chat panel (button in Daily.co UI)
3. Send message from User 1
4. Check User 2 receives message

**Expected Result:**
- [x] Chat button visible
- [x] Chat panel opens
- [x] Messages send successfully
- [x] Messages appear for both parties

---

### Test 7: Leave Call
**Goal:** Verify session end tracking

**Steps:**
1. Join video call
2. Note current time
3. Click "Leave" button in Daily.co UI
4. Modal closes
5. Check database for session end time

**Expected Result:**
- [x] Leave button works
- [x] Modal closes automatically
- [x] Session status = ENDED
- [x] endedAt timestamp recorded
- [x] actualDuration calculated correctly

---

### Test 8: Permission Checks
**Goal:** Verify only authorized users can join

**Steps:**
1. Login as User A (not therapist or client)
2. Try to access video session for appointment
3. Should get "Forbidden" error

**Expected Result:**
- [x] API returns 403 Forbidden
- [x] Error message: "You cannot join this session"
- [x] Video modal does not open

---

### Test 9: Mobile Responsive
**Goal:** Verify works on mobile/tablet

**Steps:**
1. Open appointment on mobile device
2. Create and join video session
3. Test video/audio/controls

**Expected Result:**
- [x] Virtual appointment checkbox visible
- [x] "Join Video Call" button accessible
- [x] Video modal fills screen
- [x] Controls are touch-friendly
- [x] Camera/mic work on mobile

---

### Test 10: Appointment Cancellation
**Goal:** Verify video button disabled for cancelled appointments

**Steps:**
1. Create virtual appointment with video session
2. Cancel the appointment
3. Try to click "Join Video Call"

**Expected Result:**
- [x] Join button is disabled
- [x] Cannot join cancelled appointment
- [x] Session status still exists in DB

---

## 🔍 Backend API Testing (Postman/Insomnia)

### 1. Create Video Session
```http
POST http://localhost:3001/api/v1/video-sessions/appointment/{appointmentId}
Authorization: Bearer {jwt_token}
```

**Expected Response:**
```json
{
  "id": "session_id",
  "appointmentId": "appt_id",
  "dailyRoomName": "appt-{appointmentId}",
  "dailyRoomUrl": "https://your-domain.daily.co/appt-{appointmentId}",
  "status": "SCHEDULED",
  "scheduledFor": "2026-05-21T10:00:00Z",
  "screenShareEnabled": true,
  "chatEnabled": true
}
```

### 2. Get Video Session
```http
GET http://localhost:3001/api/v1/video-sessions/appointment/{appointmentId}
Authorization: Bearer {jwt_token}
```

### 3. Get Join URL
```http
GET http://localhost:3001/api/v1/video-sessions/{sessionId}/join
Authorization: Bearer {jwt_token}
```

**Expected Response:**
```json
{
  "url": "https://your-domain.daily.co/appt-{appointmentId}",
  "sessionId": "session_id",
  "role": "therapist"
}
```

### 4. Mark Session Started
```http
POST http://localhost:3001/api/v1/video-sessions/{sessionId}/start
Authorization: Bearer {jwt_token}
```

### 5. Mark Session Ended
```http
POST http://localhost:3001/api/v1/video-sessions/{sessionId}/end
Authorization: Bearer {jwt_token}
```

---

## 📊 Database Verification

### Check Video Session Record
```sql
-- Check video session was created
SELECT * FROM video_sessions
WHERE appointment_id = '{your_appointment_id}';

-- Check appointment has isVirtual flag
SELECT id, is_virtual, service_type, start_time
FROM appointments
WHERE is_virtual = true;

-- Check session lifecycle tracking
SELECT
  id,
  status,
  scheduled_for,
  started_at,
  ended_at,
  actual_duration
FROM video_sessions
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to create Daily room"
**Solution:**
- Check `DAILY_API_KEY` is set in `.env`
- Verify API key is valid on Daily.co dashboard
- Restart API server after adding env var

### Issue: Video iframe not loading
**Solution:**
- Check browser console for errors
- Verify `dailyRoomUrl` is correct
- Check Daily.co room exists in dashboard
- Try different browser (Chrome works best)

### Issue: Camera/mic not working
**Solution:**
- Check browser permissions
- Try HTTPS instead of HTTP
- Use `localhost` (not `127.0.0.1`)
- Check camera/mic not used by another app

### Issue: "Session not found"
**Solution:**
- Verify video session was created first
- Check database for video_sessions record
- Verify appointment ID is correct

### Issue: Cannot join as client
**Solution:**
- Verify client is logged in correctly
- Check JWT token is valid
- Ensure client is assigned to appointment
- Check client has user account linked

---

## ✅ Complete Testing Checklist

### Database
- [ ] Migration applied successfully
- [ ] VideoSession table created with correct schema
- [ ] Appointment.isVirtual field added
- [ ] Foreign keys working correctly

### Backend API
- [ ] Create video session endpoint works
- [ ] Get video session by appointment works
- [ ] Get join URL with auth works
- [ ] Permission checks work (403 for unauthorized)
- [ ] Mark started updates status
- [ ] Mark ended calculates duration
- [ ] Daily.co room creation succeeds

### Frontend UI
- [ ] Virtual appointment checkbox appears
- [ ] Blue info banner shows when checked
- [ ] Appointment saves with isVirtual flag
- [ ] "Create Video Session" button works
- [ ] Button shows loading state
- [ ] "Join Video Call" button appears after creation
- [ ] Video modal opens correctly
- [ ] Iframe loads Daily.co interface

### Video Functionality
- [ ] Camera preview works
- [ ] Microphone works
- [ ] Two users can join same session
- [ ] Video streams visible to both parties
- [ ] Screen sharing works
- [ ] Chat works
- [ ] Leave button works
- [ ] Session end tracked in database

### Edge Cases
- [ ] Disabled for cancelled appointments
- [ ] Works on mobile devices
- [ ] Works on tablets
- [ ] Works in Chrome
- [ ] Works in Safari
- [ ] Works in Firefox
- [ ] Works in Edge

---

## 📞 Support

### Daily.co Resources
- Documentation: https://docs.daily.co/
- Dashboard: https://dashboard.daily.co/
- Support: support@daily.co

### Internal Resources
- Implementation doc: `STAGE-8-TASK-2-TELEHEALTH-COMPLETE.md`
- Schema: `packages/database/prisma/schema.prisma`
- API: `services/api/src/video-sessions/`
- Frontend: `apps/web/components/video/`

---

**Happy Testing! 🎉**
