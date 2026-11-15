# SA Online Bookstore — Design Document

Companion to `REQUIREMENTS.md` (R1–R20). This covers architecture, data model, page map and UI
rules for the simplified scope.

---

## 1. Architecture

A **static, client-side application**. There is no server; `localStorage` acts as the database and
all logic runs in the browser, so the project runs by double-clicking `Customer's/Index.html`.

```
Pages (HTML)  →  page scripts (assets/js/pages/*.js)  →  store.js  →  localStorage
                                ↓
                         app.js (layout, auth guard, helpers, toasts)
```

Layering rules:
- HTML contains structure only — no inline business logic.
- `store.js` is the only module that reads/writes `localStorage` (N1).
- `app.js` owns: session/user, route guards, shared header, formatting (`L.E 249.00`), toast
  notifications, star-free simple components, and HTML escaping for user text.
- Page scripts call `Store.*` and render into the existing DOM.

---

## 2. File Structure

```
SA-1 Online bookstore/
├── Project Description.png
├── docs/
│   ├── REQUIREMENTS.md
│   ├── DESIGN.md
│   └── UML.md                 # class diagram (Mermaid)
├── assets/
│   ├── css/style.css          # one stylesheet: tokens, layout, components, responsive
│   └── js/
│       ├── store.js           # seed data + data access API
│       ├── app.js             # session, guards, shared UI, helpers
│       └── pages/
│           ├── home.js  catalog.js  details.js  cart.js
│           ├── checkout.js  orders.js  login.js  account.js
│           └── admin-dashboard.js  admin-books.js  admin-book-form.js
│               admin-orders.js  admin-inventory.js
├── Customer's/
│   ├── Index.html             # home + search + featured (R6)
│   ├── Book_Catalog.html      # browse + search (R4, R5)
│   ├── Book_details.html      # details + add to cart (R7, R8)
│   ├── Cart.html              # cart (R9–R11)
│   ├── Checkout.html          # checkout + place order (R12, R13)
│   ├── My_Orders.html         # order history (R14, R15)
│   ├── Login.html             # login + register (R1–R3)
│   └── Account.html           # profile settings (R16)
└── Admin's/
    ├── Dashboard.html         # KPIs (R17)
    ├── Book_Catalog.html      # book management table (R18)
    ├── Book_details.html      # add / edit book form (R18)
    ├── Orders.html            # order management (R20)
    └── Inventory.html         # stock levels + restock (R19)
```

Your existing files keep their names and are filled in; the missing pages (`Login`, `Account`,
`My_Orders`, `Orders`, `Inventory`) are added.

---

## 3. Data Model

All `localStorage` keys are namespaced with `sab.`.

### 3.1 User (`sab.users`)
```js
{
  id: "u_1", role: "customer" | "admin",
  firstName, lastName, email, passwordHash, phone,
  address: { street, city, governorate, postalCode },
  createdAt: "2026-02-01T09:00:00Z"
}
```
Session: `sab.session = { userId, loggedInAt }`.

### 3.2 Book (`sab.books`)
```js
{
  id: "b_1", title, author, isbn, genre, publisher, year,
  price: 249.00,            // Egyptian Pound
  stock: 12, lowStockAt: 5,
  description, coverColor, coverEmoji,
  sold: 34,
  createdAt, updatedAt
}
```
Genres kept small for a clean catalog: Fiction, Non-fiction, Academic, Children, Business,
Biography, History, Self-help.

### 3.3 Cart (`sab.carts`)
```js
{ "u_2": [ { bookId: "b_1", qty: 2 } ] }
```

### 3.4 Order (`sab.orders`) — OrderItems stored inline
```js
{
  id: "ORD-1001", userId: "u_2", customerName, email,
  items: [ { bookId, title, author, unitPrice, qty, lineTotal } ],  // price snapshot
  subtotal, delivery, vat, total,
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled",
  paymentMethod: "Card" | "Bank transfer" | "Cash on delivery",
  delivery: { street, city, governorate, postalCode, phone, notes },
  createdAt
}
```
Order numbers continue from the highest existing number, starting at `ORD-1001`.

