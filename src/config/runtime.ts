function configuredPublicBase() {
  const configured = import.meta.env.VITE_PUBLIC_APP_URL?.trim()
  if (configured) return new URL(configured)

  const fallback = new URL(window.location.href)
  fallback.search = ''
  fallback.hash = ''
  return fallback
}

export function buildPublicAppUrl(hashPath = '', query?: Record<string, string>) {
  const url = configuredPublicBase()
  url.search = ''
  url.hash = ''

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value)
    }
  }

  if (hashPath) url.hash = hashPath.startsWith('#') ? hashPath : `#${hashPath}`
  return url.toString()
}