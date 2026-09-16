/* =========================================================
   CHEF SIFAT'S KITCHEN — ADMIN PANEL
   ========================================================= */

let T = localStorage.getItem('cskAdmin') || '';

const $ = (id) => document.querySelector(id);

const api = async (url, options = {}) => {
  const headers = {
    ...(options.headers || {}),
    Authorization: 'Bearer ' + T
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  if (res.status === 401) {
    logout();
    return null;
  }

  let data;

  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};


/* =========================================================
   HELPERS
   ========================================================= */

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

function money(n) {
  return '৳' + Number(n || 0).toLocaleString('en-BD');
}

function notify(message) {
  alert(message);
}


/* =========================================================
   LOGIN
   ========================================================= */

async function login() {
  const username = $('#u').value.trim();
  const password = $('#p').value;

  if (!username || !password) {
    $('#e').textContent = 'Enter username and password.';
    return;
  }

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await res.json();

    if (!res.ok || !data.token) {
      $('#e').textContent = data.error || 'Login failed';
      return;
    }

    T = data.token;
    localStorage.setItem('cskAdmin', T);

    start();

  } catch (err) {
    $('#e').textContent = err.message || 'Server error';
  }
}


/* =========================================================
   START / LOGOUT
   ========================================================= */

function start() {
  $('#login').style.display = 'none';
  $('#app').style.display = 'grid';
  dash();
}

function logout() {
  localStorage.removeItem('cskAdmin');
  T = '';

  $('#app').style.display = 'none';
  $('#login').style.display = 'grid';

  if ($('#u')) $('#u').value = '';
  if ($('#p')) $('#p').value = '';
}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function dash() {
  try {
    const x = await api('/api/admin/dashboard');

    if (!x) return;

    $('#view').innerHTML = `
      <div class="page-head">
        <div>
          <small>ADMIN PANEL</small>
          <h1>Dashboard</h1>
        </div>
      </div>

      <div class="cards">
        ${Object.entries(x).map(([key, value]) => `
          <div class="card">
            <span>${esc(key)}</span>
            <b>${esc(value)}</b>
          </div>
        `).join('')}
      </div>

      <div class="box">
        <h2>Quick Actions</h2>

        <div class="quick-actions">
          <button onclick="orders()">📦 Orders</button>
          <button onclick="menu()">🍕 Manage Menu</button>
          <button onclick="addItem()">➕ Add New Item</button>
          <button onclick="settings()">⚙️ Settings</button>
          <button onclick="reviews()">⭐ Reviews</button>
        </div>
      </div>
    `;

  } catch (err) {
    $('#view').innerHTML = `
      <div class="box">
        <h2>Error</h2>
        <p>${esc(err.message)}</p>
      </div>
    `;
  }
}


/* =========================================================
   ORDERS
   ========================================================= */

async function orders() {
  try {
    const data = await api('/api/orders');

    const list = Array.isArray(data) ? data : [];

    $('#view').innerHTML = `
      <div class="page-head">
        <div>
          <small>ORDER MANAGEMENT</small>
          <h1>Orders</h1>
        </div>

        <button onclick="orders()">↻ Refresh</button>
      </div>

      <div class="box">
        <div style="overflow-x:auto">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Delivery</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              ${list.map(o => `
                <tr>

                  <td>
                    <b>${esc(o.id)}</b>
                    <br>
                    <small>
                      ${o.createdAt
                        ? new Date(o.createdAt).toLocaleString()
                        : ''}
                    </small>
                  </td>

                  <td>
                    <b>${esc(o.name)}</b>
                    <br>
                    ${esc(o.phone)}
                  </td>

                  <td>
                    ${(o.items || []).map(i => `
                      ${esc(i.name)}
                      × ${esc(i.qty)}
                      ${i.size ? `(${esc(i.size)})` : ''}
                      <br>
                    `).join('')}
                  </td>

                  <td>
                    <b>${esc(o.distanceKm)} km</b>
                    <br>
                    ${esc(o.address || '')}

                    ${
                      o.lat && o.lng
                        ? `
                          <br>
                          <a
                            target="_blank"
                            href="https://www.openstreetmap.org/?mlat=${o.lat}&mlon=${o.lng}">
                            📍 Map
                          </a>
                        `
                        : ''
                    }
                  </td>

                  <td>
                    <b>${esc(o.paymentMethod || '')}</b>
                    ${
                      o.transactionId
                        ? `<br>TXN: ${esc(o.transactionId)}`
                        : ''
                    }
                  </td>

                  <td>
                    <b>${money(o.total)}</b>
                  </td>

                  <td>
                    <select
                      onchange="status('${esc(o.id)}', this.value)"
                    >
                      ${
                        [
                          'Pending',
                          'Confirmed',
                          'Preparing',
                          'Out for delivery',
                          'Delivered',
                          'Cancelled'
                        ].map(s => `
                          <option
                            value="${esc(s)}"
                            ${s === o.status ? 'selected' : ''}
                          >
                            ${esc(s)}
                          </option>
                        `).join('')
                      }
                    </select>
                  </td>

                </tr>
              `).join('')}

            </tbody>
          </table>
        </div>

        ${
          !list.length
            ? '<p>No orders found.</p>'
            : ''
        }
      </div>
    `;

  } catch (err) {
    $('#view').innerHTML = `
      <div class="box">
        <h2>Error loading orders</h2>
        <p>${esc(err.message)}</p>
      </div>
    `;
  }
}


