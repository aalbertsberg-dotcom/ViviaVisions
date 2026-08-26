import type { InventoryItem, PackageTier, VenueArea, VenueConfig, VenuePackage, VenueProfile } from './types'

export const chandelierOaks: VenueProfile = {
  id: 'venue-chandelier-oaks',
  slug: 'chandelier-oaks',
  name: 'Chandelier Oaks Wedding Venue',
  shortName: 'Chandelier Oaks',
  tagline: "The Mississippi Gulf Coast's most enchanting wedding destination.",
  website: 'https://chandelieroaks.com/',
  address: '25021 Loren Ladner Road, Kiln, Mississippi 39556',
  phone: '(228) 233-0645',
  email: 'chandelier.oaks@gmail.com',
  ownerName: 'Felia & Robert Georges',
  brandPrimary: '#34483b',
  brandAccent: '#b58a55',
  logoText: 'CO',
  brandSurface: '#eef2ed',
  brandText: '#23382d',
  locationLabel: 'Kiln, Mississippi',
  inventoryLabel: 'Pinrose Prop Shop',
  previewLabel: 'Chandelier Oaks',
  venueTypeLabel: 'Wedding & event venue',
  eventLabel: 'wedding',
  eventPluralLabel: 'weddings',
  clientLabel: 'couple',
  clientPluralLabel: 'couples',
  portalHeroTitle: 'Welcome to your Chandelier Oaks planning portal.',
  portalHeroBody: 'Keep package details, venue spaces, Pinrose Prop Shop selections, layouts, messages and final setup information together from booking through wedding day.',
  links: [
    { label: 'Official website', url: 'https://chandelieroaks.com/', kind: 'website' },
    { label: 'Wedding packages', url: 'https://chandelieroaks.com/wedding-packages', kind: 'resource' },
    { label: 'FAQ', url: 'https://chandelieroaks.com/faq', kind: 'resource' },
    { label: 'Contact', url: 'https://chandelieroaks.com/contact', kind: 'resource' },
  ],
}

export const chandelierPackages: VenuePackage[] = [
  {
    id: 'micro',
    name: 'Intimate Elopements & Micro-Weddings',
    price: 2500,
    duration: '4 hours',
    maxGuests: null,
    tier: 1,
    description: 'A four-hour elopement or micro-wedding experience for a smaller, relaxed celebration beneath the oaks or by the water.',
    highlights: ['Outdoor ceremony options', 'Patio cake cutting', 'Full outdoor property photo access', 'Pinrose décor access — tier dependent'],
  },
  {
    id: 'classic',
    name: 'The Classic Celebration',
    price: 4800,
    duration: '8 hours',
    maxGuests: 60,
    tier: 1,
    description: 'A full eight-hour ceremony and reception experience for couples who want a traditional celebration without the full-weekend commitment.',
    highlights: ['Up to 60 guests', 'Ceremony + reception access', 'Tables and chairs', 'Optional add-ons'],
  },
  {
    id: 'overnight',
    name: 'An Overnight Event',
    price: 7200,
    duration: '11 AM – 8 AM',
    maxGuests: 100,
    tier: 2,
    description: 'An 11 AM-to-8 AM celebration with overnight accommodations, rehearsal space and additional venue access.',
    highlights: ['Up to 100 event guests', 'Up to 8 overnight guests + couple', 'Loft game room + Pecan Pavilion', 'Weekday bridal photo session'],
  },
  {
    id: 'weekend',
    name: 'Wedding Weekend Experience',
    price: 10000,
    duration: 'Friday – Sunday',
    maxGuests: 175,
    tier: 2,
    description: 'A Friday-through-Sunday wedding weekend with time for rehearsal, celebration, overnight stays and an unhurried departure.',
    highlights: ['Up to 175 guests', '12 overnight guests + couple Friday', 'Rehearsal dinner for up to 35', 'Premium rental tiers'],
  },
  {
    id: 'luxury',
    name: 'Luxury Weekend Retreat',
    price: 12000,
    duration: 'Friday – Sunday',
    maxGuests: 250,
    tier: 3,
    description: 'The premium full-weekend Chandelier Oaks experience with the broadest property, rental and service access.',
    highlights: ['Up to 250 guests', 'Up to 18 overnight guests + couple both nights', 'Top-tier rentals, floral access + linens', 'Bartending, security, concierge + coordination'],
  },
]

