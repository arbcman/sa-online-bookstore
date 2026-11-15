# SA Online Bookstore — Handoff / Progress Summary

Use this file to continue the project with any other AI assistant. It states exactly what is
finished, what is left, the conventions to follow, and a ready-to-paste prompt at the end.

Project root: `/home/arbcman/SA-1 Online bookstore`
Last updated: **project complete** — R1–R20 implemented and browser-tested.

## CURRENT STATUS — read this first

✅ **All 20 requirements are implemented.** Every page and page script exists; there are no
placeholders left in the code. The end-to-end acceptance test in section 8 (plus a broader
52-check headless-Chrome pass covering login, guards, search/filter, cart, checkout validation,
admin dashboard, book CRUD, orders and inventory) passes.

Remaining optional work is content only: replace the placeholder genre list and book
descriptions with the real ones, then click **Reset demo data** in the footer. See section 10.

**Bug fixed during final testing:** `App.init` was referenced at the bottom of `app.js` but was
not exported, so headers, guards, footers and flash messages never ran. `init` is now in the
public API — keep it there.

---

## 1. What the project is

A static bookstore web app: **HTML + CSS + vanilla JS**, data in `localStorage`, no server and no
build step. Requirements are in `docs/REQUIREMENTS.md` (R1–R20). Design is in `docs/DESIGN.md`,
UML in `docs/UML.md`.

**Run it:** open `Customer's/Login.html` directly, or serve the folder:

```bash
cd "/home/arbcman/SA-1 Online bookstore"
python3 -m http.server 8000
# then visit http://localhost:8000/Customer's/Login.html
```

Demo accounts (seeded automatically):

| Role | Email | Password |
|---|---|---|
| Customer | `cust@gmail.com` | `customer123` |
| Administrator | `admin@gmail.com` | `admin123` |

---

## 2. File status

Legend: ✅ done · 🟡 partial · ⬜ empty / not started

```
SA-1 Online bookstore/
├── docs/
│   ├── REQUIREMENTS.md        ✅ R1–R20, edited by the user
│   ├── DESIGN.md              ✅ architecture, data model, style notes
│   ├── UML.md                 ✅ Mermaid class diagram
│   └── HANDOFF.md             ✅ this file
├── assets/
│   ├── css/style.css          ✅ complete component library + ANCIENT ARABIAN THEME
│   └── js/
│       ├── store.js           ✅ full data layer + seed data (placeholder genres/descriptions)
│       ├── app.js             ✅ session, role guards, header/footer, money, toasts, validation
│       └── pages/
│           ├── login.js       ✅
│           ├── home.js        ✅
│           ├── catalog.js     ✅
│           ├── details.js     ✅
│           ├── cart.js        ✅
│           ├── checkout.js    ✅
│           ├── orders.js      ✅
│           ├── account.js     ✅
│           ├── admin-dashboard.js  ✅
│           ├── admin-books.js      ✅
│           ├── admin-book-form.js  ✅
│           ├── admin-orders.js     ✅
│           └── admin-inventory.js  ✅
├── Customer's/
│   ├── Login.html             ✅ login + register + demo autofill
│   ├── Index.html             ✅ hero, popular books, genres, feature cards
│   ├── Book_Catalog.html      ✅ search + genre filter + results + empty state
│   ├── Book_details.html      ✅ details, reviews-free, related books, add to cart
│   ├── Cart.html              ✅
│   ├── Checkout.html          ✅
│   ├── My_Orders.html         ✅
│   └── Account.html           ✅
└── Admin's/
    ├── Dashboard.html         ✅
    ├── Book_Catalog.html      ✅
    ├── Book_details.html      ✅ (admin add/edit form)
    ├── Orders.html            ✅ status chips, search, table, order modal
    └── Inventory.html         ✅ stats, low/out filters, restock modal
```

The admin files were originally empty placeholders created by the user — the names were kept.
All page scripts are now written.

---

## 3. How the code is organised (follow this)

### Page skeleton

Every normal page looks like this (paths work because every page sits exactly one folder deep):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page name · SA Online Bookstore</title>
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body data-page="cart" data-guard="customer">   <!-- data-page drives active nav -->
  <a class="skip-link" href="#main">Skip to content</a>
  <div id="app-header"></div>                    <!-- app.js renders header here -->
  <main id="main" class="page">
    <div class="container"> … </div>
  </main>
  <div id="app-footer"></div>
  <div class="toast-wrap" id="toast-wrap"></div>

  <script src="../assets/js/store.js"></script>
  <script src="../assets/js/app.js"></script>
  <script src="../assets/js/pages/cart.js"></script>
