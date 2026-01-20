import { test, expect } from '@playwright/test'

test('homepage has correct title and content', async ({ page }) => {
  // #given
  await page.goto('/')

  // #when
  const heading = page.getByRole('heading', { level: 1 })
  const ctaButton = page.getByRole('button', { name: /start now/i })

  // #then
  await expect(heading).toBeVisible()
  await expect(heading).toContainText(/patent similarity search/i)
  await expect(ctaButton).toBeVisible()
})
