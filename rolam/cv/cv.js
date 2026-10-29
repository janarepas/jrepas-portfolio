// Build the one-page printable CV in the language selected on the About page.
const target = document.querySelector('#cv');
const printButton = document.querySelector('#print');
let language = 'hu';
try { language = localStorage.getItem('jrepas-language-choice') === 'en' ? 'en' : 'hu'; } catch {}
document.documentElement.lang = language;
if (language === 'en') {
  printButton.firstChild.textContent = 'Download CV ';
  document.title = 'János Répás – Professional CV | jrepas.hu';
  const backLink = document.querySelector('.cv-toolbar a');
  if (backLink) backLink.textContent = '← Back to About';
}
const make = (tag, text = '', className = '') => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
};

const en = {
  'Szakmai önéletrajz': 'Professional CV',
  'Senior grafikus és mozgógrafikai tervező': 'Senior Graphic & Motion Designer',
  'Szakmai tapasztalat': 'Experience', 'Tanulmányok': 'Education',
  'Szakmai háttér': 'Professional background', 'Szakmai készségek': 'Design capabilities',
  'Szoftverismeret': 'Software', 'Nyelvtudás': 'Languages',
  'Marketingmenedzser': 'Marketing Manager', 'ALDI Magyarország': 'ALDI Hungary',
  'Grafikus – digitális és kültéri kommunikáció': 'Graphic Designer — Digital & OOH',
  'Web- és grafikai tervező': 'Web & Graphic Designer',
  'Informatikai és kreatív támogatás': 'IT & Creative Support',
  'Mozgógrafika és videó': 'Motion & video', 'Grafikai tervezés': 'Graphic design',
  'Kampányok': 'Campaigns',
  'Magyar': 'Hungarian', 'Anyanyelvi': 'Native', 'Angol': 'English',
  'Haladó': 'Advanced', 'Francia': 'French', 'Német': 'German', 'Alapfok': 'Basic',
  'Kossuth Lajos Szakközépiskola': 'Kossuth Lajos Technical Secondary School',
  'Repülőgép-fedélzeti berendezés technikus': 'Aircraft onboard equipment technician',
  'Ady Endre Gimnázium': 'Ady Endre Secondary School',
  'High school degree': 'High school diploma',
  'Kiskunlacházai Szakközépiskola': 'Kiskunlacháza Technical Secondary School',
  'Érettségi': 'Secondary school leaving certificate',
  'Budapesti Corvinus Egyetem': 'Corvinus University of Budapest',
  'Online marketingstratégia és gyakorlat': 'Online Marketing Strategy & Practice',
  'Mozgógrafika': 'Motion graphics', 'Videóvágás': 'Video editing',
  'Digitális kijelzőkre készülő tartalom': 'Digital screen content',
  'Arculattervezés': 'Brand identity', 'Tipográfia és tördelés': 'Typography & layout',
  'Nyomdai előkészítés': 'Print production', 'Digitális hirdetések': 'Digital advertising',
  'Kültéri és nagyformátumú grafika': 'OOH & large-format graphics',
  'Vizuális történetmesélés': 'Visual storytelling',
  'A marketing és a vizuális kommunikáció koordinálása;': 'Coordinated marketing and visual communication;',
  'After Effects-mozgógrafikák és Premiere Pro-videók készítése,': 'Created After Effects motion graphics and Premiere Pro video content,',
  'Weboldalak, arculatok, kiadványok,': 'Designed websites, visual identities, editorial layouts,',
  'Műszaki támogatás és hálózatüzemeltetés,': 'Technical support and network operations,',
  'A marketing és a vizuális kommunikáció koordinálása; nyomtatott és digitális anyagok tervezése, a webes jelenlét és az egységes márkamegjelenés támogatása.':
    'Coordinated marketing and visual communication; designed print and digital assets, supported web presence and brand consistency.',
  'After Effects-mozgógrafikák és Premiere Pro-videók készítése, digitális kampányok, LED-kijelzők grafikái, óriásplakátok, közösségimédia-anyagok és fesztiválkreatívok tervezése.':
    'Created After Effects motion graphics and Premiere Pro video content, plus digital campaigns, LED screen graphics, billboards, social assets and festival creatives.',
  'Weboldalak, arculatok, kiadványok, illusztrációk, közösségimédia-tartalmak és promóciós kampányanyagok tervezése.':
    'Designed websites, visual identities, editorial layouts, illustrations, social and promotional campaign assets.',
  'Műszaki támogatás és hálózatüzemeltetés, valamint webes, nyomtatott és grafikai anyagok készítése.':
    'Technical support and network operations alongside web, print and graphic production.',
  'Kampányanyagok készítése az ALDI Magyarország és a ROKSH számára, valamint nagy fesztiválmegjelenésekhez. Hosszú távú arculat-, web- és kiadványtervezés a Tarsagónál, vizuális kommunikáció a Lévai Medical Centre-nél.':
    'Produced campaign assets for ALDI Hungary, ROKSH and major festivals, alongside long-term brand, web and editorial design for Tarsago and visual communication for Lévai Medical Centre.'
};
const translate = value => language === 'en' ? (en[value] || value) : value;

