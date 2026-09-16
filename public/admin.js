/* =========================================================
   CHEF SIFAT'S KITCHEN
   ADMIN.JS
   Compatible with current server.js
========================================================= */

const API = '/api';

let TOKEN = localStorage.getItem('csk_admin_token') || '';

/* =========================================================
   BASIC HELPERS
========================================================= */

function $(id) {
  return document.getElementById(id);
}

function escapeHTML(value) {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function money(value) {
  return `৳${Number(value || 0).toFixed(0)}`;
}

function showMessage(text, type = '') {
  return `
    <div class="message ${type}">
      ${escapeHTML(text)}
    </div>
  `;
}

/* =========================================================
   API HELPER
========================================================= */

async function api(path, options = {}) {

  const headers = {
    ...(options.headers || {})
  };

  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }

  if (
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(API + path, {
    ...options,
    headers
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (response.status === 401) {

    localStorage.removeItem('csk_admin_token');
    TOKEN = '';

    showLogin();

    throw new Error(
      data.message || 'Admin session expired. Please login again.'
    );
  }

  if (!response.ok || data.ok === false) {

    throw new Error(
      data.message ||
      data.error ||
      `Request failed (${response.status})`
    );
  }

  return data;
}

/* =========================================================
   LOGIN
========================================================= */

async function login() {

  const username = $('username').value.trim();
  const password = $('password').value;

  $('loginError').textContent = '';

  if (!username || !password) {

    $('loginError').textContent =
      'Username and password are required.';

    return;
  }

  const button =
    document.querySelector('.login-btn');

  button.disabled = true;
  button.textContent = 'Signing in...';

  try {

    const data = await fetch(`${API}/admin/login`, {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        username,
        password
      })

    });

    const result = await data.json();

    if (!data.ok || !result.ok) {

      throw new Error(
        result.message ||
        result.error ||
        'Invalid username or password.'
      );
    }

    TOKEN = result.token;

    localStorage.setItem(
      'csk_admin_token',
      TOKEN
    );

    showApp();

    await dashboard();

  } catch (error) {

    console.error(error);

    $('loginError').textContent =
      error.message || 'Login failed.';

  } finally {

    button.disabled = false;
    button.textContent = 'Sign In';

  }
}

/* =========================================================
   SHOW / HIDE
========================================================= */

function showLogin() {

  $('login').style.display = 'flex';
  $('app').style.display = 'none';

}

function showApp() {

  $('login').style.display = 'none';
  $('app').style.display = 'block';

}

/* =========================================================
   INITIAL CHECK
========================================================= */

async function init() {

  if (!TOKEN) {

    showLogin();
    return;

  }

  try {

    await api('/admin/dashboard');

    showApp();

    await dashboard();

  } catch (error) {

    console.error(error);

    TOKEN = '';

    localStorage.removeItem(
      'csk_admin_token'
    );

    showLogin();

  }

}

/* =========================================================
   DASHBOARD
========================================================= */

async function dashboard() {

  const view = $('view');

  view.innerHTML = `
    <h1 class="page-title">Dashboard</h1>
    <div class="card">Loading...</div>
  `;

  try {

    const data =
      await api('/admin/dashboard');

    const s = data.stats || {};

    view.innerHTML = `

      <h1 class="page-title">
        Dashboard
      </h1>

      <div class="stats">

        <div class="stat">
          Total Orders
          <strong>
            ${Number(s.totalOrders || 0)}
          </strong>
        </div>

        <div class="stat">
          Pending
          <strong>
            ${Number(s.pendingOrders || 0)}
          </strong>
        </div>

        <div class="stat">
          Customers
          <strong>
            ${Number(s.customers || 0)}
          </strong>
        </div>

        <div class="stat">
          Revenue
          <strong>
            ${money(s.revenue || 0)}
          </strong>
        </div>

      </div>

      <div class="card">

        <h2>Admin Panel</h2>

        <p>
          Welcome to Chef Sifat's Kitchen
          administration panel.
        </p>

        <p>
          Use the menu on the left to manage
          orders, menu, reviews, customers and
          delivery settings.
        </p>

      </div>
    `;

  } catch (error) {

    view.innerHTML =
      showMessage(error.message, 'error');

  }
}

/* =========================================================
   ORDERS
========================================================= */

async function orders() {

  const view = $('view');

  view.innerHTML = `
    <h1 class="page-title">
      Orders
    </h1>

    <div class="card">
      Loading orders...
    </div>
  `;

  try {

    const data =
      await api('/admin/orders');

    const list =
      Array.isArray(data.orders)
        ? data.orders
        : [];

    if (!list.length) {

      view.innerHTML = `
        <h1 class="page-title">
          Orders
        </h1>

        <div class="card">
          No orders found.
        </div>
      `;

      return;
    }

    view.innerHTML = `

      <h1 class="page-title">
        Orders
      </h1>

      <div class="card">

        <div style="overflow:auto">

          <table>

            <thead>

              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Note</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              ${list.map(order => `

                <tr>

                  <td>
                    <strong>
                      #${escapeHTML(order.id || '')}
                    </strong>

                    <br>

                    <small>
                      ${escapeHTML(
                        order.createdAt || ''
                      )}
                    </small>
                  </td>

                  <td>

                    ${escapeHTML(
                      order.customerName ||
                      order.name ||
                      ''
                    )}

                    <br>

                    ${escapeHTML(
                      order.phone || ''
                    )}

                    <br>

                    <small>
                      ${escapeHTML(
                        order.customerEmail || ''
                      )}
                    </small>

                  </td>

                  <td>
                    ${money(
                      order.total ||
                      order.grandTotal ||
                      0
                    )}
                  </td>

                  <td>
                    ${escapeHTML(
                      order.paymentMethod ||
                      order.payment ||
                      ''
                    )}
                  </td>

                  <td>

                    <select
                      id="status-${escapeHTML(order.id)}"
                    >

                      ${statusOptions(
                        order.status
                      )}

                    </select>

                  </td>

                  <td>

                    <textarea
                      id="note-${escapeHTML(order.id)}"
                      placeholder="Admin note"
                    >${escapeHTML(
                      order.adminNote || ''
                    )}</textarea>

                  </td>

                  <td>

                    <button
                      class="btn green"
                      onclick="updateOrder('${escapeHTML(order.id)}')"
                    >
                      Save
                    </button>

                  </td>

                </tr>

              `).join('')}

            </tbody>

          </table>

        </div>

      </div>

    `;

  } catch (error) {

    view.innerHTML =
      showMessage(error.message, 'error');

  }
}

function statusOptions(current) {

  const statuses = [

    ['pending', 'Pending'],
    ['confirmed', 'Confirmed'],
    ['preparing', 'Preparing'],
    ['out_for_delivery', 'Out for Delivery'],
    ['delivered', 'Delivered'],
    ['cancelled', 'Cancelled']

  ];

  return statuses.map(
    ([value, label]) => `

      <option
        value="${value}"
        ${current === value ? 'selected' : ''}
      >
        ${label}
      </option>

    `
  ).join('');
}

async function updateOrder(id) {

  const status =
    document.getElementById(
      `status-${id}`
    ).value;

  const adminNote =
    document.getElementById(
      `note-${id}`
    ).value;

  try {

    await api(
      `/admin/orders/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',

        body: JSON.stringify({
          status,
          adminNote
        })
      }
    );

    alert('Order updated successfully.');

    await orders();

  } catch (error) {

    alert(error.message);

  }
}

/* =========================================================
   MENU
========================================================= */

async function menu() {

  const view = $('view');

  view.innerHTML = `
    <h1 class="page-title">
      Menu Management
    </h1>

    <div class="card">
      Loading menu...
    </div>
  `;

  try {

    const data =
      await api('/admin/menu');

    const list =
      Array.isArray(data.menu)
        ? data.menu
        : [];

    view.innerHTML = `

      <h1 class="page-title">
        Menu Management
      </h1>

      <div id="menuMessage"></div>

      <div class="card">

        <h2>Add New Item</h2>

        <div class="form-grid">

          <div class="form-group">
            <label>Name</label>
            <input id="newName">
          </div>

          <div class="form-group">
            <label>Category</label>

            <select id="newCat">

              <option value="Pizza">
                Pizza
              </option>

              <option value="Momo">
                Momo
              </option>

              <option value="Continental">
                Continental
              </option>

              <option value="Kacchi">
                Kacchi
              </option>

            </select>

          </div>

          <div class="form-group">
            <label>Price</label>
            <input
              id="newPrice"
              type="number"
              min="0"
            >
          </div>

          <div class="form-group">
            <label>Image URL</label>
            <input id="newImage">
          </div>

          <div class="form-group full">

            <label>
              Description
            </label>

            <textarea
              id="newDescription"
            ></textarea>

          </div>

          <div class="form-group">

            <label>
              Pre-order
            </label>

            <select id="newPrebook">

              <option value="false">
                OFF
              </option>

              <option value="true">
                ON
              </option>

            </select>

          </div>

          <div class="form-group">

            <label>
              Active
            </label>

            <select id="newActive">

              <option value="true">
                YES
              </option>

              <option value="false">
                NO
              </option>

            </select>

          </div>

        </div>

        <button
          class="btn green"
          onclick="addMenuItem()"
        >
          + Add Item
        </button>

      </div>

      <div class="card">

        <h2>
          Existing Items
        </h2>

        <div id="menuList">

          ${list.map(
            item => menuEditor(item)
          ).join('')}

        </div>

        <button
          class="btn green"
          onclick="saveAllMenu()"
        >
          💾 Save All Menu
        </button>

      </div>

    `;

  } catch (error) {

    view.innerHTML =
      showMessage(error.message, 'error');

  }
}

function menuEditor(item) {

  const id =
    escapeHTML(item.id || '');

  const sizes =
    Array.isArray(item.sizes)
      ? item.sizes
      : [];

  const sizesText =
    sizes.map(size => {

      const label =
        size.label ||
        size.name ||
        size.title ||
        '';

      return `${label}=${size.price || 0}`;

    }).join(', ');

  return `

    <div
      class="menu-item"
      data-id="${id}"
    >

      <div class="menu-item-grid">

        <div>

          <img
            class="menu-image"
            src="${escapeHTML(
              item.image ||
              item.imageUrl ||
              '/assets/placeholder.jpg'
            )}"
            onerror="
              this.style.display='none'
            "
          >

        </div>

        <div>

          <div class="form-grid">

            <div class="form-group">

              <label>
                Name
              </label>

              <input
                data-field="name"
                value="${escapeHTML(
                  item.name || ''
                )}"
              >

            </div>

            <div class="form-group">

              <label>
                Category
              </label>

              <select data-field="cat">

                ${categoryOptions(
                  item.cat ||
                  item.category
                )}

              </select>

            </div>

            <div class="form-group">

              <label>
                Price
              </label>

              <input
                data-field="price"
                type="number"
                min="0"
                value="${Number(
                  item.price || 0
                )}"
              >

            </div>

            <div class="form-group">

              <label>
                Sizes
              </label>

              <input
                data-field="sizes"
                value="${escapeHTML(
                  sizesText
                )}"
                placeholder="6 pcs=300, 8 pcs=380"
              >

            </div>

            <div class="form-group full">

              <label>
                Description
              </label>

              <textarea
                data-field="description"
              >${escapeHTML(
                item.description || ''
              )}</textarea>

            </div>

            <div class="form-group">

              <label>
                Image URL
              </label>

              <input
                data-field="image"
                value="${escapeHTML(
                  item.image ||
                  item.imageUrl ||
                  ''
                )}"
              >

            </div>

            <div class="form-group">

              <label>
                Pre-order
              </label>

              <select data-field="prebook">

                <option
                  value="false"
                  ${
                    !item.prebook
                      ? 'selected'
                      : ''
                  }
                >
                  OFF
                </option>

                <option
                  value="true"
                  ${
                    item.prebook
                      ? 'selected'
                      : ''
                  }
                >
                  ON
                </option>

              </select>

            </div>

            <div class="form-group">

              <label>
                Active
              </label>

              <select data-field="active">

                <option
                  value="true"
                  ${
                    item.active !== false
                      ? 'selected'
                      : ''
                  }
                >
                  YES
                </option>

                <option
                  value="false"
                  ${
                    item.active === false
                      ? 'selected'
                      : ''
                  }
                >
                  NO
                </option>

              </select>

            </div>

          </div>

          <button
            class="btn red"
            onclick="deleteMenuItem('${id}')"
          >
            Delete
          </button>

        </div>

      </div>

    </div>

  `;
}

function categoryOptions(current) {

  const cats = [
    'Pizza',
    'Momo',
    'Continental',
    'Kacchi'
  ];

  return cats.map(
    cat => `

      <option
        value="${cat}"
        ${
          current === cat
            ? 'selected'
            : ''
        }
      >
        ${cat}
      </option>

    `
  ).join('');
}

/* =========================================================
   SIZE PARSER
========================================================= */

function parseSizes(text) {

  if (!text || !text.trim()) {
    return [];
  }

  return text
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
    .map(x => {

      const parts =
        x.split('=');

      return {

        label:
          (parts[0] || '').trim(),

        price:
          Number(
            (parts[1] || 0).trim()
          )

      };

    })
    .filter(x =>
      x.label &&
      x.price > 0
    );
}

/* =========================================================
   ADD MENU ITEM
========================================================= */

async function addMenuItem() {

  const name =
    $('newName').value.trim();

  const cat =
    $('newCat').value;

  const price =
    Number($('newPrice').value || 0);

  const image =
    $('newImage').value.trim();

  const description =
    $('newDescription').value.trim();

  const prebook =
    $('newPrebook').value === 'true';

  const active =
    $('newActive').value === 'true';

  if (!name) {

    alert('Please enter item name.');
    return;

  }

  if (price <= 0) {

    alert('Please enter a valid price.');
    return;

  }

  try {

    await api('/admin/menu', {

      method: 'POST',

      body: JSON.stringify({

        name,
        cat,
        price,
        image,
        description,
        prebook:
          cat === 'Pizza' ||
          cat === 'Momo'
            ? false
            : prebook,
        active

      })

    });

    alert('Menu item added.');

    await menu();

  } catch (error) {

    alert(error.message);

  }
}

/* =========================================================
   SAVE ALL MENU
========================================================= */

async function saveAllMenu() {

  const items =
    Array.from(
      document.querySelectorAll(
        '.menu-item'
      )
    );

  const menuData =
    items.map(box => {

      const id =
        box.dataset.id;

      const get =
        field =>
          box.querySelector(
            `[data-field="${field}"]`
          );

      const cat =
        get('cat').value;

      const sizes =
        parseSizes(
          get('sizes').value
        );

      const price =
        Number(
          get('price').value || 0
        );

      return {

        id,

        name:
          get('name').value.trim(),

        cat,

        category: cat,

        price:

          sizes.length
            ? Number(
                sizes[0].price
              )
            : price,

        sizes,

        description:
          get('description')
            .value.trim(),

        image:
          get('image')
            .value.trim(),

        prebook:
          cat === 'Pizza' ||
          cat === 'Momo'
            ? false
            : get('prebook').value === 'true',

        active:
          get('active').value === 'true'

      };

    });

  try {

    await api('/admin/menu', {

      method: 'PUT',

      body: JSON.stringify({
        menu: menuData
      })

    });

    alert(
      'Menu saved successfully.'
    );

    await menu();

  } catch (error) {

    alert(error.message);

  }
}

/* =========================================================
   DELETE MENU ITEM
========================================================= */

async function deleteMenuItem(id) {

  if (
    !confirm(
      'Are you sure you want to delete this item?'
    )
  ) {
    return;
  }

  try {

    await api(
      `/admin/menu/${encodeURIComponent(id)}`,
      {
        method: 'DELETE'
      }
    );

    alert(
      'Menu item deleted.'
    );

    await menu();

  } catch (error) {

    alert(error.message);

  }
}

/* =========================================================
   REVIEWS
========================================================= */

async function reviews() {

  const view = $('view');

  view.innerHTML = `
    <h1 class="page-title">
      Reviews
    </h1>

    <div class="card">
      Loading reviews...
    </div>
  `;

  try {

    const data =
      await api('/admin/reviews');

    const list =
      Array.isArray(data.reviews)
        ? data.reviews
        : [];

    if (!list.length) {

      view.innerHTML = `
        <h1 class="page-title">
          Reviews
        </h1>

        <div class="card">
          No reviews found.
        </div>
      `;

      return;
    }

    view.innerHTML = `

      <h1 class="page-title">
        Reviews
      </h1>

      <div class="card">

        <div style="overflow:auto">

          <table>

            <thead>

              <tr>
                <th>Customer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Status</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              ${list.map(review => `

                <tr>

                  <td>
                    ${escapeHTML(
                      review.name ||
                      review.customerName ||
                      ''
                    )}
                  </td>

                  <td>
                    ⭐
                    ${Number(
                      review.rating || 0
                    )}
                  </td>

                  <td>
                    ${escapeHTML(
                      review.comment ||
                      review.text ||
                      ''
                    )}
                  </td>

                  <td>
                    ${
                      review.approved
                        ? 'Approved'
                        : 'Pending'
                    }
                  </td>

                  <td>

                    <button
                      class="btn green"
                      onclick="
                        updateReview(
                          '${escapeHTML(review.id)}',
                          true
                        )
                      "
                    >
                      Approve
                    </button>

                    <button
                      class="btn red"
                      onclick="
                        updateReview(
                          '${escapeHTML(review.id)}',
                          false
                        )
                      "
                    >
                      Reject
                    </button>

                  </td>

                </tr>

              `).join('')}

            </tbody>

          </table>

        </div>

      </div>

    `;

  } catch (error) {

    view.innerHTML =
      showMessage(error.message, 'error');

  }
}

async function updateReview(id, approved) {

  try {

    await api(
      `/admin/reviews/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',

        body: JSON.stringify({
          approved
        })
      }
    );

    await reviews();

  } catch (error) {

    alert(error.message);

  }
}

