/* =========================================================
   CHEF SIFAT'S KITCHEN
   CUSTOMER AUTHENTICATION
   Register / Login / Forgot Password / Reset Password
   My Orders / Logout
   ========================================================= */

const CUSTOMER_TOKEN_KEY = 'cskCustomerToken';
const CUSTOMER_DATA_KEY = 'cskCustomer';

let customerAuthAfterLogin = null;
let forgotPasswordEmail = '';

/* =========================================================
   SESSION
   ========================================================= */

function getCustomerToken(){
  return localStorage.getItem(CUSTOMER_TOKEN_KEY) || '';
}

function getCustomer(){
  try{
    return JSON.parse(
      localStorage.getItem(CUSTOMER_DATA_KEY) || 'null'
    );
  }catch{
    return null;
  }
}

function isCustomerLoggedIn(){
  return !!getCustomerToken();
}

function saveCustomerSession(token, customer){
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  localStorage.setItem(
    CUSTOMER_DATA_KEY,
    JSON.stringify(customer)
  );

  updateCustomerButton();

  if(
    typeof customerAuthAfterLogin === 'string' &&
    customerAuthAfterLogin === 'checkout'
  ){
    customerAuthAfterLogin = null;

    setTimeout(() => {
      if(typeof checkout === 'function'){
        checkout();
      }
    }, 100);
  }
}

function clearCustomerSession(){
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_DATA_KEY);

  updateCustomerButton();
}

/* =========================================================
   API HELPER
   ========================================================= */

