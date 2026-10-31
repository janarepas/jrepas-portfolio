// Select the existing HU/EN translations before the document body is parsed.
(() => {
  const root = document.documentElement;
  const storageKey = 'jrepas-language-choice';
  const supported = value => value === 'hu' || value === 'en';
  let manualChoice;
  try {
    const saved = localStorage.getItem(storageKey);
    if (supported(saved)) manualChoice = saved;
  } catch { /* Browser preferences still work when storage is unavailable. */ }

  function resolve() {
    if (supported(manualChoice)) return manualChoice;
    const preferences = navigator.languages?.length
      ? navigator.languages : [navigator.language];
    for (const preference of preferences) {
      if (typeof preference !== 'string') continue;
      const language = preference.toLowerCase().split('-')[0];
      if (supported(language)) return language;
    }
    return 'en';
  }

  function choose(language) {
    if (!supported(language)) return false;
    manualChoice = language;
    try { localStorage.setItem(storageKey, language); } catch {}
    return true;
  }

  let revealTimer;
  function ready() {
    clearTimeout(revealTimer);
    root.removeAttribute('data-language-pending');
  }

  root.lang = resolve();
  // Static source remains Hungarian for no-JS readers and crawlers. Avoid
  // painting it while the existing English renderer is still starting.
  if (root.lang === 'en') {
    root.setAttribute('data-language-pending', '');
    // Fail open if a page script cannot load; never leave the page invisible.
    revealTimer = setTimeout(() => {
      // The unchanged fallback body is Hungarian if its renderer failed.
      root.lang = 'hu';
      ready();
    }, 3000);
  }
  window.jrepasLanguage = { resolve, choose, ready };
})();