export const chandelierAreas: VenueArea[] = [
  {
    id: 'pecan-pavilion',
    name: 'Pecan Pavilion',
    kind: 'Reception',
    description: '3,500 sq. ft. open-air pavilion beneath mature live oaks, with three grand chandeliers and room for ceremonies, receptions and dancing.',
    plannerEnabled: true,
    visual: 'pavilion',
  },
  {
    id: 'under-the-oaks',
    name: 'Under the Live Oaks',
    kind: 'Ceremony',
    description: 'Ceremony setting beneath the oak canopy and chandeliers.',
    plannerEnabled: true,
    visual: 'oaks',
  },
  {
    id: 'hilltop-gazebo',
    name: 'Hilltop Gazebo',
    kind: 'Ceremony',
    description: 'Elevated ceremony option with a romantic garden feel.',
    plannerEnabled: true,
    visual: 'gazebo',
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    kind: 'Ceremony',
    description: 'Chapel-like greenhouse setting for intimate ceremonies, portraits and styled wedding moments.',
    plannerEnabled: true,
    visual: 'greenhouse',
  },
  {
    id: 'lakeside',
    name: 'Lakeside',
    kind: 'Photos',
    description: 'Waterfront setting for portraits, quiet ceremony moments and golden-hour photos.',
    plannerEnabled: true,
    visual: 'lake',
  },
  {
    id: 'pool-patio',
    name: 'Pool & Patio',
    kind: 'Hospitality',
    description: 'Poolside and patio space for weekend gatherings, cocktail moments and relaxed events.',
    plannerEnabled: true,
    visual: 'pool',
  },
]

/**
 * INITIAL CHANDELIER OAKS CATALOG.
 * Item types are based on categories Chandelier Oaks publicly describes for the Pinrose Prop Shop.
 * Working quantities, dimensions, storage locations and package-tier mapping remain onboarding fields until the venue completes its inventory pass.
 */
