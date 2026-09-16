'use strict';

/* =========================================================
   CHEF SIFAT'S KITCHEN — ADMIN PANEL
   ========================================================= */

const ADMIN_TOKEN_KEY = 'csk_admin_token';

let adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
let currentView = 'dashboard';
let menuData = [];
let settingsData = null;

/* =========================================================
   BASIC HELPERS
   ========================================================= */

const $ = id => document.getElementById(id);

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function money(value) {
  return `৳${Number(value || 0).toLocaleString('en-BD')}`;
}

function formatDate(value) {
  if (!value) return '—';

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return esc(value);
  }

  return d.toLocaleString('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function showApp() {
  const loginBox = $('login');
  const appBox = $('app');

  if (loginBox) loginBox.style.display = 'none';
  if (appBox) appBox.style.display = 'flex';
}

function showLogin() {
  const loginBox = $('login');
  const appBox = $('app');

  if (loginBox) loginBox.style.display = 'flex';
  if (appBox) appBox.style.display = 'none';
}

function setView(html) {
  const view = $('view');

  if (!view) return;

  view.innerHTML = html;
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function errorMessage(error) {
  return error?.message || 'Something went wrong.';
}

/* =========================================================
   API HELPER
   ========================================================= */

async function api(url, options = {}) {
  const opts = {
    ...options,
    headers: {
      ...(options.headers || {})
    }
  };

  if (adminToken) {
    opts.headers.Authorization = `Bearer ${adminToken}`;
  }

  if (
    opts.body &&
    typeof opts.body !== 'string' &&
    !(opts.body instanceof FormData)
  ) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }

  const response = await fetch(url, opts);

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    adminToken = null;
    showLogin();
    throw new Error(data?.error || 'Admin session expired. Please login again.');
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      `Request failed (${response.status})`
    );
  }

  return data;
}

/* =========================================================
   ADMIN LOGIN
   ========================================================= */

async function login() {
  const username = $('u')?.value.trim();
  const password = $('p')?.value || '';
  const errorBox = $('e');

  if (!username || !password) {
    if (errorBox) {
      errorBox.textContent = 'Enter username and password.';
    }
    return;
  }

  if (errorBox) {
    errorBox.textContent = 'Signing in...';
  }

  try {
    const data = await api('/api/admin/login', {
      method: 'POST',
      body: {
        username,
        password
      }
    });

    const token =
      data?.token ||
      data?.accessToken ||
      data?.adminToken;

    if (!token) {
      throw new Error('Login succeeded but no admin token was returned.');
    }

    adminToken = token;

    localStorage.setItem(
      ADMIN_TOKEN_KEY,
      adminToken
    );

    if (errorBox) {
      errorBox.textContent = '';
    }

    showApp();
    await dash();

  } catch (error) {
    if (errorBox) {
      errorBox.textContent = errorMessage(error);
    }
  }
}

/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  adminToken = null;

  showLogin();

  if ($('u')) $('u').value = '';
  if ($('p')) $('p').value = '';
  if ($('e')) $('e').textContent = '';
}

/* =========================================================
   DASHBOARD
   ========================================================= */

async function dash() {
  currentView = 'dashboard';

  setView(`
    <section class="admin-section">
      <div class="page-head">
        <div>
          <small>ADMIN PANEL</small>
          <h1>Dashboard</h1>
          <p>Chef Sifat's Kitchen overview</p>
        </div>
      </div>

      <div id="dashboardLoading" class="loading">
        Loading dashboard...
      </div>

      <div id="dashboardContent"></div>
    </section>
  `);

  try {
    const [ordersResult, menuResult, reviewsResult, customersResult] =
      await Promise.all([
        api('/api/admin/orders'),
        api('/api/admin/menu'),
        api('/api/admin/reviews'),
        api('/api/admin/customers')
      ]);

    const orders =
      ordersResult?.orders ||
      ordersResult?.data ||
      (Array.isArray(ordersResult) ? ordersResult : []);

    const menu =
      menuResult?.menu ||
      menuResult?.data ||
      (Array.isArray(menuResult) ? menuResult : []);

    const reviews =
      reviewsResult?.reviews ||
      reviewsResult?.data ||
      (Array.isArray(reviewsResult) ? reviewsResult : []);

    const customers =
      customersResult?.customers ||
      customersResult?.data ||
      (Array.isArray(customersResult) ? customersResult : []);

    const pendingOrders = orders.filter(
      order =>
        String(order.status || '').toLowerCase() === 'pending'
    ).length;

    const activeMenu = menu.filter(
      item => item.active !== false
    ).length;

    const pendingReviews = reviews.filter(
      review =>
        review.approved === false ||
        review.status === 'pending'
    ).length;

    const totalSales = orders.reduce(
      (sum, order) => {
        const status = String(order.status || '').toLowerCase();

        if (
          status === 'cancelled' ||
          status === 'canceled' ||
          status === 'rejected'
        ) {
          return sum;
        }

        return sum + Number(
          order.total ||
          order.grandTotal ||
          order.amount ||
          0
        );
      },
      0
    );

    const loading = $('dashboardLoading');

    if (loading) {
      loading.style.display = 'none';
    }

    const content = $('dashboardContent');

    if (!content) return;

    content.innerHTML = `
      <div class="stats-grid">

        <div class="stat-card">
          <span>Total Orders</span>
          <strong>${orders.length}</strong>
        </div>

        <div class="stat-card">
          <span>Pending Orders</span>
          <strong>${pendingOrders}</strong>
        </div>

        <div class="stat-card">
          <span>Active Menu Items</span>
          <strong>${activeMenu}</strong>
        </div>

        <div class="stat-card">
          <span>Customers</span>
          <strong>${customers.length}</strong>
        </div>

        <div class="stat-card">
          <span>Pending Reviews</span>
          <strong>${pendingReviews}</strong>
        </div>

        <div class="stat-card">
          <span>Total Order Value</span>
          <strong>${money(totalSales)}</strong>
        </div>

      </div>

      <div class="dashboard-grid">

        <div class="admin-card">
          <h2>Quick Actions</h2>

          <div class="quick-actions">
            <button class="admin-btn" onclick="orders()">
              📦 Orders
            </button>

            <button class="admin-btn" onclick="menu()">
              🍕 Menu
            </button>

            <button class="admin-btn" onclick="customers()">
              👥 Customers
            </button>

            <button class="admin-btn" onclick="reviews()">
              ⭐ Reviews
            </button>

            <button class="admin-btn" onclick="settings()">
              ⚙️ Settings
            </button>
          </div>
        </div>

        <div class="admin-card">
          <h2>Restaurant</h2>

          <p>
            <strong>Chef Sifat's Kitchen</strong>
          </p>

          <p>
            Kahalthuri, Shahedapur-3630,
            Kachua, Chandpur
          </p>

          <p>
            Delivery base:
            Kahalthuri Hamidia High School
          </p>
        </div>

      </div>
    `;
  } catch (error) {
    const loading = $('dashboardLoading');

    if (loading) {
      loading.innerHTML = `
        <div class="error-box">
          ${esc(errorMessage(error))}
        </div>
      `;
    }
  }
}

