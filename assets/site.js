// GA4 measurement and business events. No form PII is sent to Analytics.
const GA_MEASUREMENT_ID = 'G-VRX1SG4W22';
const GA_ID_PATTERN = /^G-[A-Z0-9]+$/i;
const trackEvent = (name, params = {}) => {
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
};
if (GA_ID_PATTERN.test(GA_MEASUREMENT_ID)) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const googleTag = document.createElement('script');
  googleTag.async = true;
  googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.appendChild(googleTag);
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: true });
}

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

// Measure high-intent navigation without sending email addresses or phone numbers.
document.addEventListener('click', (event) => {
  const link = event.target.closest?.('a');
  if (!link) return;
  const href = link.getAttribute('href') || '';
  let destination;
  try { destination = new URL(href, location.href); } catch { return; }
  const host = destination.hostname.toLowerCase();
  const pagePath = location.pathname;
  const linkText = link.textContent.trim().slice(0, 80);
  if (destination.protocol === 'mailto:') {
    trackEvent('email_click', { page_path: pagePath, link_text: linkText });
  } else if (host === 'wa.me' || host === 'api.whatsapp.com' || host.endsWith('.whatsapp.com')) {
    trackEvent('whatsapp_click', { page_path: pagePath, link_text: linkText });
  } else if (destination.pathname === '/request-a-quote/' || href === '#quote' || destination.hash === '#quote') {
    trackEvent('request_quote_click', { page_path: pagePath, destination_path: destination.pathname });
  }
});

const productPagePattern = /^\/(?:products|pul-fabric|reusable-menstrual-pads|reusable-nursing-pads|reusable-swim-diapers|cloth-diapers|baby-bibs|accessories\/wet-bags|inner-fabric)(?:\/|$)/i;
if (productPagePattern.test(location.pathname)) {
  const productName = document.querySelector('main h1')?.textContent.trim().slice(0, 160) || location.pathname;
  trackEvent('view_item', {
    item_list_name: 'ReuseCare product pages',
    items: [{ item_id: location.pathname, item_name: productName }]
  });
}

