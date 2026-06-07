import { Router } from 'express'
import { apiAuth } from '../middleware/auth.js'

// Existing controllers
import { listAppointments, getAppointment, updateAppointmentStatus, getMonthlyStats } from '../controllers/appointments.js'
import { listPatients, getPatient, updatePatient, deletePatient } from '../controllers/patients.js'
import { listConversations, getMessages, deleteConversation, resolveEscalation as resolveConvEscalation } from '../controllers/conversations.js'
import { listEscalations, resolveEscalation } from '../controllers/escalations.js'
import { getDashboardStats } from '../controllers/analytics.js'
import { listDoctors, getDoctor, createDoctor, updateDoctor, deleteDoctor, setDoctorServices, getDoctorAvailability, setDoctorAvailability, listBlockedSlots, createBlockedSlot, deleteBlockedSlot } from '../controllers/doctors.js'
import { listServices, createService, updateService, deleteService } from '../controllers/services.js'
import { sendAppointmentReminder, sendReviewRequest, broadcastMessage } from '../controllers/messaging.js'

// New controllers
import { getQueue, addToQueue, updateQueueStatus, getQueueDisplay, getQueueStats, removeFromQueue } from '../controllers/queue.js'
import { listConsultations, getConsultation, createConsultation, updateConsultation, completeConsultation, createPrescription, updatePrescriptionItem, searchIcd10, searchDrugs, getVitalsHistory } from '../controllers/emr.js'
import { listInvoices, getInvoice, createInvoice, updatePayment, getRevenueStats, getDailySummary } from '../controllers/billing.js'
import { listStockItems, getStockItem, createStockItem, updateStockItem, addBatch, getMovements, listPurchaseOrders, createPurchaseOrder, receivePurchaseOrder, getLowStockAlerts, getExpiryAlerts, listSuppliers, createSupplier, updateSupplier } from '../controllers/inventory.js'
import { getPendingPrescriptions, getPrescription, dispenseItem, updatePrescriptionStatus, getDrugLabel, getDispenseHistory, checkInteractions } from '../controllers/pharmacy.js'
import { listPanels, getPanel, createPanel, updatePanel, setPanelFees, listClaims, updateClaimStatus, getClaimAging } from '../controllers/panel.js'
import { listWorkers, getWorker, createWorker, updateWorker, createExam, updateExam, submitToFomema, getFomemaStats } from '../controllers/fomema.js'
import { listStaff, getStaffMember, createStaff, updateStaff, deactivateStaff, clockIn, clockOut, getAttendance, listLeaves, applyLeave, updateLeaveStatus } from '../controllers/staff.js'
import { listPayrollRuns, getPayrollRun, generatePayroll, approvePayroll, getPayslip } from '../controllers/payroll.js'
import { listPlans, createPlan, updatePlan, getPatientPackages, sellPackage, redeemSession, getPackageStats } from '../controllers/packages.js'
import { getPatientLoyalty, earnPoints, redeemPoints, listRewards, createReward, getTransactions } from '../controllers/loyalty.js'
import { listExpenses, createExpense, updateExpense, deleteExpense, listCategories, getExpenseSummary, getProfitLoss } from '../controllers/expenses.js'
import { createVideoRoom, listVideoRooms, startRoom, endRoom, sendRoomLink } from '../controllers/telemedicine.js'
import { getRevenueReport, getAppointmentReport, getDemographicsReport, getDoctorProductivity, getDiagnosisReport, getDrugUsageReport } from '../controllers/reports.js'
import { listBranches, createBranch, updateBranch } from '../controllers/branches.js'
import { getSettings, updateSetting, getClinicProfile, getIntegrationStatus } from '../controllers/settings.js'

const router = Router()
router.use(apiAuth)

// ── EXISTING ROUTES ────────────────────────────────────────────────────────────
router.get('/appointments', listAppointments)
router.get('/appointments/stats', getMonthlyStats)
router.get('/appointments/:id', getAppointment)
router.patch('/appointments/:id/status', updateAppointmentStatus)

