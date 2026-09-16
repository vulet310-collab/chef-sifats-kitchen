/* =========================================================
   CHEF SIFAT'S KITCHEN — CUSTOMER AUTH
   Register / Login / Forgot Password / Reset Password
   My Orders / Logout
   ========================================================= */

const CUSTOMER_TOKEN_KEY = 'csk_customer_token';
const CUSTOMER_DATA_KEY = 'csk_customer_data';

function getCustomerToken() {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY) || '';
}

function getCustomerData() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_DATA_KEY) || 'null');
  } catch {
    return null;
  }
}

function isCustomerLoggedIn() {
  return !!getCustomerToken();
}

function saveCustomerSession(data) {
  if (!data) return;

  if (data.token) {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
  }

  if (data.customer) {
    localStorage.setItem(
      CUSTOMER_DATA_KEY,
      JSON.stringify(data.customer)
    );
  }
}

function clearCustomerSession() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_DATA_KEY);
}

async function customerApi(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getCustomerToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      'Something went wrong.'
    );
  }

  return data;
}

/* =========================================================
   AUTH MODAL
   ========================================================= */

function createCustomerAuthUI() {
  if (document.getElementById('customerAuthModal')) {
    updateCustomerAccountButton();
    return;
  }

  const modal = document.createElement('div');

  modal.id = 'customerAuthModal';
  modal.className = 'modal hidden';

  modal.innerHTML = `
    <div class="modal-card customer-auth-card">

      <button
        class="modal-close"
        type="button"
        onclick="closeCustomerAuth()"
      >
        ×
      </button>

      <span class="mini">CUSTOMER ACCOUNT</span>

      <h2 id="customerAuthTitle">
        Login
      </h2>

      <div id="customerAuthMessage"></div>

      <!-- LOGIN -->

      <form
        id="customerLoginForm"
        onsubmit="customerLogin(event)"
      >

        <label>
          Mobile Number or Email

          <input
            id="loginIdentifier"
            required
            autocomplete="username"
            placeholder="01XXXXXXXXX or email"
          >
        </label>

        <label>
          Password

          <input
            id="loginPassword"
            type="password"
            required
            autocomplete="current-password"
            placeholder="Enter password"
          >
        </label>

        <button
          class="btn gold full"
          type="submit"
        >
          Login
        </button>

        <div class="auth-links">
          <button
            type="button"
            class="text-button"
            onclick="showForgotPassword()"
          >
            Forgot Password?
          </button>

          <button
            type="button"
            class="text-button"
            onclick="showRegister()"
          >
            Create Account
          </button>
        </div>

      </form>


      <!-- REGISTER -->

      <form
        id="customerRegisterForm"
        class="hidden"
        onsubmit="customerRegister(event)"
      >

        <label>
          Full Name

          <input
            id="registerName"
            required
            autocomplete="name"
            placeholder="Your full name"
          >
        </label>

        <label>
          Mobile Number

          <input
            id="registerPhone"
            required
            autocomplete="tel"
            placeholder="01XXXXXXXXX"
          >
        </label>

        <label>
          Email

          <input
            id="registerEmail"
            type="email"
            required
            autocomplete="email"
            placeholder="your@email.com"
          >
        </label>

        <label>
          Password

          <input
            id="registerPassword"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            placeholder="Minimum 8 characters"
          >
        </label>

        <label>
          Confirm Password

          <input
            id="registerConfirmPassword"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            placeholder="Repeat your password"
          >
        </label>

        <button
          class="btn gold full"
          type="submit"
        >
          Create Account
        </button>

        <div class="auth-links">

          <button
            type="button"
            class="text-button"
            onclick="showLogin()"
          >
            Already have an account? Login
          </button>

        </div>

      </form>


      <!-- FORGOT PASSWORD -->

      <form
        id="customerForgotForm"
        class="hidden"
        onsubmit="requestPasswordReset(event)"
      >

        <p class="auth-description">
          Enter the email address connected to your account.
          We will send you a password reset code.
        </p>

        <label>
          Email

          <input
            id="forgotEmail"
            type="email"
            required
            autocomplete="email"
            placeholder="your@email.com"
          >
        </label>

        <button
          class="btn gold full"
          type="submit"
        >
          Send Reset Code
        </button>

        <div class="auth-links">

          <button
            type="button"
            class="text-button"
            onclick="showLogin()"
          >
            Back to Login
          </button>

        </div>

      </form>


      <!-- RESET PASSWORD -->

      <form
        id="customerResetForm"
        class="hidden"
        onsubmit="resetCustomerPassword(event)"
      >

        <p class="auth-description">
          Enter the 6-digit code sent to your email
          and choose a new password.
        </p>

        <label>
          Email

          <input
            id="resetEmail"
            type="email"
            required
            autocomplete="email"
            placeholder="your@email.com"
          >
        </label>

        <label>
          Reset Code

          <input
            id="resetCode"
            required
            inputmode="numeric"
            maxlength="6"
            placeholder="6-digit code"
          >
        </label>

        <label>
          New Password

          <input
            id="resetPassword"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            placeholder="Minimum 8 characters"
          >
        </label>

        <label>
          Confirm New Password

          <input
            id="resetConfirmPassword"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            placeholder="Repeat new password"
          >
        </label>

        <button
          class="btn gold full"
          type="submit"
        >
          Reset Password
        </button>

        <div class="auth-links">

          <button
            type="button"
            class="text-button"
            onclick="showLogin()"
          >
            Back to Login
          </button>

        </div>

      </form>


      <!-- ACCOUNT -->

      <div
        id="customerAccountPanel"
        class="hidden"
      >

        <div class="customer-profile">

          <h3 id="customerAccountName">
            Customer
          </h3>

          <p id="customerAccountPhone"></p>
          <p id="customerAccountEmail"></p>

        </div>

        <button
          class="btn gold full"
          type="button"
          onclick="showCustomerOrders()"
        >
          My Orders
        </button>

        <button
          class="btn secondary full"
          type="button"
          onclick="customerLogout()"
        >
          Logout
        </button>

        <div
          id="customerOrders"
          class="customer-orders hidden"
        ></div>

      </div>

    </div>
  `;

  document.body.appendChild(modal);

  addCustomerAuthStyles();

  updateCustomerAccountButton();
}

