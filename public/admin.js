'use strict';

/* =========================================================
   CHEF SIFAT'S KITCHEN
   ADMIN PANEL
   Compatible with current server.js
========================================================= */

let T = localStorage.getItem('cskAdmin') || '';

const $ = id => document.querySelector(id);


/* =========================================================
   HELPERS
========================================================= */

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}


function money(value) {
  return '৳' + Number(value || 0).toLocaleString('en-BD');
}


function notify(message) {
  alert(message);
}


function statusLabel(status) {

  const map = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };

  return map[status] || status || 'Pending';
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

  return statuses.map(([value, label]) => `
    <option
      value="${value}"
      ${value === current ? 'selected' : ''}
    >
      ${label}
    </option>
  `).join('');
}


/* =========================================================
   API
========================================================= */

async function api(url, options = {}) {

  const headers = {
    ...(options.headers || {})
  };

  if (T) {
    headers.Authorization = 'Bearer ' + T;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store'
  });


  if (response.status === 401) {

    logout();

    throw new Error(
      'Admin session expired. Please login again.'
    );
  }


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
      'Request failed.'
    );
  }


  return data;
}


/* =========================================================
   LOGIN
========================================================= */

async function login() {

  const username =
    $('#u')?.value.trim();

  const password =
    $('#p')?.value || '';

  const errorBox =
    $('#e');


  if (errorBox) {
    errorBox.textContent = '';
  }


  if (!username || !password) {

    if (errorBox) {
      errorBox.textContent =
        'Enter username and password.';
    }

    return;
  }


  try {

    const response =
      await fetch(
        '/api/admin/login',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({
              username,
              password
            })
        }
      );


    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }


    if (
      !response.ok ||
      !data.token
    ) {

      if (errorBox) {
        errorBox.textContent =
          data.message ||
          data.error ||
          'Login failed.';
      }

      return;
    }


    T = data.token;

    localStorage.setItem(
      'cskAdmin',
      T
    );


    start();


  } catch (error) {

    if (errorBox) {
      errorBox.textContent =
        error.message ||
        'Unable to connect to server.';
    }
  }
}


/* =========================================================
   START
========================================================= */

function start() {

  const loginBox =
    $('#login');

  const app =
    $('#app');


  if (loginBox) {
    loginBox.style.display = 'none';
  }


  if (app) {
    app.style.display = 'grid';
  }


  dash();
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

  localStorage.removeItem(
    'cskAdmin'
  );

  T = '';


  const app =
    $('#app');

  const loginBox =
    $('#login');


  if (app) {
    app.style.display = 'none';
  }


  if (loginBox) {
    loginBox.style.display = 'grid';
  }


  if ($('#u')) {
    $('#u').value = '';
  }

  if ($('#p')) {
    $('#p').value = '';
  }
}


/* =========================================================
   DASHBOARD
========================================================= */

async function dash() {

  try {

    const data =
      await api(
        '/api/admin/dashboard'
      );

    const stats =
      data.stats || {};


    $('#view').innerHTML = `

      <div class="page-head">

        <div>
          <small>ADMIN PANEL</small>
          <h1>Dashboard</h1>
        </div>

        <button onclick="dash()">
          ↻ Refresh
        </button>

      </div>


      <div class="cards">

        <div class="card">
          <span>Total Orders</span>
          <b>${esc(stats.orders || 0)}</b>
        </div>

        <div class="card">
          <span>Pending Orders</span>
          <b>${esc(stats.pendingOrders || 0)}</b>
        </div>

        <div class="card">
          <span>Customers</span>
          <b>${esc(stats.customers || 0)}</b>
        </div>

        <div class="card">
          <span>Menu Items</span>
          <b>${esc(stats.menuItems || 0)}</b>
        </div>

        <div class="card">
          <span>Reviews</span>
          <b>${esc(stats.reviews || 0)}</b>
        </div>

      </div>


      <div class="box">

        <h2>Quick Actions</h2>

        <div class="quick-actions">

          <button onclick="orders()">
            📦 Orders
          </button>

          <button onclick="menu()">
            🍕 Manage Menu
          </button>

          <button onclick="addItem()">
            ➕ Add Item
          </button>

          <button onclick="settings()">
            ⚙️ Settings
          </button>

          <button onclick="reviews()">
            ⭐ Reviews
          </button>

          <button onclick="customers()">
            👥 Customers
          </button>

        </div>

      </div>

    `;

  } catch (error) {

    showError(
      'Dashboard',
      error.message
    );
  }
}


