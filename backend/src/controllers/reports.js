import { db as supabase } from '../config/database.js'
import dayjs from 'dayjs'

// Revenue report
export async function getRevenueReport(req, res) {
  const { period = 'month', year, month, branch_id } = req.query
  const now = dayjs()
  const y = year  ? Number(year)  : now.year()
  const m = month ? Number(month) : now.month() + 1

  let rows
  if (period === 'daily') {
    // Daily for current month
    const from = `${y}-${String(m).padStart(2,'0')}-01`
    const to   = dayjs(from).endOf('month').format('YYYY-MM-DD')
    let q = supabase.from('invoices').select('total, created_at, payment_status').gte('created_at', `${from}T00:00:00`).lte('created_at', `${to}T23:59:59`)
    if (branch_id) q = q.eq('branch_id', branch_id)
    const { data } = await q
    rows = data
  } else {
    // Monthly for the year
    const from = `${y}-01-01`
    const to   = `${y}-12-31`
    let q = supabase.from('invoices').select('total, created_at, payment_status').gte('created_at', `${from}T00:00:00`).lte('created_at', `${to}T23:59:59`)
    if (branch_id) q = q.eq('branch_id', branch_id)
    const { data } = await q
    rows = data
  }

  const grouped = {}
  ;(rows || []).forEach(inv => {
    const key = period === 'daily'
      ? dayjs(inv.created_at).format('YYYY-MM-DD')
      : dayjs(inv.created_at).format('YYYY-MM')
    if (!grouped[key]) grouped[key] = { revenue: 0, invoices: 0 }
    grouped[key].revenue += inv.total || 0
    grouped[key].invoices++
  })

  res.json(grouped)
}

// Appointment report
export async function getAppointmentReport(req, res) {
  const { year, month } = req.query
  const now = dayjs()
  const y = year  ? Number(year)  : now.year()
  const m = month ? Number(month) : now.month() + 1
  const from = `${y}-${String(m).padStart(2,'0')}-01`
  const to   = dayjs(from).endOf('month').format('YYYY-MM-DD')

  const { data, error } = await supabase
    .from('appointments')
    .select('status, date, doctors(name), services(name)')
    .gte('date', from)
    .lte('date', to)

  if (error) return res.status(500).json({ error: error.message })

  const byStatus = {}
  const byDoctor = {}
  const byService = {}

  data.forEach(a => {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1
    const doc = a.doctors?.name || 'Unknown'
    byDoctor[doc] = (byDoctor[doc] || 0) + 1
    const svc = a.services?.name || 'Unknown'
    byService[svc] = (byService[svc] || 0) + 1
  })

  res.json({ total: data.length, byStatus, byDoctor, byService })
}

// Patient demographics report
export async function getDemographicsReport(req, res) {
  const { data, error } = await supabase
    .from('patients')
    .select('gender, nationality, language, date_of_birth')

  if (error) return res.status(500).json({ error: error.message })

  const byGender = {}, byNationality = {}, byLanguage = {}
  const byAge = { '0-12': 0, '13-17': 0, '18-30': 0, '31-45': 0, '46-60': 0, '60+': 0 }

  data.forEach(p => {
    if (p.gender) byGender[p.gender] = (byGender[p.gender] || 0) + 1
    const nat = p.nationality || 'Malaysian'
    byNationality[nat] = (byNationality[nat] || 0) + 1
    const lang = p.language || 'en'
    byLanguage[lang] = (byLanguage[lang] || 0) + 1
    if (p.date_of_birth) {
      const age = dayjs().diff(dayjs(p.date_of_birth), 'year')
      if (age <= 12) byAge['0-12']++
      else if (age <= 17) byAge['13-17']++
      else if (age <= 30) byAge['18-30']++
      else if (age <= 45) byAge['31-45']++
      else if (age <= 60) byAge['46-60']++
      else byAge['60+']++
    }
  })

  res.json({ total: data.length, byGender, byNationality, byLanguage, byAge })
}

// Doctor productivity
export async function getDoctorProductivity(req, res) {
  const { month, year } = req.query
  const now = dayjs()
  const y = year  ? Number(year)  : now.year()
  const m = month ? Number(month) : now.month() + 1
  const from = `${y}-${String(m).padStart(2,'0')}-01`
  const to   = dayjs(from).endOf('month').format('YYYY-MM-DD')

  const { data: consultations } = await supabase
    .from('consultations')
    .select('doctor_id, doctors(name), created_at, status')
    .gte('visit_date', from)
    .lte('visit_date', to)
    .eq('status', 'completed')

  const byDoctor = {}
  ;(consultations || []).forEach(c => {
    const name = c.doctors?.name || c.doctor_id
    byDoctor[name] = (byDoctor[name] || 0) + 1
  })

  res.json({ month: m, year: y, consultations: consultations?.length || 0, byDoctor })
}

// Diagnosis frequency
export async function getDiagnosisReport(req, res) {
  const { limit = 10, month, year } = req.query
  const now = dayjs()
  const y = year  ? Number(year)  : now.year()
  const m = month ? Number(month) : now.month() + 1
  const from = `${y}-${String(m).padStart(2,'0')}-01`
  const to   = dayjs(from).endOf('month').format('YYYY-MM-DD')

  const { data } = await supabase
    .from('consultations')
    .select('diagnosis_primary, icd10_primary')
    .gte('visit_date', from)
    .lte('visit_date', to)
    .not('diagnosis_primary', 'is', null)

  const freq = {}
  ;(data || []).forEach(c => {
    const key = `${c.icd10_primary || ''} ${c.diagnosis_primary || ''}`.trim()
    freq[key] = (freq[key] || 0) + 1
  })

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, Number(limit))
    .map(([diagnosis, count]) => ({ diagnosis, count }))

  res.json(sorted)
}

// Drug usage report
export async function getDrugUsageReport(req, res) {
  const { month, year, limit = 10 } = req.query
  const now = dayjs()
  const y = year  ? Number(year)  : now.year()
  const m = month ? Number(month) : now.month() + 1
  const from = `${y}-${String(m).padStart(2,'0')}-01`
  const to   = dayjs(from).endOf('month').format('YYYY-MM-DD')

  const { data } = await supabase
    .from('prescription_items')
    .select('drug_name, quantity_dispensed, prescriptions(created_at)')
    .gte('prescriptions.created_at', `${from}T00:00:00`)
    .lte('prescriptions.created_at', `${to}T23:59:59`)

  const usage = {}
  ;(data || []).forEach(item => {
    usage[item.drug_name] = (usage[item.drug_name] || 0) + (item.quantity_dispensed || 0)
  })

  const sorted = Object.entries(usage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, Number(limit))
    .map(([drug, qty]) => ({ drug, qty }))

  res.json(sorted)
}
