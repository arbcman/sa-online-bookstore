/* Admin — order management: filter, search, view, advance, cancel */
document.addEventListener('DOMContentLoaded', () => {
  const root = App.qs('#orders-root');
  if (!App.isAdmin()) return;

  const chipsHost = App.qs('#status-chips');
  const search = App.qs('#orders-search');
  const subtitle = App.qs('#orders-subtitle');
  const modalTitle = App.qs('#order-modal-title');
  const modalBody = App.qs('#order-modal-body');
  const modalFoot = App.qs('#order-modal-foot');

  const modal = App.mountModal('order-modal');
  const state = { status: 'All', q: '' };

  /* ---------- helpers ---------- */
  function filteredOrders() {
    const q = state.q.toLowerCase().trim();
    return Store.allOrders().filter(order => {
      const byStatus = state.status === 'All' || order.status === state.status;
      const byText = !q ||
        order.id.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.email.toLowerCase().includes(q);
      return byStatus && byText;
    });
  }

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

  /* ---------- status chips ---------- */
  function renderChips() {
    const all = Store.allOrders();
    const counts = { All: all.length };
    Store.ALL_STATUSES.forEach(status => {
      counts[status] = all.filter(order => order.status === status).length;
    });

    chipsHost.innerHTML = ['All', ...Store.ALL_STATUSES].map(status => `
      <button type="button" class="chip ${state.status === status ? 'is-active' : ''}" data-status="${status}">
        ${status} <span class="muted">${counts[status]}</span>
      </button>`).join('');
  }

  /* ---------- table ---------- */
  function rowMarkup(order) {
    const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
    return `
      <tr>
        <td data-label="Order">
          <span class="row-title">${App.esc(order.id)}</span>
          <div class="row-sub">${App.formatDate(order.createdAt)}</div>
        </td>
        <td data-label="Customer">
          ${App.esc(order.customerName)}
          <div class="row-sub">${App.esc(order.email)}</div>
        </td>
        <td data-label="Items">${itemCount}</td>
        <td data-label="Total">${App.money(order.total)}</td>
        <td data-label="Status">${App.statusBadge(order.status)}</td>
        <td data-label="Actions">
          <div class="cell-actions">
            <button type="button" class="btn btn--sm" data-view="${App.esc(order.id)}">View</button>
          </div>
        </td>
      </tr>`;
  }

  function render() {
    const all = Store.allOrders();
    const pending = all.filter(o => o.status === 'Pending').length;
    subtitle.textContent = `${all.length} order${all.length === 1 ? '' : 's'} · ${pending} pending`;

    const orders = filteredOrders();

    if (!orders.length) {
      root.innerHTML = App.emptyState({
        icon: '📦',
        title: all.length ? 'No orders match these filters' : 'No orders yet',
        text: all.length
          ? 'Try another status or clear the search.'
          : 'Orders appear here as soon as customers check out.',
        action: all.length ? '' : '<a class="btn" href="Book_Catalog.html">Manage books</a>'
      });
      return;
    }

    root.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th>
              <th class="right">Actions</th>
            </tr>
          </thead>
          <tbody>${orders.map(rowMarkup).join('')}</tbody>
        </table>
      </div>`;
  }

  /* ---------- modal ---------- */
  function openOrder(orderId) {
    const order = Store.orderById(orderId);
    if (!order) return;

    const addr = order.deliveryAddress;
    modalTitle.textContent = `Order ${order.id}`;

    modalBody.innerHTML = `
      <div class="btn-row" style="justify-content:space-between;margin-bottom:1rem">
        ${App.statusBadge(order.status)}
        <span class="muted small">Placed ${App.formatDate(order.createdAt)} · updated ${App.formatDate(order.updatedAt)}</span>
      </div>

      ${timeline(order)}

      <div class="mini-lines" style="margin-top:1rem">
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
          <h4>Customer</h4>
          <p>${App.esc(order.customerName)}<br><span class="muted small">${App.esc(order.email)}</span></p>
        </div>
        <div class="detail-block">
          <h4>Payment</h4>
          <p>${App.esc(order.paymentMethod)}</p>
        </div>
      </div>

      <div class="detail-block">
        <h4>Delivery address</h4>
        <p>
          ${App.esc(addr.street)}<br>
          ${App.esc(addr.city)}, ${App.esc(addr.governorate)} ${App.esc(addr.postalCode)}<br>
          <span class="muted small">${App.esc(addr.phone)}</span>
          ${addr.notes ? `<br><span class="muted small">Note: ${App.esc(addr.notes)}</span>` : ''}
        </p>
      </div>`;

    const stepIndex = Store.STATUS_FLOW.indexOf(order.status);
    const nextStatus = stepIndex >= 0 ? Store.STATUS_FLOW[stepIndex + 1] : null;

    if (nextStatus) {
      modalFoot.innerHTML = `
        <button type="button" class="btn btn--danger-ghost" id="cancel-order">Cancel order</button>
        <button type="button" class="btn btn--primary" id="advance-order">Mark as ${nextStatus}</button>`;
    } else if (order.status === 'Delivered') {
      modalFoot.innerHTML = `<span class="muted small">Delivered — no further actions.</span>`;
    } else {
      modalFoot.innerHTML = `<span class="muted small">Cancelled — stock has been returned to the catalogue.</span>`;
    }

    const advanceBtn = App.qs('#advance-order');
    if (advanceBtn) {
      advanceBtn.addEventListener('click', () => {
        const result = Store.advanceOrder(order.id);
        if (!result.ok) {
          App.toast(result.error, 'error');
          return;
        }
        modal.close();
        App.toast(`Order ${order.id} marked as ${result.order.status}.`, 'ok');
        renderChips();
        render();
      });
    }

    const cancelBtn = App.qs('#cancel-order');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (!confirm(`Cancel order ${order.id}?\n\nThe reserved stock will be returned to the catalogue.`)) return;
        const result = Store.cancelOrder(order.id);
        if (!result.ok) {
          App.toast(result.error, 'error');
          return;
        }
        modal.close();
        App.toast(`Order ${order.id} cancelled and stock restored.`, 'ok');
        renderChips();
        render();
      });
    }

    modal.open();
  }

  /* ---------- wiring ---------- */
  chipsHost.addEventListener('click', e => {
    const chip = e.target.closest('[data-status]');
    if (!chip) return;
    state.status = chip.dataset.status;
    renderChips();
    render();
  });

  search.addEventListener('input', App.debounce(() => {
    state.q = search.value;
    render();
  }, 150));

  root.addEventListener('click', e => {
    const button = e.target.closest('[data-view]');
    if (button) openOrder(button.dataset.view);
  });

  renderChips();
  render();
});
