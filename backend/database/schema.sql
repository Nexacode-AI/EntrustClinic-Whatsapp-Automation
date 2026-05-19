-- ============================================================
-- Entrust Family Clinic — WhatsApp Automation
-- Complete Database Schema (single file, safe to re-run)
-- ============================================================

-- ─── Patients ────────────────────────────────────────────────────────────────

create table if not exists patients (
  id         uuid primary key default gen_random_uuid(),
  phone      text unique not null,
  name       text,
  language   text default 'en',
  created_at timestamptz default now()
);

-- ─── Services ────────────────────────────────────────────────────────────────

create table if not exists services (
  id               uuid primary key default gen_random_uuid(),
  name             text unique not null,
  duration_minutes int not null default 30,
  active           boolean default true
);

insert into services (name, duration_minutes) values
  ('General Consultation',     30),
  ('Follow Up',                30),
  ('Blood Test (Fasting)',     15),
  ('Blood Test (Non-fasting)', 15),
  ('FOMEMA',                   30),
  ('FOMEMA X-Ray',             30),
  ('Health Screening',         45),
  ('Vaccination',              20),
  ('Antenatal / Postnatal',    30),
  ('Pap Smear',                30),
  ('Wound Care',               20)
on conflict (name) do nothing;

-- ─── Doctors ─────────────────────────────────────────────────────────────────

create table if not exists doctors (
  id                  uuid primary key default gen_random_uuid(),
  name                text unique not null,
  whatsapp_phone      text,
  google_calendar_id  text,
  active              boolean default true,
  created_at          timestamptz default now()
);

insert into doctors (name, whatsapp_phone, google_calendar_id) values
  ('Dr. Phuah Sheng',   null, null),
  ('Dr. Wong Chen Yee', null, null),
  ('Dr. Tan Siew Wei',  null, null),
  ('Dr. Hng Wei Xuan',  null, null)
on conflict (name) do nothing;

-- ─── Doctor ↔ Services ───────────────────────────────────────────────────────

create table if not exists doctor_services (
  doctor_id  uuid references doctors(id)  on delete cascade,
  service_id uuid references services(id) on delete cascade,
  primary key (doctor_id, service_id)
);

insert into doctor_services (doctor_id, service_id)
select d.id, s.id from doctors d, services s
where d.name = 'Dr. Phuah Sheng'
  and s.name in ('General Consultation','Follow Up','Blood Test (Fasting)',
                 'Blood Test (Non-fasting)','FOMEMA','FOMEMA X-Ray',
                 'Health Screening','Vaccination','Wound Care')
on conflict do nothing;

insert into doctor_services (doctor_id, service_id)
select d.id, s.id from doctors d, services s
where d.name = 'Dr. Wong Chen Yee'
  and s.name in ('General Consultation','Follow Up','Blood Test (Fasting)',
                 'Blood Test (Non-fasting)','FOMEMA','FOMEMA X-Ray',
                 'Health Screening','Vaccination','Antenatal / Postnatal',
                 'Pap Smear','Wound Care')
on conflict do nothing;

insert into doctor_services (doctor_id, service_id)
select d.id, s.id from doctors d, services s
where d.name in ('Dr. Tan Siew Wei','Dr. Hng Wei Xuan')
  and s.name in ('General Consultation','Follow Up','Blood Test (Fasting)',
                 'Blood Test (Non-fasting)','Health Screening','Vaccination','Wound Care')
on conflict do nothing;

-- ─── Doctor Availability ─────────────────────────────────────────────────────