export const chandelierInventory: InventoryItem[] = [
  {
    id: 'champagne-wall',
    name: 'Champagne Wall',
    category: 'Backdrops',
    color: 'Warm white / gold',
    quantity: 1,
    dimensions: 'Working dimensions · verify onsite',
    storage: 'Pinrose Prop Shop · Backdrop bay',
    description: 'Statement champagne display wall for cocktail hour or reception welcome moments.',
    imageStyle: 'champagne-wall',
    featured: true,
    accessTier: 2,
    packageNote: 'Initial package mapping · confirm during venue onboarding.',
  },
  {
    id: 'french-doors',
    name: 'Vintage French Doors',
    category: 'Backdrops',
    color: 'Antique ivory',
    quantity: 2,
    dimensions: 'Working dimensions · verify onsite',
    storage: 'Pinrose Prop Shop · Wall rack A',
    description: 'Vintage-style French doors for ceremony entrances, portraits or styled backdrops.',
    imageStyle: 'french-doors',
    featured: true,
    accessTier: 1,
    packageNote: 'Initial package mapping · confirm during venue onboarding.',
  },
  {
    id: 'antique-sofa',
    name: 'Antique Velvet Sofa',
    category: 'Furniture',
    color: 'Olive / walnut',
    quantity: 2,
    dimensions: 'Working dimensions · verify onsite',
    storage: 'Pinrose Prop Shop · Furniture row',
    description: 'Vintage seating piece for lounge areas, portraits and sweetheart-table styling.',
    imageStyle: 'antique-sofa',
    featured: true,
    accessTier: 2,
    packageNote: 'Initial package mapping · confirm during venue onboarding.',
  },
  {
    id: 'circle-arch',
    name: 'Metal Circle Arch',
    category: 'Arches',
    color: 'Matte black',
    quantity: 1,
    dimensions: 'Working dimensions · verify onsite',
    storage: 'Pinrose Prop Shop · Arch rack',
    description: 'Round ceremony arch ready for greenery, fabric or floral installation.',
    imageStyle: 'circle-arch',
    accessTier: 1,
    packageNote: 'Initial package mapping · confirm during venue onboarding.',
  },
  {
    id: 'wood-arbor',
    name: 'Natural Wood Arbor',
    category: 'Arches',
    color: 'Natural wood',
    quantity: 1,
    dimensions: 'Working dimensions · verify onsite',
    storage: 'Pinrose Prop Shop · Arch rack',
    description: 'Warm wood ceremony arbor for outdoor ceremony settings.',
    imageStyle: 'wood-arbor',
    accessTier: 1,
    packageNote: 'Initial package mapping · confirm during venue onboarding.',
  },
  {
    id: 'swing-bed',
    name: 'Styled Swing Bed',
    category: 'Furniture',
    color: 'Natural / ivory',
    quantity: 1,
    dimensions: 'Installed prop',
    storage: 'Property · Styled photo area',
    description: 'Photo-ready swing-bed setup for portraits and relaxed wedding-weekend moments.',
    imageStyle: 'swing-bed',
    accessTier: 2,
    packageNote: 'Initial package mapping · confirm during venue onboarding.',
  },
  {
    id: 'crystal-chandelier',
    name: 'Hanging Crystal Chandelier',
    category: 'Lighting',
    color: 'Crystal / brass',
    quantity: 6,
    dimensions: 'Assorted',
    storage: 'Pinrose Prop Shop · Lighting rack',
    description: 'Decorative chandelier option for styled spaces and elevated reception moments.',
    imageStyle: 'chandelier',
    accessTier: 2,
    packageNote: 'Initial package mapping · confirm during venue onboarding.',
  },
  {
    id: 'green-wall',
    name: 'Greenery Photo Wall',
    category: 'Backdrops',
    color: 'Green',
    quantity: 1,
    dimensions: 'Working dimensions · verify onsite',
    storage: 'Pinrose Prop Shop · Backdrop bay',
    description: 'Styled greenery wall for portraits, photo moments or seating-chart placement.',
    imageStyle: 'green-wall',
    accessTier: 1,
    packageNote: 'Initial package mapping · confirm during venue onboarding.',
  },
  {
    id: 'gold-lantern',
    name: 'Gold Lantern Set',
    category: 'Centerpieces',
    color: 'Antique gold',
    quantity: 24,
    dimensions: 'Assorted sizes · verify onsite',
    storage: 'Pinrose Prop Shop · Shelf B3',
    description: 'Warm metallic lanterns for tables, aisle styling and reception groupings. Use flameless candles only.',
    imageStyle: 'gold-lantern',
    accessTier: 1,
    packageNote: 'Working quantity · confirm during venue inventory onboarding.',
  },
  {
    id: 'white-florals',
    name: 'White & Green Floral Collection',
    category: 'Florals',
    color: 'White / green',
    quantity: 12,
    dimensions: 'Assorted arrangements',
    storage: 'Pinrose Prop Shop · Floral storage',
    description: 'Working floral collection record for centerpieces and styled focal areas; final pieces will be confirmed during inventory onboarding.',
    imageStyle: 'white-florals',
    accessTier: 3,
    packageNote: 'Initial luxury-package mapping · confirm exact floral access during onboarding.',
  },
  {
    id: 'ivory-linens',
    name: 'Ivory Table Linen Collection',
    category: 'Linens',
    color: 'Ivory',
    quantity: 30,
    dimensions: 'Assorted table sizes',
    storage: 'Pinrose Prop Shop · Linen storage',
    description: 'Working linen collection record for the top package tier; final counts and sizes will be confirmed during inventory onboarding.',
    imageStyle: 'ivory-linens',
    accessTier: 3,
    packageNote: 'Initial luxury-package mapping · confirm exact linen access during onboarding.',
  },
  {
    id: 'welcome-easel',
    name: 'Vintage Welcome Easel',
    category: 'Signs',
    color: 'Antique gold',
    quantity: 3,
    dimensions: 'Floor standing',
    storage: 'Pinrose Prop Shop · Sign row',
    description: 'Decorative easel for welcome signage, seating charts or portraits.',
    imageStyle: 'welcome-easel',
    accessTier: 1,
    packageNote: 'Working quantity · confirm during venue inventory onboarding.',
  },
]

