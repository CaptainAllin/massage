# Iris — Launch Plan

> Written for a first-time founder. Plain language, no jargon.

---

## What Is This App?

**Iris** is practice management software for wellness clinics and therapists. Think of it as an all-in-one back-office for people who do massage therapy, chiropractic, physiotherapy, or any hands-on wellness work.

Right now, most of these practitioners cobble together 4–6 separate tools:
- A calendar app for bookings
- Paper or PDF intake forms
- A notes app for treatment records
- A spreadsheet to track payments
- Their phone for reminders

Iris replaces all of that with one clean platform: online booking, digital intake forms, AI-assisted treatment notes, payments, automated SMS/email reminders, and analytics — all in one login.

---

## Who Should You Target?

### Primary Target: Solo Massage Therapists

**Why them first:**
- There are ~150,000 licensed massage therapists in the US and Canada alone
- Most are solo or work in very small (2–3 person) clinics
- They are actively frustrated with their current tools (most use outdated, clunky software like SimplePractice or Jane App, or nothing at all)
- Solo therapists make their own buying decisions — no lengthy sales cycles
- They are willing to pay $29–$79/month if it genuinely saves them time

**What their pain looks like day-to-day:**
- Playing phone tag to book appointments
- Re-entering the same client info by hand
- Chasing no-shows because reminders are manual
- Writing the same SOAP note structure from scratch every session
- Losing track of which clients are due for a follow-up

**Iris solves every one of these problems.**

---

### Secondary Target (Once You Have Traction): Small Multi-Therapist Clinics

Clinics with 2–5 therapists are the sweet spot for the $79/month Pro plan. They feel the pain more acutely (more staff = more scheduling chaos), and the revenue per customer is higher. Do not chase this segment first — focus on solo therapists and let word-of-mouth naturally pull clinics in.

---

### Who NOT to Target Yet

- Large hospital-connected physio clinics — these have IT departments and procurement processes that take 6+ months
- Massage schools — they want free or deeply discounted tools
- General health/fitness apps (gyms, yoga studios) — different workflow, different pain

---

## Step-by-Step Launch Plan

---

### Step 1: Get the App Live (Week 1–2)

Before any marketing, the app needs to be publicly accessible.

**What to do:**
1. **Deploy to Vercel** — connect your GitHub repo to Vercel (free tier is fine to start). Follow `DEPLOYMENT.md` in the project root.
2. **Set up a real Supabase project** — not the local dev one. Go to supabase.com, create a production project, run the migration scripts.
3. **Connect Stripe** — create a Stripe account, set up the three pricing plans (Starter $29, Pro $79, Enterprise custom), add the keys to Vercel environment variables.
4. **Get a domain** — buy something like `getirisapp.com` or `trywellnesshq.com` from Namecheap (~$15/year). Point it at Vercel.
5. **Set up Twilio** — for SMS reminders to work, you need a Twilio phone number (~$1/month + per-SMS cost). This is a key feature therapists love.
6. **Test end-to-end yourself** — sign up as a fake client, book an appointment, fill out an intake form, process a test payment. Fix anything broken before telling anyone.

**You're done when:** A real person can sign up, add a client, book an appointment, and receive an SMS reminder — without you touching anything.

---

### Step 2: Get Your First 10 Users (Week 2–4)

Do not buy ads. Do not build a website. Talk to people.

**Where to find massage therapists:**
- Facebook Groups: "Massage Therapists Network", "Massage Business Success", "RMT Canada" — these have 10,000–50,000 members each
- Reddit: r/massagetherapy (100k members)
- Instagram: search #massagetherapist — DM people with small but engaged followings (1k–10k followers)
- Local massage schools — ask if you can email their recent graduates

**What to say (keep it simple):**

> "Hey [Name], I'm building a practice management app specifically for massage therapists — online booking, digital intake forms, automated SMS reminders, and AI-assisted SOAP notes. I'm looking for 10 therapists to try it free and give me honest feedback. Would you be up for a 20-minute call?"

**Goal of these first 10 users:**
- Not revenue — feedback
- Find out what feature they use every single day
- Find out what's confusing or missing
- Get a testimonial if they love it

---

### Step 3: Build a Simple Marketing Page (Week 3–4)

The current landing page at `/` is a good start but needs real proof.