function localizeSection(section) {
  if (language !== 'en') return section;
  section.querySelectorAll('h2,h3,.resume-role,.education-course,.resume-date,.resume-languages dt,.resume-languages dd,.resume-software li')
    .forEach(node => {
      if (node.matches('.resume-software li')) {
        const label = [...node.childNodes].filter(child => child.nodeType === Node.TEXT_NODE).map(child => child.textContent).join('').trim();
        node.childNodes.forEach(child => { if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) child.textContent = ` ${translate(label)}`; });
      } else node.textContent = translate(node.textContent.trim());
    });
  section.querySelectorAll('.resume-job > div > p:not(.resume-role), .resume-section > p')
    .forEach(node => {
      const original = node.textContent.trim();
      const translated = translate(original);
      const emphasis = node.querySelector('strong');
      if (emphasis && translated !== original) {
        const boldText = translate(emphasis.textContent.trim());
        node.replaceChildren(make('strong', boldText), document.createTextNode(` ${translated.slice(boldText.length).trimStart()}`));
      } else node.textContent = translated;
    });
  return section;
}

async function loadCV() {
  try {
    const response = await fetch('/rolam/', { cache: 'no-store' });
    if (!response.ok) throw new Error('CV source unavailable');
    const source = new DOMParser().parseFromString(await response.text(), 'text/html');
    const sections = [...source.querySelectorAll('.resume-section')];
    const findSection = title => sections.find(section => section.querySelector('h2')?.textContent.trim() === title);
    const cloneSection = title => {
      const original = findSection(title);
      if (!original) throw new Error(`Missing section: ${title}`);
      const section = original.cloneNode(true);
      section.classList.add('cv-section');
      section.querySelectorAll('.software-logo').forEach(icon => icon.remove());
      return localizeSection(section);
    };
    const softwareGlyphs = {
      Photoshop: 'Ps', Illustrator: 'Ai', InDesign: 'Id', Figma: 'Fg',
      'Adobe XD': 'Xd', 'After Effects': 'Ae', 'Premiere Pro': 'Pr',
      'Final Cut Pro': 'Fc', Affinity: 'Af', SketchUp: 'Sk',
      Shopify: 'Sh', Shoprenter: 'Sr', HTML5: 'H5', CSS3: 'C3'
    };

    const sheet = make('article', '', 'cv-sheet');
    const header = make('header', '', 'cv-heading');
    const kicker = make('div', '', 'cv-kicker-row');
    kicker.append(make('p', translate('Szakmai önéletrajz'), 'cv-kicker'));
    const wordmark = make('img');
    wordmark.src = '/images/jrepas-logo.svg';
    wordmark.alt = '';
    kicker.append(wordmark);

    const profile = make('div', '', 'cv-profile');
    const portrait = make('img');
    portrait.src = '/images/repas-janos-cv-original-lossless.webp';
    portrait.alt = 'Répás János';
    portrait.className = 'cv-portrait';
    const identity = make('div', '', 'cv-identity');
    const name = source.querySelector('.resume-intro h1');
    const role = source.querySelector('.resume-title');
    if (!name || !role) throw new Error('Missing About introduction');
    identity.append(make('h1', language === 'en' ? 'János Répás' : name.textContent.trim()), make('p', translate(role.textContent.trim()), 'cv-role'));
    const contacts = [...source.querySelectorAll('.resume-contact a[href^="mailto:"], .resume-contact a[href^="tel:"]')];
    const contactLine = make('div', '', 'cv-contact-line');
    contacts.forEach(link => {
      const item = make('span', '', 'cv-contact-item');
      const icon = link.querySelector('svg')?.cloneNode(true);
      if (icon) {
        icon.setAttribute('aria-hidden', 'true');
        icon.removeAttribute('aria-label');
        item.append(icon);
      }
      item.append(make('span', link.textContent.trim()));
      contactLine.append(item);
    });
    identity.append(contactLine);
    const summaryCopy = make('p', language === 'en'
      ? 'Senior graphic and motion designer with 15+ years of experience creating brand identities and campaigns for digital, outdoor and print.'
      : 'Senior grafikus és mozgóképes tervező, 15+ év tapasztalattal arculatok és kampányok tervezésében, digitális, kültéri és nyomtatott felületekre.', 'cv-summary');
    identity.append(summaryCopy);
    profile.append(identity, portrait);
    header.append(kicker, profile);

    const columns = make('div', '', 'cv-columns');
    const primary = make('div', '', 'cv-primary');
    const secondary = make('div', '', 'cv-secondary');
    const experience = cloneSection('Szakmai tapasztalat');
    experience.classList.add('cv-experience');
    const timeline = make('div', '', 'cv-experience-timeline');
    [...experience.querySelectorAll('.resume-job')].forEach(entry => timeline.append(entry));
    experience.append(timeline);
    primary.append(experience, cloneSection('Tanulmányok'));
    const background = cloneSection('Szakmai háttér');
    background.classList.add('cv-background');

    const sourceSkills = source.querySelector('.skills-showcase');
    if (!sourceSkills) throw new Error('Missing skills section');
    const skills = make('section', '', 'resume-section cv-section cv-skills');
    skills.append(make('h2', translate(sourceSkills.querySelector('h2')?.textContent.trim() || 'Szakmai készségek')));
    sourceSkills.querySelectorAll('.skill-card').forEach(card => {
      const entry = make('article', '', 'cv-skill-entry');
      entry.append(make('h3', translate(card.querySelector('.skill-category')?.textContent.trim() || '')));
      const list = make('ul', '', 'cv-competencies');
      card.querySelectorAll('.skill-competencies li').forEach(item => list.append(make('li', translate(item.textContent.trim()))));
      entry.append(list);
      skills.append(entry);
    });
    const software = cloneSection('Szoftverismeret');
    software.querySelectorAll('.resume-software li').forEach(item => {
      const label = item.textContent.trim();
      const icon = make('span', softwareGlyphs[label] || '•', 'cv-software-icon');
      icon.setAttribute('aria-hidden', 'true');
      item.prepend(icon);
    });
    secondary.append(background, skills, software, cloneSection('Nyelvtudás'));
    columns.append(primary, secondary);

    const footer = make('footer', '', 'cv-footer');
    footer.setAttribute('aria-hidden', 'true');
    sheet.append(header, columns, footer);
    target.replaceChildren(sheet);
    await document.fonts.ready;
    await Promise.all([...target.querySelectorAll('img')].map(img => img.decode().catch(() => {})));
    printButton.disabled = false;
    document.documentElement.dataset.ready = 'true';
  } catch (error) {
    target.replaceChildren(make('p', language === 'en'
      ? 'The CV could not be loaded. Return to the About page and try again.'
      : 'Az önéletrajz nem tölthető be. Térj vissza a Rólam oldalra, és próbáld újra.'));
    console.error(error);
  }
}

printButton.addEventListener('click', () => window.print());
loadCV();
