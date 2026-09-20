const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
if (menuBtn && navLinks) {
  const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  navLinks.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
      setMenu(false); menuBtn.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) setMenu(false);
  });
  window.matchMedia('(min-width: 981px)').addEventListener('change', (event) => { if (event.matches) setMenu(false); });
  navLinks.querySelectorAll('a').forEach((link) => {
    if (link.pathname === location.pathname && !link.hash) link.setAttribute('aria-current', 'page');
  });
}
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

const quoteForm = document.querySelector('#quote-form');
if (quoteForm) {
  quoteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = quoteForm.querySelector('button[type="submit"]');
    if (button.disabled) return;
    const status = document.querySelector('#form-status');
    const data = Object.fromEntries(new FormData(quoteForm).entries());
    const label = button.textContent;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 22000);
    button.disabled = true;
    button.textContent = 'Sending…';
    quoteForm.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your inquiry…';
    status.removeAttribute('data-state');
    try {
      const response = await fetch('/api/quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), signal: controller.signal
      });
      if (!response.ok) {
        const error = new Error('Delivery failed');
        error.status = response.status;
        throw error;
      }
      const result = await response.json();
      if (!result.ok) throw new Error('Unconfirmed delivery');
      quoteForm.reset();
      status.dataset.state = 'success';
      status.textContent = 'Thank you. Your inquiry was sent successfully.';
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.status === 400
        ? 'Please check your name, email and product selection. Your details have been kept. '
        : error.name === 'AbortError'
          ? 'Delivery could not be confirmed in time. Your details have been kept. You can email us directly. '
          : 'Your inquiry could not be sent. Your details have been kept. Please try again or email us directly. ';
      const emailLink = document.createElement('a');
      emailLink.textContent = 'Email these details →';
      const body = Object.entries(data).map(([key, value]) => `${key}: ${value}`).join('\n');
      emailLink.href = `mailto:sales@reusecare.com?subject=${encodeURIComponent('ReuseCare RFQ — ' + (data.product || 'Website inquiry'))}&body=${encodeURIComponent(body)}`;
      status.append(emailLink);
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      button.textContent = label;
      quoteForm.removeAttribute('aria-busy');
    }
  });
}