// Carry the exact catalogue reference into the RFQ instead of losing it at category level.
const quoteUnitByStyle = {
  'pul-fabric': 'metres', 'inner-fabric': 'metres',
  'reusable-nursing-pads': 'pairs',
  'reusable-swim-diapers': 'pieces', 'baby-bibs': 'pieces',
  'reusable-menstrual-pads': 'pieces', 'reusable-hygiene-product-collection': 'sets',
  'reusable-cloth-diapers': 'pieces', 'cloth-diaper-inserts': 'pieces',
  'diaper-inserts': 'pieces', 'reusable-care-accessories': 'pieces',
  'bamboo-charcoal': 'pieces', 'organic-cotton': 'pieces', 'heavy-flow': 'pieces',
  'panty-liners': 'pieces', 'pocket': 'pieces', 'aio': 'pieces', 'covers': 'pieces',
  'inserts': 'pieces', 'wet-bags': 'pieces'
};
const unitByCategory = { fabrics: 'metres', 'inner-fabric': 'metres', nursing: 'pairs' };
document.querySelectorAll('a[href^="/request-a-quote/?style="]').forEach((link) => {
  const url = new URL(link.getAttribute('href'), location.origin);
  const style = url.searchParams.get('style');
  const card = link.closest('.catalog-card');
  const model = (card?.querySelector('h3') || document.querySelector('main h1'))?.textContent.trim();
  let image = card?.querySelector('img')?.getAttribute('src') || '';
  if (!image) {
    const socialImage = document.querySelector('meta[property="og:image"]')?.content || '';
    try { image = socialImage ? new URL(socialImage, location.origin).pathname : ''; } catch { image = ''; }
  }
  const unit = unitByCategory[card?.dataset.category] || quoteUnitByStyle[style] || 'pieces';
  if (model) url.searchParams.set('model', model.slice(0, 180));
  if (/^\/assets\/products\/[a-z0-9][a-z0-9-]*\.(?:webp|png|jpe?g)$/i.test(image)) url.searchParams.set('image', image);
  url.searchParams.set('unit', unit);
  url.searchParams.set('source', location.pathname);
  link.setAttribute('href', url.pathname + '?' + url.searchParams.toString());
});

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
    "inner-fabric": ["Inner Fabrics","Inner Fabrics"],
    "diaper-inserts": ["Diaper Inserts","Diaper Inserts"],
    "inner-fabric-blue": ["Blue Polar Fleece Inner Fabric","Inner Fabrics"],
    "inner-fabric-pink": ["Pink Polar Fleece Inner Fabric","Inner Fabrics"],
    "inner-fabric-red": ["Red Polar Fleece Inner Fabric","Inner Fabrics"],
    "inserts-bamboo-charcoal": ["Bamboo Charcoal Diaper Inserts — 8 Pack","Diaper Inserts"],
    "inserts-bamboo": ["Bamboo Diaper Inserts — 8 Pack","Diaper Inserts"],
    "inserts-white": ["White Cloth Diaper Inserts","Diaper Inserts"],
    "inserts-gusseted": ["Gusseted Charcoal Diaper Inserts","Diaper Inserts"],
    "inserts-hemp-cotton": ["Hemp & Cotton Diaper Inserts","Diaper Inserts"],
    'pul-fabric': ['PUL Fabric — 150 cm, 120 g/m², MOQ 5 metres', 'PUL Fabric'],
    'reusable-nursing-pads': ['Reusable Nursing Pads — PUL, one size', 'Reusable Nursing Pads'],
    'reusable-swim-diapers': ['Reusable Swim Diapers — PUL, one size', 'Reusable Swim Diapers'],
    'baby-bibs': ['Baby Bibs — PUL or cotton, one size', 'Baby Bibs'],
    'reusable-hygiene-product-collection': ['Reusable Hygiene Product Collection', 'Reusable Menstrual Pads'],
    'cloth-diaper-inserts': ['Diaper Inserts', 'Diaper Inserts'],
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
    'inserts': ['Diaper Inserts', 'Diaper Inserts'],
    'wet-bags': ['Wet Bags', 'Wet Bags / Accessories']
  };
  const makeProductBrief = (name) => 'Selected style / model: ' + name + '\nQuantity: \nDimensions or fit requirements: \nLayer / material preference: \nPrinting / packaging: \nDestination country and shipping needs: \nStock availability or custom order: ';
  let generatedBrief = '';
  const quoteParams = new URLSearchParams(location.search);
  const styleKey = quoteParams.get('style');
  const selection = Object.hasOwn(styles, styleKey) ? styles[styleKey] : null;
  const modelParam = quoteParams.get('model') || '';
  const imageParam = quoteParams.get('image') || '';
  const unitParam = quoteParams.get('unit') || '';
  const sourceParam = quoteParams.get('source') || '';
  const safeModel = modelParam.length <= 180 && !/[<>\r\n]/.test(modelParam) ? modelParam.trim() : '';
  const safeImage = /^\/assets\/products\/[a-z0-9][a-z0-9-]*\.(?:webp|png|jpe?g)$/i.test(imageParam) ? imageParam : '';
  const safeUnit = ['pieces','pairs','sets','metres'].includes(unitParam) ? unitParam : '';
  const safeSource = /^\/[a-z0-9/_-]*\/?$/i.test(sourceParam) ? sourceParam : '';
  const modelField = quoteForm.querySelector('[name="product_model"]');
  const imageField = quoteForm.querySelector('[name="product_image"]');
  const sourceField = quoteForm.querySelector('[name="source_url"]');
  const renderSelectedReference = (name, image, source) => {
    const context = document.querySelector('#selected-product-context');
    if (!context || !name) return;
    const copy = document.createElement('div');
    const label = document.createElement('span');
    const title = document.createElement('strong');
    const note = document.createElement('span');
    label.textContent = 'Selected style / model';
    title.textContent = name;
    note.textContent = source ? 'Carried from ' + source : 'You can adjust the product line and quantity below.';
    copy.append(label, title, note);
    if (image) {
      const preview = document.createElement('img');
      preview.src = image;
      preview.alt = '';
      preview.width = 96;
      preview.height = 96;
      context.replaceChildren(preview, copy);
    } else context.replaceChildren(copy);
    context.hidden = false;
  };
  if (selection) {
    const productField = quoteForm.querySelector('[name="product"]');
    const messageField = quoteForm.querySelector('[name="message"]');
    if (productField && !productField.value) productField.value = selection[1];
    const selectedName = safeModel || selection[0];
    if (messageField && !messageField.value) { generatedBrief = makeProductBrief(selectedName); messageField.value = generatedBrief; }
    if (modelField) { modelField.defaultValue = selectedName; modelField.value = selectedName; }
    if (imageField) { imageField.defaultValue = safeImage; imageField.value = safeImage; }
    if (sourceField) { sourceField.defaultValue = safeSource; sourceField.value = safeSource; }
    renderSelectedReference(selectedName, safeImage, safeSource);
  }
  const productSelect = quoteForm.querySelector('[name="product"]');
  const quantityInput = quoteForm.querySelector('[name="quantity"]');
  const quantityUnit = quoteForm.querySelector('[name="quantity_unit"]');
  const fabricFields = quoteForm.querySelector('#fabric-fields');
  const quantityHelp = quoteForm.querySelector('#quantity-help');
  const updateQuantityFields = (event) => {
    const pul = productSelect?.value === 'PUL Fabric';
    const inner = productSelect?.value === 'Inner Fabrics';
    const fabric = pul || inner;
    const nursing = productSelect?.value === 'Reusable Nursing Pads';
    if (fabricFields) { fabricFields.hidden = !pul; fabricFields.disabled = !pul; }
    if (quantityUnit) {
      const previous = quantityUnit.value;
      const units = fabric ? [['metres','Metres']] : nursing ? [['pieces','Pieces'],['pairs','Pairs'],['sets','Sets']] : [['pieces','Pieces'],['sets','Sets']];
      if (productSelect?.value === 'Multiple Categories') units.push(['mixed','Mixed units — specify in details']);
      quantityUnit.replaceChildren(...units.map(([value,label]) => new Option(label,value)));
      if (units.some(([value]) => value === previous)) quantityUnit.value = previous;
    }
    if (quantityInput) quantityInput.placeholder = fabric ? (inner ? 'e.g. 50 metres' : 'e.g. 5 or 50 metres') : nursing ? 'e.g. 300; choose pieces, pairs or sets' : 'e.g. 300; specify any split between styles';
    if (quantityHelp) quantityHelp.textContent = inner ? 'Inner-fabric width, weight and minimum order are confirmed with your quote. Specify metres.' : pul ? 'PUL minimum: 5 metres. Custom-print quantities are confirmed separately.' : 'Pack quantities vary by product. For sets, include the pieces per set in Project Details.';
    if (event?.type === 'change') {
      const context = document.querySelector('#selected-product-context');
      if (selection && productSelect.value !== selection[1]) {
        if (modelField) { modelField.defaultValue = ''; modelField.value = ''; }
        if (imageField) { imageField.defaultValue = ''; imageField.value = ''; }
        if (sourceField) { sourceField.defaultValue = ''; sourceField.value = ''; }
      }
      if (context && (!selection || productSelect.value !== selection[1])) {
        context.hidden = !productSelect.value;
        context.textContent = productSelect.value ? 'Selected product line: ' + productSelect.value + '. Add a style name or reference link below.' : '';
      }
      const messageField = quoteForm.querySelector('[name="message"]');
      if (generatedBrief && messageField?.value === generatedBrief) { generatedBrief = productSelect.value ? makeProductBrief(productSelect.value) : ''; messageField.value = generatedBrief; }
    }
  };
  productSelect?.addEventListener('change', updateQuantityFields);
  quoteForm.addEventListener('reset', () => setTimeout(updateQuantityFields, 0));
  updateQuantityFields();
  if (safeUnit && [...quantityUnit.options].some(option => option.value === safeUnit)) quantityUnit.value = safeUnit;
  quoteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = quoteForm.querySelector('button[type="submit"]');
    if (button.disabled) return;
    const status = document.querySelector('#form-status');
    const data = Object.fromEntries(new FormData(quoteForm).entries());
    const referenceStillSelected = selection && productSelect?.value === selection[1];
    if (referenceStillSelected) {
      data.product_model = modelField?.value || safeModel || selection[0];
      data.product_image = imageField?.value || safeImage;
      data.source_url = sourceField?.value || safeSource;
    }
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
      trackEvent('generate_lead', {
        form_name: 'request_a_quote',
        product: data.product,
        product_model: data.product_model || undefined
      });
      quoteForm.reset();
      [modelField, imageField, sourceField].forEach((field) => { if (field) { field.defaultValue = ''; field.value = ''; } });
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
      emailLink.href = `mailto:niki@reusecare.com?subject=${encodeURIComponent('ReuseCare RFQ — ' + (data.product || 'Website inquiry'))}&body=${encodeURIComponent(body)}`;
      status.append(emailLink);
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      button.textContent = label;
      quoteForm.removeAttribute('aria-busy');
    }
  });
}