/* =========================================================
   ORDER STATUS
   ========================================================= */

async function status(id, value) {
  try {
    await api('/api/orders/' + encodeURIComponent(id), {
      method: 'PATCH',
      body: JSON.stringify({
        status: value
      })
    });

    notify('Order status updated.');

  } catch (err) {
    notify(err.message);
    orders();
  }
}


/* =========================================================
   MENU
   ========================================================= */

async function menu() {
  try {
    const config = await api('/api/config');
    const list = Array.isArray(config.menu) ? config.menu : [];

    $('#view').innerHTML = `
      <div class="page-head">
        <div>
          <small>MENU MANAGEMENT</small>
          <h1>Menu</h1>
        </div>

        <div>
          <button onclick="addItem()">➕ Add New Item</button>
          <button onclick="menu()">↻ Refresh</button>
        </div>
      </div>

      <div class="box">
        <div style="overflow-x:auto">
          <table class="table">

            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Pre-order</th>
                <th>Prices</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              ${list.map(p => {

                const isPizza =
                  String(p.cat || '').toLowerCase() === 'pizza';

                return `
                  <tr>

                    <td>
                      ${
                        p.image
                          ? `
                            <img
                              src="${esc(p.image)}"
                              style="
                                width:70px;
                                height:55px;
                                object-fit:cover;
                                border-radius:8px;
                              "
                            >
                          `
                          : 'No image'
                      }
                    </td>

                    <td>
                      <b>${esc(p.name)}</b>

                      ${
                        p.description
                          ? `<br><small>${esc(p.description)}</small>`
                          : ''
                      }
                    </td>

                    <td>
                      ${esc(p.cat)}
                    </td>

                    <td>

                      ${
                        isPizza
                          ? `
                            <span>
                              ❌ OFF
                              <br>
                              <small>Pizza cannot be pre-order</small>
                            </span>
                          `
                          : `
                            <button
                              onclick="toggle('${esc(p.id)}', ${!p.prebook})"
                            >
                              ${p.prebook ? '🟢 ON' : '🔴 OFF'}
                            </button>
                          `
                      }

                    </td>

                    <td>
                      ${
                        (p.sizes || []).map(s => `
                          ${esc(s[0])}: ${money(s[1])}
                          <br>
                        `).join('')
                      }
                    </td>

                    <td>

                      <button
                        onclick='editItem(${JSON.stringify(p)})'
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onclick="deleteItem('${esc(p.id)}')"
                      >
                        🗑️ Delete
                      </button>

                    </td>

                  </tr>
                `;

              }).join('')}

            </tbody>

          </table>
        </div>
      </div>
    `;

  } catch (err) {
    $('#view').innerHTML = `
      <div class="box">
        <h2>Error loading menu</h2>
        <p>${esc(err.message)}</p>
      </div>
    `;
  }
}


/* =========================================================
   ADD ITEM
   ========================================================= */

function addItem() {
  itemForm({
    id: '',
    name: '',
    cat: 'Pizza',
    description: '',
    image: '',
    prebook: false,
    minQty: 1,
    maxQty: 20,
    sizes: [
      ['', '']
    ]
  });
}


/* =========================================================
   EDIT ITEM
   ========================================================= */