**Add these elements:**
1. **A 90-second screen recording** showing the app in action — booking an appointment, filling out intake form, seeing the dashboard. Use Loom (free). This is more powerful than any written copy.
2. **One real testimonial** from your early users — even just "Saved me 2 hours a week" with a real name and photo
3. **A clear comparison** — "Replace Jane App / SimplePractice / pen-and-paper with one tool"
4. **The pricing page** is already built — make sure the "Start free trial" button works

**You do not need a blog, case studies, or a help center yet.**

---

### Step 4: Launch Publicly (Week 4–5)

**Where to launch:**
1. **Product Hunt** — post on a Tuesday or Wednesday morning (9am ET). Write a simple tagline like "Practice management for massage therapists — finally built for them, not against them." Product Hunt drives early adopter signups and gives you credibility.
2. **Facebook Groups** — post a genuine "I built this for people like you" message in the therapist groups. Not a sales pitch — share the screen recording and ask for feedback.
3. **Reddit r/massagetherapy** — post in the weekly discussion thread or as a Show HN-style post ("I built a free practice management tool for massage therapists")
4. **Your personal network** — ask everyone you know to share it with any massage therapists, chiropractors, or physiotherapists they know

**Goal:** 50 signups in the first month, even if most are on the free plan.

---

### Step 5: Convert Free Users to Paid (Month 2)

Once people are using the free plan and hitting its limits (50 clients), you have a natural upgrade moment.

**How to convert:**
- Send an in-app message when they hit 40/50 clients: "You're almost at your client limit — upgrade to Starter for unlimited clients"
- Email them after their first week: "You've booked X appointments and saved ~Y hours — here's what you unlock with Starter"
- Offer a 30-day free trial of Starter before charging (already built into the pricing page)

**Your target at the end of Month 2:** 10 paying customers at $29/month = $290 MRR. This proves the business model works and gives you data to improve.

---

### Step 6: Get to $1,000/month (Month 3–6)

$1,000 MRR (Monthly Recurring Revenue) is your first real milestone. It means ~35 paying customers on Starter, or ~13 on Pro.

**How to get there:**
1. Ask every happy free user personally: "Is there anything that would make Iris worth $29/month for you?"
2. Add the one or two features they mention most — but only if multiple people ask for the same thing
3. Start collecting email addresses with a simple lead magnet: "Free guide: How to reduce no-shows by 80% with automated reminders" — this gets therapists to give you their email and puts them in your funnel
4. Partner with massage schools — offer students 6 months free if the school promotes Iris to graduates

---

## Competitive Landscape (Know Your Rivals)

| Competitor | Price | Main Weakness |
|---|---|---|
| **Jane App** | $74–$195/month | Expensive, complex, built for physio first |
| **SimplePractice** | $29–$99/month | Not built for massage; weak SOAP notes |
| **Mindbody** | $99–$349/month | Overkill for solo therapists, confusing |
| **Noterro** | $25–$79/month | Most similar, but no AI features |
| **Square Appointments** | Free–$69/month | No treatment notes, no SOAP, not healthcare-aware |

**Your edge:** Iris has AI-assisted SOAP notes and treatment suggestions (via Claude), which none of the main competitors offer. Lead with this in your marketing — it's a genuine differentiator.

---

## The One Metric That Matters Right Now

**Monthly Recurring Revenue (MRR)**

Everything else — signups, page views, social media — is a distraction until you have 20–30 paying customers. Focus only on getting people to pay and stay.

Track this in a simple spreadsheet weekly:
- New paying customers this week
- Churned customers (cancelled) this week
- Total MRR

---

## Quick Checklist Before You Talk to Anyone

- [ ] App is live on a real domain (not localhost)
- [ ] Sign-up → first appointment → SMS reminder works end-to-end
- [ ] Stripe payments go through (test mode first, then live)
- [ ] You can log in and demo it confidently in 5 minutes
- [ ] Pricing page is live with working "Start free trial" buttons

---

## Summary

| Phase | Timeline | Goal |
|---|---|---|
| Get app live | Week 1–2 | Real domain, end-to-end working |
| Find first 10 users | Week 2–4 | Feedback, not revenue |
| Build proof | Week 3–4 | Video demo + 1 testimonial |
| Public launch | Week 4–5 | 50 signups |
| First conversions | Month 2 | 10 paying customers |
| $1k MRR | Month 3–6 | Sustainable, fundable milestone |
