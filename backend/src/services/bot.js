/**
 * Conversation state machine — patients and doctors.
 *
 * Patients : fully structured menu flow. LLM used ONLY for rating interpretation.
 * Doctors  : recognised by phone number → see their own schedule, no LLM at all.
 */
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js'
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)
import { db } from '../config/database.js'
import { getAvailableSlots, getDoctorsForService, isValidFutureDate } from './slotManager.js'
import { pushAppointmentToCalendar, updateCalendarEvent, deleteCalendarEvent } from './googleCalendarPush.js'
import { notifyNewBooking, notifyCancellation, notifyReschedule } from './doctorNotifier.js'
import { interpretRating } from './ai.js'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

// ─── States ───────────────────────────────────────────────────────────────────

export const STATES = {
  // Patient states
  IDLE: 'IDLE',
  AWAITING_LANGUAGE: 'AWAITING_LANGUAGE',
  AWAITING_NAME: 'AWAITING_NAME',
  AWAITING_SERVICE: 'AWAITING_SERVICE',
  AWAITING_DOCTOR: 'AWAITING_DOCTOR',
  AWAITING_DATE: 'AWAITING_DATE',
  AWAITING_SLOT: 'AWAITING_SLOT',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
  BOOKED: 'BOOKED',
  RESCHEDULING_DATE: 'RESCHEDULING_DATE',
  RESCHEDULING_SLOT: 'RESCHEDULING_SLOT',
  AWAITING_RESCHEDULE_CONFIRMATION: 'AWAITING_RESCHEDULE_CONFIRMATION',
  AWAITING_CANCEL_CONFIRMATION: 'AWAITING_CANCEL_CONFIRMATION',
  AWAITING_RATING: 'AWAITING_RATING',
  FAQ_MENU: 'FAQ_MENU',
  ESCALATED: 'ESCALATED',
  // Doctor states
  DOCTOR_MENU: 'DOCTOR_MENU',
  DOCTOR_AWAITING_DATE: 'DOCTOR_AWAITING_DATE',
}

// ─── Message Templates ────────────────────────────────────────────────────────

