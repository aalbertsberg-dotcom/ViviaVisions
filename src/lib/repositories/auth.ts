import { supabase } from '../supabase'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.')
  return supabase
}

export async function signInWithPassword(email: string, password: string) {
  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}

export async function sendPasswordReset(email: string, redirectTo?: string) {
  const client = requireSupabase()
  const { data, error } = await client.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined)
  if (error) throw error
  return data
}
