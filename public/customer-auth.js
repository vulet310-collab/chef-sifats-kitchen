/* =========================================================
   CHEF SIFAT'S KITCHEN
   CUSTOMER AUTH SYSTEM
   ---------------------------------------------------------
   Features:
   - Register
   - Login
   - Logout
   - Current customer session
   - Forgot password
   - Reset password
   - My Orders
   - Login required for checkout/order
   - No duplicate auth globals
========================================================= */

(() => {
  'use strict';

  /* =======================================================
     STORAGE KEYS
  ======================================================= */

  const TOKEN_KEY = 'csk_customer_token';
  const DATA_KEY = 'csk_customer_data';


  /* =======================================================
     BASIC HELPERS
  ======================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function getData() {
    try {
      const raw = localStorage.getItem(DATA_KEY);

      if (!raw) return null;

      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveSession(token, data) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }

      if (data) {
        localStorage.setItem(
          DATA_KEY,
          JSON.stringify(data)
        );
      }
    } catch (e) {
      console.error('Could not save customer session:', e);
    }

    updateAccountButton();
  }

  function clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(DATA_KEY);
    } catch (e) {
      console.error('Could not clear customer session:', e);
    }

    updateAccountButton();
  }


  /* =======================================================
     API HELPER
  ======================================================= */

  async function api(url, options = {}) {

    const opts = {
      ...options,
      headers: {
        ...(options.headers || {})
      }
    };

    const token = getToken();

    if (token) {
      opts.headers.Authorization =
        `Bearer ${token}`;
    }

    if (
      opts.body &&
      typeof opts.body !== 'string'
    ) {
      opts.headers['Content-Type'] =
        'application/json';

      opts.body = JSON.stringify(opts.body);
    }

    const response =
      await fetch(url, opts);

    let data = null;

    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }

    if (!response.ok) {

      const message =
        data?.message ||
        data?.error ||
        `Request failed (${response.status})`;

      const error =
        new Error(message);

      error.status =
        response.status;

      error.data = data;

      throw error;
    }

    return data;
  }


  /* =======================================================
     AUTH MODAL
  ======================================================= */

  function openAuthModal(mode = 'login') {

    const modal =
      $('authModal');

    if (!modal) {
      alert(
        'Customer login system is not available. Please refresh the page.'
      );

      return;
    }

    modal.style.display = 'flex';

    modal.setAttribute(
      'aria-hidden',
      'false'
    );

    if (mode === 'register') {
      showRegisterForm();
    } else {
      showLoginForm();
    }

    const loginPhone =
      $('loginPhone');

    if (loginPhone) {
      setTimeout(() => {
        loginPhone.focus();
      }, 100);
    }
  }


  function closeAuthModal() {

    const modal =
      $('authModal');

    if (!modal) return;

    modal.style.display = 'none';

    modal.setAttribute(
      'aria-hidden',
      'true'
    );

    clearAuthMessage();
  }


  /* =======================================================
     LOGIN FORM
  ======================================================= */

  function showLoginForm() {

    const login =
      $('loginForm');

    const register =
      $('registerForm');

    const account =
      $('customerAccountPanel');

    const title =
      $('authTitle');

    if (login) {
      login.style.display = 'block';
    }

    if (register) {
      register.style.display = 'none';
    }

    if (account) {
      account.style.display = 'none';
    }

    if (title) {
      title.textContent = 'Login';
    }

    clearAuthMessage();
  }


  /* =======================================================
     REGISTER FORM
  ======================================================= */

  function showRegisterForm() {

    const login =
      $('loginForm');

    const register =
      $('registerForm');

    const account =
      $('customerAccountPanel');

    const title =
      $('authTitle');

    if (login) {
      login.style.display = 'none';
    }

    if (register) {
      register.style.display = 'block';
    }

    if (account) {
      account.style.display = 'none';
    }

    if (title) {
      title.textContent =
        'Create Account';
    }

    clearAuthMessage();
  }


  /* =======================================================
     AUTH MESSAGE
  ======================================================= */

  function authMessage(message, type = '') {

    const box =
      $('authMessage');

    if (!box) return;

    box.textContent =
      String(message || '');

    box.className =
      type
        ? `auth-message ${type}`
        : 'auth-message';
  }


  function clearAuthMessage() {

    const box =
      $('authMessage');

    if (!box) return;

    box.textContent = '';

    box.className =
      'auth-message';
  }


  /* =======================================================
     REGISTER
  ======================================================= */

  async function customerRegister(event) {

    if (event) {
      event.preventDefault();
    }

    const name =
      $('registerName')?.value.trim();

    const phone =
      $('registerPhone')?.value.trim();

    const email =
      $('registerEmail')?.value.trim();

    const password =
      $('registerPassword')?.value || '';

    if (!name) {
      authMessage(
        'Please enter your name.',
        'error'
      );

      return false;
    }

    if (!phone) {
      authMessage(
        'Please enter your mobile number.',
        'error'
      );

      return false;
    }

    if (!email) {
      authMessage(
        'Please enter your email address.',
        'error'
      );

      return false;
    }

    if (password.length < 6) {
      authMessage(
        'Password must be at least 6 characters.',
        'error'
      );

      return false;
    }

    authMessage(
      'Creating your account...'
    );

    try {

      const data =
        await api(
          '/api/customer/register',
          {
            method: 'POST',

            body: {
              name,
              phone,
              email,
              password
            }
          }
        );


      if (
        data?.token ||
        data?.customer ||
        data?.user
      ) {

        const token =
          data.token || '';

        const customer =
          data.customer ||
          data.user ||
          null;

        if (token) {
          saveSession(
            token,
            customer
          );
        }

        authMessage(
          'Registration successful. You are now logged in.',
          'success'
        );

        updateAccountButton();

        setTimeout(() => {
          closeAuthModal();
        }, 800);

        return false;
      }


      authMessage(
        data?.message ||
        'Registration successful. Please login.',
        'success'
      );

      setTimeout(() => {
        showLoginForm();

        const lp =
          $('loginPhone');

        if (lp) {
          lp.value = phone;
        }
      }, 800);

    } catch (error) {

      console.error(
        'Registration error:',
        error
      );

      authMessage(
        error.message ||
        'Registration failed. Please try again.',
        'error'
      );
    }

    return false;
  }


  /* =======================================================
     LOGIN
  ======================================================= */

  async function customerLogin(event) {

    if (event) {
      event.preventDefault();
    }

    const phone =
      $('loginPhone')?.value.trim();

    const password =
      $('loginPassword')?.value || '';

    if (!phone) {

      authMessage(
        'Please enter your mobile number.',
        'error'
      );

      return false;
    }

    if (!password) {

      authMessage(
        'Please enter your password.',
        'error'
      );

      return false;
    }

    authMessage(
      'Logging in...'
    );

    try {

      const data =
        await api(
          '/api/customer/login',
          {
            method: 'POST',

            body: {
              phone,
              password
            }
          }
        );


      const token =
        data?.token || '';

      const customer =
        data?.customer ||
        data?.user ||
        data?.data ||
        null;


      if (!token) {

        throw new Error(
          data?.message ||
          'Login failed. No login token received.'
        );
      }


      saveSession(
        token,
        customer
      );


      authMessage(
        'Login successful.',
        'success'
      );


      updateAccountButton();


      /* Fill checkout information if available */
      fillCustomerInformation();


      setTimeout(() => {
        closeAuthModal();
      }, 700);


    } catch (error) {

      console.error(
        'Login error:',
        error
      );

      authMessage(
        error.message ||
        'Login failed. Please check your mobile number and password.',
        'error'
      );
    }

    return false;
  }


  /* =======================================================
     LOGOUT
  ======================================================= */

  function customerLogout() {

    clearSession();

    closeAuthModal();

    alert(
      'You have been logged out.'
    );

    updateAccountButton();
  }


  /* =======================================================
     CUSTOMER PROFILE
  ======================================================= */

  async function loadCustomerProfile() {

    const token =
      getToken();

    if (!token) {
      return null;
    }

    try {

      const data =
        await api(
          '/api/customer/me',
          {
            method: 'GET'
          }
        );


      const customer =
        data?.customer ||
        data?.user ||
        data?.data ||
        data;


      if (customer) {

        try {
          localStorage.setItem(
            DATA_KEY,
            JSON.stringify(customer)
          );
        } catch (e) {}

      }

      updateAccountButton();

      return customer;

    } catch (error) {

      console.warn(
        'Customer session check failed:',
        error
      );

      /*
        401/403 means token is no longer valid.
      */

      if (
        error.status === 401 ||
        error.status === 403
      ) {
        clearSession();
      }

      return null;
    }
  }


  /* =======================================================
     ACCOUNT BUTTON
  ======================================================= */

  function updateAccountButton() {

    const button =
      $('customerAccountBtn');

    if (!button) return;

    const token =
      getToken();

    const customer =
      getData();


    if (token) {

      const name =
        customer?.name ||
        customer?.fullName ||
        'Account';

      button.innerHTML =
        `👤 ${escapeHtml(name)}`;

      button.title =
        'Open My Account';

      return;
    }


    button.textContent =
      '👤 Login';

    button.title =
      'Login / Register';
  }


  /* =======================================================
     ACCOUNT CLICK
  ======================================================= */

  function handleAccountClick() {

    if (getToken()) {
      showAccountPanel();
    } else {
      openAuthModal('login');
    }
  }


  /* =======================================================
     SHOW ACCOUNT
  ======================================================= */

  function showAccountPanel() {

    const modal =
      $('authModal');

    if (!modal) return;

    modal.style.display =
      'flex';

    modal.setAttribute(
      'aria-hidden',
      'false'
    );


    const login =
      $('loginForm');

    const register =
      $('registerForm');

    const account =
      $('customerAccountPanel');

    const title =
      $('authTitle');


    if (login) {
      login.style.display =
        'none';
    }

    if (register) {
      register.style.display =
        'none';
    }

    if (account) {
      account.style.display =
        'block';
    }

    if (title) {
      title.textContent =
        'My Account';
    }


    const customer =
      getData();


    const nameBox =
      $('customerAccountName');

    const phoneBox =
      $('customerAccountPhone');


    if (nameBox) {

      nameBox.textContent =
        customer?.name ||
        customer?.fullName ||
        'Customer';
    }


    if (phoneBox) {

      phoneBox.textContent =
        customer?.phone ||
        customer?.mobile ||
        '';
    }

    clearAuthMessage();
  }


  /* =======================================================
     FILL CHECKOUT CUSTOMER DATA
  ======================================================= */

  function fillCustomerInformation() {

    const customer =
      getData();

    if (!customer) return;


    const name =
      $('name');

    const phone =
      $('phone');


    if (
      name &&
      !name.value
    ) {
      name.value =
        customer.name ||
        customer.fullName ||
        '';
    }


    if (
      phone &&
      !phone.value
    ) {
      phone.value =
        customer.phone ||
        customer.mobile ||
        '';
    }
  }


  /* =======================================================
     LOGIN REQUIRED
  ======================================================= */

  function requireCustomerLogin() {

    if (getToken()) {
      return true;
    }

    openAuthModal('login');

    authMessage(
      'Please login before checkout or placing an order.',
      'error'
    );

    return false;
  }


  /* =======================================================
     FORGOT PASSWORD
  ======================================================= */

  function showForgotPassword() {

    const title =
      $('authTitle');

    const login =
      $('loginForm');

    const register =
      $('registerForm');

    const account =
      $('customerAccountPanel');


    if (login) {
      login.style.display =
        'none';
    }

    if (register) {
      register.style.display =
        'none';
    }

    if (account) {
      account.style.display =
        'none';
    }

    if (title) {
      title.textContent =
        'Forgot Password';
    }


    const box =
      $('authMessage');

    if (!box) return;


    box.innerHTML = `
      <div class="forgot-box">

        <p>
          Enter your registered email address.
        </p>

        <input
          id="forgotEmail"
          type="email"
          placeholder="Email Address"
          autocomplete="email"
        >

        <button
          type="button"
          class="btn full"
          onclick="sendForgotCode()"
        >
          Send 6-Digit Code
        </button>

        <div id="forgotResult"></div>

      </div>
    `;
  }


  /* =======================================================
     SEND FORGOT CODE
  ======================================================= */

  async function sendForgotCode() {

    const email =
      $('forgotEmail')?.value.trim();

    const result =
      $('forgotResult');


    if (!email) {

      if (result) {
        result.textContent =
          'Please enter your email address.';
      }

      return;
    }


    if (result) {
      result.textContent =
        'Sending verification code...';
    }


    try {

      const data =
        await api(
          '/api/customer/forgot-password',
          {
            method: 'POST',

            body: {
              email
            }
          }
        );


      if (result) {

        result.innerHTML = `
          <p>
            ${escapeHtml(
              data?.message ||
              'A verification code has been sent to your email.'
            )}
          </p>

          <input
            id="resetCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="6-Digit Code"
          >

          <input
            id="newPassword"
            type="password"
            placeholder="New Password"
            autocomplete="new-password"
          >

          <button
            type="button"
            class="btn full"
            onclick="resetCustomerPassword()"
          >
            Reset Password
          </button>

          <div id="resetResult"></div>
        `;
      }

    } catch (error) {

      console.error(
        'Forgot password error:',
        error
      );

      if (result) {
        result.textContent =
          error.message ||
          'Could not send verification code.';
      }
    }
  }


  /* =======================================================
     RESET PASSWORD
  ======================================================= */

  async function resetCustomerPassword() {

    const email =
      $('forgotEmail')?.value.trim();

    const code =
      $('resetCode')?.value.trim();

    const password =
      $('newPassword')?.value || '';

    const result =
      $('resetResult');


    if (!email) {

      if (result) {
        result.textContent =
          'Email is required.';
      }

      return;
    }


    if (!/^\d{6}$/.test(code)) {

      if (result) {
        result.textContent =
          'Please enter the 6-digit verification code.';
      }

      return;
    }


    if (password.length < 6) {

      if (result) {
        result.textContent =
          'New password must be at least 6 characters.';
      }

      return;
    }


    if (result) {
      result.textContent =
        'Resetting password...';
    }


    try {

      const data =
        await api(
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


      if (result) {

        result.textContent =
          data?.message ||
          'Password reset successful.';
      }


      setTimeout(() => {

        showLoginForm();

        const phone =
          $('loginPhone');

        if (phone) {
          phone.value = '';
        }

        const pass =
          $('loginPassword');

        if (pass) {
          pass.value = '';
        }

      }, 1200);


    } catch (error) {

      console.error(
        'Reset password error:',
        error
      );

      if (result) {
        result.textContent =
          error.message ||
          'Password reset failed.';
      }
    }
  }


  /* =======================================================
     MY ORDERS
  ======================================================= */

  async function openMyOrders() {

    if (!requireCustomerLogin()) {
      return;
    }


    const modal =
      $('ordersModal');

    const list =
      $('myOrdersList');


    if (!modal || !list) {

      alert(
        'My Orders section is not available.'
      );

      return;
    }


    modal.style.display =
      'flex';


    list.innerHTML =
      '<p>Loading your orders...</p>';


    try {

      const data =
        await api(
          '/api/customer/orders',
          {
            method: 'GET'
          }
        );


      const orders =
        Array.isArray(data)
          ? data
          : (
              data?.orders ||
              data?.items ||
              []
            );


      renderMyOrders(orders);


    } catch (error) {

      console.error(
        'My orders error:',
        error
      );


      if (
        error.status === 401 ||
        error.status === 403
      ) {

        clearSession();

        closeMyOrders();

        openAuthModal('login');

        authMessage(
          'Your session expired. Please login again.',
          'error'
        );

        return;
      }


      list.innerHTML = `
        <p>
          ${escapeHtml(
            error.message ||
            'Could not load your orders.'
          )}
        </p>
      `;
    }
  }


  /* =======================================================
     CLOSE MY ORDERS
  ======================================================= */

  function closeMyOrders() {

    const modal =
      $('ordersModal');

    if (!modal) return;

    modal.style.display =
      'none';
  }


  /* =======================================================
     RENDER MY ORDERS
  ======================================================= */

  function renderMyOrders(orders) {

    const list =
      $('myOrdersList');

    if (!list) return;


    if (!orders.length) {

      list.innerHTML = `
        <div class="empty-orders">
          <p>📦 You have no orders yet.</p>

          <button
            type="button"
            class="btn"
            onclick="closeMyOrders();closeAuthModal();"
          >
            Browse Menu
          </button>
        </div>
      `;

      return;
    }


    list.innerHTML =
      orders.map(
        order => renderSingleOrder(order)
      ).join('');
  }


  /* =======================================================
     SINGLE ORDER
  ======================================================= */

  function renderSingleOrder(order) {

    const id =
      order?.orderNumber ||
      order?.orderId ||
      order?.id ||
      'Order';


    const status =
      order?.status ||
      'Pending';


    const total =
      Number(
        order?.total ??
        order?.grandTotal ??
        0
      );


    const created =
      order?.createdAt ||
      order?.date ||
      order?.created ||
      '';


    const items =
      Array.isArray(order?.items)
        ? order.items
        : [];


    const itemHTML =
      items.map(item => {

        const name =
          item?.name ||
          'Food item';


        const qty =
          Number(
            item?.qty ??
            item?.quantity ??
            1
          );


        const choice =
          item?.choice ||
          item?.size ||
          '';


        return `
          <div class="order-item">
            <span>
              ${escapeHtml(name)}
              ${
                choice
                  ? ` — ${escapeHtml(choice)}`
                  : ''
              }
            </span>

            <b>
              ×${qty}
            </b>
          </div>
        `;

      }).join('');


    return `
      <article class="customer-order">

        <div class="order-head">

          <div>
            <b>
              ${escapeHtml(String(id))}
            </b>

            ${
              created
                ? `<small>${escapeHtml(formatDate(created))}</small>`
                : ''
            }
          </div>

          <strong>
            ${escapeHtml(String(status))}
          </strong>

        </div>


        <div class="order-items">
          ${itemHTML}
        </div>


        <div class="order-total">

          <span>
            Total
          </span>

          <b>
            ৳${total.toFixed(0)}
          </b>

        </div>

      </article>
    `;
  }


  /* =======================================================
     DATE FORMAT
  ======================================================= */

  function formatDate(value) {

    try {

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return String(value);
      }


      return date.toLocaleString(
        'en-BD',
        {
          dateStyle: 'medium',
          timeStyle: 'short'
        }
      );

    } catch (e) {

      return String(value);
    }
  }


  /* =======================================================
     ESCAPE HTML
  ======================================================= */

  function escapeHtml(value) {

    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }


  /* =======================================================
     MODAL CLICK OUTSIDE
  ======================================================= */

  document.addEventListener(
    'click',
    event => {

      const auth =
        $('authModal');

      const orders =
        $('ordersModal');


      if (
        auth &&
        auth.style.display !== 'none' &&
        event.target === auth
      ) {
        closeAuthModal();
      }


      if (
        orders &&
        orders.style.display !== 'none' &&
        event.target === orders
      ) {
        closeMyOrders();
      }

    }
  );


  /* =======================================================
     ESC KEY
  ======================================================= */

  document.addEventListener(
    'keydown',
    event => {

      if (event.key !== 'Escape') {
        return;
      }

      closeAuthModal();
      closeMyOrders();

    }
  );


  /* =======================================================
     INITIALIZATION
  ======================================================= */

  async function initCustomerAuth() {

    updateAccountButton();

    const token =
      getToken();


    if (!token) {
      return;
    }


    /*
      Try to load the latest customer profile.
      If backend rejects the token, session is cleared.
    */

    await loadCustomerProfile();

    updateAccountButton();

    fillCustomerInformation();
  }


  /* =======================================================
     PUBLIC API
     
     IMPORTANT:
     We intentionally DO NOT create:
       window.customerToken
       window.customerData
       window.customerLoggedIn
       
     This prevents conflict with app.js.
  ======================================================= */

  window.getCustomerToken =
    getToken;

  window.getCustomerData =
    getData;

  window.isCustomerLoggedIn =
    () => Boolean(getToken());

  window.requireCustomerLogin =
    requireCustomerLogin;

  window.openAuthModal =
    openAuthModal;

  window.closeAuthModal =
    closeAuthModal;

  window.showLoginForm =
    showLoginForm;

  window.showRegisterForm =
    showRegisterForm;

  window.customerLogin =
    customerLogin;

  window.customerRegister =
    customerRegister;

  window.customerLogout =
    customerLogout;

  window.showForgotPassword =
    showForgotPassword;

  window.sendForgotCode =
    sendForgotCode;

  window.resetCustomerPassword =
    resetCustomerPassword;

  window.openMyOrders =
    openMyOrders;

  window.closeMyOrders =
    closeMyOrders;

  window.handleAccountClick =
    handleAccountClick;

  window.updateCustomerAccountButton =
    updateAccountButton;


  /* =======================================================
     START
  ======================================================= */

  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initCustomerAuth
    );

  } else {

    initCustomerAuth();

  }

})();
