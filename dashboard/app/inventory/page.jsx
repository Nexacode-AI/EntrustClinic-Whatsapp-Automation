'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Search, Plus, AlertTriangle, Package, Truck, BarChart2 } from 'lucide-react'
import dayjs from 'dayjs'

const TABS = ['Stock', 'Low Stock', 'Expiry Alerts', 'Purchase Orders', 'Suppliers']

export default function InventoryPage() {
  const [tab, setTab] = useState('Stock')
  const [stock, setStock] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [expiry, setExpiry] = useState([])
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [addBatchOpen, setAddBatchOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [itemForm, setItemForm] = useState({ name: '', generic_name: '', category: 'medicine', unit: 'tablet', reorder_level: 50, selling_price: '' })
  const [batchForm, setBatchForm] = useState({ batch_number: '', quantity: '', cost_price: '', expiry_date: '', supplier_id: '' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [s, ls, ex, po, sup] = await Promise.all([
        api.stockItems(), api.lowStock(), api.expiryAlerts(), api.purchaseOrders(), api.suppliers()
      ])
      setStock(s || [])
      setLowStock(ls || [])
      setExpiry(ex || [])
      setOrders(po || [])
      setSuppliers(sup || [])
    } catch {}
    setLoading(false)
  }

  async function handleAddItem() {
    await api.createStock(itemForm)
    setAddItemOpen(false)
    setItemForm({ name: '', generic_name: '', category: 'medicine', unit: 'tablet', reorder_level: 50, selling_price: '' })
    loadAll()
  }

  async function handleAddBatch() {
    await api.addBatch(selectedItem.id, batchForm)
    setAddBatchOpen(false)
    setBatchForm({ batch_number: '', quantity: '', cost_price: '', expiry_date: '', supplier_id: '' })
    loadAll()
  }

  const filtered = stock.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Drug & supply management</p>
        </div>
        <div className="flex gap-2">
          {lowStock.length > 0 && (
            <button onClick={() => setTab('Low Stock')} className="btn-warning btn-sm">
              <AlertTriangle size={13} /> {lowStock.length} Low Stock
            </button>
          )}
          <button onClick={() => setAddItemOpen(true)} className="btn-primary btn-sm">
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Items', value: stock.length, icon: Package, color: 'bg-brand-light', iconColor: 'text-brand' },
          { label: 'Low Stock', value: lowStock.length, icon: AlertTriangle, color: 'bg-warning-light', iconColor: 'text-warning-dark' },
          { label: 'Expiring Soon', value: expiry.length, icon: BarChart2, color: 'bg-danger-light', iconColor: 'text-danger-dark' },
          { label: 'Pending Orders', value: orders.filter(o => o.status === 'pending').length, icon: Truck, color: 'bg-info-light', iconColor: 'text-info-dark' },
        ].map(({ label, value, icon: Icon, color, iconColor }) => (
          <div key={label} className="stat-card">
            <div><p className="stat-value">{value}</p><p className="stat-label">{label}</p></div>
            <div className={`stat-icon-wrap ${color}`}><Icon size={18} className={iconColor} /></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="tab-list border-b border-border px-4">
          {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`tab-item ${tab === t ? 'tab-active' : ''}`}>{t}</button>)}
        </div>

        {tab === 'Stock' && (
          <div>
            <div className="p-3 border-b border-border">
              <div className="relative w-64">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input className="form-input pl-7 py-1.5 text-sm" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            {filtered.length === 0 ? (
              <EmptyState icon={Package} title="No items" description="Add inventory items to get started" />
            ) : (
              <div className="overflow-x-auto"><table className="data-table">
                <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Reorder Level</th><th>Selling Price</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id}>
                      <td>
                        <p className="font-semibold text-sm text-ink">{item.name}</p>
                        <p className="text-2xs text-ink-faint">{item.generic_name}</p>
                      </td>
                      <td><span className="badge badge-gray capitalize">{item.category}</span></td>
                      <td>
                        <span className={`font-bold text-sm ${item.current_stock <= item.reorder_level ? 'text-danger' : 'text-ink'}`}>
                          {item.current_stock} {item.unit}
                        </span>
                      </td>
                      <td className="text-sm text-ink-muted">{item.reorder_level} {item.unit}</td>
                      <td className="text-sm font-semibold">RM {parseFloat(item.selling_price || 0).toFixed(2)}</td>
                      <td>
                        {item.current_stock === 0 ? <Badge status="inactive" label="Out of Stock" /> :
                         item.current_stock <= item.reorder_level ? <Badge status="urgent" label="Low Stock" /> :
                         <Badge status="active" label="In Stock" />}
                      </td>
                      <td>
                        <button onClick={() => { setSelectedItem(item); setAddBatchOpen(true) }} className="btn-ghost btn-xs">
                          <Plus size={11} /> Batch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        )}

        {tab === 'Low Stock' && (
          <div>
            {lowStock.length === 0 ? (
              <EmptyState icon={Package} title="All stock levels are healthy" />
            ) : (
              <div className="overflow-x-auto"><table className="data-table">
                <thead><tr><th>Item</th><th>Current Stock</th><th>Reorder Level</th><th>Deficit</th></tr></thead>
                <tbody>
                  {lowStock.map(item => (
                    <tr key={item.id}>
                      <td><p className="font-semibold text-sm">{item.name}</p><p className="text-2xs text-ink-faint">{item.generic_name}</p></td>
                      <td><span className="font-bold text-danger">{item.current_stock} {item.unit}</span></td>
                      <td className="text-sm text-ink-muted">{item.reorder_level}</td>
                      <td><span className="font-bold text-warning-dark">{Math.max(0, item.reorder_level - item.current_stock)} {item.unit}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        )}

        {tab === 'Expiry Alerts' && (
          <div>
            {expiry.length === 0 ? (
              <EmptyState icon={Package} title="No expiring batches" description="Batches expiring within 30 days will appear here" />
            ) : (
              <div className="overflow-x-auto"><table className="data-table">
                <thead><tr><th>Item</th><th>Batch</th><th>Quantity</th><th>Expiry Date</th><th>Days Left</th></tr></thead>
                <tbody>
                  {expiry.map(b => {
                    const daysLeft = dayjs(b.expiry_date).diff(dayjs(), 'day')
                    return (
                      <tr key={b.id}>
                        <td className="font-semibold text-sm">{b.stock_items?.name}</td>
                        <td className="font-mono text-sm">{b.batch_number}</td>
                        <td className="text-sm">{b.quantity}</td>
                        <td className="text-sm">{dayjs(b.expiry_date).format('D MMM YYYY')}</td>
                        <td><span className={`font-bold text-sm ${daysLeft <= 7 ? 'text-danger' : 'text-warning-dark'}`}>{daysLeft}d</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table></div>
            )}
          </div>
        )}

        {tab === 'Purchase Orders' && (
          <div className="p-4">
            {orders.length === 0 ? (
              <EmptyState icon={Truck} title="No purchase orders" />
            ) : (
              <div className="overflow-x-auto"><table className="data-table">
                <thead><tr><th>PO Number</th><th>Supplier</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {orders.map(po => (
                    <tr key={po.id}>
                      <td className="font-mono text-brand font-semibold text-sm">{po.po_number}</td>
                      <td className="text-sm">{po.suppliers?.name}</td>
                      <td className="text-sm">{po.item_count || '—'}</td>
                      <td className="font-semibold text-sm">RM {parseFloat(po.total_amount || 0).toFixed(2)}</td>
                      <td><Badge status={po.status} /></td>
                      <td className="text-sm text-ink-muted">{dayjs(po.created_at).format('D MMM YYYY')}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        )}

        {tab === 'Suppliers' && (
          <div className="p-4">
            {suppliers.length === 0 ? (
              <EmptyState icon={Truck} title="No suppliers" description="Add your pharmaceutical suppliers" />
            ) : (
              <div className="overflow-x-auto"><table className="data-table">
                <thead><tr><th>Supplier</th><th>Contact</th><th>Email</th><th>Phone</th></tr></thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.id}>
                      <td className="font-semibold text-sm">{s.name}</td>
                      <td className="text-sm text-ink-muted">{s.contact_person}</td>
                      <td className="text-sm text-ink-muted">{s.email}</td>
                      <td className="text-sm text-ink-muted">{s.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <Modal open={addItemOpen} onClose={() => setAddItemOpen(false)} title="Add Stock Item" footer={
        <><button onClick={() => setAddItemOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleAddItem} className="btn-primary">Add Item</button></>
      }>
        <div className="grid grid-cols-2 gap-3">
          {[['name','Name'],['generic_name','Generic Name']].map(([k,l]) => (
            <div key={k} className="col-span-2 form-group">
              <label className="form-label">{l}</label>
              <input className="form-input" value={itemForm[k]} onChange={e => setItemForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))}>
              {['medicine','supply','equipment','consumable'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <select className="form-select" value={itemForm.unit} onChange={e => setItemForm(f => ({ ...f, unit: e.target.value }))}>
              {['tablet','capsule','bottle','vial','sachet','box','piece'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Reorder Level</label>
            <input type="number" className="form-input" value={itemForm.reorder_level} onChange={e => setItemForm(f => ({ ...f, reorder_level: parseInt(e.target.value) || 0 }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Selling Price (RM)</label>
            <input type="number" step="0.01" className="form-input" value={itemForm.selling_price} onChange={e => setItemForm(f => ({ ...f, selling_price: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Add Batch Modal */}
      <Modal open={addBatchOpen} onClose={() => setAddBatchOpen(false)} title={`Add Batch — ${selectedItem?.name}`} footer={
        <><button onClick={() => setAddBatchOpen(false)} className="btn-secondary">Cancel</button><button onClick={handleAddBatch} className="btn-primary">Add Batch</button></>
      }>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 form-group">
            <label className="form-label">Batch Number</label>
            <input className="form-input" value={batchForm.batch_number} onChange={e => setBatchForm(f => ({ ...f, batch_number: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input type="number" className="form-input" value={batchForm.quantity} onChange={e => setBatchForm(f => ({ ...f, quantity: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Cost Price (RM)</label>
            <input type="number" step="0.01" className="form-input" value={batchForm.cost_price} onChange={e => setBatchForm(f => ({ ...f, cost_price: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Expiry Date</label>
            <input type="date" className="form-input" value={batchForm.expiry_date} onChange={e => setBatchForm(f => ({ ...f, expiry_date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <select className="form-select" value={batchForm.supplier_id} onChange={e => setBatchForm(f => ({ ...f, supplier_id: e.target.value }))}>
              <option value="">Select supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
