# SA Online Bookstore — Requirements Specification

**Project:** Online Bookstore System
**Stack:** HTML, CSS, JavaScript, browser `localStorage` as the data store
**Actors:** Customer, Administrator
**Currency:** Egyptian Pound (`L.E`)

The six features in the brief are treated as the baseline. Requirements marked **[R6]–[R20]** are the
additional requirements added to reach the project minimum of 16.

Priority: **M** = Must have, **S** = Should have, **C** = Could have (only if time allows).

---

## 1. Requirement Table

| ID | Requirement | Actor | Priority | Implemented in |
|----|-------------|-------|----------|----------------|
| R1 | Register a new customer account (name, email, phone, address, password) with unique-email validation. | Customer | M | `Customer's/Login.html` (Register tab) |
| R2 | Log in / log out; session persists after page reload. | Both | M | `Customer's/Login.html`, header in every page |
| R3 | Role-based access control — customers are blocked from admin pages and admins from the customer cart/checkout. | Both | M | Route guard in `assets/js/app.js` |
| R4 | Browse the book catalog in a responsive grid with cover, title, author, price, and stock badge. | Customer | M | `Customer's/Book_Catalog.html` |
| R5 | Search books by title **or** author (live, case-insensitive). | Customer | M | `Customer's/Book_Catalog.html`, home search |
| R6 | **[extra]** Home page with live search, featured books, and genre shortcuts. | Customer | M | `Customer's/Index.html` |
| R7 | **[extra]** Book details page: full description, ISBN, publisher, year, genre, rating, price, stock availability. | Customer | M | `Customer's/Book_details.html` |
| R8 | Add a book to the cart with a chosen quantity; adding the same book again increases quantity instead of duplicating the line. | Customer | M | `Customer's/Book_details.html`, catalog 
| R9 | Update quantity or remove a line in the cart; totals recalculate immediately. | Customer | M | `Customer's/Cart.html` |
| R10 | **[extra]** Stock validation — cannot add or order more than available stock; cart warns when requested quantity exceeds stock. | Customer | M | Cart + checkout logic |
| R11 | Cart persists across pages and browser restarts (per logged-in customer). | Customer | M | `assets/js/store.js` (`sab.carts`) |
| R12 | Checkout form with delivery details and payment method, with field validation (required fields, phone, postal code, email). | Customer | M | `Customer's/Checkout.html` |
| R13 | Place an order: generate an order number, snapshot item prices, deduct stock, clear the cart, show a confirmation screen. | Customer | M | `Customer's/Checkout.html` 
| R14 | Order status lifecycle: `Pending → Processing → Shipped → Delivered`. | Both | M | Order model + admin orders |
| R15 | "My Orders" page listing order history with expandable order details. | Customer | M | `Customer's/My_Orders.html` 
| R16 | **[extra]** Customer account page: view/edit profile and delivery address, change password. | Customer | S | `Customer's/Account.html` |
| R17 | Admin dashboard with KPIs: total revenue, order count, books in catalog, low-stock count. | Admin | M | `Admin's/Dashboard.html` |
| R18 | Admin book management — create, read, update, and delete books (full CRUD) with form validation. | Admin | M | `Admin's/Book_Catalog.html`, `Admin's/Book_details.html` |
| R19 | **[extra]** Inventory management — restock a book, edit stock directly, low-stock (< 5) and out-of-stock alerts. | Admin | M | `Admin's/Inventory.html` |
| R20 | **[extra]** Admin order management — view all orders, search by order no./customer, filter by status, advance or cancel status. | Admin | M | `Admin's/Orders.html` |

---
## 2. Functional Flows

### 2.1 Customer — search → cart → order (the brief's example scenario)
1. Customer opens `Customer's/Index.html`, types "coetzee" into the search box.
2. Results open in the catalog filtered by that query.
3. Customer opens a book, sets quantity 2, clicks **Add to cart**.
4. Cart shows 2 × L.E…, delivery and 14% VAT, and a grand total.
5. Customer logs in (or is prompted to), reviews delivery details, confirms payment method.
6. **Place order** → stock is checked a final time. If enough stock: order `ORD-1001` is created,
   stock decremented, cart emptied, confirmation shown.
7. `My Orders` shows `Pending`; the admin later moves it to `Processing → Shipped → Delivered`,
   and the customer sees the updated timeline.

### 2.2 Administrator — catalogue & orders
1. Admin logs in → redirected to `Admin's/Dashboard.html` (customers cannot reach it).
2. Dashboard shows revenue, order count, low stock, recent orders.
3. **Manage Books** → table with search; *Add book* / *Edit* open `Book_details.html` as a form.
4. **Inventory** → restock a title; low-stock rows highlighted.
5. **Orders** → filter by status, open an order, move status forward; stock is restored automatically
   on cancellation.

---

## 3. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| N1 | All data access goes through one data-access module (`store.js`); pages never touch `localStorage` keys directly. |
| N2 | Unknown/expired session or direct URL access to a protected page redirects to Login. |
| N3 | Every action gives feedback (toast: success / warning / error); no silent failures. |
| N4 | Layout works from 360 px mobile up to 1440 px desktop; no horizontal scrolling. |
| N5 | Demo seed data loads automatically on first run so the app is never empty. |
| N6 | Passwords are stored hashed (not plain text). Note: client-only demo — this is not production-grade security. |

---

## 4. Demo Accounts (seeded)

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@gmail.com` | `admin123` |
| Customer | `cust@gmail.com` | `customer123` |
