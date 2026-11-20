const root = document.documentElement;
const theme = document.getElementById('theme');
const preference = matchMedia('(prefers-color-scheme: dark)');
let override;
try { override = localStorage.getItem('portfolio-theme'); } catch {}
function setTheme() {
  const current = override || (preference.matches ? 'dark' : 'light');
  root.dataset.theme = current;
  theme.textContent = current === 'dark' ? 'Light mode' : 'Dark mode';
}
theme.hidden = false;
setTheme();
preference.addEventListener('change', setTheme);
theme.addEventListener('click', () => {
  override = root.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme();
  try { localStorage.setItem('portfolio-theme', override); } catch {}
});

if (typeof HTMLDialogElement.prototype.showModal === 'function') {
  root.classList.add('enhanced');
  document.querySelectorAll('[data-case]').forEach(button => {
    const dialog = document.getElementById(button.dataset.case);
    button.addEventListener('click', () => dialog.showModal());
    dialog.addEventListener('close', () => button.focus());
  });
}

const story = document.querySelector('.site-header');
if (story) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const progress = document.getElementById('scroll-progress');
  const hero = document.querySelector('.hero');
  const art = hero.querySelector('.art');
  const sections = Array.from(story.querySelectorAll('nav a'), link => ({
    link,
    target: document.querySelector(link.hash)
  }));

  let pending = false;
  let active;
  function paintScroll() {
    pending = false;
    const y = window.scrollY;
    const distance = root.scrollHeight - window.innerHeight;
    const ratio = distance > 0 ? Math.min(1, Math.max(0, y / distance)) : 0;
    progress.style.transform = 'scaleX(' + ratio + ')';

    const threshold = story.offsetHeight + Math.min(115, window.innerHeight * 0.13);
    let section;
    for (const entry of sections) {
      if (entry.target.getBoundingClientRect().top <= threshold) section = entry;
    }
    if (distance > 0 && distance - y <= 12) section = sections.at(-1);
    if (active !== section) {
      active?.link.removeAttribute('aria-current');
      section?.link.setAttribute('aria-current', 'location');
      active = section;
    }

    const movement = motion.matches ? 0 : Math.min(65, Math.max(0, y * 0.14));
    art.style.setProperty('--parallax', movement + 'px');
    art.style.setProperty('--frame-scale', movement ? '1.035' : '1');
  }

  function scheduleScroll() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(paintScroll);
  }

  root.classList.add('motion-ready');
  if ('IntersectionObserver' in window) {
    const scenes = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('entered');
        scenes.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    document.querySelectorAll('[data-reveal]').forEach(scene => scenes.observe(scene));
  }

  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll);
  document.addEventListener('toggle', scheduleScroll, true);
  motion.addEventListener('change', scheduleScroll);
  scheduleScroll();
}

const spectrum = document.querySelector('.page-spectrum');
if (spectrum && typeof spectrum.animate === 'function') {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const between = (low, high) => low + Math.random() * (high - low);
  const keyframe = ({ x, y, size, opacity }) => ({
    transform: 'translate(' + x + 'vw, ' + y + 'vh) translate(-50%, -50%) scale(' + size + ')',
    opacity
  });

  const glows = [[10, 24], [63, 13], [89, 61], [34, 94]].map(([x, y]) => {
    const element = document.createElement('span');
    element.className = 'spectrum-glow';
    spectrum.append(element);
    const position = { x, y, size: between(.8, 1.15), opacity: between(.7, .95) };
    Object.assign(element.style, keyframe(position));
    return { element, position, animation: null };
  });

  function drift(glow) {
    if (reducedMotion.matches || document.hidden) return;
    const start = glow.position;
    // Choose a new direction and travel speed for each transition.
    const target = {
      x: between(6, 94),
      y: between(7, 93),
      size: between(.64, 1.25),
      opacity: between(.48, .96)
    };
    if (Math.hypot(target.x - start.x, target.y - start.y) < 26) {
      target.x = start.x < 50 ? between(68, 94) : between(6, 32);
    }
    glow.position = target;
    const endFrame = keyframe(target);
    glow.animation = glow.element.animate([keyframe(start), endFrame], {
      duration: between(6200, 13700),
      easing: 'cubic-bezier(.42, 0, .58, 1)'
    });
    // Keep the end position underneath the animation so the next transition can start there.
    Object.assign(glow.element.style, endFrame);
    glow.animation.onfinish = () => {
      glow.animation = null;
      drift(glow);
    };
  }

  function syncSpectrum() {
    for (const glow of glows) {
      if (reducedMotion.matches || document.hidden) {
        glow.animation?.pause();
      } else if (glow.animation) {
        glow.animation.play();
      } else {
        drift(glow);
      }
    }
  }

  reducedMotion.addEventListener('change', syncSpectrum);
  document.addEventListener('visibilitychange', syncSpectrum);
  syncSpectrum();
}