/* =========================================================
   ACCOUNT BUTTON
   ========================================================= */

function createCustomerAccountButton() {

  const nav = document.querySelector('.nav');

  if (!nav) return;

  if (document.getElementById('customerAccountButton')) {
    updateCustomerAccountButton();
    return;
  }

  const button = document.createElement('button');

  button.id = 'customerAccountButton';
  button.type = 'button';
  button.className = 'btn secondary customer-account-button';

  button.onclick = openCustomerAccount;

  button.textContent = 'Login';

  nav.appendChild(button);

  updateCustomerAccountButton();
}

function updateCustomerAccountButton() {

  const button =
    document.getElementById('customerAccountButton');

  if (!button) return;

  const customer = getCustomerData();

  if (isCustomerLoggedIn() && customer) {
    button.textContent = 'My Account';
  } else {
    button.textContent = 'Login';
  }
}

/* =========================================================
   OPEN / CLOSE
   ========================================================= */

function openCustomerAccount() {

  createCustomerAuthUI();

  const customer = getCustomerData();

  if (isCustomerLoggedIn() && customer) {
    showAccountPanel();
  } else {
    showLogin();
  }

  document
    .getElementById('customerAuthModal')
    ?.classList.remove('hidden');
}

function closeCustomerAuth() {

  document
    .getElementById('customerAuthModal')
    ?.classList.add('hidden');

  clearAuthMessage();
}

function showAuthMessage(message, type = 'error') {

  const box =
    document.getElementById('customerAuthMessage');

  if (!box) return;

  box.innerHTML = `
    <div class="customer-auth-message ${type}">
      ${escapeCustomerHtml(message)}
    </div>
  `;
}

function clearAuthMessage() {

  const box =
    document.getElementById('customerAuthMessage');

  if (box) {
    box.innerHTML = '';
  }
}

/* =========================================================
   FORM SWITCHING
   ========================================================= */

function hideAllCustomerForms() {

  [
    'customerLoginForm',
    'customerRegisterForm',
    'customerForgotForm',
    'customerResetForm',
    'customerAccountPanel'
  ].forEach(id => {

    document
      .getElementById(id)
      ?.classList.add('hidden');

  });
}

