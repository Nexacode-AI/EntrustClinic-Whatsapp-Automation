import { db as supabase } from '../config/database.js'

// Malaysian statutory rates
const EPF_EMPLOYEE = 0.11   // 11%
const EPF_EMPLOYER = 0.13   // 13%
const SOCSO_EMPLOYEE = 0.005 // 0.5%
const SOCSO_EMPLOYER = 0.0175 // 1.75%
const EIS_EMPLOYEE = 0.002  // 0.2%
const EIS_EMPLOYER = 0.002  // 0.2%

function calcPcb(gross) {
  // Simplified PCB calculation (actual requires LHDN PCB tables)
  if (gross <= 2500) return 0
  if (gross <= 3500) return (gross - 2500) * 0.01
  if (gross <= 5000) return 10 + (gross - 3500) * 0.03
  if (gross <= 7000) return 55 + (gross - 5000) * 0.08
  return 215 + (gross - 7000) * 0.13
}

export async function listPayrollRuns(req, res) {
  const { year } = req.query
  let query = supabase
    .from('payroll_runs')
    .select('*, payroll_items(count)')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

  if (year) query = query.eq('period_year', year)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function getPayrollRun(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('payroll_runs')
    .select(`*, payroll_items(*, staff_profiles(name, role, epf_number, socso_number))`)
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Payroll run not found' })
  res.json(data)
}

export async function generatePayroll(req, res) {
  const { month, year, branch_id } = req.body

  // Check if run already exists
  const { data: existing } = await supabase
    .from('payroll_runs')
    .select('id')
    .eq('period_month', month)
    .eq('period_year', year)
    .maybeSingle()

  if (existing) return res.status(400).json({ error: 'Payroll already generated for this period' })

  // Get all active staff
  let staffQuery = supabase.from('staff_profiles').select('*').eq('active', true)
  if (branch_id) staffQuery = staffQuery.eq('branch_id', branch_id)
  const { data: staffList } = await staffQuery

  if (!staffList || staffList.length === 0) return res.status(400).json({ error: 'No active staff found' })

  // Create payroll run
  const { data: run, error: runErr } = await supabase
    .from('payroll_runs')
    .insert({ period_month: month, period_year: year, branch_id, status: 'draft', generated_at: new Date().toISOString() })
    .select()
    .single()

  if (runErr) return res.status(500).json({ error: runErr.message })

  // Get commissions for each staff member this period
  const payrollItems = []

  for (const staff of staffList) {
    const { data: comms } = await supabase
      .from('commission_earned')
      .select('amount')
      .eq('staff_id', staff.id)
      .eq('period_month', month)
      .eq('period_year', year)

    const commissions = (comms || []).reduce((s, c) => s + c.amount, 0)
    const gross       = staff.salary_basic + commissions
    const epf_emp     = Math.round(gross * EPF_EMPLOYEE * 100) / 100
    const epf_er      = Math.round(gross * EPF_EMPLOYER * 100) / 100
    const socso_emp   = gross <= 5000 ? Math.round(gross * SOCSO_EMPLOYEE * 100) / 100 : 0
    const socso_er    = gross <= 5000 ? Math.round(gross * SOCSO_EMPLOYER * 100) / 100 : 0
    const eis_emp     = Math.round(gross * EIS_EMPLOYEE * 100) / 100
    const eis_er      = Math.round(gross * EIS_EMPLOYER * 100) / 100
    const pcb         = Math.round(calcPcb(gross) * 100) / 100
    const net_pay     = gross - epf_emp - socso_emp - eis_emp - pcb

    payrollItems.push({
      run_id: run.id,
      staff_id: staff.id,
      basic_salary: staff.salary_basic,
      commissions,
      gross,
      epf_employee: epf_emp,
      epf_employer: epf_er,
      socso_employee: socso_emp,
      socso_employer: socso_er,
      eis_employee: eis_emp,
      eis_employer: eis_er,
      pcb,
      net_pay,
    })
  }

  await supabase.from('payroll_items').insert(payrollItems)

  const { data: full } = await supabase
    .from('payroll_runs')
    .select(`*, payroll_items(*, staff_profiles(name, role))`)
    .eq('id', run.id)
    .single()

  res.status(201).json(full)
}

export async function approvePayroll(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('payroll_runs')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function getPayslip(req, res) {
  const { runId, staffId } = req.params
  const { data, error } = await supabase
    .from('payroll_items')
    .select(`*, payroll_runs(period_month, period_year), staff_profiles(name, ic_number, role, epf_number, socso_number, bank_account, bank_name)`)
    .eq('run_id', runId)
    .eq('staff_id', staffId)
    .single()

  if (error) return res.status(404).json({ error: 'Payslip not found' })
  res.json(data)
}
