const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const KEY = process.env.NEXT_PUBLIC_API_KEY || ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: { 'x-api-key': KEY, 'Content-Type': 'application/json', ...options.headers },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  analytics: () => request('/analytics'),
  appointments: (params = {}) => request('/appointments?' + new URLSearchParams(params)),
  appointmentStats: (params = {}) => request('/appointments/stats?' + new URLSearchParams(params)),
  updateAppointmentStatus: (id, status) => request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  patients: (params = {}) => request('/patients?' + new URLSearchParams(params)),
  patient: (id) => request(`/patients/${id}`),
  conversations: (params = {}) => request('/conversations?' + new URLSearchParams(params)),
  messages: (phone) => request(`/conversations/${encodeURIComponent(phone)}/messages`),
  sendMessage: async (phone, message) => {
    const res = await fetch(`${BASE}/webhook/send`, {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    })
    if (!res.ok) throw new Error(`Send failed ${res.status}`)
    return res.json()
  },
  sendReminder: (id) => request(`/appointments/${id}/send-reminder`, { method: 'POST' }),
  sendReview: (id) => request(`/appointments/${id}/send-review`, { method: 'POST' }),
  broadcast: (message, filter = {}) => request('/broadcast', { method: 'POST', body: JSON.stringify({ message, filter }) }),
  escalations: (params = {}) => request('/escalations?' + new URLSearchParams(params)),
  resolveEscalation: (id) => request(`/escalations/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolved_by: 'staff' }) }),
  doctors: () => request('/doctors'),
  createDoctor: (data) => request('/doctors', { method: 'POST', body: JSON.stringify(data) }),
  updateDoctor: (id, data) => request(`/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  doctorAvailability: (id) => request(`/doctors/${id}/availability`),
  setDoctorAvailability: (id, data) => request(`/doctors/${id}/availability`, { method: 'PUT', body: JSON.stringify(data) }),
  setDoctorServices: (id, data) => request(`/doctors/${id}/services`, { method: 'PUT', body: JSON.stringify(data) }),
  blockedSlots: (params = {}) => request('/blocked-slots?' + new URLSearchParams(params)),
  createBlockedSlot: (data) => request('/blocked-slots', { method: 'POST', body: JSON.stringify(data) }),
  deleteBlockedSlot: (id) => request(`/blocked-slots/${id}`, { method: 'DELETE' }),
  services: () => request('/services'),
  createService: (data) => request('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteService: (id) => request(`/services/${id}`, { method: 'DELETE' }),
}
