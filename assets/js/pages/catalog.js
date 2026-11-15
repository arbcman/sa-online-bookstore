/* Book catalogue — search by title/author + genre filter */
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = App.qs('#catalog-q');
  const genreSelect = App.qs('#catalog-genre');
  const grid = App.qs('#catalog-grid');
  const emptyHost = App.qs('#catalog-empty');
  const resultLine = App.qs('#result-line');

  const allBooks = Store.books();
  const state = {
    q: App.param('q') || '',
    genre: App.param('genre') || ''
  };

  // Genre options come from the catalogue itself
  const genres = [...new Set(allBooks.map(b => b.genre))].sort();
  genreSelect.insertAdjacentHTML('beforeend',
    genres.map(g => `<option value="${App.esc(g)}">${App.esc(g)}</option>`).join(''));

  // Reflect URL state in the controls
  searchInput.value = state.q;
  if (genres.includes(state.genre)) genreSelect.value = state.genre;
  else state.genre = '';

  function normalize(value) {
    return String(value).toLowerCase().trim();
  }

  function matches(book) {
    const q = normalize(state.q);
    const byGenre = !state.genre || book.genre === state.genre;
    const byText = !q ||
      normalize(book.title).includes(q) ||
      normalize(book.author).includes(q);
    return byGenre && byText;
  }

  function emptyMarkup() {
    const who = state.q ? `“${App.esc(state.q)}”` : 'those filters';
    return App.emptyState({
      icon: '🔍',
      title: `No books match ${who}`,
      text: 'Try a different spelling, search by the author’s surname, or clear the filters.',
      action: '<button class="btn" type="button" id="clear-filters">Clear search and filters</button>'
    });
  }

  function syncUrl() {
    const params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.genre) params.set('genre', state.genre);
    const qs = params.toString();
    history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}`);
  }

  function render() {
    const results = allBooks.filter(matches);
    grid.innerHTML = results.map(App.bookCardHTML).join('');
    emptyHost.innerHTML = results.length ? '' : emptyMarkup();

    const parts = [];
    parts.push(`<strong>${results.length}</strong> ${results.length === 1 ? 'book' : 'books'}`);
    if (state.q) parts.push(`matching “${App.esc(state.q)}”`);
    if (state.genre) parts.push(`in <strong>${App.esc(state.genre)}</strong>`);
    resultLine.innerHTML = parts.join(' ');

    const clear = App.qs('#clear-filters');
    if (clear) {
      clear.addEventListener('click', () => {
        state.q = '';
        state.genre = '';
        searchInput.value = '';
        genreSelect.value = '';
        syncUrl();
        render();
        searchInput.focus();
      });
    }

    syncUrl();
  }

  searchInput.addEventListener('input', App.debounce(() => {
    state.q = searchInput.value;
    render();
  }, 160));

  genreSelect.addEventListener('change', () => {
    state.genre = genreSelect.value;
    render();
  });

  render();
});
