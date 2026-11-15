/* ==========================================================================
   SA Online Bookstore — shared app shell
   Session guards, header/footer rendering, formatting, toasts, validation.
   Depends on store.js (loaded first).
   ========================================================================== */

const App = (() => {
  /* ---------- paths ---------- */
  const FOLDER = {
    customer: "../Customer's/",
    admin: "../Admin's/"
  };

  const paths = {
    home: `${FOLDER.customer}Index.html`,
    catalog: `${FOLDER.customer}Book_Catalog.html`,
    details: `${FOLDER.customer}Book_details.html`,
    cart: `${FOLDER.customer}Cart.html`,
    checkout: `${FOLDER.customer}Checkout.html`,
    orders: `${FOLDER.customer}My_Orders.html`,
    login: `${FOLDER.customer}Login.html`,
    account: `${FOLDER.customer}Account.html`,
    adminDashboard: `${FOLDER.admin}Dashboard.html`,
    adminBooks: `${FOLDER.admin}Book_Catalog.html`,
    adminBookForm: `${FOLDER.admin}Book_details.html`,
    adminOrders: `${FOLDER.admin}Orders.html`,
    adminInventory: `${FOLDER.admin}Inventory.html`
  };

  const FLASH_KEY = 'sab.flash';

  /* ---------- tiny DOM helpers ---------- */
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function param(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function money(amount) {
    return `${Store.CURRENCY} ${Store.money(amount)}`;
  }

  function initials(user) {
    if (!user) return '?';
    return `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || '?';
  }

  /* ---------- flash messages (survive a redirect) ---------- */
  function flash(message, type = 'ok') {
    try {
      sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, type }));
    } catch (err) { /* ignore */ }
  }

  function takeFlash() {
    try {
      const raw = sessionStorage.getItem(FLASH_KEY);
      sessionStorage.removeItem(FLASH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function toast(message, type = 'ok') {
    let wrap = qs('#toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toast-wrap';
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const icons = { ok: '✓', warn: '!', error: '×', info: 'i' };
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `<span class="toast__icon">${icons[type] || 'i'}</span><span>${esc(message)}</span>`;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  /* ---------- session ---------- */
  function user() {
    return Store.currentUser();
  }

  function isAdmin(u = user()) {
    return !!u && u.role === 'admin';
  }

  function requireCustomer() {
    const u = user();
    if (!u) {
      flash('Please sign in to continue.', 'info');
      const next = location.pathname.split('/').pop() + location.search;
      location.replace(`${paths.login}?next=${encodeURIComponent(next)}`);
      return null;
    }
    if (u.role !== 'customer') {
      flash('Administrators use the management area, not the shopping pages.', 'info');
      location.replace(paths.adminDashboard);
      return null;
    }
    return u;
  }

  function requireAdmin() {
    const u = user();
    if (!u) {
      flash('Please sign in with an administrator account.', 'info');
      location.replace(`${paths.login}?next=${encodeURIComponent('admin')}`);
      return null;
    }
    if (u.role !== 'admin') {
      flash('That area is for administrators only.', 'error');
      location.replace(paths.home);
      return null;
    }
    return u;
  }

  function logout() {
    Store.logout();
    flash('You have been signed out.', 'ok');
    location.href = paths.login;
  }

  /* ---------- header ---------- */
  function cartBadge(u) {
    const count = u && u.role === 'customer' ? Store.cartCount(u.id) : 0;
    return `<a class="cart-link" href="${paths.cart}" aria-label="Shopping cart, ${count} item${count === 1 ? '' : 's'}">🛒 Cart <span class="cart-count ${count ? '' : 'is-empty'}">${count}</span></a>`;
  }

  function accountMenu(u) {
    if (!u) {
      return `<a class="btn btn--primary btn--sm" href="${paths.login}">Sign in</a>`;
    }
    const name = `${u.firstName} ${u.lastName}`.trim();
    return `
      <div class="account-menu">
        <button class="account-btn" type="button" id="account-toggle" aria-expanded="false" aria-haspopup="true">
          <span class="avatar">${esc(initials(u))}</span>
          <span class="account-name">${esc(u.firstName)}</span>
          <span aria-hidden="true">▾</span>
        </button>
        <div class="dropdown" id="account-dropdown" role="menu">
          <div class="dropdown__head">
            <strong>${esc(name)}</strong>
            <span>${esc(u.email)}</span>
          </div>
          ${u.role === 'admin'
            ? `<a role="menuitem" href="${paths.adminDashboard}">📊 Dashboard</a>
               <a role="menuitem" href="${paths.home}">🏬 View storefront</a>`
            : `<a role="menuitem" href="${paths.orders}">📦 My orders</a>
               <a role="menuitem" href="${paths.account}">⚙️ Account settings</a>`}
          <button type="button" role="menuitem" class="danger" id="logout-btn">↩ Sign out</button>
        </div>
      </div>`;
  }

  function buildHeader(u, activePage) {
    const admin = isAdmin(u);
    const signout = u
      ? `<button type="button" class="btn btn--ghost btn--sm nav-signout" id="header-logout">Sign out</button>`
      : '';
    const link = (page, label, href) =>
      `<a class="nav-link ${activePage === page ? 'is-active' : ''}" href="${href}">${label}</a>`;

    const nav = admin
      ? `
        ${link('admin-dashboard', 'Dashboard', paths.adminDashboard)}
        ${link('admin-books', 'Books', paths.adminBooks)}
        ${link('admin-inventory', 'Inventory', paths.adminInventory)}
        ${link('admin-orders', 'Orders', paths.adminOrders)}
        <a class="nav-link" href="${paths.home}">Storefront ↗</a>
        ${accountMenu(u)}
        ${signout}`
      : `
        ${link('home', 'Home', paths.home)}
        ${link('catalog', 'Books', paths.catalog)}
        ${u ? link('orders', 'My Orders', paths.orders) : ''}
        ${u ? cartBadge(u) : ''}
        ${accountMenu(u)}
        ${signout}`;

    const adminBar = admin
      ? `<div class="admin-bar"><div class="container">🔐 Administrator area — signed in as ${esc(u.email)}</div></div>`
      : '';

    const searchValue = activePage === 'catalog' ? (param('q') || '') : '';

    return `
      ${adminBar}
      <header class="site-header">
        <div class="container header-inner">
          <a class="brand" href="${admin ? paths.adminDashboard : paths.home}">
            <span class="brand__mark" aria-hidden="true">📚</span>
            <span>SA Bookstore<small>Online bookstore</small></span>
          </a>
          <form class="header-search" role="search" id="header-search">
            <label class="hidden" for="header-q">Search books</label>
            <input type="search" id="header-q" name="q" placeholder="Search by title or author…" value="${esc(searchValue)}">
            <button type="submit" aria-label="Search">→</button>
          </form>
          <nav class="header-nav" aria-label="Main navigation">${nav}</nav>
        </div>
      </header>`;
  }

  function wireHeader() {
    const toggle = qs('#account-toggle');
    const dropdown = qs('#account-dropdown');
    if (toggle && dropdown) {
      toggle.addEventListener('click', e => {
        e.stopPropagation();
        const open = dropdown.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', e => {
        if (!dropdown.contains(e.target) && e.target !== toggle) {
          dropdown.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          dropdown.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    const logoutBtn = qs('#logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const headerLogout = qs('#header-logout');
    if (headerLogout) headerLogout.addEventListener('click', logout);

    const search = qs('#header-search');
    if (search) {
      search.addEventListener('submit', e => {
        e.preventDefault();
        const q = search.querySelector('input').value.trim();
        location.href = `${paths.catalog}${q ? `?q=${encodeURIComponent(q)}` : ''}`;
      });
    }
  }

  /* ---------- footer ---------- */
  function buildFooter(u) {
    const admin = isAdmin(u);
    return `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <a class="brand" href="${admin ? paths.adminDashboard : paths.home}">
                <span class="brand__mark" aria-hidden="true">📚</span>
                <span>SA Bookstore<small>Online bookstore</small></span>
              </a>
              <p class="small" style="margin-top:.8rem;max-width:34ch;color:var(--muted)">
                A student project: browse, search and order books online, with a full
                catalogue and order-management area for administrators.
              </p>
            </div>
            <div>
              <h4>Shop</h4>
              <ul>
                <li><a href="${paths.home}">Home</a></li>
                <li><a href="${paths.catalog}">All books</a></li>
                ${u && u.role === 'customer' ? `<li><a href="${paths.cart}">Cart</a></li>
                <li><a href="${paths.orders}">My orders</a></li>` : ''}
              </ul>
            </div>
            <div>
              <h4>Account</h4>
              <ul>
                ${u
                  ? `<li><a href="${u.role === 'admin' ? paths.adminDashboard : paths.account}">${u.role === 'admin' ? 'Admin dashboard' : 'Account settings'}</a></li>
                     <li><button type="button" class="btn btn--ghost btn--sm" id="footer-logout" style="padding:0">Sign out</button></li>`
                  : `<li><a href="${paths.login}">Sign in</a></li>
                     <li><a href="${paths.login}?tab=register">Create an account</a></li>`}
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} SA Online Bookstore · demo project, prices in ${Store.CURRENCY}</span>
            <button type="button" class="btn btn--ghost btn--sm" id="reset-demo">Reset demo data</button>
          </div>
        </div>
      </footer>`;
  }

  function wireFooter() {
    const logoutBtn = qs('#footer-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const reset = qs('#reset-demo');
    if (reset) {
      reset.addEventListener('click', () => {
        if (confirm('Reset all demo data? Accounts, books, carts and orders will return to their starting state.')) {
          Store.resetDemo();
          location.href = paths.login;
        }
      });
    }
  }

  /* ---------- shared markup helpers ---------- */
  function coverHTML(book, extraClass = '') {
    return `
      <div class="cover ${extraClass}" style="--cover:${esc(book.coverColor)}">
        <span class="cover__emoji" aria-hidden="true">${esc(book.coverEmoji)}</span>
        <span class="cover__foot">
          <span class="cover__title">${esc(book.title)}</span>
          <span class="cover__author">${esc(book.author)}</span>
        </span>
      </div>`;
  }

  function stockBadge(book) {
    const status = Store.bookStockStatus(book);
    if (status === 'out') return '<span class="badge badge--danger">Out of stock</span>';
    if (status === 'low') return `<span class="badge badge--warn">Only ${book.stock} left</span>`;
    return '<span class="badge badge--ok">In stock</span>';
  }

  function statusBadge(status) {
    const cls = {
      Pending: 'badge--warn',
      Processing: 'badge--accent',
      Shipped: 'badge--accent',
      Delivered: 'badge--ok',
      Cancelled: 'badge--danger'
    }[status] || 'badge--muted';
    return `<span class="badge ${cls}">${esc(status)}</span>`;
  }

  function bookCardHTML(book) {
    return `
      <article class="book-card">
        <a href="${paths.details}?id=${encodeURIComponent(book.id)}" aria-label="${esc(book.title)}">
          ${coverHTML(book)}
        </a>
        <h3 class="book-card__title">
          <a href="${paths.details}?id=${encodeURIComponent(book.id)}">${esc(book.title)}</a>
        </h3>
        <p class="book-card__author">${esc(book.author)}</p>
        <div class="book-card__foot">
          <span class="price">${money(book.price)}</span>
          ${stockBadge(book)}
        </div>
      </article>`;
  }

  function emptyState({ icon = '📚', title, text = '', action = '' }) {
    return `
      <div class="empty">
        <div class="empty__icon" aria-hidden="true">${icon}</div>
        <h3>${esc(title)}</h3>
        ${text ? `<p>${esc(text)}</p>` : ''}
        ${action ? `<div class="mt-2">${action}</div>` : ''}
      </div>`;
  }

  /* ---------- validation ---------- */
  function fieldError(input, message) {
    if (!input) return;
    const field = input.closest('.field') || input.parentElement;
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    let el = field.querySelector('.field__error');
    if (!el) {
      el = document.createElement('div');
      el.className = 'field__error';
      field.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-visible');
  }

  function clearFieldError(input) {
    if (!input) return;
    const field = input.closest('.field') || input.parentElement;
    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    const el = field.querySelector('.field__error');
    if (el) {
      el.textContent = '';
      el.classList.remove('is-visible');
    }
  }

  function clearErrors(form) {
    qsa('.is-invalid', form).forEach(clearFieldError);
    qsa('.field__error', form).forEach(el => {
      el.textContent = '';
      el.classList.remove('is-visible');
    });
  }

  const validators = {
    required: value => String(value || '').trim().length > 0,
    email: value => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(value || '').trim()),
    phone: value => /^(\+20|0)1[0125][0-9]{8}$/.test(String(value || '').replace(/[\s-]/g, '')),
    postal: value => /^[0-9]{5}$/.test(String(value || '').trim()),
    password: value => String(value || '').length >= 8,
    price: value => Number(value) > 0 && Math.round(Number(value) * 100) === Number(value) * 100,
    stock: value => Number.isInteger(Number(value)) && Number(value) >= 0,
    isbn: value => /^[0-9]{10}([0-9]{3})?$/.test(String(value || '').replace(/[-\s]/g, '')),
    year: value => {
      const y = Number(value);
      return Number.isInteger(y) && y >= 1450 && y <= new Date().getFullYear() + 1;
    }
  };

  /** Checks a list of [selector, rule, message] against a form. Returns true if valid. */
  function validate(form, rules) {
    clearErrors(form);
    let ok = true;
    let firstBad = null;
    rules.forEach(([selector, rule, message]) => {
      const input = qs(selector, form);
      if (!input) return;
      const value = input.type === 'checkbox' ? input.checked : input.value;
      if (!rule(value)) {
        fieldError(input, message);
        ok = false;
        if (!firstBad) firstBad = input;
      }
    });
    if (firstBad) firstBad.focus();
    return ok;
  }

  /* ---------- misc ---------- */
  function debounce(fn, wait = 200) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function formatDate(value, opts = {}) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...opts
    });
  }

  function relativeDate(value) {
    if (!value) return '';
    const diff = Date.now() - new Date(value).getTime();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    return formatDate(value);
  }

  function refreshCart() {
    const u = user();
    qsa('.cart-count').forEach(el => {
      const count = u && u.role === 'customer' ? Store.cartCount(u.id) : 0;
      el.textContent = count;
      el.classList.toggle('is-empty', count === 0);
    });
  }

  function mountModal(id) {
    const modal = qs(`#${id}`);
    if (!modal) return null;
    const close = () => {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    };
    const open = () => {
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };
    qsa('[data-close]', modal).forEach(btn => btn.addEventListener('click', close));
    modal.addEventListener('click', e => {
      if (e.target === modal) close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
    return { open, close, el: modal };
  }

  /* ---------- boot ---------- */
  function init() {
    Store.init();

    const body = document.body;
    const activePage = body.dataset.page || '';
    const guard = body.dataset.guard || '';
    const shell = body.dataset.shell || 'full';

    const u = user();

    // guards
    if (guard === 'customer' && !requireCustomer()) return;
    if (guard === 'admin' && !requireAdmin()) return;
    if (activePage === 'login' && u) {
      location.replace(isAdmin(u) ? paths.adminDashboard : paths.home);
      return;
    }

    // header (customers on the login page have no shell)
    const headerHost = qs('#app-header');
    if (headerHost && shell !== 'none') {
      headerHost.innerHTML = buildHeader(user(), activePage);
      wireHeader();
    }

    const footerHost = qs('#app-footer');
    if (footerHost && shell !== 'none') {
      footerHost.innerHTML = buildFooter(user());
      wireFooter();
    }

    const f = takeFlash();
    if (f && f.message) toast(f.message, f.type || 'info');

    refreshCart();
  }

  return {
    init,
    paths,
    qs,
    qsa,
    esc,
    param,
    money,
    toast,
    flash,
    user,
    isAdmin,
    requireAdmin,
    requireCustomer,
    logout,
    initials,
    coverHTML,
    stockBadge,
    statusBadge,
    bookCardHTML,
    emptyState,
    fieldError,
    clearFieldError,
    clearErrors,
    validators,
    validate,
    debounce,
    formatDate,
    relativeDate,
    refreshCart,
    mountModal
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
