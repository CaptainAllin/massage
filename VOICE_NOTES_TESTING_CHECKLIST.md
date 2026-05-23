# Voice-to-Text Notes Testing Checklist

## Pre-Testing Setup

### Environment Configuration
- [ ] Verify DATABASE_URL is set in `.env`
- [ ] Verify OPENAI_API_KEY is set in `.env`
- [ ] Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
- [ ] Run database migration: `npx prisma migrate deploy`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Start API server: `cd services/api && npm run dev`
- [ ] Start web app: `cd apps/web && npm run dev`

### Supabase Storage Setup
- [ ] Login to Supabase dashboard
- [ ] Verify `voice-notes` bucket exists (or will be created automatically)
- [ ] Check bucket policies allow authenticated access

## Backend Testing

### Database Schema
- [ ] Verify `voice_notes` table exists in database
- [ ] Verify `VoiceNoteStatus` enum exists
- [ ] Verify `AIFeature` enum includes `VOICE_TRANSCRIPTION` and `VOICE_TO_SOAP`
- [ ] Verify foreign key relationships are correct

### API Endpoints

#### Upload Audio
```bash
POST /api/voice-notes/upload
- [ ] Upload works with valid audio file (webm, mp3, wav)
- [ ] Rejects files > 25MB
- [ ] Returns voice note with status UPLOADED
- [ ] File is stored in Supabase
- [ ] Automatic transcription is triggered
```

#### Transcribe Audio
```bash
POST /api/voice-notes/:id/transcribe
- [ ] Transcription works with valid voice note
- [ ] Returns 404 for non-existent voice note
- [ ] Updates status to TRANSCRIBING then TRANSCRIBED
- [ ] Transcription text is saved
- [ ] Cost is tracked in AIUsage table
```

#### Generate SOAP
```bash
POST /api/voice-notes/:id/generate-soap
- [ ] SOAP generation works with transcribed voice note
- [ ] Returns all 4 SOAP sections (S, O, A, P)
- [ ] Returns 400 if not transcribed yet
- [ ] Usage cost is tracked
```

#### List Voice Notes
```bash
GET /api/voice-notes
- [ ] Returns paginated list of voice notes
- [ ] Filters by businessId work
- [ ] Filters by clientId work
- [ ] Filters by status work
- [ ] Therapists only see their own notes
```

#### Get Single Voice Note
```bash
GET /api/voice-notes/:id
- [ ] Returns complete voice note with relations
- [ ] Returns 404 for non-existent note
- [ ] Includes client and therapist information
```

#### Delete Voice Note
```bash
DELETE /api/voice-notes/:id
- [ ] Deletes audio file from storage
- [ ] Marks record as DELETED
- [ ] Therapists can only delete their own notes
- [ ] Business owners can delete any note
```

#### Download URL
```bash
GET /api/voice-notes/:id/download
- [ ] Returns signed URL for audio download
- [ ] URL expires after 1 hour
- [ ] Returns 404 for non-existent note
```

#### Search
```bash
GET /api/voice-notes/search?q=query
- [ ] Searches transcription content
- [ ] Minimum 3 characters required
- [ ] Case-insensitive search
- [ ] Returns relevant results only
```

### Role-Based Access Control
- [ ] THERAPIST can upload their own recordings
- [ ] THERAPIST can only view their own recordings
- [ ] THERAPIST can delete their own recordings
- [ ] BUSINESS_OWNER can view all recordings
- [ ] BUSINESS_OWNER can delete any recording
- [ ] RECEPTIONIST can view but not upload/delete

### AI Integration

#### OpenAI Whisper
- [ ] Audio transcription works with various formats (webm, mp3, wav, m4a)
- [ ] Transcription accuracy is good for medical terminology
- [ ] Duration is calculated correctly
- [ ] Cost calculation is accurate ($0.006/minute)
- [ ] Usage is tracked in AIUsage table with voiceNoteId

#### SOAP Generation
- [ ] Converts conversational voice to professional SOAP
- [ ] Filters out filler words ("um", "uh")
- [ ] Preserves clinical details (measurements, techniques)
- [ ] All 4 sections are populated appropriately
- [ ] Cost tracking works

### Automated Jobs

#### Usage Monitoring (Daily)
- [ ] Runs at midnight
- [ ] Checks monthly usage for all businesses
- [ ] Sends warning at 80% threshold
- [ ] Blocks usage at 100% threshold
- [ ] Logs are created

#### Cleanup Job (Daily at 2 AM)
- [ ] Deletes unlinked recordings > 90 days old
- [ ] Preserves recordings linked to treatment notes
- [ ] Deletes failed uploads > 7 days old
- [ ] Logs cleanup statistics

## Frontend Testing

### Voice Recorder Component
- [ ] Microphone permission request works
- [ ] Record button starts recording
- [ ] Real-time duration display updates
- [ ] Waveform animation displays
- [ ] Pause/resume works correctly
- [ ] Stop saves the recording
- [ ] Audio preview plays correctly
- [ ] Cancel discards recording
- [ ] Max duration warning shows at 90%
- [ ] Auto-stops at max duration (10 min)