</body>
</html>
```

Body attributes:

| Attribute | Values | Meaning |
|---|---|---|
| `data-page` | `home`, `catalog`, `details`, `cart`, `checkout`, `orders`, `account`, `login`, `admin-dashboard`, `admin-books`, `admin-book-form`, `admin-orders`, `admin-inventory` | sets the active nav link and the header search value |
| `data-guard` | `customer`, `admin`, omitted | `customer` redirects guests to login and admins to the dashboard; `admin` redirects non-admins |
| `data-shell` | omitted = full header/footer, `none` | `none` for the login page only |

Scripts must load in this order: `store.js` → `app.js` → page script. Page scripts run on
`DOMContentLoaded`; `App.init` is registered first, so the header/footer exist by then.

### JavaScript modules

**`Store`** (in `store.js`) — the only code that touches `localStorage`.

```
Store.init()  Store.resetDemo()
Store.money(n)  Store.round(n)  Store.totals(subtotal)
Store.currentUser()  Store.login(id)  Store.logout()  Store.authenticate(email, pw)
Store.register(data)  Store.updateProfile(id, patch)  Store.changePassword(id, old, new)
Store.users()  Store.userById(id)
Store.books()  Store.bookById(id)  Store.genres()  Store.bookStockStatus(book)
Store.createBook(data)  Store.updateBook(id, data)  Store.deleteBook(id)  Store.restockBook(id, qty)
Store.cartLines(uid)  Store.cartDetailed(uid)  Store.addToCart(uid, bookId, qty)
Store.setCartQty(uid, bookId, qty)  Store.removeFromCart(uid, bookId)  Store.clearCart(uid)
Store.cartCount(uid)  Store.placeOrder(uid, { paymentMethod, deliveryAddress })
Store.ordersForUser(uid)  Store.allOrders()  Store.orderById(id)
Store.advanceOrder(id)  Store.cancelOrder(id)  Store.stats()
```

Every mutation returns `{ ok: true, … }` or `{ ok: false, error }`. Always check `ok` and show
`App.toast(result.error, 'error')` when it fails — never fail silently (N3).

**`App`** (in `app.js`) — shell and helpers.

```
App.paths.*                     e.g. App.paths.cart, App.paths.adminBooks
App.qs(sel)  App.qsa(sel)  App.esc(text)  App.param(name)
App.money(n)                    → "L.E 1,234.50"
App.toast(msg, 'ok'|'warn'|'error'|'info')
App.flash(msg, type)            message that survives one redirect
App.user()  App.isAdmin()  App.requireAdmin()  App.requireCustomer()
App.coverHTML(book)  App.stockBadge(book)  App.statusBadge(status)
App.bookCardHTML(book)  App.emptyState({icon,title,text,action})
App.validate(form, [[selector, rule, message], …])
App.validators.{required,email,phone,postal,password,price,stock,isbn,year}
App.fieldError(input, msg)  App.clearFieldError(input)  App.clearErrors(form)
App.formatDate(v)  App.relativeDate(v)  App.debounce(fn, ms)
App.mountModal('id')  → { open(), close() }
App.refreshCart()               updates the header cart badge
```

### Storage keys

`sab.users`, `sab.books`, `sab.carts` (`{ userId: [{bookId, qty}] }`), `sab.orders`,
`sab.session` (`{ userId, loggedInAt }`), `sab.version`.

Money rules: VAT 14%, delivery **L.E 50** flat, free over **L.E 750**. Orders start at `ORD-1001`.
Order statuses: `Pending → Processing → Shipped → Delivered`, plus `Cancelled` (restores stock).
Passwords are hashed with a small demo hash — documented as not production security.

---

## 4. Page specifications (all implemented — kept as reference)

### 4.1 `assets/js/pages/details.js` — ✅ DONE (kept as a reference pattern)

Already implemented and tested; kept as the reference pattern for every page.
`Book_details.html` contains `#detail-root`, `#related-section`, `#related-grid`.

- If `App.param('id')` is missing or `Store.bookById(id)` is null → `App.emptyState` with a link
  back to the catalogue.
