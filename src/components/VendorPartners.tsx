import { useEffect, useState } from 'react'
import { chandelierPartners, type VendorPartner } from '../config/vendorPartners'
import { listPublicPartners } from '../lib/repositories/partners'
import { trackVendorClick, trackVendorImpression } from '../lib/repositories/analytics'

type Props = { venueSlug: string; venueName: string }

function fallbackPartners(venueSlug: string) {
  return venueSlug === 'chandelier-oaks' ? chandelierPartners : []
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
}

export default function VendorPartners({ venueSlug, venueName }: Props) {
  const [partners, setPartners] = useState<VendorPartner[]>(() => fallbackPartners(venueSlug))
  const [selected, setSelected] = useState<VendorPartner | null>(null)

  useEffect(() => {
    let cancelled = false
    setPartners(fallbackPartners(venueSlug))

    void listPublicPartners(venueSlug)
      .then((managed) => {
        if (!cancelled && managed.length) setPartners(managed)
      })
      .catch(() => {
        // Keep the built-in fallback until partner management is configured.
      })

    return () => {
      cancelled = true
    }
  }, [venueSlug])

  useEffect(() => {
    partners.forEach((partner) => void trackVendorImpression(partner.key, venueSlug))
  }, [venueSlug, partners])

  if (!partners.length) return null

  const openPartner = (partner: VendorPartner) => {
    setSelected(partner)
    void trackVendorClick(partner.key, venueSlug)
  }

  return (
    <section className="section shell vendor-partners" data-testid="vendor-partners">
      <div className="section-heading vendor-partners__heading">
        <div>
          <h2 className="vendor-partners__title">ViviaVisions Partners</h2>
          <h3 className="vendor-partners__subtitle">Helpful services for your event.</h3>
          <p className="section-lead">Recommended and featured services that can complement an event at {venueName}.</p>
        </div>
        <a className="button button--ghost button--small" href="mailto:hello@viviavisions.com?subject=ViviaVisions%20Partner%20Program">Become a partner</a>
      </div>

      <div className="vendor-partner-grid">
        {partners.map((partner) => (
          <article
            className={`vendor-partner-card${partner.placeholder ? ' vendor-partner-card--placeholder' : ''}${partner.featured ? ' vendor-partner-card--featured' : ''}`}
            key={partner.key}
            role="button"
            tabIndex={0}
            aria-label={`View ${partner.name} partner details`}
            onClick={() => openPartner(partner)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openPartner(partner)
              }
            }}
          >
            <div className="vendor-partner-card__top"><span>{partner.category}</span><b>{partner.badge}</b></div>
            <div className={`vendor-partner-card__mark${partner.logoUrl ? ' vendor-partner-card__mark--image' : ''}`}>
              {partner.logoUrl ? <img src={partner.logoUrl} alt="" /> : initials(partner.name)}
            </div>
            <h3>{partner.name}</h3>
            <p>{partner.description}</p>
            {partner.serviceArea && <small className="vendor-partner-card__service-area">{partner.serviceArea}</small>}
            <span className="vendor-partner-card__details">View partner details →</span>
          </article>
        ))}
      </div>

      {selected && (
        <div className="vendor-partner-modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <section
            className="vendor-partner-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-partner-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="vendor-partner-modal__close" type="button" onClick={() => setSelected(null)} aria-label="Close partner details">×</button>
            <div className={`vendor-partner-modal__mark${selected.logoUrl ? ' vendor-partner-modal__mark--image' : ''}`}>
              {selected.logoUrl ? <img src={selected.logoUrl} alt="" /> : initials(selected.name)}
            </div>
            <div className="vendor-partner-modal__labels"><span>{selected.category}</span><b>{selected.badge}</b></div>
            <h2 id="vendor-partner-modal-title">{selected.name}</h2>
            <p>{selected.description}</p>

            <div className="vendor-partner-modal__info">
              <div><span>Listing status</span><strong>{selected.placeholder ? 'Category available' : selected.planTier || 'ViviaVisions partner'}</strong></div>
              <div><span>Service area</span><strong>{selected.serviceArea || venueName}</strong></div>
            </div>

            {selected.placeholder && (
              <div className="vendor-partner-modal__notice">
                This is an open partner category. A real vendor profile can include a logo, website, services, service area and direct booking information.
              </div>
            )}

            <div className="vendor-partner-modal__actions">
              <a className="button button--primary" href={selected.href} target={selected.websiteUrl ? '_blank' : undefined} rel={selected.websiteUrl ? 'noopener noreferrer' : undefined}>{selected.cta}</a>
              <button className="button button--ghost" type="button" onClick={() => setSelected(null)}>Back to partners</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}