/* =========================================================
   ORDERS
   ========================================================= */

async function orders() {
  currentView = 'orders';

  setView(`
    <section class="admin-section">

      <div class="page-head">
        <div>
          <small>ORDER MANAGEMENT</small>
          <h1>Orders</h1>
          <p>View and update customer orders.</p>
        </div>

        <button class="admin-btn" onclick="orders()">
          ↻ Refresh
        </button>
      </div>

      <div id="ordersLoading" class="loading">
        Loading orders...
      </div>

      <div id="ordersList"></div>

    </section>
  `);

  try {
    const result = await api('/api/admin/orders');

    const orderList =
      result?.orders ||
      result?.data ||
      (Array.isArray(result) ? result : []);

    const loading = $('ordersLoading');

    if (loading) {
      loading.style.display = 'none';
    }

    const list = $('ordersList');

    if (!list) return;

    if (!orderList.length) {
      list.innerHTML = `
        <div class="empty-box">
          No orders found.
        </div>
      `;
      return;
    }

    list.innerHTML = orderList
      .map(orderCard)
      .join('');

  } catch (error) {
    const loading = $('ordersLoading');

    if (loading) {
      loading.innerHTML = `
        <div class="error-box">
          ${esc(errorMessage(error))}
        </div>
      `;
    }
  }
}

function orderCard(order) {
  const id =
    order.id ||
    order.orderId ||
    order._id ||
    '';

  const status =
    String(order.status || 'pending').toLowerCase();

  const customer =
    order.customer ||
    {};

  const customerName =
    order.customerName ||
    customer.name ||
    order.name ||
    'Customer';

  const phone =
    order.phone ||
    customer.phone ||
    order.mobile ||
    '';

  const items =
    Array.isArray(order.items)
      ? order.items
      : [];

  const total =
    Number(
      order.total ||
      order.grandTotal ||
      order.amount ||
      0
    );

  const deliveryCharge =
    Number(
      order.deliveryCharge ||
      0
    );

  const distance =
    Number(
      order.distanceKm ||
      order.distance ||
      0
    );

  const paymentMethod =
    order.paymentMethod ||
    order.payment ||
    '—';

  const deliveryTime =
    order.deliveryTime ||
    order.orderTime ||
    '';

  const address =
    order.address ||
    order.deliveryAddress ||
    '';

  const note =
    order.note ||
    order.orderNote ||
    '';

  const adminNote =
    order.adminNote ||
    '';

  const itemsHtml = items.length
    ? items.map(item => {

        const name =
          item.name ||
          item.title ||
          'Item';

        const qty =
          Number(item.qty || item.quantity || 1);

        const choice =
          item.choice ||
          item.size ||
          '';

        const price =
          Number(
            item.price ||
            item.unitPrice ||
            0
          );

        return `
          <div class="order-item-row">
            <div>
              <strong>${esc(name)}</strong>

              ${
                choice
                  ? `<small>${esc(choice)}</small>`
                  : ''
              }
            </div>

            <span>
              × ${qty}
            </span>

            <b>
              ${money(price * qty)}
            </b>
          </div>
        `;
      }).join('')
    : '<p>No item information.</p>';

  return `
    <article class="order-card">

      <div class="order-head">

        <div>
          <small>ORDER</small>
          <h2>#${esc(id)}</h2>
          <span>
            ${formatDate(order.createdAt || order.date)}
          </span>
        </div>

        <span class="status-badge status-${esc(status)}">
          ${esc(status.toUpperCase())}
        </span>

      </div>

      <div class="order-columns">

        <div class="order-block">

          <h3>Customer</h3>

          <p>
            <strong>${esc(customerName)}</strong>
          </p>

          <p>
            📞 ${esc(phone || '—')}
          </p>

        </div>

        <div class="order-block">

          <h3>Delivery</h3>

          <p>
            ${esc(address || 'Location coordinates saved')}
          </p>

          ${
            distance
              ? `<p>Distance: ${distance.toFixed(2)} km</p>`
              : ''
          }

          ${
            deliveryTime
              ? `<p>Time: ${formatDate(deliveryTime)}</p>`
              : ''
          }

        </div>

        <div class="order-block">

          <h3>Payment</h3>

          <p>
            Method:
            <strong>${esc(paymentMethod)}</strong>
          </p>

          ${
            order.transactionId
              ? `<p>Transaction: ${esc(order.transactionId)}</p>`
              : ''
          }

          ${
            order.paymentStatus
              ? `<p>Status: ${esc(order.paymentStatus)}</p>`
              : ''
          }

        </div>

      </div>

      <div class="order-items">

        <h3>Items</h3>

        ${itemsHtml}

      </div>

      <div class="order-total">

        <div>
          <span>Delivery</span>
          <b>${money(deliveryCharge)}</b>
        </div>

        <div>
          <strong>Total</strong>
          <strong>${money(total)}</strong>
        </div>

      </div>

      ${
        note
          ? `
            <div class="note-box">
              <strong>Customer Note</strong>
              <p>${esc(note)}</p>
            </div>
          `
          : ''
      }

      <div class="order-actions">

        <label>
          Order Status

          <select id="status-${esc(id)}">
            ${statusOptions(status)}
          </select>
        </label>

        <label>
          Admin Note

          <input
            id="note-${esc(id)}"
            value="${esc(adminNote)}"
            placeholder="Add admin note"
          >
        </label>

        <button
          class="admin-btn"
          onclick="updateOrder('${esc(id)}')"
        >
          Save Order
        </button>

      </div>

    </article>
  `;
}

