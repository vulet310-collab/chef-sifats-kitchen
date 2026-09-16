'use strict';



/* =========================================================
   ADMIN STATE
========================================================= */

let adminToken =
  localStorage.getItem(
    'csk_admin_token'
  ) || '';



let adminMenu = [];

let adminOrders = [];

let adminReviews = [];

let adminCustomers = [];

let adminSettings = {};



/* =========================================================
   HELPERS
========================================================= */

function aesc(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}



function amoney(value) {

  return '৳' +
    Number(value || 0)
      .toLocaleString('en-BD', {
        maximumFractionDigits: 0
      });

}



async function api(
  url,
  options = {}
) {

  const headers =
    options.headers || {};


  headers.Authorization =
    `Bearer ${adminToken}`;


  if (
    options.body &&
    !headers['Content-Type']
  ) {

    headers['Content-Type'] =
      'application/json';

  }


  const response =
    await fetch(
      url,
      {
        ...options,
        headers
      }
    );


  if (
    response.status ===
    401
  ) {

    adminLogout();

    throw new Error(
      'Admin session expired.'
    );

  }


  const data =
    await response.json();


  if (
    !response.ok ||
    data.ok === false
  ) {

    throw new Error(
      data.message ||
      'Request failed.'
    );

  }


  return data;

}



/* =========================================================
   LOGIN
========================================================= */

async function adminLogin() {

  const username =
    document
      .getElementById(
        'adminUsername'
      )
      ?.value
      .trim();


  const password =
    document
      .getElementById(
        'adminPassword'
      )
      ?.value;


  const message =
    document.getElementById(
      'loginMessage'
    );


  if (
    !username ||
    !password
  ) {

    if (message) {

      message.textContent =
        'Username and password required.';

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


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.ok
    ) {

      throw new Error(
        data.message ||
        'Login failed.'
      );

    }


    adminToken =
      data.token ||
      data.accessToken ||
      '';


    if (!adminToken) {

      throw new Error(
        'No admin token returned.'
      );

    }


    localStorage.setItem(
      'csk_admin_token',
      adminToken
    );


    showApp();

    dash();


  } catch (error) {

    if (message) {

      message.textContent =
        error.message ||
        'Login failed.';

      message.style.color =
        '#b00000';

    }

  }

}



/* =========================================================
   SHOW APP
========================================================= */

function showApp() {

  const login =
    document.getElementById(
      'login'
    );

  const app =
    document.getElementById(
      'app'
    );


  if (login) {
    login.style.display =
      'none';
  }


  if (app) {
    app.style.display =
      'block';
  }

}



function adminLogout() {

  adminToken = '';

  localStorage.removeItem(
    'csk_admin_token'
  );


  const login =
    document.getElementById(
      'login'
    );

  const app =
    document.getElementById(
      'app'
    );


  if (app) {
    app.style.display =
      'none';
  }


  if (login) {
    login.style.display =
      'flex';
  }

}



/* =========================================================
   DASHBOARD
========================================================= */

async function dash() {

  const view =
    document.getElementById(
      'view'
    );


  if (!view) return;


  view.innerHTML =
    '<h2>Loading dashboard...</h2>';


  try {

    const [
      orderData,
      menuData,
      reviewData,
      customerData
    ] =
      await Promise.all([

        api(
          '/api/admin/orders'
        ),

        api(
          '/api/admin/menu'
        ),

        api(
          '/api/admin/reviews'
        ),

        api(
          '/api/admin/customers'
        )

      ]);


    adminOrders =
      orderData.orders ||
      orderData.items ||
      [];


    adminMenu =
      menuData.menu ||
      menuData.items ||
      [];


    adminReviews =
      reviewData.reviews ||
      reviewData.items ||
      [];


    adminCustomers =
      customerData.customers ||
      customerData.items ||
      [];


    const pending =
      adminOrders.filter(
        o =>
          String(
            o.status ||
            ''
          ).toLowerCase() ===
          'pending'
      ).length;


    const revenue =
      adminOrders.reduce(
        (
          sum,
          order
        ) =>
          sum +
          Number(
            order.total ||
            order.grandTotal ||
            0
          ),
        0
      );


    view.innerHTML = `

      <h2>
        📊 Dashboard
      </h2>


      <div class="grid">

        <div class="card">

          <h3>
            Orders
          </h3>

          <strong>
            ${adminOrders.length}
          </strong>

        </div>


        <div class="card">

          <h3>
            Pending
          </h3>

          <strong>
            ${pending}
          </strong>

        </div>


        <div class="card">

          <h3>
            Menu Items
          </h3>

          <strong>
            ${adminMenu.length}
          </strong>

        </div>


        <div class="card">

          <h3>
            Customers
          </h3>

          <strong>
            ${adminCustomers.length}
          </strong>

        </div>


        <div class="card">

          <h3>
            Reviews
          </h3>

          <strong>
            ${adminReviews.length}
          </strong>

        </div>


        <div class="card">

          <h3>
            Order Value
          </h3>

          <strong>
            ${amoney(revenue)}
          </strong>

        </div>

      </div>

    `;

  } catch (error) {

    view.innerHTML = `

      <h2>
        Dashboard
      </h2>

      <p>
        ${aesc(
          error.message
        )}
      </p>

    `;

  }

}



