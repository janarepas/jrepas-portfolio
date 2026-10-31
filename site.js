import copy from './translations.js?v=a2e357e5a088';

const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let storage;
try { storage = localStorage; } catch { /* Storage is optional. */ }
const read = key => { try { return storage?.getItem(key); } catch { return null; } };
const save = (key, value) => { try { storage?.setItem(key, value); } catch { /* Keep working without persistence. */ } };
const languagePreference = window.jrepasLanguage;
let language = languagePreference.resolve();
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
  setAttribute('#quote-mail', 'href', `mailto:hello@jrepas.hu?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  updateYear();
  root.dataset.runtime = 'javascript';
  languagePreference.ready();
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
    if (!languagePreference.choose(next) || next === language) return;
    language = next;
    switchLanguage();
  });
}
// Decode the next photograph before fading the whole scene, as on 144p.hu.
async function transitionTheme() {
  if (themeToggle.disabled) return;
  const nextDark = !dark;
  manualTheme = true;
  themeToggle.dataset.themeClicked = 'true';
  const apply = () => {
    dark = nextDark;
    save('jrepas-theme', dark ? 'dark' : 'light');
    render();
  };
  if (reducedMotion.matches) { apply(); return; }
  themeToggle.disabled = true;
  try {
    const source = document.querySelector('.hero-image source');
    const image = document.querySelector('.hero-image img');
    if (image) {
      const preview = new Image();
      preview.sizes = image.sizes || '100vw';
      preview.srcset = nextDark && source ? source.srcset : image.srcset;
      preview.src = image.src;
      await Promise.race([preview.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 2000))]);
    }
    if (document.startViewTransition) {
      const transition = document.startViewTransition(apply);
      await transition.finished.catch(() => {});
    } else if (typeof Element.prototype.animate === 'function') {
      const curtain = document.createElement('div');
      curtain.className = 'theme-transition-curtain';
      curtain.setAttribute('aria-hidden', 'true');
      document.body.append(curtain);
      try {
        await curtain.animate([{ opacity: 0 }, { opacity: .85 }], { duration: 200, fill: 'forwards', easing: 'ease-in' }).finished;
        apply();
        await curtain.animate([{ opacity: .85 }, { opacity: 0 }], { duration: 320, fill: 'forwards', easing: 'ease-out' }).finished;
      } finally { curtain.remove(); }
    } else { apply(); }
  } catch (error) {
    apply();
    console.error('Theme transition failed:', error);
  } finally { themeToggle.disabled = false; }
}
themeToggle?.addEventListener('click', transitionTheme);
for (const event of ['pointerenter', 'pointerleave']) {
  themeToggle?.addEventListener(event, () => themeToggle.removeAttribute('data-theme-clicked'));
}
systemTheme.addEventListener('change', event => {
  if (manualTheme || dark === event.matches) return;
  dark = event.matches;
  if (!root.hasAttribute('data-switching')) render();
});
addEventListener('languagechange', () => {
  language = languagePreference.resolve();
  switchLanguage();
});
render();
// Keep the copyright current when the page stays open across New Year's midnight.
setInterval(updateYear, 60_000);
import('./motion.js?v=bf769f65ef3a').catch(error => console.error('Unable to start page motion:', error));
