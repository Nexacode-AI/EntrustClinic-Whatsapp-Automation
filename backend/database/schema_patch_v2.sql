-- ============================================================
-- Patch v2: Doctor conversations support
-- Run in Supabase SQL Editor AFTER schema.sql + schema_doctors.sql
-- ============================================================

-- Allow doctor conversations (no patient record needed)
alter table conversations
  alter column patient_id drop not null;

-- Track which doctor owns a conversation
alter table conversations
  add column if not exists doctor_id uuid references doctors(id) on delete cascade;

create index if not exists idx_conversations_doctor on conversations(doctor_id)
  where doctor_id is not null;