export const juniperStone: VenueProfile = {
  id: 'venue-juniper-stone',
  slug: 'juniper-stone-estate',
  name: 'Juniper & Stone Estate',
  shortName: 'Juniper & Stone',
  tagline: 'Modern garden celebrations with a quiet architectural edge.',
  website: '',
  address: 'Sample venue · Asheville, North Carolina',
  phone: '(555) 014-0274',
  email: 'hello@juniperstone.example',
  ownerName: 'Morgan Reed',
  brandPrimary: '#18384a',
  brandAccent: '#c8795b',
  brandSurface: '#edf3f6',
  brandText: '#142f3d',
  logoText: 'JS',
  locationLabel: 'Asheville, North Carolina',
  inventoryLabel: 'Design Library',
  previewLabel: 'Juniper & Stone',
  venueTypeLabel: 'Wedding & event venue',
  eventLabel: 'wedding',
  eventPluralLabel: 'weddings',
  clientLabel: 'couple',
  clientPluralLabel: 'couples',
  isSample: true,
  links: [],
}

export const juniperPackages: VenuePackage[] = [
  { id: 'js-essential', name: 'Essential Celebration', price: 3900, duration: '8 hours', maxGuests: 80, tier: 1, description: 'A streamlined ceremony and reception package for intimate-to-mid-size celebrations.', highlights: ['Glass Hall reception', 'Courtyard ceremony option', 'Tables + chairs', 'Core design collection'] },
  { id: 'js-signature', name: 'Signature Estate', price: 6500, duration: '12 hours', maxGuests: 150, tier: 2, description: 'A full-day estate experience with expanded design inventory and multiple property spaces.', highlights: ['Choice of ceremony areas', 'Glass Hall + Terrace', 'Premium design collection', 'Getting-ready suites'] },
  { id: 'js-weekend', name: 'Estate Weekend', price: 8900, duration: 'Friday – Sunday', maxGuests: 200, tier: 3, description: 'A weekend-style celebration with extended access, rehearsal time and the complete design library.', highlights: ['Weekend property access', 'Rehearsal gathering', 'Full design library', 'Extended photo access'] },
]

export const juniperAreas: VenueArea[] = [
  { id: 'glass-hall', name: 'Glass Hall', kind: 'Reception', description: 'Light-filled modern hall for dinner, dancing and reception layouts.', plannerEnabled: true, visual: 'greenhouse' },
  { id: 'stone-courtyard', name: 'Stone Courtyard', kind: 'Ceremony', description: 'Architectural courtyard with warm stone, greenery and clean sight lines.', plannerEnabled: true, visual: 'gazebo' },
  { id: 'orchard-lawn', name: 'Orchard Lawn', kind: 'Ceremony', description: 'Open lawn framed by trees for outdoor ceremonies and cocktail hour.', plannerEnabled: true, visual: 'oaks' },
  { id: 'copper-terrace', name: 'Copper Terrace', kind: 'Hospitality', description: 'Covered terrace for cocktails, lounge seating and sunset moments.', plannerEnabled: true, visual: 'pavilion' },
  { id: 'reflection-garden', name: 'Reflection Garden', kind: 'Photos', description: 'Landscape-focused portrait area with water, stone and seasonal plantings.', plannerEnabled: true, visual: 'lake' },
]

