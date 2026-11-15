/* Checkout — delivery form, validation, order placement */
document.addEventListener('DOMContentLoaded', () => {
  const root = App.qs('#checkout-root');
  const head = App.qs('#checkout-head');
  const user = App.user();
  if (!user || user.role !== 'customer') return;

  const lines = Store.cartDetailed(user.id);

  if (!lines.length) {
    head.querySelector('h1').textContent = 'Nothing to check out';
    head.querySelector('p').textContent = 'Your cart is empty, so there is no order to place yet.';
    root.innerHTML = App.emptyState({
      icon: '🛒',
      title: 'Your cart is empty',
      text: 'Add a few books first, then come back to complete your order.',
      action: '<a class="btn btn--primary" href="Book_Catalog.html">Browse books</a>'
    });
    return;
  }

  const sums = Store.totals(lines.reduce((s, l) => s + l.lineTotal, 0));
  const address = user.address || {};

  const PAYMENTS = [
    ['Card', 'Visa or Mastercard', 'Simulated payment — no card details are stored.'],
    ['Bank transfer', 'Direct bank transfer', 'We confirm the order once the transfer clears.'],
    ['Cash on delivery', 'Pay when it arrives', 'Pay the courier in cash on delivery.']
  ];

  root.innerHTML = `
    <form class="checkout-layout" id="checkout-form" novalidate>
      <div>
        <section class="card card__body checkout-block">
          <fieldset>
            <legend>Contact &amp; delivery</legend>

            <div class="field-row">
              <div class="field">
                <label for="co-first">First name</label>
                <input type="text" id="co-first" name="firstName" autocomplete="given-name" value="${App.esc(user.firstName)}">
              </div>
              <div class="field">
                <label for="co-last">Last name</label>
                <input type="text" id="co-last" name="lastName" autocomplete="family-name" value="${App.esc(user.lastName)}">
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="co-email">Email address</label>
                <input type="email" id="co-email" name="email" autocomplete="email" value="${App.esc(user.email)}">
              </div>
              <div class="field">
                <label for="co-phone">Mobile number</label>
                <input type="tel" id="co-phone" name="phone" autocomplete="tel" value="${App.esc(user.phone || '')}" placeholder="01012345678">
              </div>
            </div>

            <div class="field">
              <label for="co-street">Street address</label>
              <input type="text" id="co-street" name="street" autocomplete="street-address" value="${App.esc(address.street || '')}">
            </div>

            <div class="field-row">
              <div class="field">
                <label for="co-city">City</label>
                <input type="text" id="co-city" name="city" autocomplete="address-level2" value="${App.esc(address.city || '')}">
              </div>
              <div class="field">
                <label for="co-gov">Governorate</label>
                <input type="text" id="co-gov" name="governorate" autocomplete="address-level1" value="${App.esc(address.governorate || '')}">
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="co-postal">Postal code</label>
                <input type="text" id="co-postal" name="postalCode" inputmode="numeric" maxlength="5"
                       autocomplete="postal-code" value="${App.esc(address.postalCode || '')}">
                <div class="hint">5 digits.</div>
              </div>
              <div class="field">
                <label for="co-notes">Delivery notes <span class="muted small">(optional)</span></label>
                <input type="text" id="co-notes" name="notes" placeholder="Building, floor, landmark…">
              </div>
            </div>
          </fieldset>
        </section>

        <section class="card card__body">
          <fieldset>
            <legend>Payment method</legend>
            <div class="pay-options" id="pay-options">
              ${PAYMENTS.map(([value, title, note], i) => `
                <label class="pay-option ${i === 0 ? 'is-selected' : ''}">
                  <input type="radio" name="payment" value="${value}" ${i === 0 ? 'checked' : ''}>
                  <span>
                    <strong>${title}</strong>
                    <span>${note}</span>
                  </span>
                </label>`).join('')}
            </div>
          </fieldset>

          <div class="notice notice--info small">
            <span aria-hidden="true">i</span>
            <span>Stock is checked again when you place the order. Prices are in ${Store.CURRENCY} and include 14% VAT.</span>
          </div>
        </section>
      </div>

      <aside class="summary" aria-label="Order summary">
        <h2>Your order</h2>
        <div class="mini-lines">
          ${lines.map(({ book, qty, lineTotal }) => `
            <div class="mini-line">
              <span>${qty} × ${App.esc(book.title)}</span>
              <span>${App.money(lineTotal)}</span>
            </div>`).join('')}
        </div>

        <div class="summary__row"><span>Subtotal</span><span>${App.money(sums.subtotal)}</span></div>
        <div class="summary__row"><span>Delivery</span><span>${sums.delivery === 0 ? 'Free' : App.money(sums.delivery)}</span></div>
        <div class="summary__row"><span>VAT (14%)</span><span>${App.money(sums.vat)}</span></div>
        <div class="summary__row summary__row--total"><span>Total</span><span class="price">${App.money(sums.total)}</span></div>

        <button class="btn btn--primary btn--block btn--lg" type="submit" id="place-order">
          Place order · ${App.money(sums.total)}
        </button>
        <p class="summary__note">You can follow the order from “My Orders” after checkout.</p>
      </aside>
    </form>`;

  const form = App.qs('#checkout-form');
  const submit = App.qs('#place-order');

  // Payment card highlight
  App.qsa('input[name="payment"]', form).forEach(input => {
    input.addEventListener('change', () => {
      App.qsa('.pay-option', form).forEach(opt => {
        opt.classList.toggle('is-selected', opt.querySelector('input').checked);
      });
    });
  });

  // Clear individual errors while typing
  App.qsa('input', form).forEach(input => {
    input.addEventListener('input', () => App.clearFieldError(input));
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    const rules = [
      ['#co-first', App.validators.required, 'Enter your first name.'],
      ['#co-last', App.validators.required, 'Enter your last name.'],
      ['#co-email', App.validators.required, 'Enter your email address.'],
      ['#co-email', App.validators.email, 'That does not look like a valid email.'],
      ['#co-phone', App.validators.required, 'Enter your mobile number.'],
      ['#co-phone', App.validators.phone, 'Use an Egyptian mobile number, e.g. 01012345678.'],
      ['#co-street', App.validators.required, 'Enter your street address.'],
      ['#co-city', App.validators.required, 'Enter your city.'],
      ['#co-gov', App.validators.required, 'Enter your governorate.'],
      ['#co-postal', App.validators.required, 'Enter your postal code.'],
      ['#co-postal', App.validators.postal, 'Postal code must be 5 digits.']
    ];

    if (!App.validate(form, rules)) return;

    const deliveryAddress = {
      street: App.qs('#co-street').value.trim(),
      city: App.qs('#co-city').value.trim(),
      governorate: App.qs('#co-gov').value.trim(),
      postalCode: App.qs('#co-postal').value.trim(),
      phone: App.qs('#co-phone').value.trim(),
      notes: App.qs('#co-notes').value.trim()
    };

    // Keep the account email in sync if the customer edited it here.
    const email = App.qs('#co-email').value.trim();
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const profile = Store.updateProfile(user.id, { email });
      if (!profile.ok) {
        App.fieldError(App.qs('#co-email'), profile.error);
        return;
      }
    }

    const paymentMethod = form.querySelector('input[name="payment"]:checked').value;

    submit.disabled = true;
    const result = Store.placeOrder(user.id, { paymentMethod, deliveryAddress });

    if (!result.ok) {
      submit.disabled = false;
      App.toast(result.error, 'error');
      const notice = document.createElement('div');
      notice.className = 'notice notice--danger';
      notice.style.marginTop = '1rem';
      notice.innerHTML = `<span aria-hidden="true">!</span><span>${App.esc(result.error)} Please review your cart.</span>`;
      form.prepend(notice);
      return;
    }

    App.refreshCart();
    renderConfirmation(result.order);
  });

  function renderConfirmation(order) {
    head.innerHTML = `
      <div>
        <h1>Order confirmed</h1>
        <p class="muted">Thank you — your books are on their way.</p>
      </div>
      <a class="btn btn--ghost" href="Book_Catalog.html">Continue shopping</a>`;

    root.innerHTML = `
      <div class="confirm-card">
        <div class="confirm-icon" aria-hidden="true">✓</div>
        <h1>Thank you, ${App.esc(order.customerName.split(' ')[0])}!</h1>
        <p class="muted">Your order has been placed and is now <strong>Pending</strong>.</p>
        <div class="order-no">${App.esc(order.id)}</div>

        <div class="confirm-lines mini-lines">
          ${order.items.map(item => `
            <div class="mini-line">
              <span>${item.qty} × ${App.esc(item.title)}</span>
              <span>${App.money(item.lineTotal)}</span>
            </div>`).join('')}
          <div class="mini-line" style="border-top:1px solid var(--line);padding-top:.6rem;margin-top:.3rem">
            <span><strong>Total paid</strong></span>
            <span><strong>${App.money(order.total)}</strong></span>
          </div>
        </div>

        <div class="detail-block">
          <h4>Delivering to</h4>
          <p>
            ${App.esc(order.deliveryAddress.street)}, ${App.esc(order.deliveryAddress.city)},
            ${App.esc(order.deliveryAddress.governorate)} ${App.esc(order.deliveryAddress.postalCode)}
            <br><span class="muted small">${App.esc(order.deliveryAddress.phone)} · ${App.esc(order.paymentMethod)}</span>
          </p>
        </div>

        <p class="small muted">Estimated delivery: 3–5 working days.</p>

        <div class="btn-row" style="justify-content:center;margin-top:1.4rem">
          <a class="btn btn--primary" href="My_Orders.html">View my orders</a>
          <a class="btn" href="Book_Catalog.html">Keep browsing</a>
        </div>
      </div>`;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});
