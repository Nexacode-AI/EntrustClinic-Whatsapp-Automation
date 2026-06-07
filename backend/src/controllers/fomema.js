import { db } from '../config/database.js'

export async function listWorkers(req, res) {
  const { status, employer, search } = req.query

  let query = supabase
    .from('fomema_workers')
    .select(`*, fomema_exams(id, exam_date, overall_result, submitted_to_fomema)`)
    .order('created_at', { ascending: false })

  if (status)   query = query.eq('status', status)
  if (employer) query = query.ilike('employer_name', `%${employer}%`)
  if (search)   query = query.or(`name.ilike.%${search}%,passport_number.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function getWorker(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('fomema_workers')
    .select(`*, fomema_exams(*, doctors(name))`)
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Worker not found' })
  res.json(data)
}

export async function createWorker(req, res) {
  const { data, error } = await supabase
    .from('fomema_workers')
    .insert(req.body)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function updateWorker(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('fomema_workers')
    .update(req.body)
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function createExam(req, res) {
  const { id: worker_id } = req.params
  const { data, error } = await supabase
    .from('fomema_exams')
    .insert({ ...req.body, worker_id })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Update worker status based on exam result
  if (req.body.overall_result) {
    await db.from('fomema_workers').update({ status: req.body.overall_result }).eq('id', worker_id)
  }

  res.status(201).json(data)
}

export async function updateExam(req, res) {
  const { examId } = req.params
  const { data, error } = await supabase
    .from('fomema_exams')
    .update(req.body)
    .eq('id', examId)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Sync worker status
  if (req.body.overall_result && data.worker_id) {
    await db.from('fomema_workers').update({ status: req.body.overall_result }).eq('id', data.worker_id)
  }

  res.json(data)
}

export async function submitToFomema(req, res) {
  const { examId } = req.params
  // Placeholder — real implementation requires FOMEMA API credentials in settings
  const { data: settings } = await supabase
    .from('clinic_settings')
    .select('value')
    .eq('key', 'fomema_credentials')
    .maybeSingle()

  if (settings?.value?.api_key) {
    // TODO: Call FOMEMA portal API
    res.json({ ok: true, message: 'Submitted to FOMEMA portal' })
  } else {
    // Mark as submitted manually
    await supabase
      .from('fomema_exams')
      .update({ submitted_to_fomema: true, submission_date: new Date().toISOString() })
      .eq('id', examId)
    res.json({ ok: true, message: 'Marked as submitted (manual). Configure FOMEMA credentials in Settings to submit automatically.' })
  }
}

export async function getFomemaStats(req, res) {
  const { data, error } = await supabase
    .from('fomema_workers')
    .select('status')

  if (error) return res.status(500).json({ error: error.message })

  const stats = { total: data.length, pass: 0, fail: 0, pending: 0, unfit: 0, referred: 0 }
  data.forEach(w => { if (stats[w.status] !== undefined) stats[w.status]++ })
  res.json(stats)
}
