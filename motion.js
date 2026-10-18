import Lenis from './assets/vendor/lenis-1.3.27/lenis.mjs';

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let lenis;
let observer;
const targets = [...document.querySelectorAll('.portfolio-card, .process-carousel, .about-process > h2, .about-body > p, .contact-layout > div, .case-image, .case-description-grid > *')];

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
  const state = String(scrollY > 24);
  if (root.getAttribute('data-scrolled') !== state) root.setAttribute('data-scrolled', state);
}
addEventListener('scroll', updateGlass, { passive: true });
addEventListener('pageshow', updateGlass);
updateGlass();

// Gradually sample the existing SVG into larger visible pixels on hover.
for (const logo of document.querySelectorAll('.footer-logo')) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  logo.append(canvas);
  const context = canvas.getContext('2d');
  const sample = document.createElement('canvas');
  const sampleContext = sample.getContext('2d');
  if (!context || !sampleContext) continue;
  const layers = {};
  for (const variant of ['black', 'white']) {
    layers[variant] = {};
    for (const layer of ['numbers', 'surround']) {
      const image = new Image();
      image.onload = () => draw();
      image.src = `images/144p-${variant}-${layer}.svg`;
      layers[variant][layer] = image;
    }
  }
  let level = 0;
  let frame;
  function draw() {
    const layer = layers[root.dataset.theme === 'dark' ? 'white' : 'black'];
    const image = layer.surround;
    const numbers = layer.numbers;
    if (!image?.complete || !image.naturalWidth || !numbers?.complete || !numbers.naturalWidth) return;
    const bounds = logo.getBoundingClientRect();
    const density = Math.min(devicePixelRatio || 1, 3);
    canvas.width = Math.max(1, Math.round(bounds.width * density));
    canvas.height = Math.max(1, Math.round(bounds.height * density));
    const block = 1 + 8 * density * level;
    sample.width = Math.max(1, Math.round(canvas.width / block));
    sample.height = Math.max(1, Math.round(canvas.height / block));
    sampleContext.clearRect(0, 0, sample.width, sample.height);
    sampleContext.drawImage(image, 0, 0, sample.width, sample.height);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    context.drawImage(sample, 0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.drawImage(numbers, 0, 0, canvas.width, canvas.height);
    logo.toggleAttribute('data-pixel-active', level > 0);
    logo.dataset.pixelProgress = level.toFixed(3);
  }
  function animate(target) {
    cancelAnimationFrame(frame);
    if (reducedMotion.matches) {
      level = 0;
      logo.removeAttribute('data-pixel-active');
      return;
    }
    const initial = level;
    const start = performance.now();
    const duration = target ? 1100 : 650;
    function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      level = initial + (target - initial) * eased;
      draw();
      if (progress < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
  }
  logo.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') animate(1);
  });
  logo.addEventListener('pointerleave', () => animate(0));
  reducedMotion.addEventListener('change', () => animate(0));
  new MutationObserver(draw).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
}
