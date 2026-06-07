-- =============================================================================
-- Entrust Clinic Management System — Schema V3
-- Run AFTER schema.sql, schema_doctors.sql, schema_patch_v2.sql
-- =============================================================================

-- Enable uuid extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- BRANCHES
-- =============================================================================
CREATE TABLE IF NOT EXISTS branches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_branches (
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  branch_id   UUID REFERENCES branches(id) ON DELETE CASCADE,
  PRIMARY KEY (patient_id, branch_id)
);

CREATE TABLE IF NOT EXISTS doctor_branches (
  doctor_id   UUID REFERENCES doctors(id) ON DELETE CASCADE,
  branch_id   UUID REFERENCES branches(id) ON DELETE CASCADE,
  PRIMARY KEY (doctor_id, branch_id)
);

-- Add branch_id to appointments if not exists
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- =============================================================================
-- PATIENT PROFILE ENHANCEMENTS
-- =============================================================================
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ic_number       TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth   DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender          TEXT CHECK (gender IN ('male','female','other'));
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address         TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation      TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_name  TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_type      TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS nationality     TEXT DEFAULT 'Malaysian';

CREATE TABLE IF NOT EXISTS patient_allergies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  allergen    TEXT NOT NULL,
  type        TEXT DEFAULT 'drug',  -- drug / food / environmental
  severity    TEXT DEFAULT 'mild' CHECK (severity IN ('mild','moderate','severe')),
  reaction    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_conditions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  condition   TEXT NOT NULL,
  icd10_code  TEXT,
  diagnosed_at DATE,
  active      BOOLEAN DEFAULT true,
  notes       TEXT
);

CREATE TABLE IF NOT EXISTS patient_documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,  -- lab_result / xray / referral / other
  file_url    TEXT NOT NULL,
  label       TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_photos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  consultation_id UUID,
  type            TEXT DEFAULT 'clinical',  -- clinical / before / after
  file_url        TEXT NOT NULL,
  label           TEXT,
  taken_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- QUEUE MANAGEMENT
-- =============================================================================
CREATE TABLE IF NOT EXISTS queue_entries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id     UUID REFERENCES branches(id),
  patient_id    UUID REFERENCES patients(id),
  appointment_id UUID REFERENCES appointments(id),
  doctor_id     UUID REFERENCES doctors(id),
  queue_number  INTEGER NOT NULL,
  type          TEXT DEFAULT 'walkin' CHECK (type IN ('walkin','appointment')),
  triage        TEXT DEFAULT 'normal' CHECK (triage IN ('normal','urgent','emergency')),
  status        TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','calling','in_consultation','billing','done','cancelled','no_show')),
  reason        TEXT,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  called_at     TIMESTAMPTZ,
  consult_start TIMESTAMPTZ,
  consult_end   TIMESTAMPTZ,
  done_at       TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_date     ON queue_entries (checked_in_at);
CREATE INDEX IF NOT EXISTS idx_queue_branch   ON queue_entries (branch_id);
CREATE INDEX IF NOT EXISTS idx_queue_status   ON queue_entries (status);

-- =============================================================================
-- EMR / CONSULTATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS consultations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID REFERENCES appointments(id),
  queue_entry_id  UUID REFERENCES queue_entries(id),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  doctor_id       UUID NOT NULL REFERENCES doctors(id),
  branch_id       UUID REFERENCES branches(id),
  visit_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_type      TEXT DEFAULT 'outpatient',  -- outpatient / telemedicine / home_visit

  -- Vitals (stored as JSON for flexibility)
  vitals          JSONB DEFAULT '{}',
  -- { bp_systolic, bp_diastolic, temperature, weight, height, spo2, pulse, bmi, rr, blood_glucose }

  chief_complaint TEXT,
  history         TEXT,
  physical_exam   TEXT,
  assessment      TEXT,

  -- Diagnoses
  diagnosis_primary   TEXT,
  icd10_primary       TEXT,
  diagnoses_json      JSONB DEFAULT '[]',
  -- [{ icd10, description, type: primary/secondary }]

  -- Notes
  notes           TEXT,
  follow_up_date  DATE,
  follow_up_notes TEXT,

  -- MC
  mc_days         INTEGER,
  mc_diagnosis    TEXT,
  mc_pdf_url      TEXT,

  -- Referral
  referral_to     TEXT,
  referral_reason TEXT,
  referral_pdf_url TEXT,

  -- AI Scribe
  scribe_transcript TEXT,
  scribe_processed  BOOLEAN DEFAULT false,

  status          TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','cancelled')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consult_patient   ON consultations (patient_id);
