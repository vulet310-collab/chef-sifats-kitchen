(function () {

  'use strict';


  const TOKEN_KEY = 'csk_customer_token';
  const DATA_KEY = 'csk_customer_data';



  function getToken() {

    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }

  }



  function getData() {

    try {

      const raw =
        localStorage.getItem(DATA_KEY);

      return raw
        ? JSON.parse(raw)
        : null;

    } catch {

      return null;

    }

  }



  function saveSession(token, data) {

    try {

      localStorage.setItem(
        TOKEN_KEY,
        token || ''
      );


      localStorage.setItem(
        DATA_KEY,
        JSON.stringify(data || {})
      );

    } catch {}

  }



  function clearSession() {

    try {

      localStorage.removeItem(TOKEN_KEY);

      localStorage.removeItem(DATA_KEY);

    } catch {}

  }



  function loggedIn() {

    return !!getToken();

  }



  function esc(value) {

    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }



  function ensureModal() {

    let modal =
      document.getElementById(
        'authModal'
      );

    if (modal) return modal;


    modal =
      document.createElement('div');

    modal.id = 'authModal';

    modal.innerHTML = `

      <div
        class="box"
        style="
          max-width:460px;
          width:calc(100% - 30px);
          margin:50px auto;
          padding:25px;
          background:#fff;
          color:#111;
          border-radius:16px;
          position:relative;
        "
      >

        <button
          type="button"
          id="authClose"
          style="
            position:absolute;
            right:15px;
            top:10px;
            border:0;
            background:none;
            font-size:28px;
            cursor:pointer;
          "
        >
          ×
        </button>


        <div id="authContent"></div>

      </div>

    `;

    modal.style.cssText = `
      position:fixed;
      inset:0;
      z-index:99999;
      background:rgba(0,0,0,.75);
      overflow:auto;
      padding:20px;
    `;


    document.body.appendChild(modal);


    document
      .getElementById('authClose')
      .onclick = closeAuthModal;


    modal.addEventListener(
      'click',
      function (e) {

        if (e.target === modal) {
          closeAuthModal();
        }

      }
    );


    return modal;

  }



  function openAuthModal(mode = 'login') {

    const modal =
      ensureModal();

    modal.style.display = 'block';

    modal.dataset.mode = mode;

    renderAuth(mode);

  }



  function closeAuthModal() {

    const modal =
      document.getElementById(
        'authModal'
      );

    if (modal) {
      modal.style.display = 'none';
    }

  }



  function renderAuth(mode) {

    const box =
      document.getElementById(
        'authContent'
      );

    if (!box) return;


    if (mode === 'register') {

      box.innerHTML = `

        <h2>Create Account</h2>

        <p>
          Register before placing your order.
        </p>


        <input
          id="regName"
          type="text"
          placeholder="Full Name *"
          style="width:100%;padding:12px;margin:6px 0"
        >


        <input
          id="regMobile"
          type="tel"
          placeholder="Mobile Number *"
          style="width:100%;padding:12px;margin:6px 0"
        >


        <input
          id="regEmail"
          type="email"
          placeholder="Email *"
          style="width:100%;padding:12px;margin:6px 0"
        >


        <input
          id="regPassword"
          type="password"
          placeholder="Password *"
          style="width:100%;padding:12px;margin:6px 0"
        >


        <button
          type="button"
          class="btn full"
          onclick="customerRegister()"
          style="width:100%;margin-top:10px"
        >
          Register
        </button>


        <p id="authMessage"></p>


        <button
          type="button"
          onclick="openAuthModal('login')"
          style="border:0;background:none;cursor:pointer"
        >
          Already have an account? Login
        </button>

      `;

      return;

    }



    if (mode === 'forgot') {

      box.innerHTML = `

        <h2>Forgot Password</h2>

        <p>
          Enter your registered email.
        </p>


        <input
          id="forgotEmail"
          type="email"
          placeholder="Email"
          style="width:100%;padding:12px;margin:6px 0"
        >


        <button
          type="button"
          class="btn full"
          onclick="sendForgotCode()"
          style="width:100%;margin-top:10px"
        >
          Send 6-Digit Code
        </button>


        <p id="authMessage"></p>


        <button
          type="button"
          onclick="openAuthModal('login')"
          style="border:0;background:none;cursor:pointer"
        >
          Back to Login
        </button>

      `;

      return;

    }



    if (mode === 'reset') {

      box.innerHTML = `

        <h2>Reset Password</h2>


        <input
          id="resetEmail"
          type="email"
          placeholder="Email"
          style="width:100%;padding:12px;margin:6px 0"
        >


        <input
          id="resetCode"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="6-digit code"
          style="width:100%;padding:12px;margin:6px 0"
        >


        <input
          id="resetPassword"
          type="password"
          placeholder="New password"
          style="width:100%;padding:12px;margin:6px 0"
        >


        <button
          type="button"
          class="btn full"
          onclick="resetCustomerPassword()"
          style="width:100%;margin-top:10px"
        >
          Reset Password
        </button>


        <p id="authMessage"></p>

      `;

      return;

    }



    if (mode === 'orders') {

      renderMyOrders();

      return;

    }



    if (loggedIn()) {

      const data = getData() || {};

      box.innerHTML = `

        <h2>
          👤 ${esc(data.name || 'My Account')}
        </h2>


        <p>
          ${esc(data.email || '')}
        </p>


        <p>
          ${esc(data.mobile || data.phone || '')}
        </p>


        <button
          type="button"
          class="btn full"
          onclick="openAuthModal('orders')"
          style="width:100%;margin-top:10px"
        >
          📦 My Orders
        </button>


        <button
          type="button"
          onclick="customerLogout()"
          style="
            width:100%;
            margin-top:10px;
            padding:12px;
            cursor:pointer;
          "
        >
          Logout
        </button>

      `;

      return;

    }



    box.innerHTML = `

      <h2>Customer Login</h2>

      <p>
        Login to place your order.
      </p>


      <input
        id="loginEmail"
        type="email"
        placeholder="Email"
        autocomplete="email"
        style="width:100%;padding:12px;margin:6px 0"
      >


      <input
        id="loginPassword"
        type="password"
        placeholder="Password"
        autocomplete="current-password"
        style="width:100%;padding:12px;margin:6px 0"
      >


      <button
        type="button"
        class="btn full"
        onclick="customerLogin()"
        style="width:100%;margin-top:10px"
      >
        Login
      </button>


      <p id="authMessage"></p>


      <button
        type="button"
        onclick="openAuthModal('register')"
        style="border:0;background:none;cursor:pointer"
      >
        Create new account
      </button>


      <br>


      <button
        type="button"
        onclick="openAuthModal('forgot')"
        style="border:0;background:none;cursor:pointer"
      >
        Forgot Password?
      </button>

    `;

  }



  async function customerLogin() {

    const email =
      document
        .getElementById('loginEmail')
        ?.value
        .trim();

    const password =
      document
        .getElementById('loginPassword')
        ?.value;


    if (!email || !password) {

      showAuthMessage(
        'Email and password required.'
      );

      return;

    }


    try {

      const response =
        await fetch(
          '/api/customer/login',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              email,
              password
            })
          }
        );


      const data =
        await response.json();


      if (!response.ok || !data.ok) {

        throw new Error(
          data.message ||
          'Login failed.'
        );

      }


      saveSession(
        data.token,
        data.customer ||
        data.user ||
        {}
      );


      updateAccountButton();

      closeAuthModal();


      if (
        window.location.hash === '#checkout'
      ) {
        window.location.hash = '';
      }


      alert('Login successful.');

    } catch (error) {

      showAuthMessage(
        error.message ||
        'Login failed.'
      );

    }

  }



  async function customerRegister() {

    const name =
      document
        .getElementById('regName')
        ?.value
        .trim();

    const mobile =
      document
        .getElementById('regMobile')
        ?.value
        .trim();

    const email =
      document
        .getElementById('regEmail')
        ?.value
        .trim();

    const password =
      document
        .getElementById('regPassword')
        ?.value;


    if (
      !name ||
      !mobile ||
      !email ||
      !password
    ) {

      showAuthMessage(
        'Please fill all required fields.'
      );

      return;

    }


    try {

      const response =
        await fetch(
          '/api/customer/register',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              name,
              mobile,
              phone: mobile,
              email,
              password
            })
          }
        );


      const data =
        await response.json();


      if (!response.ok || !data.ok) {

        throw new Error(
          data.message ||
          'Registration failed.'
        );

      }


      if (data.token) {

        saveSession(
          data.token,
          data.customer ||
          data.user ||
          {}
        );

        updateAccountButton();

        closeAuthModal();

        alert('Registration successful.');

      } else {

        openAuthModal('login');

        showAuthMessage(
          'Registration successful. Please login.'
        );

      }

    } catch (error) {

      showAuthMessage(
        error.message ||
        'Registration failed.'
      );

    }

  }



  async function sendForgotCode() {

    const email =
      document
        .getElementById('forgotEmail')
        ?.value
        .trim();


    if (!email) {

      showAuthMessage(
        'Enter your email.'
      );

      return;

    }


    try {

      const response =
        await fetch(
          '/api/customer/forgot-password',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              email
            })
          }
        );


      const data =
        await response.json();


      if (!response.ok || !data.ok) {

        throw new Error(
          data.message ||
          'Could not send reset code.'
        );

      }


      openAuthModal('reset');

      document
        .getElementById('resetEmail')
        .value = email;


      showAuthMessage(
        'Check your email for the 6-digit code.'
      );

    } catch (error) {

      showAuthMessage(
        error.message
      );

    }

  }



  async function resetCustomerPassword() {

    const email =
      document
        .getElementById('resetEmail')
        ?.value
        .trim();

    const code =
      document
        .getElementById('resetCode')
        ?.value
        .trim();

    const password =
      document
        .getElementById('resetPassword')
        ?.value;


    if (
      !email ||
      !code ||
      !password
    ) {

      showAuthMessage(
        'All fields are required.'
      );

      return;

    }


    try {

      const response =
        await fetch(
          '/api/customer/reset-password',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              email,
              code,
              token: code,
              password
            })
          }
        );


      const data =
        await response.json();


      if (!response.ok || !data.ok) {

        throw new Error(
          data.message ||
          'Password reset failed.'
        );

      }


      openAuthModal('login');

      showAuthMessage(
        'Password reset successful. Login now.'
      );

    } catch (error) {

      showAuthMessage(
        error.message
      );

    }

  }



  async function renderMyOrders() {

    const box =
      document.getElementById(
        'authContent'
      );

    if (!box) return;


    box.innerHTML = `
      <h2>📦 My Orders</h2>
      <p>Loading orders...</p>
    `;


    const token =
      getToken();


    if (!token) {

      openAuthModal('login');

      return;

    }


    try {

      const response =
        await fetch(
          '/api/customer/orders',
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );


      const data =
        await response.json();


      if (
        response.status === 401
      ) {

        clearSession();

        updateAccountButton();

        openAuthModal('login');

        return;

      }


      if (!response.ok || !data.ok) {

        throw new Error(
          data.message ||
          'Could not load orders.'
        );

      }


      const orders =
        data.orders ||
        data.items ||
        [];


      if (!orders.length) {

        box.innerHTML = `

          <h2>📦 My Orders</h2>

          <p>
            You have no orders yet.
          </p>

          <button
            type="button"
            onclick="closeAuthModal()"
          >
            Continue Shopping
          </button>

        `;

        return;

      }


      box.innerHTML = `

        <h2>📦 My Orders</h2>

        <div id="customerOrdersList"></div>

      `;


      const list =
        document.getElementById(
          'customerOrdersList'
        );


      orders.forEach(function (order) {

        const div =
          document.createElement('div');


        div.style.cssText = `
          border:1px solid #ddd;
          padding:14px;
          margin:10px 0;
          border-radius:12px;
        `;


        const items =
          order.items ||
          [];


        const itemText =
          items.map(function (item) {

            return `${esc(
              item.name
            )} × ${Number(
              item.qty || 1
            )}`;

          }).join('<br>');


        div.innerHTML = `

          <strong>
            Order #${esc(
              order.id ||
              order.orderId ||
              ''
            )}
          </strong>

          <br>

          Status:
          <strong>
            ${esc(
              order.status ||
              'Pending'
            )}
          </strong>

          <br><br>

          ${itemText}

          <br><br>

          Total:
          <strong>
            ৳${Number(
              order.total ||
              order.grandTotal ||
              0
            ).toFixed(0)}
          </strong>

        `;


        list.appendChild(div);

      });


    } catch (error) {

      box.innerHTML = `

        <h2>📦 My Orders</h2>

        <p>
          ${esc(
            error.message ||
            'Could not load orders.'
          )}
        </p>

      `;

    }

  }



  function customerLogout() {

    clearSession();

    updateAccountButton();

    closeAuthModal();

    alert('Logged out.');

  }



  function updateAccountButton() {

    const button =
      document.getElementById(
        'customerAccountBtn'
      );


    if (!button) return;


    if (loggedIn()) {

      const data =
        getData() || {};


      button.textContent =
        `👤 ${data.name || 'Account'}`;

    } else {

      button.textContent =
        '👤 Login';

    }

  }



  function showAuthMessage(message) {

    const box =
      document.getElementById(
        'authMessage'
      );


    if (box) {

      box.textContent =
        message;

      box.style.color =
        '#c00';

    }

  }



  window.getCustomerToken =
    getToken;

  window.getCustomerData =
    getData;

  window.isCustomerLoggedIn =
    loggedIn;

  window.openAuthModal =
    openAuthModal;

  window.closeAuthModal =
    closeAuthModal;

  window.customerLogin =
    customerLogin;

  window.customerRegister =
    customerRegister;

  window.customerLogout =
    customerLogout;

  window.sendForgotCode =
    sendForgotCode;

  window.resetCustomerPassword =
    resetCustomerPassword;

  window.renderMyOrders =
    renderMyOrders;


  document.addEventListener(
    'DOMContentLoaded',
    updateAccountButton
  );

})();
