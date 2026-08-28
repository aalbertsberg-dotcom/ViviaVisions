const chandelierDemoSlugs = new Set([
  'sarah-john',
  'ashley-mark',
  'jennifer-matt',
])

export function isDemoClientWorkspace(venueSlug: string, accessSlug: string) {
  if (venueSlug !== 'chandelier-oaks') return true
  return chandelierDemoSlugs.has(accessSlug)
}

export function usesRealClientAuthentication(venueSlug: string, accessSlug: string) {
  return venueSlug === 'chandelier-oaks' && !chandelierDemoSlugs.has(accessSlug)
}