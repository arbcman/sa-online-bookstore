/* My orders — history with expandable details and status timeline */
document.addEventListener('DOMContentLoaded', () => {
  const root = App.qs('#orders-root');
  const subtitle = App.qs('#orders-subtitle');
  const user = App.user();
  if (!user || user.role !== 'customer') return;
  const orders = Store.ordersForUser(user.id);

  function timeline(order) {
    if (order.status === 'Cancelled') {
      return `<div class="timeline"><span class="timeline__step is-cancelled">Cancelled</span></div>`;
    }
    const index = Store.STATUS_FLOW.indexOf(order.status);
    return `
      <div class="timeline">
        ${Store.STATUS_FLOW.map((step, i) => `
          <span class="timeline__step ${i <= index ? 'is-done' : ''}">${step}</span>`).join('')}
      </div>`;
  }

  function orderCard(order) {
    const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
    const addr = order.deliveryAddress;

    return `
      <article class="card order-card" data-id="${App.esc(order.id)}">
        <div class="order-card__head">
          <div>
            <div class="order-card__id">${App.esc(order.id)}</div>
            <div class="order-card__date">
              Placed ${App.formatDate(order.createdAt)} · ${itemCount} item${itemCount === 1 ? '' : 's'}
            </div>
          </div>
          ${App.statusBadge(order.status)}
          <span class="order-card__total">${App.money(order.total)}</span>
          <button type="button" class="order-card__toggle" aria-expanded="false">Details ▾</button>
        </div>

        <div class="order-card__body">
          ${timeline(order)}

          <div class="mini-lines">
            ${order.items.map(item => `
              <div class="mini-line">
                <span>${item.qty} × ${App.esc(item.title)} <span class="muted">(${App.money(item.unitPrice)} each)</span></span>
                <span>${App.money(item.lineTotal)}</span>
              </div>`).join('')}
          </div>

          <hr class="divider" style="margin:1rem 0">

          <div class="summary__row"><span>Subtotal</span><span>${App.money(order.subtotal)}</span></div>
          <div class="summary__row"><span>Delivery</span><span>${order.delivery === 0 ? 'Free' : App.money(order.delivery)}</span></div>
          <div class="summary__row"><span>VAT (14%)</span><span>${App.money(order.vat)}</span></div>
          <div class="summary__row summary__row--total"><span>Total</span><span class="price">${App.money(order.total)}</span></div>

          <hr class="divider" style="margin:1rem 0">

          <div class="field-row">
            <div class="detail-block">
              <h4>Delivery address</h4>
              <p>
                ${App.esc(addr.street)}<br>
                ${App.esc(addr.city)}, ${App.esc(addr.governorate)} ${App.esc(addr.postalCode)}<br>
                <span class="muted small">${App.esc(addr.phone)}</span>
                ${addr.notes ? `<br><span class="muted small">Note: ${App.esc(addr.notes)}</span>` : ''}
              </p>
            </div>
            <div class="detail-block">
              <h4>Payment</h4>
              <p>${App.esc(order.paymentMethod)}</p>
              <h4 style="margin-top:.8rem">Last update</h4>
              <p>${App.formatDate(order.updatedAt)}</p>
            </div>
          </div>
        </div>
      </article>`;
  }

  if (!orders.length) {
    subtitle.textContent = 'No orders yet.';
    root.innerHTML = App.emptyState({
      icon: '📦',
      title: 'You have not placed an order yet',
      text: 'Once you check out, your orders and their delivery status will appear here.',
      action: '<a class="btn btn--primary" href="Book_Catalog.html">Start shopping</a>'
    });
    return;
  }

  const active = orders.filter(o => o.status !== 'Cancelled').length;
  subtitle.textContent = `${orders.length} order${orders.length === 1 ? '' : 's'} · ${active} active`;

  root.innerHTML = orders.map(orderCard).join('');

  root.addEventListener('click', e => {
    const button = e.target.closest('.order-card__toggle');
    if (!button) return;

    const card = button.closest('.order-card');
    const open = card.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Hide details ▴' : 'Details ▾';
  });
});
