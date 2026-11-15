/* ==========================================================================
   SA Online Bookstore — data layer
   The ONLY module that talks to localStorage. Pages call Store.*, never raw keys.

   >>> PLACEHOLDER CONTENT <<<
   `GENRES` and every `description` in `SEED_BOOKS` are placeholders.
   Replace them with your real genres and book descriptions.
   After editing, run Store.resetDemo() in the browser console (or use
   "Reset demo data" in the site footer) so the seed data reloads.
   ========================================================================== */

const Store = (() => {
  /* ---------- constants ---------- */
  const DB_VERSION = 1;

  const VAT_RATE = 0.14;          // Egypt VAT
  const DELIVERY_FEE = 50;        // L.E
  const FREE_DELIVERY_FROM = 750; // L.E
  const LOW_STOCK_AT = 5;
  const CURRENCY = 'L.E';

  const STATUS_FLOW = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  const ALL_STATUSES = [...STATUS_FLOW, 'Cancelled'];

  const KEY = {
    users: 'sab.users',
    books: 'sab.books',
    carts: 'sab.carts',
    orders: 'sab.orders',
    session: 'sab.session',
    version: 'sab.version'
  };

  /* ==========================================================
     PLACEHOLDER CONTENT — edit these two blocks
     ========================================================== */

  // TODO: replace with your own genres. The catalog chips are built from this.
  const GENRES = [
    'Fiction',
    'Non-fiction',
    'Academic',
    'Children',
    'Business',
    'Biography',
    'History',
    'Self-help'
  ];

  // TODO: replace descriptions (and add/remove books) with your real catalogue.
  const SEED_BOOKS = [
    {
      title: 'Palace Walk', author: 'Naguib Mahfouz', genre: 'Fiction',
      publisher: 'AUC Press', year: 1956, price: 285, stock: 14,
      isbn: '9789774241985', coverColor: '#6b4f3a', coverEmoji: '🏛️',
      description: 'Placeholder description — replace with the real synopsis for Palace Walk.'
    },
    {
      title: 'The Yacoubian Building', author: 'Alaa Al Aswany', genre: 'Fiction',
      publisher: 'Dar El Shorouk', year: 2002, price: 320, stock: 9,
      isbn: '9789770931699', coverColor: '#2f4f68', coverEmoji: '🏢',
      description: 'Placeholder description — replace with the real synopsis for The Yacoubian Building.'
    },
    {
      title: 'Utopia', author: 'Ahmed Khaled Tawfik', genre: 'Fiction',
      publisher: 'Dar El Shorouk', year: 2008, price: 240, stock: 3,
      isbn: '9789770934003', coverColor: '#7a3b4e', coverEmoji: '🌆',
      description: 'Placeholder description — replace with the real synopsis for Utopia.'
    },
    {
      title: 'The Cairo Trilogy', author: 'Naguib Mahfouz', genre: 'Fiction',
      publisher: 'AUC Press', year: 1957, price: 520, stock: 6,
      isbn: '9780375413313', coverColor: '#8a5a2b', coverEmoji: '🕌',
      description: 'Placeholder description — replace with the real synopsis for The Cairo Trilogy.'
    },
    {
      title: 'The Book of the Jinn', author: 'Ahmed Khaled Tawfik', genre: 'Fiction',
      publisher: 'Dar El Shorouk', year: 2011, price: 265, stock: 8,
      isbn: '9789770935512', coverColor: '#3f3f6b', coverEmoji: '🌙',
      description: 'Placeholder description — replace with the real synopsis for The Book of the Jinn.'
    },
    {
      title: 'Taxi', author: 'Khaled Al Khamissi', genre: 'Non-fiction',
      publisher: 'Dar El Shorouk', year: 2007, price: 190, stock: 0,
      isbn: '9789770933006', coverColor: '#2e5c5a', coverEmoji: '🚕',
      description: 'Placeholder description — replace with the real synopsis for Taxi.'
    },
    {
      title: 'The Days', author: 'Taha Hussein', genre: 'Biography',
      publisher: 'AUC Press', year: 1929, price: 210, stock: 7,
      isbn: '9789774242579', coverColor: '#4a5a7a', coverEmoji: '📜',
      description: 'Placeholder description — replace with the real synopsis for The Days.'
    },
    {
      title: 'Islamic Architecture in Cairo', author: 'Doris Behrens-Abouseif', genre: 'History',
      publisher: 'AUC Press', year: 1989, price: 450, stock: 4,
      isbn: '9789774242036', coverColor: '#6b5b3a', coverEmoji: '🕌',
      description: 'Placeholder description — replace with the real synopsis for Islamic Architecture in Cairo.'
    },
    {
      title: 'Ancient Egypt: A Very Short Introduction', author: 'Ian Shaw', genre: 'History',
      publisher: 'Oxford University Press', year: 2004, price: 260, stock: 11,
      isbn: '9780192854193', coverColor: '#8a6a2b', coverEmoji: '🏺',
      description: 'Placeholder description — replace with the real synopsis for Ancient Egypt: A Very Short Introduction.'
    },
    {
      title: 'Naguib Mahfouz: His Life and Times', author: 'Rasheed El-Enany', genre: 'Biography',
      publisher: 'AUC Press', year: 2007, price: 380, stock: 5,
      isbn: '9789774161340', coverColor: '#5b4a3a', coverEmoji: '✍️',
      description: 'Placeholder description — replace with the real synopsis for Naguib Mahfouz: His Life and Times.'
    },
    {
      title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction',
      publisher: 'HarperCollins', year: 1988, price: 220, stock: 20,
      isbn: '9780062315007', coverColor: '#3f6b52', coverEmoji: '🏜️',
      description: 'Placeholder description — replace with the real synopsis for The Alchemist.'
    },
    {
      title: 'Atomic Habits', author: 'James Clear', genre: 'Self-help',
      publisher: 'Penguin', year: 2018, price: 310, stock: 16,
      isbn: '9780735211292', coverColor: '#6b4f2b', coverEmoji: '✅',
      description: 'Placeholder description — replace with the real synopsis for Atomic Habits.'
    },
    {
      title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', genre: 'Business',
      publisher: 'Plata Publishing', year: 1997, price: 250, stock: 8,
      isbn: '9781612680194', coverColor: '#7a4a2a', coverEmoji: '💼',
      description: 'Placeholder description — replace with the real synopsis for Rich Dad Poor Dad.'
    },
    {
      title: 'The Lean Startup', author: 'Eric Ries', genre: 'Business',
      publisher: 'Crown Business', year: 2011, price: 340, stock: 6,
      isbn: '9780307887894', coverColor: '#2e4a5c', coverEmoji: '🚀',
      description: 'Placeholder description — replace with the real synopsis for The Lean Startup.'
    },
    {
      title: "Harry Potter and the Philosopher's Stone", author: 'J.K. Rowling', genre: 'Children',
      publisher: 'Bloomsbury', year: 1997, price: 300, stock: 18,
      isbn: '9780747532743', coverColor: '#5c3a6b', coverEmoji: '⚡',
      description: 'Placeholder description — replace with the real synopsis for Harry Potter and the Philosopher\'s Stone.'
    },
    {
      title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', genre: 'Children',
      publisher: 'Harcourt', year: 1943, price: 180, stock: 12,
      isbn: '9780156012195', coverColor: '#3a6b7a', coverEmoji: '🌟',
      description: 'Placeholder description — replace with the real synopsis for The Little Prince.'
    },
    {
      title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest & Stein', genre: 'Academic',
      publisher: 'MIT Press', year: 2009, price: 650, stock: 4,
      isbn: '9780262033848', coverColor: '#3a3f52', coverEmoji: '🧮',
      description: 'Placeholder description — replace with the real synopsis for Introduction to Algorithms.'
    },
    {
      title: 'Clean Code', author: 'Robert C. Martin', genre: 'Academic',
      publisher: 'Prentice Hall', year: 2008, price: 480, stock: 2,
      isbn: '9780132350884', coverColor: '#2b4a3f', coverEmoji: '🧑‍💻',
      description: 'Placeholder description — replace with the real synopsis for Clean Code.'
    }
  ];

  /* ==========================================================
     Storage helpers
     ========================================================== */

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn('[Store] Could not read', key, err);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('[Store] Could not write', key, err);
      return false;
    }
  }

  function iso(date = new Date()) {
    return date.toISOString();
  }

  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return iso(d);
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  /** Small deterministic hash for demo passwords (NOT secure — documented as such). */
  function hashPassword(password) {
    const input = `sab::${password}`;
    let h1 = 0x811c9dc5;
    let h2 = 0x1000193;
    for (let i = 0; i < input.length; i++) {
      const c = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
      h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
    }
    return `v1$${h1.toString(16)}${h2.toString(16)}`;
  }

  function money(n) {
    return Number(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function publicUser(user) {
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return safe;
  }

  /* ==========================================================
     Seed data
     ========================================================== */

  function seed() {
    const admin = {
      id: 'u_admin',
      role: 'admin',
      firstName: 'Site',
      lastName: 'Administrator',
      email: 'admin@gmail.com',
      passwordHash: hashPassword('admin123'),
      phone: '01000000000',
      address: { street: '12 Tahrir Square', city: 'Cairo', governorate: 'Cairo', postalCode: '11511' },
      createdAt: daysAgo(120)
    };

    const customer = {
      id: 'u_cust',
      role: 'customer',
      firstName: 'Demo',
      lastName: 'Customer',
      email: 'cust@gmail.com',
      passwordHash: hashPassword('customer123'),
      phone: '01123456789',
      address: { street: '8 El Nasr Road', city: 'Nasr City', governorate: 'Cairo', postalCode: '11765' },
      createdAt: daysAgo(45)
    };

    const books = SEED_BOOKS.map((b, i) => ({
      id: `b_${i + 1}`,
      title: b.title,
      author: b.author,
      isbn: b.isbn,
      genre: GENRES.includes(b.genre) ? b.genre : GENRES[0],
      publisher: b.publisher,
      year: b.year,
      price: Number(b.price),
      stock: Number(b.stock),
      lowStockAt: LOW_STOCK_AT,
      description: b.description,
      coverColor: b.coverColor,
      coverEmoji: b.coverEmoji,
      sold: [34, 21, 12, 9, 18, 27, 8, 5, 3, 6, 40, 25, 17, 11, 38, 29, 4, 7][i] || 0,
      createdAt: daysAgo(90 - i * 3),
      updatedAt: daysAgo(2)
    }));

    const sampleOrder = (num, status, days, lines) => {
      const items = lines.map(([bookId, qty]) => {
        const b = books.find(x => x.id === bookId);
        return {
          bookId,
          title: b.title,
          author: b.author,
          unitPrice: b.price,
          qty,
          lineTotal: round(b.price * qty)
        };
      });
      const sub = round(items.reduce((s, i) => s + i.lineTotal, 0));
      const delivery = sub >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
      const vat = round(sub * VAT_RATE);
      return {
        id: `ORD-${num}`,
        userId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        items,
        subtotal: sub,
        delivery,
        vat,
        total: round(sub + delivery + vat),
        status,
        paymentMethod: 'Card',
        deliveryAddress: { ...customer.address, phone: customer.phone, notes: '' },
        createdAt: daysAgo(days),
        updatedAt: daysAgo(Math.max(0, days - 1))
      };
    };

    const orders = [
      sampleOrder(1001, 'Delivered', 18, [['b_1', 1], ['b_11', 2]]),
      sampleOrder(1002, 'Shipped', 5, [['b_12', 1]]),
      sampleOrder(1003, 'Pending', 1, [['b_15', 1], ['b_16', 1]])
    ];

    write(KEY.users, [admin, customer]);
    write(KEY.books, books);
    write(KEY.carts, {});
    write(KEY.orders, orders);
    write(KEY.session, null);
    write(KEY.version, DB_VERSION);
  }

  function init() {
    if (read(KEY.version, null) !== DB_VERSION) seed();
  }

  function resetDemo() {
    Object.values(KEY).forEach(k => localStorage.removeItem(k));
    seed();
  }

  /* ==========================================================
     Auth & users
     ========================================================== */

  function users() {
    return read(KEY.users, []);
  }

  function findUserByEmail(email) {
    const needle = String(email || '').trim().toLowerCase();
    return users().find(u => u.email.toLowerCase() === needle) || null;
  }

  function userById(id) {
    return users().find(u => u.id === id) || null;
  }

  function authenticate(email, password) {
    const user = findUserByEmail(email);
    if (!user || user.passwordHash !== hashPassword(password)) return null;
    return publicUser(user);
  }

  function register(data) {
    const email = String(data.email || '').trim().toLowerCase();
    if (findUserByEmail(email)) {
      return { ok: false, error: 'That email address is already registered.' };
    }
    const user = {
      id: uid('u'),
      role: 'customer',
      firstName: String(data.firstName || '').trim(),
      lastName: String(data.lastName || '').trim(),
      email,
      passwordHash: hashPassword(String(data.password || '')),
      phone: String(data.phone || '').trim(),
      address: {
        street: String(data.street || '').trim(),
        city: String(data.city || '').trim(),
        governorate: String(data.governorate || '').trim(),
        postalCode: String(data.postalCode || '').trim()
      },
      createdAt: iso()
    };
    const all = users();
    all.push(user);
    write(KEY.users, all);
    return { ok: true, user: publicUser(user) };
  }

  function login(userId) {
    write(KEY.session, { userId, loggedInAt: iso() });
  }

  function logout() {
    write(KEY.session, null);
  }

  function session() {
    return read(KEY.session, null);
  }

  function currentUser() {
    const s = session();
    if (!s || !s.userId) return null;
    return publicUser(userById(s.userId));
  }

  function updateProfile(userId, patch) {
    const all = users();
    const i = all.findIndex(u => u.id === userId);
    if (i === -1) return { ok: false, error: 'Account not found.' };

    if (patch.email) {
      const email = patch.email.trim().toLowerCase();
      const clash = all.find(u => u.id !== userId && u.email.toLowerCase() === email);
      if (clash) return { ok: false, error: 'That email address is already in use.' };
      patch.email = email;
    }

    const { passwordHash, id, role, ...safePatch } = patch;
    all[i] = { ...all[i], ...safePatch };
    if (safePatch.address) {
      all[i].address = { ...all[i].address, ...safePatch.address };
    }
    write(KEY.users, all);
    return { ok: true, user: publicUser(all[i]) };
  }

  function changePassword(userId, oldPassword, newPassword) {
    const all = users();
    const i = all.findIndex(u => u.id === userId);
    if (i === -1) return { ok: false, error: 'Account not found.' };
    if (all[i].passwordHash !== hashPassword(oldPassword)) {
      return { ok: false, error: 'Current password is incorrect.' };
    }
    all[i].passwordHash = hashPassword(newPassword);
    write(KEY.users, all);
    return { ok: true };
  }

  /* ==========================================================
     Books
     ========================================================== */

  function books() {
    return read(KEY.books, []);
  }

  function saveBooks(list) {
    write(KEY.books, list);
  }

  function bookById(id) {
    return books().find(b => b.id === id) || null;
  }

  function bookStockStatus(book) {
    if (!book || book.stock <= 0) return 'out';
    if (book.stock < (book.lowStockAt ?? LOW_STOCK_AT)) return 'low';
    return 'in';
  }

  function createBook(data) {
    const list = books();
    const book = {
      id: uid('b'),
      title: String(data.title || '').trim(),
      author: String(data.author || '').trim(),
      isbn: String(data.isbn || '').trim(),
      genre: data.genre || GENRES[0],
      publisher: String(data.publisher || '').trim(),
      year: Number(data.year) || new Date().getFullYear(),
      price: round(Number(data.price) || 0),
      stock: Math.max(0, Math.floor(Number(data.stock) || 0)),
      lowStockAt: LOW_STOCK_AT,
      description: String(data.description || '').trim(),
      coverColor: data.coverColor || '#5b7f6b',
      coverEmoji: data.coverEmoji || '📖',
      sold: 0,
      createdAt: iso(),
      updatedAt: iso()
    };
    list.unshift(book);
    saveBooks(list);
    return book;
  }

  function updateBook(id, data) {
    const list = books();
    const i = list.findIndex(b => b.id === id);
    if (i === -1) return null;
    const b = list[i];
    list[i] = {
      ...b,
      title: data.title !== undefined ? String(data.title).trim() : b.title,
      author: data.author !== undefined ? String(data.author).trim() : b.author,
      isbn: data.isbn !== undefined ? String(data.isbn).trim() : b.isbn,
      genre: data.genre || b.genre,
      publisher: data.publisher !== undefined ? String(data.publisher).trim() : b.publisher,
      year: data.year !== undefined ? Number(data.year) || b.year : b.year,
      price: data.price !== undefined ? round(Number(data.price) || 0) : b.price,
      stock: data.stock !== undefined ? Math.max(0, Math.floor(Number(data.stock) || 0)) : b.stock,
      description: data.description !== undefined ? String(data.description).trim() : b.description,
      coverColor: data.coverColor || b.coverColor,
      coverEmoji: data.coverEmoji || b.coverEmoji,
      updatedAt: iso()
    };
    saveBooks(list);
    return list[i];
  }

  function deleteBook(id) {
    const list = books();
    const next = list.filter(b => b.id !== id);
    if (next.length === list.length) return false;
    saveBooks(next);

    // Remove the book from every cart so carts never point at a missing book.
    const carts = read(KEY.carts, {});
    Object.keys(carts).forEach(userId => {
      carts[userId] = (carts[userId] || []).filter(line => line.bookId !== id);
    });
    write(KEY.carts, carts);
    return true;
  }

  function restockBook(id, amount) {
    const b = bookById(id);
    if (!b) return null;
    return updateBook(id, { stock: b.stock + Math.max(0, Math.floor(Number(amount) || 0)) });
  }

  function genres() {
    return [...GENRES];
  }

  /* ==========================================================
     Cart
     ========================================================== */

  function rawCarts() {
    return read(KEY.carts, {});
  }

  function cartLines(userId) {
    const carts = rawCarts();
    return Array.isArray(carts[userId]) ? carts[userId] : [];
  }

  function saveCart(userId, lines) {
    const carts = rawCarts();
    carts[userId] = lines;
    write(KEY.carts, carts);
  }

  function addToCart(userId, bookId, qty = 1) {
    const book = bookById(bookId);
    if (!book) return { ok: false, error: 'This book is no longer available.' };

    const lines = cartLines(userId);
    const existing = lines.find(l => l.bookId === bookId);
    const requested = (existing ? existing.qty : 0) + Math.max(1, Math.floor(qty));

    if (book.stock <= 0) return { ok: false, error: 'This book is out of stock.' };
    if (requested > book.stock) {
      return { ok: false, error: `Only ${book.stock} cop${book.stock === 1 ? 'y' : 'ies'} left in stock.` };
    }

    if (existing) existing.qty = requested;
    else lines.push({ bookId, qty: Math.max(1, Math.floor(qty)) });

    saveCart(userId, lines);
    return { ok: true, qty: requested };
  }

  function setCartQty(userId, bookId, qty) {
    const lines = cartLines(userId);
    const line = lines.find(l => l.bookId === bookId);
    if (!line) return { ok: false, error: 'That book is not in your cart.' };

    const book = bookById(bookId);
    if (!book) return { ok: false, error: 'This book is no longer available.' };

    const n = Math.floor(Number(qty));
    if (!Number.isFinite(n) || n < 1) return { ok: false, error: 'Quantity must be at least 1.' };
    if (n > book.stock) return { ok: false, error: `Only ${book.stock} in stock.` };

    line.qty = n;
    saveCart(userId, lines);
    return { ok: true };
  }

  function removeFromCart(userId, bookId) {
    saveCart(userId, cartLines(userId).filter(l => l.bookId !== bookId));
    return { ok: true };
  }

  function clearCart(userId) {
    saveCart(userId, []);
  }

  function cartCount(userId) {
    return cartLines(userId).reduce((sum, l) => sum + l.qty, 0);
  }

  /** Cart + current book data, ignoring lines whose book was deleted. */
  function cartDetailed(userId) {
    return cartLines(userId).reduce((out, line) => {
      const book = bookById(line.bookId);
      if (!book) return out;
      out.push({
        book,
        qty: line.qty,
        lineTotal: round(book.price * line.qty),
        overStock: line.qty > book.stock
      });
      return out;
    }, []);
  }

  /* ==========================================================
     Money
     ========================================================== */

  function round(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  function totals(subtotal) {
    const sub = round(subtotal);
    const delivery = sub === 0 || sub >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
    const vat = round(sub * VAT_RATE);
    return {
      subtotal: sub,
      delivery,
      vat,
      total: round(sub + delivery + vat)
    };
  }

  /* ==========================================================
     Orders
     ========================================================== */

  function orders() {
    return read(KEY.orders, []);
  }

  function nextOrderId() {
    const max = orders().reduce((m, o) => {
      const n = parseInt(String(o.id).replace(/\D/g, ''), 10);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 1000);
    return `ORD-${max + 1}`;
  }

  function ordersForUser(userId) {
    return orders()
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function allOrders() {
    return orders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function orderById(id) {
    return orders().find(o => o.id === id) || null;
  }

  /** Places an order for the current cart. Re-validates stock at the last moment. */
  function placeOrder(userId, { paymentMethod, deliveryAddress }) {
    const detailed = cartDetailed(userId);
    if (!detailed.length) return { ok: false, error: 'Your cart is empty.' };

    const problems = [];
    detailed.forEach(({ book, qty }) => {
      if (book.stock <= 0) problems.push(`${book.title} is out of stock.`);
      else if (qty > book.stock) problems.push(`${book.title}: only ${book.stock} left in stock.`);
    });
    if (problems.length) return { ok: false, error: problems[0], problems };

    const user = userById(userId);
    const items = detailed.map(({ book, qty }) => ({
      bookId: book.id,
      title: book.title,
      author: book.author,
      unitPrice: book.price,
      qty,
      lineTotal: round(book.price * qty)
    }));
    const sums = totals(items.reduce((s, i) => s + i.lineTotal, 0));

    // Deduct stock first, then persist.
    const list = books();
    items.forEach(item => {
      const b = list.find(x => x.id === item.bookId);
      if (b) {
        b.stock = Math.max(0, b.stock - item.qty);
        b.sold = (b.sold || 0) + item.qty;
        b.updatedAt = iso();
      }
    });
    saveBooks(list);

    const order = {
      id: nextOrderId(),
      userId,
      customerName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      items,
      subtotal: sums.subtotal,
      delivery: sums.delivery,
      vat: sums.vat,
      total: sums.total,
      status: 'Pending',
      paymentMethod,
      deliveryAddress: {
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        governorate: deliveryAddress.governorate,
        postalCode: deliveryAddress.postalCode,
        phone: deliveryAddress.phone,
        notes: deliveryAddress.notes || ''
      },
      createdAt: iso(),
      updatedAt: iso()
    };

    const all = orders();
    all.push(order);
    write(KEY.orders, all);
    clearCart(userId);

    return { ok: true, order };
  }

  function advanceOrder(orderId) {
    const all = orders();
    const order = all.find(o => o.id === orderId);
    if (!order) return { ok: false, error: 'Order not found.' };
    if (order.status === 'Cancelled') return { ok: false, error: 'This order was cancelled.' };

    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx === -1 || idx === STATUS_FLOW.length - 1) {
      return { ok: false, error: 'This order is already delivered.' };
    }

    order.status = STATUS_FLOW[idx + 1];
    order.updatedAt = iso();
    write(KEY.orders, all);
    return { ok: true, order };
  }

  function cancelOrder(orderId) {
    const all = orders();
    const order = all.find(o => o.id === orderId);
    if (!order) return { ok: false, error: 'Order not found.' };
    if (order.status === 'Cancelled') return { ok: false, error: 'This order is already cancelled.' };
    if (order.status === 'Delivered') return { ok: false, error: 'Delivered orders cannot be cancelled.' };

    // Put the stock back.
    const list = books();
    order.items.forEach(item => {
      const b = list.find(x => x.id === item.bookId);
      if (b) {
        b.stock += item.qty;
        b.sold = Math.max(0, (b.sold || 0) - item.qty);
        b.updatedAt = iso();
      }
    });
    saveBooks(list);

    order.status = 'Cancelled';
    order.updatedAt = iso();
    write(KEY.orders, all);
    return { ok: true, order };
  }

  /* ==========================================================
     Dashboard statistics
     ========================================================== */

  function stats() {
    const all = orders();
    const list = books();
    const active = all.filter(o => o.status !== 'Cancelled');

    const revenue = round(active.reduce((sum, o) => sum + o.total, 0));
    const lowStock = list.filter(b => bookStockStatus(b) !== 'in');

    const byGenre = {};
    active.forEach(o => o.items.forEach(item => {
      const book = list.find(b => b.id === item.bookId);
      const genre = book ? book.genre : 'Other';
      byGenre[genre] = round((byGenre[genre] || 0) + item.lineTotal);
    }));

    return {
      revenue,
      orderCount: all.length,
      activeOrderCount: active.length,
      bookCount: list.length,
      lowStockCount: lowStock.length,
      lowStock,
      recentOrders: all.slice(0, 5),
      topBooks: [...list].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5),
      revenueByGenre: Object.entries(byGenre)
        .map(([genre, amount]) => ({ genre, amount }))
        .sort((a, b) => b.amount - a.amount)
    };
  }

  /* ==========================================================
     Public API
     ========================================================== */

  return {
    // constants
    VAT_RATE,
    DELIVERY_FEE,
    FREE_DELIVERY_FROM,
    LOW_STOCK_AT,
    CURRENCY,
    STATUS_FLOW,
    ALL_STATUSES,

    init,
    resetDemo,
    money,
    round,
    iso,
    hashPassword,

    // users
    users,
    findUserByEmail,
    userById,
    authenticate,
    register,
    login,
    logout,
    session,
    currentUser,
    updateProfile,
    changePassword,

    // books
    books,
    bookById,
    bookStockStatus,
    createBook,
    updateBook,
    deleteBook,
    restockBook,
    genres,

    // cart
    cartLines,
    cartDetailed,
    addToCart,
    setCartQty,
    removeFromCart,
    clearCart,
    cartCount,

    // money
    totals,

    // orders
    ordersForUser,
    allOrders,
    orderById,
    placeOrder,
    advanceOrder,
    cancelOrder,

    // dashboard
    stats
  };
})();