- Breadcrumb: Home / Catalogue / title.
- Left column `.detail__cover` → `App.coverHTML(book)`.
- Right column: `h1`, author (`<a href="Book_Catalog.html?q=AUTHOR">`), genre badge linking to
  `Book_Catalog.html?genre=GENRE`, publisher + year badges, description in `.prose`,
  `.buybox` with `.price--lg`, `App.stockBadge(book)`, a `.qty` stepper
  (`#qty-minus`, `#qty-input`, `#qty-plus`; max = stock), and an **Add to cart** button
  (`#add-to-cart`) disabled when stock is 0.
- `.meta-list` with ISBN, Publisher, Year, Genre, Availability ("14 in stock").
- Add-to-cart behaviour:
  - guest → `App.flash('Sign in to add books to your cart.', 'info')` and send to
    `App.paths.login + '?next=' + encodeURIComponent('Book_details.html?id=' + book.id)`;
  - admin → `App.toast('Administrators cannot shop.', 'error')`;
  - customer → `Store.addToCart(...)`, then `App.refreshCart()` and a success toast.
- Related books: same genre, exclude current, max 4, into `#related-grid`, unhide the section
  only when there are results.

### 4.2 `Customer's/Cart.html` + `assets/js/pages/cart.js` (R9, R10, R11)

`body data-page="cart" data-guard="customer"`.

- `.cart-layout`: left `.cart-list` of `.cart-line` rows, right `.summary` sticky.
- Each row: small cover, title link, author, unit price, `.qty` stepper, remove button (`✕`).
- Recompute totals with `Store.totals(subtotal)` and show subtotal, delivery, VAT 14%, total.
- If any line has `overStock` (from `Store.cartDetailed`) show a `.notice--warn` telling the user
  to reduce the quantity; disable checkout until fixed.
- Empty cart → `App.emptyState` with a "Browse books" button.
- Buttons: "Continue shopping" → catalogue, "Checkout" → `App.paths.checkout`.
- Use `Store.setCartQty` / `Store.removeFromCart`, then re-render + `App.refreshCart()`.

### 4.3 `Customer's/Checkout.html` + `assets/js/pages/checkout.js` (R12, R13)

- Redirect to the cart with a toast if the cart is empty.
- Two columns: form (`.form-card`) + `.summary` order recap.
- Fields: first/last name (read-only or editable), email, phone, street, city, governorate,
  postal code, delivery notes (optional), payment method radio cards (`.pay-option`:
  Card, Bank transfer, Cash on delivery). Prefill from `App.user().address`.
- Validate with `App.validate` (required + `validators.phone` + `validators.postal` +
  `validators.email`), show field-level errors.
- On submit: `Store.placeOrder(user.id, { paymentMethod, deliveryAddress })`.
  On success, replace the page content with a confirmation card: order number, total, delivery
  address, and links to My Orders and the catalogue.
  On failure, show the returned error (stock changed).
- Price snapshot and stock deduction are already handled by `Store.placeOrder`.

### 4.4 `Customer's/My_Orders.html` + `assets/js/pages/orders.js` (R14, R15)

- `Store.ordersForUser(user.id)`.
- Each order → `.card.order-card` with header: order id, date (`App.relativeDate`), item count,
  `App.statusBadge(order.status)`, total, and a toggle button.
- Expanding shows: item table (title, qty, unit price, line total), delivery address, payment
  method, totals, and a `.timeline` built from `Store.STATUS_FLOW` — steps up to the current
  status get `.is-done`; if cancelled show one `.is-cancelled` step.
- Empty state when there are no orders.

### 4.5 `Customer's/Account.html` + `assets/js/pages/account.js` (R16)

- Two `.form-card`s: **Profile** (name, email, phone, address) and **Password**
  (current, new, confirm).
- Save profile with `Store.updateProfile`; change password with `Store.changePassword`
  (validate new ≥ 8 chars and confirmation match).
- Show the account email and a "member since" line.

### 4.6 Admin pages (all `data-guard="admin"`)

**`Admin's/Dashboard.html` — admin-dashboard.js (R17)**
- Four `.stat` cards from `Store.stats()`: revenue (exclude cancelled), order count, books in
  catalogue, low-stock count.
- Tables/lists: 5 most recent orders (link to Orders), low-stock books (link to Inventory),
  top 5 by `sold`, revenue by genre as `.bar-list` bars.
- Quick action buttons: Add book, Manage inventory, View orders.

**`Admin's/Book_Catalog.html` — admin-books.js (R18)**
- `.page-head` + "Add book" button (`Book_details.html`).
- Search input filtering title/author, count line.
- `.table-wrap` table: cover thumb (small `.cover`), title/author, genre, price, stock badge,
  actions Edit / Delete. Remember `data-label` attributes on `<td>` for the stacked mobile table.