/* =========================================================
   ERROR
========================================================= */

function showError(title, message) {

  $('#view').innerHTML = `

    <div class="box">

      <h2>${esc(title)}</h2>

      <p>
        ${esc(message)}
      </p>

      <button onclick="dash()">
        Back to Dashboard
      </button>

    </div>

  `;
}


/* =========================================================
   ORDERS
========================================================= */

async function orders() {

  try {

    const data =
      await api(
        '/api/admin/orders'
      );

    const list =
      Array.isArray(data.orders)
        ? data.orders
        : [];


    $('#view').innerHTML = `

      <div class="page-head">

        <div>
          <small>ORDER MANAGEMENT</small>
          <h1>Orders</h1>
        </div>

        <button onclick="orders()">
          ↻ Refresh
        </button>

      </div>


      <div class="box">

        ${
          !list.length
            ? '<p>No orders found.</p>'
            : `
              <div style="overflow-x:auto">

                <table class="table">

                  <thead>

                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Delivery</th>
                      <th>Payment</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>

                  </thead>

                  <tbody>

                    ${list.map(order => {

                      const address =
                        typeof order.address === 'object'
                          ? [
                              order.address.house,
                              order.address.road,
                              order.address.mapAddress
                            ]
                              .filter(Boolean)
                              .join(', ')
                          : order.address || '';


                      return `

                        <tr>

                          <td>

                            <b>
                              ${esc(order.id)}
                            </b>

                            <br>

                            <small>
                              ${
                                order.createdAt
                                  ? new Date(
                                      order.createdAt
                                    ).toLocaleString()
                                  : ''
                              }
                            </small>

                            ${
                              order.deliveryTime
                                ? `
                                  <br>
                                  <small>
                                    Delivery:
                                    ${new Date(
                                      order.deliveryTime
                                    ).toLocaleString()}
                                  </small>
                                `
                                : ''
                            }

                          </td>


                          <td>

                            <b>
                              ${esc(order.name)}
                            </b>

                            <br>

                            ${esc(order.phone)}

                            <br>

                            <small>
                              ${esc(
                                order.customerEmail ||
                                order.email ||
                                ''
                              )}
                            </small>

                          </td>


                          <td>

                            ${(order.items || [])
                              .map(item => `
                                ${esc(item.name)}
                                × ${esc(item.qty)}
                                ${
                                  item.choice
                                    ? `(${esc(item.choice)})`
                                    : ''
                                }
                                <br>
                              `)
                              .join('')}

                          </td>


                          <td>

                            <b>
                              ${esc(
                                order.distanceKm ??
                                0
                              )} km
                            </b>

                            <br>

                            ${esc(address)}

                            ${
                              Number.isFinite(
                                Number(order.lat)
                              ) &&
                              Number.isFinite(
                                Number(order.lng)
                              )
                                ? `
                                  <br>
                                  <a
                                    target="_blank"
                                    rel="noopener"
                                    href="https://www.google.com/maps?q=${order.lat},${order.lng}"
                                  >
                                    📍 Open Map
                                  </a>
                                `
                                : ''
                            }

                            <br>

                            <small>
                              Delivery:
                              ${money(
                                order.deliveryCharge
                              )}
                            </small>

                          </td>


                          <td>

                            <b>
                              ${esc(
                                order.paymentMethod ||
                                ''
                              )}
                            </b>

                            ${
                              order.transactionId
                                ? `
                                  <br>
                                  <small>
                                    TXN:
                                    ${esc(
                                      order.transactionId
                                    )}
                                  </small>
                                `
                                : ''
                            }

                          </td>


                          <td>

                            <b>
                              ${money(order.total)}
                            </b>

                            <br>

                            <small>
                              Subtotal:
                              ${money(order.subtotal)}
                            </small>

                          </td>


                          <td>

                            <select
                              onchange="
                                updateOrderStatus(
                                  '${esc(order.id)}',
                                  this.value
                                )
                              "
                            >

                              ${statusOptions(
                                order.status
                              )}

                            </select>

                          </td>

                        </tr>

                      `;

                    }).join('')}

                  </tbody>

                </table>

              </div>
            `
        }

      </div>

    `;

  } catch (error) {

    showError(
      'Error Loading Orders',
      error.message
    );
  }
}


