import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/ping', async (route) => {
    await route.fulfill({ status: 200, body: 'pong' })
  })
  await page.route('**/healthz', async (route) => {
    await route.fulfill({ status: 200, body: 'ok' })
  })
})

test('unauthenticated user cannot open university cabinet', async ({ page }) => {
  await page.route('**/api/v1/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'authentication required' }),
    })
  })

  await page.goto('/university')

  await expect(page.getByText('Access is not available for this route')).toBeVisible()
  await expect(page.getByText('authentication required')).toBeVisible()
})

test('unauthenticated user cannot open student cabinet', async ({ page }) => {
  await page.route('**/api/v1/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'authentication required' }),
    })
  })

  await page.goto('/student')

  await expect(page.getByText('Access is not available for this route')).toBeVisible()
})

test('role mismatch shows unauthorized screen', async ({ page }) => {
  await page.route('**/api/v1/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        subject: 'student-001',
        roles: ['student'],
        studentExternalId: 'student-001',
      }),
    })
  })

  await page.goto('/university')

  await expect(page.getByText('Your current role cannot access this cabinet.')).toBeVisible()
})

test('public HR flow works without auth', async ({ page }) => {
  await page.route('**/api/v1/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'authentication required' }),
    })
  })
  await page.route('**/api/v1/public/verify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        verdict: 'valid',
        verificationToken: 'token-123',
        diplomaNumber: 'D-2026-0042',
        universityCode: 'ITMO',
        ownerNameMask: 'I*** P***',
        program: 'Computer Science',
      }),
    })
  })

  await page.goto('/hr')
  await page.getByPlaceholder('D-2026-0042').fill('D-2026-0042')
  await page.getByPlaceholder('ITMO').fill('ITMO')
  await page.getByRole('button', { name: 'Verify diploma' }).click()

  await expect(page.getByText('Gateway response received')).toBeVisible()
  await expect(page.getByText('I*** P***')).toBeVisible()
})