/* =========================================================
   CUSTOMERS
========================================================= */

async function customers() {

  const view = $('view');

  view.innerHTML = `
    <h1 class="page-title">
      Customers
    </h1>

    <div class="card">
      Loading customers...
    </div>
  `;

  try {

    const data =
      await api('/admin/customers');

    const list =
      Array.isArray(data.customers)
        ? data.customers
        : [];

    view.innerHTML = `

      <h1 class="page-title">
        Customers
      </h1>

      <div class="card">

        ${
          !list.length
            ? 'No customers found.'
            : `
              <div style="overflow:auto">

                <table>

                  <thead>

                    <tr>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>Orders</th>
                    </tr>

                  </thead>

                  <tbody>

                    ${list.map(customer => `

                      <tr>

                        <td>
                          ${escapeHTML(
                            customer.name || ''
                          )}
                        </td>

                        <td>
                          ${escapeHTML(
                            customer.mobile ||
                            customer.phone ||
                            ''
                          )}
                        </td>

                        <td>
                          ${escapeHTML(
                            customer.email || ''
                          )}
                        </td>

                        <td>
                          ${Number(
                            customer.orderCount ||
                            customer.ordersCount ||
                            0
                          )}
                        </td>

                      </tr>

                    `).join('')}

                  </tbody>

                </table>

              </div>
            `
        }

      </div>

    `;

  } catch (error) {

    view.innerHTML =
      showMessage(error.message, 'error');

  }
}