/* =========================================================
   ORDERS
========================================================= */

async function orders() {

  const view =
    document.getElementById(
      'view'
    );


  view.innerHTML =
    '<h2>Loading orders...</h2>';


  try {

    const data =
      await api(
        '/api/admin/orders'
      );


    adminOrders =
      data.orders ||
      data.items ||
      [];


    if (!adminOrders.length) {

      view.innerHTML =
        '<h2>📦 Orders</h2><p>No orders.</p>';

      return;

    }


    view.innerHTML = `

      <h2>
        📦 Orders
      </h2>


      <div class="table-wrap">

        <table>

          <thead>

            <tr>

              <th>
                Order
              </th>

              <th>
                Customer
              </th>

              <th>
                Total
              </th>

              <th>
                Payment
              </th>

              <th>
                Status
              </th>

              <th>
                Action
              </th>

            </tr>

          </thead>


          <tbody id="ordersTable"></tbody>

        </table>

      </div>

    `;


    const tbody =
      document.getElementById(
        'ordersTable'
      );


    adminOrders.forEach(
      function (order) {

        const tr =
          document.createElement(
            'tr'
          );


        tr.innerHTML = `

          <td>
            ${aesc(
              order.id ||
              order.orderId ||
              ''
            )}
          </td>


          <td>
            ${aesc(
              order.customer?.name ||
              order.name ||
              ''
            )}

            <br>

            ${aesc(
              order.customer?.phone ||
              order.phone ||
              ''
            )}
          </td>


          <td>
            ${amoney(
              order.total ||
              order.grandTotal
            )}
          </td>


          <td>
            ${aesc(
              order.paymentMethod ||
              ''
            )}
          </td>


          <td>
            ${aesc(
              order.status ||
              'Pending'
            )}
          </td>


          <td>

            <select
              class="admin-input"
              onchange="
                updateOrderStatus(
                  '${aesc(
                    order.id ||
                    order.orderId
                  )}',
                  this.value
                )
              "
            >

              ${[
                'Pending',
                'Confirmed',
                'Preparing',
                'Out for Delivery',
                'Delivered',
                'Cancelled'
              ].map(
                status =>
                  `<option
                    ${
                      String(
                        order.status
                      ) ===
                      status
                        ? 'selected'
                        : ''
                    }
                  >
                    ${status}
                  </option>`
              ).join('')}

            </select>

          </td>

        `;


        tbody.appendChild(
          tr
        );

      }
    );


  } catch (error) {

    view.innerHTML = `

      <h2>
        Orders
      </h2>

      <p>
        ${aesc(
          error.message
        )}
      </p>

    `;

  }

}



/* =========================================================
   ORDER STATUS
========================================================= */

async function updateOrderStatus(
  id,
  status
) {

  try {

    await api(
      `/api/admin/orders/${encodeURIComponent(id)}`,
      {

        method: 'PATCH',

        body:
          JSON.stringify({
            status
          })

      }
    );


    alert(
      'Order status updated.'
    );


  } catch (error) {

    alert(
      error.message
    );

  }

}



/* =========================================================
   MENU
========================================================= */

