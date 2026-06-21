import { db as supabase } from '../config/database.js'
import dayjs from 'dayjs'

export async function listExpenses(req, res) {
  const { category_id, branch_id, month, year, limit = 50, offset = 0 } = req.query
  const m = month || dayjs().month() + 1
  const y = year  || dayjs().year()
  const from = `${y}-${String(m).padStart(2,'0')}-01`
  const to   = dayjs(`${from}`).endOf('month').format('YYYY-MM-DD')

  let query = supabase
    .from('expenses')
    .select(`*, expense_categories(name)`, { count: 'exact' })
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  if (category_id) query = query.eq('category_id', category_id)
  if (branch_id)   query = query.eq('branch_id', branch_id)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data, total: count })
}

export async function createExpense(req, res) {
  const { data, error } = await supabase.from('expenses').insert(req.body).select(`*, expense_categories(name)`).single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function updateExpense(req, res) {
  const { id } = req.params
  const { data, error } = await supabase.from('expenses').update(req.body).eq('id', id).select(`*, expense_categories(name)`).single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function deleteExpense(req, res) {
  const { id } = req.params
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
}

export async function listCategories(req, res) {
  const { data, error } = await supabase.from('expense_categories').select('*').order('name')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function getExpenseSummary(req, res) {
  const { month, year, branch_id } = req.query
  const m = month || dayjs().month() + 1
  const y = year  || dayjs().year()
  const from = `${y}-${String(m).padStart(2,'0')}-01`
  const to   = dayjs(from).endOf('month').format('YYYY-MM-DD')

  let query = supabase
    .from('expenses')
    .select(`amount, expense_categories(name)`)
    .gte('date', from)
    .lte('date', to)

  if (branch_id) query = query.eq('branch_id', branch_id)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  const total = data.reduce((s, e) => s + (e.amount || 0), 0)
  const byCategory = {}
  data.forEach(e => {
    const cat = e.expense_categories?.name || 'Other'
    byCategory[cat] = (byCategory[cat] || 0) + e.amount
  })

  res.json({ total, byCategory, count: data.length })
}

export async function getProfitLoss(req, res) {
  const { month, year } = req.query
  const m = month || dayjs().month() + 1
  const y = year  || dayjs().year()
  const from = `${y}-${String(m).padStart(2,'0')}-01`
  const to   = dayjs(from).endOf('month').format('YYYY-MM-DD')

  const [invoicesRes, expensesRes] = await Promise.all([
    supabase.from('invoices').select('total, payment_status').gte('created_at', `${from}T00:00:00`).lte('created_at', `${to}T23:59:59`),
    supabase.from('expenses').select('amount').gte('date', from).lte('date', to),
  ])

  const revenue  = (invoicesRes.data || []).reduce((s, i) => s + (i.total || 0), 0)
  const expenses = (expensesRes.data || []).reduce((s, e) => s + (e.amount || 0), 0)
  const profit   = revenue - expenses

  res.json({ month: m, year: y, revenue, expenses, profit })
}
