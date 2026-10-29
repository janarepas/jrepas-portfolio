import Lenis from './assets/vendor/lenis-1.3.27/lenis.mjs';

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let lenis;
let observer;
const targets = [...document.querySelectorAll('.portfolio-card, .process-step, .about-process > h2, .about-body > p, .contact-layout > div, .case-image, .case-description-grid > *, .resume-intro, .resume-portrait, .resume-section, .resume .reference-card')];

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

// Animate native FAQ disclosures in both directions, including rapid reversals.
for (const details of document.querySelectorAll('.faq details')) {
  const summary = details.querySelector('summary');
  let animation;
  let targetOpen = details.open;
  const settle = () => {
    if (animation) {
      animation.onfinish = null;
      animation.cancel();
      animation = undefined;
      details.open = targetOpen;
    }
    details.style.removeProperty('overflow');
    summary.removeAttribute('aria-expanded');
  };
  summary.addEventListener('click', event => {
    if (reducedMotion.matches || !details.animate) return;
    event.preventDefault();
    targetOpen = animation ? !targetOpen : !details.open;
    const startHeight = details.getBoundingClientRect().height;
    if (animation) {
      animation.onfinish = null;
      animation.cancel();
    }
    details.open = true;
    summary.setAttribute('aria-expanded', String(targetOpen));
    const endHeight = targetOpen ? details.getBoundingClientRect().height :
      summary.getBoundingClientRect().height + parseFloat(getComputedStyle(details).borderBottomWidth || 0);
    details.style.overflow = 'hidden';
    animation = details.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      { duration: 360, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' }
    );
    animation.onfinish = settle;
  });
  reducedMotion.addEventListener('change', settle);
}

// Continuous Bezier paths gently change shape with the section's scroll progress.
const branding = document.querySelector('#about');
const vectorArt = branding?.querySelector('.about-vectors');
let curveFrame = 0;
function drawBrandCurves() {
 curveFrame = 0;
 if (!vectorArt) return;
 const rect = branding.getBoundingClientRect();
 if (!reducedMotion.matches && (rect.bottom < 0 || rect.top > innerHeight)) return;
 const progress = reducedMotion.matches ? .5 : Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
 const wave = Math.sin((progress - .5) * Math.PI) * 90;
 const drift = reducedMotion.matches ? 0 : (progress - .5) * 56;
 vectorArt.style.transform = `translate3d(0, ${drift}px, 0)`;
 // Each square is an on-curve anchor; circles are the actual cubic control points.
 const curves = [
  [[100,240+wave*.2],[300,80+wave],[500,120-wave],[720,180-wave*.35],[940,240+wave*.3],[1140,360-wave],[1340,260+wave*.2]],
  [[100,160-wave*.2],[300,340-wave],[500,340+wave],[720,280+wave*.35],[940,220-wave*.3],[1140,40+wave],[1340,140-wave*.2]],
 ];
 const paths = vectorArt.querySelectorAll('.about-curves path');
 const guides = vectorArt.querySelectorAll('.about-guides path');
 const nodes = vectorArt.querySelectorAll('.about-nodes rect');
 const handles = vectorArt.querySelectorAll('.about-nodes circle');
 curves.forEach(([a,b,c,d,e,f,g], index) => {
  paths[index].setAttribute('d', `M${a}C${b} ${c} ${d}C${e} ${f} ${g}`);
  guides[index].setAttribute('d', `M${a}L${b}M${c}L${d}L${e}M${f}L${g}`);
  [a,d,g].forEach(([x,y], n) => {
   nodes[index*3+n].setAttribute('x', x-4);
   nodes[index*3+n].setAttribute('y', y-4);
  });
  [b,c,e,f].forEach(([x,y], n) => {
   handles[index*4+n].setAttribute('cx', x);
   handles[index*4+n].setAttribute('cy', y);
  });
 });
}
function scheduleBrandCurves() { if (!curveFrame) curveFrame = requestAnimationFrame(drawBrandCurves); }
window.addEventListener('scroll', scheduleBrandCurves, { passive: true });
window.addEventListener('resize', scheduleBrandCurves, { passive: true });
window.addEventListener('pageshow', scheduleBrandCurves);
reducedMotion.addEventListener?.('change', scheduleBrandCurves);
scheduleBrandCurves();
