const translations = {"0": {"en": "Home", "hu": "Kezdőlap"}, "1": {"en": "Work", "hu": "Munkák"}, "2": {"en": "About", "hu": "Rólam"}, "3": {"en": "Contact", "hu": "Kapcsolat"}, "4": {"en": "LET'S TALK <span>↗</span>", "hu": "BESZÉLJÜNK <span>↗</span>"}, "5": {"en": "LET'S TALK ↗", "hu": "BESZÉLJÜNK ↗"}, "6": {"en": "GRAPHIC DESIGN & VISUAL CREATIVE", "hu": "GRAFIKAI TERVEZÉS ÉS VIZUÁLIS KREATIVITÁS"}, "7": {"en": "IDEAS<br><em>IN FOCUS.</em>", "hu": "ÖTLETEK<br><em>FÓKUSZBAN.</em>"}, "8": {"en": "Visual solutions for brands, businesses and creative projects.", "hu": "Vizuális megoldások márkáknak, vállalkozásoknak és kreatív projektekhez."}, "9": {"en": "VIEW WORK <span>↗</span>", "hu": "MUNKÁIM <span>↗</span>"}, "10": {"en": "01 / SELECTED WORK", "hu": "01 / VÁLOGATOTT MUNKÁK"}, "11": {"en": "START A PROJECT ↗", "hu": "TERVEZZÜNK EGYÜTT ↗"}, "12": {"en": "PACKAGING DESIGN", "hu": "CSOMAGOLÁSTERVEZÉS"}, "13": {"en": "Packaging / Print Production", "hu": "Csomagolás / Nyomdai kivitelezés"}, "14": {"en": "POINT<br>OF SALE<span class=\"accent\">.</span>", "hu": "ELADÁSHELYI<br>DESIGN<span class=\"accent\">.</span>"}, "15": {"en": "POINT OF SALE", "hu": "ELADÁSHELYI DESIGN"}, "16": {"en": "POS / Retail Design · Coming soon", "hu": "POS / Üzletdekoráció · Hamarosan"}, "17": {"en": "BRAND<br>IDENTITY<span class=\"accent\">.</span>", "hu": "MÁRKA<br>ARCULAT<span class=\"accent\">.</span>"}, "18": {"en": "BRAND IDENTITY", "hu": "MÁRKAARCULAT"}, "19": {"en": "Branding / Graphic Design · Coming soon", "hu": "Arculat / Grafikai tervezés · Hamarosan"}, "20": {"en": "02 / ABOUT", "hu": "02 / RÓLAM"}, "21": {"en": "Design <span>with purpose.</span>", "hu": "Tudatos <span>tervezés.</span>"}, "22": {"en": "I’m János Répás, a graphic designer focused on packaging, print production and visual communication.", "hu": "Répás János grafikus vagyok. Csomagolástervezéssel, nyomdai előkészítéssel és vizuális kommunikációval foglalkozom."}, "23": {"en": "I create clean, thoughtful and production-ready design that helps brands communicate clearly.", "hu": "Letisztult, átgondolt és gyártásra kész tervekkel segítem a márkákat az egyértelmű kommunikációban."}, "24": {"en": "LET'S COLLABORATE ↗", "hu": "DOLGOZZUNK EGYÜTT ↗"}, "25": {"en": "03 / CONTACT", "hu": "03 / KAPCSOLAT"}, "26": {"en": "HAVE A PROJECT<br><span>IN MIND?</span>", "hu": "VAN EGY<br><span>ÖTLETED?</span>"}, "27": {"en": "LET'S WORK TOGETHER <span>↗</span>", "hu": "VALÓSÍTSUK MEG <span>↗</span>"}, "28": {"en": "GRAPHIC DESIGN / VISUAL CREATIVE", "hu": "GRAFIKAI TERVEZÉS / VIZUÁLIS KREATIVITÁS"}, "29": {"en": "BACK TO TOP ↑", "hu": "VISSZA AZ ELEJÉRE ↑"}, "30": {"en": "← BACK TO WORK", "hu": "← VISSZA A MUNKÁKHOZ"}, "31": {"en": "SELECTED WORK / 01", "hu": "VÁLOGATOTT MUNKÁK / 01"}, "32": {"en": "PACKAGING<br><em>DESIGN.</em>", "hu": "CSOMAGOLÁS<br><em>TERVEZÉS.</em>"}, "33": {"en": "DISCIPLINE", "hu": "TERÜLET"}, "34": {"en": "FOCUS", "hu": "FÓKUSZ"}, "35": {"en": "Production-ready Design", "hu": "Gyártásra kész tervek"}, "36": {"en": "THE PROJECT", "hu": "A PROJEKT"}, "37": {"en": "FROM CONCEPT<br><span>TO PRODUCTION.</span>", "hu": "AZ ÖTLETTŐL<br><span>A GYÁRTÁSIG.</span>"}, "38": {"en": "A selection of packaging design work focused on clear visual communication and production-ready execution.", "hu": "Válogatás csomagolástervezési munkáimból, az egyértelmű vizuális kommunikáció és a gyárthatóság jegyében."}, "39": {"en": "← MORE WORK", "hu": "← TOVÁBBI MUNKÁK"}, "40": {"en": "BACK TO HOME ↑", "hu": "VISSZA A KEZDŐLAPRA ↑"}};
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
  toggle.textContent = language === 'hu' ? (theme === 'dark' ? 'Világos mód' : 'Sötét mód') : (theme === 'dark' ? 'Light mode' : 'Dark mode');
  toggle.setAttribute('aria-pressed', String(theme === 'light'));
  document.querySelector('nav').setAttribute('aria-label', language === 'hu' ? 'Főmenü' : 'Main navigation');
  document.querySelector('.brand').setAttribute('aria-label', language === 'hu' ? 'JREPAS kezdőlap' : 'JREPAS home');
  const project = location.pathname.endsWith('packaging.html');
  document.title = project ? (language === 'hu' ? 'Csomagolástervezés — JREPAS' : 'Packaging Design — JREPAS') : (language === 'hu' ? 'JREPAS — Grafikai tervezés' : 'JREPAS — Graphic Design & Visual Creative');
  document.querySelector('meta[name="description"]').content = language === 'hu' ? (project ? 'Csomagolástervezés és nyomdai kivitelezés — Répás János portfóliója.' : 'Répás János — grafikai tervezés, csomagolás és márkaarculat.') : (project ? 'Packaging design and print production — János Répás portfolio.' : 'János Répás — graphic design, packaging and visual identities.');
  document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#ffd400' : '#080808';
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