function statusOptions(current) {
  const statuses = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ];

  return statuses
    .map(status => `
      <option
        value="${status}"
        ${status === current ? 'selected' : ''}
      >
        ${status.replace(/_/g, ' ')}
      </option>
    `)
    .join('');
}

async function updateOrder(id) {
  const statusElement =
    $(`status-${id}`);

  const noteElement =
    $(`note-${id}`);

  const status =
    statusElement?.value ||
    'pending';

  const adminNote =
    noteElement?.value.trim() ||
    '';

  try {
    await api(
      `/api/admin/orders/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: {
          status,
          adminNote
        }
      }
    );

    alert('Order updated successfully.');

    await orders();

  } catch (error) {
    alert(errorMessage(error));
  }
}

/* =========================================================
   MENU
   ========================================================= */

async function menu() {
  currentView = 'menu';

  setView(`
    <section class="admin-section">

      <div class="page-head">

        <div>
          <small>MENU MANAGEMENT</small>
          <h1>Menu</h1>
          <p>
            Edit food items, prices, images and pre-order settings.
          </p>
        </div>

        <div class="head-actions">
          <button class="admin-btn" onclick="menu()">
            ↻ Refresh
          </button>

          <button class="admin-btn primary" onclick="addMenuItem()">
            + Add Item
          </button>
        </div>

      </div>

      <div id="menuLoading" class="loading">
        Loading menu...
      </div>

      <div id="menuList"></div>

    </section>
  `);

  try {
    const result = await api('/api/admin/menu');

    menuData =
      result?.menu ||
      result?.data ||
      (Array.isArray(result) ? result : []);

    const loading = $('menuLoading');

    if (loading) {
      loading.style.display = 'none';
    }

    renderMenuEditor();

  } catch (error) {
    const loading = $('menuLoading');

    if (loading) {
      loading.innerHTML = `
        <div class="error-box">
          ${esc(errorMessage(error))}
        </div>
      `;
    }
  }
}

function renderMenuEditor() {
  const list = $('menuList');

  if (!list) return;

  if (!menuData.length) {
    list.innerHTML = `
      <div class="empty-box">
        No menu items found.
        <button class="admin-btn" onclick="addMenuItem()">
          Add first item
        </button>
      </div>
    `;

    return;
  }

  list.innerHTML = menuData
    .map((item, index) => menuEditorCard(item, index))
    .join('');
}

function menuEditorCard(item, index) {
  const sizes =
    Array.isArray(item.sizes)
      ? item.sizes
      : [];

  const image =
    item.image ||
    '';

  const category =
    item.cat ||
    item.category ||
    'Pizza';

  const prebook =
    item.prebook === true &&
    String(category).toLowerCase() !== 'pizza';

  return `
    <article class="menu-editor-card">

      <div class="menu-editor-top">

        <div class="menu-image-wrap">

          ${
            image
              ? `
                <img
                  src="${esc(image)}"
                  alt="${esc(item.name || '')}"
                  class="menu-admin-image"
                  onerror="this.style.display='none'"
                >
              `
              : `
                <div class="menu-image-placeholder">
                  No Image
                </div>
              `
          }

          <input
            type="file"
            id="image-${index}"
            accept="image/*"
          >

          <button
            class="admin-btn small"
            onclick="uploadMenuImage(${index})"
          >
            Upload Image
          </button>

        </div>

        <div class="menu-main-fields">

          <label>
            Name

            <input
              id="name-${index}"
              value="${esc(item.name || '')}"
            >
          </label>

          <label>
            Category

            <select id="cat-${index}">
              ${categoryOptions(category)}
            </select>
          </label>

          <label>
            Description

            <textarea
              id="description-${index}"
              rows="3"
            >${esc(item.description || '')}</textarea>
          </label>

          <label class="check-row">

            <input
              type="checkbox"
              id="active-${index}"
              ${item.active !== false ? 'checked' : ''}
            >

            <span>Active / Visible</span>

          </label>

          <label class="check-row">

            <input
              type="checkbox"
              id="prebook-${index}"
              ${prebook ? 'checked' : ''}
              ${
                String(category).toLowerCase() === 'pizza'
                  ? 'disabled'
                  : ''
              }
            >

            <span>
              Pre-order enabled
              ${
                String(category).toLowerCase() === 'pizza'
                  ? '(Pizza always OFF)'
                  : ''
              }
            </span>

          </label>

        </div>

      </div>

      <div class="sizes-editor">

        <div class="sizes-head">
          <h3>Sizes / Prices</h3>

          <button
            class="admin-btn small"
            onclick="addSize(${index})"
          >
            + Add Size
          </button>
        </div>

        <div id="sizes-${index}">
          ${sizesEditor(sizes, index)}
        </div>

      </div>

      <div class="menu-editor-actions">

        <button
          class="admin-btn primary"
          onclick="saveMenuItem(${index})"
        >
          Save Item
        </button>

        <button
          class="admin-btn danger"
          onclick="deleteMenuItem(${index})"
        >
          Delete
        </button>

      </div>

    </article>
  `;
}

function categoryOptions(current) {
  const categories = [
    'Pizza',
    'Momo',
    'Continental',
    'Kacchi'
  ];

  return categories
    .map(category => `
      <option
        value="${category}"
        ${
          String(current).toLowerCase() ===
          category.toLowerCase()
            ? 'selected'
            : ''
        }
      >
        ${category}
      </option>
    `)
    .join('');
}

function sizesEditor(sizes, itemIndex) {
  if (!Array.isArray(sizes) || !sizes.length) {
    return `
      <div class="empty-size">
        No sizes added.
      </div>
    `;
  }

  return sizes
    .map((size, sizeIndex) => {

      const label =
        Array.isArray(size)
          ? size[0]
          : size?.label || '';

      const price =
        Array.isArray(size)
          ? size[1]
          : size?.price || '';

      return `
        <div class="size-row">

          <input
            class="size-label-${itemIndex}"
            data-size-index="${sizeIndex}"
            value="${esc(label)}"
            placeholder="Size / Choice"
          >

          <input
            class="size-price-${itemIndex}"
            data-size-index="${sizeIndex}"
            type="number"
            min="0"
            step="1"
            value="${esc(price)}"
            placeholder="Price"
          >

          <button
            class="admin-btn danger small"
            onclick="removeSize(${itemIndex}, ${sizeIndex})"
          >
            ×
          </button>

        </div>
      `;
    })
    .join('');
}

function addSize(itemIndex) {
  if (!menuData[itemIndex]) return;

  if (!Array.isArray(menuData[itemIndex].sizes)) {
    menuData[itemIndex].sizes = [];
  }

  menuData[itemIndex].sizes.push([
    '',
    0
  ]);

  renderMenuEditor();
}

function removeSize(itemIndex, sizeIndex) {
  if (!menuData[itemIndex]) return;

  if (!Array.isArray(menuData[itemIndex].sizes)) {
    return;
  }

  menuData[itemIndex].sizes.splice(
    sizeIndex,
    1
  );

  renderMenuEditor();
}

function collectMenuItem(index) {
  const item =
    menuData[index];

  if (!item) {
    throw new Error('Menu item not found.');
  }

  const name =
    $(`name-${index}`)?.value.trim();

  if (!name) {
    throw new Error('Food name is required.');
  }

  const category =
    $(`cat-${index}`)?.value ||
    'Pizza';

  const description =
    $(`description-${index}`)?.value.trim() ||
    '';

  const active =
    Boolean(
      $(`active-${index}`)?.checked
    );

  let prebook =
    Boolean(
      $(`prebook-${index}`)?.checked
    );

  if (
    String(category).toLowerCase() ===
    'pizza'
  ) {
    prebook = false;
  }

  const sizeRows =
    document.querySelectorAll(
      `.size-label-${index}`
    );

  const priceRows =
    document.querySelectorAll(
      `.size-price-${index}`
    );

  const sizes = [];

  for (let i = 0; i < sizeRows.length; i++) {
    const label =
      sizeRows[i].value.trim();

    const price =
      Number(priceRows[i]?.value || 0);

    if (!label) {
      continue;
    }

    if (!Number.isFinite(price) || price < 0) {
      throw new Error(
        `Invalid price for ${label}.`
      );
    }

    sizes.push([
      label,
      price
    ]);
  }

  const updated = {
    ...item,
    name,
    cat: category,
    description,
    active,
    prebook,
    sizes
  };

  if (item.image) {
    updated.image = item.image;
  }

  return updated;
}

async function saveMenuItem(index) {
  try {
    const updated =
      collectMenuItem(index);

    menuData[index] = updated;

    await api('/api/admin/menu', {
      method: 'PUT',
      body: {
        menu: menuData
      }
    });

    alert('Menu item saved.');

    await menu();

  } catch (error) {
    alert(errorMessage(error));
  }
}

async function saveEntireMenu() {
  try {
    const updatedMenu =
      menuData.map((_, index) =>
        collectMenuItem(index)
      );

    menuData = updatedMenu;

    await api('/api/admin/menu', {
      method: 'PUT',
      body: {
        menu: menuData
      }
    });

    alert('Menu saved successfully.');

  } catch (error) {
    alert(errorMessage(error));
  }
}

async function addMenuItem() {
  const newItem = {
    id:
      'item-' +
      Date.now(),

    name:
      'New Food Item',

    cat:
      'Pizza',

    price:
      0,

    sizes:
      [
        ['Regular', 0]
      ],

    image:
      '',

    description:
      '',

    choice:
      '',

    options:
      [],

    minQty:
      1,

    maxQty:
      99,

    prebook:
      false,

    active:
      true
  };

  menuData.push(newItem);

  try {
    await api('/api/admin/menu', {
      method: 'PUT',
      body: {
        menu: menuData
      }
    });

    await menu();

  } catch (error) {
    menuData.pop();
    alert(errorMessage(error));
  }
}

async function deleteMenuItem(index) {
  const item =
    menuData[index];

  if (!item) return;

  const confirmed =
    confirm(
      `Delete "${item.name || 'this item'}"?`
    );

  if (!confirmed) return;

  try {
    await api(
      `/api/admin/menu/${encodeURIComponent(
        item.id
      )}`,
      {
        method: 'DELETE'
      }
    );

    alert('Menu item deleted.');

    await menu();

  } catch (error) {

    /*
      If the server does not provide
      individual DELETE, fall back
      to full-menu PUT.
    */

    try {

      menuData.splice(index, 1);

      await api('/api/admin/menu', {
        method: 'PUT',
        body: {
          menu: menuData
        }
      });

      alert('Menu item deleted.');

      await menu();

    } catch (fallbackError) {
      alert(errorMessage(fallbackError));
    }
  }
}

/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

async function uploadMenuImage(index) {
  const fileInput =
    $(`image-${index}`);

  const file =
    fileInput?.files?.[0];

  if (!file) {
    alert('Please select an image first.');
    return;
  }

  const item =
    menuData[index];

  if (!item) {
    alert('Menu item not found.');
    return;
  }

  const formData =
    new FormData();

  formData.append(
    'image',
    file
  );

  formData.append(
    'id',
    item.id
  );

  try {

    const result =
      await api(
        '/api/admin/menu/image',
        {
          method: 'POST',
          body: formData
        }
      );

    const imageUrl =
      result?.image ||
      result?.url ||
      result?.path ||
      result?.imageUrl;

    if (imageUrl) {
      menuData[index].image =
        imageUrl;
    }

    alert('Image uploaded.');

    await menu();

  } catch (error) {
    alert(errorMessage(error));
  }
}

/* =========================================================
   REVIEWS
   ========================================================= */

async function reviews() {
  currentView = 'reviews';

  setView(`
    <section class="admin-section">

      <div class="page-head">

        <div>
          <small>CUSTOMER FEEDBACK</small>
          <h1>Reviews</h1>
          <p>Approve or reject customer reviews.</p>
        </div>

        <button class="admin-btn" onclick="reviews()">
          ↻ Refresh
        </button>

      </div>

      <div id="reviewsLoading" class="loading">
        Loading reviews...
      </div>

      <div id="reviewsList"></div>

    </section>
  `);

  try {
    const result =
      await api('/api/admin/reviews');

    const reviewList =
      result?.reviews ||
      result?.data ||
      (Array.isArray(result) ? result : []);

    const loading =
      $('reviewsLoading');

    if (loading) {
      loading.style.display = 'none';
    }

    const list =
      $('reviewsList');

    if (!list) return;

    if (!reviewList.length) {
      list.innerHTML = `
        <div class="empty-box">
          No reviews found.
        </div>
      `;
      return;
    }

    list.innerHTML =
      reviewList
        .map(reviewCard)
        .join('');

  } catch (error) {
    const loading =
      $('reviewsLoading');

    if (loading) {
      loading.innerHTML = `
        <div class="error-box">
          ${esc(errorMessage(error))}
        </div>
      `;
    }
  }
}

function reviewCard(review) {
  const id =
    review.id ||
    review._id ||
    '';

  const rating =
    Number(
      review.rating ||
      0
    );

  const name =
    review.name ||
    review.customerName ||
    review.customer?.name ||
    'Customer';

  const text =
    review.text ||
    review.comment ||
    review.review ||
    '';

  const approved =
    review.approved === true ||
    review.status === 'approved';

  return `
    <article class="review-card">

      <div class="review-head">

        <div>
          <strong>
            ${esc(name)}
          </strong>

          <div class="stars">
            ${'★'.repeat(Math.max(0, Math.min(5, rating)))}
            ${'☆'.repeat(Math.max(0, 5 - rating))}
          </div>
        </div>

        <span class="status-badge">
          ${
            approved
              ? 'APPROVED'
              : 'PENDING'
          }
        </span>

      </div>

      <p class="review-text">
        ${esc(text)}
      </p>

      <small>
        ${formatDate(review.createdAt || review.date)}
      </small>

      <div class="review-actions">

        <button
          class="admin-btn primary"
          onclick="updateReview('${esc(id)}', true)"
        >
          ✓ Approve
        </button>

        <button
          class="admin-btn danger"
          onclick="updateReview('${esc(id)}', false)"
        >
          ✕ Reject
        </button>

      </div>

    </article>
  `;
}

async function updateReview(id, approved) {
  try {

    await api(
      `/api/admin/reviews/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: {
          approved
        }
      }
    );

    alert(
      approved
        ? 'Review approved.'
        : 'Review rejected.'
    );

    await reviews();

  } catch (error) {
    alert(errorMessage(error));
  }
}