function editItem(item) {
  itemForm(item);
}


/* =========================================================
   ITEM FORM
   ========================================================= */

function itemForm(item) {

  const sizes = Array.isArray(item.sizes) && item.sizes.length
    ? item.sizes
    : [['', '']];

  $('#view').innerHTML = `
    <div class="page-head">
      <div>
        <small>MENU ITEM</small>
        <h1>${item.id ? 'Edit Item' : 'Add New Item'}</h1>
      </div>

      <button onclick="menu()">← Back to Menu</button>
    </div>

    <div class="box">

      <input type="hidden" id="itemId" value="${esc(item.id)}">

      <label>
        Item Name
        <input
          id="itemName"
          value="${esc(item.name)}"
          placeholder="e.g. Chicken Burger"
        >
      </label>

      <label>
        Category

        <select id="itemCat" onchange="categoryChanged()">

          <option
            value="Pizza"
            ${item.cat === 'Pizza' ? 'selected' : ''}
          >
            Pizza
          </option>

          <option
            value="Momo"
            ${item.cat === 'Momo' ? 'selected' : ''}
          >
            Momo
          </option>

          <option
            value="Continental"
            ${item.cat === 'Continental' ? 'selected' : ''}
          >
            Continental
          </option>

          <option
            value="Kacchi"
            ${item.cat === 'Kacchi' ? 'selected' : ''}
          >
            Kacchi
          </option>

          <option
            value="Fast Food"
            ${item.cat === 'Fast Food' ? 'selected' : ''}
          >
            Fast Food
          </option>

          <option
            value="Dessert"
            ${item.cat === 'Dessert' ? 'selected' : ''}
          >
            Dessert
          </option>

          <option
            value="Beverage"
            ${item.cat === 'Beverage' ? 'selected' : ''}
          >
            Beverage
          </option>

        </select>
      </label>

      <label>
        Description
        <textarea
          id="itemDescription"
          placeholder="Short description"
        >${esc(item.description)}</textarea>
      </label>

      <label>
        Item Image

        <input
          type="file"
          id="itemImage"
          accept="image/*"
        >

        ${
          item.image
            ? `
              <br>
              <img
                src="${esc(item.image)}"
                style="
                  width:120px;
                  height:90px;
                  object-fit:cover;
                  border-radius:10px;
                  margin-top:10px;
                "
              >
            `
            : ''
        }
      </label>

      <hr>

      <h3>Prices / Sizes</h3>

      <div id="sizeRows">
        ${sizes.map((s, i) => `
          <div
            class="size-row"
            style="
              display:flex;
              gap:10px;
              margin-bottom:8px;
            "
          >

            <input
              class="size-name"
              placeholder="Size / option"
              value="${esc(s[0])}"
            >

            <input
              class="size-price"
              type="number"
              min="0"
              placeholder="Price"
              value="${esc(s[1])}"
            >

            <button
              type="button"
              onclick="this.parentElement.remove()"
            >
              ×
            </button>

          </div>
        `).join('')}
      </div>

      <button type="button" onclick="addSizeRow()">
        ➕ Add Size / Price
      </button>

      <hr>

      <div class="form-grid">

        <label>
          Minimum Quantity
          <input
            id="minQty"
            type="number"
            min="1"
            value="${Number(item.minQty || 1)}"
          >
        </label>

        <label>
          Maximum Quantity
          <input
            id="maxQty"
            type="number"
            min="1"
            value="${Number(item.maxQty || 20)}"
          >
        </label>

      </div>

      <hr>

      <h3>Pre-order</h3>

      <label>
        <input
          type="checkbox"
          id="itemPrebook"
          ${item.prebook ? 'checked' : ''}
          ${item.cat === 'Pizza' ? 'disabled' : ''}
        >

        Enable Pre-order
      </label>

      ${
        item.cat === 'Pizza'
          ? `
            <p>
              ⚠️ Pizza items cannot use pre-order.
            </p>
          `
          : `
            <p>
              Pre-order timing is controlled from
              <b>Delivery & Settings</b>.
            </p>
          `
      }

      <br>

      <button
        class="btn"
        onclick="saveItem()"
      >
        💾 ${item.id ? 'Update Item' : 'Add Item'}
      </button>

    </div>
  `;
}


/* =========================================================
   CATEGORY CHANGE
   ========================================================= */

