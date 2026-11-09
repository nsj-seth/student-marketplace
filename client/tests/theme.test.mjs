import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const init = readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

function boot(preference, systemDark, blocked = false) {
  const classes = new Set();
  const root = { dataset: {}, style: {}, classList: {
    toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
  } };
  const meta = { setAttribute(name, value) { this[name] = value; } };
  vm.runInNewContext(init, {
    localStorage: { getItem() { if (blocked) throw new Error('Storage disabled'); return preference; } },
    window: { matchMedia: () => ({ matches: systemDark }) },
    document: { documentElement: root, querySelector: () => meta }
  });
  return { theme: root.dataset.theme, dark: classes.has('dark'), colorScheme: root.style.colorScheme, chrome: meta.content };
}

test('first paint follows the system when there is no valid saved preference', () => {
  for (const preference of [null, 'invalid']) {
    assert.equal(boot(preference, true).theme, 'dark');
    assert.equal(boot(preference, false).theme, 'light');
  }
});

test('explicit light and dark choices override the system and theme browser controls', () => {
  assert.deepEqual(boot('light', true), { theme: 'light', dark: false, colorScheme: 'light', chrome: '#f8f9fc' });
  assert.deepEqual(boot('dark', false), { theme: 'dark', dark: true, colorScheme: 'dark', chrome: '#111522' });
});

test('disabled storage still initializes without crashing', () => {
  assert.equal(boot(null, true, true).theme, 'dark');
  assert.equal(boot(null, false, true).theme, 'light');
});

function palette(selector) {
  const body = css.slice(css.indexOf(selector)).split('{')[1].split('}')[0];
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/g)].map((m) => [m[1], m[2]]));
}
function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((v) => parseInt(v, 16) / 255)
    .map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return channels.reduce((total, v, i) => total + v * [0.2126, 0.7152, 0.0722][i], 0);
}
function contrast(a, b) {
  const [lo, hi] = [luminance(a), luminance(b)].sort((a, b) => a - b);
  return (hi + 0.05) / (lo + 0.05);
}
const light = palette(':root {');
const dark = { ...light, ...palette(':root.dark {') };
for (const [name, colors] of Object.entries({ light, dark })) {
  test(`${name} mode: text, buttons, alerts, and hero colours meet 4.5:1 contrast`, () => {
    function check(foreground, background, minimum = 4.5) {
      const ratio = contrast(colors[foreground], colors[background]);
      assert.ok(ratio >= minimum, `${name}: ${foreground} on ${background} = ${ratio.toFixed(2)}:1; requires ${minimum}:1`);
    }
    for (const background of ['ds-background', 'ds-card', 'ds-muted', 'ds-secondary', 'ds-accent']) {
      check('ds-foreground', background, 7);
      check('ds-muted-foreground', background);
      check('ds-primary-text', background);
      for (const status of ['danger', 'success', 'warning', 'info']) check(`ds-${status}-foreground`, background);
    }
    check('ds-primary-foreground', 'ds-primary');
    check('ds-primary-foreground', 'ds-destructive');
    check('ds-secondary-foreground', 'ds-secondary');
    check('ds-accent-foreground', 'ds-accent');
    for (const status of ['danger', 'success', 'warning', 'info']) {
      check(`ds-${status}-foreground`, `ds-${status}-soft`);
      check('ds-primary-foreground', `ds-${status}-strong`);
    }
    // Check the full gradient, including its glow, rather than just one endpoint.
    for (const from of ['hero-start', 'hero-glow']) {
      for (let step = 0; step <= 10; step++) {
        const toRgb = (hex) => hex.slice(1).match(/../g).map((v) => parseInt(v, 16));
        const [a, b] = [toRgb(colors[from]), toRgb(colors['hero-end'])];
        const bg = '#' + a.map((v, i) => Math.round(v + (b[i] - v) * step / 10).toString(16).padStart(2, '0')).join('');
        for (const foreground of ['hero-foreground', 'hero-muted', 'hero-accent']) {
          assert.ok(contrast(colors[foreground], bg) >= 4.5, `${name}: ${foreground} at gradient step ${step}`);
        }
      }
    }
    check('ds-input', 'ds-card', 3);
    check('ds-ring', 'ds-background', 3);
  });
}
