import { db } from '../config/database.js'
import dayjs from 'dayjs'

export async function getDashboardStats(req, res) {
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD')
  const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD')
  const today = dayjs().format('YYYY-MM-DD')

  const [
    { data: appts },
    { count: totalPatients },
    { data: escalations },
    { data: reviews },
  ] = await Promise.all([
    db.from('appointments').select('status').gte('appointment_date', monthStart).lte('appointment_date', monthEnd),
    db.from('patients').select('*', { count: 'exact', head: true }),
    db.from('escalations').select('resolved').gte('created_at', monthStart),
    db.from('follow_ups').select('rating').gte('created_at', monthStart).not('rating', 'is', null),
  ])

  const apptStats = { upcoming: 0, completed: 0, cancelled: 0, no_show: 0 }
  for (const a of appts || []) apptStats[a.status] = (apptStats[a.status] || 0) + 1

  const reviewStats = { excellent: 0, okay: 0, not_great: 0 }
  for (const r of reviews || []) reviewStats[r.rating] = (reviewStats[r.rating] || 0) + 1

  const totalReviews = reviewStats.excellent + reviewStats.okay + reviewStats.not_great
  const positiveRate = totalReviews > 0 ? Math.round((reviewStats.excellent / totalReviews) * 100) : 0

  res.json({
    appointments: apptStats,
    totalPatients,
    escalations: {
      open: (escalations || []).filter((e) => !e.resolved).length,
      total: (escalations || []).length,
    },
    reviews: {
      ...reviewStats,
      positiveRate,
    },
    noShowRate: apptStats.completed + apptStats.no_show > 0
      ? Math.round((apptStats.no_show / (apptStats.completed + apptStats.no_show)) * 100)
      : 0,
  })
}
