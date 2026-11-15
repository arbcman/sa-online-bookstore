/* Admin — book catalogue table with search and delete */
document.addEventListener('DOMContentLoaded', () => {
  const root = App.qs('#books-root');
  if (!App.isAdmin()) return;
  const search = App.qs('#books-search');
  const subtitle = App.qs('#books-subtitle');

  let query = '';

  function matches(book) {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return [book.title, book.author, book.isbn, book.genre]
      .some(value => String(value || '').toLowerCase().includes(q));
  }

  function rowMarkup(book) {
    return `
      <tr>
        <td data-label="Book">
          <div style="display:flex;gap:.7rem;align-items:center">
            <div class="thumb">${App.coverHTML(book)}</div>
            <div>
              <div class="row-title">${App.esc(book.title)}</div>
              <div class="row-sub">${App.esc(book.author)} · ${App.esc(book.isbn || 'no ISBN')}</div>
            </div>
          </div>
        </td>
        <td data-label="Genre">${App.esc(book.genre)}</td>
        <td data-label="Price">${App.money(book.price)}</td>
        <td data-label="Stock">
          ${App.stockBadge(book)}
          <span class="muted small">${book.stock}</span>
        </td>
        <td data-label="Actions">
          <div class="cell-actions">
            <a class="btn btn--sm" href="Book_details.html?id=${encodeURIComponent(book.id)}">Edit</a>
            <button type="button" class="btn btn--sm btn--danger-ghost" data-delete="${book.id}">Delete</button>
          </div>
        </td>
      </tr>`;
  }

  function render() {
    const books = Store.books().filter(matches);
    subtitle.textContent = `${Store.books().length} titles in the catalogue · ${books.length} shown`;

    if (!books.length) {
      root.innerHTML = App.emptyState({
        icon: '🔍',
        title: 'No books match that search',
        text: 'Try a different title, author or ISBN.',
        action: '<button class="btn" type="button" id="clear-search">Clear search</button>'
      });
      App.qs('#clear-search').addEventListener('click', () => {
        search.value = '';
        query = '';
        render();
        search.focus();
      });
      return;
    }

    root.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Book</th><th>Genre</th><th>Price</th><th>Stock</th>
              <th class="right">Actions</th>
            </tr>
          </thead>
          <tbody>${books.map(rowMarkup).join('')}</tbody>
        </table>
      </div>`;
  }

  search.addEventListener('input', App.debounce(() => {
    query = search.value;
    render();
  }, 150));

  root.addEventListener('click', e => {
    const button = e.target.closest('[data-delete]');
    if (!button) return;

    const book = Store.bookById(button.dataset.delete);
    if (!book) {
      render();
      return;
    }

    const confirmed = confirm(
      `Delete “${book.title}” from the catalogue?\n\n` +
      'It will be removed from customer carts. Past orders keep their own copy of the title.'
    );
    if (!confirmed) return;

    Store.deleteBook(book.id);
    App.toast(`Deleted “${book.title}”.`, 'ok');
    render();
  });

  render();
});
