const translations = {"0": {"en": "Home", "hu": "Kezdőlap"}, "1": {"en": "Work", "hu": "Munkák"}, "2": {"en": "About", "hu": "Rólam"}, "3": {"en": "Contact", "hu": "Kapcsolat"}, "4": {"en": "Let's talk <span>↗</span>", "hu": "Beszéljünk <span>↗</span>"}, "5": {"en": "Let's talk ↗", "hu": "Beszéljünk ↗"}, "6": {"en": "Graphic design & visual creative", "hu": "Grafikai tervezés és vizuális kreativitás"}, "7": {"en": "Ideas<br><em>in focus.</em>", "hu": "Ötletek<br><em>fókuszban.</em>"}, "8": {"en": "Visual solutions for brands, businesses and creative projects.", "hu": "Vizuális megoldások márkáknak, vállalkozásoknak és kreatív projektekhez."}, "9": {"en": "View work <span>↗</span>", "hu": "Munkáim <span>↗</span>"}, "10": {"en": "01 / Selected work", "hu": "01 / Válogatott munkák"}, "11": {"en": "Start a project ↗", "hu": "Tervezzünk együtt ↗"}, "12": {"en": "Packaging design", "hu": "Csomagolástervezés"}, "13": {"en": "Packaging / Print Production", "hu": "Csomagolás / Nyomdai kivitelezés"}, "14": {"en": "Point<br>of sale<span class=\"accent\">.</span>", "hu": "Eladáshelyi<br>design<span class=\"accent\">.</span>"}, "15": {"en": "Point of sale", "hu": "Eladáshelyi design"}, "16": {"en": "POS / Retail Design · Coming soon", "hu": "POS / Üzletdekoráció · Hamarosan"}, "17": {"en": "Brand<br>identity<span class=\"accent\">.</span>", "hu": "Márka<br>arculat<span class=\"accent\">.</span>"}, "18": {"en": "Brand identity", "hu": "Márkaarculat"}, "19": {"en": "Branding / Graphic Design · Coming soon", "hu": "Arculat / Grafikai tervezés · Hamarosan"}, "20": {"en": "02 / About", "hu": "02 / Rólam"}, "21": {"en": "Design <span>with purpose.</span>", "hu": "Tudatos <span>tervezés.</span>"}, "22": {"hu": "Répás János grafikus és webdesigner vagyok, több mint tíz év szakmai tapasztalattal. Korábban az ALDI Magyarországnál és a Tarasagónál dolgoztam digitális és nyomtatott anyagokon, arculatokon és csomagolásokon.", "en": "I’m János Répás, a graphic designer and web designer with over ten years of experience. At ALDI Hungary and Tarasago, I worked on digital and print materials, brand identities and packaging."}, "23": {"hu": "A látványos megoldások mellett fontos számomra az átgondolt vizuális kommunikáció, a precizitás és a megbízható kivitelezés.", "en": "I combine strong visuals with thoughtful communication, attention to detail and reliable execution."}, "24": {"en": "Let's collaborate ↗", "hu": "Dolgozzunk együtt ↗"}, "25": {"en": "03 / Contact", "hu": "03 / Kapcsolat"}, "26": {"en": "Have a project<br><span>in mind?</span>", "hu": "Van egy<br><span>ötleted?</span>"}, "27": {"en": "Let's work together <span>↗</span>", "hu": "Valósítsuk meg <span>↗</span>"}, "28": {"en": "Graphic design / visual creative", "hu": "Grafikai tervezés / vizuális kreativitás"}, "29": {"en": "Back to top ↑", "hu": "Vissza az elejére ↑"}, "30": {"en": "← Back to work", "hu": "← Vissza a munkákhoz"}, "31": {"en": "Selected work / 01", "hu": "Válogatott munkák / 01"}, "32": {"en": "Packaging<br><em>design.</em>", "hu": "Csomagolás<br><em>tervezés.</em>"}, "33": {"en": "Discipline", "hu": "Terület"}, "34": {"en": "Focus", "hu": "Fókusz"}, "35": {"en": "Production-ready Design", "hu": "Gyártásra kész tervek"}, "36": {"en": "The project", "hu": "A projekt"}, "37": {"en": "From concept<br><span>to production.</span>", "hu": "Az ötlettől<br><span>a gyártásig.</span>"}, "38": {"en": "A selection of packaging design work focused on clear visual communication and production-ready execution.", "hu": "Válogatás csomagolástervezési munkáimból, az egyértelmű vizuális kommunikáció és a gyárthatóság jegyében."}, "39": {"en": "← More work", "hu": "← További munkák"}, "40": {"en": "Back to home ↑", "hu": "Vissza a kezdőlapra ↑"}};
const root = document.documentElement;
const country = root.dataset.country;
// Cloudflare's country takes priority over browser language. Local preview or
// unavailable country information falls back to the browser's primary language.
let language = country ? (country === 'HU' ? 'hu' : 'en') : (navigator.language.startsWith('hu') ? 'hu' : 'en');
let theme = 'light';
try {
  const choice = localStorage.getItem('jrepas-language-choice');
  if (['hu', 'en'].includes(choice)) language = choice;
  theme = localStorage.getItem('jrepas-theme') || 'light';
} catch (_) {}
if (!['light', 'dark'].includes(theme)) theme = 'light';
function render() {
  root.lang = language;
  root.dataset.theme = theme;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = translations[el.dataset.i18n][language];
  });
  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  const toggle = document.querySelector('.theme-toggle');
  toggle.innerHTML = theme === 'dark' ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>' : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 13.2A8.5 8.5 0 0 1 10.8 3.5a8.5 8.5 0 1 0 9.7 9.7Z"/></svg>';
  const themeLabel = language === 'hu' ? (theme === 'dark' ? 'Világos mód' : 'Sötét mód') : (theme === 'dark' ? 'Light mode' : 'Dark mode');
  toggle.setAttribute('aria-label', themeLabel);
  toggle.title = themeLabel;
  toggle.setAttribute('aria-pressed', String(theme === 'light'));
  document.querySelector('nav').setAttribute('aria-label', language === 'hu' ? 'Főmenü' : 'Main navigation');
  document.querySelector('.brand').setAttribute('aria-label', language === 'hu' ? 'JREPAS kezdőlap' : 'JREPAS home');
  const project = location.pathname.endsWith('packaging.html');
  document.title = project ? (language === 'hu' ? 'Csomagolástervezés — JREPAS' : 'Packaging Design — JREPAS') : (language === 'hu' ? 'JREPAS — Grafikai tervezés' : 'JREPAS — Graphic Design & Visual Creative');
  document.querySelector('meta[name="description"]').content = language === 'hu' ? (project ? 'Csomagolástervezés és nyomdai kivitelezés — Répás János portfóliója.' : 'Répás János — grafikai tervezés, csomagolás és márkaarculat.') : (project ? 'Packaging design and print production — János Répás portfolio.' : 'János Répás — graphic design, packaging and visual identities.');
  document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#ffffff' : '#080808';
  const heroImage = document.querySelector('.hero-image img');
  if (heroImage) heroImage.alt = language === 'hu' ? 'Sárga és fekete geometrikus formák fehér stúdióháttér előtt' : 'Sculptural yellow and black shapes on a white studio background';
  document.querySelectorAll('.project img, .case-image img').forEach(img => {
    img.alt = language === 'hu' ? 'Csomagolástervezési projekt' : 'Packaging design project';
  });
}
document.querySelectorAll('[data-language]').forEach(button => {
  button.addEventListener('click', () => { language = button.dataset.language; try { localStorage.setItem('jrepas-language-choice', language); } catch (_) {} render(); });
});
document.querySelector('.theme-toggle').addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark'; save(); render();
});
function save() {
  try { localStorage.setItem('jrepas-theme', theme); } catch (_) {}
}
render();
