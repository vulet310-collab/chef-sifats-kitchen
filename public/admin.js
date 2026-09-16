/* =========================================================
   CHEF SIFAT'S KITCHEN — ADMIN PANEL
   Compatible with fresh admin.html
   ========================================================= */

(() => {
  'use strict';

  const API = '/api';

  let adminToken =
    localStorage.getItem('csk_admin_token') || '';

  let adminUser =
    localStorage.getItem('csk_admin_user') || '';

  let currentView = 'dashboard';

  /* =======================================================
     BASIC HELPERS
     ======================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function money(value) {
    const n = Number(value || 0);
    return `৳${n.toLocaleString('en-BD')}`;
  }

  function setView(html, title = '') {
    const view = $('view');
    if (view) view.innerHTML = html;

    const pageTitle = $('pageTitle');
    if (pageTitle && title) {
      pageTitle.textContent = title;
    }
  }

  function showApp() {
    if ($('login')) $('login').style.display = 'none';
    if ($('app')) $('app').style.display = 'flex';

    const userBox = $('adminUser');
    if (userBox) {
      userBox.textContent = adminUser
        ? `Admin: ${adminUser}`
        : 'Admin';
    }
  }

  function showLogin() {
    if ($('login')) $('login').style.display = 'flex';
    if ($('app')) $('app').style.display = 'none';
  }

  /* =======================================================
     API
     ======================================================= */

  async function api(path, options = {}) {
    const headers = {
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (adminToken) {
      headers.Authorization = `Bearer ${adminToken}`;
    }

    const response = await fetch(
      `${API}${path}`,
      {
        ...options,
        headers
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.status === 401) {
      logout(false);
      throw new Error(
        data.message || 'Admin session expired.'
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        `Request failed (${response.status})`
      );
    }

    return data;
  }

  /* =======================================================
     LOGIN
     ======================================================= */

  async function adminLogin(event) {
    if (event) event.preventDefault();

    const username =
      $('username')?.value.trim() || '';

    const password =
      $('password')?.value || '';

    const message = $('loginMessage');
    const button = $('loginBtn');

    if (!username || !password) {
      if (message) {
        message.textContent =
          'Username and password are required.';
      }
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = 'Logging in...';
    }

    if (message) {
      message.textContent = '';
    }

    try {
      const data = await api(
        '/admin/login',
        {
          method: 'POST',
          body: JSON.stringify({
            username,
            password
          })
        }
      );

      adminToken =
        data.token ||
        data.accessToken ||
        data.adminToken ||
        '';

      adminUser =
        data.username ||
        data.user?.username ||
        username;

      if (!adminToken) {
        throw new Error(
          'Login successful but no admin token was received.'
        );
      }

      localStorage.setItem(
        'csk_admin_token',
        adminToken
      );

      localStorage.setItem(
        'csk_admin_user',
        adminUser
      );

      showApp();
      await dash();

    } catch (error) {
      console.error(error);

      if (message) {
        message.textContent =
          error.message || 'Login failed.';
      }

    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Login';
      }
    }
  }

  /* =======================================================
     LOGOUT
     ======================================================= */

  function logout(showMessage = true) {
    adminToken = '';
    adminUser = '';

    localStorage.removeItem(
      'csk_admin_token'
    );

    localStorage.removeItem(
      'csk_admin_user'
    );

    showLogin();

    if (showMessage && $('loginMessage')) {
      $('loginMessage').textContent =
        'You have been logged out.';
    }
  }

  /* =======================================================
     DASHBOARD
     ======================================================= */

  async function dash() {
    currentView = 'dashboard';

    setView(
      `
        <div class="page-head">
          <div>
            <h2>Dashboard</h2>
            <p>Chef Sifat's Kitchen overview</p>
          </div>
          <button class="btn" onclick="dash()">
            ↻ Refresh
          </button>
        </div>

        <div class="stats" id="dashboardStats">
          <div class="stat-card">
            <span>Loading...</span>
          </div>
        </div>

        <div class="panel">
          <h3>Recent Orders</h3>
          <div id="recentOrders">
            Loading...
          </div>
        </div>
      `,
      'Dashboard'
    );

    try {
      const [
        ordersData,
        menuData,
        reviewsData,
        customersData
      ] = await Promise.all([
        api('/admin/orders'),
        api('/admin/menu'),
        api('/admin/reviews'),
        api('/admin/customers')
      ]);

      const orders =
        Array.isArray(ordersData)
          ? ordersData
          : ordersData.orders || [];

      const menu =
        Array.isArray(menuData)
          ? menuData
          : menuData.menu ||
            menuData.items ||
            [];

      const reviews =
        Array.isArray(reviewsData)
          ? reviewsData
          : reviewsData.reviews || [];

      const customers =
        Array.isArray(customersData)
          ? customersData
          : customersData.customers || [];

      const pending =
        orders.filter(
          o =>
            String(
              o.status || ''
            ).toLowerCase() === 'pending'
        ).length;

      const completed =
        orders.filter(
          o =>
            String(
              o.status || ''
            ).toLowerCase() === 'completed'
        ).length;

      const activeMenu =
        menu.filter(
          item => item.active !== false
        ).length;

      const stats = $('dashboardStats');

      if (stats) {
        stats.innerHTML = `
          <div class="stat-card">
            <b>${orders.length}</b>
            <span>Total Orders</span>
          </div>

          <div class="stat-card">
            <b>${pending}</b>
            <span>Pending Orders</span>
          </div>

          <div class="stat-card">
            <b>${completed}</b>
            <span>Completed</span>
          </div>

          <div class="stat-card">
            <b>${customers.length}</b>
            <span>Customers</span>
          </div>

          <div class="stat-card">
            <b>${activeMenu}</b>
            <span>Active Menu Items</span>
          </div>

          <div class="stat-card">
            <b>${reviews.length}</b>
            <span>Reviews</span>
          </div>
        `;
      }

      const recent =
        orders
          .slice()
          .sort(
            (a, b) =>
              new Date(
                b.createdAt || 0
              ) -
              new Date(
                a.createdAt || 0
              )
          )
          .slice(0, 8);

      const box = $('recentOrders');

      if (!box) return;

      if (!recent.length) {
        box.innerHTML =
          '<p>No orders found.</p>';
        return;
      }

      box.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              ${recent.map(order => `
                <tr>
                  <td>
                    #${esc(
                      order.id ||
                      order.orderId ||
                      ''
                    )}
                  </td>

                  <td>
                    ${esc(
                      order.customer?.name ||
                      order.name ||
                      'Customer'
                    )}
                  </td>

                  <td>
                    ${money(
                      order.total ||
                      order.grandTotal ||
                      0
                    )}
                  </td>

                  <td>
                    <span class="badge">
                      ${esc(
                        order.status ||
                        'pending'
                      )}
                    </span>
                  </td>

                  <td>
                    ${formatDate(
                      order.createdAt
                    )}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

    } catch (error) {
      console.error(error);

      const box = $('recentOrders');

      if (box) {
        box.innerHTML = `
          <p class="error">
            ${esc(error.message)}
          </p>
        `;
      }
    }
  }

  /* =======================================================
     ORDERS
     ======================================================= */

  async function orders() {
    currentView = 'orders';

    setView(
      `
        <div class="page-head">
          <div>
            <h2>Orders</h2>
            <p>Manage customer orders</p>
          </div>

          <button class="btn" onclick="orders()">
            ↻ Refresh
          </button>
        </div>

        <div id="ordersBox">
          Loading orders...
        </div>
      `,
      'Orders'
    );

    try {
      const data =
        await api('/admin/orders');

      const list =
        Array.isArray(data)
          ? data
          : data.orders || [];

      const box = $('ordersBox');

      if (!box) return;

      if (!list.length) {
        box.innerHTML =
          '<p>No orders found.</p>';
        return;
      }

      const sorted =
        list.slice().sort(
          (a, b) =>
            new Date(
              b.createdAt || 0
            ) -
            new Date(
              a.createdAt || 0
            )
        );

      box.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              ${sorted.map(order => {

                const items =
                  Array.isArray(order.items)
                    ? order.items
                    : [];

                return `
                  <tr>
                    <td>
                      <b>
                        #${esc(
                          order.id ||
                          order.orderId ||
                          ''
                        )}
                      </b>
                    </td>

                    <td>
                      ${esc(
                        order.customer?.name ||
                        order.name ||
                        'Customer'
                      )}
                    </td>

                    <td>
                      ${esc(
                        order.customer?.phone ||
                        order.phone ||
                        ''
                      )}
                    </td>

                    <td>
                      ${items.map(item => `
                        <div>
                          ${esc(
                            item.name ||
                            'Item'
                          )}
                          ×
                          ${Number(
                            item.qty || 1
                          )}
                          ${
                            item.choice
                              ? `(${esc(item.choice)})`
                              : ''
                          }
                        </div>
                      `).join('')}
                    </td>

                    <td>
                      <b>
                        ${money(
                          order.total ||
                          order.grandTotal ||
                          0
                        )}
                      </b>
                    </td>

                    <td>
                      ${esc(
                        order.paymentMethod ||
                        order.payment?.method ||
                        'COD'
                      )}
                    </td>

                    <td>
                      <select
                        onchange="updateOrderStatus(
                          '${esc(
                            order.id ||
                            order.orderId ||
                            ''
                          )}',
                          this.value
                        )"
                      >
                        ${[
                          'pending',
                          'confirmed',
                          'preparing',
                          'out_for_delivery',
                          'completed',
                          'cancelled'
                        ].map(status => `
                          <option
                            value="${status}"
                            ${
                              String(
                                order.status ||
                                'pending'
                              ).toLowerCase() ===
                              status
                                ? 'selected'
                                : ''
                            }
                          >
                            ${status.replace(
                              /_/g,
                              ' '
                            )}
                          </option>
                        `).join('')}
                      </select>
                    </td>

                    <td>
                      ${formatDate(
                        order.deliveryTime ||
                        order.createdAt
                      )}
                    </td>

                    <td>
                      <button
                        class="small-btn"
                        onclick="viewOrder(
                          '${esc(
                            order.id ||
                            order.orderId ||
                            ''
                          )}'
                        )"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;

    } catch (error) {
      const box = $('ordersBox');

      if (box) {
        box.innerHTML = `
          <p class="error">
            ${esc(error.message)}
          </p>
        `;
      }
    }
  }

  /* =======================================================
     ORDER STATUS
     ======================================================= */

  async function updateOrderStatus(
    id,
    status
  ) {
    if (!id) return;

    try {
      await api(
        `/admin/orders/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            status
          })
        }
      );

      await orders();

    } catch (error) {
      alert(
        error.message ||
        'Could not update order.'
      );

      await orders();
    }
  }

  /* =======================================================
     VIEW SINGLE ORDER
     ======================================================= */

  async function viewOrder(id) {
    if (!id) return;

    try {
      const data =
        await api(
          `/admin/orders/${encodeURIComponent(id)}`
        );

      const order =
        data.order || data;

      const items =
        Array.isArray(order.items)
          ? order.items
          : [];

      setView(
        `
          <div class="page-head">
            <div>
              <h2>
                Order #${esc(
                  order.id ||
                  order.orderId ||
                  id
                )}
              </h2>
              <p>Order details</p>
            </div>

            <button
              class="btn"
              onclick="orders()"
            >
              ← Back
            </button>
          </div>

          <div class="panel">
            <h3>Customer</h3>

            <p>
              <b>Name:</b>
              ${esc(
                order.customer?.name ||
                order.name ||
                ''
              )}
            </p>

            <p>
              <b>Phone:</b>
              ${esc(
                order.customer?.phone ||
                order.phone ||
                ''
              )}
            </p>

            <p>
              <b>Email:</b>
              ${esc(
                order.customer?.email ||
                order.email ||
                ''
              )}
            </p>
          </div>

          <div class="panel">
            <h3>Delivery</h3>

            <p>
              <b>Address:</b>
              ${esc(
                order.address ||
                order.deliveryAddress ||
                ''
              )}
            </p>

            <p>
              <b>Delivery Time:</b>
              ${formatDate(
                order.deliveryTime
              )}
            </p>

            <p>
              <b>Distance:</b>
              ${esc(
                order.distanceKm ??
                order.location?.distanceKm ??
                ''
              )} km
            </p>
          </div>

          <div class="panel">
            <h3>Items</h3>

            ${items.map(item => `
              <div class="order-item">
                <b>
                  ${esc(
                    item.name ||
                    'Item'
                  )}
                </b>

                ${
                  item.choice
                    ? `<span>
                        ${esc(item.choice)}
                      </span>`
                    : ''
                }

                <span>
                  × ${Number(
                    item.qty || 1
                  )}
                </span>

                <strong>
                  ${money(
                    Number(item.price || 0) *
                    Number(item.qty || 1)
                  )}
                </strong>
              </div>
            `).join('')}

            <hr>

            <h3>
              Total:
              ${money(
                order.total ||
                order.grandTotal ||
                0
              )}
            </h3>
          </div>
        `,
        `Order #${id}`
      );

    } catch (error) {
      alert(
        error.message ||
        'Could not load order.'
      );
    }
  }

  /* =======================================================
     MENU
     ======================================================= */

  async function menu() {
    currentView = 'menu';

    setView(
      `
        <div class="page-head">
          <div>
            <h2>Menu</h2>
            <p>Manage food items, prices and pre-order settings</p>
          </div>

          <div>
            <button
              class="btn"
              onclick="showAddMenuForm()"
            >
              + Add Item
            </button>

            <button
              class="btn"
              onclick="menu()"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div id="menuBox">
          Loading menu...
        </div>
      `,
      'Menu'
    );

    try {
      const data =
        await api('/admin/menu');

      const list =
        Array.isArray(data)
          ? data
          : data.menu ||
            data.items ||
            [];

      const box = $('menuBox');

      if (!box) return;

      if (!list.length) {
        box.innerHTML =
          '<p>No menu items found.</p>';
        return;
      }

      box.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Sizes / Prices</th>
                <th>Pre-order</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              ${list.map(item => {

                const sizes =
                  Array.isArray(item.sizes)
                    ? item.sizes
                    : [];

                const pizza =
                  String(
                    item.cat || ''
                  ).toLowerCase() ===
                  'pizza';

                return `
                  <tr>
                    <td>
                      ${
                        item.image
                          ? `<img
                              src="${esc(item.image)}"
                              class="menu-thumb"
                              alt=""
                            >`
                          : '—'
                      }
                    </td>

                    <td>
                      <b>
                        ${esc(
                          item.name ||
                          ''
                        )}
                      </b>
                    </td>

                    <td>
                      ${esc(
                        item.cat ||
                        ''
                      )}
                    </td>

                    <td>
                      ${
                        sizes.length
                          ? sizes.map(
                              (s, i) => `
                                <div>
                                  ${esc(
                                    Array.isArray(s)
                                      ? s[0]
                                      : s?.label ||
                                        `Size ${i + 1}`
                                  )}
                                  :
                                  ${money(
                                    Array.isArray(s)
                                      ? s[1]
                                      : s?.price
                                  )}
                                </div>
                              `
                            ).join('')
                          : money(
                              item.price
                            )
                      }
                    </td>

                    <td>
                      ${
                        pizza
                          ? '<span class="badge">OFF</span>'
                          : `
                            <span class="badge">
                              ${
                                item.prebook
                                  ? 'ON'
                                  : 'OFF'
                              }
                            </span>
                          `
                      }
                    </td>

                    <td>
                      ${
                        item.active !== false
                          ? 'ON'
                          : 'OFF'
                      }
                    </td>

                    <td>
                      <button
                        class="small-btn"
                        onclick="editMenuItem(
                          '${esc(
                            item.id
                          )}'
                        )"
                      >
                        Edit
                      </button>

                      <button
                        class="small-btn danger"
                        onclick="deleteMenuItem(
                          '${esc(
                            item.id
                          )}'
                        )"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      const box = $('menuBox');

      if (box) {
        box.innerHTML = `
          <p class="error">
            ${esc(error.message)}
          </p>
        `;
      }
    }
  }

  /* =======================================================
     ADD MENU FORM
     ======================================================= */

  function showAddMenuForm() {
    setView(
      `
        <div class="page-head">
          <div>
            <h2>Add Menu Item</h2>
            <p>Create a new food item</p>
          </div>

          <button
            class="btn"
            onclick="menu()"
          >
            ← Back
          </button>
        </div>

        <div class="panel">
          <form
            id="menuForm"
            onsubmit="saveNewMenuItem(event)"
          >

            <label>Name</label>
            <input
              id="mName"
              required
              placeholder="Food name"
            >

            <label>Category</label>
            <select id="mCat">
              <option>Pizza</option>
              <option>Momo</option>
              <option>Continental</option>
              <option>Kacchi</option>
            </select>

            <label>Base Price</label>
            <input
              id="mPrice"
              type="number"
              min="0"
              placeholder="Price"
            >

            <label>Description</label>
            <textarea
              id="mDescription"
              placeholder="Description"
            ></textarea>

            <label>
              <input
                id="mPrebook"
                type="checkbox"
              >
              Pre-order ON
            </label>

            <label>
              <input
                id="mActive"
                type="checkbox"
                checked
              >
              Active
            </label>

            <button
              class="btn"
              type="submit"
            >
              Save Item
            </button>

          </form>
        </div>
      `,
      'Add Menu Item'
    );

    const catSelect = $('mCat');

    if (catSelect) {
      catSelect.addEventListener(
        'change',
        () => {
          if (
            catSelect.value === 'Pizza' ||
            catSelect.value === 'Momo'
          ) {
            if ($('mPrebook')) {
              $('mPrebook').checked = false;
            }
          }
        }
      );
    }
  }

  async function saveNewMenuItem(event) {
    event.preventDefault();

    const cat =
      $('mCat')?.value || 'Pizza';

    const payload = {
      name:
        $('mName')?.value.trim() || '',

      cat,

      price:
        Number(
          $('mPrice')?.value || 0
        ),

      description:
        $('mDescription')?.value.trim() ||
        '',

      prebook:
        cat === 'Pizza' ||
        cat === 'Momo'
          ? false
          : Boolean(
              $('mPrebook')?.checked
            ),

      active:
        Boolean(
          $('mActive')?.checked
        )
    };

    if (!payload.name) {
      alert('Enter item name.');
      return;
    }

    try {
      await api(
        '/admin/menu',
        {
          method: 'POST',
          body: JSON.stringify(
            payload
          )
        }
      );

      alert(
        'Menu item added successfully.'
      );

      await menu();

    } catch (error) {
      alert(
        error.message ||
        'Could not add menu item.'
      );
    }
  }

  /* =======================================================
     EDIT MENU ITEM
     ======================================================= */

  async function editMenuItem(id) {
    try {
      const data =
        await api('/admin/menu');

      const list =
        Array.isArray(data)
          ? data
          : data.menu ||
            data.items ||
            [];

      const item =
        list.find(
          x =>
            String(x.id) ===
            String(id)
        );

      if (!item) {
        alert(
          'Menu item not found.'
        );
        return;
      }

      const sizes =
        Array.isArray(item.sizes)
          ? item.sizes
          : [];

      const pizza =
        String(
          item.cat || ''
        ).toLowerCase() ===
        'pizza';

      setView(
        `
          <div class="page-head">
            <div>
              <h2>Edit Menu Item</h2>
              <p>
                ${esc(
                  item.name
                )}
              </p>
            </div>

            <button
              class="btn"
              onclick="menu()"
            >
              ← Back
            </button>
          </div>

          <div class="panel">

            <form
              id="editMenuForm"
              onsubmit="saveMenuItem(
                event,
                '${esc(item.id)}'
              )"
            >

              <label>Name</label>

              <input
                id="eName"
                value="${esc(
                  item.name || ''
                )}"
                required
              >

              <label>Category</label>

              <select id="eCat">
                ${[
                  'Pizza',
                  'Momo',
                  'Continental',
                  'Kacchi'
                ].map(c => `
                  <option
                    ${
                      String(
                        item.cat
                      ).toLowerCase() ===
                      c.toLowerCase()
                        ? 'selected'
                        : ''
                    }
                  >
                    ${c}
                  </option>
                `).join('')}
              </select>

              <label>Base Price</label>

              <input
                id="ePrice"
                type="number"
                min="0"
                value="${Number(
                  item.price || 0
                )}"
              >

              <label>Description</label>

              <textarea
                id="eDescription"
              >${esc(
                item.description || ''
              )}</textarea>

              <h3>Sizes / Prices</h3>

              <div id="sizeRows">

                ${
                  sizes.length
                    ? sizes.map(
                        (s, i) => {

                          const label =
                            Array.isArray(s)
                              ? s[0]
                              : s?.label ||
                                '';

                          const price =
                            Array.isArray(s)
                              ? s[1]
                              : s?.price ||
                                0;

                          return `
                            <div
                              class="size-row"
                            >
                              <input
                                class="size-label"
                                value="${esc(
                                  label
                                )}"
                                placeholder="Size"
                              >

                              <input
                                class="size-price"
                                type="number"
                                min="0"
                                value="${Number(
                                  price
                                )}"
                                placeholder="Price"
                              >

                              <button
                                type="button"
                                class="small-btn danger"
                                onclick="this.parentElement.remove()"
                              >
                                ×
                              </button>
                            </div>
                          `;
                        }
                      ).join('')
                    : ''
                }

              </div>

              <button
                type="button"
                class="small-btn"
                onclick="addSizeRow()"
              >
                + Add Size
              </button>

              <br><br>

              <label>
                <input
                  id="ePrebook"
                  type="checkbox"
                  ${
                    item.prebook &&
                    !pizza
                      ? 'checked'
                      : ''
                  }
                  ${
                    pizza
                      ? 'disabled'
                      : ''
                  }
                >
                Pre-order ON
              </label>

              <label>
                <input
                  id="eActive"
                  type="checkbox"
                  ${
                    item.active !== false
                      ? 'checked'
                      : ''
                  }
                >
                Active
              </label>

              <br>

              <button
                class="btn"
                type="submit"
              >
                Save Changes
              </button>

            </form>

            <hr>

            <h3>Item Image</h3>

            <div>
              ${
                item.image
                  ? `<img
                      src="${esc(
                        item.image
                      )}"
                      class="edit-image"
                      alt=""
                    >`
                  : '<p>No image</p>'
              }
            </div>

            <input
              id="menuImage"
              type="file"
              accept="image/*"
            >

            <button
              class="btn"
              type="button"
              onclick="uploadMenuImage(
                '${esc(item.id)}'
              )"
            >
              Upload Image
            </button>

          </div>
        `,
        'Edit Menu Item'
      );

    } catch (error) {
      alert(
        error.message ||
        'Could not load menu item.'
      );
    }
  }

  function addSizeRow() {
    const box = $('sizeRows');

    if (!box) return;

    const row =
      document.createElement('div');

    row.className =
      'size-row';

    row.innerHTML = `
      <input
        class="size-label"
        placeholder="Size"
      >

      <input
        class="size-price"
        type="number"
        min="0"
        placeholder="Price"
      >

      <button
        type="button"
        class="small-btn danger"
        onclick="this.parentElement.remove()"
      >
        ×
      </button>
    `;

    box.appendChild(row);
  }

  async function saveMenuItem(
    event,
    id
  ) {
    event.preventDefault();

    const cat =
      $('eCat')?.value || '';

    const rows =
      document.querySelectorAll(
        '#sizeRows .size-row'
      );

    const sizes = [];

    rows.forEach(row => {
      const label =
        row.querySelector(
          '.size-label'
        )?.value.trim();

      const price =
        Number(
          row.querySelector(
            '.size-price'
          )?.value || 0
        );

      if (
        label &&
        Number.isFinite(price)
      ) {
        sizes.push([
          label,
          price
        ]);
      }
    });

    const payload = {
      id,

      name:
        $('eName')?.value.trim() ||
        '',

      cat,

      price:
        Number(
          $('ePrice')?.value || 0
        ),

      sizes,

      description:
        $('eDescription')?.value.trim() ||
        '',

      prebook:
        cat === 'Pizza' ||
        cat === 'Momo'
          ? false
          : Boolean(
              $('ePrebook')?.checked
            ),

      active:
        Boolean(
          $('eActive')?.checked
        )
    };

    try {
      await api(
        '/admin/menu',
        {
          method: 'PUT',
          body: JSON.stringify(
            payload
          )
        }
      );

      alert(
        'Menu item updated successfully.'
      );

      await menu();

    } catch (error) {
      alert(
        error.message ||
        'Could not update menu item.'
      );
    }
  }

  /* =======================================================
     DELETE MENU ITEM
     ======================================================= */

  async function deleteMenuItem(id) {
    if (!id) return;

    const yes =
      confirm(
        'Delete this menu item?'
      );

    if (!yes) return;

    try {
      await api(
        `/admin/menu/${encodeURIComponent(id)}`,
        {
          method: 'DELETE'
        }
      );

      await menu();

    } catch (error) {
      alert(
        error.message ||
        'Could not delete menu item.'
      );
    }
  }

  /* =======================================================
     IMAGE UPLOAD
     ======================================================= */

  async function uploadMenuImage(id) {
    const input =
      $('menuImage');

    if (!input?.files?.length) {
      alert(
        'Please select an image first.'
      );
      return;
    }

    const form =
      new FormData();

    form.append(
      'image',
      input.files[0]
    );

    try {
      await api(
        `/admin/menu/${encodeURIComponent(id)}/image`,
        {
          method: 'POST',
          body: form
        }
      );

      alert(
        'Image uploaded successfully.'
      );

      await editMenuItem(id);

    } catch (error) {
      alert(
        error.message ||
        'Image upload failed.'
      );
    }
  }

  /* =======================================================
     REVIEWS
     ======================================================= */

  async function reviews() {
    currentView = 'reviews';

    setView(
      `
        <div class="page-head">
          <div>
            <h2>Reviews</h2>
            <p>Manage customer reviews</p>
          </div>

          <button
            class="btn"
            onclick="reviews()"
          >
            ↻ Refresh
          </button>
        </div>

        <div id="reviewsBox">
          Loading reviews...
        </div>
      `,
      'Reviews'
    );

    try {
      const data =
        await api('/admin/reviews');

      const list =
        Array.isArray(data)
          ? data
          : data.reviews || [];

      const box =
        $('reviewsBox');

      if (!box) return;

      if (!list.length) {
        box.innerHTML =
          '<p>No reviews found.</p>';
        return;
      }

      box.innerHTML = `
        <div class="table-wrap">
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
                    ${esc(
                      review.customerName ||
                      review.name ||
                      review.customer?.name ||
                      'Customer'
                    )}
                  </td>

                  <td>
                    ${'★'.repeat(
                      Math.max(
                        0,
                        Math.min(
                          5,
                          Number(
                            review.rating || 0
                          )
                        )
                      )
                    )}
                  </td>

                  <td>
                    ${esc(
                      review.text ||
                      review.comment ||
                      review.review ||
                      ''
                    )}
                  </td>

                  <td>
                    ${
                      review.approved === false
                        ? 'Hidden'
                        : 'Visible'
                    }
                  </td>

                  <td>
                    <button
                      class="small-btn"
                      onclick="toggleReview(
                        '${esc(
                          review.id
                        )}',
                        ${
                          review.approved === false
                            ? 'true'
                            : 'false'
                        }
                      )"
                    >
                      ${
                        review.approved === false
                          ? 'Approve'
                          : 'Hide'
                      }
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

    } catch (error) {
      const box =
        $('reviewsBox');

      if (box) {
        box.innerHTML = `
          <p class="error">
            ${esc(
              error.message
            )}
          </p>
        `;
      }
    }
  }

  async function toggleReview(
    id,
    approved
  ) {
    if (!id) return;

    try {
      await api(
        `/admin/reviews/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            approved:
              approved === true ||
              approved === 'true'
          })
        }
      );

      await reviews();

    } catch (error) {
      alert(
        error.message ||
        'Could not update review.'
      );
    }
  }

  /* =======================================================
     CUSTOMERS
     ======================================================= */

  async function customers() {
    currentView = 'customers';

    setView(
      `
        <div class="page-head">
          <div>
            <h2>Customers</h2>
            <p>Registered customer accounts</p>
          </div>

          <button
            class="btn"
            onclick="customers()"
          >
            ↻ Refresh
          </button>
        </div>

        <div id="customersBox">
          Loading customers...
        </div>
      `,
      'Customers'
    );

    try {
      const data =
        await api(
          '/admin/customers'
        );

      const list =
        Array.isArray(data)
          ? data
          : data.customers || [];

      const box =
        $('customersBox');

      if (!box) return;

      if (!list.length) {
        box.innerHTML =
          '<p>No customers found.</p>';
        return;
      }

      box.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Joined</th>
              </tr>
            </thead>

            <tbody>
              ${list.map(customer => `
                <tr>
                  <td>
                    ${esc(
                      customer.name ||
                      ''
                    )}
                  </td>

                  <td>
                    ${esc(
                      customer.phone ||
                      customer.mobile ||
                      ''
                    )}
                  </td>

                  <td>
                    ${esc(
                      customer.email ||
                      ''
                    )}
                  </td>

                  <td>
                    ${
                      customer.orderCount ??
                      customer.ordersCount ??
                      0
                    }
                  </td>

                  <td>
                    ${formatDate(
                      customer.createdAt
                    )}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

    } catch (error) {
      const box =
        $('customersBox');

      if (box) {
        box.innerHTML = `
          <p class="error">
            ${esc(
              error.message
            )}
          </p>
        `;
      }
    }
  }

  /* =======================================================
     DELIVERY & SETTINGS
     ======================================================= */

  async function settings() {
    currentView = 'settings';

    setView(
      `
        <div class="page-head">
          <div>
            <h2>Delivery & Settings</h2>
            <p>Delivery radius, payment and shop hours</p>
          </div>

          <button
            class="btn"
            onclick="settings()"
          >
            ↻ Refresh
          </button>
        </div>

        <div id="settingsBox">
          Loading settings...
        </div>
      `,
      'Delivery & Settings'
    );

    try {
      const data =
        await api(
          '/admin/settings'
        );

      const s =
        data.settings || data;

      const delivery =
        s.delivery || {};

      const payment =
        s.payment || {};

      const hours =
        s.hours || {};

      const prebook =
        s.prebook || {};

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

      const box =
        $('settingsBox');

      if (!box) return;

      box.innerHTML = `
        <div class="panel">
          <h3>Delivery</h3>

          <label>
            Base Location Name
          </label>

          <input
            id="sBaseName"
            value="${esc(
              delivery.name ||
              delivery.baseName ||
              'Kahalthuri Hamidia High School'
            )}"
          >

          <label>
            Latitude
          </label>

          <input
            id="sLat"
            type="number"
            step="any"
            value="${Number(
              delivery.lat ??
              delivery.latitude ??
              23.3022494
            )}"
          >

          <label>
            Longitude
          </label>

          <input
            id="sLng"
            type="number"
            step="any"
            value="${Number(
              delivery.lng ??
              delivery.longitude ??
              90.9187528
            )}"
          >

          <label>
            COD Radius (km)
          </label>

          <input
            id="sCodRadius"
            type="number"
            step="0.1"
            min="0"
            value="${Number(
              delivery.codRadiusKm ??
              delivery.codRadius ??
              1
            )}"
          >

          <label>
            Maximum Delivery Radius (km)
          </label>

          <input
            id="sMaxRadius"
            type="number"
            step="0.1"
            min="0"
            value="${Number(
              delivery.maxRadiusKm ??
              delivery.maxRadius ??
              4
            )}"
          >

          <label>
            Delivery Rate / started km
          </label>

          <input
            id="sRate"
            type="number"
            step="1"
            min="0"
            value="${Number(
              delivery.ratePerKm ??
              10
            )}"
          >

          <label>
            COD Charge
          </label>

          <input
            id="sCodCharge"
            type="number"
            step="1"
            min="0"
            value="${Number(
              delivery.codCharge ??
              0
            )}"
          >
        </div>

        <div class="panel">
          <h3>Payment</h3>

          <label>
            bKash Number
          </label>

          <input
            id="sBkash"
            value="${esc(
              payment.bkash ||
              payment.bkashNumber ||
              '01792494275'
            )}"
          >

          <label>
            Nagad Number
          </label>

          <input
            id="sNagad"
            value="${esc(
              payment.nagad ||
              payment.nagadNumber ||
              '01792494275'
            )}"
          >

          <label>
            Payment Method
          </label>

          <input
            id="sPaymentMethod"
            value="${esc(
              payment.method ||
              'Send Money Only'
            )}"
          >
        </div>

        <div class="panel">
          <h3>Shop Hours</h3>

          <h4>Sunday – Thursday</h4>

          <label>
            Opening Hour
          </label>

          <input
            id="sNormalOpen"
            type="number"
            min="0"
            max="23"
            value="${Number(
              normal.open
            )}"
          >

          <label>
            Closing Hour
          </label>

          <input
            id="sNormalClose"
            type="number"
            min="1"
            max="24"
            value="${Number(
              normal.close
            )}"
          >

          <h4>Friday</h4>

          <label>
            Opening Hour
          </label>

          <input
            id="sFridayOpen"
            type="number"
            min="0"
            max="23"
            value="${Number(
              friday.open
            )}"
          >

          <label>
            Closing Hour
          </label>

          <input
            id="sFridayClose"
            type="number"
            min="1"
            max="24"
            value="${Number(
              friday.close
            )}"
          >
        </div>

        <div class="panel">
          <h3>Pre-order</h3>

          <label>
            <input
              id="sPrebookEnabled"
              type="checkbox"
              ${
                prebook.enabled !== false
                  ? 'checked'
                  : ''
              }
            >
            Enable pre-order
          </label>

          <p>
            Continental/Kacchi items can use
            pre-order when the item itself is ON.
          </p>

          <p>
            Pizza and Momo remain OFF.
          </p>
        </div>

        <button
          class="btn full"
          onclick="saveSettings()"
        >
          Save Settings
        </button>
      `;

    } catch (error) {
      const box =
        $('settingsBox');

      if (box) {
        box.innerHTML = `
          <p class="error">
            ${esc(
              error.message
            )}
          </p>
        `;
      }
    }
  }

  /* =======================================================
     SAVE SETTINGS
     ======================================================= */

  async function saveSettings() {
    const payload = {
      delivery: {
        name:
          $('sBaseName')?.value.trim() ||
          'Kahalthuri Hamidia High School',

        lat:
          Number(
            $('sLat')?.value ||
            23.3022494
          ),

        lng:
          Number(
            $('sLng')?.value ||
            90.9187528
          ),

        codRadiusKm:
          Number(
            $('sCodRadius')?.value ||
            1
          ),

        maxRadiusKm:
          Number(
            $('sMaxRadius')?.value ||
            4
          ),

        ratePerKm:
          Number(
            $('sRate')?.value ||
            10
          ),

        codCharge:
          Number(
            $('sCodCharge')?.value ||
            0
          )
      },

      payment: {
        bkash:
          $('sBkash')?.value.trim() ||
          '01792494275',

        nagad:
          $('sNagad')?.value.trim() ||
          '01792494275',

        method:
          $('sPaymentMethod')?.value.trim() ||
          'Send Money Only'
      },

      hours: {
        normal: {
          open:
            Number(
              $('sNormalOpen')?.value ||
              11
            ),

          close:
            Number(
              $('sNormalClose')?.value ||
              19
            )
        },

        friday: {
          open:
            Number(
              $('sFridayOpen')?.value ||
              15
            ),

          close:
            Number(
              $('sFridayClose')?.value ||
              21
            )
        }
      },

      prebook: {
        enabled:
          Boolean(
            $('sPrebookEnabled')?.checked
          )
      }
    };

    if (
      payload.delivery.maxRadiusKm <
      payload.delivery.codRadiusKm
    ) {
      alert(
        'Maximum radius cannot be smaller than COD radius.'
      );
      return;
    }

    if (
      payload.hours.normal.close <=
      payload.hours.normal.open
    ) {
      alert(
        'Normal closing hour must be after opening hour.'
      );
      return;
    }

    if (
      payload.hours.friday.close <=
      payload.hours.friday.open
    ) {
      alert(
        'Friday closing hour must be after opening hour.'
      );
      return;
    }

    try {
      await api(
        '/admin/settings',
        {
          method: 'PUT',
          body: JSON.stringify(
            payload
          )
        }
      );

      alert(
        'Settings saved successfully.'
      );

      await settings();

    } catch (error) {
      alert(
        error.message ||
        'Could not save settings.'
      );
    }
  }

  /* =======================================================
     DATE / TIME
     ======================================================= */

  function formatDate(value) {
    if (!value) return '—';

    const d =
      new Date(value);

    if (
      Number.isNaN(
        d.getTime()
      )
    ) {
      return esc(value);
    }

    return d.toLocaleString(
      'en-BD',
      {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    );
  }

  /* =======================================================
     MOBILE SIDEBAR
     ======================================================= */

  function toggleAdminSidebar() {
    const sidebar =
      document.querySelector(
        '.admin-sidebar'
      );

    if (sidebar) {
      sidebar.classList.toggle(
        'open'
      );
    }
  }

  /* =======================================================
     STARTUP
     ======================================================= */

  function init() {
    if (adminToken) {
      showApp();
      dash().catch(error => {
        console.error(error);
      });
    } else {
      showLogin();
    }
  }

  /* =======================================================
     GLOBAL EXPORTS
     ======================================================= */

  window.adminLogin =
    adminLogin;

  window.logout =
    logout;

  window.dash =
    dash;

  window.orders =
    orders;

  window.menu =
    menu;

  window.reviews =
    reviews;

  window.customers =
    customers;

  window.settings =
    settings;

  window.updateOrderStatus =
    updateOrderStatus;

  window.viewOrder =
    viewOrder;

  window.showAddMenuForm =
    showAddMenuForm;

  window.saveNewMenuItem =
    saveNewMenuItem;

  window.editMenuItem =
    editMenuItem;

  window.addSizeRow =
    addSizeRow;

  window.saveMenuItem =
    saveMenuItem;

  window.deleteMenuItem =
    deleteMenuItem;

  window.uploadMenuImage =
    uploadMenuImage;

  window.toggleReview =
    toggleReview;

  window.saveSettings =
    saveSettings;

  window.toggleAdminSidebar =
    toggleAdminSidebar;

  document.addEventListener(
    'DOMContentLoaded',
    init
  );

})();