function categoryChanged() {
  const cat = $('#itemCat').value;
  const checkbox = $('#itemPrebook');

  if (!checkbox) return;

  if (cat === 'Pizza') {
    checkbox.checked = false;
    checkbox.disabled = true;
  } else {
    checkbox.disabled = false;
  }
}


/* =========================================================
   ADD SIZE ROW
   ========================================================= */

function addSizeRow() {
  const box = $('#sizeRows');

  const row = document.createElement('div');

  row.className = 'size-row';

  row.style.display = 'flex';
  row.style.gap = '10px';
  row.style.marginBottom = '8px';

  row.innerHTML = `
    <input
      class="size-name"
      placeholder="Size / option"
    >

    <input
      class="size-price"
      type="number"
      min="0"
      placeholder="Price"
    >

    <button
      type="button"
      onclick="this.parentElement.remove()"
    >
      ×
    </button>
  `;

  box.appendChild(row);
}


/* =========================================================
   UPLOAD IMAGE
   ========================================================= */

async function uploadImage(file) {

  if (!file) return '';

  const form = new FormData();

  form.append('image', file);

  const result = await api('/api/admin/upload', {
    method: 'POST',
    body: form
  });

  return result.url || result.image || result.path || '';
}


/* =========================================================
   SAVE ITEM
   ========================================================= */

async function saveItem() {

  const id = $('#itemId').value.trim();

  const name = $('#itemName').value.trim();
  const cat = $('#itemCat').value;
  const description = $('#itemDescription').value.trim();

  if (!name) {
    notify('Please enter item name.');
    return;
  }

  const rows = [...document.querySelectorAll('.size-row')];

  const sizes = rows
    .map(row => {

      const size =
        row.querySelector('.size-name')?.value.trim();

      const price =
        Number(
          row.querySelector('.size-price')?.value
        );

      return [
        size,
        price
      ];

    })
    .filter(x => x[0] && Number.isFinite(x[1]) && x[1] >= 0);

  if (!sizes.length) {
    notify('Please add at least one valid price.');
    return;
  }

  let prebook =
    $('#itemPrebook')
      ? $('#itemPrebook').checked
      : false;

  /* Pizza is ALWAYS non-prebook */
  if (cat === 'Pizza') {
    prebook = false;
  }

  const minQty =
    Math.max(
      1,
      Number($('#minQty').value || 1)
    );

  const maxQty =
    Math.max(
      minQty,
      Number($('#maxQty').value || 20)
    );

  let image = '';

  const file = $('#itemImage')?.files?.[0];

  try {

    if (file) {
      image = await uploadImage(file);
    }

    const payload = {
      name,
      cat,
      description,
      sizes,
      prebook,
      minQty,
      maxQty
    };

    if (image) {
      payload.image = image;
    }

    if (id) {

      await api(
        '/api/admin/menu/' + encodeURIComponent(id),
        {
          method: 'PUT',
          body: JSON.stringify(payload)
        }
      );

      notify('Item updated successfully.');

    } else {

      await api(
        '/api/admin/menu',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      );

      notify('New item added successfully.');
    }

    menu();

  } catch (err) {

    notify(
      'Could not save item:\n' +
      (err.message || 'Unknown error')
    );
  }
}


/* =========================================================
   TOGGLE PRE-ORDER
   ========================================================= */

async function toggle(id, value) {

  try {

    await api(
      '/api/admin/menu/' + encodeURIComponent(id),
      {
        method: 'PUT',
        body: JSON.stringify({
          prebook: value
        })
      }
    );

    menu();

  } catch (err) {
    notify(err.message);
  }
}


/* =========================================================
   DELETE ITEM
   ========================================================= */

async function deleteItem(id) {

  if (!confirm(
    'Are you sure you want to delete this item?'
  )) {
    return;
  }

  try {

    await api(
      '/api/admin/menu/' + encodeURIComponent(id),
      {
        method: 'DELETE'
      }
    );

    notify('Item deleted.');

    menu();

  } catch (err) {
    notify(err.message);
  }
}


/* =========================================================
   REVIEWS
   ========================================================= */

