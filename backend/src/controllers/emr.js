import { db } from '../config/database.js'

// ── CONSULTATIONS ────────────────────────────────────────────────────────────

export async function listConsultations(req, res) {
  const { patient_id, doctor_id, date, limit = 20, offset = 0 } = req.query

  let query = supabase
    .from('consultations')
    .select(`
      *,
      patients(id, name, phone),
      doctors(id, name)
    `, { count: 'exact' })
    .order('visit_date', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (patient_id) query = query.eq('patient_id', patient_id)
  if (doctor_id)  query = query.eq('doctor_id', doctor_id)
  if (date)       query = query.eq('visit_date', date)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data, total: count })
}

export async function getConsultation(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('consultations')
    .select(`
      *,
      patients(id, name, phone, date_of_birth, gender, ic_number, patient_allergies(*), patient_conditions(*)),
      doctors(id, name),
      prescriptions(*, prescription_items(*))
    `)
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Consultation not found' })
  res.json(data)
}

export async function createConsultation(req, res) {
  const {
    appointment_id, queue_entry_id, patient_id, doctor_id, branch_id,
    visit_date, visit_type, vitals, chief_complaint, history,
    physical_exam, assessment, diagnosis_primary, icd10_primary,
    diagnoses_json, notes, follow_up_date, follow_up_notes,
    mc_days, mc_diagnosis, referral_to, referral_reason,
  } = req.body

  if (!patient_id || !doctor_id) return res.status(400).json({ error: 'patient_id and doctor_id required' })

  const { data, error } = await supabase
    .from('consultations')
    .insert({
      appointment_id, queue_entry_id, patient_id, doctor_id, branch_id,
      visit_date: visit_date || new Date().toISOString().split('T')[0],
      visit_type: visit_type || 'outpatient',
      vitals: vitals || {},
      chief_complaint, history, physical_exam, assessment,
      diagnosis_primary, icd10_primary,
      diagnoses_json: diagnoses_json || [],
      notes, follow_up_date, follow_up_notes,
      mc_days, mc_diagnosis, referral_to, referral_reason,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Update queue status to in_consultation if queue_entry_id provided
  if (queue_entry_id) {
    await supabase
      .from('queue_entries')
      .update({ status: 'in_consultation', consult_start: new Date().toISOString() })
      .eq('id', queue_entry_id)
  }

  res.status(201).json(data)
}

export async function updateConsultation(req, res) {
  const { id } = req.params
  const updates = { ...req.body, updated_at: new Date().toISOString() }
  delete updates.id

  const { data, error } = await supabase
    .from('consultations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function completeConsultation(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('consultations')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Move queue to billing
  if (data.queue_entry_id) {
    await supabase
      .from('queue_entries')
      .update({ status: 'billing', consult_end: new Date().toISOString() })
      .eq('id', data.queue_entry_id)
  }

  res.json(data)
}

// ── PRESCRIPTIONS ─────────────────────────────────────────────────────────────

export async function createPrescription(req, res) {
  const { id: consultation_id } = req.params
  const { items = [], notes } = req.body

  const { data: consult } = await supabase
    .from('consultations')
    .select('patient_id, doctor_id, branch_id')
    .eq('id', consultation_id)
    .single()

  if (!consult) return res.status(404).json({ error: 'Consultation not found' })

  const { data: rx, error: rxErr } = await supabase
    .from('prescriptions')
    .insert({ consultation_id, patient_id: consult.patient_id, doctor_id: consult.doctor_id, branch_id: consult.branch_id, notes })
    .select()
    .single()

  if (rxErr) return res.status(500).json({ error: rxErr.message })

  if (items.length > 0) {
    const rxItems = items.map(item => ({ ...item, prescription_id: rx.id }))
    const { error: itemErr } = await db.from('prescription_items').insert(rxItems)
    if (itemErr) return res.status(500).json({ error: itemErr.message })
  }

  const { data: full } = await supabase
    .from('prescriptions')
    .select('*, prescription_items(*)')
    .eq('id', rx.id)
    .single()

  res.status(201).json(full)
}

export async function updatePrescriptionItem(req, res) {
  const { itemId } = req.params
  const updates = req.body
  const { data, error } = await supabase
    .from('prescription_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// ── ICD-10 SEARCH ─────────────────────────────────────────────────────────────

export async function searchIcd10(req, res) {
  const { q } = req.query
  if (!q || q.length < 2) return res.json([])

  // Common Malaysian GP diagnoses — static list (can be extended)
  const icd10 = [
    { code: 'J06.9',  desc: 'Acute upper respiratory infection' },
    { code: 'J11.1',  desc: 'Influenza with other respiratory manifestations' },
    { code: 'A09',    desc: 'Other gastroenteritis and colitis' },
    { code: 'K21.0',  desc: 'Gastro-esophageal reflux disease with esophagitis' },
    { code: 'I10',    desc: 'Essential (primary) hypertension' },
    { code: 'E11',    desc: 'Type 2 diabetes mellitus' },
    { code: 'J45.9',  desc: 'Asthma, unspecified' },
    { code: 'M54.5',  desc: 'Low back pain' },
    { code: 'R51',    desc: 'Headache' },
    { code: 'R50.9',  desc: 'Fever, unspecified' },
    { code: 'L20.9',  desc: 'Atopic dermatitis, unspecified' },
    { code: 'N39.0',  desc: 'Urinary tract infection' },
    { code: 'J03.9',  desc: 'Acute tonsillitis' },
    { code: 'H10.9',  desc: 'Conjunctivitis, unspecified' },
    { code: 'S90.9',  desc: 'Superficial injury of ankle and foot' },
    { code: 'Z00.0',  desc: 'General adult medical examination' },
    { code: 'Z76.3',  desc: 'Healthy person accompanying sick person' },
    { code: 'B34.9',  desc: 'Viral infection, unspecified' },
    { code: 'E78.5',  desc: 'Hyperlipidaemia, unspecified' },
    { code: 'F41.1',  desc: 'Generalized anxiety disorder' },
  ]

  const term = q.toLowerCase()
  const results = icd10.filter(
    d => d.code.toLowerCase().includes(term) || d.desc.toLowerCase().includes(term)
  ).slice(0, 10)

  res.json(results)
}

// ── DRUG SEARCH ───────────────────────────────────────────────────────────────

export async function searchDrugs(req, res) {
  const { q } = req.query
  if (!q || q.length < 2) return res.json([])

  const { data, error } = await supabase
    .from('drug_formulary')
    .select('id, name, generic_name, drug_class, form, strengths, pregnancy_cat, allergen_class')
    .or(`name.ilike.%${q}%,generic_name.ilike.%${q}%`)
    .eq('active', true)
    .limit(15)

  if (error) return res.status(500).json({ error: error.message })

  // Fallback static list if formulary is empty
  if (!data || data.length === 0) {
    const common = [
      { name: 'Paracetamol', generic_name: 'Paracetamol', form: 'tablet', strengths: ['500mg','1000mg'], drug_class: 'Analgesic' },
      { name: 'Amoxicillin', generic_name: 'Amoxicillin', form: 'capsule', strengths: ['250mg','500mg'], drug_class: 'Antibiotic' },
      { name: 'Ibuprofen', generic_name: 'Ibuprofen', form: 'tablet', strengths: ['200mg','400mg'], drug_class: 'NSAID' },
      { name: 'Metformin', generic_name: 'Metformin HCl', form: 'tablet', strengths: ['500mg','850mg'], drug_class: 'Antidiabetic' },
      { name: 'Amlodipine', generic_name: 'Amlodipine Besylate', form: 'tablet', strengths: ['5mg','10mg'], drug_class: 'CCB' },
      { name: 'Omeprazole', generic_name: 'Omeprazole', form: 'capsule', strengths: ['20mg','40mg'], drug_class: 'PPI' },
      { name: 'Cetirizine', generic_name: 'Cetirizine HCl', form: 'tablet', strengths: ['10mg'], drug_class: 'Antihistamine' },
      { name: 'Azithromycin', generic_name: 'Azithromycin', form: 'tablet', strengths: ['250mg','500mg'], drug_class: 'Antibiotic' },
    ]
    const term = q.toLowerCase()
    return res.json(common.filter(d =>
      d.name.toLowerCase().includes(term) || d.generic_name.toLowerCase().includes(term)
    ))
  }

  res.json(data)
}

// ── VITALS HISTORY ────────────────────────────────────────────────────────────

export async function getVitalsHistory(req, res) {
  const { patient_id } = req.params
  const { data, error } = await supabase
    .from('consultations')
    .select('visit_date, vitals')
    .eq('patient_id', patient_id)
    .not('vitals', 'eq', '{}')
    .order('visit_date', { ascending: false })
    .limit(10)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
