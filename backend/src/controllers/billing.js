import { db as supabase } from '../config/database.js'
import dayjs from 'dayjs'

function generateInvoiceNumber() {
  const date = dayjs().format('YYYYMMDD')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `INV-${date}-${rand}`
}

// ── INVOICES ──────────────────────────────────────────────────────────────────

export async function listInvoices(req, res) {
  const { patient_id, status, date_from, date_to, limit = 30, offset = 0 } = req.query

  let query = supabase
    .from('invoices')
    .select(`
      *,
      patients(id, name, phone),
      panel_companies(id, name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (patient_id) query = query.eq('patient_id', patient_id)
  if (status)     query = query.eq('payment_status', status)
  if (date_from)  query = query.gte('created_at', `${date_from}T00:00:00`)
  if (date_to)    query = query.lte('created_at', `${date_to}T23:59:59`)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data, total: count })
}

export async function getInvoice(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_items(*),
      patients(id, name, phone, ic_number, date_of_birth),
      panel_companies(id, name),
      panel_claims(*)
    `)
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Invoice not found' })
  res.json(data)
}

export async function createInvoice(req, res) {
  const {
    patient_id, consultation_id, appointment_id, branch_id,
    panel_id, items = [], discount_type, discount_value,
    payment_method, notes,
  } = req.body

  if (!patient_id || items.length === 0) {
    return res.status(400).json({ error: 'patient_id and items required' })
  }

  const subtotal = items.reduce((sum, item) => sum + (item.total || item.quantity * item.unit_price || 0), 0)
  const discountAmount = discount_value
    ? (discount_type === 'percent' ? subtotal * discount_value / 100 : discount_value)
    : 0
  const total = subtotal - discountAmount

  const { data: inv, error: invErr } = await supabase
    .from('invoices')
    .insert({
      invoice_number: generateInvoiceNumber(),
      patient_id, consultation_id, appointment_id, branch_id, panel_id,
      subtotal, discount_type, discount_value, discount_amount: discountAmount,
      total, balance: total,
      payment_method: payment_method || 'cash',
      payment_status: 'unpaid',
      notes,
    })
    .select()
    .single()

  if (invErr) return res.status(500).json({ error: invErr.message })

  const invoiceItems = items.map(item => ({ ...item, invoice_id: inv.id }))
  const { error: itemErr } = await supabase.from('invoice_items').insert(invoiceItems)
  if (itemErr) return res.status(500).json({ error: itemErr.message })

  // If panel visit, create panel claim
  if (panel_id) {
    await supabase.from('panel_claims').insert({ invoice_id: inv.id, panel_id, amount: total })
  }

  const { data: full } = await supabase
    .from('invoices')
    .select('*, invoice_items(*), patients(id, name, phone), panel_companies(id, name)')
    .eq('id', inv.id)
    .single()

  res.status(201).json(full)
}

export async function updatePayment(req, res) {
  const { id } = req.params
  const { paid_amount, payment_method, payment_status } = req.body

  const { data: inv } = await supabase
    .from('invoices')
    .select('total')
    .eq('id', id)
    .single()

  if (!inv) return res.status(404).json({ error: 'Invoice not found' })

  const finalPaid   = paid_amount ?? inv.total
  const finalStatus = payment_status || (finalPaid >= inv.total ? 'paid' : 'partial')
  const balance     = inv.total - finalPaid

  const { data, error } = await supabase
    .from('invoices')
    .update({
      paid_amount: finalPaid,
      payment_status: finalStatus,
      payment_method,
      balance,
      paid_at: finalStatus === 'paid' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // If paid, move queue entry to done
  if (finalStatus === 'paid' && data.consultation_id) {
    const { data: consult } = await supabase
      .from('consultations')
      .select('queue_entry_id')
      .eq('id', data.consultation_id)
      .single()
    if (consult?.queue_entry_id) {
      await supabase
        .from('queue_entries')
        .update({ status: 'done', done_at: new Date().toISOString() })
        .eq('id', consult.queue_entry_id)
    }
  }

  res.json(data)
}

// ── REVENUE STATS ─────────────────────────────────────────────────────────────

export async function getRevenueStats(req, res) {
  const now = dayjs()
  const ranges = {
    today: [now.startOf('day').toISOString(), now.endOf('day').toISOString()],
    week:  [now.startOf('week').toISOString(), now.endOf('week').toISOString()],
    month: [now.startOf('month').toISOString(), now.endOf('month').toISOString()],
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('total, paid_amount, payment_status, created_at')
    .gte('created_at', ranges.month[0])
    .lte('created_at', ranges.month[1])

  if (error) return res.status(500).json({ error: error.message })

  const sum = (rows) => rows.reduce((s, i) => s + (i.total || 0), 0)
  const inRange = (rows, from, to) => rows.filter(i => i.created_at >= from && i.created_at <= to)

  const todayRows  = inRange(data, ranges.today[0], ranges.today[1])
  const weekRows   = inRange(data, ranges.week[0], ranges.week[1])

  const { data: unpaidData } = await supabase
    .from('invoices')
    .select('total')
    .eq('payment_status', 'unpaid')

  const outstanding = (unpaidData || []).reduce((s, i) => s + (i.total || 0), 0)

  res.json({
    today: sum(todayRows),
    week:  sum(weekRows),
    month: sum(data),
    outstanding,
    totalRevenue: sum(data),
    collectedRevenue: data.reduce((s, i) => s + (i.paid_amount || 0), 0),
    invoiceCount: data.length,
  })
}

// ── DAILY SUMMARY ─────────────────────────────────────────────────────────────

export async function getDailySummary(req, res) {
  const { date } = req.query
  const targetDate = date || dayjs().format('YYYY-MM-DD')

  const { data, error } = await supabase
    .from('invoices')
    .select('total, payment_method, payment_status')
    .gte('created_at', `${targetDate}T00:00:00`)
    .lte('created_at', `${targetDate}T23:59:59`)

  if (error) return res.status(500).json({ error: error.message })

  const byMethod = {}
  let totalPaid = 0, totalUnpaid = 0

  data.forEach(inv => {
    if (inv.payment_status === 'paid') {
      totalPaid += inv.total || 0
      byMethod[inv.payment_method] = (byMethod[inv.payment_method] || 0) + (inv.total || 0)
    } else {
      totalUnpaid += inv.total || 0
    }
  })

  res.json({ date: targetDate, totalPaid, totalUnpaid, invoices: data.length, byMethod })
}
