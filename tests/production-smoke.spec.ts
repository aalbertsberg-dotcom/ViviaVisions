import { expect, test } from '@playwright/test'

test('Chandelier Oaks separates real client sign-in from showcase demos', async ({ page }) => {
  await page.goto('/#/venue/chandelier-oaks')

  await expect(page.getByRole('heading', { name: /Plan your event at Chandelier Oaks/i })).toBeVisible()
  await expect(page.getByTestId('real-client-portal')).toBeVisible()

  const showcase = page.getByTestId('demo-showcase')
  await expect(showcase).toBeVisible()
  await expect(showcase).toContainText('Sarah & John')
  await expect(showcase).toContainText('Ashley & Mark')
  await expect(showcase).toContainText('Jennifer & Matt')
  await expect(showcase).toContainText('111111')
  await expect(showcase).toContainText('222222')
  await expect(showcase).toContainText('333333')

  await page.getByTestId('real-client-portal').click()
  await expect(page).toHaveURL(/#\/venue\/chandelier-oaks\/couple$/)
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()
  await expect(page.getByText(/email address from your invitation/i).first()).toBeVisible()
  await expect(page.getByText('Demo Events')).toHaveCount(0)
})

test('direct Chandelier Oaks demo access remains available', async ({ page }) => {
  await page.goto('/#/venue/chandelier-oaks/couple/sarah-john')
  await expect(page.getByRole('heading', { name: 'Sarah & John' })).toBeVisible()
  await expect(page.getByText(/Demo code:/)).toContainText('111111')
  await expect(page.getByRole('button', { name: /Enter demo workspace/i })).toBeVisible()
})

test('public pages do not overflow horizontally', async ({ page }) => {
  for (const route of ['/#/', '/#/venue/chandelier-oaks', '/#/venue/chandelier-oaks/couple']) {
    await page.goto(route)
    const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    expect(fitsViewport, `${route} should fit the viewport`).toBe(true)
  }
})
test('sign-in choices include VV Admin and admin password recovery', async ({ page }) => {
  await page.goto('/#/signin')
  await expect(page.getByRole('heading', { name: /Choose how you’re signing in/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'ViviaVisions Admin' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /owner \/ staff/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /My Chandelier Oaks wedding/i })).toBeVisible()

  await page.getByTestId('platform-admin-signin').click()
  await expect(page).toHaveURL(/#\/platform$/)
  await expect(page.getByRole('heading', { name: /Administrator sign in/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeVisible()
  await expect(page.getByText(/Create account/i)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Back to sign-in options/i })).toBeVisible()
})
test('legal pages and copyright footer are public', async ({ page }) => {
  await page.goto('/#/')
  await expect(page.getByText('© 2026 ViviaVisions. All rights reserved.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Terms', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Privacy', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Customer Agreement', exact: true })).toBeVisible()

  await page.goto('/#/terms')
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible()
  await page.goto('/#/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
  await page.goto('/#/customer-agreement')
  await expect(page.getByRole('heading', { name: 'Venue & Planner Customer Agreement' })).toBeVisible()
  await expect(page.getByText('Before a paid customer signs')).toHaveCount(0)
  await expect(page.getByText('Order Form acceptance language')).toHaveCount(0)
  await expect(page.getByText('Customer legal name')).toHaveCount(0)
})

test('Chandelier Oaks owner sign-in includes password recovery', async ({ page }) => {
  await page.goto('/#/venue/chandelier-oaks/admin')
  await expect(page.getByRole('heading', { name: /Chandelier Oaks owner portal/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeVisible()
})
test('Chandelier Oaks shows partner placeholders', async ({ page }) => {
  await page.goto('/#/venue/chandelier-oaks')
  const partners = page.getByTestId('vendor-partners')
  await expect(partners).toBeVisible()
  await expect(partners.getByText('Southern Lux Rentals')).toBeVisible()
  await expect(partners.getByText('Party Girls')).toBeVisible()
  await expect(partners.getByText('Photo Booth Partner')).toBeVisible()
})
test('partner cards open details', async ({ page }) => {
  await page.goto('/#/venue/chandelier-oaks')
  const partners = page.getByTestId('vendor-partners')
  await partners.getByRole('button', { name: 'View Southern Lux Rentals partner details' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Southern Lux Rentals' })).toBeVisible()
  await expect(page.getByText('Founding ViviaVisions partner')).toBeVisible()
})

test('platform analytics separates site traffic from partner analytics', async ({ page }) => {
  await page.goto('/#/platform')
  await expect(page.getByText('ViviaVisions site analytics')).toHaveCount(0)
})