CREATE INDEX IF NOT EXISTS idx_consult_doctor    ON consultations (doctor_id);
CREATE INDEX IF NOT EXISTS idx_consult_date      ON consultations (visit_date);

-- =============================================================================
-- PRESCRIPTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES patients(id),
  doctor_id       UUID NOT NULL REFERENCES doctors(id),
  branch_id       UUID REFERENCES branches(id),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','dispensing','ready','collected','cancelled')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescription_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id  UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  drug_name        TEXT NOT NULL,
  generic_name     TEXT,
  drug_code        TEXT,
  dosage           TEXT,
  frequency        TEXT,
  duration         TEXT,
  route            TEXT DEFAULT 'oral',
  quantity_ordered INTEGER,
  quantity_dispensed INTEGER,
  instructions     TEXT,
  batch_id         UUID,  -- references stock_batches
  unit_price       NUMERIC(10,2) DEFAULT 0,
  total_price      NUMERIC(10,2) DEFAULT 0,
  dispensed_at     TIMESTAMPTZ,
  dispensed_by     UUID
);

-- =============================================================================
-- DRUG DATABASE (local, before MIMS API)
-- =============================================================================
CREATE TABLE IF NOT EXISTS drug_formulary (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  generic_name TEXT,
  drug_class   TEXT,
  form         TEXT,   -- tablet / capsule / syrup / injection / cream
  strengths    JSONB DEFAULT '[]',  -- ["250mg", "500mg"]
  allergen_class TEXT,
  pregnancy_cat  TEXT,  -- A / B / C / D / X
  lactation_safe BOOLEAN,
  controlled    BOOLEAN DEFAULT false,
  active        BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS drug_interactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drug_a      TEXT NOT NULL,
  drug_b      TEXT NOT NULL,
  severity    TEXT CHECK (severity IN ('minor','moderate','major','contraindicated')),
  description TEXT,
  UNIQUE (drug_a, drug_b)
);

-- =============================================================================
-- INVENTORY & PHARMACY
-- =============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  contact_name  TEXT,
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  payment_terms TEXT DEFAULT 'net30',
  lead_days     INTEGER DEFAULT 7,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  generic_name   TEXT,
  type           TEXT DEFAULT 'drug' CHECK (type IN ('drug','consumable','equipment','other')),
  category       TEXT,
  unit           TEXT DEFAULT 'tablet',
  reorder_level  INTEGER DEFAULT 50,
  reorder_qty    INTEGER DEFAULT 100,
  current_stock  INTEGER DEFAULT 0,
  drug_code      TEXT,
  branch_id      UUID REFERENCES branches(id),
  active         BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_name   ON stock_items (name);
CREATE INDEX IF NOT EXISTS idx_stock_type   ON stock_items (type);

CREATE TABLE IF NOT EXISTS stock_batches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id       UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  batch_number  TEXT,
  expiry_date   DATE,
  quantity      INTEGER DEFAULT 0,
  cost_price    NUMERIC(10,2),
  selling_price NUMERIC(10,2),
  supplier_id   UUID REFERENCES suppliers(id),
  received_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id        UUID NOT NULL REFERENCES stock_items(id),
  batch_id       UUID REFERENCES stock_batches(id),
  type           TEXT CHECK (type IN ('in','out','adjustment','transfer','expired')),
  quantity       INTEGER NOT NULL,
  reference_id   UUID,
  reference_type TEXT,  -- prescription / purchase_order / adjustment / transfer
  notes          TEXT,
  created_by     UUID,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number   TEXT UNIQUE,
  supplier_id UUID REFERENCES suppliers(id),
  branch_id   UUID REFERENCES branches(id),
  status      TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','acknowledged','partial','received','cancelled')),
  total_amount NUMERIC(12,2),
  ordered_at  TIMESTAMPTZ,
  expected_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  notes       TEXT,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id             UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id           UUID NOT NULL REFERENCES stock_items(id),
  quantity_ordered  INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_cost         NUMERIC(10,2),
  total_cost        NUMERIC(12,2)
);

