/* Account settings — profile, delivery address, password */
document.addEventListener('DOMContentLoaded', () => {
  const root = App.qs('#account-root');
  const subtitle = App.qs('#account-subtitle');
  const user = App.user();
  if (!user || user.role !== 'customer') return;
  const address = user.address || {};

  subtitle.textContent = `Signed in as ${user.email} · member since ${App.formatDate(user.createdAt)}`;

  root.innerHTML = `
    <section class="card card__body" id="profile" style="margin-bottom:1.5rem">
      <div class="panel-title">
        <h2>Profile &amp; delivery address</h2>
        <span class="badge badge--accent">${App.esc(user.role)}</span>
      </div>
      <p class="muted small">These details are used to prefill checkout.</p>

      <form id="profile-form" novalidate>
        <div class="field-row">
          <div class="field">
            <label for="ac-first">First name</label>
            <input type="text" id="ac-first" value="${App.esc(user.firstName)}" autocomplete="given-name">
          </div>
          <div class="field">
            <label for="ac-last">Last name</label>
            <input type="text" id="ac-last" value="${App.esc(user.lastName)}" autocomplete="family-name">
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="ac-email">Email address</label>
            <input type="email" id="ac-email" value="${App.esc(user.email)}" autocomplete="email">
          </div>
          <div class="field">
            <label for="ac-phone">Mobile number</label>
            <input type="tel" id="ac-phone" value="${App.esc(user.phone || '')}" autocomplete="tel">
          </div>
        </div>

        <div class="field">
          <label for="ac-street">Street address</label>
          <input type="text" id="ac-street" value="${App.esc(address.street || '')}" autocomplete="street-address">
        </div>

        <div class="field-row">
          <div class="field">
            <label for="ac-city">City</label>
            <input type="text" id="ac-city" value="${App.esc(address.city || '')}" autocomplete="address-level2">
          </div>
          <div class="field">
            <label for="ac-gov">Governorate</label>
            <input type="text" id="ac-gov" value="${App.esc(address.governorate || '')}" autocomplete="address-level1">
          </div>
        </div>

        <div class="field">
          <label for="ac-postal">Postal code</label>
          <input type="text" id="ac-postal" value="${App.esc(address.postalCode || '')}" inputmode="numeric" maxlength="5" autocomplete="postal-code">
        </div>

        <div class="form-actions">
          <button class="btn btn--primary" type="submit">Save changes</button>
          <a class="btn btn--ghost" href="My_Orders.html">View my orders</a>
        </div>
      </form>
    </section>

    <section class="card card__body" id="password">
      <div class="panel-title">
        <h2>Change password</h2>
      </div>
      <p class="muted small">Use at least 8 characters. You will stay signed in.</p>

      <form id="password-form" novalidate>
        <div class="field">
          <label for="pw-current">Current password</label>
          <input type="password" id="pw-current" autocomplete="current-password">
        </div>
        <div class="field-row">
          <div class="field">
            <label for="pw-new">New password</label>
            <input type="password" id="pw-new" autocomplete="new-password">
          </div>
          <div class="field">
            <label for="pw-confirm">Confirm new password</label>
            <input type="password" id="pw-confirm" autocomplete="new-password">
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn--dark" type="submit">Update password</button>
        </div>
      </form>
    </section>`;

  App.qs('#account-logout').addEventListener('click', App.logout);

  App.qsa('input', root).forEach(input => {
    input.addEventListener('input', () => App.clearFieldError(input));
  });

  /* ---------- profile ---------- */
  const profileForm = App.qs('#profile-form');

  profileForm.addEventListener('submit', e => {
    e.preventDefault();

    const postal = App.qs('#ac-postal').value.trim();
    const rules = [
      ['#ac-first', App.validators.required, 'Enter your first name.'],
      ['#ac-last', App.validators.required, 'Enter your last name.'],
      ['#ac-email', App.validators.required, 'Enter your email address.'],
      ['#ac-email', App.validators.email, 'That does not look like a valid email.'],
      ['#ac-phone', App.validators.required, 'Enter your mobile number.'],
      ['#ac-phone', App.validators.phone, 'Use an Egyptian mobile number, e.g. 01012345678.']
    ];
    if (postal) rules.push(['#ac-postal', App.validators.postal, 'Postal code must be 5 digits.']);

    if (!App.validate(profileForm, rules)) return;

    const result = Store.updateProfile(user.id, {
      firstName: App.qs('#ac-first').value,
      lastName: App.qs('#ac-last').value,
      email: App.qs('#ac-email').value,
      phone: App.qs('#ac-phone').value,
      address: {
        street: App.qs('#ac-street').value,
        city: App.qs('#ac-city').value,
        governorate: App.qs('#ac-gov').value,
        postalCode: postal
      }
    });

    if (!result.ok) {
      App.fieldError(App.qs('#ac-email'), result.error);
      App.toast(result.error, 'error');
      return;
    }

    App.flash('Your profile has been updated.', 'ok');
    location.reload();
  });

  /* ---------- password ---------- */
  const passwordForm = App.qs('#password-form');

  passwordForm.addEventListener('submit', e => {
    e.preventDefault();

    const valid = App.validate(passwordForm, [
      ['#pw-current', App.validators.required, 'Enter your current password.'],
      ['#pw-new', App.validators.password, 'New password must be at least 8 characters.'],
      ['#pw-confirm', v => v === App.qs('#pw-new').value, 'Passwords do not match.']
    ]);
    if (!valid) return;

    const result = Store.changePassword(
      user.id,
      App.qs('#pw-current').value,
      App.qs('#pw-new').value
    );

    if (!result.ok) {
      App.fieldError(App.qs('#pw-current'), result.error);
      return;
    }

    passwordForm.reset();
    App.clearErrors(passwordForm);
    App.toast('Password updated successfully.', 'ok');
  });
});
