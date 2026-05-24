import { Router } from 'express'
import { apiAuth } from '../middleware/auth.js'
import { listAppointments, getAppointment, updateAppointmentStatus, getMonthlyStats } from '../controllers/appointments.js'
import { listPatients, getPatient, updatePatient, deletePatient } from '../controllers/patients.js'
import { listConversations, getMessages, deleteConversation, resolveEscalation as resolveConvEscalation } from '../controllers/conversations.js'
import { listEscalations, resolveEscalation } from '../controllers/escalations.js'
import { getDashboardStats } from '../controllers/analytics.js'
import {
  listDoctors, getDoctor, createDoctor, updateDoctor, deleteDoctor,
  setDoctorServices, getDoctorAvailability, setDoctorAvailability,
  listBlockedSlots, createBlockedSlot, deleteBlockedSlot,
} from '../controllers/doctors.js'
import { listServices, createService, updateService, deleteService } from '../controllers/services.js'
import { sendAppointmentReminder, sendReviewRequest, broadcastMessage } from '../controllers/messaging.js'

const router = Router()
router.use(apiAuth)

// Appointments
router.get('/appointments', listAppointments)
router.get('/appointments/stats', getMonthlyStats)
router.get('/appointments/:id', getAppointment)
router.patch('/appointments/:id/status', updateAppointmentStatus)

// Patients
router.get('/patients', listPatients)
router.get('/patients/:id', getPatient)
router.patch('/patients/:id', updatePatient)
router.delete('/patients/:id', deletePatient)

// Conversations / chat history
router.get('/conversations', listConversations)
router.get('/conversations/:phone/messages', getMessages)
router.delete('/conversations/:phone', deleteConversation)
router.post('/conversations/:phone/resolve', resolveConvEscalation)

// Escalations
router.get('/escalations', listEscalations)
router.patch('/escalations/:id/resolve', resolveEscalation)

// Analytics
router.get('/analytics', getDashboardStats)

// Doctors
router.get('/doctors', listDoctors)
router.post('/doctors', createDoctor)
router.get('/doctors/:id', getDoctor)
router.patch('/doctors/:id', updateDoctor)
router.delete('/doctors/:id', deleteDoctor)
router.put('/doctors/:id/services', setDoctorServices)
router.get('/doctors/:id/availability', getDoctorAvailability)
router.put('/doctors/:id/availability', setDoctorAvailability)

// Blocked slots
router.get('/blocked-slots', listBlockedSlots)
router.post('/blocked-slots', createBlockedSlot)
router.delete('/blocked-slots/:id', deleteBlockedSlot)

// Services
router.get('/services', listServices)
router.post('/services', createService)
router.patch('/services/:id', updateService)
router.delete('/services/:id', deleteService)

// Messaging actions
router.post('/appointments/:id/send-reminder', sendAppointmentReminder)
router.post('/appointments/:id/send-review', sendReviewRequest)
router.post('/broadcast', broadcastMessage)

export default router