/* =========================================================
   SETTINGS
========================================================= */

async function settings() {

  const view = $('view');

  view.innerHTML = `
    <h1 class="page-title">
      Delivery & Settings
    </h1>

    <div class="card">
      Loading settings...
    </div>
  `;

  try {

    const data =
      await api('/admin/settings');

    const s =
      data.settings || {};

    const delivery =
      s.delivery || {};

    const payment =
      s.payment || {};

    const hours =
      s.hours || {};

    const normal =
      hours.normal || {};

    const friday =
      hours.friday || {};

    view.innerHTML = `

      <h1 class="page-title">
        Delivery & Settings
      </h1>

      <div id="settingsMessage"></div>

      <div class="card">

        <h2>Delivery</h2>

        <div class="form-grid">

          <div class="form-group full">

            <label>
              Base Location Name
            </label>

            <input
              id="baseName"
              value="${escapeHTML(
                delivery.baseName || ''
              )}"
            >

          </div>

          <div class="form-group">

            <label>
              Base Latitude
            </label>

            <input
              id="baseLat"
              type="number"
              step="any"
              value="${
                delivery.baseLat ??
                23.3022494
              }"
            >

          </div>

          <div class="form-group">

            <label>
              Base Longitude
            </label>

            <input
              id="baseLng"
              type="number"
              step="any"
              value="${
                delivery.baseLng ??
                90.9187528
              }"
            >

          </div>

          <div class="form-group">

            <label>
              COD Radius (KM)
            </label>

            <input
              id="codRadius"
              type="number"
              step="0.1"
              value="${
                delivery.codRadius ??
                1
              }"
            >

          </div>

          <div class="form-group">

            <label>
              Maximum Delivery Radius (KM)
            </label>

            <input
              id="maxRadius"
              type="number"
              step="0.1"
              value="${
                delivery.maxRadius ??
                4
              }"
            >

          </div>

          <div class="form-group">

            <label>
              Delivery Rate / KM
            </label>

            <input
              id="ratePerKm"
              type="number"
              value="${
                delivery.ratePerKm ??
                10
              }"
            >

          </div>

          <div class="form-group">

            <label>
              COD Charge
            </label>

            <input
              id="codCharge"
              type="number"
              value="${
                delivery.codCharge ??
                0
              }"
            >

          </div>

        </div>

      </div>


      <div class="card">

        <h2>Payment</h2>

        <div class="form-grid">

          <div class="form-group">

            <label>
              bKash
            </label>

            <input
              id="bkash"
              value="${escapeHTML(
                payment.bKash ||
                payment.bkash ||
                '01792494275'
              )}"
            >

          </div>

          <div class="form-group">

            <label>
              Nagad
            </label>

            <input
              id="nagad"
              value="${escapeHTML(
                payment.Nagad ||
                payment.nagad ||
                '01792494275'
              )}"
            >

          </div>

          <div class="form-group">

            <label>
              Payment Method
            </label>

            <input
              id="paymentMethod"
              value="${escapeHTML(
                payment.method ||
                'Send Money'
              )}"
            >

          </div>

        </div>

      </div>


      <div class="card">

        <h2>
          Shop Hours — Normal Days
        </h2>

        <div class="form-grid">

          <div class="form-group">

            <label>
              Opening
            </label>

            <input
              id="normalOpen"
              type="number"
              min="0"
              max="23"
              value="${
                normal.open ??
                11
              }"
            >

          </div>

          <div class="form-group">

            <label>
              Closing
            </label>

            <input
              id="normalClose"
              type="number"
              min="0"
              max="23"
              value="${
                normal.close ??
                19
              }"
            >

          </div>

        </div>

      </div>


      <div class="card">

        <h2>
          Shop Hours — Friday
        </h2>

        <div class="form-grid">

          <div class="form-group">

            <label>
              Opening
            </label>

            <input
              id="fridayOpen"
              type="number"
              min="0"
              max="23"
              value="${
                friday.open ??
                15
              }"
            >

          </div>

          <div class="form-group">

            <label>
              Closing
            </label>

            <input
              id="fridayClose"
              type="number"
              min="0"
              max="23"
              value="${
                friday.close ??
                21
              }"
            >

          </div>

        </div>

      </div>


      <div class="card">

        <h2>
          Pre-order
        </h2>

        <div class="form-group">

          <label>
            Pre-order System
          </label>

          <select id="prebookEnabled">

            <option
              value="true"
              ${
                s.prebook?.enabled !== false
                  ? 'selected'
                  : ''
              }
            >
              ON
            </option>

            <option
              value="false"
              ${
                s.prebook?.enabled === false
                  ? 'selected'
                  : ''
              }
            >
              OFF
            </option>

          </select>

        </div>

      </div>


      <div class="card">

        <button
          class="btn green"
          onclick="saveSettings()"
        >
          💾 Save Settings
        </button>

      </div>

    `;

  } catch (error) {

    view.innerHTML =
      showMessage(error.message, 'error');

  }
}

