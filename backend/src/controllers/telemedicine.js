import { db as supabase } from '../config/database.js'
import { sendMessage } from '../services/twilio.js'

function generateRoomName() {
  return `entrust-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export async function createVideoRoom(req, res) {
  const { appointment_id, consultation_id, patient_id, doctor_id, scheduled_at, notes } = req.body

  const roomName    = generateRoomName()
  const hostLink    = `https://meet.jit.si/${roomName}#config.startWithVideoMuted=false&userInfo.displayName=Doctor`
  const patientLink = `https://meet.jit.si/${roomName}#config.startWithVideoMuted=false&userInfo.displayName=Patient`

  const { data, error } = await supabase
    .from('video_rooms')
    .insert({ appointment_id: appointment_id || null, consultation_id: consultation_id || null, patient_id: patient_id || null, doctor_id: doctor_id || null, jitsi_room_name: roomName, host_link: hostLink, patient_link: patientLink, scheduled_at, notes, status: 'scheduled' })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Send WhatsApp link — look up patient from appointment or direct patient_id
  let patientInfo = null
  if (appointment_id) {
    const { data: appt } = await supabase.from('appointments').select('patients(phone, name)').eq('id', appointment_id).single()
    patientInfo = appt?.patients
  } else if (patient_id) {
    const { data: p } = await supabase.from('patients').select('phone, name').eq('id', patient_id).single()
    patientInfo = p
  }

  if (patientInfo?.phone) {
    await sendMessage(
      patientInfo.phone,
      `Hi ${patientInfo.name}, your telemedicine appointment link is ready:\n\n📹 Join here: ${patientLink}\n\nNo download needed — just click the link!`
    ).catch(() => {})
  }

  res.status(201).json(data)
}

export async function listVideoRooms(req, res) {
  const { status, date } = req.query
  let query = supabase
    .from('video_rooms')
    .select(`*, patients(name, phone), doctors(name), appointments(*, patients(name, phone), doctors(name))`)
    .order('scheduled_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (date)   query = query.gte('scheduled_at', `${date}T00:00:00`).lte('scheduled_at', `${date}T23:59:59`)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function startRoom(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('video_rooms')
    .update({ status: 'active', started_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function endRoom(req, res) {
  const { id } = req.params
  const { data, error } = await supabase
    .from('video_rooms')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}

export async function sendRoomLink(req, res) {
  const { id } = req.params
  const { data } = await supabase
    .from('video_rooms')
    .select(`*, patients(name, phone), appointments(*, patients(name, phone))`)
    .eq('id', id)
    .single()

  if (!data) return res.status(404).json({ error: 'Room not found' })
  const patient = data.patients || data.appointments?.patients
  if (!patient?.phone) return res.status(400).json({ error: 'No patient phone number' })

  await sendMessage(
    patient.phone,
    `Hi ${patient.name}, your telemedicine link:\n\n📹 ${data.patient_link}\n\nNo app download needed!`
  )

  res.json({ ok: true })
}
