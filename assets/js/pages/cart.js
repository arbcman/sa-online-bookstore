/* Shopping cart — quantity changes, removal, live totals */
document.addEventListener('DOMContentLoaded', () => {
  const root = App.qs('#cart-root');
  const subtitle = App.qs('#cart-subtitle');
  const user = App.user();
  if (!user || user.role !== 'customer') return;

  function lineMarkup(line) {
    const { book, qty, lineTotal, overStock } = line;
    const atMax = qty >= book.stock;

    return `
      <div class="cart-line" data-id="${book.id}">
        <a href="Book_details.html?id=${encodeURIComponent(book.id)}" aria-label="${App.esc(book.title)}">
          ${App.coverHTML(book)}
        </a>

        <div>
          <p class="cart-line__title">
            <a href="Book_details.html?id=${encodeURIComponent(book.id)}">${App.esc(book.title)}</a>
          </p>
          <p class="cart-line__meta">${App.esc(book.author)} · ${App.esc(book.genre)}</p>
          <p class="cart-line__meta">${App.money(book.price)} each · ${book.stock} in stock</p>
          ${overStock ? `
            <div class="notice notice--warn small" style="margin-top:.55rem;padding:.5rem .7rem">
              <span aria-hidden="true">!</span>
              <span>Only ${book.stock} left in stock — reduce the quantity before checking out.</span>
            </div>` : ''}
        </div>

        <div class="cart-line__controls">
          <div class="qty" role="group" aria-label="Quantity for ${App.esc(book.title)}">
            <button type="button" data-act="minus" aria-label="Decrease quantity" ${qty <= 1 ? 'disabled' : ''}>−</button>
            <input type="number" data-act="qty" value="${qty}" min="1" max="${Math.max(book.stock, 1)}"
                   aria-label="Quantity">
            <button type="button" data-act="plus" aria-label="Increase quantity" ${atMax ? 'disabled' : ''}>+</button>
          </div>
          <span class="cart-line__price">${App.money(lineTotal)}</span>
          <button type="button" class="icon-btn" data-act="remove"
                  aria-label="Remove ${App.esc(book.title)} from cart" title="Remove">✕</button>
        </div>
      </div>`;
  }

  function summaryMarkup(lines, sums) {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const problem = lines.some(l => l.overStock);

    return `
      <aside class="summary" aria-label="Order summary">
        <h2>Order summary</h2>

        <div class="summary__row">
          <span>Subtotal (${count} item${count === 1 ? '' : 's'})</span>
          <span>${App.money(sums.subtotal)}</span>
        </div>
        <div class="summary__row">
          <span>Delivery</span>
          <span>${sums.delivery === 0 ? 'Free' : App.money(sums.delivery)}</span>
        </div>
        <div class="summary__row">
          <span>VAT (14%)</span>
          <span>${App.money(sums.vat)}</span>
        </div>
        <div class="summary__row summary__row--total">
          <span>Total</span>
          <span class="price">${App.money(sums.total)}</span>
        </div>

        ${problem ? `
          <div class="notice notice--warn small" style="margin-top:1rem">
            <span aria-hidden="true">!</span>
            <span>Some quantities exceed current stock. Adjust them to continue.</span>
          </div>
          <button class="btn btn--primary btn--block" type="button" disabled>Proceed to checkout</button>
        ` : `
          <a class="btn btn--primary btn--block" href="Checkout.html">Proceed to checkout →</a>
        `}

        <p class="summary__note">
          ${sums.delivery === 0
            ? 'Delivery is free on this order.'
            : `Free delivery on orders over ${App.money(Store.FREE_DELIVERY_FROM)}.`}
        </p>
      </aside>`;
  }

  function render() {
    const lines = Store.cartDetailed(user.id);

    if (!lines.length) {
      subtitle.textContent = 'Your cart is waiting for its first book.';
      root.innerHTML = App.emptyState({
        icon: '🛒',
        title: 'Your cart is empty',
        text: 'Browse the catalogue, find something you like and add it here.',
        action: '<a class="btn btn--primary" href="Book_Catalog.html">Browse books</a>'
      });
      return;
    }

    const count = lines.reduce((s, l) => s + l.qty, 0);
    subtitle.textContent = `${count} item${count === 1 ? '' : 's'} in your cart`;
    const sums = Store.totals(lines.reduce((s, l) => s + l.lineTotal, 0));

    root.innerHTML = `
      <div class="cart-layout">
        <div class="cart-list">${lines.map(lineMarkup).join('')}</div>
        ${summaryMarkup(lines, sums)}
      </div>`;
  }

  function applyQuantity(bookId, value, max) {
    const qty = Math.max(1, Math.min(max, Math.floor(Number(value) || 1)));
    const result = Store.setCartQty(user.id, bookId, qty);
    if (!result.ok) App.toast(result.error, 'error');
    else App.refreshCart();
    render();
  }

  // Event delegation: the list is re-rendered after every change
  root.addEventListener('click', e => {
    const button = e.target.closest('[data-act]');
    if (!button || !root.contains(button)) return;

    const line = button.closest('.cart-line');
    if (!line) return;

    const bookId = line.dataset.id;
    const book = Store.bookById(bookId);
    if (!book) {
      render();
      return;
    }

    const input = line.querySelector('[data-act="qty"]');
    const current = Math.max(1, Number(input.value) || 1);
    const action = button.dataset.act;

    if (action === 'remove') {
      Store.removeFromCart(user.id, bookId);
      App.refreshCart();
      App.toast(`Removed “${book.title}” from your cart.`, 'ok');
      render();
      return;
    }

    if (action === 'minus') applyQuantity(bookId, current - 1, book.stock);
    if (action === 'plus') applyQuantity(bookId, current + 1, book.stock);
  });

  root.addEventListener('change', e => {
    if (!e.target.matches('[data-act="qty"]')) return;
    const line = e.target.closest('.cart-line');
    const book = Store.bookById(line.dataset.id);
    if (book) applyQuantity(book.id, e.target.value, book.stock);
  });

  render();
});
