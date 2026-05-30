export const metadata = { title: 'Terms of Service — Entrust Family Clinic' }

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-ink mb-2">Terms of Service</h1>
      <p className="text-sm text-ink-muted mb-8">Last updated: May 2026</p>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">1. Acceptance</h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          By using Entrust Family Clinic's WhatsApp appointment booking service, you agree to these Terms of Service. This service is operated in compliance with Meta's WhatsApp Business Platform Cloud API Terms and Meta Platform Terms.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">2. Service Description</h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          We provide an automated WhatsApp chatbot for booking clinic appointments, receiving reminders, and managing your bookings. This service is intended for appointment scheduling purposes only and does not constitute medical advice.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">3. User Responsibilities</h2>
        <ul className="text-sm text-ink-secondary leading-relaxed list-disc pl-5 space-y-1">
          <li>Provide accurate personal information when booking appointments</li>
          <li>Notify us in advance if you need to cancel or reschedule</li>
          <li>Use the service only for legitimate appointment booking purposes</li>
          <li>Not misuse or attempt to abuse the automated system</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">4. WhatsApp Communication</h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          By messaging us on WhatsApp, you consent to receive automated messages including booking confirmations, reminders, and follow-up messages related to your appointments. You may opt out at any time by informing our staff.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">5. Limitations</h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          This WhatsApp service is for appointment management only. For medical emergencies, please call emergency services or visit the clinic directly. We are not liable for missed appointments due to technical issues beyond our control.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">6. Changes to Terms</h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          We reserve the right to update these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">7. Contact</h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          Entrust Family Clinic<br />
          Phone: +60 11-2199 3226<br />
          WhatsApp: +60 11-2199 3226
        </p>
      </section>
    </div>
  )
}
