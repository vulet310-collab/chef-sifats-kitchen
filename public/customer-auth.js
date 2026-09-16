/* =========================================================
   CHEF SIFAT'S KITCHEN
   CUSTOMER AUTH SYSTEM — FINAL VERSION
   ========================================================= */

const CUSTOMER_TOKEN_KEY = 'csk_customer_token';
const CUSTOMER_DATA_KEY = 'csk_customer_data';


/* =========================================================
   CUSTOMER SESSION
   ========================================================= */

function getCustomerToken() {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY) || '';
}


function getCustomerData() {
  try {
    return JSON.parse(
      localStorage.getItem(CUSTOMER_DATA_KEY) || 'null'
    );
  } catch (_) {
    return null;
  }
}


function isCustomerLoggedIn() {
  return !!getCustomerToken();
}


function saveCustomerSession(token, customer) {

  if (token) {
    localStorage.setItem(
      CUSTOMER_TOKEN_KEY,
      token
    );
  }

  localStorage.setItem(
    CUSTOMER_DATA_KEY,
    JSON.stringify(customer || {})
  );

  updateCustomerNavbar();
}


function clearCustomerSession() {

  localStorage.removeItem(
    CUSTOMER_TOKEN_KEY
  );

  localStorage.removeItem(
    CUSTOMER_DATA_KEY
  );

  updateCustomerNavbar();
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
   CUSTOMER API
   ========================================================= */

async function customerAPI(
  url,
  options = {}
) {

  const headers = {
    ...(options.headers || {})
  };

  const token = getCustomerToken();

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  if (
    options.body &&
    typeof options.body !== 'string'
  ) {

    headers['Content-Type'] =
      'application/json';

    options = {
      ...options,
      body: JSON.stringify(options.body)
    };

  }

  const response =
    await fetch(url, {
      ...options,
      headers
    });

  let data = {};

  try {
    data = await response.json();
  } catch (_) {
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
   MOBILE NAVIGATION
   ========================================================= */

function toggleMobileMenu() {

  const nav =
    document.getElementById(
      'mainNav'
    );

  if (!nav) return;

  nav.classList.toggle(
    'mobile-open'
  );

}


/* Close mobile menu after link click */

document.addEventListener(
  'click',
  function (event) {

    const link =
      event.target.closest(
        '#mainNav a'
      );

    if (!link) return;

    const nav =
      document.getElementById(
        'mainNav'
      );

    if (nav) {
      nav.classList.remove(
        'mobile-open'
      );
    }

  }
);


/* =========================================================
   NAVBAR ACCOUNT BUTTON
   ========================================================= */

function updateCustomerNavbar() {

  const button =
    document.getElementById(
      'customerAccountBtn'
    );

  if (!button) return;


  /* LOGGED IN */

  if (isCustomerLoggedIn()) {

    const customer =
      getCustomerData() || {};

    const name =
      customer.name ||
      customer.fullName ||
      'My Account';

    button.innerHTML =
      `👤 ${escapeHTML(name)}`;

    button.onclick =
      function () {
        openAccountMenu();
      };

    button.classList.add(
      'logged-in'
    );

  }


  /* LOGGED OUT */

  else {

    button.innerHTML =
      '👤 Login';

    button.onclick =
      function () {
        openAuthModal('login');
      };

    button.classList.remove(
      'logged-in'
    );

  }

}


/* =========================================================
   ACCOUNT DROPDOWN
   ========================================================= */

function openAccountMenu() {

  closeAccountMenu();

  const customer =
    getCustomerData() || {};

  const name =
    customer.name ||
    customer.fullName ||
    'Customer';

  const email =
    customer.email || '';

  const menu =
    document.createElement(
      'div'
    );

  menu.id =
    'customerAccountMenu';

  menu.innerHTML = `

    <div class="account-menu-inner">

      <div class="account-menu-user">

        <strong>
          👤 ${escapeHTML(name)}
        </strong>

        ${
          email
            ? `
              <small>
                ${escapeHTML(email)}
              </small>
            `
            : ''
        }

      </div>


      <button
        type="button"
        onclick="showMyOrders()"
      >
        📦 My Orders
      </button>


      <button
        type="button"
        onclick="showCustomerProfile()"
      >
        👤 My Profile
      </button>


      <button
        type="button"
        onclick="customerLogout()"
      >
        🚪 Logout
      </button>

    </div>

  `;

  document.body.appendChild(menu);

  setTimeout(
    function () {

      document.addEventListener(
        'click',
        accountOutsideClick
      );

    },
    10
  );

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
    document.createElement(
      'div'
    );

  modal.id =
    'customerAuthModal';

  modal.innerHTML = `

    <div
      class="customer-auth-overlay"
      onclick="authOverlayClick(event)"
    >

      <div
        class="customer-auth-box"
        onclick="event.stopPropagation()"
      >

        <button
          class="customer-auth-close"
          type="button"
          aria-label="Close"
          onclick="closeAuthModal()"
        >
          ×
        </button>


        <div id="authContent"></div>

      </div>

    </div>

  `;

  document.body.appendChild(modal);

}


function authOverlayClick(event) {

  if (
    event.target.classList.contains(
      'customer-auth-overlay'
    )
  ) {

    closeAuthModal();

  }

}


function openAuthModal(
  mode = 'login'
) {

  closeAccountMenu();

  createAuthModal();

  const modal =
    document.getElementById(
      'customerAuthModal'
    );

  if (!modal) return;

  modal.classList.add(
    'show'
  );

  document.body.classList.add(
    'auth-open'
  );


  if (mode === 'register') {

    showRegister();

  }

  else if (mode === 'forgot') {

    showForgotPassword();

  }

  else if (mode === 'reset') {

    showResetPassword();

  }

  else {

    showLogin();

  }

}


function closeAuthModal() {

  const modal =
    document.getElementById(
      'customerAuthModal'
    );

  if (modal) {

    modal.classList.remove(
      'show'
    );

  }

  document.body.classList.remove(
    'auth-open'
  );

}


/* =========================================================
   LOGIN
   ========================================================= */

function showLogin() {

  createAuthModal();

  const modal =
    document.getElementById(
      'customerAuthModal'
    );

  if (modal) {
    modal.classList.add(
      'show'
    );
  }

  const box =
    document.getElementById(
      'authContent'
    );

  if (!box) return;


  box.innerHTML = `

    <div class="auth-heading">

      <small>
        CUSTOMER ACCOUNT
      </small>

      <h2>
        Welcome Back
      </h2>

      <p>
        Login to continue your order.
      </p>

    </div>


    <form
      id="customerLoginForm"
    >

      <input
        id="loginEmail"
        type="email"
        placeholder="Email *"
        autocomplete="email"
        required
      >


      <input
        id="loginPassword"
        type="password"
        placeholder="Password *"
        autocomplete="current-password"
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


  const form =
    document.getElementById(
      'customerLoginForm'
    );

  if (form) {

    form.addEventListener(
      'submit',
      handleCustomerLogin
    );

  }

}


async function handleCustomerLogin(
  event
) {

  event.preventDefault();

  const email =
    document.getElementById(
      'loginEmail'
    )?.value.trim() || '';

  const password =
    document.getElementById(
      'loginPassword'
    )?.value || '';

  const message =
    document.getElementById(
      'authMessage'
    );

  if (!email || !password) {
    return;
  }


  try {

    if (message) {
      message.innerHTML =
        '<span>Logging in...</span>';
    }


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


    if (message) {

      message.innerHTML =
        `
        <span class="success">
          Login successful.
        </span>
        `;

    }


    setTimeout(
      function () {

        closeAuthModal();

      },
      500
    );


  }

  catch (error) {

    if (message) {

      message.innerHTML =
        `
        <span class="error">
          ${escapeHTML(
            error.message
          )}
        </span>
        `;

    }

  }

}


/* =========================================================
   REGISTER
   ========================================================= */

function showRegister() {

  createAuthModal();

  const modal =
    document.getElementById(
      'customerAuthModal'
    );

  if (modal) {
    modal.classList.add(
      'show'
    );
  }

  const box =
    document.getElementById(
      'authContent'
    );

  if (!box) return;


  box.innerHTML = `

    <div class="auth-heading">

      <small>
        CUSTOMER ACCOUNT
      </small>

      <h2>
        Create Account
      </h2>

      <p>
        Register before placing your order.
      </p>

    </div>


    <form
      id="customerRegisterForm"
    >

      <input
        id="registerName"
        type="text"
        placeholder="Full Name *"
        autocomplete="name"
        required
      >


      <input
        id="registerMobile"
        type="tel"
        placeholder="Mobile Number *"
        autocomplete="tel"
        required
      >


      <input
        id="registerEmail"
        type="email"
        placeholder="Email *"
        autocomplete="email"
        required
      >


      <input
        id="registerPassword"
        type="password"
        placeholder="Password *"
        minlength="6"
        autocomplete="new-password"
        required
      >


      <button
        class="btn full"
        type="submit"
      >
        Create Account
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


  const form =
    document.getElementById(
      'customerRegisterForm'
    );

  if (form) {

    form.addEventListener(
      'submit',
      handleCustomerRegister
    );

  }

}


async function handleCustomerRegister(
  event
) {

  event.preventDefault();


  const name =
    document.getElementById(
      'registerName'
    )?.value.trim() || '';

  const mobile =
    document.getElementById(
      'registerMobile'
    )?.value.trim() || '';

  const email =
    document.getElementById(
      'registerEmail'
    )?.value.trim() || '';

  const password =
    document.getElementById(
      'registerPassword'
    )?.value || '';


  const message =
    document.getElementById(
      'authMessage'
    );


  try {

    if (message) {

      message.innerHTML =
        '<span>Creating account...</span>';

    }


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


    if (message) {

      message.innerHTML =
        `
        <span class="success">
          Account created successfully.
        </span>
        `;

    }


    setTimeout(
      function () {

        closeAuthModal();

      },
      700
    );


  }

  catch (error) {

    if (message) {

      message.innerHTML =
        `
        <span class="error">
          ${escapeHTML(
            error.message
          )}
        </span>
        `;

    }

  }

}


/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

function showForgotPassword() {

  createAuthModal();

  const modal =
    document.getElementById(
      'customerAuthModal'
    );

  if (modal) {
    modal.classList.add(
      'show'
    );
  }

  const box =
    document.getElementById(
      'authContent'
    );

  if (!box) return;


  box.innerHTML = `

    <div class="auth-heading">

      <small>
        ACCOUNT RECOVERY
      </small>

      <h2>
        Forgot Password?
      </h2>

      <p>
        Enter your registered email.
      </p>

    </div>


    <form
      id="forgotPasswordForm"
    >

      <input
        id="forgotEmail"
        type="email"
        placeholder="Email *"
        autocomplete="email"
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
        ← Back to Login
      </button>

    </div>


    <div id="authMessage"></div>

  `;


  const form =
    document.getElementById(
      'forgotPasswordForm'
    );

  if (form) {

    form.addEventListener(
      'submit',
      handleForgotPassword
    );

  }

}


async function handleForgotPassword(
  event
) {

  event.preventDefault();


  const email =
    document.getElementById(
      'forgotEmail'
    )?.value.trim() || '';


  const message =
    document.getElementById(
      'authMessage'
    );


  try {

    if (message) {

      message.innerHTML =
        '<span>Sending reset code...</span>';

    }


    await customerAPI(
      '/api/customer/forgot-password',
      {
        method: 'POST',

        body: {
          email
        }
      }
    );


    if (message) {

      message.innerHTML =
        `
        <span class="success">
          Reset code sent to your email.
        </span>
        `;

    }


    setTimeout(
      function () {

        showResetPassword(
          email
        );

      },
      800
    );


  }

  catch (error) {

    if (message) {

      message.innerHTML =
        `
        <span class="error">
          ${escapeHTML(
            error.message
          )}
        </span>
        `;

    }

  }

}


/* =========================================================
   RESET PASSWORD
   ========================================================= */

function showResetPassword(
  email = ''
) {

  createAuthModal();

  const modal =
    document.getElementById(
      'customerAuthModal'
    );

  if (modal) {
    modal.classList.add(
      'show'
    );
  }

  const box =
    document.getElementById(
      'authContent'
    );

  if (!box) return;


  box.innerHTML = `

    <div class="auth-heading">

      <small>
        ACCOUNT RECOVERY
      </small>

      <h2>
        Reset Password
      </h2>

      <p>
        Enter the 6-digit code sent to your email.
      </p>

    </div>


    <form
      id="resetPasswordForm"
    >

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
        pattern="[0-9]{6}"
        placeholder="6-digit code *"
        required
      >


      <input
        id="resetPassword"
        type="password"
        minlength="6"
        placeholder="New Password *"
        autocomplete="new-password"
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
        ← Back to Login
      </button>

    </div>


    <div id="authMessage"></div>

  `;


  const form =
    document.getElementById(
      'resetPasswordForm'
    );

  if (form) {

    form.addEventListener(
      'submit',
      handleResetPassword
    );

  }

}


async function handleResetPassword(
  event
) {

  event.preventDefault();


  const email =
    document.getElementById(
      'resetEmail'
    )?.value.trim() || '';

  const code =
    document.getElementById(
      'resetCode'
    )?.value.trim() || '';

  const password =
    document.getElementById(
      'resetPassword'
    )?.value || '';


  const message =
    document.getElementById(
      'authMessage'
    );


  try {

    if (message) {

      message.innerHTML =
        '<span>Resetting password...</span>';

    }


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


    if (message) {

      message.innerHTML =
        `
        <span class="success">
          Password reset successful.
        </span>
        `;

    }


    setTimeout(
      function () {

        showLogin();

      },
      900
    );


  }

  catch (error) {

    if (message) {

      message.innerHTML =
        `
        <span class="error">
          ${escapeHTML(
            error.message
          )}
        </span>
        `;

    }

  }

}


/* =========================================================
   REQUIRE LOGIN BEFORE CHECKOUT
   ========================================================= */

function requireCustomerLogin() {

  if (isCustomerLoggedIn()) {
    return true;
  }


  openAuthModal(
    'login'
  );


  setTimeout(
    function () {

      const message =
        document.getElementById(
          'authMessage'
        );

      if (message) {

        message.innerHTML =
          `
          <span class="error">
            Please login before placing an order.
          </span>
          `;

      }

    },
    50
  );


  return false;
}


/* =========================================================
   MY ORDERS
   ========================================================= */

async function showMyOrders() {

  closeAccountMenu();


  if (!isCustomerLoggedIn()) {

    openAuthModal(
      'login'
    );

    return;

  }


  createAuthModal();


  const modal =
    document.getElementById(
      'customerAuthModal'
    );

  if (modal) {
    modal.classList.add(
      'show'
    );
  }


  const box =
    document.getElementById(
      'authContent'
    );

  if (!box) return;


  box.innerHTML = `

    <div class="auth-heading">

      <small>
        MY ACCOUNT
      </small>

      <h2>
        My Orders
      </h2>

    </div>


    <div id="myOrdersList">
      Loading orders...
    </div>


    <div class="auth-links">

      <button
        type="button"
        onclick="closeAuthModal()"
      >
        Close
      </button>

    </div>

  `;


  try {

    const result =
      await customerAPI(
        '/api/customer/orders'
      );


    const orders =
      Array.isArray(
        result.orders
      )
        ? result.orders
        : Array.isArray(result)
          ? result
          : [];


    const list =
      document.getElementById(
        'myOrdersList'
      );


    if (!list) return;


    if (!orders.length) {

      list.innerHTML =
        `
        <div class="empty-orders">
          <p>No orders found yet.</p>
        </div>
        `;

      return;

    }


    list.innerHTML =
      orders
        .map(
          function (order) {

            const orderId =
              order.id ||
              order.orderId ||
              '';

            const status =
              order.status ||
              'Pending';

            const total =
              Number(
                order.total || 0
              );


            return `

              <div class="customer-order">

                <strong>
                  Order #${escapeHTML(
                    String(orderId)
                  )}
                </strong>

                <span>
                  ${escapeHTML(
                    String(status)
                  )}
                </span>

                <p>
                  Total:
                  ৳${total.toFixed(0)}
                </p>

              </div>

            `;

          }
        )
        .join('');


  }

  catch (error) {

    const list =
      document.getElementById(
        'myOrdersList'
      );

    if (list) {

      list.innerHTML =
        `
        <p class="error">
          ${escapeHTML(
            error.message
          )}
        </p>
        `;

    }

  }

}


/* =========================================================
   CUSTOMER PROFILE
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

  if (modal) {
    modal.classList.add(
      'show'
    );
  }


  const box =
    document.getElementById(
      'authContent'
    );

  if (!box) return;


  box.innerHTML = `

    <div class="auth-heading">

      <small>
        MY ACCOUNT
      </small>

      <h2>
        My Profile
      </h2>

    </div>


    <div class="profile-card">

      <p>

        <strong>
          Name
        </strong>

        <br>

        ${escapeHTML(
          customer.name ||
          customer.fullName ||
          ''
        )}

      </p>


      <p>

        <strong>
          Mobile
        </strong>

        <br>

        ${escapeHTML(
          customer.mobile ||
          customer.phone ||
          ''
        )}

      </p>


      <p>

        <strong>
          Email
        </strong>

        <br>

        ${escapeHTML(
          customer.email ||
          ''
        )}

      </p>

    </div>


    <button
      class="btn full"
      type="button"
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

  alert(
    'You have been logged out.'
  );

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
    document.createElement(
      'style'
    );

  style.id =
    'customerAuthStyles';


  style.textContent = `

    /* =====================================================
       NAVBAR
       ===================================================== */

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

      border: 1px solid
        rgba(255,255,255,.15);

      border-radius: 999px;

      padding: 10px 15px;

      cursor: pointer;

    }


    .nav-account.logged-in {

      max-width: 170px;

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


    /* =====================================================
       ACCOUNT DROPDOWN
       ===================================================== */

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

      border: 1px solid
        rgba(255,255,255,.15);

      box-shadow:
        0 15px 45px
        rgba(0,0,0,.35);

    }


    .account-menu-user {

      padding:
        10px 12px 14px;

      border-bottom:
        1px solid
        rgba(255,255,255,.1);

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

      background:
        rgba(255,255,255,.08);

    }


    /* =====================================================
       AUTH MODAL
       ===================================================== */

    body.auth-open {

      overflow: hidden;

    }


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

      background:
        rgba(0,0,0,.78);

    }


    .customer-auth-box {

      position: relative;

      width: min(430px, 100%);

      max-height: 90vh;

      overflow-y: auto;

      padding: 30px;

      border-radius: 20px;

      background: #111;

      color: inherit;

      box-shadow:
        0 20px 70px
        rgba(0,0,0,.5);

    }


    /* =====================================================
       CLOSE BUTTON
       ===================================================== */

    .customer-auth-close {

      position: absolute;

      top: 10px;

      right: 12px;

      width: 40px;

      height: 40px;

      display: flex;

      align-items: center;
      justify-content: center;

      border: 0;

      border-radius: 50%;

      background: transparent;

      color: inherit;

      font-size: 30px;

      line-height: 1;

      cursor: pointer;

      z-index: 10;

    }


    .customer-auth-close:hover {

      background:
        rgba(255,255,255,.10);

    }


    /* =====================================================
       AUTH CONTENT
       ===================================================== */

    .auth-heading {

      margin-bottom: 20px;

      padding-right: 35px;

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

      padding: 7px;

    }


    .auth-links button:hover {

      opacity: 1;

      text-decoration: underline;

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


    /* =====================================================
       ORDERS / PROFILE
       ===================================================== */

    .customer-order,
    .profile-card {

      padding: 15px;

      margin-bottom: 10px;

      border-radius: 14px;

      border: 1px solid
        rgba(255,255,255,.1);

    }


    .customer-order {

      display: flex;

      flex-direction: column;

      gap: 5px;

    }


    .empty-orders {

      padding: 20px;

      text-align: center;

      opacity: .7;

    }


    /* =====================================================
       MOBILE
       ===================================================== */

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

        border-top:
          1px solid
          rgba(255,255,255,.1);

        box-shadow:
          0 15px 30px
          rgba(0,0,0,.25);

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

        background:
          rgba(255,255,255,.08);

      }


      .nav-actions {

        display: grid;

        grid-template-columns:
          1fr 1fr;

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


      .customer-auth-overlay {

        padding: 12px;

      }


      .customer-auth-box {

        padding:
          28px 20px 22px;

        max-height: 92vh;

      }

    }

  `;


  document.head.appendChild(
    style
  );

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


/* =========================================================
   GLOBAL FUNCTIONS
   app.js / index.html compatibility
   ========================================================= */

window.getCustomerToken =
  getCustomerToken;

window.getCustomerData =
  getCustomerData;

window.isCustomerLoggedIn =
  isCustomerLoggedIn;

window.saveCustomerSession =
  saveCustomerSession;

window.clearCustomerSession =
  clearCustomerSession;

window.openAuthModal =
  openAuthModal;

window.closeAuthModal =
  closeAuthModal;

window.showLogin =
  showLogin;

window.showRegister =
  showRegister;

window.showForgotPassword =
  showForgotPassword;

window.showResetPassword =
  showResetPassword;

window.showMyOrders =
  showMyOrders;

window.showCustomerProfile =
  showCustomerProfile;

window.customerLogout =
  customerLogout;

window.requireCustomerLogin =
  requireCustomerLogin;

window.updateCustomerNavbar =
  updateCustomerNavbar;

window.toggleMobileMenu =
  toggleMobileMenu;


/* =========================================================
   BACKWARD COMPATIBILITY
   Older app.js uses openCustomerAuth()
   ========================================================= */

window.openCustomerAuth =
  function (mode = 'login') {

    if (
      typeof window.openAuthModal ===
      'function'
    ) {

      window.openAuthModal(
        mode
      );

      return;

    }


    console.error(
      'Customer authentication system is not loaded.'
    );


    alert(
      'Login system is loading. Please refresh the page and try again.'
    );

  };


/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener(
  'keydown',
  function (event) {

    if (
      event.key !== 'Escape'
    ) {
      return;
    }


    const modal =
      document.getElementById(
        'customerAuthModal'
      );


    if (
      modal &&
      modal.classList.contains(
        'show'
      )
    ) {

      closeAuthModal();

    }


    closeAccountMenu();

  }
);
