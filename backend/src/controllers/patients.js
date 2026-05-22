import { db } from '../config/database.js'

export async function listPatients(req, res) {
  const { search, limit = 50, offset = 0 } = req.query

  let query = db
    .from('patients')
    .select('id, name, phone, language, created_at')
    .order('created_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

  if (search) {
    const safe = search.replace(/[^a-zA-Z0-9 +\-().@]/g, '')
    if (safe) query = query.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%`)
  }

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function getPatient(req, res) {
  const { id } = req.params

  const [{ data: patient }, { data: appointments }] = await Promise.all([
    db.from('patients').select('*').eq('id', id).single(),
    db.from('appointments')
      .select('*, services(name)')
      .eq('patient_id', id)
      .order('appointment_date', { ascending: false })
      .limit(10),
  ])

  if (!patient) return res.status(404).json({ error: 'Not found' })
  res.json({ ...patient, appointments })
}