### Voice Note Player
- [ ] Play/pause controls work
- [ ] Seek bar works
- [ ] Time display is accurate
- [ ] Playback rate changes (1x, 1.25x, 1.5x, 1.75x, 2x)
- [ ] Volume control works
- [ ] Progress bar updates in real-time

### Voice Note List
- [ ] Displays all voice notes correctly
- [ ] Shows status badges with correct colors
- [ ] Duration formatting is correct
- [ ] File size display is accurate
- [ ] Transcription preview shows (if available)
- [ ] Loading state shows during transcription
- [ ] Expand/collapse audio player works
- [ ] Delete confirmation works
- [ ] Download button works

### Voice Note Transcription
- [ ] Shows loading spinner during transcription
- [ ] Displays transcription when complete
- [ ] Shows error state if transcription fails
- [ ] Edit mode works (if enabled)
- [ ] Save edited transcription works
- [ ] Cost display is accurate
- [ ] Metadata (timestamp, duration) displays

### Voice to SOAP Generator
- [ ] Provider selection works (OpenAI/Claude)
- [ ] Transcription preview displays
- [ ] Generate button triggers SOAP creation
- [ ] Loading state shows during generation
- [ ] Success message shows with cost
- [ ] Error handling works
- [ ] Generated SOAP populates editor fields

### SOAP Note Editor Integration
- [ ] "Record Voice Note" button shows/hides recorder
- [ ] Voice notes list displays for current appointment
- [ ] Generate SOAP button appears for transcribed notes
- [ ] Generated SOAP populates all 4 sections
- [ ] Multiple voice notes can be recorded
- [ ] Voice notes persist after page refresh

### Search Functionality
- [ ] Search input requires min 3 characters
- [ ] Search results display correctly
- [ ] Result count is accurate
- [ ] Clicking result opens voice note
- [ ] Clear button works
- [ ] Empty state shows appropriately

## Integration Testing

### End-to-End Workflow
1. [ ] Record voice note during session
   - Open SOAP editor
   - Click "Record Voice Note"
   - Grant microphone access
   - Record 30-second sample
   - Stop and save

2. [ ] Wait for automatic transcription
   - Status changes to TRANSCRIBING
   - Status changes to TRANSCRIBED (within 10 seconds)
   - Transcription text appears
   - Cost is tracked

3. [ ] Generate SOAP from voice note
   - Click "Generate SOAP" button
   - Select AI provider
   - Click generate
   - Wait for SOAP sections to populate
   - Verify all 4 sections have content

4. [ ] Edit and save treatment note
   - Review generated SOAP
   - Make manual edits as needed
   - Save treatment note
   - Verify voice note is linked to treatment note

5. [ ] Search for voice note
   - Open search interface
   - Search for keyword from transcription
   - Verify voice note appears in results
   - Click to view full details

### Cross-Browser Testing
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

### Mobile Responsiveness
- [ ] Voice recorder UI adapts to mobile
- [ ] Touch controls work
- [ ] Audio playback works on mobile
- [ ] File upload works on mobile devices

### Performance Testing
- [ ] Upload 25MB audio file (should succeed)
- [ ] Upload 26MB audio file (should fail)
- [ ] Transcribe 10-minute recording (should complete)
- [ ] Generate SOAP from long transcription
- [ ] Load page with 50+ voice notes

## Security Testing

### Authentication & Authorization
- [ ] Unauthenticated requests are rejected
- [ ] Therapists cannot access other therapists' notes
- [ ] Business boundary isolation works
- [ ] JWT tokens are validated correctly

### Data Privacy (HIPAA Compliance)
- [ ] Audio files are not publicly accessible
- [ ] Signed URLs expire correctly
- [ ] Transcriptions are encrypted at rest
- [ ] Audit logs track all access
- [ ] Automatic cleanup removes old data

### Input Validation
- [ ] File type validation works
- [ ] File size validation works
- [ ] SQL injection prevention
- [ ] XSS prevention in transcription display

## Cost Tracking & Limits

### Usage Monitoring
- [ ] AI usage is tracked for each transcription
- [ ] AI usage is tracked for each SOAP generation
- [ ] Monthly usage aggregation works
- [ ] Warning email triggers at 80% ($40)
- [ ] Hard limit blocks at 100% ($50)
- [ ] Cost dashboard displays correctly

### Cleanup
- [ ] 90-day cleanup for unlinked recordings works
- [ ] Linked recordings are preserved
- [ ] Failed uploads are cleaned up after 7 days
- [ ] Statistics are accurate

## Documentation

- [ ] API documentation is complete
- [ ] Code is well-commented
- [ ] README includes setup instructions
- [ ] Environment variables are documented
- [ ] Deployment guide exists

## Known Issues / Future Improvements

Document any issues found during testing:

1. Issue:
   - Description:
   - Severity:
   - Workaround:

2. Future Enhancement:
   - Description:
   - Priority:

## Sign-Off

- [ ] All critical tests passed
- [ ] No blocking bugs remain
- [ ] Documentation is complete
- [ ] Feature is ready for deployment

**Tested by:** _____________
**Date:** _____________
**Version:** _____________