async function menu() {

  const view =
    document.getElementById(
      'view'
    );


  view.innerHTML =
    '<h2>Loading menu...</h2>';


  try {

    const data =
      await api(
        '/api/admin/menu'
      );


    adminMenu =
      data.menu ||
      data.items ||
      [];


    view.innerHTML = `

      <h2>
        🍕 Menu Management
      </h2>


      <button
        class="admin-btn success"
        onclick="showAddMenuForm()"
      >
        + Add Menu Item
      </button>


      <div
        id="menuForm"
        style="margin:20px 0"
      ></div>


      <div
        id="adminMenuGrid"
        class="grid"
      ></div>

    `;


    renderAdminMenu();


  } catch (error) {

    view.innerHTML = `

      <h2>
        Menu
      </h2>

      <p>
        ${aesc(
          error.message
        )}
      </p>

    `;

  }

}



function renderAdminMenu() {

  const grid =
    document.getElementById(
      'adminMenuGrid'
    );


  if (!grid) return;


  grid.innerHTML = '';


  adminMenu.forEach(
    function (item) {

      const sizes =
        Array.isArray(
          item.sizes
        )
          ? item.sizes
          : [];


      const sizeText =
        sizes.map(
          s =>
            Array.isArray(s)
              ? `${aesc(s[0])}: ${amoney(s[1])}`
              : `${aesc(s.label || '')}: ${amoney(s.price)}`
        ).join('<br>');


      const card =
        document.createElement(
          'div'
        );


      card.className =
        'card';


      card.innerHTML = `

        <img
          src="${aesc(
            item.image ||
            '/assets/food.jpg'
          )}"
          onerror="
            this.src='/assets/food.jpg'
          "
        >


        <h3>
          ${aesc(
            item.name
          )}
        </h3>


        <p>
          Category:
          ${aesc(
            item.cat
          )}
        </p>


        <p>
          ${
            sizeText ||
            amoney(item.price)
          }
        </p>


        <p>
          Pre-order:
          ${
            item.prebook
              ? 'ON'
              : 'OFF'
          }
        </p>


        <p>
          Active:
          ${
            item.active !== false
              ? 'YES'
              : 'NO'
          }
        </p>


        <button
          class="admin-btn"
          onclick="
            editMenuItem(
              '${aesc(item.id)}'
            )
          "
        >
          Edit
        </button>


        <button
          class="admin-btn danger"
          onclick="
            deleteMenuItem(
              '${aesc(item.id)}'
            )
          "
        >
          Delete
        </button>

      `;


      grid.appendChild(
        card
      );

    }
  );

}



/* =========================================================
   ADD MENU
========================================================= */

function showAddMenuForm() {

  const box =
    document.getElementById(
      'menuForm'
    );


  box.innerHTML = `

    <div class="card">

      <h3>
        Add Menu Item
      </h3>


      <div class="form-grid">

        <input
          id="mName"
          placeholder="Food name"
        >


        <select id="mCat">

          <option>
            Pizza
          </option>

          <option>
            Momo
          </option>

          <option>
            Continental
          </option>

          <option>
            Kacchi
          </option>

        </select>


        <input
          id="mPrice"
          type="number"
          placeholder="Base price"
        >


        <input
          id="mImage"
          placeholder="Image path"
        >


        <textarea
          id="mDescription"
          placeholder="Description"
        ></textarea>

      </div>


      <label>

        <input
          id="mPrebook"
          type="checkbox"
        >

        Pre-order ON

      </label>


      <br>


      <label>

        <input
          id="mActive"
          type="checkbox"
          checked
        >

        Active

      </label>


      <br>


      <button
        class="admin-btn success"
        onclick="createMenuItem()"
      >
        Save Item
      </button>

    </div>

  `;

}



/* =========================================================
   CREATE MENU
========================================================= */

async function createMenuItem() {

  const item = {

    id:
      'item-' +
      Date.now(),

    name:
      document.getElementById(
        'mName'
      ).value.trim(),

    cat:
      document.getElementById(
        'mCat'
      ).value,

    price:
      Number(
        document.getElementById(
          'mPrice'
        ).value
      ) || 0,

    image:
      document.getElementById(
        'mImage'
      ).value.trim(),

    description:
      document.getElementById(
        'mDescription'
      ).value.trim(),

    prebook:
      document.getElementById(
        'mPrebook'
      ).checked,

    active:
      document.getElementById(
        'mActive'
      ).checked

  };


  /* Pizza always OFF */

  if (
    item.cat ===
    'Pizza'
  ) {

    item.prebook =
      false;

  }


  try {

    await api(
      '/api/admin/menu',
      {

        method: 'POST',

        body:
          JSON.stringify(
            item
          )

      }
    );


    alert(
      'Menu item created.'
    );


    menu();


  } catch (error) {

    alert(
      error.message
    );

  }

}



