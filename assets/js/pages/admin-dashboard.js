/* Admin dashboard — KPIs, recent orders, low stock, best sellers, genre revenue */
document.addEventListener('DOMContentLoaded', () => {
  const root = App.qs('#dashboard-root');
  if (!App.isAdmin()) return;
  const stats = Store.stats();

  function statCard(label, value, hint, className = '') {
    return `
      <div class="stat ${className}">
        <div class="stat__label">${label}</div>
        <div class="stat__value">${value}</div>
        <div class="stat__hint">${hint}</div>
      </div>`;
  }

  function recentOrdersTable() {
    if (!stats.recentOrders.length) {
      return App.emptyState({ icon: '📦', title: 'No orders yet', text: 'Orders will appear here as customers check out.' });
    }
    return `
      <div class="table-wrap" style="border:0;border-radius:0">
        <table>
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Status</th><th class="right">Total</th></tr>
          </thead>
          <tbody>
            ${stats.recentOrders.map(order => `
              <tr>
                <td data-label="Order">
                  <span class="row-title">${App.esc(order.id)}</span>
                  <div class="row-sub">${App.formatDate(order.createdAt)}</div>
                </td>
                <td data-label="Customer">${App.esc(order.customerName)}</td>
                <td data-label="Status">${App.statusBadge(order.status)}</td>
                <td data-label="Total" class="right">${App.money(order.total)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function lowStockList() {
    if (!stats.lowStock.length) {
      return `<p class="muted small">Every title is comfortably in stock. 🎉</p>`;
    }
    return `
      <div class="mini-lines">
        ${stats.lowStock.map(book => `
          <div class="mini-line" style="align-items:center">
            <span>
              <a href="Book_details.html?id=${encodeURIComponent(book.id)}">${App.esc(book.title)}</a>
              <span class="muted tiny"> · ${book.stock} left</span>
            </span>
            ${App.stockBadge(book)}
          </div>`).join('')}
      </div>`;
  }

  function bestSellersTable() {
    return `
      <div class="table-wrap" style="border:0;border-radius:0">
        <table>
          <thead><tr><th>Book</th><th>Sold</th><th class="right">Price</th></tr></thead>
          <tbody>
            ${stats.topBooks.map(book => `
              <tr>
                <td data-label="Book">
                  <span class="row-title">${App.esc(book.title)}</span>
                  <div class="row-sub">${App.esc(book.author)}</div>
                </td>
                <td data-label="Sold">${book.sold || 0}</td>
                <td data-label="Price" class="right">${App.money(book.price)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function genreBars() {
    if (!stats.revenueByGenre.length) {
      return `<p class="muted small">No sales data yet.</p>`;
    }
    const max = Math.max(...stats.revenueByGenre.map(g => g.amount), 1);
    return `
      <div class="bar-list">
        ${stats.revenueByGenre.map(({ genre, amount }) => `
          <div class="bar-row">
            <div class="bar-row__top">
              <span>${App.esc(genre)}</span>
              <strong>${App.money(amount)}</strong>
            </div>
            <div class="bar"><span style="width:${Math.max(4, (amount / max) * 100)}%"></span></div>
          </div>`).join('')}
      </div>`;
  }

  root.innerHTML = `
    <div class="stat-grid">
      ${statCard('Revenue', App.money(stats.revenue), 'Cancelled orders excluded', 'stat--accent')}
      ${statCard('Orders', stats.orderCount, `${stats.activeOrderCount} active`, '')}
      ${statCard('Books', stats.bookCount, 'Titles in the catalogue', '')}
      ${statCard('Low stock', stats.lowStockCount, `Below ${Store.LOW_STOCK_AT} copies`, 'stat--warn')}
    </div>

    <div class="admin-grid">
      <section class="card">
        <div class="card__head">
          <h2>Recent orders</h2>
          <a class="btn btn--sm" href="Orders.html">All orders →</a>
        </div>
        ${recentOrdersTable()}
      </section>

      <section class="card">
        <div class="card__head">
          <h2>Low stock</h2>
          <a class="btn btn--sm" href="Inventory.html">Restock →</a>
        </div>
        <div class="card__body">${lowStockList()}</div>
      </section>
    </div>

    <div class="admin-grid mt-3">
      <section class="card">
        <div class="card__head">
          <h2>Best sellers</h2>
          <a class="btn btn--sm" href="Book_Catalog.html">Manage books →</a>
        </div>
        ${bestSellersTable()}
      </section>

      <section class="card">
        <div class="card__head"><h2>Revenue by genre</h2></div>
        <div class="card__body">${genreBars()}</div>
      </section>
    </div>`;

  // Keep the subtitle honest about the data source
  App.qs('#dashboard-subtitle').textContent =
    `Catalogue, stock and order performance · ${stats.orderCount} orders · ${stats.bookCount} titles`;
});