async function reviews() {

  try {

    const list =
      await api('/api/admin/reviews');

    $('#view').innerHTML = `
      <div class="page-head">
        <div>
          <small>CUSTOMER FEEDBACK</small>
          <h1>Reviews</h1>
        </div>

        <button onclick="reviews()">↻ Refresh</button>
      </div>

      <div class="box">

        <table class="table">

          <thead>
            <tr>
              <th>Name</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            ${(list || []).map(r => `
              <tr>

                <td>${esc(r.name)}</td>

                <td>
                  ${'★'.repeat(Number(r.rating || 0))}
                </td>

                <td>
                  ${esc(r.text)}
                </td>

                <td>
                  ${r.approved ? '🟢 Published' : '🔴 Hidden'}
                </td>

                <td>
                  <button
                    onclick="approve(
                      '${esc(r.id)}',
                      ${!r.approved}
                    )"
                  >
                    ${r.approved ? 'Hide' : 'Publish'}
                  </button>
                </td>

              </tr>
            `).join('')}

          </tbody>

        </table>

      </div>
    `;

  } catch (err) {

    $('#view').innerHTML = `
      <div class="box">
        <h2>Error</h2>
        <p>${esc(err.message)}</p>
      </div>
    `;
  }
}


/* =========================================================
   APPROVE REVIEW
   ========================================================= */

async function approve(id, value) {

  try {

    await api(
      '/api/admin/reviews/' +
      encodeURIComponent(id),
      {
        method: 'PATCH',
        body: JSON.stringify({
          approved: value
        })
      }
    );

    reviews();

  } catch (err) {
    notify(err.message);
  }
}


/* =========================================================
   SETTINGS
   ========================================================= */

async function settings() {

  try {

    const config =
      await api('/api/config');

    const s =
      config.settings || {};

    const d =
      s.delivery || {};

    const base =
      s.base || {};

    const payment =
      s.payment || {};

    const hours =
      s.hours || {};

    const normal =
      hours.normal || {};

    const friday =
      hours.friday || {};

    const prebook =
      s.prebook || {};

    $('#view').innerHTML = `

      <div class="page-head">

        <div>
          <small>SYSTEM SETTINGS</small>
          <h1>Delivery & Settings</h1>
        </div>

        <button onclick="settings()">
          ↻ Reload
        </button>

      </div>


      <!-- DELIVERY -->

      <div class="box">

        <h2>🚚 Delivery Settings</h2>

        <label>
          COD Radius (KM)

          <input
            id="cod"
            type="number"
            step="0.1"
            min="0"
            value="${esc(d.codRadiusKm ?? 1)}"
          >

        </label>

        <label>
          Maximum Delivery Radius (KM)

          <input
            id="max"
            type="number"
            step="0.1"
            min="0"
            value="${esc(d.maxRadiusKm ?? 4)}"
          >

        </label>

        <label>
          Delivery Rate Per Started KM (৳)

          <input
            id="rate"
            type="number"
            step="1"
            min="0"
            value="${esc(d.ratePerKm ?? 10)}"
          >

        </label>

        <p>
          <b>Current rule:</b>
          0–1 KM COD + ৳0.
          Above COD radius up to maximum radius:
          online payment + delivery charge.
        </p>

      </div>


      <!-- BASE -->

      <div class="box">

        <h2>📍 Shop Base Location</h2>

        <label>
          Latitude

          <input
            id="lat"
            type="number"
            step="0.0000001"
            value="${esc(base.lat ?? 23.3022494)}"
          >

        </label>

        <label>
          Longitude

          <input
            id="lng"
            type="number"
            step="0.0000001"
            value="${esc(base.lng ?? 90.9187528)}"
          >

        </label>

      </div>


      <!-- PAYMENT -->

      <div class="box">

        <h2>💳 Payment Settings</h2>

        <label>
          bKash Personal

          <input
            id="bk"
            value="${esc(payment.bkash ?? '01792494275')}"
          >

        </label>

        <label>
          Nagad Personal

          <input
            id="ng"
            value="${esc(payment.nagad ?? '01792494275')}"
          >

        </label>

        <p>
          Payment method: <b>Send Money Only</b>
        </p>

      </div>


      <!-- SHOP HOURS -->

      <div class="box">

        <h2>🕐 Shop Hours</h2>

        <h3>Sun–Thursday</h3>

        <label>
          Opening Hour

          <input
            id="op"
            type="number"
            min="0"
            max="23"
            value="${esc(normal.open ?? 11)}"
          >

        </label>

        <label>
          Closing Hour

          <input
            id="cl"
            type="number"
            min="0"
            max="23"
            value="${esc(normal.close ?? 19)}"
          >

        </label>


        <h3>Friday</h3>

        <label>
          Opening Hour

          <input
            id="fop"
            type="number"
            min="0"
            max="23"
            value="${esc(friday.open ?? 15)}"
          >

        </label>

        <label>
          Closing Hour

          <input
            id="fcl"
            type="number"
            min="0"
            max="23"
            value="${esc(friday.close ?? 21)}"
          >

        </label>

        <p>
          <b>Free / Normal Order Window:</b><br>
          Shop opening + 1 hour →
          Shop closing − 1 hour
        </p>

      </div>


      <!-- PREBOOK -->

      <div class="box">

        <h2>📅 Pre-order Settings</h2>

        <label>

          <input
            type="checkbox"
            id="preEnabled"
            ${prebook.enabled !== false ? 'checked' : ''}
          >

          Enable Pre-order System

        </label>

        <label>
          Minimum Advance Hours

          <input
            id="preMin"
            type="number"
            min="1"
            max="168"
            value="${esc(prebook.minHours ?? 5)}"
          >

        </label>

        <label>
          Maximum Advance Hours

          <input
            id="preMax"
            type="number"
            min="1"
            max="168"
            value="${esc(prebook.maxHours ?? 12)}"
          >

        </label>

        <p>
          Example: If minimum is 5 hours,
          a customer cannot select a pre-order
          time less than 5 hours from now.
        </p>

      </div>


      <div class="box">

        <button
          class="btn"
          onclick="saveSet()"
        >
          💾 Save All Settings
        </button>

      </div>

    `;

  } catch (err) {

    $('#view').innerHTML = `
      <div class="box">
        <h2>Error loading settings</h2>
        <p>${esc(err.message)}</p>
      </div>
    `;
  }
}


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

