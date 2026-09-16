/* =========================================================
   CHEF SIFAT'S KITCHEN — CUSTOMER AUTH
   Clean Navbar + Login/Register + Account
   ========================================================= */

const CUSTOMER_TOKEN_KEY = 'csk_customer_token';
const CUSTOMER_DATA_KEY = 'csk_customer_data';

function getCustomerToken() {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY) || '';
}

function getCustomerData() {
  try {
    return JSON.parse(
      localStorage.getItem(CUSTOMER_DATA_KEY) || 'null'
    );
  } catch {
    return null;
  }
}

function isCustomerLoggedIn() {
  return !!getCustomerToken();
}

function saveCustomerSession(token, customer) {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  localStorage.setItem(
    CUSTOMER_DATA_KEY,
    JSON.stringify(customer || {})
  );

  updateCustomerNavbar();
}

function clearCustomerSession() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_DATA_KEY);

  updateCustomerNavbar();
}


/* =========================================================
   API
   ========================================================= */

async function customerAPI(url, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  const token = getCustomerToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (
    options.body &&
    typeof options.body !== 'string'
  ) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
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
   MOBILE NAV
   ========================================================= */

function toggleMobileMenu() {
  const nav = document.getElementById('mainNav');

  if (!nav) return;

  nav.classList.toggle('mobile-open');
}


/* Close mobile menu after clicking a link */

document.addEventListener('click', function (event) {
  const link = event.target.closest(
    '#mainNav a'
  );

  if (!link) return;

  const nav =
    document.getElementById('mainNav');

  if (nav) {
    nav.classList.remove('mobile-open');
  }
});


/* =========================================================
   NAVBAR ACCOUNT BUTTON
   ========================================================= */

function updateCustomerNavbar() {
  const button =
    document.getElementById(
      'customerAccountBtn'
    );

  if (!button) return;

  if (isCustomerLoggedIn()) {
    const customer = getCustomerData();

    const name =
      customer?.name ||
      customer?.fullName ||
      'My Account';

    button.innerHTML =
      `👤 ${escapeHTML(name)}`;

    button.onclick = function () {
      openAccountMenu();
    };

    button.classList.add('logged-in');

  } else {

    button.innerHTML = '👤 Login';

    button.onclick = function () {
      openAuthModal('login');
    };

    button.classList.remove('logged-in');
  }
}


/* =========================================================
   ACCOUNT MENU
   ========================================================= */

function openAccountMenu() {
  closeAccountMenu();

  const customer = getCustomerData();

  const name =
    customer?.name ||
    customer?.fullName ||
    'Customer';

  const email =
    customer?.email || '';

  const menu =
    document.createElement('div');

  menu.id = 'customerAccountMenu';

  menu.innerHTML = `
    <div class="account-menu-inner">

      <div class="account-menu-user">
        <strong>👤 ${escapeHTML(name)}</strong>
        ${
          email
            ? `<small>${escapeHTML(email)}</small>`
            : ''
        }
      </div>

      <button onclick="showMyOrders()">
        📦 My Orders
      </button>

      <button onclick="showCustomerProfile()">
        👤 My Profile
      </button>

      <button onclick="customerLogout()">
        🚪 Logout
      </button>

    </div>
  `;

  document.body.appendChild(menu);

  setTimeout(() => {
    document.addEventListener(
      'click',
      accountOutsideClick
    );
  }, 10);
}

function accountOutsideClick(event) {
  const menu =
    document.getElementById(
      'customerAccountMenu'
    );

  const button =
    document.getElementById(
      'customerAccountBtn'
    );

  if (
    menu &&
    !menu.contains(event.target) &&
    event.target !== button
  ) {
    closeAccountMenu();
  }
}

function closeAccountMenu() {
  const menu =
    document.getElementById(
      'customerAccountMenu'
    );

  if (menu) {
    menu.remove();
  }

  document.removeEventListener(
    'click',
    accountOutsideClick
  );
}


/* =========================================================
   AUTH MODAL
   ========================================================= */

function createAuthModal() {
  if (
    document.getElementById(
      'customerAuthModal'
    )
  ) {
    return;
  }

  const modal =
    document.createElement('div');

  modal.id = 'customerAuthModal';

  modal.innerHTML = `
    <div class="customer-auth-overlay">

      <div class="customer-auth-box">

        <button
          class="customer-auth-close"
          onclick="closeAuthModal()"
          type="button"
        >
          ×
        </button>

        <div id="authContent"></div>

      </div>

    </div>
  `;

  document.body.appendChild(modal);
}

function openAuthModal(mode = 'login') {
  closeAccountMenu();
  createAuthModal();

  const modal =
    document.getElementById(
      'customerAuthModal'
    );

  modal.classList.add('show');

  if (mode === 'register') {
    showRegister();
  } else {
    showLogin();
  }
}

function closeAuthModal() {
  const modal =
    document.getElementById(
      'customerAuthModal'
    );

  if (modal) {
    modal.classList.remove('show');
  }
}


/* =========================================================
   LOGIN
   ========================================================= */

function showLogin() {
  const box =
    document.getElementById(
      'authContent'
    );

  if (!box) return;

  box.innerHTML = `
    <div class="auth-heading">
      <small>CUSTOMER ACCOUNT</small>
      <h2>Welcome Back</h2>
      <p>Login to continue your order.</p>
    </div>

    <form id="customerLoginForm">

      <input
        id="loginEmail"
        type="email"
        placeholder="Email *"
        required
      >

      <input
        id="loginPassword"
        type="password"
        placeholder="Password *"
        required
      >

      <button
        class="btn full"
        type="submit"
      >
        Login
      </button>

    </form>

    <div class="auth-links">
      <button
        type="button"
        onclick="showForgotPassword()"
      >
        Forgot Password?
      </button>

      <button
        type="button"
        onclick="showRegister()"
      >
        Create Account
      </button>
    </div>

    <div id="authMessage"></div>
  `;

  document
    .getElementById('customerLoginForm')
    .addEventListener(
      'submit',
      handleCustomerLogin
    );
}

async function handleCustomerLogin(event) {
  event.preventDefault();

  const email =
    document.getElementById(
      'loginEmail'
    ).value.trim();

  const password =
    document.getElementById(
      'loginPassword'
    ).value;

  const message =
    document.getElementById(
      'authMessage'
    );

  try {

    message.innerHTML =
      'Logging in...';

    const result =
      await customerAPI(
        '/api/customer/login',
        {
          method: 'POST',
          body: {
            email,
            password
          }
        }
      );

    saveCustomerSession(
      result.token,
      result.customer
    );

    message.innerHTML =
      '<span class="success">Login successful.</span>';

    setTimeout(() => {
      closeAuthModal();
    }, 500);

  } catch (error) {

    message.innerHTML =
      `<span class="error">${escapeHTML(
        error.message
      )}</span>`;
  }
}


/* =========================================================
   REGISTER
   ========================================================= */

function showRegister() {
  const box =
    document.getElementById(
      'authContent'
    );

  if (!box) return;

  box.innerHTML = `
    <div class="auth-heading">
      <small>CUSTOMER ACCOUNT</small>
      <h2>Create Account</h2>
      <p>Register before placing your order.</p>
    </div>

    <form id="customerRegisterForm">

      <input
        id="registerName"
        type="text"
        placeholder="Full Name *"
        required
      >

      <input
        id="registerMobile"
        type="tel"
        placeholder="Mobile Number *"
        required
      >

      <input
        id="registerEmail"
        type="email"
        placeholder="Email *"
        required
      >

      <input
        id="registerPassword"
        type="password"
        placeholder="Password *"
        minlength="6"
        required
      >

      <button
        class="btn full"
        type="submit"
      >
        Register
      </button>

    </form>

    <div class="auth-links">
      <button
        type="button"
        onclick="showLogin()"
      >
        Already have an account? Login
      </button>
    </div>

    <div id="authMessage"></div>
  `;

  document
    .getElementById(
      'customerRegisterForm'
    )
    .addEventListener(
      'submit',
      handleCustomerRegister
    );
}

async function handleCustomerRegister(event) {
  event.preventDefault();

  const name =
    document.getElementById(
      'registerName'
    ).value.trim();

  const mobile =
    document.getElementById(
      'registerMobile'
    ).value.trim();

  const email =
    document.getElementById(
      'registerEmail'
    ).value.trim();

  const password =
    document.getElementById(
      'registerPassword'
    ).value;

  const message =
    document.getElementById(
      'authMessage'
    );

  try {

    message.innerHTML =
      'Creating account...';

    const result =
      await customerAPI(
        '/api/customer/register',
        {
          method: 'POST',
          body: {
            name,
            mobile,
            email,
            password
          }
        }
      );

    saveCustomerSession(
      result.token,
      result.customer
    );

    message.innerHTML =
      '<span class="success">Account created successfully.</span>';

    setTimeout(() => {
      closeAuthModal();
    }, 600);

  } catch (error) {

    message.innerHTML =
      `<span class="error">${escapeHTML(
        error.message
      )}</span>`;
  }
}


/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

function showForgotPassword() {
  const box =
    document.getElementById(
      'authContent'
    );

  if (!box) return;

  box.innerHTML = `
    <div class="auth-heading">
      <small>ACCOUNT RECOVERY</small>
      <h2>Forgot Password?</h2>
      <p>Enter your registered email.</p>
    </div>

    <form id="forgotPasswordForm">

      <input
        id="forgotEmail"
        type="email"
        placeholder="Email *"
        required
      >

      <button
        class="btn full"
        type="submit"
      >
        Send Reset Code
      </button>

    </form>

    <div class="auth-links">
      <button
        type="button"
        onclick="showLogin()"
      >
        Back to Login
      </button>
    </div>

    <div id="authMessage"></div>
  `;

  document
    .getElementById(
      'forgotPasswordForm'
    )
    .addEventListener(
      'submit',
      handleForgotPassword
    );
}

async function handleForgotPassword(event) {
  event.preventDefault();

  const email =
    document.getElementById(
      'forgotEmail'
    ).value.trim();

  const message =
    document.getElementById(
      'authMessage'
    );

  try {

    message.innerHTML =
      'Sending reset code...';

    await customerAPI(
      '/api/customer/forgot-password',
      {
        method: 'POST',
        body: { email }
      }
    );

    message.innerHTML =
      '<span class="success">Reset code sent to your email.</span>';

    setTimeout(() => {
      showResetPassword(email);
    }, 700);

  } catch (error) {

    message.innerHTML =
      `<span class="error">${escapeHTML(
        error.message
      )}</span>`;
  }
}


/* =========================================================
   RESET PASSWORD
   ========================================================= */

function showResetPassword(email = '') {
  const box =
    document.getElementById(
      'authContent'
    );

  if (!box) return;

  box.innerHTML = `
    <div class="auth-heading">
      <small>ACCOUNT RECOVERY</small>
      <h2>Reset Password</h2>
      <p>Enter the 6-digit code sent to your email.</p>
    </div>

    <form id="resetPasswordForm">

      <input
        id="resetEmail"
        type="email"
        value="${escapeHTML(email)}"
        placeholder="Email *"
        required
      >

      <input
        id="resetCode"
        type="text"
        inputmode="numeric"
        maxlength="6"
        placeholder="6-digit code *"
        required
      >

      <input
        id="resetPassword"
        type="password"
        minlength="6"
        placeholder="New Password *"
        required
      >

      <button
        class="btn full"
        type="submit"
      >
        Reset Password
      </button>

    </form>

    <div class="auth-links">
      <button
        type="button"
        onclick="showLogin()"
      >
        Back to Login
      </button>
    </div>

    <div id="authMessage"></div>
  `;

  document
    .getElementById(
      'resetPasswordForm'
    )
    .addEventListener(
      'submit',
      handleResetPassword
    );
}

async function handleResetPassword(event) {
  event.preventDefault();

  const email =
    document.getElementById(
      'resetEmail'
    ).value.trim();

  const code =
    document.getElementById(
      'resetCode'
    ).value.trim();

  const password =
    document.getElementById(
      'resetPassword'
    ).value;

  const message =
    document.getElementById(
      'authMessage'
    );

  try {

    message.innerHTML =
      'Resetting password...';

    await customerAPI(
      '/api/customer/reset-password',
      {
        method: 'POST',
        body: {
          email,
          code,
          password
        }
      }
    );

    message.innerHTML =
      '<span class="success">Password reset successful.</span>';

    setTimeout(() => {
      showLogin();
    }, 800);

  } catch (error) {

    message.innerHTML =
      `<span class="error">${escapeHTML(
        error.message
      )}</span>`;
  }
}


/* =========================================================
   REQUIRE LOGIN BEFORE CHECKOUT
   ========================================================= */

function requireCustomerLogin() {

  if (isCustomerLoggedIn()) {
    return true;
  }

  openAuthModal('login');

  const message =
    document.getElementById(
      'authMessage'
    );

  if (message) {
    message.innerHTML =
      '<span class="error">Please login before placing an order.</span>';
  }

  return false;
}


/* =========================================================
   MY ORDERS
   ========================================================= */

async function showMyOrders() {
  closeAccountMenu();

  if (!isCustomerLoggedIn()) {
    openAuthModal('login');
    return;
  }

  createAuthModal();

  const modal =
    document.getElementById(
      'customerAuthModal'
    );

  modal.classList.add('show');

  const box =
    document.getElementById(
      'authContent'
    );

  box.innerHTML = `
    <div class="auth-heading">
      <small>MY ACCOUNT</small>
      <h2>My Orders</h2>
    </div>

    <div id="myOrdersList">
      Loading orders...
    </div>
  `;

  try {

    const result =
      await customerAPI(
        '/api/customer/orders'
      );

    const orders =
      result.orders ||
      result ||
      [];

    if (!orders.length) {
      box.querySelector(
        '#myOrdersList'
      ).innerHTML =
        '<p>No orders found yet.</p>';

      return;
    }

    box.querySelector(
      '#myOrdersList'
    ).innerHTML =
      orders.map(order => `
        <div class="customer-order">
          <strong>
            Order #${escapeHTML(
              String(
                order.id ||
                order.orderId ||
                ''
              )
            )}
          </strong>

          <span>
            ${escapeHTML(
              order.status ||
              'Pending'
            )}
          </span>

          <p>
            Total:
            ৳${Number(
              order.total || 0
            ).toFixed(0)}
          </p>
        </div>
      `).join('');

  } catch (error) {

    box.querySelector(
      '#myOrdersList'
    ).innerHTML =
      `<p class="error">${escapeHTML(
        error.message
      )}</p>`;
  }
}


/* =========================================================
   PROFILE
   ========================================================= */

function showCustomerProfile() {
  closeAccountMenu();
  createAuthModal();

  const customer =
    getCustomerData() || {};

  const modal =
    document.getElementById(
      'customerAuthModal'
    );

  modal.classList.add('show');

  const box =
    document.getElementById(
      'authContent'
    );

  box.innerHTML = `
    <div class="auth-heading">
      <small>MY ACCOUNT</small>
      <h2>My Profile</h2>
    </div>

    <div class="profile-card">

      <p>
        <strong>Name</strong><br>
        ${escapeHTML(
          customer.name ||
          customer.fullName ||
          ''
        )}
      </p>

      <p>
        <strong>Mobile</strong><br>
        ${escapeHTML(
          customer.mobile ||
          customer.phone ||
          ''
        )}
      </p>

      <p>
        <strong>Email</strong><br>
        ${escapeHTML(
          customer.email ||
          ''
        )}
      </p>

    </div>

    <button
      class="btn full"
      onclick="closeAuthModal()"
    >
      Close
    </button>
  `;
}


/* =========================================================
   LOGOUT
   ========================================================= */

function customerLogout() {
  closeAccountMenu();
  clearCustomerSession();

  alert('You have been logged out.');
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


/* =========================================================
   AUTH STYLES
   ========================================================= */

(function addCustomerAuthStyles() {

  if (
    document.getElementById(
      'customerAuthStyles'
    )
  ) {
    return;
  }

  const style =
    document.createElement('style');

  style.id =
    'customerAuthStyles';

  style.textContent = `

    /* NAVBAR */

    .site-header {
      position: relative;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    .main-nav {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 24px;
      flex: 1;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 22px;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .nav-links a,
    .nav-cart,
    .nav-account {
      white-space: nowrap;
    }

    .nav-cart,
    .nav-account {
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 999px;
      padding: 10px 15px;
      cursor: pointer;
    }

    .nav-account.logged-in {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mobile-menu-btn {
      display: none;
      border: 0;
      background: transparent;
      font-size: 25px;
      cursor: pointer;
    }


    /* ACCOUNT DROPDOWN */

    #customerAccountMenu {
      position: fixed;
      top: 76px;
      right: 24px;
      z-index: 3000;
      width: 250px;
    }

    .account-menu-inner {
      padding: 12px;
      border-radius: 16px;
      background: #111;
      border: 1px solid rgba(255,255,255,.15);
      box-shadow: 0 15px 45px rgba(0,0,0,.35);
    }

    .account-menu-user {
      padding: 10px 12px 14px;
      border-bottom: 1px solid rgba(255,255,255,.1);
      margin-bottom: 8px;
    }

    .account-menu-user strong,
    .account-menu-user small {
      display: block;
    }

    .account-menu-user small {
      margin-top: 4px;
      opacity: .65;
      word-break: break-word;
    }

    .account-menu-inner button {
      width: 100%;
      text-align: left;
      border: 0;
      background: transparent;
      color: inherit;
      padding: 11px 12px;
      border-radius: 10px;
      cursor: pointer;
    }

    .account-menu-inner button:hover {
      background: rgba(255,255,255,.08);
    }


    /* AUTH MODAL */

    #customerAuthModal {
      display: none;
    }

    #customerAuthModal.show {
      display: block;
    }

    .customer-auth-overlay {
      position: fixed;
      inset: 0;
      z-index: 4000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(0,0,0,.75);
    }

    .customer-auth-box {
      position: relative;
      width: min(430px, 100%);
      max-height: 90vh;
      overflow-y: auto;
      padding: 30px;
      border-radius: 20px;
      background: #111;
      box-shadow: 0 20px 70px rgba(0,0,0,.5);
    }

    .customer-auth-close {
      position: absolute;
      top: 12px;
      right: 15px;
      border: 0;
      background: transparent;
      color: inherit;
      font-size: 28px;
      cursor: pointer;
    }

    .auth-heading {
      margin-bottom: 20px;
    }

    .auth-heading h2 {
      margin: 5px 0;
    }

    .auth-heading p {
      opacity: .7;
      margin: 0;
    }

    #customerAuthModal input {
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 12px;
    }

    .auth-links {
      display: flex;
      flex-direction: column;
      gap: 7px;
      margin-top: 14px;
    }

    .auth-links button {
      border: 0;
      background: transparent;
      color: inherit;
      opacity: .75;
      cursor: pointer;
    }

    .success {
      display: block;
      margin-top: 12px;
      font-weight: 600;
    }

    .error {
      display: block;
      margin-top: 12px;
      font-weight: 600;
    }

    .customer-order,
    .profile-card {
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.1);
    }

    .customer-order {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }


    /* MOBILE */

    @media (max-width: 850px) {

      .site-header {
        gap: 12px;
      }

      .main-nav {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        flex-direction: column;
        align-items: stretch;
        gap: 14px;
        padding: 18px;
        background: #111;
        border-top: 1px solid rgba(255,255,255,.1);
        box-shadow: 0 15px 30px rgba(0,0,0,.25);
      }

      .main-nav.mobile-open {
        display: flex;
      }

      .nav-links {
        flex-direction: column;
        align-items: stretch;
        gap: 0;
      }

      .nav-links a {
        display: block;
        padding: 12px;
        border-radius: 10px;
      }

      .nav-links a:hover {
        background: rgba(255,255,255,.08);
      }

      .nav-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .nav-cart,
      .nav-account {
        width: 100%;
      }

      .mobile-menu-btn {
        display: block;
      }

      #customerAccountMenu {
        top: 70px;
        right: 15px;
        left: 15px;
        width: auto;
      }

      .customer-auth-box {
        padding: 24px 20px;
      }
    }

  `;

  document.head.appendChild(style);

})();


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  function () {

    updateCustomerNavbar();

  }
);
