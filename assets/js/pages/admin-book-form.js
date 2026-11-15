/* Admin — add / edit book form with live cover preview */
document.addEventListener('DOMContentLoaded', () => {
  const root = App.qs('#book-form-root');
  if (!App.isAdmin()) return;
  const titleEl = App.qs('#form-title');
  const subtitleEl = App.qs('#form-subtitle');

  const id = App.param('id');
  const existing = id ? Store.bookById(id) : null;

  if (id && !existing) {
    titleEl.textContent = 'Book not found';
    root.innerHTML = App.emptyState({
      icon: '📕',
      title: 'That book no longer exists',
      text: 'It may have been deleted. Go back to the list and try again.',
      action: '<a class="btn btn--primary" href="Book_Catalog.html">Back to books</a>'
    });
    return;
  }

  const editing = !!existing;
  const book = existing || {
    title: '', author: '', isbn: '', genre: Store.genres()[0], publisher: '',
    year: new Date().getFullYear(), price: '', stock: 0, description: '',
    coverColor: '#5b7f6b', coverEmoji: '📖'
  };

  document.title = `${editing ? 'Edit' : 'Add'} book · SA Online Bookstore`;
  titleEl.textContent = editing ? 'Edit book' : 'Add a book';
  subtitleEl.textContent = editing
    ? `Editing “${book.title}”. Changes apply to the catalogue immediately.`
    : 'Fill in the details below; the cover is generated from the colour and emoji.';

  root.innerHTML = `
    <div class="admin-grid">
      <form class="card card__body" id="book-form" novalidate>
        <fieldset>
          <legend>Book details</legend>

          <div class="field">
            <label for="bf-title">Title</label>
            <input type="text" id="bf-title" value="${App.esc(book.title)}" placeholder="Book title">
          </div>

          <div class="field-row">
            <div class="field">
              <label for="bf-author">Author</label>
              <input type="text" id="bf-author" value="${App.esc(book.author)}" placeholder="Author name">
            </div>
            <div class="field">
              <label for="bf-isbn">ISBN</label>
              <input type="text" id="bf-isbn" value="${App.esc(book.isbn)}" placeholder="9780132350884">
              <div class="hint">10 or 13 digits, hyphens allowed.</div>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="bf-genre">Genre</label>
              <select id="bf-genre">
                ${Store.genres().map(g => `<option value="${App.esc(g)}" ${g === book.genre ? 'selected' : ''}>${App.esc(g)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label for="bf-publisher">Publisher</label>
              <input type="text" id="bf-publisher" value="${App.esc(book.publisher)}" placeholder="Publisher">
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="bf-year">Year</label>
              <input type="number" id="bf-year" value="${App.esc(book.year)}" min="1450" max="${new Date().getFullYear() + 1}">
            </div>
            <div class="field">
              <label for="bf-price">Price (${Store.CURRENCY})</label>
              <input type="number" id="bf-price" value="${App.esc(book.price)}" min="0" step="0.01" placeholder="250">
            </div>
          </div>

          <div class="field">
            <label for="bf-stock">Stock on hand</label>
            <input type="number" id="bf-stock" value="${App.esc(book.stock)}" min="0" step="1">
          </div>

          <div class="field">
            <label for="bf-description">Description</label>
            <textarea id="bf-description" placeholder="Short synopsis shown on the book page…">${App.esc(book.description)}</textarea>
          </div>
        </fieldset>

        <fieldset>
          <legend>Cover</legend>

          <div class="field-row">
            <div class="field">
              <label for="bf-emoji">Cover emoji</label>
              <input type="text" id="bf-emoji" value="${App.esc(book.coverEmoji)}" maxlength="6" placeholder="📖">
              <div class="hint">One emoji, e.g. 🏺 🕌 📜.</div>
            </div>
            <div class="field">
              <label for="bf-color">Cover colour</label>
              <input type="color" id="bf-color" value="${App.esc(book.coverColor)}">
            </div>
          </div>
        </fieldset>

        <div class="form-actions">
          <button class="btn btn--primary" type="submit">${editing ? 'Save changes' : 'Add book'}</button>
          <a class="btn" href="Book_Catalog.html">Cancel</a>
        </div>
      </form>

      <aside class="card card__body preview-card">
        <h3>Cover preview</h3>
        <div id="cover-preview"></div>
        <p class="muted small mb-0">
          This is how the book will look in the catalogue and on carts. No image upload needed.
        </p>
      </aside>
    </div>`;

  const form = App.qs('#book-form');
  const fields = {
    title: App.qs('#bf-title'),
    author: App.qs('#bf-author'),
    isbn: App.qs('#bf-isbn'),
    genre: App.qs('#bf-genre'),
    publisher: App.qs('#bf-publisher'),
    year: App.qs('#bf-year'),
    price: App.qs('#bf-price'),
    stock: App.qs('#bf-stock'),
    description: App.qs('#bf-description'),
    emoji: App.qs('#bf-emoji'),
    color: App.qs('#bf-color')
  };

  function updatePreview() {
    App.qs('#cover-preview').innerHTML = App.coverHTML({
      title: fields.title.value.trim() || 'Book title',
      author: fields.author.value.trim() || 'Author name',
      coverEmoji: fields.emoji.value.trim() || '📖',
      coverColor: fields.color.value || '#5b7f6b'
    });
  }

  App.qsa('input, textarea, select', form).forEach(input => {
    input.addEventListener('input', () => {
      App.clearFieldError(input);
      updatePreview();
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    const valid = App.validate(form, [
      ['#bf-title', App.validators.required, 'Enter the book title.'],
      ['#bf-author', App.validators.required, 'Enter the author.'],
      ['#bf-isbn', App.validators.required, 'Enter the ISBN.'],
      ['#bf-isbn', App.validators.isbn, 'ISBN must be 10 or 13 digits.'],
      ['#bf-year', App.validators.year, 'Enter a realistic publication year.'],
      ['#bf-price', App.validators.price, 'Price must be a positive amount (max 2 decimals).'],
      ['#bf-stock', App.validators.stock, 'Stock must be a whole number, 0 or more.']
    ]);
    if (!valid) return;

    const data = {
      title: fields.title.value.trim(),
      author: fields.author.value.trim(),
      isbn: fields.isbn.value.trim(),
      genre: fields.genre.value,
      publisher: fields.publisher.value.trim(),
      year: Number(fields.year.value),
      price: Number(fields.price.value),
      stock: Number(fields.stock.value),
      description: fields.description.value.trim(),
      coverEmoji: fields.emoji.value.trim() || '📖',
      coverColor: fields.color.value || '#5b7f6b'
    };

    if (editing) {
      const updated = Store.updateBook(book.id, data);
      if (!updated) {
        App.toast('Could not save the book. It may have been deleted.', 'error');
        return;
      }
      App.flash(`Saved changes to “${updated.title}”.`, 'ok');
    } else {
      const created = Store.createBook(data);
      App.flash(`Added “${created.title}” to the catalogue.`, 'ok');
    }

    location.href = App.paths.adminBooks;
  });

  updatePreview();
});