### 3.5 Money rules
- Delivery: **L.E 50** flat, **free** when subtotal ≥ **L.E 750**.
- VAT: **14%**, itemised on the cart and checkout totals.
- Round to 2 decimals at every step; format as `L.E 1,234.50`.

---

## 4. Page Map & Navigation

```
Login ──(customer)──► Home ──► Catalog ──► Details ──► Cart ──► Checkout ──► My Orders
  │                     │                     ▲           │
  └──(admin)──► Dashboard ──► Manage Books ──► Book Form │
                     │                                   │
                     ├──► Orders                        │
                     └──► Inventory                     │
Account is reachable from the header account menu.        ┘
```

- Shared header: logo, search, nav links, cart count badge, account/logout.
- Every admin page gets a dark "Admin" accent bar so the role is obvious.
- Login and order-confirmation screens use a centred card layout with no header.

---

## 5. UI Design Rules

- **Theme:** ancient Arabian / Egyptian. Papyrus background with a faint geometric lattice,
  ink-brown text, antique gold accents and tooled-leather book covers. Tokens: paper `#f3e9d6`,
  card `#fcf6e8`, ink `#2a1c10`, accent bronze `#96601f`, gold `#c39b3c`, emerald `#2f6b5c`.
  Admin pages switch the accent to lapis lazuli `#1f4e79`.
- **Type:** system serif for headings, system sans for body; no web-font network calls.
- **Components:** `.btn` (primary/ghost/danger), `.card`, `.badge` (in stock / low / out),
  responsive `.table` (stacked cards under 720 px), `.field` with inline error text, `.toast`,
  `.modal`, `.empty-state`, `.stat`.
- **Book covers:** generated CSS covers (colour + emoji + title) so the project works offline
  with no external image dependency.
- **Empty states:** every list has one ("No books match your search"); forms show field-level
  errors, never a blanket `alert()`.

---

## 6. Validation Rules

| Field | Rule |
|-------|------|
| Email | `^[^\s@]+@[^\s@]+\.[a-z]{2,}$`, unique across users |
| Password | min 8 chars; register form requires confirmation match |
| Phone | Egyptian mobile: `^(\+20|0)1[0125][0-9]{8}$` after stripping spaces |
| Postal code | 5 digits |
| Price | number > 0, max 2 decimals |
| Stock | integer ≥ 0 |
| ISBN | 10 or 13 digits (hyphens stripped) |
| Cart/order qty | integer ≥ 1 **and** ≤ available stock, re-checked at checkout |
| Checkout | All delivery fields required; payment method required |

---

## 7. Seed Data

- **18 books** mixing Egyptian/Arabic literature and international titles, e.g. *Palace Walk*
  (Naguib Mahfouz, AUC Press), *The Yacoubian Building* (Alaa Al Aswany, Dar El Shorouk),
  *Utopia* (Ahmed Khaled Tawfik), plus a few academic, children's and business titles.
- Prices between **L.E 85 and L.E 650**, varied stock including one out-of-stock and two
  low-stock books so the inventory alerts are visible in the demo.
- Three sample orders in different statuses so the dashboard and order management are not empty.

---

## 8. Build Order

1. `style.css` + `store.js` (seed data, API) + `app.js` (session, guards, header, toasts).
2. Login/Register + home page.
3. Catalog + book details.
4. Cart + checkout + order creation.
5. My Orders.
6. Admin dashboard, book CRUD, inventory, order management.
7. Account page.
8. End-to-end pass: run the brief's example scenario, fix gaps, verify all R1–R20.

---

## 9. Assumptions

- One browser profile = one user at a time (no cross-device sync).
- Demo only: no real payments, no server, hashed-but-not-secure passwords.
- Required later? `store.js` is the single seam to swap for a real API/database.
