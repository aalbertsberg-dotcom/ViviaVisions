const EFFECTIVE_DATE = 'September 3, 2026'

export default function TermsOfService() {
  return (
    <main className="page-main shell legal-page">
      <header className="legal-page__hero">
        <p className="eyebrow">VIVIAVISIONS · LEGAL</p>
        <h1>Terms of Service</h1>
        <p>Effective {EFFECTIVE_DATE}</p>
      </header>

      <section className="panel legal-page__notice">
        <strong>About these Terms</strong>
        <p>These Terms govern ViviaVisions websites, venue portals, client workspaces and related services. Paid business customers may also have a separate Customer Agreement or Order Form.</p>
      </section>

      <article className="legal-document">
        <section><h2>1. Acceptance</h2><p>By accessing or using ViviaVisions, creating an account, accepting an invitation, submitting a venue request, or otherwise using the service, you agree to these Terms and acknowledge the Privacy Policy. If you act for a business or organization, you represent that you are authorized to do so.</p></section>

        <section><h2>2. The service</h2><p>ViviaVisions provides software for event planning and venue operations, including venue profiles, inventory and décor catalogs, private event workspaces, package information, layouts, media, messaging, calendars, setup summaries and administrative tools.</p><p>ViviaVisions is a software provider. Unless a separate written agreement says otherwise, ViviaVisions is not the venue, planner, rental company, caterer, officiant, vendor or other event-service provider. Final event terms are controlled by the applicable venue or service provider.</p></section>

        <section><h2>3. Accounts and access</h2><p>You must provide accurate information, keep credentials secure and use only accounts and workspaces you are authorized to access. Access may differ for platform administrators, venue owners, staff, clients and event participants.</p><p>A link, invitation or QR code may direct a user to the correct portal but does not by itself grant access. Authorization may still depend on the assigned account or email address.</p></section>

        <section><h2>4. Venue and client responsibilities</h2><p>Business customers are responsible for the accuracy of their packages, inventory, availability, policies, event data, pricing and client contact information. Clients and event participants are responsible for confirming final event details with their venue or event professional.</p></section>

        <section><h2>5. User Content</h2><p>You may submit photos, logos, inventory information, documents, messages, layouts, notes and other materials (“User Content”). You retain any ownership rights you already have in that content.</p><p>You grant ViviaVisions a non-exclusive, worldwide, royalty-free license to host, store, reproduce, transmit, display, format, back up and process User Content only as reasonably necessary to operate, secure, support and provide the service.</p><p>You represent that you have the rights and permissions necessary to submit User Content.</p></section>

        <section><h2>6. ViviaVisions intellectual property</h2><p>ViviaVisions and its licensors retain all rights in the ViviaVisions platform, software, source code, interfaces, branding, visual design, documentation, workflows, templates and other materials supplied by ViviaVisions, excluding User Content and third-party materials.</p><p>You receive a limited, revocable, non-exclusive, non-transferable right to use the service for its intended purpose. You may not resell, sublicense, reverse engineer, scrape, reproduce or create a competing service from protected ViviaVisions materials except where law expressly permits otherwise.</p></section>

        <section><h2>7. Acceptable use</h2><p>You may not access data without authorization, bypass security, upload unlawful or infringing material, introduce malware, harass or impersonate others, send spam, interfere with the service, or use ViviaVisions in violation of law or another person’s rights.</p></section>

        <section><h2>8. Communications</h2><p>ViviaVisions may send transactional communications relating to accounts, invitations, password resets, event messages, security and service operation. Venues may use ViviaVisions to communicate with clients assigned to their events.</p></section>

        <section><h2>9. Third-party services</h2><p>ViviaVisions relies on third-party infrastructure and service providers for hosting, databases, authentication, storage, email delivery and similar operational functions. Third-party websites or products linked from ViviaVisions are governed by their own terms and policies.</p></section>

        <section><h2>10. Paid services</h2><p>Pricing, subscription terms, payment terms, renewal terms and service-specific commitments for a business customer are stated in the applicable Customer Agreement or Order Form. If those documents conflict with these Terms, the Customer Agreement or Order Form controls for that customer.</p></section>

        <section><h2>11. Availability and changes</h2><p>We may modify, improve or discontinue features and may perform maintenance or temporarily restrict access to protect the service or its users. Unless a written agreement provides otherwise, we do not guarantee uninterrupted or error-free operation.</p></section>

        <section><h2>12. Suspension and termination</h2><p>We may suspend or terminate access when reasonably necessary to address security threats, unlawful use, material violations, nonpayment under a paid agreement or conduct that threatens ViviaVisions or other users.</p></section>

        <section><h2>13. Disclaimers</h2><p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, VIVIAVISIONS IS PROVIDED “AS IS” AND “AS AVAILABLE.” WE DISCLAIM IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT EXCEPT WHERE SUCH WARRANTIES CANNOT LEGALLY BE DISCLAIMED.</p><p>ViviaVisions does not guarantee the accuracy of venue-provided inventory, pricing, layouts, schedules, availability or other customer-entered information.</p></section>

        <section><h2>14. Limitation of liability</h2><p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, VIVIAVISIONS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE OR CONSEQUENTIAL DAMAGES, OR FOR LOST PROFITS, REVENUE, BUSINESS, GOODWILL OR DATA.</p><p>For users without a separate paid Customer Agreement, ViviaVisions’ aggregate liability will not exceed the greater of $100 or the amount paid directly to ViviaVisions by that user during the twelve months before the event giving rise to the claim. Some jurisdictions do not allow certain limitations, so portions of this section may not apply.</p></section>

        <section><h2>15. Indemnification</h2><p>To the extent permitted by law, you agree to defend, indemnify and hold ViviaVisions harmless from third-party claims arising from your User Content, unlawful use of the service, or material violation of these Terms or another person’s rights.</p></section>

        <section><h2>16. Governing law</h2><p>These Terms are governed by the laws of the State of Mississippi, without regard to conflict-of-law principles, except where applicable law requires otherwise. Disputes not governed by another written agreement will be brought in a court of competent jurisdiction in Mississippi, subject to applicable jurisdiction and venue rules.</p></section>

        <section><h2>17. Updates</h2><p>We may update these Terms as the service changes. We will post the updated version and revise the effective date. Continued use after the updated Terms take effect constitutes acceptance to the extent permitted by law.</p></section>

        <section><h2>18. Contact</h2><p>Questions may be sent to <a href="mailto:hello@viviavisions.com">hello@viviavisions.com</a>.</p></section>
      </article>

      <div className="legal-page__footer-links"><a href="#/privacy">Privacy Policy</a><a href="#/customer-agreement">Customer Agreement</a><a href="#/">ViviaVisions home</a></div>
    </main>
  )
}
