export type VendorPartner = {
  key: string
  name: string
  category: string
  description: string
  badge: string
  href: string
  cta: string
  placeholder?: boolean
}

const mail = (name: string) =>
  `mailto:hello@viviavisions.com?subject=${encodeURIComponent(`ViviaVisions partner inquiry: ${name}`)}`

export const chandelierPartners: VendorPartner[] = [
  {
    key: 'southern-lux-rentals',
    name: 'Southern Lux Rentals',
    category: 'Luxury Restrooms',
    description: 'Luxury restroom trailer service for weddings and events. Website, service area and booking details can be added when ready.',
    badge: 'FOUNDING PARTNER',
    href: mail('Southern Lux Rentals'),
    cta: 'Request information',
  },
  {
    key: 'party-girls',
    name: 'Party Girls',
    category: 'Event Rentals & Décor',
    description: 'A founding rental and décor partner placeholder ready for photos, packages and a direct booking link.',
    badge: 'FOUNDING PARTNER',
    href: mail('Party Girls'),
    cta: 'Request information',
  },
  {
    key: 'photo-booth-partner',
    name: 'Photo Booth Partner',
    category: 'Photo Booth',
    description: 'Reserved category for a future photo booth partner.',
    badge: 'PARTNER OPENING',
    href: mail('Photo Booth Partner'),
    cta: 'Ask about this category',
    placeholder: true,
  },
  {
    key: 'floral-partner',
    name: 'Floral Partner',
    category: 'Florals',
    description: 'Reserved category for a future floral and styling partner.',
    badge: 'PARTNER OPENING',
    href: mail('Floral Partner'),
    cta: 'Ask about this category',
    placeholder: true,
  },
]