-- =============================================================================
-- BILLING & INVOICING
-- =============================================================================
CREATE TABLE IF NOT EXISTS panel_companies (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name      TEXT NOT NULL,
  type      TEXT DEFAULT 'corporate' CHECK (type IN ('corporate','insurance','government','other')),
  contact   TEXT,
  email     TEXT,
  phone     TEXT,
  address   TEXT,
  code      TEXT UNIQUE,
  active    BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS panel_fee_schedules (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id   UUID REFERENCES panel_companies(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  fee        NUMERIC(10,2) NOT NULL,
  UNIQUE (panel_id, service_id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE,
  patient_id     UUID REFERENCES patients(id),
  consultation_id UUID REFERENCES consultations(id),
  appointment_id UUID REFERENCES appointments(id),
  branch_id      UUID REFERENCES branches(id),
  panel_id       UUID REFERENCES panel_companies(id),
  patient_package_id UUID,

  subtotal       NUMERIC(12,2) DEFAULT 0,
  discount_type  TEXT DEFAULT 'fixed',  -- fixed / percent
  discount_value NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  tax_rate       NUMERIC(5,2) DEFAULT 0,
  tax_amount     NUMERIC(10,2) DEFAULT 0,
  total          NUMERIC(12,2) DEFAULT 0,

  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash','card','qr','panel','package','mixed','online')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','partial','paid','refunded','waived')),
  paid_amount    NUMERIC(12,2) DEFAULT 0,
  balance        NUMERIC(12,2) DEFAULT 0,

  receipt_pdf_url TEXT,
  lhdn_uuid       TEXT,
  lhdn_status     TEXT,

  notes          TEXT,
  created_by     UUID,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  paid_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invoice_patient  ON invoices (patient_id);
CREATE INDEX IF NOT EXISTS idx_invoice_date     ON invoices (created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_status   ON invoices (payment_status);

CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('consultation','drug','service','package','other')),
  name        TEXT NOT NULL,
  quantity    INTEGER DEFAULT 1,
  unit_price  NUMERIC(10,2) DEFAULT 0,
  total       NUMERIC(12,2) DEFAULT 0,
  reference_id UUID,
  notes       TEXT
);

CREATE TABLE IF NOT EXISTS panel_claims (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID REFERENCES invoices(id),
  panel_id        UUID REFERENCES panel_companies(id),
  claim_number    TEXT,
  amount          NUMERIC(12,2),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','submitted','acknowledged','paid','rejected','outstanding')),
  submitted_at    TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PREPAID PACKAGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS package_plans (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  description    TEXT,
  sessions       INTEGER NOT NULL,
  price          NUMERIC(10,2) NOT NULL,
  validity_days  INTEGER DEFAULT 365,
  service_ids    JSONB DEFAULT '[]',
  active         BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_packages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id     UUID NOT NULL REFERENCES patients(id),
  plan_id        UUID NOT NULL REFERENCES package_plans(id),
  sessions_total INTEGER NOT NULL,
  sessions_used  INTEGER DEFAULT 0,
  purchased_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at     TIMESTAMPTZ,
  invoice_id     UUID REFERENCES invoices(id),
  status         TEXT DEFAULT 'active' CHECK (status IN ('active','expired','exhausted','cancelled'))
);

CREATE TABLE IF NOT EXISTS package_redemptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_package_id UUID NOT NULL REFERENCES patient_packages(id),
  invoice_id        UUID REFERENCES invoices(id),
  branch_id         UUID REFERENCES branches(id),
  session_number    INTEGER,
  redeemed_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- FOMEMA
-- =============================================================================
CREATE TABLE IF NOT EXISTS fomema_workers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  passport_number TEXT NOT NULL,
  nationality     TEXT,
  gender          TEXT,
  date_of_birth   DATE,
  employer_name   TEXT,
  employer_ic     TEXT,
  work_permit     TEXT,
  sector          TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','pass','fail','unfit','referred')),
  branch_id       UUID REFERENCES branches(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fomema_exams (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id       UUID NOT NULL REFERENCES fomema_workers(id) ON DELETE CASCADE,
  doctor_id       UUID REFERENCES doctors(id),
  exam_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  blood_result    TEXT,
  urine_result    TEXT,
  xray_result     TEXT,
  physical_result TEXT,
  blood_group     TEXT,
  vision          TEXT,
  hearing         TEXT,
  overall_result  TEXT CHECK (overall_result IN ('pass','fail','unfit','referred','pending')),
  remarks         TEXT,
  submitted_to_fomema BOOLEAN DEFAULT false,
  submission_date TIMESTAMPTZ,
  fomema_ref      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STAFF & ROLES
-- =============================================================================
CREATE TABLE IF NOT EXISTS staff_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  ic_number       TEXT,
  role            TEXT NOT NULL CHECK (role IN ('admin','doctor','nurse','receptionist','pharmacist','accountant','manager')),
  email           TEXT UNIQUE,
  phone           TEXT,
  salary_basic    NUMERIC(10,2) DEFAULT 0,
  epf_number      TEXT,
  socso_number    TEXT,
  bank_account    TEXT,
  bank_name       TEXT,
  joined_date     DATE,
  branch_id       UUID REFERENCES branches(id),
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id     UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in     TIMESTAMPTZ,
  clock_out    TIMESTAMPTZ,
  hours_worked NUMERIC(5,2),
  branch_id    UUID REFERENCES branches(id),
  notes        TEXT,
  UNIQUE (staff_id, date)
);

CREATE TABLE IF NOT EXISTS leaves (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id     UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  type         TEXT CHECK (type IN ('annual','medical','emergency','unpaid','maternity','paternity','other')),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  days         INTEGER,
  reason       TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by  UUID,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_structures (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id     UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  type         TEXT CHECK (type IN ('service','product','referral')),
  reference_id UUID,
  rate         NUMERIC(8,4) NOT NULL,
  rate_type    TEXT DEFAULT 'percent' CHECK (rate_type IN ('percent','fixed'))
);

CREATE TABLE IF NOT EXISTS commission_earned (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id     UUID NOT NULL REFERENCES staff_profiles(id),
  invoice_id   UUID REFERENCES invoices(id),
  amount       NUMERIC(10,2) NOT NULL,
  period_month INTEGER,
  period_year  INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PAYROLL
-- =============================================================================
CREATE TABLE IF NOT EXISTS payroll_runs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_month INTEGER NOT NULL,
  period_year  INTEGER NOT NULL,
  branch_id    UUID REFERENCES branches(id),
  status       TEXT DEFAULT 'draft' CHECK (status IN ('draft','processing','generated','approved','paid')),
  generated_at TIMESTAMPTZ,
  approved_at  TIMESTAMPTZ,
  paid_at      TIMESTAMPTZ,
  created_by   UUID,
  UNIQUE (period_month, period_year, branch_id)
);

CREATE TABLE IF NOT EXISTS payroll_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id           UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  staff_id         UUID NOT NULL REFERENCES staff_profiles(id),
  basic_salary     NUMERIC(10,2) DEFAULT 0,
  allowances       NUMERIC(10,2) DEFAULT 0,
  commissions      NUMERIC(10,2) DEFAULT 0,
  overtime         NUMERIC(10,2) DEFAULT 0,
  deductions       NUMERIC(10,2) DEFAULT 0,
  gross            NUMERIC(10,2) DEFAULT 0,
  epf_employee     NUMERIC(10,2) DEFAULT 0,
  epf_employer     NUMERIC(10,2) DEFAULT 0,
  socso_employee   NUMERIC(10,2) DEFAULT 0,
  socso_employer   NUMERIC(10,2) DEFAULT 0,
  eis_employee     NUMERIC(10,2) DEFAULT 0,
  eis_employer     NUMERIC(10,2) DEFAULT 0,
  pcb              NUMERIC(10,2) DEFAULT 0,
  net_pay          NUMERIC(10,2) DEFAULT 0
);

-- =============================================================================
-- LOYALTY & REWARDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  type        TEXT DEFAULT 'points' CHECK (type IN ('points','stamps','tier')),
  points_per_rm NUMERIC(6,2) DEFAULT 1,
  active      BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS patient_loyalty (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID UNIQUE NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  program_id  UUID REFERENCES loyalty_programs(id),
  points      INTEGER DEFAULT 0,
  stamps      INTEGER DEFAULT 0,
  tier        TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
  lifetime_points INTEGER DEFAULT 0,
  last_visit  DATE
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES patients(id),
  type        TEXT CHECK (type IN ('earn','redeem','expire','adjust')),
  points      INTEGER NOT NULL,
  description TEXT,
  invoice_id  UUID REFERENCES invoices(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rewards (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  description  TEXT,
  type         TEXT DEFAULT 'discount' CHECK (type IN ('discount','free_service','cashback','gift')),
  points_cost  INTEGER DEFAULT 0,
  value        NUMERIC(10,2),
  usage_limit  INTEGER,
  expiry_days  INTEGER,
  active       BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES patients(id),
  reward_id   UUID NOT NULL REFERENCES rewards(id),
  invoice_id  UUID REFERENCES invoices(id),
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- EXPENSES
-- =============================================================================
CREATE TABLE IF NOT EXISTS expense_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES expense_categories(id),
  icon        TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES expense_categories(id),
  branch_id   UUID REFERENCES branches(id),
  amount      NUMERIC(12,2) NOT NULL,
  description TEXT,
  vendor      TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TELEMEDICINE
-- =============================================================================
CREATE TABLE IF NOT EXISTS video_rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID REFERENCES appointments(id),
  consultation_id UUID REFERENCES consultations(id),
  jitsi_room_name TEXT NOT NULL UNIQUE,
  host_link       TEXT,
  patient_link    TEXT,
  status          TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','active','ended','cancelled')),
  scheduled_at    TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CONSENT FORMS
-- =============================================================================
CREATE TABLE IF NOT EXISTS consent_templates (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  type         TEXT DEFAULT 'general',
  content_html TEXT,
  fields_json  JSONB DEFAULT '[]',
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_consents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  template_id     UUID NOT NULL REFERENCES consent_templates(id),
  consultation_id UUID REFERENCES consultations(id),
  signature_url   TEXT,
  signed_at       TIMESTAMPTZ,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- APPOINTMENT WAITLIST
-- =============================================================================
CREATE TABLE IF NOT EXISTS appointment_waitlist (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id     UUID NOT NULL REFERENCES patients(id),
  doctor_id      UUID REFERENCES doctors(id),
  service_id     UUID REFERENCES services(id),
  preferred_date DATE,
  status         TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','offered','confirmed','expired','cancelled')),
  notified_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- REFERRALS
-- =============================================================================
CREATE TABLE IF NOT EXISTS referrals (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id  UUID REFERENCES consultations(id),
  patient_id       UUID NOT NULL REFERENCES patients(id),
  referred_by      UUID REFERENCES doctors(id),
  referred_to_name TEXT,
  referred_to_type TEXT CHECK (referred_to_type IN ('specialist','hospital','lab','imaging','other')),
  reason           TEXT,
  urgency          TEXT DEFAULT 'routine' CHECK (urgency IN ('routine','urgent','emergency')),
  letter_url       TEXT,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','booked','seen','cancelled')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SYSTEM SETTINGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS clinic_settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- AUDIT LOG
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID,
  user_email  TEXT,
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   UUID,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created  ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_table    ON audit_log (table_name);

-- =============================================================================
-- SEED: Default branch (Entrust Family Clinic, Johor Bahru)
-- =============================================================================
INSERT INTO branches (name, address, phone, email)
VALUES ('Entrust Family Clinic — Setia Indah', 'Setia Indah, Johor Bahru, Johor', '+607-xxxxxxx', 'entrust@example.com')
ON CONFLICT DO NOTHING;

-- Seed expense categories
INSERT INTO expense_categories (name) VALUES
  ('Rent & Utilities'), ('Staff Salaries'), ('Medical Supplies'),
  ('Equipment'), ('Marketing'), ('Insurance'), ('Maintenance'),
  ('Professional Fees'), ('Miscellaneous')
ON CONFLICT DO NOTHING;

-- Seed a default loyalty program
INSERT INTO loyalty_programs (name, type, points_per_rm)
VALUES ('Entrust Rewards', 'points', 1)
ON CONFLICT DO NOTHING;

-- Seed consent templates
INSERT INTO consent_templates (name, type, content_html) VALUES
  ('General Treatment Consent', 'treatment', '<p>I consent to medical examination and treatment by the clinic.</p>'),
  ('PDPA Data Consent', 'pdpa', '<p>I consent to my data being collected and processed in accordance with PDPA 2010.</p>'),
  ('Photo Consent', 'photo', '<p>I consent to clinical photographs being taken for medical records.</p>'),
  ('Telemedicine Consent', 'telemedicine', '<p>I consent to telemedicine consultation via video call.</p>')
ON CONFLICT DO NOTHING;
