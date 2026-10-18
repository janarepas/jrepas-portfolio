import Lenis from './assets/vendor/lenis-1.3.27/lenis.mjs';

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let lenis;
let observer;
const targets = [...document.querySelectorAll('.portfolio-card, .process-step, .about-process > h2, .about-body > p, .contact-layout > div, .case-image, .case-description-grid > *')];

function setupMotion() {
  lenis?.destroy();
  observer?.disconnect();
  targets.forEach(element => element.removeAttribute('data-reveal'));
  if (reducedMotion.matches) {
    root.removeAttribute('data-motion');
    return;
  }
  lenis = new Lenis({ autoRaf: true, lerp: 0.1, smoothWheel: true, syncTouch: false, anchors: true });
  root.setAttribute('data-motion', 'true');
  if (!('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute('data-reveal', 'visible');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px 40px 0px', threshold: 0.04 });
  targets.forEach(element => {
    if (element.getBoundingClientRect().top < innerHeight) return;
    element.setAttribute('data-reveal', 'pending');
    observer.observe(element);
  });
}
setupMotion();
reducedMotion.addEventListener('change', setupMotion);
document.addEventListener('focusin', event => {
  const target = event.target.closest?.('[data-reveal]');
  if (target) target.setAttribute('data-reveal', 'visible');
});

const glass = document.createElement('div');
glass.className = 'top-glass';
glass.setAttribute('aria-hidden', 'true');
glass.innerHTML = '<span></span><span></span><span></span>';
document.body.append(glass);
function updateGlass() {
  root.style.setProperty('--hero-underline', String(Math.min(1, Math.max(0, scrollY / 200))));
  const state = String(scrollY > 24);
  if (root.getAttribute('data-scrolled') !== state) root.setAttribute('data-scrolled', state);
}
addEventListener('scroll', updateGlass, { passive: true });
addEventListener('pageshow', updateGlass);
updateGlass();

// Reserve a clean area for each tile's symbol and pixel motif.
const tileCovers = [...document.querySelectorAll('.portfolio-cover')];
function updateArtworkSpace() {
  for (const cover of tileCovers) {
    const image = cover.querySelector('img');
    if (!image) continue;
    const bounds = cover.getBoundingClientRect();
    const marks = [...cover.querySelectorAll('.cover-mark, .cover-pixels')];
    const edge = Math.min(...marks.map(mark => mark.getBoundingClientRect().left)) - bounds.left - 20;
    cover.style.setProperty('--artwork-stop', `${Math.max(0, edge)}px`);
  }
}
const artworkResize = new ResizeObserver(updateArtworkSpace);
tileCovers.forEach(cover => artworkResize.observe(cover));
document.fonts.ready.then(updateArtworkSpace);
updateArtworkSpace();

// Route a continuous path around the text, through all four stage markers.
const processFlow = document.querySelector('.process-flow');
if (processFlow) {
  const connector = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  connector.classList.add('process-connector');
  connector.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(connector.namespaceURI, 'path');
  connector.append(path);
  processFlow.append(connector);
  function drawProcessConnector() {
    const stages = [...processFlow.querySelectorAll('.process-step')];
    if (stages.length !== 4 || innerWidth <= 700) return;
    const points = stages.map(stage => {
      const marker = stage.querySelector('.flow-number');
      return {x:stage.offsetLeft + marker.offsetWidth / 2, y:stage.offsetTop + marker.offsetHeight / 2};
    });
    const [a,b,c,d] = points;
    const radius = stages[0].querySelector('.flow-number').offsetWidth / 2;
    const endOf = stage => stage.offsetLeft + stage.offsetWidth + 8;
    const firstEnd = endOf(stages[0]);
    const thirdEnd = endOf(stages[2]);
    const middle = (stages[1].offsetTop + stages[1].offsetHeight + stages[2].offsetTop) / 2;
    path.setAttribute('d',
      `M ${firstEnd} ${a.y + 24} C ${firstEnd + 18} ${a.y + 24}, ${b.x - radius - 24} ${b.y}, ${b.x - radius - 8} ${b.y}` +
      ` M ${b.x} ${b.y + radius + 8} C ${b.x} ${middle}, ${c.x} ${middle}, ${c.x} ${c.y - radius - 8}` +
      ` M ${thirdEnd} ${c.y + 24} C ${thirdEnd + 18} ${c.y + 24}, ${d.x - radius - 24} ${d.y}, ${d.x - radius - 8} ${d.y}`);

  }
  const processResize = new ResizeObserver(drawProcessConnector);
  processResize.observe(processFlow);
  document.fonts.ready.then(drawProcessConnector);
  drawProcessConnector();
}
