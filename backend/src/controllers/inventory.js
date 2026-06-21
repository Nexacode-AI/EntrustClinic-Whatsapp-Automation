import { db as supabase } from '../config/database.js'

// ── STOCK ITEMS ───────────────────────────────────────────────────────────────

export async function listStockItems(req, res) {
  const { type, low_stock, search } = req.query

  let query = supabase
    .from('stock_items')
    .select(`*, stock_batches(id, quantity, expiry_date, batch_number)`)
    .eq('active', true)
    .order('name')

  if (type)   query = query.eq('type', type)
  if (search) query = query.ilike('name', `%${search}%`)
  // low_stock filter applied in JS after fetch since Supabase JS doesn't support column-column comparisons

  let { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  if (low_stock === 'true') data = data.filter(i => i.current_stock <= i.reorder_level)
  res.json(data)
}

export async function getStockItem(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('stock_items')
    .select(`*, stock_batches(*, suppliers(name)), stock_movements(*, created_at)`)
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Item not found' })
  res.json(data)
}

export async function createStockItem(req, res) {
  const { data, error } = await supabase
    .from('stock_items')
    .insert(req.body)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function updateStockItem(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('stock_items')
    .update(req.body)
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// ── STOCK BATCHES ─────────────────────────────────────────────────────────────

export async function addBatch(req, res) {
  const { item_id } = req.params
  const batchData = { ...req.body, item_id }

  const { data: batch, error: batchErr } = await supabase
    .from('stock_batches')
    .insert(batchData)
    .select()
    .single()

  if (batchErr) return res.status(500).json({ error: batchErr.message })

  // Update current_stock
  const { data: item } = await supabase.from('stock_items').select('current_stock').eq('id', item_id).single()
  await supabase
    .from('stock_items')
    .update({ current_stock: (item?.current_stock || 0) + batch.quantity })
    .eq('id', item_id)

  // Record movement
  await supabase.from('stock_movements').insert({
    item_id, batch_id: batch.id, type: 'in', quantity: batch.quantity,
    reference_type: 'purchase_order', notes: `Batch ${batch.batch_number} received`,
  })

  res.status(201).json(batch)
}

// ── STOCK MOVEMENTS ───────────────────────────────────────────────────────────

export async function getMovements(req, res) {
  const { item_id, type, limit = 50 } = req.query

  let query = supabase
    .from('stock_movements')
    .select(`*, stock_items(name, unit)`)
    .order('created_at', { ascending: false })
    .limit(Number(limit))

  if (item_id) query = query.eq('item_id', item_id)
  if (type)    query = query.eq('type', type)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// ── PURCHASE ORDERS ───────────────────────────────────────────────────────────

export async function listPurchaseOrders(req, res) {
  const { status } = req.query
  let query = supabase
    .from('purchase_orders')
    .select(`*, suppliers(name), purchase_order_items(*, stock_items(name, unit))`)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function createPurchaseOrder(req, res) {
  const { supplier_id, branch_id, items = [], notes } = req.body

  const total = items.reduce((s, i) => s + (i.quantity_ordered * i.unit_cost || 0), 0)
  const poNumber = `PO-${Date.now().toString().slice(-8)}`

  const { data: po, error: poErr } = await supabase
    .from('purchase_orders')
    .insert({ po_number: poNumber, supplier_id, branch_id, total_amount: total, notes, status: 'draft' })
    .select()
    .single()

  if (poErr) return res.status(500).json({ error: poErr.message })

  if (items.length > 0) {
    const poItems = items.map(i => ({ ...i, po_id: po.id, total_cost: i.quantity_ordered * i.unit_cost }))
    await supabase.from('purchase_order_items').insert(poItems)
  }

  res.status(201).json(po)
}

export async function receivePurchaseOrder(req, res) {
  const { id } = req.params
  const { items } = req.body // [{ po_item_id, item_id, quantity_received, batch_number, expiry_date, cost_price, selling_price }]

  for (const item of items) {
    // Update PO item quantity
    await supabase
      .from('purchase_order_items')
      .update({ quantity_received: item.quantity_received })
      .eq('id', item.po_item_id)

    // Add batch
    const { data: batch } = await supabase
      .from('stock_batches')
      .insert({
        item_id: item.item_id,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        quantity: item.quantity_received,
        cost_price: item.cost_price,
        selling_price: item.selling_price,
      })
      .select()
      .single()

    // Update stock count
    const { data: stockItem } = await supabase.from('stock_items').select('current_stock').eq('id', item.item_id).single()
    await supabase
      .from('stock_items')
      .update({ current_stock: (stockItem?.current_stock || 0) + item.quantity_received })
      .eq('id', item.item_id)

    // Log movement
    await supabase.from('stock_movements').insert({
      item_id: item.item_id, batch_id: batch?.id,
      type: 'in', quantity: item.quantity_received,
      reference_id: id, reference_type: 'purchase_order',
    })
  }

  await supabase.from('purchase_orders').update({ status: 'received', received_at: new Date().toISOString() }).eq('id', id)
  res.json({ ok: true })
}

// ── LOW STOCK ALERTS ──────────────────────────────────────────────────────────

export async function getLowStockAlerts(req, res) {
  const { data, error } = await supabase
    .from('stock_items')
    .select('id, name, type, unit, current_stock, reorder_level')
    .eq('active', true)
    .order('current_stock')

  if (error) return res.status(500).json({ error: error.message })
  res.json((data || []).filter(i => i.current_stock <= i.reorder_level))
}

// ── EXPIRY ALERTS ─────────────────────────────────────────────────────────────

export async function getExpiryAlerts(req, res) {
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('stock_batches')
    .select(`*, stock_items(name, unit)`)
    .lte('expiry_date', in30Days)
    .gt('quantity', 0)
    .order('expiry_date')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

// ── SUPPLIERS ─────────────────────────────────────────────────────────────────

export async function listSuppliers(req, res) {
  const { data, error } = await supabase.from('suppliers').select('*').eq('active', true).order('name')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function createSupplier(req, res) {
  const { data, error } = await supabase.from('suppliers').insert(req.body).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
}

export async function updateSupplier(req, res) {
  const { id } = req.params
  const { data, error } = await supabase.from('suppliers').update(req.body).eq('id', id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