function showLogin() {

  hideAllCustomerForms();

  document
    .getElementById('customerLoginForm')
    ?.classList.remove('hidden');

  const title =
    document.getElementById('customerAuthTitle');

  if (title) title.textContent = 'Login';

  clearAuthMessage();
}

function showRegister() {

  hideAllCustomerForms();

  document
    .getElementById('customerRegisterForm')
    ?.classList.remove('hidden');

  const title =
    document.getElementById('customerAuthTitle');

  if (title) title.textContent = 'Create Account';

  clearAuthMessage();
}

function showForgotPassword() {

  hideAllCustomerForms();

  document
    .getElementById('customerForgotForm')
    ?.classList.remove('hidden');

  const title =
    document.getElementById('customerAuthTitle');

  if (title) title.textContent = 'Forgot Password';

  clearAuthMessage();
}

function showResetPassword(email = '') {

  hideAllCustomerForms();

  document
    .getElementById('customerResetForm')
    ?.classList.remove('hidden');

  const title =
    document.getElementById('customerAuthTitle');

  if (title) title.textContent = 'Reset Password';

  if (email) {

    const input =
      document.getElementById('resetEmail');

    if (input) {
      input.value = email;
    }

  }

  clearAuthMessage();
}

function showAccountPanel() {

  hideAllCustomerForms();

  document
    .getElementById('customerAccountPanel')
    ?.classList.remove('hidden');

  const title =
    document.getElementById('customerAuthTitle');

  if (title) title.textContent = 'My Account';

  const customer = getCustomerData();

  if (!customer) return;

  const name =
    document.getElementById('customerAccountName');

  const phone =
    document.getElementById('customerAccountPhone');

  const email =
    document.getElementById('customerAccountEmail');

  if (name) {
    name.textContent = customer.name || 'Customer';
  }

  if (phone) {
    phone.textContent =
      customer.phone
        ? `Phone: ${customer.phone}`
        : '';
  }

  if (email) {
    email.textContent =
      customer.email
        ? `Email: ${customer.email}`
        : '';
  }
}

/* =========================================================
   REGISTER
   ========================================================= */

async function customerRegister(event) {

  event.preventDefault();

  clearAuthMessage();

  const name =
    document.getElementById('registerName')?.value.trim();

  const phone =
    document.getElementById('registerPhone')?.value.trim();

  const email =
    document.getElementById('registerEmail')?.value.trim();

  const password =
    document.getElementById('registerPassword')?.value;

  const confirmPassword =
    document.getElementById('registerConfirmPassword')?.value;

  if (!name || !phone || !email || !password) {
    showAuthMessage('Please fill in all fields.');
    return;
  }

  if (password.length < 8) {
    showAuthMessage(
      'Password must be at least 8 characters.'
    );
    return;
  }

  if (password !== confirmPassword) {
    showAuthMessage(
      'Passwords do not match.'
    );
    return;
  }

  const button =
    event.submitter;

  if (button) {
    button.disabled = true;
    button.textContent = 'Creating Account...';
  }

  try {

    const data = await customerApi(
      '/api/customer/register',
      {
        method: 'POST',

        body: JSON.stringify({
          name,
          phone,
          email,
          password,
          confirmPassword
        })
      }
    );

    saveCustomerSession(data);

    showAuthMessage(
      'Account created successfully.',
      'success'
    );

    updateCustomerAccountButton();

    setTimeout(() => {

      closeCustomerAuth();

      if (typeof toast === 'function') {
        toast('Account created successfully.');
      }

    }, 700);

  } catch (error) {

    showAuthMessage(
      error.message || 'Registration failed.'
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = 'Create Account';
    }

  }
}

/* =========================================================
   LOGIN
   ========================================================= */

