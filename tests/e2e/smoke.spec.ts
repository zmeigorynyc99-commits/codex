import { test, expect } from '@playwright/test';

test.describe('home page', () => {
  test('loads and shows the hero and tools', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Tiny Tools' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Percentage Calculator/i }).first()).toBeVisible();
  });

  test('search filters the tool list', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Search for a tool/i).fill('password');
    await expect(page.getByRole('link', { name: /Password Generator/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Percentage Calculator/i })).toHaveCount(0);
  });

  test('shows an empty state for no matches', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Search for a tool/i).fill('zzzznotarealtool');
    await expect(page.getByText(/No tools found/i)).toBeVisible();
  });
});

test.describe('SEO essentials', () => {
  test('robots.txt and sitemap.xml are served', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain('Sitemap');

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain('/tools/percentage-calculator');
  });

  test('tool page has canonical, title and JSON-LD', async ({ page }) => {
    await page.goto('/tools/percentage-calculator');
    await expect(page).toHaveTitle(/Percentage Calculator/i);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /\/tools\/percentage-calculator$/);
    await expect(page.locator('script[type="application/ld+json"]').first()).toHaveCount(1);
  });

  test('security headers are present', async ({ request }) => {
    const response = await request.get('/tools/percentage-calculator');
    const headers = response.headers();
    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
  });
});

test.describe('tool interactions', () => {
  test('percentage calculator computes a result', async ({ page }) => {
    await page.goto('/tools/percentage-calculator');
    // Default inputs are 20 and 80 -> 16.
    await expect(page.getByText('16', { exact: false }).first()).toBeVisible();
  });

  test('password generator produces a password and copies it', async ({ page }) => {
    await page.goto('/tools/password-generator');
    const output = page.getByLabel('Generated password');
    await expect(output).not.toHaveText('—');
    await page.getByRole('button', { name: /Regenerate/i }).click();
    await expect(output).not.toHaveText('—');
  });

  test('base64 encodes text', async ({ page }) => {
    await page.goto('/tools/base64-encoder-decoder');
    await page.getByLabel('Input').fill('Hello, world!');
    await expect(page.getByLabel('Output')).toHaveValue('SGVsbG8sIHdvcmxkIQ==');
  });

  test('JSON formatter validates input', async ({ page }) => {
    await page.goto('/tools/json-formatter');
    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(page.getByText(/Valid JSON/i)).toBeVisible();
  });
});

test.describe('dark mode', () => {
  test('toggles the theme class', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const before = await html.getAttribute('class');
    await page.getByRole('button', { name: /Toggle dark mode/i }).click();
    const after = await html.getAttribute('class');
    expect(before).not.toBe(after);
  });
});

test.describe('navigation', () => {
  test('footer legal pages are reachable', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeVisible();
  });
});