/* =========================================================
   CUSTOMERS
   ========================================================= */

async function customers() {
  currentView = 'customers';

  setView(`
    <section class="admin-section">

      <div class="page-head">

        <div>
          <small>CUSTOMER MANAGEMENT</small>
          <h1>Customers</h1>
          <p>View registered customer accounts and order history.</p>
        </div>

        <button class="admin-btn" onclick="customers()">
          ↻ Refresh
        </button>

      </div>

      <div id="customersLoading" class="loading">
        Loading customers...
      </div>

      <div id="customersList"></div>

      <div id="customerDetails"></div>

    </section>
  `);

  try {

    const result =
      await api('/api/admin/customers');

    const customerList =
      result?.customers ||
      result?.data ||
      (Array.isArray(result) ? result : []);

    const loading =
      $('customersLoading');

    if (loading) {
      loading.style.display = 'none';
    }

    const list =
      $('customersList');

    if (!list) return;

    if (!customerList.length) {
      list.innerHTML = `
        <div class="empty-box">
          No registered customers.
        </div>
      `;
      return;
    }

    list.innerHTML = `
      <div class="customer-table-wrap">

        <table class="admin-table">

          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Orders</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            ${
              customerList
                .map(customerRow)
                .join('')
            }

          </tbody>

        </table>

      </div>
    `;

  } catch (error) {

    const loading =
      $('customersLoading');

    if (loading) {
      loading.innerHTML = `
        <div class="error-box">
          ${esc(errorMessage(error))}
        </div>
      `;
    }
  }
}

