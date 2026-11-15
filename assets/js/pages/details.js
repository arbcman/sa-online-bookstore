/* Book details — renders the selected book, quantity stepper and add-to-cart */
document.addEventListener('DOMContentLoaded', () => {
  const root = App.qs('#detail-root');
  const id = App.param('id');
  const book = id ? Store.bookById(id) : null;

  if (!book) {
    root.innerHTML = `
      <p class="breadcrumb"><a href="Index.html">Home</a><span>/</span>Book details</p>
      ${App.emptyState({
        icon: '📕',
        title: 'Book not found',
        text: 'That title may have been removed from the catalogue.',
        action: '<a class="btn btn--primary" href="Book_Catalog.html">Browse the catalogue</a>'
      })}`;
    return;
  }

  document.title = `${book.title} · SA Online Bookstore`;
  const out = Store.bookStockStatus(book) === 'out';
  const maxQty = Math.max(0, Math.min(book.stock, 99));

  root.innerHTML = `
    <p class="breadcrumb">
      <a href="Index.html">Home</a><span>/</span>
      <a href="Book_Catalog.html">Books</a><span>/</span>
      <span>${App.esc(book.title)}</span>
    </p>

    <div class="detail">
      <div class="detail__cover">${App.coverHTML(book)}</div>

      <div>
        <div class="detail__meta">
          <a class="badge badge--accent" href="Book_Catalog.html?genre=${encodeURIComponent(book.genre)}">${App.esc(book.genre)}</a>
          <span class="badge">${App.esc(book.publisher)}</span>
          <span class="badge">${App.esc(book.year)}</span>
          ${App.stockBadge(book)}
        </div>

        <h1>${App.esc(book.title)}</h1>
        <p class="detail__author">
          by <a href="Book_Catalog.html?q=${encodeURIComponent(book.author)}">${App.esc(book.author)}</a>
        </p>

        <div class="prose">
          <p>${App.esc(book.description)}</p>
        </div>

        <div class="buybox">
          <span class="price price--lg">${App.money(book.price)}</span>

          ${out ? `
            <span class="badge badge--danger">Out of stock</span>
            <button class="btn btn--primary btn--lg" type="button" disabled>Add to cart</button>
          ` : `
            <div class="qty" role="group" aria-label="Quantity">
              <button type="button" id="qty-minus" aria-label="Decrease quantity">−</button>
              <input type="number" id="qty-input" value="1" min="1" max="${maxQty}" aria-label="Quantity">
              <button type="button" id="qty-plus" aria-label="Increase quantity">+</button>
            </div>
            <button class="btn btn--primary btn--lg" type="button" id="add-to-cart">Add to cart</button>
          `}
        </div>

        ${out ? `
          <div class="notice notice--warn mb-0" style="margin-bottom:1.6rem">
            <span aria-hidden="true">!</span>
            <span>This title is currently out of stock. Check back soon or browse another shelf.</span>
          </div>
        ` : ''}

        <hr class="divider">

        <dl class="meta-list">
          <dt>ISBN</dt><dd>${App.esc(book.isbn || '—')}</dd>
          <dt>Publisher</dt><dd>${App.esc(book.publisher || '—')}</dd>
          <dt>Year</dt><dd>${App.esc(book.year)}</dd>
          <dt>Genre</dt><dd><a href="Book_Catalog.html?genre=${encodeURIComponent(book.genre)}">${App.esc(book.genre)}</a></dd>
          <dt>Availability</dt>
          <dd>${book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}</dd>
        </dl>
      </div>
    </div>`;

  // Quantity stepper
  const minus = App.qs('#qty-minus');
  const plus = App.qs('#qty-plus');
  const input = App.qs('#qty-input');
  const addBtn = App.qs('#add-to-cart');

  function readQty() {
    const n = Math.floor(Number(input.value));
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(n, maxQty);
  }

  function syncQty() {
    const q = readQty();
    input.value = q;
    if (minus) minus.disabled = q <= 1;
    if (plus) plus.disabled = q >= maxQty;
  }

  if (input) {
    input.addEventListener('input', syncQty);
    input.addEventListener('blur', syncQty);
    minus.addEventListener('click', () => {
      input.value = Math.max(1, readQty() - 1);
      syncQty();
    });
    plus.addEventListener('click', () => {
      input.value = Math.min(maxQty, readQty() + 1);
      syncQty();
    });
    syncQty();
  }

  // Add to cart
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const user = App.user();

      if (!user) {
        App.flash('Sign in to add books to your cart.', 'info');
        location.href = `${App.paths.login}?next=${encodeURIComponent(`Book_details.html?id=${book.id}`)}`;
        return;
      }

      if (user.role !== 'customer') {
        App.toast('Administrators cannot shop from the storefront.', 'error');
        return;
      }

      const qty = readQty();
      const result = Store.addToCart(user.id, book.id, qty);

      if (!result.ok) {
        App.toast(result.error, 'error');
        return;
      }

      App.refreshCart();
      App.toast(`Added ${qty} × “${book.title}” to your cart.`, 'ok');
    });
  }

  // Related books from the same genre
  const related = Store.books()
    .filter(b => b.genre === book.genre && b.id !== book.id)
    .slice(0, 4);

  if (related.length) {
    const section = App.qs('#related-section');
    App.qs('#related-grid').innerHTML = related.map(App.bookCardHTML).join('');
    section.hidden = false;
  }
});