- Delete → confirmation via `App.mountModal` or `confirm()`, then `Store.deleteBook(id)`.
- Empty state when no books match.

**`Admin's/Book_details.html` — admin-book-form.js (R18)**
- One form used for add and edit: if `?id=` present, prefill via `Store.bookById`.
- Fields: title, author, ISBN, genre select (`Store.genres()`), publisher, year, price, stock,
  description, cover emoji, cover colour (`<input type="color">`).
- Live cover preview using `App.coverHTML` on input.
- Validate: title/author required, ISBN (10/13), price > 0, stock integer ≥ 0, year sensible
  (`App.validators` already has these).
- Save → `Store.createBook` / `Store.updateBook`, toast, redirect to `App.paths.adminBooks`.

**`Admin's/Inventory.html` — admin-inventory.js (R19)** ✅ implemented
- Table of all books: title, genre, price, current stock, status badge, restock controls.
- Restock via a modal with an amount field, or quick +10 / +25 buttons → `Store.restockBook`.
- Filter toggle "Low stock only" (`stock < 5`) and "Out of stock".
- Highlight rows with `.notice--warn` styling or badges.

**`Admin's/Orders.html` — admin-orders.js (R20)** ✅ implemented
- Status filter tabs/chips (All, Pending, Processing, Shipped, Delivered, Cancelled) and a search
  box matching order id or customer name/email.
- Table: order id, customer, date, items count, total, status, actions.
- "View" opens a modal (`App.mountModal`) with the full order: item lines, delivery address,
  payment, totals, and buttons **Advance status** (`Store.advanceOrder`) and **Cancel**
  (`Store.cancelOrder`). Re-render after each action.
- Cancelling must explain that stock is restored.

---

## 5. Requirement coverage right now

| Req | Status | Where / what remains |
|---|---|---|
| R1 register | ✅ | `Login.html` + `login.js` |
| R2 login/logout | ✅ | `Login.html`, header/footer |
| R3 role access | ✅ | `app.js` guards on every protected page |
| R4 browse catalogue | ✅ | `Book_Catalog.html` |
| R5 search title/author | ✅ | `catalog.js` (label says "Search…") |
| R6 home page + search + featured + genres | ✅ | `Index.html` + `home.js` |
| R7 details page | ✅ | `Book_details.html` + `details.js` |
| R8 add to cart | ✅ | details page (merges quantities, caps at stock) |
| R9 update/remove cart | ✅ | `Cart.html` + `cart.js` |
| R10 stock validation | ✅ | enforced in `Store` + cart/checkout warnings |
| R11 cart persists | ✅ | `sab.carts` keyed by user |
| R12 checkout form + validation | ✅ | `Checkout.html` + `checkout.js` |
| R13 place order | ✅ | checkout confirmation screen, `ORD-1001+` |
| R14 status lifecycle | ✅ | customer timeline + admin actions |
| R15 my orders | ✅ | `My_Orders.html` + `orders.js` |
| R16 account page | ✅ | `Account.html` + `account.js` |
| R17 admin dashboard | ✅ | `Admin's/Dashboard.html` |
| R18 book CRUD | ✅ | `Admin's/Book_Catalog.html`, `Book_details.html` |
| R19 inventory | ✅ | `Admin's/Inventory.html` + `admin-inventory.js` (restock, low/out filters) |
| R20 admin orders | ✅ | `Admin's/Orders.html` + `admin-orders.js` (filter, search, advance/cancel) |

---

## 6. Theme and styling conventions

The visual theme is **ancient Arabian / Egyptian**: papyrus background with a faint geometric
lattice, ink-brown text, antique gold accents, emerald for customer UI, lapis-lazuli for the admin
area, and book covers styled like tooled leather with a thin gold frame.

Palette tokens (top of `style.css`):

```
--paper #f3e9d6   --card #fcf6e8   --ink #2a1c10   --muted #7d6a55
--accent #96601f  --accent-2 #744714  --gold #c39b3c  --sage #2f6b5c
--ok #2f6b46      --warn #a87313   --danger #a3261c
body.admin: --accent #1f4e79 (lapis), --accent-2 #163a5c
```