export const T = {
  // Shown before language is known — all three languages in one message
  languageMenu: {
    en: () =>
      `Welcome to *${env.clinic.name}*! 👋\n\nPlease choose your language:\nSila pilih bahasa anda:\n请选择您的语言：\n\n1️⃣ English\n2️⃣ Bahasa Malaysia\n3️⃣ 中文 (Chinese)`,
  },

  mainMenu: {
    en: (name) => `Hi${name ? ` ${name}` : ''}! 👋 How can I help you today?\n\n1️⃣ Book an appointment\n2️⃣ My upcoming appointment\n3️⃣ Help / FAQ`,
    ms: (name) => `Hi${name ? ` ${name}` : ''}! 👋 Boleh saya bantu anda hari ini?\n\n1️⃣ Tempah temujanji\n2️⃣ Temujanji saya\n3️⃣ Bantuan / Soalan lazim`,
    zh: (name) => `您好${name ? `，${name}` : ''}！👋 今天有什么可以帮您？\n\n1️⃣ 预约挂号\n2️⃣ 我的预约\n3️⃣ 帮助 / 常见问题`,
  },

  askName: {
    en: () => `Great! May I know your full name?`,
    ms: () => `Baiklah! Boleh saya tahu nama penuh anda?`,
    zh: () => `好的！请问您的全名？`,
  },

  askService: {
    en: (name) => `Nice to meet you, ${name}! 😊\n\nWhich service do you need?\n\n1. General Consultation\n2. Follow Up\n3. Blood Test (Fasting)\n4. Blood Test (Non-fasting)\n5. FOMEMA\n6. FOMEMA X-Ray\n7. Health Screening\n8. Vaccination\n9. Antenatal / Postnatal\n10. Pap Smear\n11. Wound Care`,
    ms: (name) => `Selamat berkenalan, ${name}! 😊\n\nPerkhidmatan apa yang anda perlukan?\n\n1. Konsultasi Umum\n2. Susulan\n3. Ujian Darah (Berpuasa)\n4. Ujian Darah (Tidak Berpuasa)\n5. FOMEMA\n6. FOMEMA X-Ray\n7. Saringan Kesihatan\n8. Vaksinasi\n9. Antenatal / Postnatal\n10. Pap Smear\n11. Penjagaan Luka`,
    zh: (name) => `很高兴认识您，${name}！😊\n\n您需要哪项服务？\n\n1. 普通看诊\n2. 复诊\n3. 血液检验（空腹）\n4. 血液检验（非空腹）\n5. FOMEMA\n6. FOMEMA X光\n7. 健康检查\n8. 疫苗接种\n9. 产前/产后随访\n10. 子宫颈抹片\n11. 伤口护理`,
  },

  askDoctor: {
    en: (doctors) => `Which doctor do you prefer?\n\n${doctors.map((d, i) => `${i + 1}. ${d.name}`).join('\n')}\n${doctors.length + 1}. No preference`,
    ms: (doctors) => `Doktor mana yang anda pilih?\n\n${doctors.map((d, i) => `${i + 1}. ${d.name}`).join('\n')}\n${doctors.length + 1}. Tiada pilihan`,
    zh: (doctors) => `您希望选择哪位医生？\n\n${doctors.map((d, i) => `${i + 1}. ${d.name}`).join('\n')}\n${doctors.length + 1}. 无偏好`,
  },

  askDate: {
    en: () => `What date would you like?\n(e.g. *20 May* or *2026-05-20*)\n\n_Open: Mon–Sat 9AM–9PM, Sun 9AM–1PM_`,
    ms: () => `Tarikh apa yang anda inginkan?\n(cth: *20 Mei* atau *2026-05-20*)\n\n_Buka: Isnin–Sabtu 9PG–9PM, Ahad 9PG–1PM_`,
    zh: () => `您希望哪天预约？\n（如：*20 May* 或 *2026-05-20*）\n\n_营业：周一至周六 9AM–9PM，周日 9AM–1PM_`,
  },

  noSlots: {
    en: (date) => `Sorry, no available slots on *${date}*. Please try another date.`,
    ms: (date) => `Maaf, tiada slot tersedia pada *${date}*. Sila cuba tarikh lain.`,
    zh: (date) => `抱歉，*${date}* 没有可用时段，请选择其他日期。`,
  },

  askSlot: {
    en: (date, slots) => `Available slots on *${date}*:\n\n${slots.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nReply with a number.`,
    ms: (date, slots) => `Slot tersedia pada *${date}*:\n\n${slots.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nBalas dengan nombor.`,
    zh: (date, slots) => `*${date}* 可用时段：\n\n${slots.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n请回复序号。`,
  },

  confirmBooking: {
    en: (d) => `Please confirm your booking:\n\n👤 *${d.name}*\n🏥 ${d.service}\n👨‍⚕️ ${d.doctor}\n📅 ${d.date}\n⏰ ${d.time}\n\nReply *Yes* to confirm or *No* to cancel.`,
    ms: (d) => `Sila sahkan tempahan anda:\n\n👤 *${d.name}*\n🏥 ${d.service}\n👨‍⚕️ ${d.doctor}\n📅 ${d.date}\n⏰ ${d.time}\n\nBalas *Ya* untuk sahkan atau *Tidak* untuk batalkan.`,
    zh: (d) => `请确认您的预约：\n\n👤 *${d.name}*\n🏥 ${d.service}\n👨‍⚕️ ${d.doctor}\n📅 ${d.date}\n⏰ ${d.time}\n\n回复 *是* 确认，*否* 取消。`,
  },

  bookingConfirmed: {
    en: (d) => `✅ *Booking Confirmed!*\n\n👤 ${d.name}\n🏥 ${d.service}\n👨‍⚕️ ${d.doctor}\n📅 ${d.date}\n⏰ ${d.time}\n📍 ${env.clinic.name}\n\nSee you then! We'll remind you 24 hours before. 😊`,
    ms: (d) => `✅ *Tempahan Disahkan!*\n\n👤 ${d.name}\n🏥 ${d.service}\n👨‍⚕️ ${d.doctor}\n📅 ${d.date}\n⏰ ${d.time}\n📍 ${env.clinic.name}\n\nJumpa anda nanti! Kami akan mengingatkan 24 jam sebelum. 😊`,
    zh: (d) => `✅ *预约已确认！*\n\n👤 ${d.name}\n🏥 ${d.service}\n👨‍⚕️ ${d.doctor}\n📅 ${d.date}\n⏰ ${d.time}\n📍 ${env.clinic.name}\n\n期待见到您！我们将在24小时前提醒您。😊`,
  },

  bookedOptions: {
    en: (d) => `Your upcoming appointment:\n\n📅 ${d.date} at ${d.time}\n🏥 ${d.service}\n\nWhat would you like to do?\n\n1. Reschedule\n2. Cancel appointment\n3. Back to menu`,
    ms: (d) => `Temujanji anda yang akan datang:\n\n📅 ${d.date} pada ${d.time}\n🏥 ${d.service}\n\nApa yang ingin anda lakukan?\n\n1. Jadual semula\n2. Batalkan temujanji\n3. Kembali ke menu`,
    zh: (d) => `您的预约：\n\n📅 ${d.date} ${d.time}\n🏥 ${d.service}\n\n您想怎么做？\n\n1. 重新安排\n2. 取消预约\n3. 返回菜单`,
  },

  noUpcomingAppt: {
    en: () => `You don't have any upcoming appointments.\n\nReply *1* to book one now! 😊`,
    ms: () => `Anda tiada temujanji yang akan datang.\n\nBalas *1* untuk membuat tempahan sekarang! 😊`,
    zh: () => `您目前没有预约。\n\n回复 *1* 立即预约！😊`,
  },

  bookingCancelled: {
    en: () => `Booking cancelled. Feel free to book again anytime! 😊`,
    ms: () => `Tempahan dibatalkan. Jangan segan untuk menempah semula! 😊`,
    zh: () => `预约已取消。随时欢迎再次预约！😊`,
  },

  confirmCancel: {
    en: () => `Are you sure you want to cancel your appointment?\n\nReply *Yes* to confirm.`,
    ms: () => `Adakah anda pasti mahu membatalkan temujanji anda?\n\nBalas *Ya* untuk sahkan.`,
    zh: () => `您确定要取消预约吗？\n\n回复 *是* 确认。`,
  },

  appointmentCancelled: {
    en: () => `Your appointment has been cancelled. Hope to see you again soon! 💚`,
    ms: () => `Temujanji anda telah dibatalkan. Harap jumpa anda lagi! 💚`,
    zh: () => `您的预约已取消。希望很快再见到您！💚`,
  },

  askRescheduleDate: {
    en: () => `What new date would you like?`,
    ms: () => `Tarikh baru apa yang anda mahu?`,
    zh: () => `您希望改到哪天？`,
  },

  confirmReschedule: {
    en: (d) => `Confirm reschedule to:\n\n📅 *${d.date}* at *${d.time}*?\n\nReply *Yes* or *No*.`,
    ms: (d) => `Sahkan penjadualan semula ke:\n\n📅 *${d.date}* pada *${d.time}*?\n\nBalas *Ya* atau *Tidak*.`,
    zh: (d) => `确认改约至：\n\n📅 *${d.date}* ${d.time}？\n\n回复 *是* 或 *否*。`,
  },

  rescheduled: {
    en: (d) => `✅ Rescheduled! New appointment:\n📅 ${d.date} at ${d.time}\n\nSee you then! 😊`,
    ms: (d) => `✅ Dijadualkan semula! Temujanji baru:\n📅 ${d.date} pada ${d.time}\n\nJumpa anda nanti! 😊`,
    zh: (d) => `✅ 已重新安排！新预约：\n📅 ${d.date} ${d.time}\n\n期待见到您！😊`,
  },

  faqMenu: {
    en: () => `How can I help you? 😊\n\n1️⃣ Opening hours\n2️⃣ Location & directions\n3️⃣ Our services\n4️⃣ About appointments\n5️⃣ Talk to our staff\n\n0️⃣ Back to main menu`,
    ms: () => `Boleh saya bantu? 😊\n\n1️⃣ Waktu operasi\n2️⃣ Lokasi & arah\n3️⃣ Perkhidmatan kami\n4️⃣ Tentang temujanji\n5️⃣ Bercakap dengan staf\n\n0️⃣ Kembali ke menu utama`,
    zh: () => `有什么可以帮到您？😊\n\n1️⃣ 营业时间\n2️⃣ 地址及交通\n3️⃣ 我们的服务\n4️⃣ 关于预约\n5️⃣ 联系我们员工\n\n0️⃣ 返回主菜单`,
  },

  faqHours: {
    en: () => `🕐 *Opening Hours*\n\nMonday – Saturday: 9:00 AM – 9:00 PM\nSunday: 9:00 AM – 1:00 PM\nPublic Holidays: Closed\n\nWalk-ins welcome! 😊`,
    ms: () => `🕐 *Waktu Operasi*\n\nIsnin – Sabtu: 9:00 PG – 9:00 PM\nAhad: 9:00 PG – 1:00 PM\nCuti Umum: Tutup\n\nWalk-in dialu-alukan! 😊`,
    zh: () => `🕐 *营业时间*\n\n周一至周六：9:00 AM – 9:00 PM\n周日：9:00 AM – 1:00 PM\n公假：休息\n\n欢迎直接前来！😊`,
  },

  faqLocation: {
    en: () => `📍 *Location*\n\n${env.clinic.name}\nSetia Indah, Johor Bahru, Johor\n\nNeed directions? Feel free to ask us! 😊`,
    ms: () => `📍 *Lokasi*\n\n${env.clinic.name}\nSetia Indah, Johor Bahru, Johor\n\nPerlukan panduan arah? Jangan segan bertanya! 😊`,
    zh: () => `📍 *地址*\n\n${env.clinic.name}\nSetia Indah, Johor Bahru, Johor\n\n需要指引？随时告诉我们！😊`,
  },

  faqServices: {
    en: () => `🏥 *Our Services*\n\n• General Consultation\n• Follow Up\n• Blood Test (Fasting & Non-fasting)\n• FOMEMA & FOMEMA X-Ray\n• Health Screening\n• Vaccination\n• Antenatal / Postnatal\n• Pap Smear\n• Wound Care\n\nFor pricing, please visit the clinic or call us directly.`,
    ms: () => `🏥 *Perkhidmatan Kami*\n\n• Konsultasi Umum\n• Susulan\n• Ujian Darah (Berpuasa & Tidak Berpuasa)\n• FOMEMA & FOMEMA X-Ray\n• Saringan Kesihatan\n• Vaksinasi\n• Antenatal / Postnatal\n• Pap Smear\n• Penjagaan Luka\n\nUntuk harga, sila lawati klinik atau hubungi kami.`,
    zh: () => `🏥 *我们的服务*\n\n• 普通看诊\n• 复诊\n• 血液检验（空腹/非空腹）\n• FOMEMA及X光\n• 健康检查\n• 疫苗接种\n• 产前/产后随访\n• 子宫颈抹片\n• 伤口护理\n\n如需了解收费，请亲临诊所或致电咨询。`,
  },

  faqAppointments: {
    en: () => `📅 *Appointments*\n\n• Book anytime via this WhatsApp chat\n• Reminders sent 24h & 1h before your visit\n• Reschedule or cancel by messaging us here\n• Walk-ins also welcome (subject to availability)`,
    ms: () => `📅 *Temujanji*\n\n• Tempah bila-bila masa melalui WhatsApp ini\n• Peringatan dihantar 24j & 1j sebelum kunjungan\n• Jadual semula atau batal dengan mesej kami di sini\n• Walk-in juga dialu-alukan (tertakluk kepada ketersediaan)`,
    zh: () => `📅 *预约信息*\n\n• 随时通过此WhatsApp预约\n• 提前24小时及1小时发送提醒\n• 改期或取消请直接发消息\n• 也欢迎直接来诊（视情况而定）`,
  },

  escalateToStaff: {
    en: () => `Got it! 😊 Our staff will reach out to you shortly.\n\nFor urgent matters, you can also call the clinic directly.`,
    ms: () => `Baiklah! 😊 Staf kami akan menghubungi anda tidak lama lagi.\n\nUntuk perkara segera, anda boleh menghubungi klinik terus.`,
    zh: () => `好的！😊 我们的员工将很快与您联系。\n\n如有紧急事务，您也可以直接致电诊所。`,
  },

  followUp: {
    en: (name) => `Hi ${name}! 🌸 Hope you're feeling better after today's visit.\n\nHow was your experience with us?\n\n⭐⭐⭐⭐⭐ *Excellent*\n⭐⭐⭐ *Okay*\n⭐ *Not great*`,
    ms: (name) => `Hi ${name}! 🌸 Semoga anda berasa lebih baik selepas lawatan hari ini.\n\nBagaimana pengalaman anda bersama kami?\n\n⭐⭐⭐⭐⭐ *Cemerlang*\n⭐⭐⭐ *Baik*\n⭐ *Kurang memuaskan*`,
    zh: (name) => `您好，${name}！🌸 希望您今天就诊后好多了。\n\n您对我们的服务满意吗？\n\n⭐⭐⭐⭐⭐ *非常满意*\n⭐⭐⭐ *一般*\n⭐ *不满意*`,
  },

  reviewRequest: {
    en: () => `Yay! 🎉 Thank you so much! Would you mind sharing your experience on Google? It really helps us! 💚\n\n${env.clinic.googleReviewLink}`,
    ms: () => `Wah! 🎉 Terima kasih banyak-banyak! Boleh kongsi pengalaman anda di Google? Ia sangat membantu kami! 💚\n\n${env.clinic.googleReviewLink}`,
    zh: () => `太棒了！🎉 非常感谢！您介意在Google上分享您的体验吗？这对我们很有帮助！💚\n\n${env.clinic.googleReviewLink}`,
  },

  escalateMessage: {
    en: () => `We're really sorry to hear that 🙏 Your feedback means a lot to us.\n\nOur team will reach out to you shortly to make things right.`,
    ms: () => `Kami benar-benar minta maaf 🙏 Maklum balas anda sangat bermakna bagi kami.\n\nPasukan kami akan menghubungi anda tidak lama lagi.`,
    zh: () => `我们非常抱歉 🙏 您的反馈对我们非常重要。\n\n我们的团队将很快与您联系，尽力改善。`,
  },

  reminder24h: {
    en: (d) => `🔔 *Reminder* — Hi ${d.name}!\n\nYour appointment is *tomorrow*:\n📅 ${d.date} at ${d.time}\n📍 ${env.clinic.name}\n\nPlease arrive 10 mins early.\n\n✅ I'll be there\n🔄 Reschedule\n❌ Cancel`,
    ms: (d) => `🔔 *Peringatan* — Hi ${d.name}!\n\nTemujanji anda adalah *esok*:\n📅 ${d.date} pada ${d.time}\n📍 ${env.clinic.name}\n\nSila tiba 10 minit lebih awal.\n\n✅ Saya akan hadir\n🔄 Jadual semula\n❌ Batalkan`,
    zh: (d) => `🔔 *提醒* — 您好，${d.name}！\n\n您的预约是*明天*：\n📅 ${d.date} ${d.time}\n📍 ${env.clinic.name}\n\n请提前10分钟到达。\n\n✅ 我会去\n🔄 重新安排\n❌ 取消`,
  },

  reminder1h: {
    en: (d) => `⏰ Your appointment is in *1 hour* (${d.time} today).\nSee you soon at ${env.clinic.name}! 🏥`,
    ms: (d) => `⏰ Temujanji anda dalam *1 jam* (${d.time} hari ini).\nJumpa anda nanti di ${env.clinic.name}! 🏥`,
    zh: (d) => `⏰ 您的预约还有 *1小时*（今天 ${d.time}）。\n很快在 ${env.clinic.name} 见！🏥`,
  },

  invalidInput: {
    en: () => `Sorry, I didn't get that. Please reply with a number from the options above.`,
    ms: () => `Maaf, saya tidak faham itu. Sila balas dengan nombor dari pilihan di atas.`,
    zh: () => `抱歉，我不明白。请回复上面选项中的数字。`,
  },

  escalatedReply: {
    en: () => `Our staff is looking into your case and will be in touch shortly. 🙏`,
    ms: () => `Staf kami sedang menangani kes anda dan akan menghubungi anda tidak lama lagi. 🙏`,
    zh: () => `我们的员工正在处理您的问题，将很快与您联系。🙏`,
  },
}