/* =========================================================
   SAVE SETTINGS
========================================================= */

async function saveSettings() {

  const settingsData = {

    delivery: {

      baseName:
        $('baseName').value.trim(),

      baseLat:
        Number($('baseLat').value),

      baseLng:
        Number($('baseLng').value),

      codRadius:
        Number($('codRadius').value),

      maxRadius:
        Number($('maxRadius').value),

      ratePerKm:
        Number($('ratePerKm').value),

      codCharge:
        Number($('codCharge').value)

    },

    payment: {

      bKash:
        $('bkash').value.trim(),

      Nagad:
        $('nagad').value.trim(),

      method:
        $('paymentMethod').value.trim()

    },

    hours: {

      normal: {

        open:
          Number($('normalOpen').value),

        close:
          Number($('normalClose').value)

      },

      friday: {

        open:
          Number($('fridayOpen').value),

        close:
          Number($('fridayClose').value)

      }

    },

    prebook: {

      enabled:
        $('prebookEnabled').value === 'true'

    }

  };

  try {

    await api('/admin/settings', {

      method: 'PUT',

      body:
        JSON.stringify(settingsData)

    });

    $('settingsMessage').innerHTML =
      showMessage(
        'Settings saved successfully.',
        'success'
      );

  } catch (error) {

    $('settingsMessage').innerHTML =
      showMessage(
        error.message,
        'error'
      );

  }
}

/* =========================================================
   LOGOUT
========================================================= */

function logout() {

  TOKEN = '';

  localStorage.removeItem(
    'csk_admin_token'
  );

  showLogin();

}

/* =========================================================
   ENTER KEY LOGIN
========================================================= */

document.addEventListener(
  'keydown',
  function(event) {

    if (
      event.key === 'Enter' &&
      $('login').style.display !== 'none'
    ) {

      login();

    }

  }
);

/* =========================================================
   START
========================================================= */

window.addEventListener(
  'DOMContentLoaded',
  init
);