router.get('/patients', listPatients)
router.get('/patients/:id', getPatient)
router.patch('/patients/:id', updatePatient)
router.delete('/patients/:id', deletePatient)
router.get('/patients/:patient_id/vitals', getVitalsHistory)
router.get('/patients/:patient_id/consultations', listConsultations)
router.get('/patients/:patient_id/packages', getPatientPackages)
router.get('/patients/:patient_id/loyalty', getPatientLoyalty)
router.get('/patients/:patient_id/dispense-history', getDispenseHistory)

router.get('/conversations', listConversations)
router.get('/conversations/:phone/messages', getMessages)
router.delete('/conversations/:phone', deleteConversation)
router.post('/conversations/:phone/resolve', resolveConvEscalation)

router.get('/escalations', listEscalations)
router.patch('/escalations/:id/resolve', resolveEscalation)

router.get('/analytics', getDashboardStats)

router.get('/doctors', listDoctors)
router.post('/doctors', createDoctor)
router.get('/doctors/:id', getDoctor)
router.patch('/doctors/:id', updateDoctor)
router.delete('/doctors/:id', deleteDoctor)
router.put('/doctors/:id/services', setDoctorServices)
router.get('/doctors/:id/availability', getDoctorAvailability)
router.put('/doctors/:id/availability', setDoctorAvailability)

router.get('/blocked-slots', listBlockedSlots)
router.post('/blocked-slots', createBlockedSlot)
router.delete('/blocked-slots/:id', deleteBlockedSlot)

router.get('/services', listServices)
router.post('/services', createService)
router.patch('/services/:id', updateService)
router.delete('/services/:id', deleteService)

router.post('/appointments/:id/send-reminder', sendAppointmentReminder)
router.post('/appointments/:id/send-review', sendReviewRequest)
router.post('/broadcast', broadcastMessage)

// ── QUEUE ──────────────────────────────────────────────────────────────────────
router.get('/queue', getQueue)
router.get('/queue/stats', getQueueStats)
router.post('/queue', addToQueue)
router.patch('/queue/:id/status', updateQueueStatus)
router.delete('/queue/:id', removeFromQueue)

// Public display (no apiAuth needed — handled separately below)
// router.get('/queue/display', getQueueDisplay)  -- registered without auth

// ── EMR / CONSULTATIONS ────────────────────────────────────────────────────────
router.get('/consultations', listConsultations)
router.post('/consultations', createConsultation)
router.get('/consultations/:id', getConsultation)
router.patch('/consultations/:id', updateConsultation)
router.post('/consultations/:id/complete', completeConsultation)
router.post('/consultations/:id/prescription', createPrescription)
router.patch('/prescription-items/:itemId', updatePrescriptionItem)

router.get('/search/icd10', searchIcd10)
router.get('/search/drugs', searchDrugs)

// ── BILLING ────────────────────────────────────────────────────────────────────
router.get('/invoices', listInvoices)
router.post('/invoices', createInvoice)
router.get('/invoices/:id', getInvoice)
router.patch('/invoices/:id/payment', updatePayment)
router.get('/billing/revenue', getRevenueStats)
router.get('/billing/daily', getDailySummary)

// ── INVENTORY ──────────────────────────────────────────────────────────────────
router.get('/inventory', listStockItems)
router.post('/inventory', createStockItem)
router.get('/inventory/low-stock', getLowStockAlerts)
router.get('/inventory/expiry-alerts', getExpiryAlerts)
router.get('/inventory/movements', getMovements)
router.get('/inventory/:id', getStockItem)
router.patch('/inventory/:id', updateStockItem)
router.post('/inventory/:item_id/batch', addBatch)

router.get('/purchase-orders', listPurchaseOrders)
router.post('/purchase-orders', createPurchaseOrder)
router.post('/purchase-orders/:id/receive', receivePurchaseOrder)

router.get('/suppliers', listSuppliers)
router.post('/suppliers', createSupplier)
router.patch('/suppliers/:id', updateSupplier)

// ── PHARMACY ───────────────────────────────────────────────────────────────────
router.get('/pharmacy/prescriptions', getPendingPrescriptions)
router.get('/pharmacy/prescriptions/:id', getPrescription)
router.patch('/pharmacy/prescriptions/:id/status', updatePrescriptionStatus)
router.patch('/pharmacy/items/:itemId/dispense', dispenseItem)
router.get('/pharmacy/items/:id/label', getDrugLabel)
router.post('/pharmacy/check-interactions', checkInteractions)

