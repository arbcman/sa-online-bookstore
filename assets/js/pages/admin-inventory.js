/* Admin — inventory: stock levels, low/out filters, quick and custom restocking */
document.addEventListener('DOMContentLoaded', () => {
  const root = App.qs('#inventory-root');
  const statsHost = App.qs('#inventory-stats');
  const filtersHost = App.qs('#stock-filters');
  const subtitle = App.qs('#inventory-subtitle');

  if (!App.isAdmin()) return;

  const modal = App.mountModal('restock-modal');
  const form = App.qs('#restock-form');
  const amountInput = App.qs('#restock-amount');
  const bookName = App.qs('#restock-book-name');
  const currentStock = App.qs('#restock-current');

  const state = { filter: 'All', bookId: null };

  const FILTERS = [
    { key: 'All', label: 'All books' },
    { key: 'low', label: 'Low stock' },
    { key: 'out', label: 'Out of stock' }
  ];

  /* ---------- derived data ---------- */
  function sortedBooks() {
    return Store.books().slice().sort((a, b) => {
      if (a.stock !== b.stock) return a.stock - b.stock;
      return a.title.localeCompare(b.title);
    });
  }

  function matchesFilter(book) {
    if (state.filter === 'All') return true;
    return Store.bookStockStatus(book) === state.filter;
  }

  /* ---------- stats ---------- */
  function statCard(label, value, hint, className = '') {
    return `
      <div class="stat ${className}">
        <div class="stat__label">${label}</div>
        <div class="stat__value">${value}</div>
        <div class="stat__hint">${hint}</div>
      </div>`;
  }

  function renderStats() {
    const list = Store.books();
    const copies = list.reduce((sum, book) => sum + book.stock, 0);
    const low = list.filter(book => Store.bookStockStatus(book) === 'low').length;
    const out = list.filter(book => Store.bookStockStatus(book) === 'out').length;

    statsHost.innerHTML = `
      ${statCard('Titles', list.length, 'In the catalogue', 'stat--accent')}
      ${statCard('Copies on hand', copies.toLocaleString(), 'Across all titles', '')}
      ${statCard('Low stock', low, `Below ${Store.LOW_STOCK_AT} copies`, 'stat--warn')}
      ${statCard('Out of stock', out, out ? 'Needs restocking' : 'Nothing sold out', out ? 'stat--warn' : '')}`;
  }

  /* ---------- filter chips ---------- */
  function renderFilters() {
    const list = Store.books();
    const counts = {
      All: list.length,
      low: list.filter(book => Store.bookStockStatus(book) === 'low').length,
      out: list.filter(book => Store.bookStockStatus(book) === 'out').length
    };

    filtersHost.innerHTML = FILTERS.map(({ key, label }) => `
      <button type="button" class="chip ${state.filter === key ? 'is-active' : ''}" data-filter="${key}">
        ${label} <span class="muted">${counts[key]}</span>
      </button>`).join('');
  }

  /* ---------- table ---------- */
  function rowMarkup(book) {
    const value = App.money(book.price * book.stock);

    return `
      <tr data-id="${App.esc(book.id)}">
        <td data-label="Book">
          <div style="display:flex;gap:.7rem;align-items:center">
            <div class="thumb">${App.coverHTML(book)}</div>
            <div>
              <div class="row-title">
                <a href="Book_details.html?id=${encodeURIComponent(book.id)}">${App.esc(book.title)}</a>
              </div>
              <div class="row-sub">${App.esc(book.author)} · ${App.esc(book.genre)}</div>
            </div>
          </div>
        </td>
        <td data-label="Price">${App.money(book.price)}</td>
        <td data-label="Stock">
          ${App.stockBadge(book)}
          <div class="row-sub">${book.stock} copies</div>
        </td>
        <td data-label="Stock value">${value}</td>
        <td data-label="Restock">
          <div class="cell-actions">
            <button type="button" class="btn btn--sm" data-restock="${App.esc(book.id)}" data-amount="10">+10</button>
            <button type="button" class="btn btn--sm" data-restock="${App.esc(book.id)}" data-amount="25">+25</button>
            <button type="button" class="btn btn--sm btn--primary" data-restock="${App.esc(book.id)}">Restock…</button>
            <a class="btn btn--sm btn--ghost" href="Book_details.html?id=${encodeURIComponent(book.id)}">Edit</a>
          </div>
        </td>
      </tr>`;
  }

  function renderTable() {
    const all = sortedBooks();
    const visible = all.filter(matchesFilter);
    const copies = all.reduce((sum, book) => sum + book.stock, 0);

    subtitle.textContent =
      `${all.length} title${all.length === 1 ? '' : 's'} · ${copies} copies on hand · ` +
      `${all.filter(book => book.stock <= 0).length} out of stock`;

    if (!visible.length) {
      root.innerHTML = App.emptyState({
        icon: state.filter === 'out' ? '📭' : '📚',
        title: state.filter === 'low'
          ? 'No books are low on stock'
          : state.filter === 'out'
            ? 'Nothing is out of stock'
            : 'No books in the catalogue',
        text: state.filter === 'All'
          ? 'Add a book to start tracking its stock.'
          : 'Every title is in a healthy position. Switch back to “All books” to see the full list.',
        action: state.filter === 'All'
          ? '<a class="btn btn--primary" href="Book_details.html">+ Add book</a>'
          : '<button class="btn" type="button" id="clear-filter">Show all books</button>'
      });

      const clear = App.qs('#clear-filter');
      if (clear) {
        clear.addEventListener('click', () => {
          state.filter = 'All';
          renderFilters();
          renderTable();
        });
      }
      return;
    }

    root.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Book</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Stock value</th>
              <th class="right">Restock</th>
            </tr>
          </thead>
          <tbody>${visible.map(rowMarkup).join('')}</tbody>
        </table>
      </div>`;
  }

  function render() {
    renderStats();
    renderFilters();
    renderTable();
  }

  /* ---------- restocking ---------- */
  function openRestock(book, presetAmount) {
    state.bookId = book.id;

    bookName.innerHTML =
      `Restocking <strong>${App.esc(book.title)}</strong> by ${App.esc(book.author)}.`;
    currentStock.textContent = book.stock;
    amountInput.value = presetAmount || 10;
    App.clearErrors(form);

    modal.open();
    amountInput.focus();
    amountInput.select();
  }

  function restock(book, amount) {
    const updated = Store.restockBook(book.id, amount);
    if (!updated) {
      App.toast('That book no longer exists. Refresh and try again.', 'error');
      render();
      return;
    }

    App.toast(
      `Added ${amount} ${amount === 1 ? 'copy' : 'copies'} of “${updated.title}” — now ${updated.stock} in stock.`,
      'ok'
    );
    render();
  }

  filtersHost.addEventListener('click', e => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    state.filter = chip.dataset.filter;
    renderFilters();
    renderTable();
  });

  root.addEventListener('click', e => {
    const button = e.target.closest('[data-restock]');
    if (!button) return;

    const book = Store.bookById(button.dataset.restock);
    if (!book) {
      App.toast('That book no longer exists.', 'error');
      render();
      return;
    }

    const amount = button.dataset.amount;
    if (amount) {
      restock(book, Number(amount));
      return;
    }

    openRestock(book);
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    const book = state.bookId ? Store.bookById(state.bookId) : null;
    if (!book) {
      modal.close();
      App.toast('That book no longer exists.', 'error');
      render();
      return;
    }

    const amount = Number(amountInput.value);
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 1) {
      App.fieldError(amountInput, 'Enter a whole number of copies, 1 or more.');
      return;
    }

    modal.close();
    restock(book, amount);
  });

  amountInput.addEventListener('input', () => App.clearFieldError(amountInput));

  render();
});