/* =========================================================
   EDIT MENU
========================================================= */

function editMenuItem(id) {

  const item =
    adminMenu.find(
      x =>
        String(x.id) ===
        String(id)
    );


  if (!item) return;


  const box =
    document.getElementById(
      'menuForm'
    );


  box.innerHTML = `

    <div class="card">

      <h3>
        Edit:
        ${aesc(item.name)}
      </h3>


      <div class="form-grid">

        <input
          id="eName"
          value="${aesc(
            item.name
          )}"
        >


        <select id="eCat">

          ${[
            'Pizza',
            'Momo',
            'Continental',
            'Kacchi'
          ].map(
            cat =>
              `<option
                ${
                  item.cat === cat
                    ? 'selected'
                    : ''
                }
              >
                ${cat}
              </option>`
          ).join('')}

        </select>


        <input
          id="ePrice"
          type="number"
          value="${Number(
            item.price || 0
          )}"
        >


        <input
          id="eImage"
          value="${aesc(
            item.image || ''
          )}"
        >


        <textarea
          id="eDescription"
        >${aesc(
          item.description || ''
        )}</textarea>

      </div>


      <label>

        <input
          id="ePrebook"
          type="checkbox"
          ${
            item.prebook
              ? 'checked'
              : ''
          }
        >

        Pre-order ON

      </label>


      <br>


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
        class="admin-btn success"
        onclick="
          saveMenuItem(
            '${aesc(id)}'
          )
        "
      >
        Save Changes
      </button>

    </div>

  `;

}



/* =========================================================
   SAVE MENU
========================================================= */

async function saveMenuItem(id) {

  const old =
    adminMenu.find(
      x =>
        String(x.id) ===
        String(id)
    );


  if (!old) return;


  const updated = {

    ...old,

    name:
      document.getElementById(
        'eName'
      ).value.trim(),

    cat:
      document.getElementById(
        'eCat'
      ).value,

    price:
      Number(
        document.getElementById(
          'ePrice'
        ).value
      ) || 0,

    image:
      document.getElementById(
        'eImage'
      ).value.trim(),

    description:
      document.getElementById(
        'eDescription'
      ).value.trim(),

    prebook:
      document.getElementById(
        'ePrebook'
      ).checked,

    active:
      document.getElementById(
        'eActive'
      ).checked

  };


  if (
    updated.cat ===
    'Pizza'
  ) {

    updated.prebook =
      false;

  }


  try {

    await api(
      `/api/admin/menu/${encodeURIComponent(id)}`,
      {

        method: 'PUT',

        body:
          JSON.stringify(
            updated
          )

      }
    );


    alert(
      'Menu updated.'
    );


    menu();


  } catch (error) {

    alert(
      error.message
    );

  }

}



/* =========================================================
   DELETE MENU
========================================================= */

async function deleteMenuItem(id) {

  if (
    !confirm(
      'Delete this menu item?'
    )
  ) {

    return;

  }


  try {

    await api(
      `/api/admin/menu/${encodeURIComponent(id)}`,
      {
        method: 'DELETE'
      }
    );


    menu();


  } catch (error) {

    alert(
      error.message
    );

  }

}



/* =========================================================
   REVIEWS
========================================================= */

async function reviews() {

  const view =
    document.getElementById(
      'view'
    );


  view.innerHTML =
    '<h2>Loading reviews...</h2>';


  try {

    const data =
      await api(
        '/api/admin/reviews'
      );


    adminReviews =
      data.reviews ||
      data.items ||
      [];


    view.innerHTML = `

      <h2>
        ⭐ Reviews
      </h2>


      <div id="reviewList"></div>

    `;


    const list =
      document.getElementById(
        'reviewList'
      );


    if (!adminReviews.length) {

      list.innerHTML =
        '<p>No reviews.</p>';

      return;

    }


    adminReviews.forEach(
      function (review) {

        const card =
          document.createElement(
            'div'
          );


        card.className =
          'card';


        card.style.marginBottom =
          '10px';


        card.innerHTML = `

          <strong>
            ${aesc(
              review.name ||
              review.customerName ||
              'Customer'
            )}
          </strong>


          <p>
            Rating:
            ${Number(
              review.rating || 0
            )}/5
          </p>


          <p>
            ${aesc(
              review.text ||
              review.comment ||
              ''
            )}
          </p>


          <p>
            Status:
            ${review.approved
              ? 'Approved'
              : 'Pending'}
          </p>


          <button
            class="admin-btn"
            onclick="
              updateReview(
                '${aesc(
                  review.id
                )}',
                ${review.approved ? 'false' : 'true'}
              )
            "
          >
            ${
              review.approved
                ? 'Hide'
                : 'Approve'
            }
          </button>

        `;


        list.appendChild(
          card
        );

      }
    );


  } catch (error) {

    view.innerHTML = `

      <h2>
        Reviews
      </h2>

      <p>
        ${aesc(
          error.message
        )}
      </p>

    `;

  }

}



