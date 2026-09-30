const header = document.querySelector('.site-header');
const nav = document.querySelector('.nav-links');
const toggle = document.querySelector('.menu-toggle');

const progress = document.createElement('div');
progress.className = 'scroll-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.prepend(progress);

const updateScrollState = () => {
  header?.classList.toggle('scrolled', scrollY > 28);
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = `${scrollable > 0 ? Math.min(100, (scrollY / scrollable) * 100) : 0}%`;
};

// Inner pages need a stable contrast layer before the user starts scrolling.
header?.classList.toggle('solid', location.pathname !== '/');

const setMenu = open => {
  nav?.classList.toggle('open', open);
  toggle?.classList.toggle('open', open);
  toggle?.setAttribute('aria-expanded', String(open));
  toggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('menu-open', open);
};

addEventListener('scroll', updateScrollState, { passive: true });
addEventListener('resize', () => {
  if (innerWidth > 1180) setMenu(false);
  updateScrollState();
}, { passive: true });

toggle?.addEventListener('click', () => setMenu(!nav?.classList.contains('open')));
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav?.classList.contains('open')) {
    setMenu(false);
    toggle?.focus();
  }
});

const currentSection = location.pathname.split('/').filter(Boolean)[0] || '';
nav?.querySelectorAll('a').forEach(link => {
  const targetSection = new URL(link.href).pathname.split('/').filter(Boolean)[0] || '';
  if (targetSection === currentSection && currentSection) {
    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
  }
});

const revealItems = [...document.querySelectorAll('.reveal')];
revealItems.forEach((element, index) => {
  element.style.setProperty('--delay', `${Math.min(index % 4, 3) * 70}ms`);
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px' });
  revealItems.forEach(element => observer.observe(element));
} else {
  revealItems.forEach(element => element.classList.add('visible'));
}

document.querySelectorAll('[data-copy-company]').forEach(button => button.addEventListener('click', async () => {
  const value = "Qualitas Engineering Asia | Email: support@qualitasasia.com | Hotline: +852 3956 3968 | Office: Unit 1411, 14/F, COSCO Tower, 183 Queen's Road Central, Sheung Wan, Hong Kong | BR / Company No. 74786274 | qualitasasia.com";
  const status = button.parentElement.querySelector('.copy-status');
  try {
    await navigator.clipboard.writeText(value);
    if (status) status.textContent = 'Company details copied.';
  } catch {
    if (status) status.textContent = value;
  }
}));

const briefButton = document.querySelector('[data-copy-brief]');
briefButton?.addEventListener('click', async () => {
  const fields = [...document.querySelectorAll('[data-brief-field]')];
  const lines = ['Project enquiry — Qualitas Engineering Asia', ...fields.map(field => `${field.dataset.label}: ${field.value.trim() || 'Not specified'}`)];
  const value = lines.join('\n');
  const status = document.querySelector('#briefStatus');
  try {
    await navigator.clipboard.writeText(value);
    status.textContent = 'Project brief copied. You can paste it into your preferred email or message.';
  } catch {
    status.textContent = value;
  }
});

document.querySelectorAll('[data-year]').forEach(element => {
  element.textContent = new Date().getFullYear();
});

updateScrollState();
