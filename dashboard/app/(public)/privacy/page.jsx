export const metadata = { title: 'Privacy Policy — Entrust Family Clinic' }

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-500">Entrust Family Clinic · Last updated: May 2026</p>
      </div>

      <section className="mb-7">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">1. Introduction</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Entrust Family Clinic ("we", "our", "us") operates a WhatsApp-based appointment booking system powered by the WhatsApp Business Cloud API provided by Meta Platforms, Inc. This Privacy Policy explains how we collect, use, store, and protect your personal data when you communicate with us via WhatsApp.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">2. Data We Collect</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-2">When you use our WhatsApp booking service, we collect:</p>
        <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-5 space-y-1">
          <li>Your name and WhatsApp phone number</li>
          <li>Appointment details (date, time, service type, doctor preference)</li>
          <li>Preferred language</li>
          <li>Feedback and ratings you provide voluntarily</li>
          <li>Message history within our WhatsApp conversation</li>
        </ul>
        <p className="text-sm text-gray-600 leading-relaxed mt-2">
          We do <strong>not</strong> collect sensitive medical or health information through this channel.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">3. How We Use Your Data</h2>
        <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-5 space-y-1">
          <li>To book and manage your appointments</li>
          <li>To send appointment reminders and confirmations via WhatsApp</li>
          <li>To respond to your queries and provide customer support</li>
          <li>To improve our services based on your feedback</li>
          <li>To send follow-up messages after your visit (with your consent)</li>
        </ul>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">4. WhatsApp Business Cloud API</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          We use the WhatsApp Business Cloud API to communicate with you via WhatsApp. Your messages are transmitted through Meta's infrastructure in accordance with Meta's own Privacy Policy and WhatsApp Terms of Service. By messaging us on WhatsApp, you acknowledge that Meta processes your data as described in their policies. We do not store your WhatsApp messages on Meta's servers — we store only what is necessary for appointment management in our own secure database.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">5. Data Sharing</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          We do not sell your personal data. We only share data with:
        </p>
        <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-5 space-y-1 mt-2">
          <li>Meta Platforms, Inc. — as required to deliver WhatsApp messages</li>
          <li>Our clinic staff — for appointment management purposes</li>
          <li>Authorities — if required by Malaysian law</li>
        </ul>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">6. Data Retention</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Conversation and message data is retained for up to 90 days. Appointment records are retained as required for clinic operations. You may request deletion of your personal data at any time by contacting us directly.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">7. Data Security</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Your data is stored in an encrypted, access-controlled database. We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, disclosure, or loss.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">8. Your Rights (PDPA Malaysia)</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Under Malaysia's Personal Data Protection Act 2010 (PDPA), you have the right to:
        </p>
        <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-5 space-y-1 mt-2">
          <li>Access your personal data held by us</li>
          <li>Correct inaccurate personal data</li>
          <li>Request deletion of your personal data</li>
          <li>Withdraw consent for data processing</li>
        </ul>
        <p className="text-sm text-gray-600 leading-relaxed mt-2">
          To exercise any of these rights, contact us directly at the clinic.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">9. Changes to This Policy</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          We may update this Privacy Policy from time to time. The latest version will always be available at this URL.
        </p>
      </section>

      <section className="mb-7">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">10. Contact Us</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Entrust Family Clinic<br />
          Phone: +60 11-2199 3226<br />
          WhatsApp: +60 11-2199 3226
        </p>
      </section>
    </div>
  )
}
