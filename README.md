# Entrust Clinic WhatsApp Automation

A full-stack WhatsApp appointment automation system for Entrust Family Clinic. Patients book, reschedule, and cancel appointments through WhatsApp. Clinic staff manage everything from a Next.js admin dashboard.

## Architecture

```
EntrustClinic-Whatsapp-Automation/
├── backend/          Node.js (ES modules) Express API + WhatsApp bot
└── dashboard/        Next.js 14 admin dashboard
```

## Tech Stack

| Layer | Technology |
|---|---|
| WhatsApp messaging | Twilio Programmable Messaging |
| Backend API | Node.js + Express (ES modules) |
| AI | Claude (Anthropic) — rating interpretation |
| Database | Supabase (PostgreSQL) |
| Scheduling | node-cron — reminders, follow-ups |
| Calendar | Google Calendar API (one-way push to doctor calendars) |
| Dashboard | Next.js 14 + Tailwind CSS |
| Logging | Winston |

## Features

- Structured conversation state machine (no free-form LLM chat — deterministic booking flow)
- Appointment booking, rescheduling, and cancellation via WhatsApp
- Automated 24h and 1h reminders
- Post-appointment follow-up with Google review prompt
- Doctor portal — doctors can view their own daily schedule via WhatsApp
- Doctor notifications (new bookings, cancellations, reschedules)
- Google Calendar push for doctor appointments
- Escalation handling — flag conversations for staff review
- Admin dashboard with real-time monitoring

## Dashboard Pages

**Monitoring**
- Overview — live stats (today's appointments, active conversations, pending escalations)
- Appointments — full list with filters and status updates
- Patients — patient registry
- Conversations — WhatsApp message history per patient
- Escalations — flagged conversations requiring staff attention

**Management**
- Doctors — add/edit/remove doctors, assign services
- Schedule — set doctor availability by day of week
- Services — manage clinic service catalog
- Block Dates — block specific dates or time slots per doctor
- Broadcast — send manual messages to patients

## Local Setup

### Prerequisites

- Node.js 20+
- A Supabase project
- Twilio account with WhatsApp sandbox or approved number
- Anthropic API key
- Google Cloud project with Calendar API enabled (optional)

### 1. Clone and install

```bash
git clone https://github.com/Nexacode-AI/EntrustClinic-Whatsapp-Automation.git
cd EntrustClinic-Whatsapp-Automation

# Backend
cd backend && npm install

# Dashboard
cd ../dashboard && npm install
```

### 2. Set up environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your real values

# Dashboard
cp dashboard/.env.example dashboard/.env.local
# Edit dashboard/.env.local with your real values
```

### 3. Set up the database

Run the SQL files against your Supabase project in order:

```
backend/database/schema.sql           -- main schema + seed data
backend/database/schema_doctors.sql   -- doctor availability schema
backend/database/schema_patch_v2.sql  -- v2 patches
```

You can run these via the Supabase SQL editor or `psql`.

### 4. Configure Twilio webhook

Point your Twilio WhatsApp number's incoming message webhook to:

```
https://your-backend-domain.com/webhook/whatsapp
```

For local development, use [ngrok](https://ngrok.com):

```bash
ngrok http 4000
# Use the ngrok HTTPS URL as your Twilio webhook
```

### 5. Run locally

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — dashboard
cd dashboard && npm run dev
```

- Backend: `http://localhost:4000`
- Dashboard: `http://localhost:3000`
- Health check: `http://localhost:4000/health`

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 4000) |
| `NODE_ENV` | `development` or `production` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (not the anon key) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_NUMBER` | WhatsApp number in format `whatsapp:+1xxxxxxxxxx` |
| `ANTHROPIC_API_KEY` | Claude API key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | Google OAuth refresh token |
| `GOOGLE_CALENDAR_ID` | Default calendar ID (usually `primary`) |
| `DASHBOARD_API_KEY` | Secret key for dashboard authentication |
| `CLINIC_NAME` | Clinic display name |
| `GOOGLE_REVIEW_LINK` | Google Maps review link for follow-up messages |

### Dashboard (`dashboard/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (e.g. `http://localhost:4000`) |
| `NEXT_PUBLIC_API_KEY` | Must match `DASHBOARD_API_KEY` in backend |

## API Endpoints

All `/api/*` endpoints require `x-api-key` header matching `DASHBOARD_API_KEY`.

```
GET    /health                             Health check

POST   /webhook/whatsapp                   Twilio incoming message webhook

GET    /api/analytics                      Dashboard summary stats
GET    /api/appointments                   List appointments
GET    /api/appointments/stats             Monthly stats
PATCH  /api/appointments/:id/status        Update appointment status
GET    /api/patients                       List patients
GET    /api/conversations                  List conversations
GET    /api/conversations/:phone/messages  Message history
GET    /api/escalations                    List escalations
PATCH  /api/escalations/:id/resolve        Resolve escalation
GET    /api/doctors                        List doctors
POST   /api/doctors                        Create doctor
PATCH  /api/doctors/:id                    Update doctor
DELETE /api/doctors/:id                    Delete doctor
PUT    /api/doctors/:id/services           Set doctor services
GET    /api/doctors/:id/availability       Get availability
PUT    /api/doctors/:id/availability       Set availability
GET    /api/blocked-slots                  List blocked slots
POST   /api/blocked-slots                  Create blocked slot
DELETE /api/blocked-slots/:id              Delete blocked slot
GET    /api/services                       List services
POST   /api/services                       Create service
PATCH  /api/services/:id                   Update service
DELETE /api/services/:id                   Delete service
POST   /api/messaging/reminder             Send appointment reminder
POST   /api/messaging/review               Send review request
POST   /api/messaging/broadcast            Broadcast message
```

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

- `ci.yml` — runs on every push and PR to `main`. Installs dependencies, checks backend syntax, and builds the dashboard.
- `deploy-check.yml` — verifies the repo is in a deployable state (dependencies resolve, required files exist).
