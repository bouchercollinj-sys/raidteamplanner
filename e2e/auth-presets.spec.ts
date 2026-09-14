import { expect, test } from '@playwright/test'

test('creates a profile, saves and loads a raid, then signs out', async ({
  page,
}) => {
  const email = `raider-${Date.now()}@example.com`

  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Build the raid around the people.' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Create profile' }).click()

  await page.getByLabel('Display name').fill('Raider')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('raidpass1')
  await page.getByRole('button', { name: 'Create profile' }).click()

  await expect(page.getByRole('link', { name: 'Raider' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

  await page
    .getByTitle('Add Shadow Priest')
    .evaluate((button: HTMLButtonElement) => button.click())
  await expect(page.getByLabel('Player name')).toHaveCount(1)

  await page.getByRole('button', { name: 'Save raid' }).click()
  await page.getByLabel('Preset name').fill('Kara night')
  await page.getByRole('button', { name: 'Save this raid' }).click()
  await expect(page.getByText('Saved “Kara night”.')).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  await page.reload()
  await expect(page.getByRole('link', { name: 'Raider' })).toBeVisible()
  await page.getByRole('link', { name: 'Raider' }).click()
  await expect(page.getByRole('heading', { name: 'Saved raids' })).toBeVisible()
  await expect(page.getByText('Kara night')).toBeVisible()
  await page.getByRole('link', { name: 'Load' }).click()
  await expect(page.getByLabel('Player name')).toHaveCount(1)
  await expect(page).toHaveURL(/raid=/)

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Saved raids' })).toHaveCount(0)

  await page.getByRole('link', { name: 'Sign in' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('raidpass1')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('link', { name: 'Raider' })).toBeVisible()
  await page.getByRole('link', { name: 'Raider' }).click()
  await expect(page.getByText('Kara night')).toBeVisible()
})