function customerRow(customer) {
  const id =
    customer.id ||
    customer._id ||
    '';

  const name =
    customer.name ||
    '—';

  const phone =
    customer.phone ||
    customer.mobile ||
    '—';

  const email =
    customer.email ||
    '—';

  const orderCount =
    Number(
      customer.orderCount ||
      customer.ordersCount ||
      0
    );

  return `
    <tr>

      <td>
        ${esc(name)}
      </td>

      <td>
        ${esc(phone)}
      </td>

      <td>
        ${esc(email)}
      </td>

      <td>
        ${orderCount}
      </td>

      <td>

        <button
          class="admin-btn small"
          onclick="customerDetails('${esc(id)}')"
        >
          View
        </button>

      </td>

    </tr>
  `;
}

async function customerDetails(id) {
  if (!id) return;

  const box =
    $('customerDetails');

  if (!box) return;

  box.innerHTML = `
    <div class="loading">
      Loading customer details...
    </div>
  `;

  try {

    const result =
      await api(
        `/api/admin/customers/${encodeURIComponent(id)}`
      );

    const customer =
      result?.customer ||
      result?.data ||
      result;

    const ordersList =
      result?.orders ||
      customer?.orders ||
      [];

    box.innerHTML = `
      <div class="admin-card customer-details">

        <div class="page-head">
          <div>
            <small>CUSTOMER DETAILS</small>
            <h2>
              ${esc(customer.name || 'Customer')}
            </h2>
          </div>

          <button
            class="admin-btn"
            onclick="this.closest('.customer-details').remove()"
          >
            Close
          </button>
        </div>

        <div class="customer-info-grid">

          <div>
            <strong>Name</strong>
            <p>${esc(customer.name || '—')}</p>
          </div>

          <div>
            <strong>Mobile</strong>
            <p>${esc(customer.phone || customer.mobile || '—')}</p>
          </div>

          <div>
            <strong>Email</strong>
            <p>${esc(customer.email || '—')}</p>
          </div>

          <div>
            <strong>Joined</strong>
            <p>${formatDate(customer.createdAt)}</p>
          </div>

        </div>

        <h3>Order History</h3>

        ${
          ordersList.length
            ? `
              <div class="customer-orders">

                ${
                  ordersList
                    .map(order => `
                      <div class="customer-order-row">

                        <strong>
                          #${esc(
                            order.id ||
                            order.orderId ||
                            order._id ||
                            ''
                          )}
                        </strong>

                        <span>
                          ${money(
                            order.total ||
                            order.grandTotal ||
                            0
                          )}
                        </span>

                        <span>
                          ${esc(
                            order.status ||
                            'pending'
                          )}
                        </span>

                      </div>
                    `)
                    .join('')
                }

              </div>
            `
            : `
              <p>
                No order history found.
              </p>
            `
        }

      </div>
    `;

  } catch (error) {

    box.innerHTML = `
      <div class="error-box">
        ${esc(errorMessage(error))}
      </div>
    `;
  }
}

