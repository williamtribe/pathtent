import { test, expect } from '@playwright/test'

test('hello world e2e test - English', async ({ page }) => {
  // #given
  await page.goto('/en')

  // #when
  const heading = page.getByRole('heading', { level: 1 })
  const ctaButton = page.getByRole('button', { name: /start now/i })

  // #then
  await expect(heading).toBeVisible()
  await expect(heading).toContainText(/patent similarity search/i)
  await expect(ctaButton).toBeVisible()
})

test('hello world e2e test - Korean', async ({ page }) => {
  // #given
  await page.goto('/ko')

  // #when
  const heading = page.getByRole('heading', { level: 1 })
  const ctaButton = page.getByRole('button', { name: '지금 시작하기' })

  // #then
  await expect(heading).toBeVisible()
  await expect(heading).toContainText(/특허 유사도 검색/i)
  await expect(ctaButton).toBeVisible()
})

test('root path serves default locale content', async ({ page }) => {
  // #given #when
  await page.goto('/')

  // #then
  const heading = page.getByRole('heading', { level: 1 })
  await expect(heading).toBeVisible()
  await expect(heading).toContainText(/patent similarity search/i)
})