export const juniperInventory: InventoryItem[] = [
  { id: 'js-oak-arch', name: 'White Oak Ceremony Frame', category: 'Arches', color: 'White oak', quantity: 1, dimensions: '8 ft × 7 ft', storage: 'Design Library · Bay A', description: 'Minimal wood ceremony frame for florals, fabric or standalone use.', imageStyle: 'wood-arbor', featured: true, accessTier: 1 },
  { id: 'js-smoked-vases', name: 'Smoked Glass Bud Vase Set', category: 'Centerpieces', color: 'Smoke / clear', quantity: 40, dimensions: 'Assorted', storage: 'Design Library · Shelf C2', description: 'Mixed-height bud vases for modern table styling.', imageStyle: 'gold-lantern', featured: true, accessTier: 1 },
  { id: 'js-copper-stands', name: 'Copper Floral Stands', category: 'Centerpieces', color: 'Copper', quantity: 16, dimensions: '28 in tall', storage: 'Design Library · Rack B', description: 'Elevated floral stands for guest tables or aisle accents.', imageStyle: 'welcome-easel', accessTier: 2 },
  { id: 'js-lounge', name: 'Slate Lounge Collection', category: 'Furniture', color: 'Slate / oak', quantity: 3, dimensions: 'Modular sets', storage: 'Design Library · Furniture Bay', description: 'Modern lounge seating for cocktail hour and reception zones.', imageStyle: 'antique-sofa', featured: true, accessTier: 2 },
  { id: 'js-ribbed-wall', name: 'Ribbed Ivory Backdrop', category: 'Backdrops', color: 'Ivory', quantity: 1, dimensions: '8 ft × 10 ft', storage: 'Design Library · Backdrop Bay', description: 'Architectural backdrop for sweetheart table, escort display or photo area.', imageStyle: 'green-wall', accessTier: 2 },
  { id: 'js-hurricanes', name: 'Glass Hurricane Collection', category: 'Lighting', color: 'Clear / ivory', quantity: 36, dimensions: 'Assorted', storage: 'Design Library · Shelf D1', description: 'Battery-candle hurricane vessels for tables and aisle styling.', imageStyle: 'chandelier', accessTier: 1 },
  { id: 'js-linen', name: 'Stone Linen Collection', category: 'Linens', color: 'Stone / sand', quantity: 30, dimensions: 'Assorted tables', storage: 'Textile Room · Rack 2', description: 'Soft neutral linen collection included with the full design tier.', imageStyle: 'ivory-linens', accessTier: 3 },
  { id: 'js-floral', name: 'Seasonal Neutral Floral Set', category: 'Florals', color: 'Ivory / sage', quantity: 14, dimensions: 'Assorted', storage: 'Design Library · Floral Room', description: 'Sample floral collection for previewing premium styling.', imageStyle: 'white-florals', accessTier: 3 },
]


export const foundryRivergate: VenueProfile = {
  id: 'venue-foundry-rivergate',
  slug: 'foundry-rivergate',
  name: 'The Foundry at Rivergate',
  shortName: 'The Foundry',
  tagline: 'Flexible industrial spaces for meetings, galas, launches and celebrations.',
  website: '',
  address: 'Showcase venue · Louisville, Kentucky',
  phone: '(555) 014-0418',
  email: 'events@foundryrivergate.example',
  ownerName: 'Alex Morgan',
  brandPrimary: '#26333d',
  brandAccent: '#55a7b8',
  logoText: 'FR',
  brandSurface: '#edf3f5',
  brandText: '#1f2d36',
  locationLabel: 'Louisville, Kentucky',
  inventoryLabel: 'Event Resource Library',
  previewLabel: 'The Foundry',
  venueTypeLabel: 'Multi-purpose event venue',
  eventLabel: 'event',
  eventPluralLabel: 'events',
  clientLabel: 'client',
  clientPluralLabel: 'clients',
  portalHeroTitle: 'Plan every event from room setup to final handoff.',
  portalHeroBody: 'Coordinate meetings, galas, launches and celebrations with room layouts, equipment, media, messages and a private client workspace.',
  isSample: true,
  links: [],
}