async function customerLogin(event) {

  event.preventDefault();

  clearAuthMessage();

  const identifier =
    document.getElementById('loginIdentifier')?.value.trim();

  const password =
    document.getElementById('loginPassword')?.value;

  if (!identifier || !password) {
    showAuthMessage(
      'Please enter your login information.'
    );
    return;
  }

  const button =
    event.submitter;

  if (button) {
    button.disabled = true;
    button.textContent = 'Logging in...';
  }

  try {

    const data = await customerApi(
      '/api/customer/login',
      {
        method: 'POST',

        body: JSON.stringify({
          identifier,
          password
        })
      }
    );

    saveCustomerSession(data);

    updateCustomerAccountButton();

    showAuthMessage(
      'Login successful.',
      'success'
    );

    setTimeout(() => {

      closeCustomerAuth();

      if (typeof toast === 'function') {
        toast('Welcome back!');
      }

    }, 500);

  } catch (error) {

    showAuthMessage(
      error.message || 'Login failed.'
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = 'Login';
    }

  }
}

/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

async function requestPasswordReset(event) {

  event.preventDefault();

  clearAuthMessage();

  const email =
    document.getElementById('forgotEmail')?.value.trim();

  if (!email) {
    showAuthMessage('Please enter your email.');
    return;
  }

  const button =
    event.submitter;

  if (button) {
    button.disabled = true;
    button.textContent = 'Sending...';
  }

  try {

    await customerApi(
      '/api/customer/forgot-password',
      {
        method: 'POST',

        body: JSON.stringify({
          email
        })
      }
    );

    showAuthMessage(
      'If an account exists for this email, a reset code has been sent.',
      'success'
    );

    setTimeout(() => {
      showResetPassword(email);
    }, 800);

  } catch (error) {

    showAuthMessage(
      error.message || 'Unable to send reset code.'
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = 'Send Reset Code';
    }

  }
}

/* =========================================================
   RESET PASSWORD
   ========================================================= */

async function resetCustomerPassword(event) {

  event.preventDefault();

  clearAuthMessage();

  const email =
    document.getElementById('resetEmail')?.value.trim();

  const code =
    document.getElementById('resetCode')?.value.trim();

  const password =
    document.getElementById('resetPassword')?.value;

  const confirmPassword =
    document.getElementById('resetConfirmPassword')?.value;

  if (!email || !code || !password) {
    showAuthMessage(
      'Please complete all fields.'
    );
    return;
  }

  if (!/^\d{6}$/.test(code)) {
    showAuthMessage(
      'Reset code must be 6 digits.'
    );
    return;
  }

  if (password.length < 8) {
    showAuthMessage(
      'Password must be at least 8 characters.'
    );
    return;
  }

  if (password !== confirmPassword) {
    showAuthMessage(
      'Passwords do not match.'
    );
    return;
  }

  const button =
    event.submitter;

  if (button) {
    button.disabled = true;
    button.textContent = 'Resetting...';
  }

  try {

    await customerApi(
      '/api/customer/reset-password',
      {
        method: 'POST',

        body: JSON.stringify({
          email,
          code,
          password,
          confirmPassword
        })
      }
    );

    showAuthMessage(
      'Password reset successfully. You can now login.',
      'success'
    );

    setTimeout(() => {
      showLogin();
    }, 900);

  } catch (error) {

    showAuthMessage(
      error.message || 'Password reset failed.'
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = 'Reset Password';
    }

  }
}

/* =========================================================
   MY ORDERS
   ========================================================= */

async function showCustomerOrders() {

  const box =
    document.getElementById('customerOrders');

  if (!box) return;

  box.classList.remove('hidden');

  box.innerHTML = `
    <div class="customer-order-loading">
      Loading your orders...
    </div>
  `;

  try {

    const data =
      await customerApi('/api/customer/orders');

    const orders =
      Array.isArray(data.orders)
        ? data.orders
        : [];

    if (!orders.length) {

      box.innerHTML = `
        <div class="customer-order-empty">
          You have no orders yet.
        </div>
      `;

      return;
    }

    box.innerHTML =
      orders.map(order => {

        const items =
          Array.isArray(order.items)
            ? order.items
            : [];

        const itemText =
          items
            .map(item =>
              `${escapeCustomerHtml(item.name || 'Item')} × ${item.qty || 1}`
            )
            .join('<br>');

        return `
          <div class="customer-order-card">

            <div class="customer-order-top">

              <strong>
                ${escapeCustomerHtml(order.id || '')}
              </strong>

              <span>
                ${escapeCustomerHtml(order.status || 'Pending')}
              </span>

            </div>

            <div class="customer-order-items">
              ${itemText}
            </div>

            <div class="customer-order-total">
              Total:
              <b>
                ৳${Number(order.total || 0).toFixed(0)}
              </b>
            </div>

          </div>
        `;

      }).join('');

  } catch (error) {

    if (
      error.message &&
      /token|login|auth|unauthorized/i.test(error.message)
    ) {

      clearCustomerSession();

      updateCustomerAccountButton();

      box.innerHTML = `
        <div class="customer-order-empty">
          Please login again to view your orders.
        </div>
      `;

      return;
    }

    box.innerHTML = `
      <div class="customer-auth-message error">
        ${escapeCustomerHtml(
          error.message || 'Unable to load orders.'
        )}
      </div>
    `;
  }
}

