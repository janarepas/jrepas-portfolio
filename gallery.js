import projects from './gallery-data.js';
const root = document.documentElement;
const dialog = document.querySelector('.gallery-dialog');
const slides = dialog.querySelector('.gallery-slides');
let activeProject, opener;
let showAll = false;
let currentFilter = 'Összes';
const english = () => root.lang === 'en';
function localize() {
  document.querySelectorAll('[data-hu][data-en]').forEach(el => { const value = english() ? el.dataset.en : el.dataset.hu; if (el.id === 'intro-title') el.innerHTML = value; else el.textContent = value; });
  document.querySelectorAll('[data-alt-hu]').forEach(el => { el.alt = english() ? el.dataset.altEn : el.dataset.altHu; });
  document.querySelectorAll('[data-label-hu]').forEach(el => { el.setAttribute('aria-label', english() ? el.dataset.labelEn : el.dataset.labelHu); });
  document.querySelector('.gallery-filters').setAttribute('aria-label', english() ? 'Filter portfolio' : 'Portfólió szűrése');
  document.querySelectorAll('[data-project]').forEach(button => {
    const p = projects.find(p => p.id === button.dataset.project);
    button.setAttribute('aria-label', `${english() ? p.en : p.hu} — ${english() ? 'view project' : 'projekt megnyitása'}`);
    button.querySelector('img').alt = english() ? p.en : p.hu;
  });
  updateMoreLabel();
  updateStatus();
  if (activeProject) renderProject();
}
function renderProject() {
  const p = activeProject;
  const title = english() ? p.en : p.hu;
  dialog.querySelector('.gallery-project-description').textContent = english() ? p.descriptionEn : p.descriptionHu;
  const meta = dialog.querySelector('.gallery-project-meta');
  meta.replaceChildren();
  const pairs = [[english() ? 'Discipline' : 'Terület', english() ? p.scopeEn : p.scopeHu]];
  if (p.roleHu) pairs.unshift([english() ? 'My role' : 'Feladatom', english() ? p.roleEn : p.roleHu]);
  for (const [label, value] of pairs) {
    const group = document.createElement('div');
    const dt = document.createElement('dt');dt.textContent = label;
    const dd = document.createElement('dd');dd.textContent = value;
    group.append(dt, dd);meta.append(group);
  }
  const link = dialog.querySelector('.gallery-behance');
  link.hidden = !p.behance;
  if (p.behance) {
    link.href = p.behance;
    link.textContent = english() ? 'Full project on Behance' : 'Teljes projekt a Behance-en';
    link.setAttribute('aria-label', `${link.textContent} — ${english() ? 'opens in a new tab' : 'új lapon nyílik meg'}`);
  } else link.removeAttribute('href');
  dialog.querySelector('h2').textContent = title;
  dialog.querySelector('.gallery-dialog-category').textContent = english() ? p.categoryEn : p.category;
  slides.replaceChildren(...p.images.map((image, i) => {
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = image.src; img.width = image.width; img.height = image.height;
    img.alt = `${title} — ${i+1}/${p.images.length}`;
    img.loading = i ? 'lazy' : 'eager';
    const caption = document.createElement('figcaption');
    caption.textContent = p.images.length > 1 ? `${String(i+1).padStart(2,'0')} / ${String(p.images.length).padStart(2,'0')}` : '';
    figure.append(img, caption); return figure;
  }));
}
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  opener = button;
  activeProject = projects.find(p => p.id === button.dataset.project);
  renderProject(); dialog.showModal(); dialog.scrollTop = 0;
  root.classList.add('gallery-modal-open');
}));
dialog.querySelector('.gallery-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { root.classList.remove('gallery-modal-open'); activeProject = undefined; opener?.focus(); });
function applyFilter() {
  document.querySelectorAll('.gallery-card').forEach(card => {
    const matches = currentFilter === 'Összes' || card.dataset.category.split('|').includes(currentFilter);
    card.hidden = !matches || (currentFilter === 'Összes' && !showAll && card.dataset.featured !== 'true');
  });
  document.querySelector('.gallery-grid').classList.toggle('gallery-filtered', currentFilter !== 'Összes');
  document.querySelector('.gallery-more').hidden = currentFilter !== 'Összes';
  updateStatus();
}
function updateMoreLabel() {
  const button = document.querySelector('.gallery-more');
  button.textContent = showAll ? (english() ? 'Show selected work' : 'Csak a válogatás') : (english() ? 'More work' : 'További munkák');
  button.setAttribute('aria-expanded', String(showAll));
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  currentFilter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  applyFilter();
}));
document.querySelector('.gallery-more').addEventListener('click', () => {
  showAll = !showAll;applyFilter();updateMoreLabel();
});
function updateStatus() {
  const count = document.querySelectorAll('.gallery-card:not([hidden])').length;
  document.querySelector('.gallery-status').textContent = english() ? `${count} projects shown` : `${count} projekt látható`;
}
new MutationObserver(localize).observe(root, {attributes:true,attributeFilter:['lang']});
localize();
