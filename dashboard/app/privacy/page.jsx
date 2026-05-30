export const metadata = { title: 'Privacy Policy — Entrust Family Clinic' }

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-ink mb-2">Privacy Policy</h1>
      <p className="text-sm text-ink-muted mb-8">Last updated: May 2026</p>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">1. Introduction</h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          Entrust Family Clinic ("we", "our", "us") operates a WhatsApp-based appointment booking system powered by the WhatsApp Business Cloud API. This Privacy Policy explains how we collect, use, and protect your personal data when you communicate with us via WhatsApp.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">2. Data We Collect</h2>
        <ul className="text-sm text-ink-secondary leading-relaxed list-disc pl-5 space-y-1">
          <li>Your name and WhatsApp phone number</li>
          <li>Appointment details (date, time, service, doctor preference)</li>
          <li>Preferred language</li>
          <li>Feedback and ratings you provide voluntarily</li>
          <li>Message history within our WhatsApp conversation</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">3. How We Use Your Data</h2>
        <ul className="text-sm text-ink-secondary leading-relaxed list-disc pl-5 space-y-1">
          <li>To book and manage your appointments</li>
          <li>To send appointment reminders and confirmations via WhatsApp</li>
          <li>To respond to your queries and provide customer support</li>
          <li>To improve our services based on your feedback</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">4. WhatsApp Business Cloud API</h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          We use the WhatsApp Business Cloud API provided by Meta Platforms, Inc. to communicate with you. Your messages are transmitted through Meta's infrastructure. By messaging us on WhatsApp, you agree to Meta's WhatsApp Terms of Service and Privacy Policy. We do not collect or process sensitive health or medical information through this channel.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">5. Data Retention</h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          We retain your conversation data for up to 90 days. Appointment records are retained as required for clinic operations. You may request deletion of your data at any time by contacting us.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">6. Data Security</h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          Your data is stored securely in an encrypted database. We do not sell or share your personal information with third parties except as required by law or to operate our services (e.g. WhatsApp/Meta infrastructure).
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">7. Your Rights (PDPA)</h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          Under Malaysia's Personal Data Protection Act 2010 (PDPA), you have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact us at the clinic directly.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-ink mb-2">8. Contact</h2>
        <p className="text-sm text-ink-secondary leading-relaxed">
          Entrust Family Clinic<br />
          Phone: +60 11-2199 3226<br />
          WhatsApp: +60 11-2199 3226
        </p>
      </section>
    </div>
  )
}