/* =========================================================
   LOGOUT
   ========================================================= */

function customerLogout() {

  clearCustomerSession();

  updateCustomerAccountButton();

  closeCustomerAuth();

  if (typeof toast === 'function') {
    toast('You have been logged out.');
  }
}

/* =========================================================
   SESSION CHECK
   ========================================================= */

async function restoreCustomerSession() {

  const token = getCustomerToken();

  if (!token) {
    updateCustomerAccountButton();
    return;
  }

  try {

    const data =
      await customerApi('/api/customer/me');

    if (data.customer) {

      localStorage.setItem(
        CUSTOMER_DATA_KEY,
        JSON.stringify(data.customer)
      );

    }

  } catch {

    clearCustomerSession();

  }

  updateCustomerAccountButton();
}

/* =========================================================
   CHECKOUT LOGIN HELPER
   ========================================================= */

function requireCustomerLogin() {

  if (isCustomerLoggedIn()) {
    return true;
  }

  openCustomerAccount();

  showLogin();

  showAuthMessage(
    'Please login or create an account before placing an order.'
  );

  return false;
}

/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeCustomerHtml(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}

/* =========================================================
   BASIC STYLES
   ========================================================= */

function addCustomerAuthStyles() {

  if (document.getElementById('customerAuthStyles')) {
    return;
  }

  const style =
    document.createElement('style');

  style.id = 'customerAuthStyles';

  style.textContent = `

    .customer-auth-card {
      max-width: 520px;
    }

    .customer-auth-card label {
      display: block;
      margin-bottom: 14px;
    }

    .customer-auth-card input {
      width: 100%;
      box-sizing: border-box;
      margin-top: 6px;
    }

    .auth-links {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 14px;
      flex-wrap: wrap;
    }

    .text-button {
      border: 0;
      background: transparent;
      cursor: pointer;
      padding: 4px 0;
      text-decoration: underline;
      font: inherit;
    }

    .auth-description {
      line-height: 1.6;
      opacity: .85;
      margin-bottom: 18px;
    }

    .customer-auth-message {
      padding: 12px 14px;
      border-radius: 10px;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .customer-auth-message.error {
      background: rgba(180, 30, 30, .12);
    }

    .customer-auth-message.success {
      background: rgba(30, 150, 80, .12);
    }

    .customer-profile {
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 16px;
      background: rgba(255,255,255,.05);
    }

    .customer-profile h3 {
      margin-top: 0;
      margin-bottom: 8px;
    }

    .customer-profile p {
      margin: 5px 0;
      opacity: .8;
    }

    .customer-account-button {
      white-space: nowrap;
      margin-left: 10px;
    }

    .customer-orders {
      margin-top: 18px;
    }

    .customer-order-card {
      padding: 14px;
      border-radius: 12px;
      margin-bottom: 10px;
      background: rgba(255,255,255,.05);
    }

    .customer-order-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
    }

    .customer-order-items {
      line-height: 1.6;
      opacity: .85;
    }

    .customer-order-total {
      margin-top: 10px;
    }

    .customer-order-loading,
    .customer-order-empty {
      padding: 14px;
      text-align: center;
      opacity: .75;
    }

  `;

  document.head.appendChild(style);
}

/* =========================================================
   START AUTH SYSTEM
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  createCustomerAuthUI();

  createCustomerAccountButton();

  restoreCustomerSession();

});
