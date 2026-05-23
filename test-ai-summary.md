# AI Summary Testing Guide

## Prerequisites

1. **Environment Variables Set**
   ```bash
   # In .env file
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-xxxxx
   OPENAI_MODEL=gpt-4-turbo-preview
   AI_MAX_TOKENS=2000
   AI_TEMPERATURE=0.7
   ```

2. **Backend Running**
   ```bash
   cd services/api
   npm run dev
   # Server should be running on http://localhost:3001
   ```

3. **Frontend Running**
   ```bash
   cd apps/web
   npm run dev
   # Frontend should be running on http://localhost:3000
   ```

---

## Test Case 1: Generate AI Summary via API

### Sample SOAP Note Data

```json
{
  "businessId": "your-business-id",
  "appointmentId": "appt-123",
  "clientId": "client-456",
  "therapistId": "therapist-789",
  "subjectiveFindings": "Client reports chronic lower back pain (7/10) radiating to left leg. Pain worse with prolonged sitting and first thing in the morning. Previous history of disc herniation at L4-L5.",
  "objectiveFindings": "Palpation reveals significant muscle tension in lumbar paraspinals and piriformis. Limited lumbar flexion (50% of normal range). Positive straight leg raise test on left side. Mild swelling noted in lumbar region.",
  "assessment": "Chronic lumbar strain with compensatory muscle tension. Likely sciatic nerve irritation secondary to tight piriformis and lumbar dysfunction. Client would benefit from deep tissue work and myofascial release.",
  "plan": "60-minute session focusing on lumbar region, hip flexors, and posterior chain. Deep tissue massage to erector spinae and quadratus lumborum. Myofascial release for iliopsoas and piriformis. Home exercise program: daily stretching of hamstrings and hip flexors. Recommend follow-up in 2 weeks.",
  "areasWorked": ["Lower Back", "Hips", "Glutes", "Hamstrings"],
  "techniques": ["Deep Tissue", "Myofascial Release", "Trigger Point Therapy"],
  "sessionDuration": 60
}
```

### Create Treatment Note

```bash
curl -X POST http://localhost:3001/treatment-notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "businessId": "your-business-id",
    "appointmentId": "appt-123",
    "clientId": "client-456",
    "therapistId": "therapist-789",
    "subjectiveFindings": "Client reports chronic lower back pain (7/10) radiating to left leg. Pain worse with prolonged sitting.",
    "objectiveFindings": "Significant muscle tension in lumbar paraspinals and piriformis. Limited lumbar flexion.",
    "assessment": "Chronic lumbar strain with compensatory muscle tension. Likely sciatic nerve irritation.",
    "plan": "60-minute session focusing on lumbar region. Deep tissue and myofascial release. Follow-up in 2 weeks.",
    "areasWorked": ["Lower Back", "Hips", "Glutes"],
    "techniques": ["Deep Tissue", "Myofascial Release"],
    "sessionDuration": 60
  }'
```

### Generate AI Summary

```bash
curl -X POST http://localhost:3001/treatment-notes/NOTE_ID/ai-summary?businessId=BUSINESS_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expected Response

```json
{
  "success": true,
  "note": {
    "id": "note_123",
    "aiSummary": "Client presented with chronic lower back pain (7/10) radiating to the left leg, exacerbated by prolonged sitting. Deep tissue massage and myofascial release were applied to the lumbar region, hips, and glutes, targeting paraspinal muscles and piriformis with significant improvement in muscle tension. Recommended follow-up in 2 weeks with home stretching exercises for hamstrings and hip flexors.",
    ...
  },
  "summary": "Client presented with chronic lower back pain...",
  "metadata": {
    "provider": "OPENAI",
    "model": "gpt-4-turbo-preview",
    "tokens": 450,
    "cost": 0.0135,
    "duration": 1250
  }
}
```

---

## Test Case 2: Test via Frontend UI

### Steps

1. **Navigate to Treatment Notes**
   - Go to http://localhost:3000/treatment-notes
   - Click on an existing note or create a new one

2. **View Treatment Note Detail**
   - Should see SOAP sections (Subjective, Objective, Assessment, Plan)
   - AI Summary section should appear at the top after the header

3. **Generate AI Summary**
   - If no summary exists, click "Generate AI Summary" button
   - Button should show loading state with spinner
   - Wait for AI to generate summary (1-3 seconds)
   - Success message should appear

4. **View AI Summary**
   - Summary should be displayed in a card with green/primary accent
   - Should show:
     - ✓ AI-generated summary text
     - ✓ Metadata (provider, tokens, cost, duration)
     - ✓ Edit button
     - ✓ Regenerate button

5. **Edit AI Summary**
   - Click "Edit" button
   - Text area should appear with current summary
   - Modify the text
   - Click "Save Summary"
   - Summary should update
   - Success message should appear

6. **Regenerate AI Summary**
   - Click "Regenerate" button
   - New AI call should be made
   - Summary should update with new content
   - Metadata should update (new cost, tokens, etc.)

---

## Test Case 3: Test Different Prompt Templates

### List Available Templates

```bash
curl -X GET "http://localhost:3001/ai/prompts?feature=NOTE_SUMMARY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expected Templates

1. **Treatment Note Summary (Default)** ⭐
   - Concise 2-3 sentence summary