/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

async function updateOrderStatus(
  id,
  value
) {

  try {

    await api(
      '/api/admin/orders/' +
      encodeURIComponent(id),
      {
        method: 'PATCH',

        body:
          JSON.stringify({
            status: value
          })
      }
    );


    notify(
      'Order status updated successfully.'
    );


  } catch (error) {

    notify(
      error.message
    );

    orders();
  }
}


/* Backward compatibility */
async function status(id, value) {
  return updateOrderStatus(id, value);
}


/* =========================================================
   MENU
========================================================= */

async function menu() {

  try {

    const data =
      await api(
        '/api/admin/menu'
      );

    const list =
      Array.isArray(data.menu)
        ? data.menu
        : [];


    $('#view').innerHTML = `

      <div class="page-head">

        <div>
          <small>MENU MANAGEMENT</small>
          <h1>Menu</h1>
        </div>

        <div>

          <button onclick="addItem()">
            ➕ Add Item
          </button>

          <button onclick="menu()">
            ↻ Refresh
          </button>

        </div>

      </div>


      <div class="box">

        ${
          !list.length
            ? `
              <p>
                No menu items found.
              </p>
            `
            : `
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

                    ${list.map(item => {

                      const isPizza =
                        String(item.cat || '')
                          .toLowerCase() ===
                        'pizza';


                      const sizes =
                        Array.isArray(item.sizes)
                          ? item.sizes
                          : [];


                      return `

                        <tr>

                          <td>

                            ${
                              item.image
                                ? `
                                  <img
                                    src="${esc(item.image)}"
                                    alt="${esc(item.name)}"
                                    style="
                                      width:80px;
                                      height:60px;
                                      object-fit:cover;
                                      border-radius:8px;
                                    "
                                  >
                                `
                                : 'No image'
                            }

                          </td>


                          <td>

                            <b>
                              ${esc(item.name)}
                            </b>

                            ${
                              item.description
                                ? `
                                  <br>
                                  <small>
                                    ${esc(
                                      item.description
                                    )}
                                  </small>
                                `
                                : ''
                            }

                          </td>


                          <td>
                            ${esc(item.cat)}
                          </td>


                          <td>

                            ${
                              isPizza
                                ? `
                                  ❌ OFF
                                  <br>
                                  <small>
                                    Pizza cannot be pre-order
                                  </small>
                                `
                                : `
                                  <button
                                    onclick="
                                      togglePrebook(
                                        '${esc(item.id)}',
                                        ${!item.prebook}
                                      )
                                    "
                                  >
                                    ${
                                      item.prebook
                                        ? '🟢 ON'
                                        : '🔴 OFF'
                                    }
                                  </button>
                                `
                            }

                          </td>


                          <td>

                            ${
                              sizes.length
                                ? sizes.map(size => `
                                    ${esc(size[0])}:
                                    ${money(size[1])}
                                    <br>
                                  `).join('')
                                : money(item.price)
                            }

                          </td>


                          <td>

                            <button
                              onclick='editItem(${JSON.stringify(item)})'
                            >
                              ✏️ Edit
                            </button>

                            <button
                              onclick="
                                deleteItem(
                                  '${esc(item.id)}'
                                )
                              "
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
            `
        }

      </div>

    `;

  } catch (error) {

    showError(
      'Error Loading Menu',
      error.message
    );
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

  const sizes =
    Array.isArray(item.sizes) &&
    item.sizes.length
      ? item.sizes
      : [
          [
            item.choice || '',
            item.price || ''
          ]
        ];


  $('#view').innerHTML = `

    <div class="page-head">

      <div>
        <small>MENU ITEM</small>

        <h1>
          ${
            item.id
              ? 'Edit Item'
              : 'Add New Item'
          }
        </h1>
      </div>

      <button onclick="menu()">
        ← Back to Menu
      </button>

    </div>


    <div class="box">

      <input
        type="hidden"
        id="itemId"
        value="${esc(item.id)}"
      >


      <label>
        Item Name

        <input
          id="itemName"
          value="${esc(item.name)}"
          placeholder="Item name"
        >
      </label>


      <label>
        Category

        <select
          id="itemCat"
          onchange="categoryChanged()"
        >

          ${[
            'Pizza',
            'Momo',
            'Continental',
            'Kacchi',
            'Fast Food',
            'Dessert',
            'Beverage'
          ].map(category => `
            <option
              value="${esc(category)}"
              ${
                String(item.cat || '').toLowerCase() ===
                category.toLowerCase()
                  ? 'selected'
                  : ''
              }
            >
              ${esc(category)}
            </option>
          `).join('')}

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
          accept="image/jpeg,image/png,image/webp,image/gif"
        >

        ${
          item.image
            ? `
              <br>

              <img
                src="${esc(item.image)}"
                alt="${esc(item.name)}"
                style="
                  width:140px;
                  height:100px;
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


      <h3>
        Prices / Sizes
      </h3>


      <div id="sizeRows">

        ${sizes.map(size => `

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
              placeholder="Size / Option"
              value="${esc(size[0])}"
            >

            <input
              class="size-price"
              type="number"
              min="0"
              step="1"
              placeholder="Price"
              value="${esc(size[1])}"
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


      <button
        type="button"
        onclick="addSizeRow()"
      >
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


      <h3>
        Pre-order
      </h3>


      <label>

        <input
          type="checkbox"
          id="itemPrebook"
          ${
            item.prebook
              ? 'checked'
              : ''
          }
          ${
            String(item.cat || '').toLowerCase() ===
            'pizza'
              ? 'disabled'
              : ''
          }
        >

        Enable Pre-order

      </label>


      <p>

        ${
          String(item.cat || '').toLowerCase() ===
          'pizza'
            ? `
              ⚠️ Pizza is always
              <b>Pre-order OFF</b>.
            `
            : `
              Pre-order timing follows
              the shop settings.
            `
        }

      </p>


      <button
        class="btn"
        type="button"
        onclick="saveItem()"
      >
        💾
        ${
          item.id
            ? 'Update Item'
            : 'Add Item'
        }
      </button>

    </div>

  `;
}


/* =========================================================
   CATEGORY CHANGE
========================================================= */

function categoryChanged() {

  const category =
    $('#itemCat')?.value || '';

  const checkbox =
    $('#itemPrebook');


  if (!checkbox) {
    return;
  }


  if (
    category.toLowerCase() ===
    'pizza'
  ) {

    checkbox.checked = false;

    checkbox.disabled = true;

  } else {

    checkbox.disabled = false;
  }
}


/* =========================================================
   ADD SIZE
========================================================= */

function addSizeRow() {

  const box =
    $('#sizeRows');

  if (!box) {
    return;
  }


  const row =
    document.createElement('div');

  row.className =
    'size-row';


  row.style.display =
    'flex';

  row.style.gap =
    '10px';

  row.style.marginBottom =
    '8px';


  row.innerHTML = `

    <input
      class="size-name"
      placeholder="Size / Option"
    >

    <input
      class="size-price"
      type="number"
      min="0"
      step="1"
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
   IMAGE UPLOAD
========================================================= */

async function uploadImage(file) {

  if (!file) {
    return '';
  }


  const form =
    new FormData();

  form.append(
    'image',
    file
  );


  const result =
    await api(
      '/api/admin/upload-image',
      {
        method: 'POST',
        body: form
      }
    );


  return (
    result.url ||
    ''
  );
}


/* =========================================================
   SAVE ITEM
========================================================= */

async function saveItem() {

  const id =
    $('#itemId')?.value.trim() || '';

  const name =
    $('#itemName')?.value.trim() || '';

  const cat =
    $('#itemCat')?.value || '';

  const description =
    $('#itemDescription')?.value.trim() || '';


  if (!name) {

    notify(
      'Please enter item name.'
    );

    return;
  }


  const rows =
    [
      ...document.querySelectorAll(
        '#sizeRows .size-row'
      )
    ];


  const sizes =
    rows
      .map(row => {

        const size =
          row.querySelector(
            '.size-name'
          )?.value.trim() || '';


        const price =
          Number(
            row.querySelector(
              '.size-price'
            )?.value
          );


        return [
          size,
          price
        ];

      })
      .filter(
        x =>
          x[0] &&
          Number.isFinite(x[1]) &&
          x[1] > 0
      );


  if (!sizes.length) {

    notify(
      'Please add at least one valid price.'
    );

    return;
  }


  let prebook =
    Boolean(
      $('#itemPrebook')?.checked
    );


  /* Pizza NEVER pre-book */

  if (
    cat.toLowerCase() ===
    'pizza'
  ) {
    prebook = false;
  }


  const minQty =
    Math.max(
      1,
      Number(
        $('#minQty')?.value || 1
      )
    );


  const maxQty =
    Math.max(
      minQty,
      Number(
        $('#maxQty')?.value || 20
      )
    );


  let image =
    '';


  try {

    const file =
      $('#itemImage')?.files?.[0];


    if (file) {

      image =
        await uploadImage(file);
    }


    /*
      Current server stores a primary
      price plus sizes.
    */

    const primaryPrice =
      Number(sizes[0][1]);


    const payload = {

      id:
        id || undefined,

      name,

      cat,

      description,

      price:
        primaryPrice,

      sizes,

      choice:
        sizes[0][0] || '',

      minQty,

      maxQty,

      prebook,

      active:
        true

    };


    if (image) {
      payload.image =
        image;
    }


    /*
      Server currently has:
      POST create
      PUT entire menu

      So we always retrieve the
      current menu and save the
      complete updated array.
    */

    const current =
      await api(
        '/api/admin/menu'
      );


    let list =
      Array.isArray(current.menu)
        ? current.menu
        : [];


    if (id) {

      const index =
        list.findIndex(
          item =>
            String(item.id) ===
            String(id)
        );


      if (index === -1) {

        throw new Error(
          'Menu item not found.'
        );
      }


      list[index] = {
        ...list[index],
        ...payload,
        id:
          list[index].id
      };


    } else {

      list.push(payload);
    }


    await api(
      '/api/admin/menu',
      {
        method: 'PUT',

        body:
          JSON.stringify({
            menu: list
          })
      }
    );


    notify(
      id
        ? 'Item updated successfully.'
        : 'New item added successfully.'
    );


    menu();


  } catch (error) {

    notify(
      'Could not save item:\n' +
      (
        error.message ||
        'Unknown error'
      )
    );
  }
}


/* =========================================================
   TOGGLE PREBOOK
========================================================= */

async function togglePrebook(
  id,
  value
) {

  try {

    const current =
      await api(
        '/api/admin/menu'
      );


    const list =
      Array.isArray(current.menu)
        ? current.menu
        : [];


    const index =
      list.findIndex(
        item =>
          String(item.id) ===
          String(id)
      );


    if (index === -1) {

      throw new Error(
        'Menu item not found.'
      );
    }


    const category =
      String(
        list[index].cat || ''
      ).toLowerCase();


    if (category === 'pizza') {

      list[index].prebook =
        false;

    } else {

      list[index].prebook =
        Boolean(value);
    }


    await api(
      '/api/admin/menu',
      {
        method: 'PUT',

        body:
          JSON.stringify({
            menu: list
          })
      }
    );


    menu();


  } catch (error) {

    notify(
      error.message
    );
  }
}


/* Backward compatibility */
async function toggle(id, value) {
  return togglePrebook(id, value);
}


/* =========================================================
   DELETE ITEM
========================================================= */

async function deleteItem(id) {

  if (
    !confirm(
      'Are you sure you want to delete this menu item?'
    )
  ) {
    return;
  }


  try {

    await api(
      '/api/admin/menu/' +
      encodeURIComponent(id),
      {
        method: 'DELETE'
      }
    );


    notify(
      'Item deleted successfully.'
    );


    menu();


  } catch (error) {

    notify(
      error.message
    );
  }
}


/* =========================================================
   REVIEWS
========================================================= */

async function reviews() {

  try {

    const data =
      await api(
        '/api/admin/reviews'
      );


    const list =
      Array.isArray(data.reviews)
        ? data.reviews
        : [];


    $('#view').innerHTML = `

      <div class="page-head">

        <div>
          <small>CUSTOMER FEEDBACK</small>
          <h1>Reviews</h1>
        </div>

        <button onclick="reviews()">
          ↻ Refresh
        </button>

      </div>


      <div class="box">

        ${
          !list.length
            ? '<p>No reviews found.</p>'
            : `
              <div style="overflow-x:auto">

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

                    ${list.map(review => `

                      <tr>

                        <td>
                          ${esc(review.name)}
                        </td>


                        <td>
                          ${
                            '★'.repeat(
                              Number(
                                review.rating || 0
                              )
                            )
                          }
                        </td>


                        <td>
                          ${esc(
                            review.comment ||
                            review.text ||
                            ''
                          )}
                        </td>


                        <td>
                          ${
                            review.approved
                              ? '🟢 Published'
                              : '🔴 Hidden'
                          }
                        </td>


                        <td>

                          <button
                            onclick="
                              approve(
                                '${esc(review.id)}',
                                ${!review.approved}
                              )
                            "
                          >
                            ${
                              review.approved
                                ? 'Hide'
                                : 'Publish'
                            }
                          </button>

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

    showError(
      'Error Loading Reviews',
      error.message
    );
  }
}


/* =========================================================
   APPROVE REVIEW
========================================================= */

async function approve(
  id,
  value
) {

  try {

    await api(
      '/api/admin/reviews/' +
      encodeURIComponent(id),
      {
        method: 'PATCH',

        body:
          JSON.stringify({
            approved:
              Boolean(value)
          })
      }
    );


    reviews();


  } catch (error) {

    notify(
      error.message
    );
  }
}


/* =========================================================
   CUSTOMERS
========================================================= */

async function customers() {

  try {

    const data =
      await api(
        '/api/admin/customers'
      );


    const list =
      Array.isArray(data.customers)
        ? data.customers
        : [];


    $('#view').innerHTML = `

      <div class="page-head">

        <div>
          <small>CUSTOMER MANAGEMENT</small>
          <h1>Customers</h1>
        </div>

        <button onclick="customers()">
          ↻ Refresh
        </button>

      </div>


      <div class="box">

        ${
          !list.length
            ? '<p>No customers registered yet.</p>'
            : `
              <div style="overflow-x:auto">

                <table class="table">

                  <thead>

                    <tr>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>

                  </thead>


                  <tbody>

                    ${list.map(customer => `

                      <tr>

                        <td>
                          <b>
                            ${esc(customer.name)}
                          </b>
                        </td>

                        <td>
                          ${esc(customer.phone)}
                        </td>

                        <td>
                          ${esc(customer.email)}
                        </td>

                        <td>
                          ${
                            customer.createdAt
                              ? new Date(
                                  customer.createdAt
                                ).toLocaleDateString()
                              : ''
                          }
                        </td>

                        <td>

                          <button
                            onclick="
                              customerDetails(
                                '${esc(customer.id)}'
                              )
                            "
                          >
                            View Orders
                          </button>

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

    showError(
      'Error Loading Customers',
      error.message
    );
  }
}


/* =========================================================
   CUSTOMER DETAILS
========================================================= */

async function customerDetails(id) {

  try {

    const data =
      await api(
        '/api/admin/customers/' +
        encodeURIComponent(id)
      );


    const customer =
      data.customer || {};


    const list =
      Array.isArray(data.orders)
        ? data.orders
        : [];


    $('#view').innerHTML = `

      <div class="page-head">

        <div>
          <small>CUSTOMER</small>
          <h1>
            ${esc(customer.name)}
          </h1>
        </div>

        <button onclick="customers()">
          ← Back
        </button>

      </div>


      <div class="box">

        <p>
          <b>Mobile:</b>
          ${esc(customer.phone)}
        </p>

        <p>
          <b>Email:</b>
          ${esc(customer.email)}
        </p>

      </div>


      <div class="box">

        <h2>
          Order History
        </h2>

        ${
          !list.length
            ? '<p>No orders yet.</p>'
            : `
              <div style="overflow-x:auto">

                <table class="table">

                  <thead>

                    <tr>
                      <th>Order</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>

                  </thead>

                  <tbody>

                    ${list.map(order => `

                      <tr>

                        <td>
                          ${esc(order.id)}
                        </td>

                        <td>
                          ${
                            order.createdAt
                              ? new Date(
                                  order.createdAt
                                ).toLocaleString()
                              : ''
                          }
                        </td>

                        <td>
                          ${money(order.total)}
                        </td>

                        <td>
                          ${esc(
                            statusLabel(
                              order.status
                            )
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

    showError(
      'Customer Details',
      error.message
    );
  }
}


/* =========================================================
   SETTINGS
========================================================= */

async function settings() {

  try {

    const data =
      await api(
        '/api/admin/settings'
      );


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

        <h2>
          🚚 Delivery Settings
        </h2>


        <label>

          COD Radius (KM)

          <input
            id="cod"
            type="number"
            min="0"
            step="0.1"
            value="${esc(
              delivery.codRadiusKm ?? 1
            )}"
          >

        </label>


        <label>

          Maximum Delivery Radius (KM)

          <input
            id="max"
            type="number"
            min="0"
            step="0.1"
            value="${esc(
              delivery.maxRadiusKm ?? 4
            )}"
          >

        </label>


        <label>

          Delivery Rate Per Started KM

          <input
            id="rate"
            type="number"
            min="0"
            step="1"
            value="${esc(
              delivery.ratePerKm ?? 10
            )}"
          >

        </label>


        <p>
          0–1 KM:
          <b>COD + ৳0</b>
          <br>

          Above COD radius:
          <b>Online Payment + Delivery Charge</b>
          <br>

          Outside maximum radius:
          <b>Order unavailable</b>
        </p>

      </div>


      <!-- BASE LOCATION -->

      <div class="box">

        <h2>
          📍 Shop Base Location
        </h2>


        <label>

          Base Name

          <input
            id="baseName"
            value="${esc(
              delivery.baseName ||
              'Kahalthuri Hamidia High School'
            )}"
          >

        </label>


        <label>

          Latitude

          <input
            id="lat"
            type="number"
            step="0.0000001"
            value="${esc(
              delivery.baseLat ??
              23.3022494
            )}"
          >

        </label>


        <label>

          Longitude

          <input
            id="lng"
            type="number"
            step="0.0000001"
            value="${esc(
              delivery.baseLng ??
              90.9187528
            )}"
          >

        </label>

      </div>


      <!-- PAYMENT -->

      <div class="box">

        <h2>
          💳 Payment Settings
        </h2>


        <label>

          bKash Personal

          <input
            id="bk"
            value="${esc(
              payment.bkash ||
              '01792494275'
            )}"
          >

        </label>


        <label>

          Nagad Personal

          <input
            id="ng"
            value="${esc(
              payment.nagad ||
              '01792494275'
            )}"
          >

        </label>


        <p>
          Payment method:
          <b>Send Money Only</b>
        </p>

      </div>


      <!-- SHOP HOURS -->

      <div class="box">

        <h2>
          🕐 Shop Hours
        </h2>


        <h3>
          Sunday – Thursday
        </h3>


        <label>

          Opening Hour

          <input
            id="op"
            type="number"
            min="0"
            max="23"
            value="${esc(
              normal.open ?? 11
            )}"
          >

        </label>


        <label>

          Closing Hour

          <input
            id="cl"
            type="number"
            min="0"
            max="23"
            value="${esc(
              normal.close ?? 19
            )}"
          >

        </label>


        <h3>
          Friday
        </h3>


        <label>

          Opening Hour

          <input
            id="fop"
            type="number"
            min="0"
            max="23"
            value="${esc(
              friday.open ?? 15
            )}"
          >

        </label>


        <label>

          Closing Hour

          <input
            id="fcl"
            type="number"
            min="0"
            max="23"
            value="${esc(
              friday.close ?? 21
            )}"
          >

        </label>


        <p>

          Customer order window:

          <br>

          <b>
            Opening + 1 hour
            →
            Closing − 1 hour
          </b>

          <br><br>

          Sun–Thu:
          <b>12:00 PM – 6:00 PM</b>

          <br>

          Friday:
          <b>4:00 PM – 8:00 PM</b>

        </p>

      </div>


      <!-- PREBOOK -->

      <div class="box">

        <h2>
          📅 Pre-order Settings
        </h2>


        <label>

          <input
            type="checkbox"
            id="preEnabled"
            ${
              prebook.enabled !== false
                ? 'checked'
                : ''
            }
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
            value="${esc(
              prebook.minHours ?? 5
            )}"
          >

        </label>


        <label>

          Maximum Advance Hours

          <input
            id="preMax"
            type="number"
            min="1"
            max="168"
            value="${esc(
              prebook.maxHours ?? 12
            )}"
          >

        </label>


        <p>
          These values are retained for
          compatibility with the backend.
          Pre-order time selection is
          controlled by shop hours.
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

  } catch (error) {

    showError(
      'Error Loading Settings',
      error.message
    );
  }
}


/* =========================================================
   SAVE SETTINGS
========================================================= */

async function saveSet() {

  try {

    const current =
      await api(
        '/api/admin/settings'
      );


    const s =
      current.settings || {};


    const cod =
      Number(
        $('#cod').value
      );


    const max =
      Number(
        $('#max').value
      );


    const rate =
      Number(
        $('#rate').value
      );


    const lat =
      Number(
        $('#lat').value
      );


    const lng =
      Number(
        $('#lng').value
      );


    const open =
      Number(
        $('#op').value
      );


    const close =
      Number(
        $('#cl').value
      );


    const fridayOpen =
      Number(
        $('#fop').value
      );


    const fridayClose =
      Number(
        $('#fcl').value
      );


    const preMin =
      Number(
        $('#preMin').value
      );


    const preMax =
      Number(
        $('#preMax').value
      );


    if (
      !Number.isFinite(cod) ||
      !Number.isFinite(max) ||
      !Number.isFinite(rate)
    ) {

      notify(
        'Invalid delivery settings.'
      );

      return;
    }


    if (cod > max) {

      notify(
        'COD radius cannot be greater than maximum radius.'
      );

      return;
    }


    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {

      notify(
        'Invalid base location.'
      );

      return;
    }


    if (
      !Number.isInteger(open) ||
      !Number.isInteger(close) ||
      open < 0 ||
      close > 23 ||
      close <= open
    ) {

      notify(
        'Invalid normal shop hours.'
      );

      return;
    }


    if (
      !Number.isInteger(fridayOpen) ||
      !Number.isInteger(fridayClose) ||
      fridayOpen < 0 ||
      fridayClose > 23 ||
      fridayClose <= fridayOpen
    ) {

      notify(
        'Invalid Friday shop hours.'
      );

      return;
    }


    if (
      !Number.isFinite(preMin) ||
      !Number.isFinite(preMax) ||
      preMin < 1 ||
      preMax < preMin
    ) {

      notify(
        'Invalid pre-order hours.'
      );

      return;
    }


    const payload = {

      ...s,


      delivery: {

        ...(s.delivery || {}),

        baseLat:
          lat,

        baseLng:
          lng,

        baseName:
          $('#baseName')
            .value
            .trim(),

        codRadiusKm:
          cod,

        maxRadiusKm:
          max,

        ratePerKm:
          rate,

        codCharge:
          0

      },


      payment: {

        ...(s.payment || {}),

        bkash:
          $('#bk')
            .value
            .trim(),

        nagad:
          $('#ng')
            .value
            .trim(),

        method:
          'Send Money Only'

      },


      hours: {

        normal: {
          open,
          close
        },

        friday: {
          open:
            fridayOpen,

          close:
            fridayClose
        }

      },


      prebook: {

        ...(s.prebook || {}),

        enabled:
          $('#preEnabled')
            .checked,

        minHours:
          preMin,

        maxHours:
          preMax

      }

    };


    await api(
      '/api/admin/settings',
      {
        method: 'PUT',

        body:
          JSON.stringify(payload)
      }
    );


    notify(
      'All settings saved successfully.'
    );


    settings();


  } catch (error) {

    notify(
      'Could not save settings:\n' +
      error.message
    );
  }
}


/* =========================================================
   ENTER KEY LOGIN
========================================================= */

document.addEventListener(
  'keydown',
  event => {

    if (
      event.key === 'Enter' &&
      $('#login') &&
      $('#login').style.display !== 'none'
    ) {

      login();
    }

  }
);


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.login =
  login;

window.logout =
  logout;

window.start =
  start;

window.dash =
  dash;

window.orders =
  orders;

window.status =
  status;

window.updateOrderStatus =
  updateOrderStatus;

window.menu =
  menu;

window.addItem =
  addItem;

window.editItem =
  editItem;

window.saveItem =
  saveItem;

window.deleteItem =
  deleteItem;

window.toggle =
  toggle;

window.togglePrebook =
  togglePrebook;

window.addSizeRow =
  addSizeRow;

window.categoryChanged =
  categoryChanged;

window.reviews =
  reviews;

window.approve =
  approve;

window.settings =
  settings;

window.saveSet =
  saveSet;

window.customers =
  customers;

window.customerDetails =
  customerDetails;


/* =========================================================
   INITIAL LOAD
========================================================= */

if (T) {

  start();

} else {

  if ($('#app')) {
    $('#app').style.display =
      'none';
  }

  if ($('#login')) {
    $('#login').style.display =
      'grid';
  }
}
