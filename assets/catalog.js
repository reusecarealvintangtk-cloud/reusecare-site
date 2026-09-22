(() => {
  const controls = document.querySelector('#catalog-tools');
  if (!controls) return;
  const cards = [...document.querySelectorAll('.catalog-card')];
  const buttons = [...controls.querySelectorAll('[data-filter]')];
  const search = document.querySelector('#catalog-search');
  const count = document.querySelector('#catalog-count');
  const empty = document.querySelector('#catalog-empty');
  const categories = new Set(buttons.map(button => button.dataset.filter));
  const initial = new URLSearchParams(location.search).get('category');
  let selected = categories.has(initial) ? initial : 'all';
  const render = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const show = (selected === 'all' || card.dataset.category === selected) &&
        card.dataset.name.toLocaleLowerCase().includes(query);
      card.hidden = !show;
      if (show) visible++;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === selected)));
    count.textContent = visible + (visible === 1 ? ' product line' : ' product lines');
    empty.hidden = visible !== 0;
  };
  buttons.forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.filter;
    render();
  }));
  search.addEventListener('input', render);
  document.querySelector('#catalog-reset').addEventListener('click', () => {
    selected = 'all';
    search.value = '';
    render();
    search.focus();
  });
  controls.hidden = false;
  render();
})();
