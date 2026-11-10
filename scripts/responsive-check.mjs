/**
 * Responsive smoke: login + visit routes at multiple viewports; report overflow & console errors.
 */
export default async function run(page, ui) {
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ];

  const opsRoutes = [
    '/dashboard',
    '/vehicles',
    '/routes',
    '/coverage',
    '/dry-waste-centres',
    '/complaints',
    '/sweeping',
    '/dashcam',
    '/feedback',
    '/scorecards',
    '/reports',
    '/assistant',
    '/notifications',
    '/settings',
  ];

  const citizenRoutes = [
    '/citizen',
    '/citizen/track',
    '/citizen/report',
    '/citizen/reports',
    '/citizen/calendar',
    '/citizen/pickup',
    '/citizen/settings',
    '/notifications',
  ];

  const results = [];

  async function measureOverflow() {
    return page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const clientWidth = doc.clientWidth;
      const overflowX = scrollWidth - clientWidth;
      const offenders = [];
      document.querySelectorAll('main *, .bbmp-page *, header *, [class*="MuiToolbar"] *').forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        const r = el.getBoundingClientRect();
        if (r.width > clientWidth + 2 && r.right > clientWidth + 8) {
          const tag = el.tagName.toLowerCase();
          const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : '';
          offenders.push(`${tag}.${cls}`.slice(0, 80));
        }
      });
      return {
        overflowX,
        clientWidth,
        scrollWidth,
        title: document.title,
        path: location.pathname,
        h1: document.querySelector('h1')?.textContent?.trim() || null,
        offenders: [...new Set(offenders)].slice(0, 8),
      };
    });
  }

  async function login(username, password) {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('input', { timeout: 15000 });
    const inputs = page.locator('input');
    const count = await inputs.count();
    // Prefer labeled fields
    const userField = page.getByLabel(/username|user|email/i).first();
    const passField = page.getByLabel(/password/i).first();
    if (await userField.count()) {
      await userField.fill(username);
      await passField.fill(password);
    } else if (count >= 2) {
      await inputs.nth(0).fill(username);
      await inputs.nth(1).fill(password);
    } else {
      throw new Error('Login fields not found');
    }
    const submit = page.getByRole('button', { name: /sign in|login|log in/i }).first();
    if (await submit.count()) await submit.click();
    else await page.keyboard.press('Enter');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  }

  async function logout() {
    await page.evaluate(() => {
      localStorage.removeItem('bbmp-one-app-session');
    });
  }

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    await logout();
    await login('admin', 'admin123');
    for (const route of opsRoutes) {
      await page.goto(`http://localhost:5173${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(450);
      const m = await measureOverflow();
      const cons = await page.evaluate(() => window.__bbmpErrors || []);
      results.push({
        role: 'admin',
        viewport: vp.name,
        route,
        overflowX: m.overflowX,
        h1: m.h1,
        offenders: m.offenders,
        ok: m.overflowX <= 8 && !!m.h1,
      });
    }

    // Impact is admin-only
    await page.goto('http://localhost:5173/impact', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(400);
    const impact = await measureOverflow();
    results.push({
      role: 'admin',
      viewport: vp.name,
      route: '/impact',
      overflowX: impact.overflowX,
      h1: impact.h1,
      offenders: impact.offenders,
      ok: impact.overflowX <= 8 && !!impact.h1,
    });

    await logout();
    await login('citizen', 'citizen123');
    for (const route of citizenRoutes) {
      await page.goto(`http://localhost:5173${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(450);
      const m = await measureOverflow();
      results.push({
        role: 'citizen',
        viewport: vp.name,
        route,
        overflowX: m.overflowX,
        h1: m.h1,
        offenders: m.offenders,
        ok: m.overflowX <= 8 && !!m.h1,
      });
    }

    await logout();
    await login('supervisor', 'supervisor123');
    for (const route of ['/dashboard', '/complaints', '/notifications', '/vehicles']) {
      await page.goto(`http://localhost:5173${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(400);
      const m = await measureOverflow();
      results.push({
        role: 'supervisor',
        viewport: vp.name,
        route,
        overflowX: m.overflowX,
        h1: m.h1,
        offenders: m.offenders,
        ok: m.overflowX <= 8 && !!m.h1,
      });
    }
  }

  const failed = results.filter((r) => !r.ok);
  return {
    total: results.length,
    passed: results.filter((r) => r.ok).length,
    failed: failed.length,
    failures: failed.slice(0, 40),
    samplePass: results.filter((r) => r.ok).slice(0, 5),
  };
}
