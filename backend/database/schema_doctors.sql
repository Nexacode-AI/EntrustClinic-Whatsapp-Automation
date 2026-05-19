-- ============================================================
-- Entrust Clinic — Doctor Management Schema (run after schema.sql)
-- ============================================================

-- Doctors
create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp_phone text,                  -- E.164 e.g. +601XXXXXXXXX
  google_calendar_id text,              -- e.g. doctor@gmail.com or sub-calendar ID
  active boolean default true,
  created_at timestamptz default now()
);

-- Seed the 4 doctors
insert into doctors (name, whatsapp_phone, google_calendar_id) values
  ('Dr. Phuah Sheng',    null, null),
  ('Dr. Wong Chen Yee',  null, null),
  ('Dr. Tan Siew Wei',   null, null),
  ('Dr. Hng Wei Xuan',   null, null)
on conflict do nothing;

-- Which doctor handles which service
create table if not exists doctor_services (
  doctor_id uuid references doctors(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  primary key (doctor_id, service_id)
);

-- Seed doctor-service relationships
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
                 'Blood Test (Non-fasting)','Health Screening',
                 'Vaccination','Wound Care')
on conflict do nothing;

-- Doctor weekly availability (default working hours)
create table if not exists doctor_availability (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references doctors(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Sun, 1=Mon...6=Sat
  start_time time not null,
  end_time time not null,
  active boolean default true
);

create index if not exists idx_availability_doctor on doctor_availability(doctor_id, day_of_week);

-- Seed default availability: Mon-Sat 9AM-9PM, Sun 9AM-1PM for all doctors
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
on conflict do nothing;

-- Blocked slots (holidays, leave, lunch, ad-hoc blocks)
create table if not exists blocked_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references doctors(id) on delete cascade, -- null = all doctors
  blocked_date date not null,
  start_time time,     -- null = full day block
  end_time time,       -- null = full day block
  reason text,
  created_at timestamptz default now()
);

create index if not exists idx_blocked_doctor_date on blocked_slots(doctor_id, blocked_date);

-- Add doctor_id column to appointments
alter table appointments
  add column if not exists doctor_id uuid references doctors(id),
  add column if not exists pending_doctor_id uuid references doctors(id);

-- Add pending_doctor_id and pending_eligible_doctors to conversations for booking flow
alter table conversations
  add column if not exists pending_doctor_id uuid references doctors(id),
  add column if not exists pending_eligible_doctors text; -- JSON array of {id, name}

-- Add additional services not in original schema
insert into services (name, duration_minutes) values
  ('Health Screening', 45),
  ('Vaccination', 20),
  ('Antenatal / Postnatal', 30),
  ('Pap Smear', 30),
  ('Wound Care', 20)
on conflict do nothing;

-- Doctor notification log (track what we've already sent)
create table if not exists doctor_notifications (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references doctors(id) on delete cascade,
  type text not null,  -- new_booking | cancellation | reschedule | daily_summary
  appointment_id uuid references appointments(id) on delete set null,
  sent boolean default false,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_doctor_notifications on doctor_notifications(doctor_id, type, created_at desc);
