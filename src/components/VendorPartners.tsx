import { useEffect } from 'react'
import { chandelierPartners } from '../config/vendorPartners'
import { trackVendorClick, trackVendorImpression } from '../lib/repositories/analytics'

type Props = { venueSlug: string; venueName: string }

export default function VendorPartners({ venueSlug, venueName }: Props) {
  if (venueSlug !== 'chandelier-oaks') return null

  useEffect(() => {
    chandelierPartners.forEach((partner) => void trackVendorImpression(partner.key, venueSlug))
  }, [venueSlug])

  return (
    <section className="section shell vendor-partners" data-testid="vendor-partners">
      <div className="section-heading vendor-partners__heading">
        <div>
          <p className="eyebrow">VIVIAVISIONS PARTNERS</p>
          <h2>Helpful services for your event.</h2>
          <p className="section-lead">Recommended and featured services that can complement an event at {venueName}.</p>
        </div>
        <a className="button button--ghost button--small" href="mailto:hello@viviavisions.com?subject=ViviaVisions%20Partner%20Program">Become a partner</a>
      </div>

      <div className="vendor-partner-grid">
        {chandelierPartners.map((partner) => (
          <article className={`vendor-partner-card${partner.placeholder ? ' vendor-partner-card--placeholder' : ''}`} key={partner.key}>
            <div className="vendor-partner-card__top"><span>{partner.category}</span><b>{partner.badge}</b></div>
            <div className="vendor-partner-card__mark">{partner.name.split(/\s+/).slice(0,2).map((word) => word[0]).join('').toUpperCase()}</div>
            <h3>{partner.name}</h3>
            <p>{partner.description}</p>
            <a href={partner.href} onClick={() => void trackVendorClick(partner.key, venueSlug)}>{partner.cta} →</a>
          </article>
        ))}
      </div>
    </section>
  )
}