import copy from './translations.js?v=c881a0c678b6';

const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let storage;
try { storage = localStorage; } catch { /* Storage is optional. */ }
const read = key => { try { return storage?.getItem(key); } catch { return null; } };
const save = (key, value) => { try { storage?.setItem(key, value); } catch { /* Keep working without persistence. */ } };
const country = root.dataset.country;
const knownCountry = /^[A-Z]{2}$/.test(country || '') && !['XX', 'T1'].includes(country);
const savedLanguage = read('jrepas-language-choice');
let language = country === 'HU' ? 'hu'
  : ['hu', 'en'].includes(savedLanguage) ? savedLanguage
  : knownCountry ? 'en' : navigator.language.toLowerCase().startsWith('hu') ? 'hu' : 'en';
const savedTheme = read('jrepas-theme');
let manualTheme = ['dark', 'light'].includes(savedTheme);
let dark = manualTheme ? savedTheme === 'dark' : systemTheme.matches;
let switchTimer;
const text = key => copy[key]?.[language] || '';
const localize = (hu, en) => language === 'hu' ? hu : en;
const setAttribute = (selector, name, value) => document.querySelector(selector)?.setAttribute(name, value);

function updateYear() {
  const label = document.querySelector('[data-current-year]');
  const year = String(new Date().getFullYear());
  if (label && label.textContent !== year) label.textContent = year;
}

function render() {
  root.lang = language;
  root.dataset.theme = dark ? 'dark' : 'light';
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const value = copy[element.dataset.i18n]?.[language];
    if (value !== undefined && element.innerHTML !== value) element.innerHTML = value;
  });
  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  const themeLabel = dark ? localize('Világos mód', 'Light mode') : localize('Sötét mód', 'Dark mode');
  if (themeToggle) {
    themeToggle.dataset.iconTheme = dark ? 'sun' : 'moon';
    themeToggle.setAttribute('aria-label', themeLabel);
    themeToggle.title = themeLabel;
    themeToggle.setAttribute('aria-pressed', String(!dark));
  }
  setAttribute('nav', 'aria-label', localize('Főmenü', 'Main navigation'));
  setAttribute('.brand', 'aria-label', localize('JREPAS kezdőlap', 'JREPAS home'));
  document.title = text('134');
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    setAttribute(selector, 'content', text('135'));
  }
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
    setAttribute(selector, 'content', text('134'));
  }
  setAttribute('meta[property="og:locale"]', 'content', localize('hu_HU', 'en_US'));
  setAttribute('meta[name="theme-color"]', 'content', dark ? '#080808' : '#ffffff');
  setAttribute('.hero-image source', 'media', dark ? 'all' : 'not all');
  setAttribute('.hero-image img', 'alt', localize(
    'Hajlítható Duo telefon, a kijelzőjén sárga és fekete geometrikus grafikával',
    'Foldable Duo phone displaying yellow and black geometric artwork'
  ));
  document.querySelectorAll('.project img:not([alt=""]), .case-image img').forEach(image => {
    image.alt = localize('Doboz stancrajzának technikai illusztrációja', 'Technical illustration of a box dieline');
  });
  setAttribute('.service-jump', 'aria-label', localize('Szolgáltatás választása', 'Choose a service'));
  const subject = `${text('166')} – ${text('173')}`;
  const body = `${text('167')}\n\n${text('168')}: ${text('173')}\n\n${text('169')}:\n\n${text('170')}:\n\n${text('171')}:\n`;
  setAttribute('#quote-mail', 'href', `mailto:jrepas@icloud.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  updateYear();
  root.dataset.runtime = 'javascript';
}

// Apply the latest language after a short fade; rapid clicks replace the pending update.
function switchLanguage() {
  clearTimeout(switchTimer);
  if (reducedMotion.matches) {
    root.removeAttribute('data-switching');
    render();
    return;
  }
  root.dataset.switching = 'true';
  switchTimer = setTimeout(() => {
    render();
    root.removeAttribute('data-switching');
  }, 130);
}

for (const button of document.querySelectorAll('[data-language]')) {
  button.addEventListener('click', () => {
    const next = button.dataset.language;
    if (!['hu', 'en'].includes(next) || next === language) return;
    language = next;
    save('jrepas-language-choice', language);
    switchLanguage();
  });
}
themeToggle?.addEventListener('click', () => {
  themeToggle.dataset.themeClicked = 'true';
  dark = !dark;
  manualTheme = true;
  save('jrepas-theme', dark ? 'dark' : 'light');
  if (!root.hasAttribute('data-switching')) render();
});
for (const event of ['pointerenter', 'pointerleave']) {
  themeToggle?.addEventListener(event, () => themeToggle.removeAttribute('data-theme-clicked'));
}
systemTheme.addEventListener('change', event => {
  if (manualTheme || dark === event.matches) return;
  dark = event.matches;
  if (!root.hasAttribute('data-switching')) render();
});
render();
// Keep the copyright current when the page stays open across New Year's midnight.
setInterval(updateYear, 60_000);
import('./motion.js?v=18').catch(error => console.error('Unable to start page motion:', error));
