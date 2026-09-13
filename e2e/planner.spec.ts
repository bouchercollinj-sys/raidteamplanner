import { expect, test } from '@playwright/test'

test('builds, moves, shares, and restores a raid', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://127.0.0.1:43127',
  })
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Build the raid around the people.' }),
  ).toBeVisible()
  await page.waitForLoadState('networkidle')

  await page
    .getByTitle('Add Shadow Priest')
    .evaluate((button: HTMLButtonElement) => button.click())
  await expect(page.getByLabel('Player name')).toHaveCount(1)
  await page
    .getByTitle('Add Holy Priest')
    .evaluate((button: HTMLButtonElement) => button.click())
  await expect(page.getByLabel('Player name')).toHaveCount(2)

  const playerNames = page.getByLabel('Player name')
  await playerNames.nth(0).fill('Shadowmoon')
  await playerNames.nth(1).fill('Lightbringer')

  const groups = page.locator('.raid-group')
  const sourceHandle = groups.nth(0).locator('.drag-handle').first()
  const targetSlot = groups.nth(1).locator('.empty-slot').first()
  const sourceBox = await sourceHandle.boundingBox()
  const targetBox = await targetSlot.boundingBox()

  expect(sourceBox).not.toBeNull()
  expect(targetBox).not.toBeNull()

  await page.mouse.move(
    sourceBox!.x + sourceBox!.width / 2,
    sourceBox!.y + sourceBox!.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    sourceBox!.x + sourceBox!.width / 2 + 12,
    sourceBox!.y + sourceBox!.height / 2,
    { steps: 4 },
  )
  await expect(page.locator('.drag-preview')).toBeVisible()
  await page.mouse.move(
    targetBox!.x + targetBox!.width / 2,
    targetBox!.y + targetBox!.height / 2,
    { steps: 16 },
  )
  await expect(targetSlot).toHaveAttribute('data-over', 'true')
  await page.mouse.up()

  await expect(groups.nth(0).locator('input[value="Shadowmoon"]')).toHaveCount(
    0,
  )
  await expect(
    groups.nth(0).locator('input[value="Lightbringer"]'),
  ).toBeVisible()
  await expect(groups.nth(1).locator('input[value="Shadowmoon"]')).toBeVisible()
  await expect(groups.nth(1).getByText('Vampiric Touch')).toBeVisible()

  await page.getByRole('button', { name: 'Copy share link' }).click()
  await expect(page.getByRole('button', { name: 'Link copied' })).toBeVisible()

  const sharedUrl = page.url()
  expect(sharedUrl).toContain('?raid=')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    sharedUrl,
  )

  await page.goto('about:blank')
  await page.goto(sharedUrl)

  await expect(
    groups.nth(0).locator('input[value="Lightbringer"]'),
  ).toBeVisible()
  await expect(groups.nth(1).locator('input[value="Shadowmoon"]')).toBeVisible()
  await expect(groups.nth(1).getByText('Vampiric Touch')).toBeVisible()
})