/* =========================================================
   REVIEW UPDATE
========================================================= */

async function updateReview(
  id,
  approved
) {

  try {

    await api(
      `/api/admin/reviews/${encodeURIComponent(id)}`,
      {

        method: 'PATCH',

        body:
          JSON.stringify({
            approved
          })

      }
    );


    reviews();


  } catch (error) {

    alert(
      error.message
    );

  }

}



/* =========================================================
   CUSTOMERS
========================================================= */

async function customers() {

  const view =
    document.getElementById(
      'view'
    );


  view.innerHTML =
    '<h2>Loading customers...</h2>';


  try {

    const data =
      await api(
        '/api/admin/customers'
      );


    adminCustomers =
      data.customers ||
      data.items ||
      [];


    view.innerHTML = `

      <h2>
        👥 Customers
      </h2>


      <div class="table-wrap">

        <table>

          <thead>

            <tr>

              <th>
                Name
              </th>

              <th>
                Mobile
              </th>

              <th>
                Email
              </th>

              <th>
                Orders
              </th>

            </tr>

          </thead>


          <tbody id="customerTable"></tbody>

        </table>

      </div>

    `;


    const tbody =
      document.getElementById(
        'customerTable'
      );


    adminCustomers.forEach(
      function (customer) {

        const tr =
          document.createElement(
            'tr'
          );


        tr.innerHTML = `

          <td>
            ${aesc(
              customer.name ||
              ''
            )}
          </td>


          <td>
            ${aesc(
              customer.mobile ||
              customer.phone ||
              ''
            )}
          </td>


          <td>
            ${aesc(
              customer.email ||
              ''
            )}
          </td>


          <td>
            ${Number(
              customer.orderCount ||
              customer.ordersCount ||
              0
            )}
          </td>

        `;


        tbody.appendChild(
          tr
        );

      }
    );


  } catch (error) {

    view.innerHTML = `

      <h2>
        Customers
      </h2>

      <p>
        ${aesc(
          error.message
        )}
      </p>

    `;

  }

}



/* =========================================================
   SETTINGS
========================================================= */

