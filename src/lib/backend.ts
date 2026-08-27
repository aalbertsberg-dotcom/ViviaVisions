import { isSupabaseConfigured } from './supabase'

export type BackendMode = 'demo' | 'supabase'

export const backendMode: BackendMode = isSupabaseConfigured ? 'supabase' : 'demo'

export const backendStatus = {
  mode: backendMode,
  configured: isSupabaseConfigured,
  label: isSupabaseConfigured ? 'Supabase connected' : 'Local demo data',
}
