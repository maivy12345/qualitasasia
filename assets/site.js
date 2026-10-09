const header = document.querySelector('.site-header');
const nav = document.querySelector('.nav-links');
const toggle = document.querySelector('.menu-toggle');

const progress = document.createElement('div');
progress.className = 'scroll-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.prepend(progress);

const updateScrollState = () => {
  header?.classList.toggle('scrolled', window.scrollY > 16);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0}%`;
};

const setMenu = open => {
  nav?.classList.toggle('open', open);
  toggle?.classList.toggle('open', open);
  toggle?.setAttribute('aria-expanded', String(open));
  toggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.classList.toggle('menu-open', open);
};

toggle?.addEventListener('click', () => setMenu(!nav?.classList.contains('open')));
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav?.classList.contains('open')) {
    setMenu(false);
    toggle?.focus();
  }
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 820) setMenu(false);
  updateScrollState();
}, { passive: true });
window.addEventListener('scroll', updateScrollState, { passive: true });

const currentSection = location.pathname.split('/').filter(Boolean)[0] || 'home';
nav?.querySelectorAll('a').forEach(link => {
  const targetSection = new URL(link.href).pathname.split('/').filter(Boolean)[0] || 'home';
  if (targetSection === currentSection) {
    link.classList.add('active');
    if (!link.classList.contains('nav-cta')) link.setAttribute('aria-current', 'page');
  }
});

const revealItems = [...document.querySelectorAll('.reveal')];
revealItems.forEach((element, index) => element.style.setProperty('--delay', `${Math.min(index % 4, 3) * 70}ms`));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px' });
  revealItems.forEach(element => observer.observe(element));
} else {
  revealItems.forEach(element => element.classList.add('visible'));
}

document.querySelectorAll('[data-year]').forEach(element => {
  element.textContent = new Date().getFullYear();
});

const form = document.querySelector('[data-contact-form]');
form?.addEventListener('submit', event => {
  event.preventDefault();
  const status = form.querySelector('.form-status');
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const subject = encodeURIComponent(`Website enquiry — ${data.get('name')}, ${data.get('company') || 'No company'}`);
  const body = encodeURIComponent([
    `Name: ${data.get('name')}`,
    `Company: ${data.get('company') || 'Not provided'}`,
    `Email: ${data.get('email')}`,
    `Phone: ${data.get('phone') || 'Not provided'}`,
    '',
    data.get('message')
  ].join('\n'));
  if (status) status.textContent = 'Your email application is opening with the enquiry prepared. Review it before sending.';
  window.location.href = `mailto:contact@qualitasasia.com?subject=${subject}&body=${body}`;
});

if (!document.querySelector('[data-cookie-banner]')) {
  document.body.insertAdjacentHTML('beforeend', `
    <aside class="cookie-banner" data-cookie-banner aria-label="Cookie preferences">
      <p>We use essential cookies for site functions and optional analytics cookies to understand usage. Read our <a href="/cookies/">Cookie Notice</a>.</p>
      <div class="cookie-actions">
        <button class="btn secondary" type="button" data-cookie-choice="essential">Essential only</button>
        <button class="btn" type="button" data-cookie-choice="accepted">Accept analytics</button>
      </div>
    </aside>`);
}
const cookieBanner = document.querySelector('[data-cookie-banner]');
let cookieChoice = null;
try { cookieChoice = localStorage.getItem('qualitas-cookie-choice'); } catch {}
if (cookieBanner && !cookieChoice) cookieBanner.classList.add('show');
document.querySelectorAll('[data-cookie-choice]').forEach(button => button.addEventListener('click', () => {
  const choice = button.dataset.cookieChoice;
  try { localStorage.setItem('qualitas-cookie-choice', choice); } catch {}
  cookieBanner?.classList.remove('show');
}));

updateScrollState();
