import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { runPermissionSelfTest, type PermissionSelfTestRow } from '../lib/repositories/security'

function roleLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function AccessCheck() {
  const [email, setEmail] = useState('')
  const [rows, setRows] = useState<PermissionSelfTestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true)
    setError('')

    try {
      if (!supabase) throw new Error('Supabase is not configured on this deployment.')
      const { data, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!data.user) throw new Error('Sign in to the account you want to test, then return to this page.')

      setEmail(data.user.email ?? '')
      setRows(await runPermissionSelfTest())
    } catch (checkError) {
      setRows([])
      setError(checkError instanceof Error ? checkError.message : 'Unable to run the access check.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void run()
  }, [])

  const passed = rows.length > 0 && rows.every((row) => row.passed)
  const role = rows[0]?.roleName ?? ''

  return (
    <main className="page-main shell production-check-page">
      <div className="page-heading production-check-heading">
        <div>
          <p className="eyebrow">CURRENT SESSION</p>
          <h1>Account access check</h1>
          <p>Verifies what this signed-in account can actually read through Supabase RLS against what its role is expected to read.</p>
        </div>
        <div className="production-check-heading__actions">
          <button className="button button--primary" type="button" disabled={loading} onClick={() => { void run() }}>{loading ? 'Checking…' : 'Run again'}</button>
          <a className="button button--ghost" href="#/">Home</a>
        </div>
      </div>

      {error && <section className="panel production-check-alert production-check-alert--fail" role="alert"><strong>Access check could not run.</strong><p>{error}</p></section>}

      {!error && !loading && (
        <>
          <section className={`panel production-check-summary ${passed ? 'production-check-summary--pass' : 'production-check-summary--fail'}`}>
            <div>
              <span>{passed ? 'PASS' : 'REVIEW'}</span>
              <strong>{passed ? 'RLS access matches the expected role.' : 'One or more RLS checks do not match the expected role.'}</strong>
            </div>
            <div>
              <small>Signed in as</small>
              <strong>{email}</strong>
              {role && <span className="status-pill">{roleLabel(role)}</span>}
            </div>
          </section>

          <section className="production-check-grid">
            {rows.map((row) => (
              <article className={`panel production-check-card ${row.passed ? 'production-check-card--pass' : 'production-check-card--fail'}`} key={row.checkName}>
                <div className="production-check-card__top">
                  <span>{row.passed ? '✓' : '!'}</span>
                  <strong>{row.checkName}</strong>
                </div>
                <p>Visible: <b>{row.visibleCount}</b> · Expected: <b>{row.expectedCount}</b></p>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  )
}