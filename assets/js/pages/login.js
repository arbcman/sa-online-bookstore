/* Login / Register page */
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = App.qs('#login-form');
  const registerForm = App.qs('#register-form');
  const formError = App.qs('#form-error');
  const title = App.qs('#auth-title');
  const sub = App.qs('#auth-sub');
  const tabs = App.qsa('.tab');

  const COPY = {
    login: ['Welcome back', 'Sign in to continue to your bookstore account.'],
    register: ['Create your account', 'It takes less than a minute — then start filling your cart.']
  };

  function showTab(name) {
    tabs.forEach(t => {
      const active = t.dataset.tab === name;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    loginForm.classList.toggle('hidden', name !== 'login');
    registerForm.classList.toggle('hidden', name !== 'register');
    title.textContent = COPY[name][0];
    sub.textContent = COPY[name][1];
    hideError();
    const first = (name === 'login' ? loginForm : registerForm).querySelector('input');
    if (first) first.focus();
  }

  function showError(message) {
    formError.textContent = message;
    formError.classList.remove('hidden');
  }
  function hideError() {
    formError.textContent = '';
    formError.classList.add('hidden');
  }

  tabs.forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tab)));

  // Deep link: ?tab=register
  if (App.param('tab') === 'register') showTab('register');

  /* ---------- sign in ---------- */
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    hideError();

    const ok = App.validate(loginForm, [
      ['#login-email', App.validators.required, 'Enter your email address.'],
      ['#login-email', App.validators.email, 'That does not look like a valid email.'],
      ['#login-password', App.validators.required, 'Enter your password.']
    ]);
    if (!ok) return;

    const email = App.qs('#login-email').value;
    const password = App.qs('#login-password').value;
    const user = Store.authenticate(email, password);

    if (!user) {
      showError('Email or password is incorrect. Try one of the demo accounts below.');
      return;
    }

    Store.login(user.id);
    const next = App.param('next');

    if (user.role === 'admin') {
      App.flash(`Welcome back, ${user.firstName}.`, 'ok');
      location.href = App.paths.adminDashboard;
      return;
    }

    App.flash(`Welcome back, ${user.firstName}.`, 'ok');
    const safeNext = next && /^[A-Za-z0-9_\-]+\.html(\?[^\s]*)?$/.test(next) && next !== 'admin'
      ? decodeURIComponent(next)
      : null;
    location.href = safeNext ? `../Customer's/${safeNext}` : App.paths.home;
  });

  /* ---------- register ---------- */
  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    hideError();

    const rules = [
      ['#reg-first', App.validators.required, 'Enter your first name.'],
      ['#reg-last', App.validators.required, 'Enter your last name.'],
      ['#reg-email', App.validators.required, 'Enter your email address.'],
      ['#reg-email', App.validators.email, 'That does not look like a valid email.'],
      ['#reg-phone', App.validators.required, 'Enter your mobile number.'],
      ['#reg-phone', App.validators.phone, 'Use an Egyptian mobile number, e.g. 01012345678.'],
      ['#reg-password', App.validators.password, 'Password must be at least 8 characters.'],
      ['#reg-confirm', v => v === App.qs('#reg-password').value, 'Passwords do not match.']
    ];

    const postal = App.qs('#reg-postal').value.trim();
    if (postal) rules.push(['#reg-postal', App.validators.postal, 'Postal code must be 5 digits.']);

    if (!App.validate(registerForm, rules)) return;

    const result = Store.register({
      firstName: App.qs('#reg-first').value,
      lastName: App.qs('#reg-last').value,
      email: App.qs('#reg-email').value,
      phone: App.qs('#reg-phone').value,
      street: App.qs('#reg-street').value,
      city: App.qs('#reg-city').value,
      governorate: App.qs('#reg-gov').value,
      postalCode: App.qs('#reg-postal').value,
      password: App.qs('#reg-password').value
    });

    if (!result.ok) {
      showError(result.error);
      App.fieldError(App.qs('#reg-email'), result.error);
      return;
    }

    Store.login(result.user.id);
    App.flash(`Welcome, ${result.user.firstName}! Your account is ready.`, 'ok');
    location.href = App.paths.home;
  });

  /* ---------- demo autofill ---------- */
  App.qsa('[data-demo]').forEach(btn => {
    btn.addEventListener('click', () => {
      showTab('login');
      const isAdmin = btn.dataset.demo === 'admin';
      App.qs('#login-email').value = isAdmin ? 'admin@gmail.com' : 'cust@gmail.com';
      App.qs('#login-password').value = isAdmin ? 'admin123' : 'customer123';
      App.clearErrors(loginForm);
      App.qs('#login-password').focus();
    });
  });

  /* clear an error as soon as the user edits the field */
  App.qsa('input', document).forEach(input => {
    input.addEventListener('input', () => App.clearFieldError(input));
  });
});
