export const STATUS_MAP = {
  // Appointments / Queue
  upcoming:       'badge-blue',
  waiting:        'badge-yellow',
  calling:        'badge-yellow',
  in_consultation:'badge-teal',
  billing:        'badge-blue',
  completed:      'badge-green',
  done:           'badge-green',
  cancelled:      'badge-red',
  no_show:        'badge-red',

  // Invoices
  paid:           'badge-green',
  unpaid:         'badge-red',
  partial:        'badge-yellow',
  refunded:       'badge-gray',
  waived:         'badge-gray',

  // Claims
  pending:        'badge-yellow',
  submitted:      'badge-blue',
  acknowledged:   'badge-teal',
  rejected:       'badge-red',
  outstanding:    'badge-red',

  // General
  active:         'badge-green',
  inactive:       'badge-gray',
  draft:          'badge-gray',
  approved:       'badge-green',
  processing:     'badge-blue',
  generated:      'badge-teal',
  pass:           'badge-green',
  fail:           'badge-red',
  unfit:          'badge-red',
  referred:       'badge-yellow',

  // Triage
  normal:         'badge-green',
  urgent:         'badge-yellow',
  emergency:      'badge-red',
}

const LABEL_MAP = {
  in_consultation: 'In Consult',
  no_show:         'No Show',
  paid:            'Paid',
  unpaid:          'Unpaid',
}

export function Badge({ status, label, className = '' }) {
  const cls = STATUS_MAP[status] || 'badge-gray'
  const text = label || LABEL_MAP[status] || (status ? status.replace(/_/g, ' ') : '')
  return (
    <span className={`${cls} ${className}`}>
      {text}
    </span>
  )
}

export function TriageDot({ triage }) {
  const colors = { normal: 'bg-success', urgent: 'bg-warning', emergency: 'bg-danger' }
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[triage] || 'bg-ink-faint'}`} title={triage} />
  )
}
