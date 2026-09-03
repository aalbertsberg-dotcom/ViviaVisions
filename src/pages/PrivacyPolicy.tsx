const EFFECTIVE_DATE = 'September 3, 2026'

export default function PrivacyPolicy() {
  return (
    <main className="page-main shell legal-page">
      <header className="legal-page__hero">
        <p className="eyebrow">VIVIAVISIONS · LEGAL</p>
        <h1>Privacy Policy</h1>
        <p>Effective {EFFECTIVE_DATE}</p>
      </header>

      <section className="panel legal-page__notice">
        <strong>Our approach</strong>
        <p>ViviaVisions uses personal information to operate private venue and event workspaces. We do not sell personal information for money, and we do not use private event content for unrelated advertising.</p>
      </section>

      <article className="legal-document">
        <section><h2>1. Scope</h2><p>This Privacy Policy explains how ViviaVisions collects, uses, shares and protects personal information when you use our websites, venue portals, client workspaces, administrative tools and communications.</p><p>A venue, planner or other business customer may also have its own privacy obligations. A business entering client information into ViviaVisions is responsible for having appropriate authority to provide that information for event-planning purposes.</p></section>

        <section><h2>2. Information we collect</h2><h3>Accounts and contacts</h3><p>Names, email addresses, account identifiers, authentication information, venue affiliation, staff role and contact information.</p><h3>Venue and business information</h3><p>Venue names, addresses, contact details, branding, logos, packages, policies, spaces, inventory, resource descriptions and photographs.</p><h3>Event and client information</h3><p>Event names, dates, guest counts, packages, planning selections, notes, client and partner email addresses, event status and setup information.</p><h3>Messages and content</h3><p>Messages, attachments, photographs, inspiration images, layouts, inventory selections, uploaded files and other workspace content.</p><h3>Technical and usage information</h3><p>Browser and device information, IP address, timestamps, authentication events, errors, security logs and feature interactions. The application may also use browser storage such as localStorage or sessionStorage for application state and demo functionality.</p></section>

        <section><h2>3. How we use information</h2><p>We use information to create and authenticate accounts, connect authorized users to the correct venue and event, provide planning and administrative features, send invitations and transactional notifications, support users, maintain and secure the service, prevent abuse, comply with law and enforce our agreements.</p></section>

        <section><h2>4. How information is shared</h2><h3>Authorized venue and event participants</h3><p>Information may be visible to authorized ViviaVisions administrators, the applicable venue owner or staff, and clients or event participants associated with the workspace.</p><h3>Service providers</h3><p>Current providers include Supabase for database, authentication and storage services; Resend for transactional email delivery; and GitHub Pages for public web hosting. These providers process information as needed to provide their services.</p><h3>Legal and safety reasons</h3><p>We may disclose information when reasonably required by law, legal process, a valid government request, or to protect rights, safety and security.</p><h3>Business transactions</h3><p>Information may be transferred in connection with a merger, acquisition, financing, reorganization or sale of assets, subject to applicable law and appropriate protections.</p></section>

        <section><h2>5. We do not sell personal information</h2><p>ViviaVisions does not sell personal information for money. We also do not use private event messages, uploaded media or private planning content for unrelated advertising.</p></section>

        <section><h2>6. Data retention</h2><p>We retain information for as long as reasonably necessary to provide the service, maintain business records, meet contractual obligations, resolve disputes, enforce agreements and comply with law. Deleted information may remain for a limited period in backups, logs or records that must be retained for legal or operational reasons.</p></section>

        <section><h2>7. Security</h2><p>We use administrative, technical and organizational safeguards designed to protect information, including authenticated access, role-based permissions, database security controls and secure transport where supported. No storage or transmission method is completely secure.</p></section>

        <section><h2>8. Your choices and rights</h2><p>You may update certain information through the service or through the venue responsible for your event. You may contact us to request access, correction or deletion, subject to authentication, the rights of the applicable business customer, legal requirements and technical limitations. Depending on where you live, applicable law may provide additional rights.</p></section>

        <section><h2>9. Transactional email</h2><p>Account confirmations, invitations, password resets, event-message notices and security communications are transactional messages used to provide the service.</p></section>

        <section><h2>10. Children</h2><p>ViviaVisions is not directed to children under 13 and does not knowingly collect personal information directly from children under 13 through individual accounts.</p></section>

        <section><h2>11. Third-party links</h2><p>Links to venue websites, vendors or other third-party resources are governed by those parties’ own policies.</p></section>

        <section><h2>12. Changes</h2><p>We may update this Privacy Policy as ViviaVisions changes. We will post the updated version and revise the effective date.</p></section>

        <section><h2>13. Contact</h2><p>Privacy questions and requests may be sent to <a href="mailto:hello@viviavisions.com">hello@viviavisions.com</a>.</p></section>
      </article>

      <div className="legal-page__footer-links"><a href="#/terms">Terms of Service</a><a href="#/customer-agreement">Customer Agreement</a><a href="#/">ViviaVisions home</a></div>
    </main>
  )
}
