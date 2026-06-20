import { LegalLayout } from '@/layouts/LegalLayout'

export default function TermsPage() {
  const updated = 'June 20, 2026'
  return (
    <LegalLayout title="Terms & Conditions" updated={updated}>
      <p>
        Welcome to Measure (&ldquo;the Service&rdquo;). By creating an account
        or using the Service you agree to be bound by these Terms &amp;
        Conditions. If you do not agree, do not use the Service.
      </p>

      <h2>1. Eligibility &amp; accounts</h2>
      <p>
        You must be at least 16 years old to use the Service. You are
        responsible for all activity on your account and for keeping your
        credentials confidential. Notify us immediately at{' '}
        <a href="mailto:support@measure.app">support@measure.app</a> if you
        suspect unauthorized access.
      </p>

      <h2>2. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service to violate any law or third-party right.</li>
        <li>
          Upload customer data you don&rsquo;t have the right to process.
        </li>
        <li>
          Attempt to reverse-engineer, scrape, or interfere with the Service
          or its infrastructure.
        </li>
        <li>
          Resell, sublicense, or white-label the Service without prior
          written consent.
        </li>
      </ul>

      <h2>3. Your content</h2>
      <p>
        You retain ownership of measurements, customer records, and any other
        data you submit (&ldquo;Customer Content&rdquo;). You grant us a
        limited licence to host, transmit, and process Customer Content
        solely to provide the Service to you.
      </p>

      <h2>4. Subscriptions &amp; billing</h2>
      <p>
        The free tier is offered at our discretion. Paid plans, when
        applicable, renew on a recurring basis until cancelled. You are
        responsible for any taxes applicable in your jurisdiction.
      </p>

      <h2>5. Service availability</h2>
      <p>
        We strive for high availability but do not guarantee uninterrupted
        service. We may perform maintenance, deploy updates, or modify
        features without prior notice.
      </p>

      <h2>6. Disclaimer of warranties</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo;. Measurements obtained via the camera feature use a
        reference-scaling approximation and should not be relied upon for
        applications requiring certified precision.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Measure and its officers,
        employees and contractors are not liable for any indirect,
        incidental, consequential or punitive damages, or for lost profits,
        data, or business arising out of your use of the Service.
      </p>

      <h2>8. Termination</h2>
      <p>
        You may delete your account at any time from your profile page. We
        may suspend or terminate accounts that violate these Terms.
      </p>

      <h2>9. Changes to these Terms</h2>
      <p>
        We may revise these Terms from time to time. Material changes will
        be announced via email or in-app notice. Continued use after the
        change date constitutes acceptance.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws of the jurisdiction in which
        Measure is incorporated, without regard to conflict-of-law
        principles.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these Terms? Email{' '}
        <a href="mailto:legal@measure.app">legal@measure.app</a>.
      </p>
    </LegalLayout>
  )
}
