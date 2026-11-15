/* Home page */
document.addEventListener('DOMContentLoaded', () => {
  const books = Store.books();
  const genres = Store.genres();

  App.qs('#stat-books').textContent = books.length;
  App.qs('#stat-genres').textContent = genres.length;

  const popular = [...books].sort((a, b) => (b.sold || 0) - (a.sold || 0));

  // Decorative stack of the most popular covers
  App.qs('#hero-art').innerHTML = popular.slice(0, 4).map(b => App.coverHTML(b)).join('');

  // Popular grid
  App.qs('#featured-grid').innerHTML = popular.slice(0, 8).map(App.bookCardHTML).join('');

  // Genre shortcuts
  App.qs('#genre-chips').innerHTML = genres
    .map(g => `<a class="chip" href="${App.paths.catalog}?genre=${encodeURIComponent(g)}">${App.esc(g)}</a>`)
    .join('');

  // Search
  const form = App.qs('#hero-search');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = App.qs('#hero-q').value.trim();
    location.href = `${App.paths.catalog}${q ? `?q=${encodeURIComponent(q)}` : ''}`;
  });
});