Reusable classes: `.container`, `.page`, `.page-head`, `.card`, `.card__body`, `.card__head`,
`.btn` (+ `--primary --ghost --danger --dark --sm --lg --block`), `.icon-btn`, `.badge`
(+ `--ok --warn --danger --accent --muted`), `.chip`, `.field`, `.field-row`, `.field__error`,
`.form-card`, `.table-wrap`, `.stat-grid`, `.stat`, `.book-grid`, `.book-card`, `.cover`,
`.cart-layout`, `.cart-line`, `.summary`, `.checkout-layout`, `.mini-lines`, `.order-card`,
`.timeline`, `.empty`, `.notice`, `.modal`, `.toast`, `.tabs`, `.qty`, `.buybox`, `.meta-list`,
`.prose`, `.bar-list`.

**Do not** use external images or web fonts: covers are generated from `coverColor` + `coverEmoji`
(works offline). Keep using `App.money()` for all prices (`L.E`).

---

## 7. Gotchas

- Folders contain apostrophes (`Customer's`, `Admin's`). Always quote paths in shell commands.
  Links are written as `../Customer's/...` and work in browsers.
- `localStorage` on `file://` works in Chrome/Firefox, but running `python3 -m http.server` is safer.
- Seed books use **placeholder descriptions** and a placeholder `GENRES` list at the top of
  `store.js`. The user will replace them. After editing seeds, click "Reset demo data" in the
  footer (or run `Store.resetDemo()` in the console) because the version marker prevents reseeding.
- Seeded orders do not deduct stock from seeded books; that is deliberate so the catalogue stays
  fully populated for the demo.
- `App.fix` — none. If you add a page, add its script tag after `app.js`, never before.
- Check every mutation's `{ ok }` result; `Store.placeOrder` can still fail if stock changed.

---

## 8. Acceptance test (run before submitting)

1. Open `Customer's/Login.html`, click **Fill** under the customer demo, sign in.
2. Home shows 18 books, 8 genres, 8 popular books.
3. Search "mahfouz" → only Mahfouz titles; genre filter works; empty search shows an empty state.
4. Open a book → change quantity → Add to cart → cart badge increases.
5. Cart → quantity +, −, remove; totals include 14% VAT and L.E 50 delivery (free over 750).
6. Checkout → invalid phone/postal shows field errors; valid submit creates `ORD-1004`, clears cart,
   reduces stock, shows confirmation.
7. My Orders → expand order → timeline + items correct.
8. Sign out → sign in as admin → dashboard KPIs match; add/edit/delete a book; restock a book;
   advance and cancel an order (cancelled order returns stock).
9. Sign out → sign in as customer → the cancelled order shows **Cancelled**.
10. Resize to 400 px: header wraps, book grid is 2 columns, admin tables become stacked cards.

---

## 9. Ready-to-paste prompt for another AI

> You are working on a **complete** static online bookstore app in
> `/home/arbcman/SA-1 Online bookstore`. Read `docs/HANDOFF.md`, `docs/REQUIREMENTS.md` and
> `docs/DESIGN.md` first, then read `assets/js/store.js` and `assets/js/app.js` to learn the data
> layer and shared helpers.
>
> The project is HTML + CSS + vanilla JS with `localStorage`, no build step. All of R1–R20 are
> implemented and browser-tested. Run it with
> `python3 -m http.server 8000` and open `Customer's/Login.html`.
>
> Your job now is maintenance or the optional content pass, not rebuilding pages:
> replace the placeholder `GENRES` list and book `description` values in `assets/js/store.js`
> with the real content the user supplies, then use the footer **Reset demo data** button.
>
> Follow the existing page skeleton, `data-page` / `data-guard` / `data-shell` attributes,
> `Store.*` / `App.*` APIs and CSS class names exactly — do not invent a new architecture, add
> frameworks, external images or web fonts. The visual theme is ancient Arabian/Egyptian
> (papyrus, ink brown, antique gold, emerald; lapis for admin) and must stay consistent.
> After any change, re-test every page in a browser and re-verify R1–R20 in
> `docs/REQUIREMENTS.md`.

---

## 10. Optional content pass (the only work left)

The app is functionally complete. The only placeholders are content in `assets/js/store.js`:

1. `GENRES` near the top of the file — replace with the real genre list. Genre names are used as
   filter values, so keep them short and consistent.
2. Each seed book's `description` — replace the lorem-style text with a real synopsis.
3. Optionally tweak titles/authors/prices in the seed array.

After editing, either press **Reset demo data** in the footer or run `Store.resetDemo()` in the
browser console. Seeding only happens when `sab.version` changes, so an un-reset browser keeps
the old data.

If real book cover images are ever wanted, extend `App.coverHTML` and the book model; do not add
external image URLs to the seed data (the current app has no network dependencies).
