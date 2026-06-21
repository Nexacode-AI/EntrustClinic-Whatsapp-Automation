import { db as supabase } from '../config/database.js'
import dayjs from 'dayjs'

// ── STAFF PROFILES ────────────────────────────────────────────────────────────

export async function listStaff(req, res) {
  const { role, branch_id, active = true } = req.query

  let query = supabase
    .from('staff_profiles')
    .select('*')
    .eq('active', active === 'false' ? false : true)
    .order('name')

  if (role)      query = query.eq('role', role)
  if (branch_id) query = query.eq('branch_id', branch_id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function getStaffMember(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('staff_profiles')
    .select(`*, attendance(date, clock_in, clock_out, hours_worked), leaves(*)`)
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Staff member not found' })
  res.json(data)
}

export async function createStaff(req, res) {
  const { data, error } = await supabase
    .from('staff_profiles')
    .insert(req.body)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function updateStaff(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('staff_profiles')
    .update(req.body)
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function deactivateStaff(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('staff_profiles')
    .update({ active: false })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// ── ATTENDANCE ────────────────────────────────────────────────────────────────

export async function clockIn(req, res) {
  const { staff_id, branch_id } = req.body
  const today = dayjs().format('YYYY-MM-DD')

  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('staff_id', staff_id)
    .eq('date', today)
    .single()

  if (existing) return res.status(400).json({ error: 'Already clocked in today' })

  const { data, error } = await supabase
    .from('attendance')
    .insert({ staff_id, date: today, clock_in: new Date().toISOString(), branch_id })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function clockOut(req, res) {
  const { staff_id } = req.body
  const today = dayjs().format('YYYY-MM-DD')

  const { data: record } = await supabase
    .from('attendance')
    .select('id, clock_in')
    .eq('staff_id', staff_id)
    .eq('date', today)
    .is('clock_out', null)
    .single()

  if (!record) return res.status(400).json({ error: 'No active clock-in found' })

  const clockOut = new Date().toISOString()
  const hours = (new Date(clockOut) - new Date(record.clock_in)) / 3600000

  const { data, error } = await supabase
    .from('attendance')
    .update({ clock_out: clockOut, hours_worked: parseFloat(hours.toFixed(2)) })
    .eq('id', record.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function getAttendance(req, res) {
  const { staff_id, month, year } = req.query
  const m = month || dayjs().month() + 1
  const y = year  || dayjs().year()
  const from = dayjs(`${y}-${String(m).padStart(2,'0')}-01`).startOf('month').format('YYYY-MM-DD')
  const to   = dayjs(`${y}-${String(m).padStart(2,'0')}-01`).endOf('month').format('YYYY-MM-DD')

  let query = supabase
    .from('attendance')
    .select(`*, staff_profiles(name, role)`)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })

  if (staff_id) query = query.eq('staff_id', staff_id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// ── LEAVES ────────────────────────────────────────────────────────────────────

export async function listLeaves(req, res) {
  const { staff_id, status } = req.query
  let query = supabase
    .from('leaves')
    .select(`*, staff_profiles(name, role)`)
    .order('created_at', { ascending: false })

  if (staff_id) query = query.eq('staff_id', staff_id)
  if (status)   query = query.eq('status', status)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function applyLeave(req, res) {
  const days = dayjs(req.body.end_date).diff(dayjs(req.body.start_date), 'day') + 1
  const { data, error } = await supabase
    .from('leaves')
    .insert({ ...req.body, days, status: 'pending' })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function updateLeaveStatus(req, res) {
  const { id } = req.params
  const { status, approved_by } = req.body
  const { data, error } = await supabase
    .from('leaves')
    .update({ status, approved_by })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