async function customerApi(url, options = {}){
  const headers = {
    'Content-Type':'application/json',
    ...(options.headers || {})
  };

  const token = getCustomerToken();

  if(token){
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url,{
    ...options,
    headers
  });

  let data = {};

  try{
    data = await response.json();
  }catch{
    data = {};
  }

  if(
    response.status === 401 &&
    token
  ){
    clearCustomerSession();
  }

  if(!response.ok){
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

function createCustomerAuthUI(){

  if(document.getElementById('customerAuthModal')){
    return;
  }

  const style = document.createElement('style');

  style.textContent = `
    #customerAccountBtn{
      border:1px solid rgba(255,255,255,.16);
      background:#151515;
      color:#fff;
      padding:10px 14px;
      border-radius:10px;
      cursor:pointer;
      font-weight:800;
      margin-left:8px;
    }

    #customerAccountBtn:hover{
      background:#222;
    }

    .customer-auth-backdrop{
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.78);
      z-index:100000;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:18px;
      overflow:auto;
    }

    .customer-auth-backdrop.hidden{
      display:none;
    }

    .customer-auth-card{
      width:min(470px,100%);
      max-height:92vh;
      overflow:auto;
      background:#111;
      color:#fff;
      border:1px solid rgba(255,255,255,.13);
      border-radius:20px;
      padding:24px;
      box-shadow:0 25px 80px rgba(0,0,0,.65);
      position:relative;
    }

    .customer-auth-close{
      position:absolute;
      right:15px;
      top:12px;
      width:36px;
      height:36px;
      border:0;
      border-radius:50%;
      background:#222;
      color:#fff;
      font-size:22px;
      cursor:pointer;
    }

    .customer-auth-card h2{
      margin:5px 0 7px;
    }

    .customer-auth-card .auth-subtitle{
      color:#aaa;
      margin:0 0 18px;
      line-height:1.5;
    }

    .auth-tabs{
      display:flex;
      gap:8px;
      margin-bottom:18px;
    }

    .auth-tab{
      flex:1;
      padding:11px;
      border-radius:10px;
      border:1px solid rgba(255,255,255,.12);
      background:#181818;
      color:#aaa;
      cursor:pointer;
      font-weight:800;
    }

    .auth-tab.active{
      background:#e8a323;
      color:#111;
    }

    .auth-form label{
      display:block;
      margin:12px 0;
      font-weight:700;
    }

    .auth-form input{
      width:100%;
      margin-top:7px;
      padding:12px;
      border-radius:10px;
      border:1px solid rgba(255,255,255,.14);
      background:#181818;
      color:#fff;
      box-sizing:border-box;
    }

    .auth-submit{
      width:100%;
      margin-top:10px;
      padding:13px;
      border:0;
      border-radius:11px;
      background:#e8a323;
      color:#111;
      font-weight:900;
      cursor:pointer;
    }

    .auth-link{
      background:none;
      border:0;
      color:#e8a323;
      cursor:pointer;
      padding:8px 0;
      font-weight:800;
    }

    .auth-message{
      margin:12px 0;
      padding:10px 12px;
      border-radius:10px;
      background:#191919;
      color:#ddd;
      line-height:1.5;
    }

    .auth-message.error{
      border:1px solid #9b3030;
    }

    .auth-message.success{
      border:1px solid #287a45;
    }

    .customer-order-card{
      border:1px solid rgba(255,255,255,.1);
      background:#171717;
      padding:14px;
      border-radius:13px;
      margin:10px 0;
    }

    .customer-order-card .order-head{
      display:flex;
      justify-content:space-between;
      gap:10px;
      margin-bottom:8px;
    }

    .customer-order-card small{
      color:#aaa;
    }

    .customer-order-card .order-items{
      color:#ccc;
      line-height:1.5;
      margin:7px 0;
    }

    .auth-account-actions{
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin-top:15px;
    }

    .auth-secondary{
      flex:1;
      min-width:120px;
      padding:11px;
      border-radius:10px;
      border:1px solid rgba(255,255,255,.12);
      background:#1b1b1b;
      color:#fff;
      cursor:pointer;
      font-weight:800;
    }

    @media(max-width:600px){
      .customer-auth-card{
        padding:20px;
      }

      #customerAccountBtn{
        margin-left:0;
      }
    }
  `;

  document.head.appendChild(style);

  const modal = document.createElement('div');

  modal.id = 'customerAuthModal';

  modal.className =
    'customer-auth-backdrop hidden';

  modal.innerHTML = `
    <div class="customer-auth-card">

      <button
        class="customer-auth-close"
        type="button"
        onclick="closeCustomerAuth()"
      >×</button>

      <div id="customerAuthContent"></div>

    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click',event => {
    if(event.target === modal){
      closeCustomerAuth();
    }
  });
}

/* =========================================================
   ACCOUNT BUTTON
   ========================================================= */

function createCustomerAccountButton(){

  if(document.getElementById('customerAccountBtn')){
    return;
  }

  const nav =
    document.querySelector('.nav');

  if(!nav){
    return;
  }

  const button =
    document.createElement('button');

  button.id = 'customerAccountBtn';
  button.type = 'button';

  button.onclick =
    () => openCustomerAuth();

  nav.appendChild(button);
}

function updateCustomerButton(){

  const button =
    document.getElementById(
      'customerAccountBtn'
    );

  if(!button){
    return;
  }

  const customer = getCustomer();

  if(customer){
    button.textContent =
      `👤 ${customer.name || 'Account'}`;
  }else{
    button.textContent =
      '👤 Login';
  }
}

/* =========================================================
   OPEN / CLOSE
   ========================================================= */

function openCustomerAuth(
  mode = 'login',
  afterLogin = null
){

  createCustomerAuthUI();

  customerAuthAfterLogin =
    afterLogin;

  const modal =
    document.getElementById(
      'customerAuthModal'
    );

  modal.classList.remove('hidden');

  if(isCustomerLoggedIn()){
    showCustomerAccount();
  }else if(mode === 'register'){
    showRegisterForm();
  }else{
    showLoginForm();
  }
}

function closeCustomerAuth(){

  const modal =
    document.getElementById(
      'customerAuthModal'
    );

  if(modal){
    modal.classList.add('hidden');
  }
}

/* =========================================================
   LOGIN FORM
   ========================================================= */

function showLoginForm(message = ''){

  const box =
    document.getElementById(
      'customerAuthContent'
    );

  if(!box) return;

  box.innerHTML = `

    <span class="mini">CUSTOMER ACCOUNT</span>

    <h2>Welcome Back!</h2>

    <p class="auth-subtitle">
      Login to continue ordering from
      Chef Sifat's Kitchen.
    </p>

    <div class="auth-tabs">
      <button
        class="auth-tab active"
        type="button"
      >
        Login
      </button>

      <button
        class="auth-tab"
        type="button"
        onclick="showRegisterForm()"
      >
        Create Account
      </button>
    </div>

    ${
      message
        ? `<div class="auth-message">${escapeAuthHtml(message)}</div>`
        : ''
    }

    <form
      class="auth-form"
      onsubmit="customerLogin(event)"
    >

      <label>
        Phone or Email

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
          placeholder="Your password"
        >
      </label>

      <button
        class="auth-submit"
        type="submit"
      >
        Login
      </button>

    </form>

    <button
      class="auth-link"
      type="button"
      onclick="showForgotPasswordForm()"
    >
      Forgot Password?
    </button>

  `;
}

/* =========================================================
   REGISTER FORM
   ========================================================= */

function showRegisterForm(message = ''){

  const box =
    document.getElementById(
      'customerAuthContent'
    );

  if(!box) return;

  box.innerHTML = `

    <span class="mini">CUSTOMER ACCOUNT</span>

    <h2>Create Account</h2>

    <p class="auth-subtitle">
      Create your account before placing
      an order.
    </p>

    <div class="auth-tabs">

      <button
        class="auth-tab"
        type="button"
        onclick="showLoginForm()"
      >
        Login
      </button>

      <button
        class="auth-tab active"
        type="button"
      >
        Create Account
      </button>

    </div>

    ${
      message
        ? `<div class="auth-message error">${escapeAuthHtml(message)}</div>`
        : ''
    }

    <form
      class="auth-form"
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
          inputmode="numeric"
          autocomplete="tel"
          placeholder="01XXXXXXXXX"
        >
      </label>

      <label>
        Email
        <small style="color:#aaa">
          Required for password recovery
        </small>

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
        class="auth-submit"
        type="submit"
      >
        Create Account
      </button>

    </form>

  `;
}

/* =========================================================
   LOGIN
   ========================================================= */

async function customerLogin(event){

  event.preventDefault();

  const identifier =
    document
      .getElementById('loginIdentifier')
      .value
      .trim();

  const password =
    document
      .getElementById('loginPassword')
      .value;

  const button =
    event.submitter;

  if(button){
    button.disabled = true;
    button.textContent = 'Logging in…';
  }

  try{

    const data =
      await customerApi(
        '/api/customer/login',
        {
          method:'POST',
          body:JSON.stringify({
            identifier,
            password
          })
        }
      );

    saveCustomerSession(
      data.token,
      data.customer
    );

    showCustomerAccount();

    if(typeof toast === 'function'){
      toast('Login successful ✓');
    }

  }catch(error){

    showLoginForm(
      error.message
    );

  }finally{

    if(button){
      button.disabled = false;
    }

  }
}

/* =========================================================
   REGISTER
   ========================================================= */

async function customerRegister(event){

  event.preventDefault();

  const name =
    document
      .getElementById('registerName')
      .value
      .trim();

  const phone =
    document
      .getElementById('registerPhone')
      .value
      .trim()
      .replace(/[\s-]/g,'');

  const email =
    document
      .getElementById('registerEmail')
      .value
      .trim()
      .toLowerCase();

  const password =
    document
      .getElementById('registerPassword')
      .value;

  const confirmPassword =
    document
      .getElementById(
        'registerConfirmPassword'
      )
      .value;

  if(password !== confirmPassword){

    showRegisterForm(
      'Passwords do not match.'
    );

    return;
  }

  if(!/^01\d{9}$/.test(phone)){

    showRegisterForm(
      'Please enter a valid Bangladesh mobile number.'
    );

    return;
  }

  try{

    const data =
      await customerApi(
        '/api/customer/register',
        {
          method:'POST',
          body:JSON.stringify({
            name,
            phone,
            email,
            password,
            confirmPassword
          })
        }
      );

    saveCustomerSession(
      data.token,
      data.customer
    );

    showCustomerAccount();

    if(typeof toast === 'function'){
      toast('Account created successfully ✓');
    }

  }catch(error){

    showRegisterForm(
      error.message
    );

  }
}

/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

function showForgotPasswordForm(message = ''){

  const box =
    document.getElementById(
      'customerAuthContent'
    );

  if(!box) return;

  box.innerHTML = `

    <span class="mini">PASSWORD RECOVERY</span>

    <h2>Forgot Password?</h2>

    <p class="auth-subtitle">
      Enter the email address connected
      to your customer account.
    </p>

    ${
      message
        ? `<div class="auth-message">${escapeAuthHtml(message)}</div>`
        : ''
    }

    <form
      class="auth-form"
      onsubmit="requestPasswordReset(event)"
    >

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
        class="auth-submit"
        type="submit"
      >
        Send Reset Code
      </button>

    </form>

    <button
      class="auth-link"
      type="button"
      onclick="showLoginForm()"
    >
      ← Back to Login
    </button>

  `;
}

async function requestPasswordReset(event){

  event.preventDefault();

  const email =
    document
      .getElementById('forgotEmail')
      .value
      .trim()
      .toLowerCase();

  try{

    const data =
      await customerApi(
        '/api/customer/forgot-password',
        {
          method:'POST',
          body:JSON.stringify({
            email
          })
        }
      );

    forgotPasswordEmail = email;

    showResetPasswordForm(
      data.message ||
      'If this email is registered, a reset code has been sent.'
    );

  }catch(error){

    showForgotPasswordForm(
      error.message
    );

  }
}

/* =========================================================
   RESET PASSWORD
   ========================================================= */

function showResetPasswordForm(
  message = ''
){

  const box =
    document.getElementById(
      'customerAuthContent'
    );

  if(!box) return;

  box.innerHTML = `

    <span class="mini">PASSWORD RECOVERY</span>

    <h2>Reset Password</h2>

    <p class="auth-subtitle">
      Enter the reset code sent to your email
      and choose a new password.
    </p>

    ${
      message
        ? `<div class="auth-message success">${escapeAuthHtml(message)}</div>`
        : ''
    }

    <form
      class="auth-form"
      onsubmit="resetCustomerPassword(event)"
    >

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
          placeholder="Repeat your password"
        >
      </label>

      <button
        class="auth-submit"
        type="submit"
      >
        Reset Password
      </button>

    </form>

    <button
      class="auth-link"
      type="button"
      onclick="showLoginForm()"
    >
      ← Back to Login
    </button>

  `;
}

async function resetCustomerPassword(event){

  event.preventDefault();

  const code =
    document
      .getElementById('resetCode')
      .value
      .trim();

  const password =
    document
      .getElementById('resetPassword')
      .value;

  const confirmPassword =
    document
      .getElementById(
        'resetConfirmPassword'
      )
      .value;

  if(password !== confirmPassword){

    showResetPasswordForm(
      'Passwords do not match.'
    );

    return;
  }

  try{

    const data =
      await customerApi(
        '/api/customer/reset-password',
        {
          method:'POST',
          body:JSON.stringify({
            email:forgotPasswordEmail,
            code,
            password,
            confirmPassword
          })
        }
      );

    showLoginForm(
      data.message ||
      'Password reset successfully. Please login.'
    );

  }catch(error){

    showResetPasswordForm(
      error.message
    );

  }
}

/* =========================================================
   CUSTOMER ACCOUNT / MY ORDERS
   ========================================================= */

function showCustomerAccount(){

  const box =
    document.getElementById(
      'customerAuthContent'
    );

  if(!box) return;

  const customer = getCustomer();

  if(!customer){
    showLoginForm();
    return;
  }

  box.innerHTML = `

    <span class="mini">MY ACCOUNT</span>

    <h2>${escapeAuthHtml(customer.name || 'Customer')}</h2>

    <p class="auth-subtitle">
      ${escapeAuthHtml(customer.phone || '')}
      ${
        customer.email
          ? `<br>${escapeAuthHtml(customer.email)}`
          : ''
      }
    </p>

    <div class="auth-account-actions">

      <button
        class="auth-secondary"
        type="button"
        onclick="showCustomerOrders()"
      >
        📦 My Orders
      </button>

      <button
        class="auth-secondary"
        type="button"
        onclick="customerLogout()"
      >
        🚪 Logout
      </button>

    </div>

    <div
      id="customerOrdersBox"
      style="margin-top:18px"
    ></div>

  `;
}

async function showCustomerOrders(){

  const box =
    document.getElementById(
      'customerOrdersBox'
    );

  if(!box) return;

  box.innerHTML =
    '<div class="auth-message">Loading orders…</div>';

  try{

    const data =
      await customerApi(
        '/api/customer/orders'
      );

    const orders =
      data.orders || [];

    if(!orders.length){

      box.innerHTML = `
        <div class="auth-message">
          You have not placed any orders yet.
        </div>
      `;

      return;
    }

    box.innerHTML = `

      <h3>My Orders</h3>

      ${orders.map(order => {

        const items =
          Array.isArray(order.items)
            ? order.items.map(item =>
                `${escapeAuthHtml(item.name)} × ${item.qty}`
              ).join('<br>')
            : 'Order items';

        return `

          <div class="customer-order-card">

            <div class="order-head">

              <strong>
                ${escapeAuthHtml(order.id || '')}
              </strong>

              <strong>
                ${escapeAuthHtml(order.status || 'Pending')}
              </strong>

            </div>

            <small>
              ${formatCustomerDate(order.createdAt)}
            </small>

            <div class="order-items">
              ${items}
            </div>

            <strong>
              Total:
              ৳${Number(order.total || 0).toLocaleString('en-BD')}
            </strong>

          </div>

        `;

      }).join('')}

    `;

  }catch(error){

    box.innerHTML = `
      <div class="auth-message error">
        ${escapeAuthHtml(error.message)}
      </div>
    `;

  }
}

/* =========================================================
   LOGOUT
   ========================================================= */

function customerLogout(){

  clearCustomerSession();

  closeCustomerAuth();

  if(typeof toast === 'function'){
    toast('Logged out successfully.');
  }
}

/* =========================================================
   CHECKOUT GATE
   ========================================================= */

function requireCustomerLogin(
  afterLogin = 'checkout'
){

  if(isCustomerLoggedIn()){
    return true;
  }

  openCustomerAuth(
    'login',
    afterLogin
  );

  if(typeof toast === 'function'){
    toast('Please login before placing an order.');
  }

  return false;
}

/* =========================================================
   HELPERS
   ========================================================= */

function escapeAuthHtml(value){

  return String(value ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');

}

function formatCustomerDate(value){

  if(!value){
    return '';
  }

  const date =
    new Date(value);

  if(Number.isNaN(date.getTime())){
    return String(value);
  }

  return date.toLocaleString(
    'en-BD',
    {
      dateStyle:'medium',
      timeStyle:'short'
    }
  );

}

/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    createCustomerAuthUI();
    createCustomerAccountButton();
    updateCustomerButton();

  }
);