export const foundryPackages: VenuePackage[] = [
  { id: 'fr-meeting', name: 'Day Meeting', price: 1800, duration: '8 hours', maxGuests: 120, tier: 1, description: 'A focused daytime package for meetings, trainings and workshops.', highlights: ['Main Hall or Studio A', 'Core tables + chairs', 'Presentation equipment', 'Client planning portal'] },
  { id: 'fr-signature', name: 'Signature Event', price: 4200, duration: '12 hours', maxGuests: 250, tier: 2, description: 'Expanded access for galas, launches, reunions and large private events.', highlights: ['Main Hall + Gallery', 'Expanded furniture library', 'Stage + AV options', 'Two setup windows'] },
  { id: 'fr-buyout', name: 'Full Venue Buyout', price: 7500, duration: 'Full day', maxGuests: 400, tier: 3, description: 'Whole-property access for conferences, fundraisers and large-scale productions.', highlights: ['All event spaces', 'Full resource library', 'Rooftop access', 'Extended setup + breakdown'] },
]

export const foundryAreas: VenueArea[] = [
  { id: 'fr-main-hall', name: 'Main Hall', kind: 'Reception', description: 'Large industrial hall for conferences, galas, dinners, exhibits and stage programs.', plannerEnabled: true, visual: 'pavilion' },
  { id: 'fr-studio-a', name: 'Studio A', kind: 'Reception', description: 'Flexible breakout room for meetings, workshops, lounges and smaller events.', plannerEnabled: true, visual: 'greenhouse' },
  { id: 'fr-gallery', name: 'Gallery', kind: 'Hospitality', description: 'Entry and pre-function space for registration, cocktail hour, exhibits and sponsor displays.', plannerEnabled: true, visual: 'gazebo' },
  { id: 'fr-rooftop', name: 'Rivergate Rooftop', kind: 'Hospitality', description: 'Open-air rooftop for receptions, networking and sunset gatherings.', plannerEnabled: true, visual: 'lake' },
  { id: 'fr-boardroom', name: 'Boardroom', kind: 'Photos', description: 'Private meeting and green-room space for speakers, planners or VIP groups.', plannerEnabled: true, visual: 'pool' },
]

