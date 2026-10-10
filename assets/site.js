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

const sharedFooter = `
  <div class="shell">
    <div class="footer-grid">
      <div>
        <img class="footer-logo" src="/assets/qualitas-footer-logo.svg" alt="Qualitas Engineering Asia">
        <p class="footer-intro">Technical governance, quality assurance and commissioning support.</p>
      </div>
      <div class="footer-col">
        <h3>Services</h3>
        <a href="/services/quality-management-frameworks-itps/">Quality frameworks &amp; ITPs</a>
        <a href="/services/technical-compliance-review-desktop-audit/">Compliance review</a>
        <a href="/services/non-conformance-corrective-action/">NCR &amp; corrective action</a>
        <a href="/services/commissioning-handover-dossier-governance/">Handover governance</a>
        <a href="/services/esg-monitoring-reporting-frameworks/">ESG reporting</a>
      </div>
      <div class="footer-col">
        <h3>Company</h3>
        <a href="/about/">About</a>
        <a href="/approach/">Approach</a>
        <a href="/how-we-work/">How we work</a>
        <a href="/sectors/">Sectors</a>
        <a href="/insights/">Insights</a>
        <a href="/faq/">FAQ</a>
        <a href="/careers/">Careers</a>
      </div>
      <div class="footer-col">
        <h3>Contact</h3>
        <a href="mailto:contact@qualitasasia.com">contact@qualitasasia.com</a>
        <address class="footer-address">7A/F, Wing Hing Commercial Building<br>139 Wing Lok St, Sheung Wan<br>Hong Kong</address>
        <span class="footer-address">BR / Company No. 74786274</span>
      </div>
    </div>
    <div class="footer-base">
      <span>© 2026 Qualitas Engineering Asia Limited</span>
      <nav class="footer-legal" aria-label="Legal">
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
        <a href="/cookies/">Cookies</a>
        <a href="/disclaimer/">Disclaimer</a>
      </nav>
    </div>
  </div>`;

document.querySelectorAll('.site-footer').forEach(footer => {
  footer.innerHTML = sharedFooter;
});

document.querySelectorAll('[data-year]').forEach(element => {
  element.textContent = new Date().getFullYear();
});

if (['/privacy/', '/terms/', '/cookies/', '/disclaimer/'].includes(location.pathname)) {
  document.querySelector('.article-body')?.insertAdjacentHTML('afterbegin', '<p class="legal-updated">Last updated: <time datetime="2026-10-08">8 October 2026</time></p>');
}

const form = document.querySelector('[data-contact-form]');
const formStartedAt = form?.querySelector('[name="formStartedAt"]');
const submissionIdField = form?.querySelector('[name="submissionId"]');
if (formStartedAt) formStartedAt.value = String(Date.now());

form?.addEventListener('submit', async event => {
  event.preventDefault();
  const status = form.querySelector('.form-status');
  const submitButton = form.querySelector('button[type="submit"]');
  if (!form.reportValidity()) return;

  const data = Object.fromEntries(new FormData(form).entries());
  if (submissionIdField && !submissionIdField.value) {
    submissionIdField.value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  data.submissionId = submissionIdField?.value;

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.dataset.label = submitButton.textContent;
    submitButton.textContent = 'Sending…';
  }
  if (status) {
    status.className = 'form-status';
    status.textContent = 'Sending your enquiry…';
  }

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'We could not send your enquiry.');

    form.reset();
    if (formStartedAt) formStartedAt.value = String(Date.now());
    if (status) {
      status.classList.add('is-success');
      status.textContent = 'Thank you. Your enquiry has been sent and a confirmation email is on its way.';
    }
  } catch (error) {
    if (status) {
      status.classList.add('is-error');
      status.textContent = `${error.message} Please try again or email contact@qualitasasia.com.`;
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = submitButton.dataset.label || 'Send enquiry';
    }
  }
});

const insightFilters = document.querySelector('[data-insight-filters]');
if (insightFilters) {
  const cards = [...document.querySelectorAll('[data-insight-topic]')];
  const emptyState = document.querySelector('[data-insight-empty]');
  insightFilters.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    const filter = button.dataset.filter;
    insightFilters.querySelectorAll('button').forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    let visible = 0;
    cards.forEach(card => {
      const show = filter === 'all' || card.dataset.insightTopic === filter;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (emptyState) emptyState.hidden = visible > 0;
  });
}

document.querySelectorAll('[data-share]').forEach(link => {
  const network = link.dataset.share;
  const url = encodeURIComponent(location.href);
  const title = encodeURIComponent(document.title);
  if (network === 'linkedin') link.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  if (network === 'email') link.href = `mailto:?subject=${title}&body=${url}`;
});

document.querySelector('[data-copy-link]')?.addEventListener('click', async event => {
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(location.href);
    button.textContent = 'Link copied';
  } catch {
    button.textContent = 'Copy failed';
  }
  window.setTimeout(() => { button.textContent = 'Copy link'; }, 1800);
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
