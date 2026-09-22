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
document.querySelectorAll('.range-nav a').forEach((link) => { if (link.pathname === location.pathname) link.setAttribute('aria-current','page'); });

// Keep a direct contact option within reach across the site.
if (document.querySelector('main') && !document.querySelector('.contact-dock')) {
  const path = location.pathname;
  let quoteHref = path === '/' ? '#quote' : path === '/request-a-quote/' ? '#details' : '/request-a-quote/';
  quoteHref = document.querySelector('main a[href^="/request-a-quote/?style="]')?.getAttribute('href') || quoteHref;
  if (path === '/' || path === '/products/') quoteHref = path === '/' ? '#quote' : '/request-a-quote/';

  const dock = document.createElement('div');
  dock.className = 'contact-dock';
  dock.setAttribute('aria-label', 'Contact ReuseCare');
  const whatsapp = document.createElement('a');
  whatsapp.className = 'contact-dock-whatsapp';
  whatsapp.href = 'https://wa.me/8619905899661';
  whatsapp.target = '_blank';
  whatsapp.rel = 'noopener noreferrer';
  whatsapp.setAttribute('aria-label', 'Chat with Niki on WhatsApp');
  whatsapp.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M7.5 25.2 4 28l1.2-6A12.6 12.6 0 1 1 16 28a12.5 12.5 0 0 1-8.5-2.8Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M11.6 10.5c-.6.4-1.3 1.5-1.3 2.5 0 2.7 4.8 7.9 8.2 8.3 1 .1 2.2-.7 2.7-1.5l-2.8-1.5-1.2 1.2c-1.5-.7-2.8-2-3.6-3.4l1-1.3-1.7-2.8Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  const quote = document.createElement('a');
  quote.className = 'contact-dock-quote';
  quote.href = quoteHref;
  quote.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 3h9l3 3v15H6zM15 3v4h3M9 11h6M9 15h6M9 19h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Get a Free Quote</span><span aria-hidden="true">›</span>';
  dock.append(whatsapp, quote);
  document.body.append(dock);
  document.body.classList.add('has-contact-dock');
}

const quoteForm = document.querySelector('#quote-form');
if (quoteForm) {
  // Only known catalog identifiers can prefill an inquiry; never render raw URL text.
  const styles = {
    'pul-fabric': ['PUL Fabric — 150 cm, 120 g/m², MOQ 5 metres', 'PUL Fabric'],
    'reusable-nursing-pads': ['Reusable Nursing Pads — PUL, one size', 'Reusable Nursing Pads'],
    'reusable-swim-diapers': ['Reusable Swim Diapers — PUL, one size', 'Reusable Swim Diapers'],
    'baby-bibs': ['Baby Bibs — PUL or cotton, one size', 'Baby Bibs'],
    'reusable-hygiene-product-collection': ['Reusable Hygiene Product Collection', 'Reusable Menstrual Pads'],
    'cloth-diaper-inserts': ['Cloth Diaper Inserts', 'Cloth Diapers'],
    'reusable-menstrual-pads': ['Reusable Menstrual Pads', 'Reusable Menstrual Pads'],
    'reusable-cloth-diapers': ['Reusable Cloth Diapers', 'Cloth Diapers'],
    'reusable-care-accessories': ['Reusable Care Accessories', 'Wet Bags / Accessories'],
    'bamboo-charcoal': ['Bamboo Charcoal Pads', 'Reusable Menstrual Pads'],
    'organic-cotton': ['Organic Cotton Pads', 'Reusable Menstrual Pads'],
    'heavy-flow': ['Heavy Flow / Overnight', 'Reusable Menstrual Pads'],
    'panty-liners': ['Reusable Panty Liners', 'Reusable Menstrual Pads'],
    'pocket': ['Pocket Cloth Diapers', 'Cloth Diapers'],
    'aio': ['All-in-One Diapers', 'Cloth Diapers'],
    'covers': ['Diaper Covers', 'Cloth Diapers'],
    'inserts': ['Cloth Diaper Inserts', 'Cloth Diapers'],
    'wet-bags': ['Wet Bags', 'Wet Bags / Accessories']
  };
  const makeProductBrief = (name) => 'Product: ' + name + '\nQuantity: \nMaterial preference: \nPrinting / packaging: \nStock availability or custom order: ';
  let generatedBrief = '';
  const styleKey = new URLSearchParams(location.search).get('style');
  const selection = Object.hasOwn(styles, styleKey) ? styles[styleKey] : null;
  if (selection) {
    const productField = quoteForm.querySelector('[name="product"]');
    const messageField = quoteForm.querySelector('[name="message"]');
    if (productField && !productField.value) productField.value = selection[1];
    if (messageField && !messageField.value) { generatedBrief = makeProductBrief(selection[0]); messageField.value = generatedBrief; }
    const context = document.querySelector('#selected-product-context');
    if (context) {
      context.textContent = 'Your selected product: ' + selection[0] + '. You can adjust the details below.';
      context.hidden = false;
    }
  }
  const productSelect = quoteForm.querySelector('[name="product"]');
  const quantityInput = quoteForm.querySelector('[name="quantity"]');
  const quantityUnit = quoteForm.querySelector('[name="quantity_unit"]');
  const fabricFields = quoteForm.querySelector('#fabric-fields');
  const quantityHelp = quoteForm.querySelector('#quantity-help');
  const updateQuantityFields = (event) => {
    const fabric = productSelect?.value === 'PUL Fabric';
    const nursing = productSelect?.value === 'Reusable Nursing Pads';
    if (fabricFields) { fabricFields.hidden = !fabric; fabricFields.disabled = !fabric; }
    if (quantityUnit) {
      const previous = quantityUnit.value;
      const units = fabric ? [['metres','Metres']] : nursing ? [['pieces','Pieces'],['pairs','Pairs'],['sets','Sets']] : [['pieces','Pieces'],['sets','Sets']];
      if (productSelect?.value === 'Multiple Categories') units.push(['mixed','Mixed units — specify in details']);
      quantityUnit.replaceChildren(...units.map(([value,label]) => new Option(label,value)));
      if (units.some(([value]) => value === previous)) quantityUnit.value = previous;
    }
    if (quantityInput) quantityInput.placeholder = fabric ? 'e.g. 5 or 50 metres' : nursing ? 'e.g. 300; choose pieces, pairs or sets' : 'e.g. 300; specify any split between styles';
    if (quantityHelp) quantityHelp.textContent = fabric ? 'PUL minimum: 5 metres. Custom-print quantities are confirmed separately.' : 'Pack quantities vary by product. For sets, include the pieces per set in Project Details.';
    if (event?.type === 'change') {
      const context = document.querySelector('#selected-product-context');
      if (context) { context.hidden = !productSelect.value; context.textContent = productSelect.value ? 'Your selected product: ' + productSelect.value + '. You can adjust the details below.' : ''; }
      const messageField = quoteForm.querySelector('[name="message"]');
      if (generatedBrief && messageField?.value === generatedBrief) { generatedBrief = productSelect.value ? makeProductBrief(productSelect.value) : ''; messageField.value = generatedBrief; }
    }
  };
  productSelect?.addEventListener('change', updateQuantityFields);
  quoteForm.addEventListener('reset', () => setTimeout(updateQuantityFields, 0));
  updateQuantityFields();
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
      const context = document.querySelector('#selected-product-context');
      if (context) context.hidden = true;
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