async function settings() {

  const view =
    document.getElementById(
      'view'
    );


  view.innerHTML =
    '<h2>Loading settings...</h2>';


  try {

    const data =
      await api(
        '/api/admin/settings'
      );


    adminSettings =
      data.settings ||
      data;


    const delivery =
      adminSettings.delivery ||
      {};


    const payment =
      adminSettings.payment ||
      {};


    const hours =
      adminSettings.hours ||
      {};


    view.innerHTML = `

      <h2>
        🚚 Delivery & Settings
      </h2>


      <h3>
        Delivery Base
      </h3>


      <div class="form-grid">

        <input
          id="sLat"
          type="number"
          step="any"
          value="${Number(
            delivery.baseLat ??
            delivery.latitude ??
            23.3022494
          )}"
          placeholder="Latitude"
        >


        <input
          id="sLng"
          type="number"
          step="any"
          value="${Number(
            delivery.baseLng ??
            delivery.longitude ??
            90.9187528
          )}"
          placeholder="Longitude"
        >


        <input
          id="sCodRadius"
          type="number"
          step="0.1"
          value="${Number(
            delivery.codRadiusKm ??
            delivery.codRadius ??
            1
          )}"
          placeholder="COD radius km"
        >


        <input
          id="sMaxRadius"
          type="number"
          step="0.1"
          value="${Number(
            delivery.maxRadiusKm ??
            delivery.maxRadius ??
            4
          )}"
          placeholder="Maximum radius km"
        >


        <input
          id="sRate"
          type="number"
          value="${Number(
            delivery.ratePerKm ??
            10
          )}"
          placeholder="Rate per started km"
        >

      </div>



      <h3>
        💳 Payment
      </h3>


      <div class="form-grid">

        <input
          id="sPayment"
          value="${aesc(
            payment.number ||
            payment.bkash ||
            '01792494275'
          )}"
          placeholder="bKash/Nagad number"
        >

      </div>



      <h3>
        🕐 Shop Hours
      </h3>


      <div class="form-grid">

        <input
          id="sNormalOpen"
          type="number"
          value="${Number(
            hours.normal?.open ??
            11
          )}"
          placeholder="Normal open hour"
        >


        <input
          id="sNormalClose"
          type="number"
          value="${Number(
            hours.normal?.close ??
            19
          )}"
          placeholder="Normal close hour"
        >


        <input
          id="sFridayOpen"
          type="number"
          value="${Number(
            hours.friday?.open ??
            15
          )}"
          placeholder="Friday open hour"
        >


        <input
          id="sFridayClose"
          type="number"
          value="${Number(
            hours.friday?.close ??
            21
          )}"
          placeholder="Friday close hour"
        >

      </div>


      <p>
        Customer order slots automatically use:
        Opening + 1 hour → Closing - 1 hour,
        in 30-minute intervals.
      </p>


      <h3>
        📅 Pre-order
      </h3>


      <label>

        <input
          id="sPrebook"
          type="checkbox"
          ${
            adminSettings.prebook?.enabled !== false
              ? 'checked'
              : ''
          }
        >

        Allow pre-order

      </label>


      <br><br>


      <button
        class="admin-btn success"
        onclick="saveSettings()"
      >
        Save Settings
      </button>

    `;


  } catch (error) {

    view.innerHTML = `

      <h2>
        Settings
      </h2>

      <p>
        ${aesc(
          error.message
        )}
      </p>

    `;

  }

}



/* =========================================================
   SAVE SETTINGS
========================================================= */

async function saveSettings() {

  const settings = {

    delivery: {

      baseLat:
        Number(
          document.getElementById(
            'sLat'
          ).value
        ),

      baseLng:
        Number(
          document.getElementById(
            'sLng'
          ).value
        ),

      codRadiusKm:
        Number(
          document.getElementById(
            'sCodRadius'
          ).value
        ),

      maxRadiusKm:
        Number(
          document.getElementById(
            'sMaxRadius'
          ).value
        ),

      ratePerKm:
        Number(
          document.getElementById(
            'sRate'
          ).value
        ),

      codCharge:
        0

    },


    payment: {

      number:
        document.getElementById(
          'sPayment'
        ).value.trim(),

      bkash:
        document.getElementById(
          'sPayment'
        ).value.trim(),

      nagad:
        document.getElementById(
          'sPayment'
        ).value.trim(),

      method:
        'Send Money Only'

    },


    hours: {

      normal: {

        open:
          Number(
            document.getElementById(
              'sNormalOpen'
            ).value
          ),

        close:
          Number(
            document.getElementById(
              'sNormalClose'
            ).value
          )

      },


      friday: {

        open:
          Number(
            document.getElementById(
              'sFridayOpen'
            ).value
          ),

        close:
          Number(
            document.getElementById(
              'sFridayClose'
            ).value
          )

      }

    },


    prebook: {

      enabled:
        document.getElementById(
          'sPrebook'
        ).checked

    }

  };


  try {

    await api(
      '/api/admin/settings',
      {

        method: 'PUT',

        body:
          JSON.stringify(
            settings
          )

      }
    );


    alert(
      'Settings saved successfully.'
    );


    settingsViewReload();


  } catch (error) {

    alert(
      error.message
    );

  }

}



function settingsViewReload() {

  settings();

}



/* =========================================================
   INITIAL ADMIN STATE
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  function () {

    if (adminToken) {

      showApp();

      dash();

    }

  }
);



/* =========================================================
   EXPORTS
========================================================= */

window.adminLogin =
  adminLogin;

window.adminLogout =
  adminLogout;

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

window.updateReview =
  updateReview;

window.showAddMenuForm =
  showAddMenuForm;

window.createMenuItem =
  createMenuItem;

window.editMenuItem =
  editMenuItem;

window.saveMenuItem =
  saveMenuItem;

window.deleteMenuItem =
  deleteMenuItem;

window.saveSettings =
  saveSettings;
