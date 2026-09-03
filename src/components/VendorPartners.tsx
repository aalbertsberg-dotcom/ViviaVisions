import { useEffect, useState } from 'react'
import { chandelierPartners, type VendorPartner } from '../config/vendorPartners'
import { trackVendorClick, trackVendorImpression } from '../lib/repositories/analytics'

type Props = { venueSlug: string; venueName: string }

export default function VendorPartners({ venueSlug, venueName }: Props) {
  const [selected, setSelected] = useState<VendorPartner | null>(null)

  if (venueSlug !== 'chandelier-oaks') return null

  useEffect(() => {
    chandelierPartners.forEach((partner) => void trackVendorImpression(partner.key, venueSlug))
  }, [venueSlug])

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
        {chandelierPartners.map((partner) => (
          <article
            className={`vendor-partner-card${partner.placeholder ? ' vendor-partner-card--placeholder' : ''}`}
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
            <div className="vendor-partner-card__mark">{partner.name.split(/\s+/).slice(0,2).map((word) => word[0]).join('').toUpperCase()}</div>
            <h3>{partner.name}</h3>
            <p>{partner.description}</p>
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
            <div className="vendor-partner-modal__mark">{selected.name.split(/\s+/).slice(0,2).map((word) => word[0]).join('').toUpperCase()}</div>
            <div className="vendor-partner-modal__labels"><span>{selected.category}</span><b>{selected.badge}</b></div>
            <h2 id="vendor-partner-modal-title">{selected.name}</h2>
            <p>{selected.description}</p>

            <div className="vendor-partner-modal__info">
              <div><span>Listing status</span><strong>{selected.placeholder ? 'Category available' : 'Founding ViviaVisions partner'}</strong></div>
              <div><span>Available at</span><strong>Chandelier Oaks</strong></div>
            </div>

            {selected.placeholder ? (
              <div className="vendor-partner-modal__notice">
                This is a placeholder partner category. A real vendor profile can later include a logo, photo gallery, website, packages, service area and direct quote link.
              </div>
            ) : (
              <div className="vendor-partner-modal__notice">
                This founding partner profile is ready for a logo, photos, website, service area, packages and direct booking information as those details become available.
              </div>
            )}

            <div className="vendor-partner-modal__actions">
              <a className="button button--primary" href={selected.href}>{selected.cta}</a>
              <button className="button button--ghost" type="button" onClick={() => setSelected(null)}>Back to partners</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}