/* =========================================================
   SETTINGS
   ========================================================= */

async function settings() {
  currentView = 'settings';

  setView(`
    <section class="admin-section">

      <div class="page-head">

        <div>
          <small>RESTAURANT CONFIGURATION</small>
          <h1>Delivery & Settings</h1>
          <p>
            Manage delivery radius, payment and shop hours.
          </p>
        </div>

        <button
          class="admin-btn"
          onclick="settings()"
        >
          ↻ Reload
        </button>

      </div>

      <div id="settingsLoading" class="loading">
        Loading settings...
      </div>

      <div id="settingsContent"></div>

    </section>
  `);

  try {

    const result =
      await api('/api/admin/settings');

    settingsData =
      result?.settings ||
      result?.data ||
      result;

    const loading =
      $('settingsLoading');

    if (loading) {
      loading.style.display = 'none';
    }

    renderSettings();

  } catch (error) {

    const loading =
      $('settingsLoading');

    if (loading) {
      loading.innerHTML = `
        <div class="error-box">
          ${esc(errorMessage(error))}
        </div>
      `;
    }
  }
}

function renderSettings() {
  const s =
    settingsData || {};

  const delivery =
    s.delivery || {};

  const payment =
    s.payment || {};

  const hours =
    s.hours || {};

  const normal =
    hours.normal || {
      open: 11,
      close: 19
    };

  const friday =
    hours.friday || {
      open: 15,
      close: 21
    };

  const prebook =
    s.prebook || {};

  const box =
    $('settingsContent');

  if (!box) return;

  box.innerHTML = `

    <div class="settings-grid">

      <div class="admin-card">

        <h2>Delivery</h2>

        <label>
          Base Location Name

          <input
            id="setBaseName"
            value="${esc(
              delivery.baseName ||
              delivery.name ||
              'Kahalthuri Hamidia High School'
            )}"
          >
        </label>

        <label>
          Base Latitude

          <input
            id="setLat"
            type="number"
            step="0.0000001"
            value="${esc(
              delivery.lat ??
              delivery.baseLat ??
              23.3022494
            )}"
          >
        </label>

        <label>
          Base Longitude

          <input
            id="setLng"
            type="number"
            step="0.0000001"
            value="${esc(
              delivery.lng ??
              delivery.baseLng ??
              90.9187528
            )}"
          >
        </label>

        <label>
          COD Radius (KM)

          <input
            id="setCodRadius"
            type="number"
            min="0"
            step="0.1"
            value="${esc(
              delivery.codRadiusKm ??
              1
            )}"
          >
        </label>

        <label>
          Maximum Delivery Radius (KM)

          <input
            id="setMaxRadius"
            type="number"
            min="0"
            step="0.1"
            value="${esc(
              delivery.maxRadiusKm ??
              4
            )}"
          >
        </label>

        <label>
          Delivery Rate Per KM

          <input
            id="setRate"
            type="number"
            min="0"
            step="1"
            value="${esc(
              delivery.ratePerKm ??
              10
            )}"
          >
        </label>

        <label>
          COD Delivery Charge

          <input
            id="setCodCharge"
            type="number"
            min="0"
            step="1"
            value="${esc(
              delivery.codCharge ??
              0
            )}"
          >
        </label>

      </div>


      <div class="admin-card">

        <h2>Payment</h2>

        <label>
          bKash Number

          <input
            id="setBkash"
            value="${esc(
              payment.bkash ||
              payment.bkashNumber ||
              '01792494275'
            )}"
          >
        </label>

        <label>
          Nagad Number

          <input
            id="setNagad"
            value="${esc(
              payment.nagad ||
              payment.nagadNumber ||
              '01792494275'
            )}"
          >
        </label>

        <label>
          Payment Method

          <select id="setPaymentMethod">

            <option
              value="Send Money Only"
              ${
                String(
                  payment.method ||
                  'Send Money Only'
                ).toLowerCase() ===
                'send money only'
                  ? 'selected'
                  : ''
              }
            >
              Send Money Only
            </option>

          </select>
        </label>

        <div class="info-box">
          <strong>Payment Rule</strong>

          <p>
            COD is available only inside the COD radius.
            Outside the COD zone, online payment is required.
          </p>

          <p>
            bKash and Nagad use
            <strong>Send Money Only</strong>.
          </p>
        </div>

      </div>


      <div class="admin-card">

        <h2>Shop Hours</h2>

        <h3>Sunday – Thursday</h3>

        <div class="two-fields">

          <label>
            Opening

            <input
              id="normalOpen"
              type="number"
              min="0"
              max="23"
              value="${esc(normal.open)}"
            >
          </label>

          <label>
            Closing

            <input
              id="normalClose"
              type="number"
              min="1"
              max="24"
              value="${esc(normal.close)}"
            >
          </label>

        </div>

        <h3>Friday</h3>

        <div class="two-fields">

          <label>
            Opening

            <input
              id="fridayOpen"
              type="number"
              min="0"
              max="23"
              value="${esc(friday.open)}"
            >
          </label>

          <label>
            Closing

            <input
              id="fridayClose"
              type="number"
              min="1"
              max="24"
              value="${esc(friday.close)}"
            >
          </label>

        </div>

        <div class="info-box">

          <strong>Customer Order Time Rule</strong>

          <p>
            Customer order slots automatically run from
            <strong>opening + 1 hour</strong>
            to
            <strong>closing − 1 hour</strong>.
          </p>

          <p>
            Slots are every
            <strong>30 minutes</strong>.
          </p>

          <p>
            Example:
            11 AM–7 PM shop hours →
            12 PM–6 PM order slots.
          </p>

          <p>
            Friday:
            3 PM–9 PM →
            4 PM–8 PM order slots.
          </p>

        </div>

      </div>


      <div class="admin-card">

        <h2>Pre-order</h2>

        <label class="check-row">

          <input
            id="prebookEnabled"
            type="checkbox"
            ${
              prebook.enabled !== false
                ? 'checked'
                : ''
            }
          >

          <span>
            Allow pre-order system
          </span>

        </label>

        <div class="info-box">

          <strong>Important</strong>

          <p>
            Pre-order time slots use the same
            opening + 1 hour / closing − 1 hour rule.
          </p>

          <p>
            Time slots are generated every 30 minutes.
          </p>

          <p>
            Pizza items are always
            <strong>pre-order OFF</strong>.
          </p>

          <p>
            Individual menu items can have
            pre-order ON/OFF.
          </p>

        </div>

      </div>

    </div>


    <div class="settings-save">

      <button
        class="admin-btn primary large"
        onclick="saveSettings()"
      >
        💾 Save All Settings
      </button>

    </div>

  `;
}

