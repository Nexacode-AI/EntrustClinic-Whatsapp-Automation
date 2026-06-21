import { db as supabase } from '../config/database.js'

// Get prescriptions pending dispensing
export async function getPendingPrescriptions(req, res) {
  const { branch_id, date } = req.query
  const today = date || new Date().toISOString().split('T')[0]

  let query = supabase
    .from('prescriptions')
    .select(`
      *,
      prescription_items(*),
      patients(id, name, phone),
      doctors(id, name),
      consultations(id, queue_entry_id)
    `)
    .in('status', ['pending','dispensing'])
    .gte('created_at', `${today}T00:00:00`)
    .order('created_at', { ascending: true })

  if (branch_id) query = query.eq('branch_id', branch_id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// Get a single prescription
export async function getPrescription(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('prescriptions')
    .select(`*, prescription_items(*, stock_batches(batch_number, expiry_date, quantity)), patients(id, name), doctors(id, name)`)
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Prescription not found' })
  res.json(data)
}

// Dispense a prescription item
export async function dispenseItem(req, res) {
  const { itemId } = req.params
  const { quantity_dispensed, batch_id } = req.body

  const { data: item } = await supabase
    .from('prescription_items')
    .select('*, prescriptions(patient_id)')
    .eq('id', itemId)
    .single()

  if (!item) return res.status(404).json({ error: 'Item not found' })

  // Deduct stock
  if (batch_id && quantity_dispensed) {
    const { data: batch } = await supabase.from('stock_batches').select('quantity, item_id').eq('id', batch_id).single()
    if (batch) {
      await supabase.from('stock_batches').update({ quantity: Math.max(0, batch.quantity - quantity_dispensed) }).eq('id', batch_id)
      const { data: si } = await supabase.from('stock_items').select('current_stock').eq('id', batch.item_id).single()
      await supabase.from('stock_items').update({ current_stock: Math.max(0, (si?.current_stock || 0) - quantity_dispensed) }).eq('id', batch.item_id)
      await supabase.from('stock_movements').insert({
        item_id: batch.item_id, batch_id, type: 'out', quantity: quantity_dispensed,
        reference_id: item.prescription_id, reference_type: 'prescription',
      })
    }
  }

  const { data, error } = await supabase
    .from('prescription_items')
    .update({ quantity_dispensed, batch_id, dispensed_at: new Date().toISOString() })
    .eq('id', itemId)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// Mark prescription as ready/collected
export async function updatePrescriptionStatus(req, res) {
  const { id } = req.params
  const { status } = req.body

  const { data, error } = await supabase
    .from('prescriptions')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// Get drug label data
export async function getDrugLabel(req, res) {
  const { id } = req.params

  const { data, error } = await supabase
    .from('prescription_items')
    .select(`
      drug_name, dosage, frequency, duration, instructions, quantity_dispensed,
      prescriptions(
        created_at,
        patients(name, date_of_birth),
        doctors(name)
      )
    `)
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Item not found' })
  res.json(data)
}

// Dispensing history for a patient
export async function getDispenseHistory(req, res) {
  const { patient_id } = req.params
  const { data, error } = await supabase
    .from('prescriptions')
    .select(`
      *,
      prescription_items(*),
      consultations(visit_date),
      doctors(name)
    `)
    .eq('patient_id', patient_id)
    .eq('status', 'collected')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// Drug interaction check
export async function checkInteractions(req, res) {
  const { drugs = [] } = req.body
  if (drugs.length < 2) return res.json([])

  const interactions = []
  for (let i = 0; i < drugs.length; i++) {
    for (let j = i + 1; j < drugs.length; j++) {
      const { data } = await supabase
        .from('drug_interactions')
        .select('*')
        .or(`and(drug_a.ilike.%${drugs[i]}%,drug_b.ilike.%${drugs[j]}%),and(drug_a.ilike.%${drugs[j]}%,drug_b.ilike.%${drugs[i]}%)`)

      if (data && data.length > 0) interactions.push(...data)
    }
  }

  res.json(interactions)
}
