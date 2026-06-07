const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const KEY  = process.env.NEXT_PUBLIC_API_KEY  || ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: { 'x-api-key': KEY, 'Content-Type': 'application/json', ...options.headers },
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `API error ${res.status}: ${path}`)
  }
  return res.json()
}

const g = (p)       => request(p)
const po = (p, b)   => request(p, { method: 'POST',   body: JSON.stringify(b) })
const pu = (p, b)   => request(p, { method: 'PUT',    body: JSON.stringify(b) })
const pa = (p, b)   => request(p, { method: 'PATCH',  body: JSON.stringify(b) })
const d  = (p)      => request(p, { method: 'DELETE' })
const qs = (o = {}) => Object.keys(o).length ? '?' + new URLSearchParams(o) : ''

export const api = {
  // Analytics
  analytics: ()    => g('/analytics'),

  // Appointments
  appointments:     (p = {}) => g(`/appointments${qs(p)}`),
  appointment:      (id)     => g(`/appointments/${id}`),
  appointmentStats: (p = {}) => g(`/appointments/stats${qs(p)}`),
  updateAppointmentStatus: (id, status) => pa(`/appointments/${id}/status`, { status }),
  sendReminder:     (id)     => po(`/appointments/${id}/send-reminder`),
  sendReview:       (id)     => po(`/appointments/${id}/send-review`),

  // Queue
  queue:            (p = {}) => g(`/queue${qs(p)}`),
  queueStats:       (p = {}) => g(`/queue/stats${qs(p)}`),
  addQueue:         (body)   => po('/queue', body),
  updateQueue:      (id, s)  => pa(`/queue/${id}/status`, { status: s }),
  removeQueue:      (id)     => d(`/queue/${id}`),

  // EMR / Consultations
  consultations:       (p = {}) => g(`/consultations${qs(p)}`),
  consultation:        (id)     => g(`/consultations/${id}`),
  createConsultation:  (body)   => po('/consultations', body),
  updateConsultation:  (id, b)  => pa(`/consultations/${id}`, b),
  completeConsult:     (id)     => po(`/consultations/${id}/complete`),
  createPrescription:  (id, b)  => po(`/consultations/${id}/prescription`, b),
  patientConsults:     (pid, p={}) => g(`/patients/${pid}/consultations${qs(p)}`),
  patientVitals:       (pid)    => g(`/patients/${pid}/vitals`),
  searchIcd10:         (q)      => g(`/search/icd10?q=${encodeURIComponent(q)}`),
  searchDrugs:         (q)      => g(`/search/drugs?q=${encodeURIComponent(q)}`),

  // Patients
  patients:         (p = {}) => g(`/patients${qs(p)}`),
  patient:          (id)     => g(`/patients/${id}`),
  updatePatient:    (id, b)  => pa(`/patients/${id}`, b),
  deletePatient:    (id)     => d(`/patients/${id}`),

  // Billing
  invoices:         (p = {}) => g(`/invoices${qs(p)}`),
  invoice:          (id)     => g(`/invoices/${id}`),
  createInvoice:    (body)   => po('/invoices', body),
  updatePayment:    (id, b)  => pa(`/invoices/${id}/payment`, b),
  revenueStats:     (p = {}) => g(`/billing/revenue${qs(p)}`),
  dailySummary:     (p = {}) => g(`/billing/daily${qs(p)}`),

  // Inventory
  stockItems:       (p = {}) => g(`/inventory${qs(p)}`),
  stockItem:        (id)     => g(`/inventory/${id}`),
  createStock:      (b)      => po('/inventory', b),
  updateStock:      (id, b)  => pa(`/inventory/${id}`, b),
  addBatch:         (itemId, b) => po(`/inventory/${itemId}/batch`, b),
  lowStock:         ()       => g('/inventory/low-stock'),
  expiryAlerts:     ()       => g('/inventory/expiry-alerts'),
  movements:        (p = {}) => g(`/inventory/movements${qs(p)}`),
  suppliers:        ()       => g('/suppliers'),
  createSupplier:   (b)      => po('/suppliers', b),
  updateSupplier:   (id, b)  => pa(`/suppliers/${id}`, b),
  purchaseOrders:   (p = {}) => g(`/purchase-orders${qs(p)}`),
  createPO:         (b)      => po('/purchase-orders', b),
  receivePO:        (id, b)  => po(`/purchase-orders/${id}/receive`, b),

  // Pharmacy
  pendingRx:        (p = {}) => g(`/pharmacy/prescriptions${qs(p)}`),
  prescription:     (id)     => g(`/pharmacy/prescriptions/${id}`),
  updateRxStatus:   (id, s)  => pa(`/pharmacy/prescriptions/${id}/status`, { status: s }),
  dispenseItem:     (itemId, b) => pa(`/pharmacy/items/${itemId}/dispense`, b),
  checkInteractions:(drugs)  => po('/pharmacy/check-interactions', { drugs }),

  // Panel
  panels:           ()       => g('/panels'),
  panel:            (id)     => g(`/panels/${id}`),
  createPanel:      (b)      => po('/panels', b),
  updatePanel:      (id, b)  => pa(`/panels/${id}`, b),
  setPanelFees:     (id, f)  => pu(`/panels/${id}/fees`, { fees: f }),
  panelClaims:      (p = {}) => g(`/panel-claims${qs(p)}`),
  updateClaim:      (id, b)  => pa(`/panel-claims/${id}/status`, b),
  claimAging:       ()       => g('/panel-claims/aging'),

  // FOMEMA
  fomemaStats:      ()       => g('/fomema/stats'),
  fomemaWorkers:    (p = {}) => g(`/fomema${qs(p)}`),
  fomemaWorker:     (id)     => g(`/fomema/${id}`),
  createWorker:     (b)      => po('/fomema', b),
  updateWorker:     (id, b)  => pa(`/fomema/${id}`, b),
  createExam:       (id, b)  => po(`/fomema/${id}/exam`, b),
  updateExam:       (examId, b) => pa(`/fomema/exams/${examId}`, b),
  submitFomema:     (examId) => po(`/fomema/exams/${examId}/submit`),

  // Staff
  staff:            (p = {}) => g(`/staff${qs(p)}`),
  staffMember:      (id)     => g(`/staff/${id}`),
  createStaff:      (b)      => po('/staff', b),
  updateStaff:      (id, b)  => pa(`/staff/${id}`, b),
  clockIn:          (b)      => po('/attendance/clock-in', b),
  clockOut:         (b)      => po('/attendance/clock-out', b),
  attendance:       (p = {}) => g(`/attendance${qs(p)}`),
  leaves:           (p = {}) => g(`/leaves${qs(p)}`),
  applyLeave:       (b)      => po('/leaves', b),
  updateLeave:      (id, s)  => pa(`/leaves/${id}/status`, { status: s }),

  // Payroll
  payrollRuns:      (p = {}) => g(`/payroll${qs(p)}`),
  payrollRun:       (id)     => g(`/payroll/${id}`),
  generatePayroll:  (b)      => po('/payroll/generate', b),
  approvePayroll:   (id)     => po(`/payroll/${id}/approve`),
  payslip:          (runId, staffId) => g(`/payroll/${runId}/payslip/${staffId}`),

  // Packages
  packagePlans:     ()       => g('/package-plans'),
  createPlan:       (b)      => po('/package-plans', b),
  updatePlan:       (id, b)  => pa(`/package-plans/${id}`, b),
  patientPackages:  (pid)    => g(`/patients/${pid}/packages`),
  sellPackage:      (b)      => po('/patient-packages', b),
  redeemSession:    (id, b)  => po(`/patient-packages/${id}/redeem`, b),

  // Loyalty
  rewards:          ()       => g('/loyalty/rewards'),
  createReward:     (b)      => po('/loyalty/rewards', b),
  earnPoints:       (b)      => po('/loyalty/earn', b),
  redeemReward:     (b)      => po('/loyalty/redeem', b),
  loyaltyTx:        (p = {}) => g(`/loyalty/transactions${qs(p)}`),
  patientLoyalty:   (pid)    => g(`/patients/${pid}/loyalty`),

  // Expenses
  expenses:         (p = {}) => g(`/expenses${qs(p)}`),
  createExpense:    (b)      => po('/expenses', b),
  updateExpense:    (id, b)  => pa(`/expenses/${id}`, b),
  deleteExpense:    (id)     => d(`/expenses/${id}`),
  expenseCategories:()       => g('/expense-categories'),
  expenseSummary:   (p = {}) => g(`/expenses/summary${qs(p)}`),
  profitLoss:       (p = {}) => g(`/expenses/profit-loss${qs(p)}`),

  // Telemedicine
  videoRooms:       (p = {}) => g(`/video-rooms${qs(p)}`),
  createRoom:       (b)      => po('/video-rooms', b),
  startRoom:        (id)     => po(`/video-rooms/${id}/start`),
  endRoom:          (id)     => po(`/video-rooms/${id}/end`),
  sendRoomLink:     (id)     => po(`/video-rooms/${id}/send-link`),

  // Reports
  revenueReport:    (p = {}) => g(`/reports/revenue${qs(p)}`),
  apptReport:       (p = {}) => g(`/reports/appointments${qs(p)}`),
  demographics:     ()       => g('/reports/demographics'),
  doctorProductivity:(p={})  => g(`/reports/doctor-productivity${qs(p)}`),
  diagnoses:        (p = {}) => g(`/reports/diagnoses${qs(p)}`),
  drugUsage:        (p = {}) => g(`/reports/drug-usage${qs(p)}`),

  // Branches
  branches:         ()       => g('/branches'),
  createBranch:     (b)      => po('/branches', b),
  updateBranch:     (id, b)  => pa(`/branches/${id}`, b),

  // Doctors
  doctors:          ()       => g('/doctors'),
  doctor:           (id)     => g(`/doctors/${id}`),
  createDoctor:     (b)      => po('/doctors', b),
  updateDoctor:     (id, b)  => pa(`/doctors/${id}`, b),
  deleteDoctor:     (id)     => d(`/doctors/${id}`),
  setDoctorServices:(id, s)  => pu(`/doctors/${id}/services`, { service_ids: s }),
  doctorAvailability:(id)    => g(`/doctors/${id}/availability`),
  setDoctorAvailability:(id, b) => pu(`/doctors/${id}/availability`, b),

  services:         ()       => g('/services'),
  createService:    (b)      => po('/services', b),
  updateService:    (id, b)  => pa(`/services/${id}`, b),
  deleteService:    (id)     => d(`/services/${id}`),

  blockedSlots:     (p = {}) => g(`/blocked-slots${qs(p)}`),
  createBlockedSlot:(b)      => po('/blocked-slots', b),
  deleteBlockedSlot:(id)     => d(`/blocked-slots/${id}`),

  conversations:    (p = {}) => g(`/conversations${qs(p)}`),
  messages:         (phone)  => g(`/conversations/${encodeURIComponent(phone)}/messages`),
  deleteConversation:(phone) => d(`/conversations/${encodeURIComponent(phone)}`),
  sendMessage: async (phone, message) => {
    const res = await fetch(`${BASE}/webhook/send`, {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    })
    if (!res.ok) throw new Error(`Send failed ${res.status}`)
    return res.json()
  },

  escalations:      (p = {}) => g(`/escalations${qs(p)}`),
  resolveEscalation:(id)     => pa(`/escalations/${id}/resolve`, { resolved_by: 'staff' }),

  broadcast:        (message, filter = {}) => po('/broadcast', { message, filter }),

  settings:         ()       => g('/settings'),
  updateSetting:    (key, b) => pu(`/settings/${key}`, b),
  integrations:     ()       => g('/settings/integrations'),
}