async function saveSettings() {
  try {

    const lat =
      Number(
        $('setLat')?.value
      );

    const lng =
      Number(
        $('setLng')?.value
      );

    const codRadiusKm =
      Number(
        $('setCodRadius')?.value
      );

    const maxRadiusKm =
      Number(
        $('setMaxRadius')?.value
      );

    const ratePerKm =
      Number(
        $('setRate')?.value
      );

    const codCharge =
      Number(
        $('setCodCharge')?.value
      );

    const normalOpen =
      Number(
        $('normalOpen')?.value
      );

    const normalClose =
      Number(
        $('normalClose')?.value
      );

    const fridayOpen =
      Number(
        $('fridayOpen')?.value
      );

    const fridayClose =
      Number(
        $('fridayClose')?.value
      );

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      throw new Error(
        'Invalid base location coordinates.'
      );
    }

    if (
      codRadiusKm < 0 ||
      maxRadiusKm <= 0 ||
      codRadiusKm > maxRadiusKm
    ) {
      throw new Error(
        'Check COD and maximum delivery radius.'
      );
    }

    if (
      ratePerKm < 0 ||
      codCharge < 0
    ) {
      throw new Error(
        'Delivery charges cannot be negative.'
      );
    }

    if (
      normalOpen < 0 ||
      normalOpen >= normalClose ||
      normalClose > 24
    ) {
      throw new Error(
        'Invalid Sunday–Thursday shop hours.'
      );
    }

    if (
      fridayOpen < 0 ||
      fridayOpen >= fridayClose ||
      fridayClose > 24
    ) {
      throw new Error(
        'Invalid Friday shop hours.'
      );
    }

    const payload = {
      delivery: {
        ...(
          settingsData?.delivery ||
          {}
        ),

        baseName:
          $('setBaseName')?.value.trim() ||
          'Kahalthuri Hamidia High School',

        name:
          $('setBaseName')?.value.trim() ||
          'Kahalthuri Hamidia High School',

        lat,
        lng,

        baseLat:
          lat,

        baseLng:
          lng,

        codRadiusKm,
        maxRadiusKm,
        ratePerKm,
        codCharge
      },

      payment: {
        ...(
          settingsData?.payment ||
          {}
        ),

        bkash:
          $('setBkash')?.value.trim() ||
          '01792494275',

        nagad:
          $('setNagad')?.value.trim() ||
          '01792494275',

        method:
          $('setPaymentMethod')?.value ||
          'Send Money Only'
      },

      hours: {
        normal: {
          open: normalOpen,
          close: normalClose
        },

        friday: {
          open: fridayOpen,
          close: fridayClose
        }
      },

      prebook: {
        ...(
          settingsData?.prebook ||
          {}
        ),

        enabled:
          Boolean(
            $('prebookEnabled')?.checked
          )
      }
    };

    const result =
      await api('/api/admin/settings', {
        method: 'PUT',
        body: payload
      });

    settingsData =
      result?.settings ||
      result?.data ||
      result ||
      payload;

    alert(
      'Settings saved successfully.'
    );

    renderSettings();

  } catch (error) {
    alert(errorMessage(error));
  }
}

/* =========================================================
   KEYBOARD LOGIN
   ========================================================= */

document.addEventListener(
  'keydown',
  event => {

    if (
      event.key === 'Enter' &&
      $('login') &&
      $('login').style.display !== 'none'
    ) {
      login();
    }

  }
);

/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initAdmin() {

  if (!adminToken) {
    showLogin();
    return;
  }

  showApp();

  try {
    await dash();
  } catch {
    logout();
  }
}