create table if not exists doctor_availability (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   uuid references doctors(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  active      boolean default true,
  unique (doctor_id, day_of_week)
);

create index if not exists idx_availability_doctor on doctor_availability(doctor_id, day_of_week);

-- Seed: Sun 9AM–1PM, Mon–Sat 9AM–9PM
insert into doctor_availability (doctor_id, day_of_week, start_time, end_time)
select d.id, dow.day, dow.start_t::time, dow.end_t::time
from doctors d,
  (values
    (0, '09:00', '13:00'),
    (1, '09:00', '21:00'),
    (2, '09:00', '21:00'),
    (3, '09:00', '21:00'),
    (4, '09:00', '21:00'),
    (5, '09:00', '21:00'),
    (6, '09:00', '21:00')
  ) as dow(day, start_t, end_t)
on conflict (doctor_id, day_of_week) do nothing;

-- ─── Blocked Slots ───────────────────────────────────────────────────────────

create table if not exists blocked_slots (
  id           uuid primary key default gen_random_uuid(),
  doctor_id    uuid references doctors(id) on delete cascade,
  blocked_date date not null,
  start_time   time,
  end_time     time,
  reason       text,
  created_at   timestamptz default now()
);

create index if not exists idx_blocked_doctor_date on blocked_slots(doctor_id, blocked_date);

-- ─── Appointments ─────────────────────────────────────────────────────────────

create table if not exists appointments (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid references patients(id) on delete cascade,
  service_id       uuid references services(id),
  doctor_id        uuid references doctors(id),
  appointment_date date not null,
  appointment_time time not null,
  google_event_id  text,
  status           text default 'upcoming'
    check (status in ('upcoming','completed','cancelled','no_show')),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_appointments_patient on appointments(patient_id);
create index if not exists idx_appointments_date    on appointments(appointment_date);
create index if not exists idx_appointments_status  on appointments(status);

-- ─── Doctor Notifications ────────────────────────────────────────────────────

create table if not exists doctor_notifications (
  id             uuid primary key default gen_random_uuid(),
  doctor_id      uuid references doctors(id) on delete cascade,
  type           text not null,
  appointment_id uuid references appointments(id) on delete set null,
  sent           boolean default false,
  sent_at        timestamptz,
  created_at     timestamptz default now()
);

create index if not exists idx_doctor_notifications on doctor_notifications(doctor_id, type, created_at desc);

-- ─── Conversations ────────────────────────────────────────────────────────────

create table if not exists conversations (
  id                           uuid primary key default gen_random_uuid(),
  patient_id                   uuid references patients(id) on delete cascade,
  doctor_id                    uuid references doctors(id) on delete cascade,
  phone                        text unique not null,
  state                        text not null default 'IDLE',
  pending_name                 text,
  pending_service_id           uuid references services(id),
  pending_doctor_id            uuid references doctors(id),
  pending_eligible_doctors     text,
  pending_date                 date,
  pending_time                 time,
  rescheduling_appointment_id  uuid references appointments(id),
  last_reminder_appointment_id uuid references appointments(id),
  is_escalated                 boolean default false,
  escalation_reason            text,
  updated_at                   timestamptz default now()
);

create index if not exists idx_conversations_phone  on conversations(phone);
create index if not exists idx_conversations_doctor on conversations(doctor_id)
  where doctor_id is not null;

-- ─── Messages ─────────────────────────────────────────────────────────────────

create table if not exists messages (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null,
  direction  text not null check (direction in ('inbound','outbound')),
  body       text not null,
  created_at timestamptz default now()
);

create index if not exists idx_messages_phone   on messages(phone);
create index if not exists idx_messages_created on messages(created_at desc);

-- ─── Reminders ────────────────────────────────────────────────────────────────

create table if not exists reminders (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade,
  type           text not null check (type in ('24h','1h')),
  scheduled_at   timestamptz not null,
  sent           boolean default false,
  sent_at        timestamptz,
  created_at     timestamptz default now()
);

create index if not exists idx_reminders_unsent on reminders(sent, scheduled_at)
  where sent = false;

-- ─── Follow-ups ───────────────────────────────────────────────────────────────

create table if not exists follow_ups (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade,
  scheduled_at   timestamptz not null,
  sent           boolean default false,
  sent_at        timestamptz,
  rating         text,
  review_sent    boolean default false,
  created_at     timestamptz default now()
);

create index if not exists idx_followups_unsent on follow_ups(sent, scheduled_at)
  where sent = false;

-- ─── Escalations ──────────────────────────────────────────────────────────────

create table if not exists escalations (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  patient_id  uuid references patients(id),
  reason      text,
  resolved    boolean default false,
  resolved_by text,
  resolved_at timestamptz,
  created_at  timestamptz default now()
);

create index if not exists idx_escalations_unresolved on escalations(resolved)
  where resolved = false;

-- ─── Triggers ─────────────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists appointments_updated_at on appointments;
create trigger appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();

drop trigger if exists conversations_updated_at on conversations;
create trigger conversations_updated_at
  before update on conversations
  for each row execute function set_updated_at();
