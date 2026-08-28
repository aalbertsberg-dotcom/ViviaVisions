import { supabase } from '../supabase'

export type PermissionSelfTestRow = {
  checkName: string
  passed: boolean
  visibleCount: number
  expectedCount: number
  roleName: string
}

export type ProductionSecurityAuditRow = {
  checkName: string
  passed: boolean
  issueCount: number
  detail: string
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export async function runPermissionSelfTest(): Promise<PermissionSelfTestRow[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('permission_self_test')
  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => ({
    checkName: String(row.check_name ?? ''),
    passed: Boolean(row.passed),
    visibleCount: Number(row.visible_count ?? 0),
    expectedCount: Number(row.expected_count ?? 0),
    roleName: String(row.role_name ?? 'authenticated'),
  }))
}

export async function runPlatformSecurityAudit(): Promise<ProductionSecurityAuditRow[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('production_security_audit')
  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => ({
    checkName: String(row.check_name ?? ''),
    passed: Boolean(row.passed),
    issueCount: Number(row.issue_count ?? 0),
    detail: String(row.detail ?? ''),
  }))
}