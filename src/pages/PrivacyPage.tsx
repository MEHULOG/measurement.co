import { LegalLayout } from '@/layouts/LegalLayout'

export default function PrivacyPage() {
  const updated = 'June 20, 2026'
  return (
    <LegalLayout title="Privacy Policy" updated={updated}>
      <p>
        This Privacy Policy explains how Measure (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;) collects, uses, and protects your information when
        you use our Service.
      </p>

      <h2>1. Data we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> — name, email, profile image, and
          authentication identifiers from Clerk.
        </li>
        <li>
          <strong>Customer Content</strong> — measurements, customer names,
          phone numbers, product types, and notes you enter.
        </li>
        <li>
          <strong>Usage data</strong> — activity logs (who created / edited /
          deleted what, and when) for audit purposes.
        </li>
        <li>
          <strong>Camera data</strong> — when you use the camera measurement
          feature, the video stream is processed entirely in your browser. We
          do not record, transmit, or store the video.
        </li>
      </ul>

      <h2>2. How we use your data</h2>
      <ul>
        <li>To provide and operate the Service.</li>
        <li>
          To authenticate users, enforce role-based access, and maintain
          audit logs.
        </li>
        <li>To respond to support requests and security incidents.</li>
        <li>To comply with legal obligations.</li>
      </ul>

      <h2>3. How we share your data</h2>
      <p>We share data only with:</p>
      <ul>
        <li>
          <strong>Clerk</strong> — our authentication provider, for sign-in,
          sign-up, and profile management.
        </li>
        <li>
          <strong>Convex</strong> — our backend database and serverless
          platform, where Customer Content is stored.
        </li>
        <li>
          <strong>Authorities</strong> — when required by valid legal
          process.
        </li>
      </ul>
      <p>We do not sell your data. We do not use it to train AI models.</p>

      <h2>4. Data retention</h2>
      <p>
        Customer Content is retained while your account is active. When you
        delete your account, associated data is removed within 30 days,
        except where retention is required by law.
      </p>

      <h2>5. Security</h2>
      <p>
        We use TLS for data in transit and industry-standard practices for
        data at rest. Access to production data is restricted to authorized
        engineers. No system is perfectly secure — please report any
        suspected vulnerabilities to{' '}
        <a href="mailto:security@measure.app">security@measure.app</a>.
      </p>

      <h2>6. Your rights</h2>
      <p>Depending on your jurisdiction, you may have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion of your data.</li>
        <li>Object to or restrict certain processing.</li>
        <li>Receive a copy of your data in a portable format.</li>
      </ul>
      <p>
        To exercise these rights, email{' '}
        <a href="mailto:privacy@measure.app">privacy@measure.app</a>.
      </p>

      <h2>7. Cookies</h2>
      <p>
        We use strictly necessary cookies and local storage to keep you
        signed in and remember your theme preference. We do not use
        advertising or third-party tracking cookies.
      </p>

      <h2>8. Children</h2>
      <p>
        The Service is not directed to children under 16. We do not knowingly
        collect data from anyone under that age.
      </p>

      <h2>9. International transfers</h2>
      <p>
        Your data may be processed in countries other than your own. Our
        sub-processors (Clerk, Convex) maintain appropriate safeguards for
        cross-border data transfers.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify
        you of material changes via email or an in-app notice.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions or concerns? Email{' '}
        <a href="mailto:privacy@measure.app">privacy@measure.app</a>.
      </p>
    </LegalLayout>
  )
}