async function saveSet() {

  try {

    const config =
      await api('/api/config');

    const s =
      config.settings || {};

    const codRadius =
      Number($('#cod').value);

    const maxRadius =
      Number($('#max').value);

    const rate =
      Number($('#rate').value);

    if (
      !Number.isFinite(codRadius) ||
      !Number.isFinite(maxRadius) ||
      !Number.isFinite(rate)
    ) {
      notify('Invalid delivery settings.');
      return;
    }

    if (codRadius > maxRadius) {
      notify(
        'COD radius cannot be greater than maximum delivery radius.'
      );
      return;
    }


    const minPre =
      Number($('#preMin').value);

    const maxPre =
      Number($('#preMax').value);

    if (
      !Number.isFinite(minPre) ||
      !Number.isFinite(maxPre) ||
      minPre < 1 ||
      maxPre < minPre
    ) {
      notify(
        'Invalid pre-order hours.'
      );
      return;
    }


    const open =
      Number($('#op').value);

    const close =
      Number($('#cl').value);

    const fridayOpen =
      Number($('#fop').value);

    const fridayClose =
      Number($('#fcl').value);


    const settingsPayload = {

      ...s,

      delivery: {
        ...(s.delivery || {}),
        codRadiusKm: codRadius,
        maxRadiusKm: maxRadius,
        ratePerKm: rate,
        codCharge: 0
      },

      base: {
        ...(s.base || {}),
        lat: Number($('#lat').value),
        lng: Number($('#lng').value)
      },

      payment: {
        ...(s.payment || {}),
        bkash: $('#bk').value.trim(),
        nagad: $('#ng').value.trim()
      },

      hours: {
        normal: {
          open,
          close
        },

        friday: {
          open: fridayOpen,
          close: fridayClose
        }
      },

      prebook: {
        ...(s.prebook || {}),
        enabled: $('#preEnabled').checked,
        minHours: minPre,
        maxHours: maxPre
      }

    };


    await api('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsPayload)
    });

    notify(
      'All settings saved successfully.'
    );

    settings();

  } catch (err) {

    notify(
      'Could not save settings:\n' +
      (err.message || 'Unknown error')
    );
  }
}


/* =========================================================
   INITIAL LOAD
   ========================================================= */

if (T) {
  start();
} else {

  if ($('#app')) {
    $('#app').style.display = 'none';
  }

  if ($('#login')) {
    $('#login').style.display = 'grid';
  }
}
