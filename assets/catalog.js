(() => {
  const controls = document.querySelector('#catalog-tools');
  if (!controls) return;
  const cards = [...document.querySelectorAll('.catalog-card')];
  const buttons = [...controls.querySelectorAll('[data-filter]')];
  const search = document.querySelector('#catalog-search');
  const count = document.querySelector('#catalog-count');
  const empty = document.querySelector('#catalog-empty');
  const title = document.querySelector('#catalog-heading-title');
  const context = document.querySelector('#catalog-context');
  const fabricNote = document.querySelector('#catalog-fabric-note');
  const specLink = document.querySelector('#catalog-spec-link');
  const reset = document.querySelector('#catalog-reset');
  const categories = new Set(buttons.map(button => button.dataset.filter));
  const categoryDetails = {
    fabrics: { label: 'PUL Fabric', route: '/pul-fabric/', noun: 'PUL fabric', note: true },
    'inner-fabric': { label: 'Inner Fabrics', route: '/inner-fabric/', noun: 'inner fabric' },
    pads: { label: 'Menstrual Pads', route: '/reusable-menstrual-pads/', noun: 'menstrual pad' },
    nursing: { label: 'Nursing Pads', route: '/reusable-nursing-pads/', noun: 'nursing pad' },
    diapers: { label: 'Cloth Diapers', route: '/cloth-diapers/', noun: 'cloth diaper' },
    swim: { label: 'Swim Diapers', route: '/reusable-swim-diapers/', noun: 'swim diaper' },
    bibs: { label: 'Baby Bibs', route: '/baby-bibs/', noun: 'baby bib' },
    'diaper-inserts': { label: 'Diaper Inserts', route: '/cloth-diapers/inserts/', noun: 'diaper insert' },
    'makeup-remover-pads': { label: 'Makeup Remover Pads', route: '/makeup-remover-pads/', noun: 'makeup remover pad' },
    accessories: { label: 'Wet Bags & Accessories', route: '/accessories/wet-bags/', noun: 'wet bag or accessory' }
  };
  const aliases = {
    'pul-fabric': 'fabrics',
    'inner-fabrics': 'inner-fabric',
    'nursing-pads': 'nursing',
    'swim-diapers': 'swim',
    'baby-bibs': 'bibs',
    'menstrual-pads': 'pads',
    'cloth-diapers': 'diapers',
    'inserts': 'diaper-inserts',
    'diaper-inserts': 'diaper-inserts',
    'makeup-remover': 'makeup-remover-pads',
    'wet-bags': 'accessories'
  };
  const requested = new URLSearchParams(location.search).get('category');
  const initial = aliases[requested] || requested;
  let selected = categories.has(initial) ? initial : 'all';
  const render = () => {
    const query = search ? search.value.trim().toLocaleLowerCase() : '';
    let visible = 0;
    cards.forEach(card => {
      const show = (selected === 'all' || card.dataset.category === selected) &&
        (card.dataset.name || card.textContent).toLocaleLowerCase().includes(query);
      card.hidden = !show;
      if (show) visible++;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === selected)));
    if (count) {
      const label = selected === 'all' ? 'style / material reference' : `${categoryDetails[selected].label} reference`;
      count.textContent = `${visible} ${label}${visible === 1 ? '' : 's'}`;
    }
    if (empty) empty.hidden = visible !== 0;
    if (title && context) {
      if (selected === 'all') {
        title.textContent = 'Browse style and material references.';
        context.textContent = 'Explore product photos and material references across the ReuseCare range. Choose a category to review its styles, then use the specification page to prepare your inquiry.';
      } else {
        const detail = categoryDetails[selected];
        title.textContent = `${detail.label} references`;
        context.textContent = `Review ${detail.noun} styles and material references. Confirm the selected model, order details and availability on its specification page before preparing your inquiry.`;
      }
    }
    if (fabricNote) fabricNote.hidden = selected !== 'fabrics';
    if (specLink) {
      specLink.hidden = selected === 'all' || selected === 'fabrics';
      const link = specLink.querySelector('a');
      const detail = categoryDetails[selected];
      if (link && detail && selected !== 'all' && selected !== 'fabrics') {
        link.href = detail.route;
        link.textContent = `View ${detail.label} specifications →`;
      }
    }
  };
  buttons.forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.filter;
    const url = new URL(location.href);
    if (selected === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', selected);
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    render();
  }));
  if (search) search.addEventListener('input', render);
  if (reset) reset.addEventListener('click', () => {
    selected = 'all';
    if (search) search.value = '';
    const url = new URL(location.href);
    url.searchParams.delete('category');
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    render();
    if (search) search.focus();
  });
  controls.hidden = false;
  render();
})();