export const foundryInventory: InventoryItem[] = [
  { id: 'fr-stage', name: 'Modular Stage Risers', category: 'Specialty', color: 'Black', quantity: 12, dimensions: '4 ft × 8 ft sections', storage: 'Equipment Room · Bay A', description: 'Configurable stage sections for keynotes, panels, awards and entertainment.', imageStyle: 'ribbed-wall', featured: true, accessTier: 2 },
  { id: 'fr-podium', name: 'Presentation Podium', category: 'Furniture', color: 'Charcoal / oak', quantity: 2, dimensions: 'Standard lectern', storage: 'AV Room · Rack 1', description: 'Modern lectern for meetings, ceremonies and presentations.', imageStyle: 'welcome-easel', featured: true, accessTier: 1 },
  { id: 'fr-cocktail', name: 'Cocktail Table Set', category: 'Furniture', color: 'Black', quantity: 30, dimensions: '30 in round', storage: 'Furniture Bay · Row C', description: 'Standing-height cocktail tables for networking and pre-function spaces.', imageStyle: 'antique-sofa', accessTier: 1 },
  { id: 'fr-drape', name: 'Black Pipe & Drape', category: 'Backdrops', color: 'Black', quantity: 16, dimensions: '10 ft sections', storage: 'Equipment Room · Wall Rack', description: 'Flexible room division and backdrop system for exhibits, stages and service areas.', imageStyle: 'green-wall', accessTier: 1 },
  { id: 'fr-uplights', name: 'Wireless LED Uplights', category: 'Lighting', color: 'RGB / tunable white', quantity: 36, dimensions: 'Battery fixtures', storage: 'AV Room · Charging Rack', description: 'Wireless architectural uplighting for brand colors, galas and evening events.', imageStyle: 'chandelier', featured: true, accessTier: 2 },
  { id: 'fr-lounge', name: 'Modular Lounge Collection', category: 'Furniture', color: 'Slate / navy', quantity: 4, dimensions: 'Modular sets', storage: 'Furniture Bay · Row A', description: 'Contemporary lounge groupings for networking, VIP and sponsor areas.', imageStyle: 'antique-sofa', accessTier: 2 },
  { id: 'fr-easels', name: 'Display Easel Set', category: 'Signs', color: 'Black', quantity: 12, dimensions: 'Floor standing', storage: 'Resource Library · Shelf B', description: 'Sign and display stands for agendas, sponsor boards, seating plans and wayfinding.', imageStyle: 'welcome-easel', accessTier: 1 },
  { id: 'fr-linens', name: 'Black Linen Collection', category: 'Linens', color: 'Black', quantity: 40, dimensions: 'Assorted table sizes', storage: 'Textile Room · Rack 1', description: 'Neutral event linen collection for meetings, galas and private functions.', imageStyle: 'ivory-linens', accessTier: 3 },
]

export const chandelierConfig: VenueConfig = {
  profile: chandelierOaks,
  packages: chandelierPackages,
  areas: chandelierAreas,
  inventory: chandelierInventory,
  ownerAccessCode: '123456',
  oneEventPerDate: true,
  ownerDashboardNote: 'One wedding per day. Chandelier Oaks also publishes a 25% signing payment followed by installments 270, 180 and 60 days before the event.',
}

export const juniperConfig: VenueConfig = {
  profile: juniperStone,
  packages: juniperPackages,
  areas: juniperAreas,
  inventory: juniperInventory,
  ownerAccessCode: '246810',
  oneEventPerDate: true,
  ownerDashboardNote: 'Showcase venue rule: one wedding per calendar date.',
}

export const foundryConfig: VenueConfig = {
  profile: foundryRivergate,
  packages: foundryPackages,
  areas: foundryAreas,
  inventory: foundryInventory,
  ownerAccessCode: '975310',
  oneEventPerDate: true,
  ownerDashboardNote: 'Showcase venue rule: one primary event booking per calendar date.',
}

export const venueConfigs: VenueConfig[] = [chandelierConfig, juniperConfig, foundryConfig]
export const venueProfiles = venueConfigs.map((item) => item.profile)

export const tierLabel: Record<PackageTier, string> = {
  1: 'Core collection',
  2: 'Premium collection',
  3: 'Top-tier collection',
}

export function venueConfigById(id: string) {
  return venueConfigs.find((item) => item.profile.id === id) ?? venueConfigs[0]
}

export function venueConfigBySlug(slug: string) {
  return venueConfigs.find((item) => item.profile.slug === slug) ?? venueConfigs[0]
}

export function packageById(id: string, venueId = chandelierOaks.id) {
  const config = venueConfigById(venueId)
  return config.packages.find((item) => item.id === id) ?? config.packages[0]
}

export function areaById(id: string, venueId = chandelierOaks.id) {
  const config = venueConfigById(venueId)
  return config.areas.find((item) => item.id === id) ?? config.areas[0]
}

export function itemAllowedForTier(item: InventoryItem, tier: PackageTier) {
  return item.accessTier <= tier
}

// Legacy aliases kept for Chandelier Oaks-specific components while v1.5 moves the app to multi-venue data.
export const packages = chandelierPackages
export const venueAreas = chandelierAreas
export const inventory = chandelierInventory