2. **Treatment Note Summary (Detailed)**
   - Comprehensive 4-5 sentence summary

3. **Treatment Note Summary (Brief)**
   - Quick 1-2 sentence summary

### Test with Custom Template

You can create a business-specific template:

```bash
curl -X POST http://localhost:3001/ai/prompts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "My Custom Template",
    "feature": "NOTE_SUMMARY",
    "template": "Summarize this massage session in one sentence: {{subjective}} {{plan}}",
    "variables": {
      "subjective": { "type": "string" },
      "plan": { "type": "string" }
    },
    "provider": "ANY"
  }'
```

---

## Test Case 4: Check AI Usage Statistics

### Get Usage Stats

```bash
curl -X GET "http://localhost:3001/ai/usage?businessId=BUSINESS_ID&startDate=2026-05-01&endDate=2026-05-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expected Response

```json
{
  "usage": [
    {
      "id": "usage_1",
      "provider": "OPENAI",
      "model": "gpt-4-turbo-preview",
      "feature": "NOTE_SUMMARY",
      "totalTokens": 450,
      "cost": 0.0135,
      "createdAt": "2026-05-21T10:30:00Z"
    }
  ],
  "summary": {
    "totalCost": 0.0135,
    "totalTokens": 450,
    "totalRequests": 1
  }
}
```

---

## Test Case 5: Error Handling

### Test Without API Key

1. Remove `OPENAI_API_KEY` from .env
2. Restart backend
3. Try to generate summary
4. Should receive error: "No AI provider is configured"

### Test with Invalid Note ID

```bash
curl -X POST http://localhost:3001/treatment-notes/invalid-id/ai-summary?businessId=BUSINESS_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: 404 Not Found

### Test Provider Fallback

1. Set invalid `OPENAI_API_KEY`
2. Set valid `ANTHROPIC_API_KEY`
3. Set `AI_PROVIDER=openai` (primary)
4. Generate summary
5. Should fallback to Claude provider
6. Summary should be generated successfully

---

## Verification Checklist

### Backend API
- [ ] AI module loads without errors
- [ ] OpenAI provider initializes correctly
- [ ] Claude provider initializes correctly
- [ ] Default prompt templates are seeded
- [ ] POST /treatment-notes/:id/ai-summary generates summary
- [ ] POST /treatment-notes/:id/ai-summary/regenerate regenerates summary
- [ ] PATCH /treatment-notes/:id/ai-summary updates summary manually
- [ ] AI usage is tracked in database
- [ ] Costs are calculated correctly
- [ ] Audit logs are created

### Frontend UI
- [ ] AI summary section renders on treatment note page
- [ ] "Generate AI Summary" button appears when no summary exists
- [ ] Loading state shows during generation
- [ ] Summary displays after generation
- [ ] Metadata shows (provider, tokens, cost, duration)
- [ ] Edit button opens editor
- [ ] Summary can be edited and saved
- [ ] Regenerate button creates new summary
- [ ] Success/error messages display appropriately
- [ ] UI is responsive and looks good

### Data Integrity
- [ ] Summary saved to `TreatmentNote.aiSummary` field
- [ ] Usage tracked in `AIUsage` table
- [ ] Audit logs created in `AuditLog` table
- [ ] Prompt templates stored in `AIPromptTemplate` table

### Performance
- [ ] Summary generation takes < 5 seconds
- [ ] No memory leaks
- [ ] UI remains responsive during generation
- [ ] Multiple summaries can be generated concurrently

---

## Common Issues & Solutions

### Issue: "No AI provider is configured"
**Solution**: Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in .env file

### Issue: Summary generation is slow
**Solution**:
- Check internet connection
- Try using a faster model (GPT-3.5 instead of GPT-4)
- Reduce `AI_MAX_TOKENS` value

### Issue: Cost is too high
**Solution**:
- Use GPT-3.5-turbo instead of GPT-4
- Use Claude Haiku instead of Claude Opus
- Reduce prompt length
- Implement caching for repeated summaries

### Issue: Summary quality is poor
**Solution**:
- Use GPT-4 or Claude Opus for better quality
- Adjust temperature (lower = more focused, higher = more creative)
- Improve prompt template with more specific instructions
- Include more context in SOAP notes

---

## Success Criteria

✅ **Test Passes If**:
1. AI summary generates successfully from SOAP note data
2. Summary is concise (2-3 sentences) and professional
3. Summary accurately reflects SOAP note content
4. Metadata is tracked (provider, tokens, cost)
5. UI displays summary correctly
6. Edit and regenerate functions work
7. Error handling works properly
8. Usage statistics are accurate

---

## Sample Test Output

**Generated Summary Example**:
```
Client presented with chronic lower back pain (7/10) radiating to the left leg,
exacerbated by prolonged sitting and morning stiffness. Deep tissue massage and
myofascial release were performed targeting the lumbar paraspinals, piriformis,
hip flexors, and hamstrings with significant reduction in muscle tension and
improved range of motion. Recommended follow-up in 2 weeks with daily home
stretching exercises for the hamstrings and hip flexors.
```

**Metadata Example**:
- Provider: OpenAI
- Model: gpt-4-turbo-preview
- Tokens: 425
- Cost: $0.0128
- Duration: 1.2s

---

**Testing Complete!** ✅

If all tests pass, Stage 7 Task 2 is fully complete and ready for production use.