// ── PANEL / TPA ────────────────────────────────────────────────────────────────
router.get('/panels', listPanels)
router.post('/panels', createPanel)
router.get('/panels/:id', getPanel)
router.patch('/panels/:id', updatePanel)
router.put('/panels/:id/fees', setPanelFees)

router.get('/panel-claims', listClaims)
router.patch('/panel-claims/:id/status', updateClaimStatus)
router.get('/panel-claims/aging', getClaimAging)

// ── FOMEMA ─────────────────────────────────────────────────────────────────────
router.get('/fomema/stats', getFomemaStats)
router.get('/fomema', listWorkers)
router.post('/fomema', createWorker)
router.get('/fomema/:id', getWorker)
router.patch('/fomema/:id', updateWorker)
router.post('/fomema/:id/exam', createExam)
router.patch('/fomema/exams/:examId', updateExam)
router.post('/fomema/exams/:examId/submit', submitToFomema)

// ── STAFF ──────────────────────────────────────────────────────────────────────
router.get('/staff', listStaff)
router.post('/staff', createStaff)
router.get('/staff/:id', getStaffMember)
router.patch('/staff/:id', updateStaff)
router.delete('/staff/:id', deactivateStaff)

router.post('/attendance/clock-in', clockIn)
router.post('/attendance/clock-out', clockOut)
router.get('/attendance', getAttendance)

router.get('/leaves', listLeaves)
router.post('/leaves', applyLeave)
router.patch('/leaves/:id/status', updateLeaveStatus)

// ── PAYROLL ────────────────────────────────────────────────────────────────────
router.get('/payroll', listPayrollRuns)
router.post('/payroll/generate', generatePayroll)
router.get('/payroll/:id', getPayrollRun)
router.post('/payroll/:id/approve', approvePayroll)
router.get('/payroll/:runId/payslip/:staffId', getPayslip)

// ── PACKAGES ───────────────────────────────────────────────────────────────────
router.get('/package-plans', listPlans)
router.post('/package-plans', createPlan)
router.patch('/package-plans/:id', updatePlan)
router.get('/package-plans/stats', getPackageStats)

router.post('/patient-packages', sellPackage)
router.post('/patient-packages/:id/redeem', redeemSession)

// ── LOYALTY ────────────────────────────────────────────────────────────────────
router.get('/loyalty/rewards', listRewards)
router.post('/loyalty/rewards', createReward)
router.post('/loyalty/earn', earnPoints)
router.post('/loyalty/redeem', redeemPoints)
router.get('/loyalty/transactions', getTransactions)

// ── EXPENSES ───────────────────────────────────────────────────────────────────
router.get('/expenses', listExpenses)
router.post('/expenses', createExpense)
router.patch('/expenses/:id', updateExpense)
router.delete('/expenses/:id', deleteExpense)
router.get('/expense-categories', listCategories)
router.get('/expenses/summary', getExpenseSummary)
router.get('/expenses/profit-loss', getProfitLoss)

// ── TELEMEDICINE ───────────────────────────────────────────────────────────────
router.get('/video-rooms', listVideoRooms)
router.post('/video-rooms', createVideoRoom)
router.post('/video-rooms/:id/start', startRoom)
router.post('/video-rooms/:id/end', endRoom)
router.post('/video-rooms/:id/send-link', sendRoomLink)

// ── REPORTS ────────────────────────────────────────────────────────────────────
router.get('/reports/revenue', getRevenueReport)
router.get('/reports/appointments', getAppointmentReport)
router.get('/reports/demographics', getDemographicsReport)
router.get('/reports/doctor-productivity', getDoctorProductivity)
router.get('/reports/diagnoses', getDiagnosisReport)
router.get('/reports/drug-usage', getDrugUsageReport)

// ── BRANCHES ───────────────────────────────────────────────────────────────────
router.get('/branches', listBranches)
router.post('/branches', createBranch)
router.patch('/branches/:id', updateBranch)

// ── SETTINGS ───────────────────────────────────────────────────────────────────
router.get('/settings', getSettings)
router.put('/settings/:key', updateSetting)
router.get('/settings/clinic-profile', getClinicProfile)
router.get('/settings/integrations', getIntegrationStatus)

export default router