export function t(key, lang, ...args) {
  const fn = T[key]?.[lang] || T[key]?.['en']
  return fn ? fn(...args) : ''
}

// ─── Services ─────────────────────────────────────────────────────────────────

const SERVICES = [
  'General Consultation',
  'Follow Up',
  'Blood Test (Fasting)',
  'Blood Test (Non-fasting)',
  'FOMEMA',
  'FOMEMA X-Ray',
  'Health Screening',
  'Vaccination',
  'Antenatal / Postnatal',
  'Pap Smear',
  'Wound Care',
]

function parseServiceSelection(text) {
  const n = parseInt(text)
  if (!isNaN(n) && n >= 1 && n <= SERVICES.length) return SERVICES[n - 1]
  const lower = text.toLowerCase()
  return SERVICES.find((s) => lower.includes(s.toLowerCase().split(' ')[0])) || null
}

async function getServiceIdByName(name) {
  const { data } = await db.from('services').select('id').eq('name', name).single()
  return data?.id || null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(text) {
  const t = text.trim()
  const year = dayjs().year()
  const attempts = [
    [t,              'YYYY-MM-DD'],
    [t,              'DD/MM/YYYY'],
    [t,              'D/M/YYYY'],
    [t,              'D MMM YYYY'],
    [t,              'D MMMM YYYY'],
    [`${t} ${year}`, 'D MMM YYYY'],
    [`${t} ${year}`, 'D MMMM YYYY'],
    [`${t} ${year}`, 'DD MMM YYYY'],
  ]
  for (const [str, fmt] of attempts) {
    const d = dayjs(str, fmt, true)
    if (d.isValid()) {
      return (d.isBefore(dayjs(), 'day') ? d.add(1, 'year') : d).format('YYYY-MM-DD')
    }
  }
  return null
}

function parseSlotSelection(text, slots) {
  const n = parseInt(text)
  if (!isNaN(n) && n >= 1 && n <= slots.length) return slots[n - 1]
  return slots.find((s) => s === text.replace('.', ':')) || null
}

function isYes(text, lang) {
  const yes = { en: ['yes', 'y', 'ok', 'confirm', 'sure'], ms: ['ya', 'ye', 'ok', 'sahkan'], zh: ['是', '好', 'yes', 'ok'] }
  const lower = text.toLowerCase()
  return (yes[lang] || yes.en).some((w) => lower.includes(w))
}

function isNo(text, lang) {
  const no = { en: ['no', 'n', 'cancel', 'nope'], ms: ['tidak', 'tak', 'cancel', 'batal'], zh: ['否', '不', 'no'] }
  const lower = text.toLowerCase()
  return (no[lang] || no.en).some((w) => lower.includes(w))
}

// Keyword-based rating — LLM only called when this returns null
function parseRatingKeywords(text) {
  const lower = text.toLowerCase()
  const positive = ['excellent', 'cemerlang', '非常满意', 'great', 'good', 'bagus', 'best', 'amazing', 'love', 'perfect', '5', 'five', '⭐⭐⭐⭐⭐']
  const negative = ['not great', 'kurang', '不满意', 'bad', 'poor', 'terrible', 'awful', 'disappoint', 'worst', '1', 'one star']
  const neutral = ['okay', 'ok', 'baik', '一般', 'fine', 'alright', 'average', '3', '⭐⭐⭐']
  if (positive.some((k) => lower.includes(k))) return 'positive'
  if (negative.some((k) => lower.includes(k))) return 'negative'
  if (neutral.some((k) => lower.includes(k))) return 'neutral'
  return null
}

// ─── Conversation helpers ─────────────────────────────────────────────────────

async function updateConversation(phone, updates) {
  await db.from('conversations').update({ ...updates, updated_at: new Date() }).eq('phone', phone)
}

async function getUpcomingAppointment(patientId) {
  const { data } = await db
    .from('appointments')
    .select('id, doctor_id, google_event_id, appointment_date, appointment_time, service_id, services(name)')
    .eq('patient_id', patientId)
    .eq('status', 'upcoming')
    .gte('appointment_date', dayjs().format('YYYY-MM-DD'))
    .order('appointment_date', { ascending: true })
    .limit(1)
    .single()
  return data
}

async function createAppointment({ patientId, serviceId, doctorId, date, time, patientName, patientPhone, serviceName }) {
  const { data } = await db
    .from('appointments')
    .insert({ patient_id: patientId, service_id: serviceId, doctor_id: doctorId || null, appointment_date: date, appointment_time: time, status: 'upcoming' })
    .select()
    .single()

  // Push to doctor's Google Calendar (non-fatal)
  if (doctorId) {
    const { data: doctor } = await db.from('doctors').select('google_calendar_id, name').eq('id', doctorId).single()
    if (doctor?.google_calendar_id) {
      const eventId = await pushAppointmentToCalendar({ calendarId: doctor.google_calendar_id, patientName, serviceName, dateStr: date, timeStr: time, patientPhone, bookingId: data.id.slice(0, 8).toUpperCase() })
      if (eventId) await db.from('appointments').update({ google_event_id: eventId }).eq('id', data.id)
    }
    await notifyNewBooking({ doctorId, appointmentId: data.id, patientName, serviceName, dateStr: date, timeStr: time, bookingId: data.id.slice(0, 8).toUpperCase() }).catch(() => {})
  }

  // Schedule patient reminders + follow-up
  const dt = dayjs(`${date}T${time}`)
  await db.from('reminders').insert([
    { appointment_id: data.id, type: '24h', scheduled_at: dt.subtract(24, 'hour').toISOString() },
    { appointment_id: data.id, type: '1h', scheduled_at: dt.subtract(1, 'hour').toISOString() },
  ])
  await db.from('follow_ups').insert({ appointment_id: data.id, scheduled_at: dt.add(2, 'hour').toISOString() })

  return data
}

// ─── Doctor flow ──────────────────────────────────────────────────────────────

async function getDoctorByPhone(phone) {
  const { data } = await db.from('doctors').select('*').eq('whatsapp_phone', phone).eq('active', true).single()
  return data || null
}

async function getDoctorDaySchedule(doctorId, dateStr) {
  const { data } = await db
    .from('appointments')
    .select('appointment_time, patients(name), services(name)')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', dateStr)
    .eq('status', 'upcoming')
    .order('appointment_time', { ascending: true })
  return data || []
}

async function getDoctorWeekSchedule(doctorId) {
  // Mon to Sun of current week
  const today = dayjs()
  const monday = today.startOf('week').add(1, 'day')
  const sunday = monday.add(6, 'day')
  const { data } = await db
    .from('appointments')
    .select('appointment_date, appointment_time, patients(name), services(name)')
    .eq('doctor_id', doctorId)
    .gte('appointment_date', monday.format('YYYY-MM-DD'))
    .lte('appointment_date', sunday.format('YYYY-MM-DD'))
    .eq('status', 'upcoming')
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
  return data || []
}

function formatDaySchedule(doctor, dateStr, appointments) {
  const shortName = `Dr. ${doctor.name.replace(/Dr\.\s*/i, '').split(' ')[0]}`
  const dateLabel = dayjs(dateStr).format('ddd, D MMM YYYY')
  const isToday = dayjs(dateStr).isSame(dayjs(), 'day')
  const dayWord = isToday ? 'today' : dayjs(dateStr).format('dddd')

  const header = `👨‍⚕️ Hi ${shortName}!\n\n`

  if (!appointments.length) {
    return `${header}No appointments ${dayWord} (*${dateLabel}*). Enjoy the day! 😊\n\n${DOCTOR_MENU}`
  }

  const list = appointments
    .map((a, i) => `${i + 1}. *${a.appointment_time.slice(0, 5)}* — ${a.patients?.name || 'Unknown'}\n   ${a.services?.name || ''}`)
    .join('\n\n')

  return `${header}Your schedule for *${dateLabel}*:\n\n${list}\n\nTotal: *${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}*\n\n─────────────────\n${DOCTOR_MENU}`
}

function formatWeekSchedule(doctor, appointments) {
  const shortName = `Dr. ${doctor.name.replace(/Dr\.\s*/i, '').split(' ')[0]}`
  const today = dayjs()
  const monday = today.startOf('week').add(1, 'day')
  const sunday = monday.add(6, 'day')

  if (!appointments.length) {
    return `👨‍⚕️ Hi ${shortName}!\n\nNo appointments this week (${monday.format('D MMM')} – ${sunday.format('D MMM')}). 😊\n\n─────────────────\n${DOCTOR_MENU}`
  }

  // Group by date
  const byDate = {}
  for (const a of appointments) {
    if (!byDate[a.appointment_date]) byDate[a.appointment_date] = []
    byDate[a.appointment_date].push(a)
  }

  const lines = Object.entries(byDate).map(([date, appts]) => {
    const dayLabel = dayjs(date).format('ddd D MMM')
    return `*${dayLabel}* (${appts.length} appt${appts.length !== 1 ? 's' : ''})\n` +
      appts.map((a) => `  • ${a.appointment_time.slice(0, 5)} — ${a.patients?.name || 'Unknown'}`).join('\n')
  })

  return `👨‍⚕️ Hi ${shortName}!\n\nThis week (${monday.format('D MMM')} – ${sunday.format('D MMM')}):\n\n${lines.join('\n\n')}\n\nTotal: *${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}*\n\n─────────────────\n${DOCTOR_MENU}`
}

const DOCTOR_MENU = `1️⃣ Today's schedule\n2️⃣ Tomorrow\n3️⃣ This week\n4️⃣ Specific date`

async function getOrCreateDoctorConversation(phone, doctorId) {
  const { data: existing } = await db.from('conversations').select('*').eq('phone', phone).single()
  if (existing) return existing

  const { data } = await db
    .from('conversations')
    .insert({ phone, doctor_id: doctorId, patient_id: null, state: STATES.DOCTOR_MENU })
    .select()
    .single()
  return data
}

async function handleDoctorFlow(doctor, phone, text) {
  const conv = await getOrCreateDoctorConversation(phone, doctor.id)

  // Waiting for a specific date
  if (conv.state === STATES.DOCTOR_AWAITING_DATE) {
    const dateStr = parseDate(text)
    if (!dateStr) {
      return `Invalid date. Please reply with a date like *20 May* or *2026-05-20*`
    }
    await updateConversation(phone, { state: STATES.DOCTOR_MENU })
    const appts = await getDoctorDaySchedule(doctor.id, dateStr)
    return formatDaySchedule(doctor, dateStr, appts)
  }

  const n = text.trim()

  if (n === '1') {
    const appts = await getDoctorDaySchedule(doctor.id, dayjs().format('YYYY-MM-DD'))
    return formatDaySchedule(doctor, dayjs().format('YYYY-MM-DD'), appts)
  }

  if (n === '2') {
    const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
    const appts = await getDoctorDaySchedule(doctor.id, tomorrow)
    return formatDaySchedule(doctor, tomorrow, appts)
  }

  if (n === '3') {
    const appts = await getDoctorWeekSchedule(doctor.id)
    return formatWeekSchedule(doctor, appts)
  }

  if (n === '4') {
    await updateConversation(phone, { state: STATES.DOCTOR_AWAITING_DATE })
    return `Which date would you like to check?\n(e.g. *20 May* or *2026-05-20*)`
  }

  // Default: show today's schedule + menu
  await updateConversation(phone, { state: STATES.DOCTOR_MENU })
  const appts = await getDoctorDaySchedule(doctor.id, dayjs().format('YYYY-MM-DD'))
  return formatDaySchedule(doctor, dayjs().format('YYYY-MM-DD'), appts)
}

// ─── Patient state handlers ───────────────────────────────────────────────────

async function getOrCreatePatientConversation(phone) {
  const { data: existing } = await db
    .from('conversations')
    .select('*, patients(name, language)')
    .eq('phone', phone)
    .single()
  if (existing) return existing

  const { data: patient } = await db.from('patients').insert({ phone }).select().single()
  const { data: conv } = await db
    .from('conversations')
    .insert({ phone, patient_id: patient.id, state: STATES.IDLE })
    .select('*, patients(name, language)')
    .single()
  return conv
}

async function handleIdle(conv, text) {
  const lang = conv.patients?.language
  const name = conv.patients?.name

  // New patient — no language selected yet
  if (!lang || lang === 'en' && !name) {
    // Check if they're selecting a language (might already be in AWAITING_LANGUAGE somehow)
    await updateConversation(conv.phone, { state: STATES.AWAITING_LANGUAGE })
    return { reply: t('languageMenu', 'en'), nextState: STATES.AWAITING_LANGUAGE }
  }

  const n = text.trim()

  if (n === '1') {
    if (name) {
      await updateConversation(conv.phone, { state: STATES.AWAITING_SERVICE })
      return { reply: t('askService', lang, name), nextState: STATES.AWAITING_SERVICE }
    }
    await updateConversation(conv.phone, { state: STATES.AWAITING_NAME })
    return { reply: t('askName', lang), nextState: STATES.AWAITING_NAME }
  }

  if (n === '2') {
    const appt = await getUpcomingAppointment(conv.patient_id)
    if (!appt) return { reply: t('noUpcomingAppt', lang), nextState: STATES.IDLE }
    await updateConversation(conv.phone, { state: STATES.BOOKED })
    return {
      reply: t('bookedOptions', lang, {
        date: dayjs(appt.appointment_date).format('D MMM YYYY'),
        time: appt.appointment_time.slice(0, 5),
        service: appt.services?.name || '',
      }),
      nextState: STATES.BOOKED,
    }
  }

  if (n === '3') {
    await updateConversation(conv.phone, { state: STATES.FAQ_MENU })
    return { reply: t('faqMenu', lang), nextState: STATES.FAQ_MENU }
  }

  // Any other message → show main menu
  return { reply: t('mainMenu', lang, name), nextState: STATES.IDLE }
}

async function handleAwaitingLanguage(conv, text) {
  const n = text.trim()
  let lang = null

  if (n === '1') lang = 'en'
  else if (n === '2') lang = 'ms'
  else if (n === '3') lang = 'zh'
  else if (/english|eng/i.test(text)) lang = 'en'
  else if (/malay|melayu|bm/i.test(text)) lang = 'ms'
  else if (/中文|华语|chinese|mandarin/i.test(text)) lang = 'zh'
  else return { reply: t('languageMenu', 'en'), nextState: STATES.AWAITING_LANGUAGE }

  await db.from('patients').update({ language: lang }).eq('id', conv.patient_id)
  await updateConversation(conv.phone, { state: STATES.AWAITING_NAME })
  return { reply: t('askName', lang), nextState: STATES.AWAITING_NAME }
}

async function handleAwaitingName(conv, text) {
  const lang = conv.patients?.language || 'en'
  const name = text.trim()
  if (name.length < 2 || name.length > 60) return { reply: t('invalidInput', lang), nextState: STATES.AWAITING_NAME }

  await db.from('patients').update({ name }).eq('id', conv.patient_id)
  await updateConversation(conv.phone, { state: STATES.AWAITING_SERVICE, pending_name: name })
  return { reply: t('askService', lang, name), nextState: STATES.AWAITING_SERVICE }
}

async function handleAwaitingService(conv, text) {
  const lang = conv.patients?.language || 'en'
  const name = conv.pending_name || conv.patients?.name || ''
  const serviceName = parseServiceSelection(text)

  if (!serviceName) {
    return { reply: t('invalidInput', lang) + '\n\n' + t('askService', lang, name), nextState: STATES.AWAITING_SERVICE }
  }

  const serviceId = await getServiceIdByName(serviceName)
  const doctors = await getDoctorsForService(serviceId)

  await updateConversation(conv.phone, {
    state: STATES.AWAITING_DOCTOR,
    pending_service_id: serviceId,
    pending_eligible_doctors: JSON.stringify(doctors.map((d) => ({ id: d.id, name: d.name }))),
  })

  return { reply: t('askDoctor', lang, doctors), nextState: STATES.AWAITING_DOCTOR }
}

async function handleAwaitingDoctor(conv, text) {
  const lang = conv.patients?.language || 'en'
  const doctors = JSON.parse(conv.pending_eligible_doctors || '[]')
  const n = parseInt(text)
  const noPreference = n === doctors.length + 1 || /no|any|tak kisah|无偏好/i.test(text)

  let doctorId = null
  if (!noPreference) {
    if (!isNaN(n) && n >= 1 && n <= doctors.length) {
      doctorId = doctors[n - 1].id
    } else {
      const lower = text.toLowerCase()
      const matched = doctors.find((d) => d.name.toLowerCase().includes(lower.split(' ').pop()))
      if (matched) doctorId = matched.id
      else return { reply: t('invalidInput', lang) + '\n\n' + t('askDoctor', lang, doctors), nextState: STATES.AWAITING_DOCTOR }
    }
  }

  await updateConversation(conv.phone, { state: STATES.AWAITING_DATE, pending_doctor_id: doctorId })
  return { reply: t('askDate', lang), nextState: STATES.AWAITING_DATE }
}

async function handleAwaitingDate(conv, text, isReschedule = false) {
  const lang = conv.patients?.language || 'en'
  const dateStr = parseDate(text)

  if (!dateStr || !isValidFutureDate(dateStr)) {
    return { reply: t('invalidInput', lang) + '\n\n' + t('askDate', lang), nextState: conv.state }
  }

  const slots = await getAvailableSlots(dateStr, conv.pending_doctor_id || null)
  if (!slots.length) {
    return { reply: t('noSlots', lang, dayjs(dateStr).format('D MMM YYYY')), nextState: conv.state }
  }

  const nextState = isReschedule ? STATES.RESCHEDULING_SLOT : STATES.AWAITING_SLOT
  await updateConversation(conv.phone, { state: nextState, pending_date: dateStr })
  return { reply: t('askSlot', lang, dayjs(dateStr).format('D MMM YYYY'), slots), nextState }
}

async function handleAwaitingSlot(conv, text, isReschedule = false) {
  const lang = conv.patients?.language || 'en'
  const slots = await getAvailableSlots(conv.pending_date, conv.pending_doctor_id || null)
  const slot = parseSlotSelection(text, slots)

  if (!slot) return { reply: t('askSlot', lang, dayjs(conv.pending_date).format('D MMM YYYY'), slots), nextState: conv.state }

  const nextState = isReschedule ? STATES.AWAITING_RESCHEDULE_CONFIRMATION : STATES.AWAITING_CONFIRMATION
  await updateConversation(conv.phone, { state: nextState, pending_time: slot })

  const { data: service } = await db.from('services').select('name').eq('id', conv.pending_service_id).single()
  const { data: doctor } = conv.pending_doctor_id
    ? await db.from('doctors').select('name').eq('id', conv.pending_doctor_id).single()
    : { data: null }

  const d = {
    name: conv.pending_name || conv.patients?.name || '',
    service: service?.name || '',
    doctor: doctor?.name || 'Any available doctor',
    date: dayjs(conv.pending_date).format('D MMM YYYY'),
    time: slot,
  }
  return { reply: isReschedule ? t('confirmReschedule', lang, d) : t('confirmBooking', lang, d), nextState }
}

async function handleAwaitingConfirmation(conv, text) {
  const lang = conv.patients?.language || 'en'

  if (isYes(text, lang)) {
    const { data: service } = await db.from('services').select('name').eq('id', conv.pending_service_id).single()
    const { data: doctor } = conv.pending_doctor_id
      ? await db.from('doctors').select('name').eq('id', conv.pending_doctor_id).single()
      : { data: null }
    const patientName = conv.pending_name || conv.patients?.name || ''

    await createAppointment({
      patientId: conv.patient_id,
      serviceId: conv.pending_service_id,
      doctorId: conv.pending_doctor_id || null,
      date: conv.pending_date,
      time: conv.pending_time,
      patientName,
      patientPhone: conv.phone,
      serviceName: service?.name || '',
    })

    await updateConversation(conv.phone, { state: STATES.BOOKED, pending_name: null, pending_service_id: null, pending_date: null, pending_time: null, pending_doctor_id: null })

    return {
      reply: t('bookingConfirmed', lang, {
        name: patientName,
        service: service?.name || '',
        doctor: doctor?.name || 'Any available doctor',
        date: dayjs(conv.pending_date).format('D MMM YYYY'),
        time: conv.pending_time,
      }),
      nextState: STATES.BOOKED,
    }
  }

  if (isNo(text, lang)) {
    await updateConversation(conv.phone, { state: STATES.IDLE, pending_service_id: null, pending_date: null, pending_time: null })
    return { reply: t('bookingCancelled', lang), nextState: STATES.IDLE }
  }

  return { reply: t('invalidInput', lang), nextState: STATES.AWAITING_CONFIRMATION }
}

async function handleBooked(conv, text) {
  const lang = conv.patients?.language || 'en'
  const n = text.trim()
  const lower = text.toLowerCase()

  const isReschedule = n === '1' || /reschedule|jadual semula|重新/i.test(lower)
  const isCancel = n === '2' || /cancel|batal|取消/i.test(lower)
  const isBack = n === '3' || /menu|back|balik|返回/i.test(lower)

  if (isReschedule) {
    const appt = await getUpcomingAppointment(conv.patient_id)
    if (appt) await updateConversation(conv.phone, { rescheduling_appointment_id: appt.id })
    await updateConversation(conv.phone, { state: STATES.RESCHEDULING_DATE })
    return { reply: t('askRescheduleDate', lang), nextState: STATES.RESCHEDULING_DATE }
  }

  if (isCancel) {
    await updateConversation(conv.phone, { state: STATES.AWAITING_CANCEL_CONFIRMATION })
    return { reply: t('confirmCancel', lang), nextState: STATES.AWAITING_CANCEL_CONFIRMATION }
  }

  if (isBack) {
    await updateConversation(conv.phone, { state: STATES.IDLE })
    return { reply: t('mainMenu', lang, conv.patients?.name), nextState: STATES.IDLE }
  }

  // Default: show booked options
  const appt = await getUpcomingAppointment(conv.patient_id)
  if (!appt) {
    await updateConversation(conv.phone, { state: STATES.IDLE })
    return { reply: t('mainMenu', lang, conv.patients?.name), nextState: STATES.IDLE }
  }

  return {
    reply: t('bookedOptions', lang, {
      date: dayjs(appt.appointment_date).format('D MMM YYYY'),
      time: appt.appointment_time.slice(0, 5),
      service: appt.services?.name || '',
    }),
    nextState: STATES.BOOKED,
  }
}

async function handleAwaitingCancelConfirmation(conv, text) {
  const lang = conv.patients?.language || 'en'

  if (isYes(text, lang)) {
    const appt = await getUpcomingAppointment(conv.patient_id)
    if (appt) {
      if (appt.doctor_id && appt.google_event_id) {
        const { data: doctor } = await db.from('doctors').select('google_calendar_id').eq('id', appt.doctor_id).single()
        if (doctor?.google_calendar_id) {
          await deleteCalendarEvent({ calendarId: doctor.google_calendar_id, eventId: appt.google_event_id })
        }
        await notifyCancellation({
          doctorId: appt.doctor_id, appointmentId: appt.id,
          patientName: conv.patients?.name || '', serviceName: appt.services?.name || '',
          dateStr: appt.appointment_date, timeStr: appt.appointment_time,
        }).catch(() => {})
      }
      await db.from('appointments').update({ status: 'cancelled' }).eq('id', appt.id)
    }
    await updateConversation(conv.phone, { state: STATES.IDLE })
    return { reply: t('appointmentCancelled', lang), nextState: STATES.IDLE }
  }

  await updateConversation(conv.phone, { state: STATES.BOOKED })
  const appt = await getUpcomingAppointment(conv.patient_id)
  return {
    reply: appt
      ? t('bookedOptions', lang, { date: dayjs(appt.appointment_date).format('D MMM YYYY'), time: appt.appointment_time.slice(0, 5), service: appt.services?.name || '' })
      : t('mainMenu', lang, conv.patients?.name),
    nextState: STATES.BOOKED,
  }
}

async function handleReschedulingDate(conv, text) {
  return handleAwaitingDate(conv, text, true)
}

async function handleReschedulingSlot(conv, text) {
  return handleAwaitingSlot(conv, text, true)
}

async function handleAwaitingRescheduleConfirmation(conv, text) {
  const lang = conv.patients?.language || 'en'

  if (isYes(text, lang)) {
    const { data: service } = await db.from('services').select('name').eq('id', conv.pending_service_id).single()
    const apptId = conv.rescheduling_appointment_id

    if (apptId) {
      const { data: oldAppt } = await db.from('appointments').select('doctor_id, google_event_id, appointment_date, appointment_time').eq('id', apptId).single()

      if (oldAppt?.doctor_id) {
        const { data: doctor } = await db.from('doctors').select('google_calendar_id').eq('id', oldAppt.doctor_id).single()
        if (doctor?.google_calendar_id && oldAppt.google_event_id) {
          await updateCalendarEvent({ calendarId: doctor.google_calendar_id, eventId: oldAppt.google_event_id, dateStr: conv.pending_date, timeStr: conv.pending_time })
        }
        await notifyReschedule({
          doctorId: oldAppt.doctor_id, appointmentId: apptId,
          patientName: conv.patients?.name || '', serviceName: service?.name || '',
          oldDateStr: oldAppt.appointment_date, oldTimeStr: oldAppt.appointment_time,
          newDateStr: conv.pending_date, newTimeStr: conv.pending_time,
        }).catch(() => {})
      }

      await db.from('appointments').update({ appointment_date: conv.pending_date, appointment_time: conv.pending_time, status: 'upcoming' }).eq('id', apptId)
      await db.from('reminders').delete().eq('appointment_id', apptId)
      const dt = dayjs(`${conv.pending_date}T${conv.pending_time}`)
      await db.from('reminders').insert([
        { appointment_id: apptId, type: '24h', scheduled_at: dt.subtract(24, 'hour').toISOString() },
        { appointment_id: apptId, type: '1h', scheduled_at: dt.subtract(1, 'hour').toISOString() },
      ])
    }

    await updateConversation(conv.phone, { state: STATES.BOOKED, pending_date: null, pending_time: null, rescheduling_appointment_id: null })
    return { reply: t('rescheduled', lang, { date: dayjs(conv.pending_date).format('D MMM YYYY'), time: conv.pending_time }), nextState: STATES.BOOKED }
  }

  await updateConversation(conv.phone, { state: STATES.BOOKED })
  return { reply: t('mainMenu', lang, conv.patients?.name), nextState: STATES.BOOKED }
}

async function handleFaqMenu(conv, text) {
  const lang = conv.patients?.language || 'en'
  const n = text.trim()

  const replies = {
    '1': t('faqHours', lang),
    '2': t('faqLocation', lang),
    '3': t('faqServices', lang),
    '4': t('faqAppointments', lang),
    '0': t('mainMenu', lang, conv.patients?.name),
  }

  if (n === '5') {
    await db.from('escalations').insert({ phone: conv.phone, patient_id: conv.patient_id, reason: 'staff_request' }).catch(() => {})
    await updateConversation(conv.phone, { state: STATES.IDLE })
    return { reply: t('escalateToStaff', lang), nextState: STATES.IDLE }
  }

  if (n === '0') {
    await updateConversation(conv.phone, { state: STATES.IDLE })
    return { reply: replies['0'], nextState: STATES.IDLE }
  }

  if (replies[n]) {
    return { reply: replies[n] + `\n\n─────────────────\n${t('faqMenu', lang)}`, nextState: STATES.FAQ_MENU }
  }

  return { reply: t('invalidInput', lang) + '\n\n' + t('faqMenu', lang), nextState: STATES.FAQ_MENU }
}

async function handleAwaitingRating(conv, text) {
  const lang = conv.patients?.language || 'en'

  // Keyword match first — no LLM cost
  let sentiment = parseRatingKeywords(text)

  // Only call Claude when keywords are inconclusive
  if (!sentiment) {
    sentiment = await interpretRating(text)
  }

  const { data: appt } = await db
    .from('appointments')
    .select('id')
    .eq('patient_id', conv.patient_id)
    .eq('status', 'completed')
    .order('appointment_date', { ascending: false })
    .limit(1)
    .single()

  const ratingMap = { positive: 'excellent', neutral: 'okay', negative: 'not_great' }
  if (appt) await db.from('follow_ups').update({ rating: ratingMap[sentiment] }).eq('appointment_id', appt.id)

  await updateConversation(conv.phone, { state: STATES.IDLE })

  if (sentiment === 'positive') {
    if (appt) await db.from('follow_ups').update({ review_sent: true }).eq('appointment_id', appt.id)
    return { reply: t('reviewRequest', lang), nextState: STATES.IDLE }
  }

  await db.from('escalations').insert({ phone: conv.phone, patient_id: conv.patient_id, reason: 'low_rating' }).catch(() => {})
  return { reply: t('escalateMessage', lang), nextState: STATES.IDLE }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function processMessage(phone, text) {
  await db.from('messages').insert({ phone, direction: 'inbound', body: text })

  // ── Doctor check first ──────────────────────────────────────────────────────
  const doctor = await getDoctorByPhone(phone)
  if (doctor) {
    logger.info('Doctor message', { name: doctor.name, text: text.slice(0, 60) })
    try {
      return await handleDoctorFlow(doctor, phone, text)
    } catch (err) {
      logger.error('Doctor flow error', { error: err.message })
      return `Sorry, something went wrong. Please try again.`
    }
  }

  // ── Patient flow ────────────────────────────────────────────────────────────
  const conv = await getOrCreatePatientConversation(phone)
  const lang = conv.patients?.language || 'en'

  logger.debug('Patient message', { phone, state: conv.state, text: text.slice(0, 60) })

  if (conv.is_escalated) return t('escalatedReply', lang)

  // Greeting resets to IDLE (for patients with language set) or AWAITING_LANGUAGE (new)
  const isGreeting = /^(hi|hello|hey|hai|helo|hii|yo|selamat|你好|您好|ola|assalamualaikum|salam)[\s!]*/i.test(text.trim())
  if (isGreeting && conv.state !== STATES.IDLE && conv.state !== STATES.AWAITING_LANGUAGE) {
    await updateConversation(conv.phone, { state: STATES.IDLE, pending_service_id: null, pending_date: null, pending_time: null })
    conv.state = STATES.IDLE
  }

  let result
  try {
    switch (conv.state) {
      case STATES.IDLE:                         result = await handleIdle(conv, text); break
      case STATES.AWAITING_LANGUAGE:            result = await handleAwaitingLanguage(conv, text); break
      case STATES.AWAITING_NAME:                result = await handleAwaitingName(conv, text); break
      case STATES.AWAITING_SERVICE:             result = await handleAwaitingService(conv, text); break
      case STATES.AWAITING_DOCTOR:              result = await handleAwaitingDoctor(conv, text); break
      case STATES.AWAITING_DATE:                result = await handleAwaitingDate(conv, text); break
      case STATES.AWAITING_SLOT:                result = await handleAwaitingSlot(conv, text); break
      case STATES.AWAITING_CONFIRMATION:        result = await handleAwaitingConfirmation(conv, text); break
      case STATES.BOOKED:                       result = await handleBooked(conv, text); break
      case STATES.AWAITING_CANCEL_CONFIRMATION: result = await handleAwaitingCancelConfirmation(conv, text); break
      case STATES.RESCHEDULING_DATE:            result = await handleReschedulingDate(conv, text); break
      case STATES.RESCHEDULING_SLOT:            result = await handleReschedulingSlot(conv, text); break
      case STATES.AWAITING_RESCHEDULE_CONFIRMATION: result = await handleAwaitingRescheduleConfirmation(conv, text); break
      case STATES.FAQ_MENU:                     result = await handleFaqMenu(conv, text); break
      case STATES.AWAITING_RATING:              result = await handleAwaitingRating(conv, text); break
      case STATES.ESCALATED:                    return t('escalatedReply', lang)
      default:
        await updateConversation(phone, { state: STATES.IDLE })
        result = await handleIdle(conv, text)
    }
  } catch (err) {
    logger.error('Bot error', { phone, state: conv.state, error: err.message })
    return t('invalidInput', lang)
  }

  return result?.reply || t('invalidInput', lang)
}
