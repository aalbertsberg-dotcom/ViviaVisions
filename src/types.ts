export type Category =
  | 'Furniture'
  | 'Arches'
  | 'Backdrops'
  | 'Lighting'
  | 'Florals'
  | 'Linens'
  | 'Centerpieces'
  | 'Signs'
  | 'Specialty'
  | 'Ceremony'
  | 'Miscellaneous'

export type PackageTier = 1 | 2 | 3

export type InventoryItem = {
  id: string
  name: string
  category: Category
  color: string
  quantity: number
  dimensions: string
  storage: string
  description: string
  imageStyle: string
  featured?: boolean
  accessTier: PackageTier
  packageNote?: string
}

export type VenuePackage = {
  id: string
  name: string
  price: number
  duration: string
  maxGuests: number | null
  tier: PackageTier
  description: string
  highlights: string[]
}

export type VenueArea = {
  id: string
  name: string
  kind: 'Ceremony' | 'Reception' | 'Photos' | 'Hospitality'
  description: string
  plannerEnabled: boolean
  visual: string
}

export type VenueLink = {
  label: string
  url: string
  kind: 'website' | 'social' | 'resource'
}

export type VenueProfile = {
  id: string
  slug: string
  name: string
  shortName: string
  tagline: string
  website: string
  address: string
  phone: string
  email: string
  ownerName: string
  brandPrimary: string
  brandAccent: string
  logoText: string
  brandSurface?: string
  brandText?: string
  locationLabel?: string
  inventoryLabel?: string
  previewLabel?: string
  venueTypeLabel?: string
  eventLabel?: string
  eventPluralLabel?: string
  clientLabel?: string
  clientPluralLabel?: string
  portalHeroTitle?: string
  portalHeroBody?: string
  isSample?: boolean
  links?: VenueLink[]
}

export type VenueConfig = {
  profile: VenueProfile
  packages: VenuePackage[]
  areas: VenueArea[]
  inventory: InventoryItem[]
  ownerAccessCode: string
  oneEventPerDate: boolean
  ownerDashboardNote: string
}

export type VenueLead = {
  id: string
  submittedAt: string
  venueName: string
  website: string
  contactName: string
  email: string
  phone: string
  address: string
  eventSpaces: number
  weddingsPerMonth: number
  inventorySize: string
  packages: string
  needs: string[]
  notes: string
  brandPrimary: string
  brandAccent: string
  logoDataUrl?: string
}

export type Selection = {
  itemId: string
  quantity: number
}

export type PlannerObjectType =
  | 'round-table'
  | 'banquet-table'
  | 'chair'
  | 'dance-floor'
  | 'bar'
  | 'cake-table'
  | 'arch'
  | 'decor'

export type PlacedItem = {
  id: string
  type: PlannerObjectType
  x: number
  y: number
  rotation: number
  scale?: number
  label: string
  inventoryItemId?: string
  /** Chairs created by a table's chair slider remain separate objects, but move with this table. */
  parentTableId?: string
  /** Demo planner keeps the area on each item so one wedding can have several separate layouts. */
  areaId?: string
}

export type WeddingProfile = {
  couple: string
  date: string
  guests: number
  notes: string
  packageId: string
  ceremonyArea: string
  receptionArea: string
  primaryEmail: string
  partnerEmail: string
  contractSigned: boolean
  reservationPaid: boolean
}

export type WeddingStatus = 'Ready' | 'Designing' | 'Not started' | 'Cancelled'

export type MessageRole = 'bride' | 'venue'

export type MessageAttachment = {
  id: string
  name: string
  mimeType: string
  size: number
  dataUrl: string
}

export type MessageContext =
  | { kind: 'inventory'; id: string; label: string }
  | { kind: 'area'; id: string; label: string }

export type WeddingMessage = {
  id: string
  senderRole: MessageRole
  senderName: string
  body: string
  timestamp: string
  attachments: MessageAttachment[]
  context?: MessageContext
  readByBride: boolean
  readByVenue: boolean
}

export type WeddingWorkspace = {
  id: string
  venueId: string
  accessSlug: string
  accessCode: string
  status: WeddingStatus
  profile: WeddingProfile
  selections: Selection[]
  placedItems: PlacedItem[]
  messages: WeddingMessage[]
  paymentStepsCompleted: number
  /** Soft-deleted workspaces remain recoverable during the retention window. */
  deletedAt?: string
}

export type MediaScope = 'venue' | 'wedding'
export type MediaType = 'image' | 'video' | 'document'
export type MediaPurpose = 'venue-reference' | 'walkthrough' | 'inspiration' | 'document' | 'inventory' | 'ai-preview'

export type MediaAsset = {
  id: string
  venueId: string
  scope: MediaScope
  weddingId?: string
  name: string
  mimeType: string
  size: number
  mediaType: MediaType
  createdAt: string
  areaId?: string
  inventoryItemId?: string
  purpose: MediaPurpose
  aiReference: boolean
}

export type MediaAssetRecord = MediaAsset & {
  blob: Blob
}
