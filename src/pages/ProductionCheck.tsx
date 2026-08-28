import { useEffect, useMemo, useState } from 'react'
import { buildPublicAppUrl } from '../config/runtime'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { runPermissionSelfTest, runPlatformSecurityAudit, type PermissionSelfTestRow, type ProductionSecurityAuditRow } from '../lib/repositories/security'

type ProductionCheckProps = {
  onBack: () => void
}

type RuntimeCheck = {
  name: string
  passed: boolean
  detail: string
}

function roleLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function ProductionCheck({ onBack }: ProductionCheckProps) {
  const [permissionRows, setPermissionRows] = useState<PermissionSelfTestRow[]>([])
  const [auditRows, setAuditRows] = useState<ProductionSecurityAuditRow[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const runtimeChecks = useMemo<RuntimeCheck[]>(() => {
    const local = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    const secure = window.location.protocol === 'https:' || local
    const domain = window.location.hostname === 'viviavisions.com' || local

    return [
      { name: 'HTTPS', passed: secure, detail: secure ? 'Secure origin detected.' : 'Production must use HTTPS.' },
      { name: 'Production domain', passed: domain, detail: local ? 'Local development session.' : window.location.hostname },
      { name: 'Supabase browser client', passed: isSupabaseConfigured, detail: isSupabaseConfigured ? 'Publishable client configuration loaded.' : 'Supabase browser variables are missing.' },
      { name: 'Canonical public URL', passed: buildPublicAppUrl().startsWith('https://viviavisions.com/') || local, detail: buildPublicAppUrl() },
    ]
  }, [])

  const run = async () => {
    setLoading(true)
    setError('')

    try {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { data, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!data.user) throw new Error('Sign in as a ViviaVisions platform administrator first.')

      setEmail(data.user.email ?? '')
      const [permission, audit] = await Promise.all([
        runPermissionSelfTest(),
        runPlatformSecurityAudit(),
      ])
      setPermissionRows(permission)
      setAuditRows(audit)
    } catch (checkError) {
      setPermissionRows([])
      setAuditRows([])
      setError(checkError instanceof Error ? checkError.message : 'Unable to run production checks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void run()
  }, [])

  const runtimePassed = runtimeChecks.every((check) => check.passed)
  const permissionPassed = permissionRows.length > 0 && permissionRows.every((row) => row.passed)
  const auditPassed = auditRows.length > 0 && auditRows.every((row) => row.passed)
  const allPassed = runtimePassed && permissionPassed && auditPassed
  const role = permissionRows[0]?.roleName ?? ''

  return (
    <main className="page-main shell production-check-page">
      <div className="page-heading production-check-heading">
        <div>
          <p className="eyebrow">VIVIAVISIONS ADMIN · PRODUCTION</p>
          <h1>Production check</h1>
          <p>Runtime, tenant-integrity and RLS checks for the live ViviaVisions environment.</p>
        </div>
        <div className="production-check-heading__actions">
          <button className="button button--primary" type="button" disabled={loading} onClick={() => { void run() }}>{loading ? 'Running checks…' : 'Run all checks'}</button>
          <button className="button button--ghost" type="button" onClick={onBack}>Back to admin</button>
        </div>
      </div>

      <section className={`panel production-check-summary ${allPassed ? 'production-check-summary--pass' : 'production-check-summary--fail'}`}>
        <div>
          <span>{allPassed ? 'READY' : loading ? 'CHECKING' : 'REVIEW'}</span>
          <strong>{allPassed ? 'Core production checks are passing.' : 'Review any failed or unavailable check below.'}</strong>
        </div>
        <div>
          <small>Administrator session</small>
          <strong>{email || 'Checking session…'}</strong>
          {role && <span className="status-pill">{roleLabel(role)}</span>}
        </div>
      </section>

      {error && <section className="panel production-check-alert production-check-alert--fail" role="alert"><strong>Database checks could not run.</strong><p>{error}</p><small>Apply migration 009 before using this screen.</small></section>}

      <section className="production-check-section">
        <div className="section-heading production-check-section__heading">
          <div><p className="eyebrow">RUNTIME</p><h2>Deployment basics</h2></div>
        </div>
        <div className="production-check-grid">
          {runtimeChecks.map((check) => (
            <article className={`panel production-check-card ${check.passed ? 'production-check-card--pass' : 'production-check-card--fail'}`} key={check.name}>
              <div className="production-check-card__top"><span>{check.passed ? '✓' : '!'}</span><strong>{check.name}</strong></div>
              <p>{check.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="production-check-section">
        <div className="section-heading production-check-section__heading">
          <div><p className="eyebrow">CURRENT ADMIN SESSION</p><h2>RLS access regression</h2><p className="section-lead">Visible rows are compared with the rows this account is expected to see.</p></div>
          <a className="button button--ghost button--small" href="#/access-check">Open standalone access check</a>
        </div>
        <div className="production-check-grid">
          {permissionRows.map((row) => (
            <article className={`panel production-check-card ${row.passed ? 'production-check-card--pass' : 'production-check-card--fail'}`} key={row.checkName}>
              <div className="production-check-card__top"><span>{row.passed ? '✓' : '!'}</span><strong>{row.checkName}</strong></div>
              <p>Visible: <b>{row.visibleCount}</b> · Expected: <b>{row.expectedCount}</b></p>
            </article>
          ))}
        </div>
      </section>

      <section className="production-check-section">
        <div className="section-heading production-check-section__heading">
          <div><p className="eyebrow">ALL TENANTS</p><h2>Cross-tenant integrity audit</h2><p className="section-lead">Detects venue/event relationships that could mix records between tenants.</p></div>
        </div>
        <div className="production-check-audit">
          {auditRows.map((row) => (
            <article className={`panel production-audit-row ${row.passed ? 'production-audit-row--pass' : 'production-audit-row--fail'}`} key={row.checkName}>
              <span>{row.passed ? '✓' : '!'}</span>
              <div><strong>{row.checkName}</strong><p>{row.detail}</p></div>
              <b>{row.issueCount}</b>
            </article>
          ))}
        </div>
      </section>

      <section className="panel production-role-matrix">
        <div>
          <p className="eyebrow">FINAL ROLE TEST</p>
          <h2>Run the same access check under each real role.</h2>
          <p>Sign in as the venue owner/staff account, primary client and partner client, then open <code>#/access-check</code>. Every row should pass. A revoked client should be unable to reopen the wedding.</p>
        </div>
        <a className="button button--primary" href="#/access-check">Check this account</a>
      </section>
    </main>
  )
}