/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.login = login;
window.logout = logout;

window.dash = dash;
window.orders = orders;
window.menu = menu;
window.reviews = reviews;
window.customers = customers;
window.settings = settings;

window.updateOrder = updateOrder;
window.updateReview = updateReview;

window.customerDetails =
  customerDetails;

window.saveMenuItem =
  saveMenuItem;

window.saveEntireMenu =
  saveEntireMenu;

window.addMenuItem =
  addMenuItem;

window.deleteMenuItem =
  deleteMenuItem;

window.addSize =
  addSize;

window.removeSize =
  removeSize;

window.uploadMenuImage =
  uploadMenuImage;

window.saveSettings =
  saveSettings;

/* =========================================================
   ADMIN CSS FALLBACK
   ========================================================= */

(function injectAdminFallbackStyles() {

  if (document.getElementById('adminJsStyles')) {
    return;
  }

  const style =
    document.createElement('style');

  style.id =
    'adminJsStyles';

  style.textContent = `

    #app {
      display: flex;
      min-height: 100vh;
    }

    #app aside {
      width: 240px;
      flex-shrink: 0;
    }

    #app main {
      flex: 1;
      padding: 30px;
      min-width: 0;
    }

    .admin-section {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 25px;
    }

    .page-head h1,
    .page-head h2 {
      margin: 5px 0;
    }

    .page-head p {
      opacity: .7;
      margin: 5px 0;
    }

    .head-actions,
    .quick-actions,
    .review-actions,
    .menu-editor-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .loading,
    .empty-box,
    .error-box,
    .info-box,
    .note-box {
      padding: 18px;
      border-radius: 12px;
      margin: 15px 0;
    }

    .error-box {
      border: 1px solid #b33;
    }

    .empty-box {
      border: 1px dashed #777;
      text-align: center;
    }

    .info-box {
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.03);
    }

    .stats-grid {
      display: grid;
      grid-template-columns:
        repeat(auto-fit, minmax(170px, 1fr));
      gap: 15px;
      margin-bottom: 25px;
    }

    .stat-card,
    .admin-card,
    .order-card,
    .review-card,
    .menu-editor-card {
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 18px;
      background: rgba(255,255,255,.025);
    }

    .stat-card span {
      display: block;
      opacity: .7;
      margin-bottom: 8px;
    }

    .stat-card strong {
      font-size: 28px;
    }

    .dashboard-grid,
    .settings-grid {
      display: grid;
      grid-template-columns:
        repeat(auto-fit, minmax(300px, 1fr));
      gap: 18px;
    }

    .order-head,
    .review-head,
    .order-total > div,
    .customer-order-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 15px;
    }

    .order-columns {
      display: grid;
      grid-template-columns:
        repeat(auto-fit, minmax(220px, 1fr));
      gap: 18px;
      margin: 20px 0;
    }

    .order-block {
      padding: 15px;
      border-radius: 12px;
      background: rgba(255,255,255,.03);
    }

    .order-item-row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 15px;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }

    .order-item-row small {
      display: block;
      opacity: .65;
      margin-top: 3px;
    }

    .order-total {
      margin-top: 18px;
      padding-top: 15px;
      border-top: 1px solid rgba(255,255,255,.12);
    }

    .order-total > div {
      padding: 5px 0;
    }

    .order-actions {
      display: grid;
      grid-template-columns:
        repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-top: 20px;
    }

    label {
      display: block;
      margin-bottom: 14px;
    }

    label > input,
    label > select,
    label > textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
      margin-top: 7px;
    }

    .check-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .check-row input {
      width: auto;
      margin: 0;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(255,255,255,.08);
    }

    .menu-editor-top {
      display: grid;
      grid-template-columns:
        230px 1fr;
      gap: 25px;
    }

    .menu-admin-image {
      width: 100%;
      height: 170px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 10px;
    }

    .menu-image-placeholder {
      height: 170px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      border: 1px dashed #777;
      margin-bottom: 10px;
    }

    .size-row {
      display: grid;
      grid-template-columns:
        1fr 150px auto;
      gap: 10px;
      margin-bottom: 10px;
    }

    .sizes-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
      margin-bottom: 10px;
    }

    .review-text {
      font-size: 16px;
      line-height: 1.6;
    }

    .customer-table-wrap {
      overflow-x: auto;
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
    }

    .admin-table th,
    .admin-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid rgba(255,255,255,.1);
    }

    .customer-info-grid {
      display: grid;
      grid-template-columns:
        repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 25px;
    }

    .customer-orders {
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 10px;
      overflow: hidden;
    }

    .customer-order-row {
      padding: 12px;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }

    .two-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .settings-save {
      margin-top: 20px;
    }

    .admin-btn {
      cursor: pointer;
      border: 1px solid rgba(255,255,255,.2);
      border-radius: 9px;
      padding: 10px 15px;
      background: rgba(255,255,255,.06);
      color: inherit;
      font-weight: 600;
    }

    .admin-btn:hover {
      transform: translateY(-1px);
    }

    .admin-btn.small {
      padding: 7px 10px;
      font-size: 13px;
    }

    .admin-btn.large {
      padding: 13px 22px;
      font-size: 15px;
    }

    .admin-btn.primary {
      font-weight: 700;
    }

    .admin-btn.danger {
      border-color: rgba(255,80,80,.5);
    }

    @media (max-width: 800px) {

      #app {
        display: block;
      }

      #app aside {
        width: 100%;
      }

      #app main {
        padding: 18px;
      }

      .page-head {
        flex-direction: column;
      }

      .menu-editor-top {
        grid-template-columns: 1fr;
      }

      .size-row {
        grid-template-columns: 1fr;
      }

      .two-fields {
        grid-template-columns: 1fr;
      }

      .order-item-row {
        grid-template-columns: 1fr;
      }

    }

  `;

  document.head.appendChild(style);

})();

/* =========================================================
   START
   ========================================================= */

initAdmin();
