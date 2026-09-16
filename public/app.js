/* =========================================================
   CHEF SIFAT'S KITCHEN
   FINAL APP.JS
========================================================= */

let C = null;
let cart = JSON.parse(localStorage.cskCart || '[]');
let cat = 'All';

let map = null;
let marker = null;
let loc = null;

/* =========================================================
   HELPERS
========================================================= */

const $ = x => document.querySelector(x);

const money = x =>
  '৳' + (Number(x) || 0).toLocaleString('en-BD');

const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));

/* =========================================================
   CUSTOMER AUTH HELPERS
========================================================= */

function customerToken() {
  try {
    if (typeof getCustomerToken === 'function') {
      return getCustomerToken();
    }
  } catch (_) {}

  return localStorage.getItem('csk_customer_token') || '';
}

function customerData() {
  try {
    if (typeof getCustomerData === 'function') {
      return getCustomerData();
    }
  } catch (_) {}

  try {
    return JSON.parse(
      localStorage.getItem('csk_customer_data') || 'null'
    );
  } catch (_) {
    return null;
  }
}

function customerLoggedIn() {
  try {
    if (typeof isCustomerLoggedIn === 'function') {
      return isCustomerLoggedIn();
    }
  } catch (_) {}

  return !!customerToken();
}

function requireCustomerLogin() {
  if (customerLoggedIn()) {
    return true;
  }

  alert(
    'Please login or create a customer account before placing an order.'
  );

  if (typeof openCustomerAuth === 'function') {
    openCustomerAuth('login');
  }

  return false;
}

/* =========================================================
   LOAD CONFIG
========================================================= */

(async function init() {

  try {

    const r =
      await fetch('/api/config');

    if (!r.ok) {
      throw new Error(
        'Could not load website configuration.'
      );
    }

    C = await r.json();

    if (!C.menu) {
      C.menu = [];
    }

    if (!C.settings) {
      C.settings = {};
    }

    /*
      Keep only valid menu items in cart.
    */

    cart = cart.filter(x =>
      C.menu.some(p =>
        String(p.id) === String(x.id)
      )
    );

    render();
    cartUI();

  } catch (e) {

    console.error(e);

    const grid = $('#grid');

    if (grid) {

      grid.innerHTML =
        '<p>Unable to load menu. Please refresh the page.</p>';

    }

  }

})();

/* =========================================================
   MENU
========================================================= */

function render() {

  if (!C) return;

  const q =
    ($('#search')?.value || '')
      .trim()
      .toLowerCase();

  const items =
    C.menu.filter(p => {

      const categoryOK =
        cat === 'All' ||
        p.cat === cat;

      const nameOK =
        String(p.name || '')
          .toLowerCase()
          .includes(q);

      return categoryOK && nameOK;

    });

  const grid = $('#grid');

  if (!grid) return;

  grid.innerHTML =
    items.length

      ? items.map(p => {

          const sizes =
            Array.isArray(p.sizes)
              ? p.sizes
              : [];

          const minQty =
            Number(p.minQty) || 1;

          const maxQty =
            Number(p.maxQty) || 20;

          const showPrebook =
            itemIsPrebook(p);

          return `

            <article class="food">

              <div class="pic">

                ${
                  p.image

                    ? `
                      <img
                        src="${esc(p.image)}"
                        alt="${esc(p.name)}"
                        onerror="
                          this.remove();
                          this.parentElement.textContent='Food image'
                        "
                      >
                    `

                    : 'Food image'
                }

              </div>

              <div class="foodbody">

                <small>
                  ${esc(p.cat || '')}
                  ${
                    showPrebook
                      ? ' • PRE-BOOK'
                      : ''
                  }
                </small>

                <h3>
                  ${esc(p.name)}
                </h3>

                ${
                  sizes.length

                    ? `
                      <select
                        id="s-${esc(p.id)}"
                      >

                        ${sizes.map((s, i) => `
                          <option value="${i}">
                            ${esc(s[0])} — ${money(s[1])}
                          </option>
                        `).join('')}

                      </select>
                    `

                    : `
                      <p>
                        No price available
                      </p>
                    `
                }

                <div class="foodrow">

                  <input
                    id="q-${esc(p.id)}"
                    type="number"
                    min="${minQty}"
                    max="${maxQty}"
                    value="${minQty}"
                  >

                  <button
                    class="btn"
                    onclick="add('${esc(p.id)}')"
                  >
                    Add
                  </button>

                </div>

              </div>

            </article>

          `;

        }).join('')

      : '<p>No food found.</p>';

}

/* =========================================================
   ITEM PRE-ORDER RULE
========================================================= */

function itemIsPrebook(p) {

  if (!p) {
    return false;
  }

  const category =
    String(p.cat || '')
      .trim()
      .toLowerCase();

  /*
    PIZZA = NEVER PRE-ORDER
    MOMO  = NEVER PRE-ORDER
  */

  if (
    category === 'pizza' ||
    category === 'momo'
  ) {

    return false;

  }

  /*
    Admin setting has priority.
  */

  if (
    typeof p.prebook === 'boolean'
  ) {

    return p.prebook;

  }

  /*
    Backward compatibility.
  */

  return (
    category === 'continental' ||
    category === 'kacchi'
  );

}

/* =========================================================
   CART
========================================================= */

function add(id) {

  if (!C) {
    return;
  }

  const p =
    C.menu.find(x =>
      String(x.id) === String(id)
    );

  if (!p) {

    alert(
      'Food item not found.'
    );

    return;
  }

  const sizeIndex =
    Number(
      $('#s-' + id)?.value || 0
    );

  const inputQty =
    Number(
      $('#q-' + id)?.value || 1
    );

  const minQty =
    Number(p.minQty) || 1;

  const maxQty =
    Number(p.maxQty) || 20;

  const qty =
    Math.max(
      minQty,
      Math.min(
        maxQty,
        inputQty
      )
    );

  cart.push({

    id: p.id,

    sizeIndex,

    qty

  });

  save();

  openCart();

}

function save() {

  localStorage.cskCart =
    JSON.stringify(cart);

  cartUI();

}

function cartUI() {

  if (!C) {
    return;
  }

  let subtotal = 0;
  let count = 0;

  cart =
    cart.filter(x =>
      C.menu.some(p =>
        String(p.id) === String(x.id)
      )
    );

  cart.forEach(x => {

    count +=
      Number(x.qty) || 0;

  });

  if ($('#count')) {

    $('#count').textContent =
      count;

  }

  if ($('#cartItems')) {

    $('#cartItems').innerHTML =

      cart.map((x, i) => {

        const p =
          C.menu.find(p =>
            String(p.id) === String(x.id)
          );

        if (!p) {
          return '';
        }

        const sizes =
          Array.isArray(p.sizes)
            ? p.sizes
            : [];

        const z =
          sizes[x.sizeIndex] ||
          sizes[0];

        if (!z) {
          return '';
        }

        const lineTotal =
          Number(z[1]) *
          Number(x.qty);

        subtotal +=
          lineTotal;

        return `

          <div class="cartline">

            <b>
              ${esc(p.name)}
            </b>

            <br>

            ${esc(z[0])}
            × ${x.qty}
            — ${money(lineTotal)}

            <button
              onclick="removeCart(${i})"
            >
              Remove
            </button>

          </div>

        `;

      }).join('') ||

      '<p>Your cart is empty.</p>';

  }

  if ($('#subtotal')) {

    $('#subtotal').textContent =
      money(subtotal);

  }

}

function removeCart(index) {

  cart.splice(index, 1);

  save();

}

function openCart() {

  $('#cart')?.classList.add('open');

  $('#shade')?.classList.add('open');

}

function closeCart() {

  $('#cart')?.classList.remove('open');

  $('#shade')?.classList.remove('open');

}

/* =========================================================
   CHECKOUT
========================================================= */

function checkout() {

  if (!cart.length) {

    alert(
      'Your cart is empty.'
    );

    return;

  }

  /*
    LOGIN REQUIRED
  */

  if (!requireCustomerLogin()) {
    return;
  }

  closeCart();

  const modal =
    $('#modal');

  if (!modal) {

    alert(
      'Checkout interface could not be found.'
    );

    return;

  }

  modal.classList.add('open');

  /*
    Customer information.
  */

  fillCustomerFields();

  /*
    Create map.
  */

  if (!map) {

    const b =
      C.settings.base || {

        lat:
          23.3022494,

        lng:
          90.9187528

      };

    map =
      L.map('map')
        .setView(
          [
            Number(b.lat),
            Number(b.lng)
          ],
          14
        );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {

        attribution:
          '© OpenStreetMap contributors'

      }
    ).addTo(map);

    marker =
      L.marker(
        [
          Number(b.lat),
          Number(b.lng)
        ],
        {
          draggable: true
        }
      ).addTo(map);

    marker.on(
      'dragend',
      () => {

        const p =
          marker.getLatLng();

        point(
          p.lat,
          p.lng
        );

      }
    );

  }

  /*
    Replace manually typed normal delivery
    time with automatic 30-minute slots.
  */

  setupDeliveryTimeUI();

  /*
    Reset to restaurant base.
  */

  base();

  /*
    Payment + summary.
  */

  pay();

  sum();

  setTimeout(
    () => {

      if (map) {
        map.invalidateSize();
      }

    },
    250
  );

}

/* =========================================================
   CUSTOMER FIELD AUTO FILL
========================================================= */

function fillCustomerFields() {

  const data =
    customerData();

  if (!data) {
    return;
  }

  const name =
    $('#name');

  const phone =
    $('#phone');

  if (
    name &&
    !name.value.trim()
  ) {

    name.value =
      data.name || '';

  }

  if (
    phone &&
    !phone.value.trim()
  ) {

    phone.value =
      data.phone || '';

  }

}

/* =========================================================
   CLOSE CHECKOUT
========================================================= */

function closeCheckout() {

  $('#modal')?.classList.remove(
    'open'
  );

}

/* =========================================================
   SHOP BASE
========================================================= */

function base() {

  if (
    !C ||
    !map ||
    !marker
  ) {
    return;
  }

  const b =
    C.settings.base || {

      lat:
        23.3022494,

      lng:
        90.9187528

    };

  const lat =
    Number(b.lat);

  const lng =
    Number(b.lng);

  map.setView(
    [lat, lng],
    15
  );

  marker.setLatLng(
    [lat, lng]
  );

  point(
    lat,
    lng
  );

}

/* =========================================================
   GPS
========================================================= */

function gps() {

  if (!navigator.geolocation) {

    alert(
      'GPS is unavailable. Please drag the map pin instead.'
    );

    return;

  }

  const status =
    $('#status');

  if (status) {

    status.textContent =
      'Detecting your current location…';

  }

  navigator.geolocation.getCurrentPosition(

    p => {

      const lat =
        Number(
          p.coords.latitude
        );

      const lng =
        Number(
          p.coords.longitude
        );

      if (map) {

        map.setView(
          [lat, lng],
          16
        );

      }

      if (marker) {

        marker.setLatLng(
          [lat, lng]
        );

      }

      point(
        lat,
        lng
      );

    },

    () => {

      if (status) {

        status.textContent =
          'GPS failed. Please allow location access or drag the pin manually.';

      }

      alert(
        'Could not detect your location. Please allow GPS permission or move the map pin manually.'
      );

    },

    {

      enableHighAccuracy: true,

      timeout: 15000,

      maximumAge: 0

    }

  );

}

/* =========================================================
   LOCATION CHECK
========================================================= */

async function point(lat, lng) {

  try {

    const cleanLat =
      Number(lat);

    const cleanLng =
      Number(lng);

    if (
      !Number.isFinite(cleanLat) ||
      !Number.isFinite(cleanLng)
    ) {

      throw new Error(
        'Invalid location.'
      );

    }

    const status =
      $('#status');

    if (status) {

      status.textContent =
        'Checking delivery availability…';

    }

    const response =
      await fetch(
        '/api/location/check',
        {

          method:
            'POST',

          headers: {

            'Content-Type':
              'application/json'

          },

          body:
            JSON.stringify({

              lat:
                cleanLat,

              lng:
                cleanLng

            })

        }
      );

    const r =
      await response.json();

    if (!response.ok) {

      throw new Error(
        r.error ||
        'Location check failed.'
      );

    }

    loc = r;

    if (r.allowed) {

      if (status) {

        status.textContent =
          (
            r.message ||
            'Delivery available.'
          ) +
          ' Distance: ' +
          Number(
            r.distanceKm || 0
          ).toFixed(2) +
          ' km • Delivery: ' +
          money(r.charge);

        status.style.borderColor =
          '#475';

      }

    } else {

      if (status) {

        status.textContent =
          r.message ||
          'Delivery is unavailable at this location.';

        status.style.borderColor =
          '#a44';

      }

    }

    pay();

    sum();

  } catch (e) {

    console.error(e);

    loc = null;

    if ($('#status')) {

      $('#status').textContent =
        'Unable to check this location. Please try again.';

      $('#status').style.borderColor =
        '#a44';

    }

    if ($('#pay')) {

      $('#pay').innerHTML =
        '';

    }

    if ($('#sum')) {

      $('#sum').innerHTML =
        '';

    }

  }

}

/* =========================================================
   PRE-ORDER CHECK
========================================================= */

function pre() {

  if (!C) {
    return false;
  }

  return cart.some(x => {

    const p =
      C.menu.find(p =>
        String(p.id) === String(x.id)
      );

    return itemIsPrebook(p);

  });

}

/* =========================================================
   PRE-ORDER SETTINGS
========================================================= */

function getPrebookSettings() {

  const s =
    C?.settings || {};

  const p =
    s.prebook ||
    s.preorder ||
    {};

  return {

    enabled:
      p.enabled !== false

  };

}

function isPrebookAllowed() {

  return getPrebookSettings()
    .enabled;

}

/* =========================================================
   SHOP HOURS
========================================================= */

function getShopHours(
  date = new Date()
) {

  const settings =
    C?.settings || {};

  const hours =
    settings.hours || {};

  const day =
    date.getDay();

  /*
    Friday
  */

  if (day === 5) {

    return (
      hours.friday || {

        open: 15,

        close: 21

      }
    );

  }

  /*
    Normal days
  */

  return (
    hours.normal || {

      open: 11,

      close: 19

    }
  );

}

/* =========================================================
   FINAL ORDER WINDOW
========================================================= */

function getOrderWindow(date) {

  const hours =
    getShopHours(date);

  const open =
    Number(hours.open);

  const close =
    Number(hours.close);

  return {

    start:
      Math.round(
        (open + 1) * 60
      ),

    end:
      Math.round(
        (close - 1) * 60
      )

  };

}

/* =========================================================
   DATE HELPERS
========================================================= */

function dateKey(date) {

  const y =
    date.getFullYear();

  const m =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  const d =
    String(
      date.getDate()
    ).padStart(2, '0');

  return (
    y +
    '-' +
    m +
    '-' +
    d
  );

}

function dateFromKey(key) {

  const parts =
    String(key || '')
      .split('-');

  if (
    parts.length !== 3
  ) {

    return null;

  }

  const y =
    Number(parts[0]);

  const m =
    Number(parts[1]) - 1;

  const d =
    Number(parts[2]);

  const date =
    new Date(
      y,
      m,
      d
    );

  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m ||
    date.getDate() !== d
  ) {

    return null;

  }

  return date;

}

function formatDateLabel(date) {

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const tomorrow =
    new Date(today);

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  const target =
    new Date(date);

  target.setHours(
    0,
    0,
    0,
    0
  );

  if (
    target.getTime() ===
    tomorrow.getTime()
  ) {

    return (
      'Tomorrow, ' +
      target.toLocaleDateString(
        'en-GB',
        {
          day:
            '2-digit',
          month:
            'short'
        }
      )
    );

  }

  return target.toLocaleDateString(
    'en-GB',
    {

      weekday:
        'short',

      day:
        '2-digit',

      month:
        'short'

    }
  );

}

function formatTime(minutes) {

  const hour =
    Math.floor(
      Number(minutes) / 60
    );

  const minute =
    Number(minutes) % 60;

  const suffix =
    hour >= 12
      ? 'PM'
      : 'AM';

  let displayHour =
    hour % 12;

  if (
    displayHour === 0
  ) {

    displayHour = 12;

  }

  return (
    displayHour +
    ':' +
    String(minute)
      .padStart(2, '0') +
    ' ' +
    suffix
  );

}

/* =========================================================
   BUILD NORMAL DELIVERY TIME
========================================================= */

function buildTimeOptions(
  date = new Date()
) {

  const window =
    getOrderWindow(date);

  const slots = [];

  for (
    let minutes =
      window.start;

    minutes <=
      window.end;

    minutes += 30
  ) {

    slots.push({

      value:
        formatTime(minutes),

      label:
        formatTime(minutes)

    });

  }

  return slots;

}

/* =========================================================
   NORMAL DELIVERY TIME UI
========================================================= */

function setupDeliveryTimeUI() {

  const input =
    $('#time');

  if (!input) {
    return;
  }

  /*
    If already converted, don't recreate.
  */

  if (
    input.tagName ===
    'SELECT'
  ) {

    buildDeliveryTimeSlots();

    return;

  }

  const select =
    document.createElement(
      'select'
    );

  select.id =
    input.id || 'time';

  select.name =
    input.name || 'time';

  select.className =
    input.className || '';

  select.style.cssText =
    input.style.cssText || '';

  select.required =
    input.required;

  input.replaceWith(
    select
  );

  buildDeliveryTimeSlots();

}

function buildDeliveryTimeSlots() {

  const select =
    $('#time');

  if (!select) {
    return;
  }

  const today =
    new Date();

  const slots =
    buildTimeOptions(
      today
    );

  const window =
    getOrderWindow(
      today
    );

  select.innerHTML = `

    <option value="">
      Select delivery time
    </option>

    ${slots.map(s => `
      <option value="${esc(s.value)}">
        ${esc(s.label)}
      </option>
    `).join('')}

  `;

  /*
    Shop is currently outside
    customer ordering window.
  */

  if (!slots.length) {

    select.innerHTML = `

      <option value="">
        No delivery slots available today
      </option>

    `;

    select.disabled =
      true;

  } else {

    select.disabled =
      false;

  }

}

/* =========================================================
   PRE-ORDER WINDOW
========================================================= */

function getPrebookWindow(date) {

  return getOrderWindow(date);

}

/* =========================================================
   BUILD PRE-ORDER SECTION
========================================================= */

function buildPrebookSection() {

  if (!pre()) {
    return '';
  }

  if (!isPrebookAllowed()) {

    return `

      <div
        style="
          margin-top:12px;
          padding:12px;
          border:1px solid #a44;
          border-radius:10px;
        "
      >

        <b>
          Pre-order is currently unavailable.
        </b>

        <small>
          Please remove the pre-order item or try again later.
        </small>

      </div>

    `;

  }

  const options = [];

  const today =
    new Date();

  /*
    Next 14 days.
    Customer selects date from dropdown.
  */

  for (
    let i = 1;
    i <= 14;
    i++
  ) {

    const d =
      new Date(today);

    d.setHours(
      0,
      0,
      0,
      0
    );

    d.setDate(
      d.getDate() + i
    );

    options.push(`

      <option value="${dateKey(d)}">

        ${esc(
          formatDateLabel(d)
        )}

      </option>

    `);

  }

  return `

    <div
      id="prebookSection"
      style="
        margin-top:14px;
        padding:14px;
        border:1px solid #555;
        border-radius:12px;
      "
    >

      <b>
        Pre-order
      </b>

      <small
        style="
          display:block;
          margin:6px 0 12px;
        "
      >
        Select your preferred date and time.
      </small>

      <label
        for="prebookDate"
        style="
          display:block;
          margin-bottom:5px;
        "
      >
        Select date
      </label>

      <select
        id="prebookDate"
        style="width:100%;"
      >

        <option value="">
          Select date
        </option>

        ${options.join('')}

      </select>

      <label
        for="prebookTime"
        style="
          display:block;
          margin-top:12px;
          margin-bottom:5px;
        "
      >
        Select time
      </label>

      <select
        id="prebookTime"
        style="width:100%;"
        disabled
      >

        <option value="">
          Select date first
        </option>

      </select>

      <input
        type="hidden"
        id="prebookSlot"
        value=""
      >

      <small
        id="prebookHint"
        style="
          display:block;
          margin-top:8px;
          opacity:.8;
        "
      >
        Available time: Opening +1 hour → Closing −1 hour.
      </small>

    </div>

  `;

}

/* =========================================================
   BUILD PRE-ORDER TIMES
========================================================= */

function buildPrebookTimes() {

  const dateSelect =
    $('#prebookDate');

  const timeSelect =
    $('#prebookTime');

  const hidden =
    $('#prebookSlot');

  const hint =
    $('#prebookHint');

  if (
    !dateSelect ||
    !timeSelect
  ) {

    return;

  }

  const key =
    dateSelect.value;

  if (!key) {

    timeSelect.innerHTML =
      '<option value="">Select date first</option>';

    timeSelect.disabled =
      true;

    if (hidden) {
      hidden.value = '';
    }

    return;

  }

  const date =
    dateFromKey(key);

  if (!date) {

    timeSelect.innerHTML =
      '<option value="">Invalid date</option>';

    timeSelect.disabled =
      true;

    return;

  }

  const window =
    getPrebookWindow(date);

  const slots = [];

  for (
    let minutes =
      window.start;

    minutes <=
      window.end;

    minutes += 30
  ) {

    slots.push(`

      <option value="${minutes}">

        ${formatTime(minutes)}

      </option>

    `);

  }

  timeSelect.innerHTML = `

    <option value="">
      Select time
    </option>

    ${slots.join('')}

  `;

  timeSelect.disabled =
    slots.length === 0;

  if (hidden) {

    hidden.value =
      '';

  }

  if (hint) {

    hint.textContent =
      slots.length

        ? (
            'Available: ' +
            formatTime(window.start) +
            ' – ' +
            formatTime(window.end) +
            ' • 30-minute slots'
          )

        : 'No available time slots for this date.';

  }

}

/* =========================================================
   PRE-ORDER EVENTS
========================================================= */

function setupPrebookEvents() {

  const dateSelect =
    $('#prebookDate');

  const timeSelect =
    $('#prebookTime');

  const hidden =
    $('#prebookSlot');

  if (
    !dateSelect ||
    !timeSelect
  ) {

    return;

  }

  /*
    Prevent duplicate listeners.
  */

  if (
    dateSelect.dataset.bound === '1'
  ) {

    return;

  }

  dateSelect.dataset.bound =
    '1';

  dateSelect.addEventListener(
    'change',
    () => {

      buildPrebookTimes();

      if (hidden) {

        hidden.value =
          '';

      }

    }
  );

  timeSelect.addEventListener(
    'change',
    () => {

      const key =
        dateSelect.value;

      const minutes =
        Number(
          timeSelect.value
        );

      if (
        !key ||
        !Number.isFinite(minutes)
      ) {

        if (hidden) {
          hidden.value = '';
        }

        return;

      }

      const date =
        dateFromKey(key);

      if (!date) {
        return;
      }

      date.setHours(
        Math.floor(
          minutes / 60
        ),
        minutes % 60,
        0,
        0
      );

      if (
        !isValidPrebookDateTime(date)
      ) {

        alert(
          'Please select a valid pre-order time.'
        );

        timeSelect.value =
          '';

        if (hidden) {
          hidden.value = '';
        }

        return;

      }

      if (hidden) {

        hidden.value =
          date.toISOString();

      }

    }
  );

}

/* =========================================================
   PRE-ORDER VALIDATION
========================================================= */

function isValidPrebookDateTime(date) {

  if (
    !(date instanceof Date) ||
    Number.isNaN(
      date.getTime()
    )
  ) {

    return false;

  }

  if (
    date.getTime() <=
    Date.now()
  ) {

    return false;

  }

  if (
    date.getMinutes() !== 0 &&
    date.getMinutes() !== 30
  ) {

    return false;

  }

  const window =
    getPrebookWindow(date);

  const minutes =
    date.getHours() * 60 +
    date.getMinutes();

  return (
    minutes >= window.start &&
    minutes <= window.end
  );

}

function validatePrebookTime() {

  if (!pre()) {

    return {

      ok:
        true,

      value:
        null

    };

  }

  if (!isPrebookAllowed()) {

    return {

      ok:
        false,

      message:
        'Pre-booking is currently disabled.'

    };

  }

  const dateSelect =
    $('#prebookDate');

  const timeSelect =
    $('#prebookTime');

  if (
    !dateSelect ||
    !timeSelect
  ) {

    return {

      ok:
        false,

      message:
        'Please select a pre-order date and time.'

    };

  }

  const key =
    dateSelect.value;

  const selectedMinutes =
    Number(
      timeSelect.value
    );

  if (!key) {

    return {

      ok:
        false,

      message:
        'Please select a pre-order date.'

    };

  }

  if (
    !timeSelect.value ||
    !Number.isFinite(
      selectedMinutes
    )
  ) {

    return {

      ok:
        false,

      message:
        'Please select a pre-order time.'

    };

  }

  const date =
    dateFromKey(key);

  if (!date) {

    return {

      ok:
        false,

      message:
        'Invalid pre-order date.'

    };

  }

  date.setHours(
    Math.floor(
      selectedMinutes / 60
    ),
    selectedMinutes % 60,
    0,
    0
  );

  if (
    !isValidPrebookDateTime(date)
  ) {

    const window =
      getPrebookWindow(date);

    return {

      ok:
        false,

      message:
        'Selected time is outside the allowed pre-order window. Available: ' +
        formatTime(window.start) +
        ' – ' +
        formatTime(window.end) +
        '.'

    };

  }

  return {

    ok:
      true,

    value:
      date.toISOString()

  };

}

/* =========================================================
   PAYMENT NUMBERS
========================================================= */

function getPaymentNumbers() {

  const payment =
    C?.settings?.payment || {};

  return {

    bkash:
      payment.bkash ||
      'Not configured',

    nagad:
      payment.nagad ||
      'Not configured'

  };

}

/* =========================================================
   PAYMENT UI
========================================================= */

function pay() {

  const box =
    $('#pay');

  if (!box) {
    return;
  }

  /*
    Location must be checked first.
  */

  if (!loc?.allowed) {

    box.innerHTML =
      '<b>Select a delivery point inside the service area.</b>';

    return;

  }

  const hasPrebook =
    pre();

  if (
    hasPrebook &&
    !isPrebookAllowed()
  ) {

    box.innerHTML = `

      <b>
        Pre-booking is currently unavailable.
      </b>

      <p>
        Please remove the pre-book item or try again later.
      </p>

    `;

    return;

  }

  const payment =
    getPaymentNumbers();

  /*
    =======================================================
    PRE-ORDER
    ONLINE PAYMENT ONLY
    =======================================================
  */

  if (hasPrebook) {

    box.innerHTML = `

      <b>
        Payment method
      </b>

      <select
        id="paymentMethod"
        style="
          width:100%;
          margin-top:8px;
        "
      >

        <option value="">
          Select payment method
        </option>

        <option value="bKash">
          bKash — Send Money Only
        </option>

        <option value="Nagad">
          Nagad — Send Money Only
        </option>

      </select>

      <div
        id="paymentInfo"
        style="margin-top:10px;"
      ></div>

      <div
        id="txWrap"
        style="
          display:none;
          margin-top:10px;
        "
      >

        <input
          id="tx"
          placeholder="Transaction ID / last 5 digits *"
        >

      </div>

      ${buildPrebookSection()}

    `;

  } else {

    /*
      =====================================================
      NORMAL ORDER
      =====================================================

      COD zone:
        COD
        bKash
        Nagad

      Outside COD zone:
        bKash
        Nagad
    */

    box.innerHTML = `

      <b>
        Payment method
      </b>

      <select
        id="paymentMethod"
        style="
          width:100%;
          margin-top:8px;
        "
      >

        <option value="">
          Select payment method
        </option>

        ${
          loc.cod
            ? `
              <option value="COD">
                Cash on Delivery
              </option>
            `
            : ''
        }

        <option value="bKash">
          bKash — Send Money Only
        </option>

        <option value="Nagad">
          Nagad — Send Money Only
        </option>

      </select>

      <div
        id="paymentInfo"
        style="margin-top:10px;"
      ></div>

      <div
        id="txWrap"
        style="
          display:none;
          margin-top:10px;
        "
      >

        <input
          id="tx"
          placeholder="Transaction ID / last 5 digits *"
        >

      </div>

      ${
        loc.cod

          ? `
            <small
              style="
                display:block;
                margin-top:8px;
              "
            >
              Cash on Delivery is available at this location.
            </small>
          `

          : `
            <small
              style="
                display:block;
                margin-top:8px;
              "
            >
              COD is unavailable at this location.
              Please pay online.
            </small>
          `
      }

    `;

  }

  setupPaymentEvents();

  if (hasPrebook) {

    setupPrebookEvents();

  }

  updatePaymentUI();

}

/* =========================================================
   PAYMENT EVENTS
========================================================= */

function setupPaymentEvents() {

  const select =
    $('#paymentMethod');

  if (!select) {
    return;
  }

  select.addEventListener(
    'change',
    updatePaymentUI
  );

}

function updatePaymentUI() {

  const select =
    $('#paymentMethod');

  const txWrap =
    $('#txWrap');

  const tx =
    $('#tx');

  const info =
    $('#paymentInfo');

  if (!select) {
    return;
  }

  const method =
    select.value;

  const payment =
    getPaymentNumbers();

  const online =
    method === 'bKash' ||
    method === 'Nagad';

  if (txWrap) {

    txWrap.style.display =
      online
        ? 'block'
        : 'none';

  }

  if (tx) {

    tx.required =
      online;

    if (!online) {

      tx.value =
        '';

    }

  }

  if (!info) {
    return;
  }

  if (method === 'bKash') {

    info.innerHTML = `

      <div class="payment">

        <b>
          bKash Personal — Send Money Only
        </b>

        <br>

        ${esc(payment.bkash)}

        <br>

        <small>
          Send Money to this number and enter your transaction ID or last 5 digits below.
        </small>

      </div>

    `;

  } else if (
    method === 'Nagad'
  ) {

    info.innerHTML = `

      <div class="payment">

        <b>
          Nagad Personal — Send Money Only
        </b>

        <br>

        ${esc(payment.nagad)}

        <br>

        <small>
          Send Money to this number and enter your transaction ID or last 5 digits below.
        </small>

      </div>

    `;

  } else if (
    method === 'COD'
  ) {

    info.innerHTML = `

      <div class="payment">

        <b>
          Cash on Delivery
        </b>

        <br>

        Transaction ID is not required.

      </div>

    `;

  } else {

    info.innerHTML =
      '';

  }

}

/* =========================================================
   ORDER SUMMARY
========================================================= */

function getSubtotal() {

  let subtotal =
    0;

  if (!C) {
    return 0;
  }

  cart.forEach(x => {

    const p =
      C.menu.find(p =>
        String(p.id) === String(x.id)
      );

    if (!p) {
      return;
    }

    const sizes =
      Array.isArray(p.sizes)
        ? p.sizes
        : [];

    const z =
      sizes[x.sizeIndex] ||
      sizes[0];

    if (!z) {
      return;
    }

    subtotal +=
      Number(z[1]) *
      Number(x.qty);

  });

  return subtotal;

}

function sum() {

  const subtotal =
    getSubtotal();

  const delivery =
    loc?.allowed
      ? Number(
          loc.charge || 0
        )
      : 0;

  if (!$('#sum')) {
    return;
  }

  $('#sum').innerHTML = `

    <p>
      Subtotal:
      <b>
        ${money(subtotal)}
      </b>
    </p>

    <p>
      Delivery:
      <b>
        ${
          loc?.allowed
            ? money(delivery)
            : '—'
        }
      </b>
    </p>

    <p>
      Total:
      <b>
        ${
          loc?.allowed
            ? money(
                subtotal +
                delivery
              )
            : '—'
        }
      </b>
    </p>

  `;

}

/* =========================================================
   NORMAL DELIVERY TIME VALIDATION
========================================================= */

function validateDeliveryTime() {

  const input =
    $('#time')?.value.trim();

  if (!input) {

    return {

      ok:
        false,

      message:
        'Please select a delivery time.'

    };

  }

  const today =
    new Date();

  const window =
    getOrderWindow(
      today
    );

  const match =
    input.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

  if (!match) {

    return {

      ok:
        false,

      message:
        'Please select a valid delivery time.'

    };

  }

  let hour =
    Number(match[1]);

  const minute =
    Number(match[2]);

  const ap =
    String(
      match[3]
    ).toUpperCase();

  if (
    ap === 'PM' &&
    hour < 12
  ) {

    hour += 12;

  }

  if (
    ap === 'AM' &&
    hour === 12
  ) {

    hour = 0;

  }

  if (
    minute !== 0 &&
    minute !== 30
  ) {

    return {

      ok:
        false,

      message:
        'Delivery time must be a 30-minute slot.'

    };

  }

  const requested =
    hour * 60 +
    minute;

  if (
    requested <
      window.start ||
    requested >
      window.end
  ) {

    return {

      ok:
        false,

      message:
        'Selected delivery time is outside the available order window. Available today: ' +
        formatTime(window.start) +
        ' – ' +
        formatTime(window.end) +
        '.'

    };

  }

  return {

    ok:
      true,

    value:
      input

  };

}

/* =========================================================
   PLACE ORDER
========================================================= */

async function place() {

  if (!C) {

    alert(
      'Website is still loading. Please try again.'
    );

    return;

  }

  if (!cart.length) {

    alert(
      'Your cart is empty.'
    );

    return;

  }

  /*
    =======================================================
    CUSTOMER LOGIN
    =======================================================
  */

  if (!requireCustomerLogin()) {
    return;
  }

  const token =
    customerToken();

  if (!token) {

    alert(
      'Your customer login session has expired. Please login again.'
    );

    if (
      typeof openCustomerAuth ===
      'function'
    ) {

      openCustomerAuth(
        'login'
      );

    }

    return;

  }

  /*
    =======================================================
    LOCATION
    =======================================================
  */

  if (!loc?.allowed) {

    alert(
      'Please select a delivery location inside the service area.'
    );

    return;

  }

  const position =
    marker?.getLatLng();

  if (!position) {

    alert(
      'Please select your delivery location.'
    );

    return;

  }

  const lat =
    Number(position.lat);

  const lng =
    Number(position.lng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {

    alert(
      'Invalid delivery location.'
    );

    return;

  }

  /*
    =======================================================
    CUSTOMER
    =======================================================
  */

  const name =
    $('#name')?.value.trim() || '';

  const phone =
    $('#phone')?.value.trim() || '';

  if (!name) {

    alert(
      'Customer name is required.'
    );

    $('#name')?.focus();

    return;

  }

  if (!phone) {

    alert(
      'Phone number is required.'
    );

    $('#phone')?.focus();

    return;

  }

  /*
    Make sure phone matches logged-in account.
  */

  const data =
    customerData();

  if (
    data?.phone &&
    String(data.phone).trim() !==
      String(phone).trim()
  ) {

    alert(
      'The phone number must match your logged-in customer account.'
    );

    $('#phone')?.focus();

    return;

  }

  /*
    =======================================================
    PRE-ORDER
    =======================================================
  */

  const hasPrebook =
    pre();

  const prebookValidation =
    validatePrebookTime();

  if (!prebookValidation.ok) {

    alert(
      prebookValidation.message
    );

    return;

  }

  /*
    =======================================================
    PAYMENT
    =======================================================
  */

  const paymentSelect =
    $('#paymentMethod');

  const paymentMethod =
    paymentSelect?.value || '';

  if (!paymentMethod) {

    alert(
      'Please select a payment method.'
    );

    paymentSelect?.focus();

    return;

  }

  /*
    Pre-order = online payment only.
  */

  if (hasPrebook) {

    if (
      paymentMethod !== 'bKash' &&
      paymentMethod !== 'Nagad'
    ) {

      alert(
        'Pre-order items require bKash or Nagad online payment.'
      );

      paymentSelect?.focus();

      return;

    }

  }

  /*
    COD only inside COD zone.
  */

  if (
    !hasPrebook &&
    paymentMethod === 'COD' &&
    !loc.cod
  ) {

    alert(
      'Cash on Delivery is not available at this location.'
    );

    return;

  }

  /*
    =======================================================
    TRANSACTION
    =======================================================
  */

  const online =
    paymentMethod === 'bKash' ||
    paymentMethod === 'Nagad';

  const tx =
    $('#tx')?.value.trim() || '';

  if (
    online &&
    !tx
  ) {

    alert(
      'Please enter your bKash/Nagad transaction ID or last 5 digits.'
    );

    $('#tx')?.focus();

    return;

  }

  const transactionId =
    online
      ? tx
      : '';

  /*
    =======================================================
    DELIVERY TIME
    =======================================================
  */

  let deliveryTime =
    'ASAP';

  let prebookDateTime =
    null;

  if (hasPrebook) {

    deliveryTime =
      prebookValidation.value;

    prebookDateTime =
      prebookValidation.value;

  } else {

    const deliveryValidation =
      validateDeliveryTime();

    if (!deliveryValidation.ok) {

      alert(
        deliveryValidation.message
      );

      return;

    }

    deliveryTime =
      deliveryValidation.value;

  }

  /*
    =======================================================
    ADDRESS
    =======================================================
  */

  const house =
    $('#house')?.value.trim() || '';

  const road =
    $('#road')?.value.trim() || '';

  const address =
    [
      house,
      road
    ]
      .filter(Boolean)
      .join(', ');

  const note =
    $('#note')?.value.trim() || '';

  /*
    =======================================================
    MAP ADDRESS
    =======================================================
  */

  const mapAddress =
    $('#mapAddress')?.value.trim() ||
    $('#address')?.value.trim() ||
    '';

  const finalAddress =
    [
      address,
      mapAddress
    ]
      .filter(Boolean)
      .join(
        address && mapAddress
          ? ', '
          : ''
      );

  /*
    =======================================================
    FINAL ORDER
    =======================================================
  */

  const order = {

    name:
      name,

    phone:
      phone,

    address:
      finalAddress,

    lat:
      lat,

    lng:
      lng,

    deliveryTime:
      deliveryTime,

    prebook:
      hasPrebook,

    prebookDateTime:
      prebookDateTime,

    note:
      note,

    transactionId:
      transactionId,

    paymentMethod:
      paymentMethod,

    items:
      cart.map(x => ({

        id:
          x.id,

        sizeIndex:
          Number(
            x.sizeIndex || 0
          ),

        qty:
          Number(
            x.qty || 1
          )

      }))

  };

  /*
    =======================================================
    PLACE ORDER BUTTON
    =======================================================
  */

  const button =
    $('#place');

  if (!button) {

    alert(
      'Place Order button was not found.'
    );

    return;

  }

  const oldText =
    button.textContent;

  button.disabled =
    true;

  button.textContent =
    'Placing order…';

  /*
    =======================================================
    SEND TO BACKEND
    =======================================================
  */

  try {

    const response =
      await fetch(
        '/api/orders',
        {

          method:
            'POST',

          headers: {

            'Content-Type':
              'application/json',

            'Authorization':
              'Bearer ' +
              token

          },

          body:
            JSON.stringify(order)

        }
      );

    let result = {};

    try {

      result =
        await response.json();

    } catch (_) {

      result = {};

    }

    /*
      Login expired.
    */

    if (
      response.status === 401 ||
      response.status === 403
    ) {

      try {

        if (
          typeof clearCustomerSession ===
          'function'
        ) {

          clearCustomerSession();

        } else {

          localStorage.removeItem(
            'csk_customer_token'
          );

          localStorage.removeItem(
            'csk_customer_data'
          );

        }

      } catch (_) {}

      alert(
        'Your login session has expired. Please login again.'
      );

      button.disabled =
        false;

      button.textContent =
        oldText;

      if (
        typeof openCustomerAuth ===
        'function'
      ) {

        openCustomerAuth(
          'login'
        );

      }

      return;

    }

    if (
      !response.ok ||
      result.error
    ) {

      throw new Error(
        result.error ||
        'Unable to place order.'
      );

    }

    const o =
      result.order || {};

    /*
      SUCCESS MESSAGE
    */

    const resultBox =
      $('#result');

    if (resultBox) {

      resultBox.innerHTML = `

        <p
          style="
            border:1px solid #475;
            padding:12px;
            border-radius:10px;
          "
        >

          Order placed successfully!<br>

          Order ID:
          <b>
            ${esc(o.id || 'Confirmed')}
          </b>

          <br>

          Total:
          <b>
            ${money(o.total)}
          </b>

          <br>

          Payment:
          <b>
            ${esc(
              o.paymentMethod ||
              paymentMethod
            )}
          </b>

          ${
            hasPrebook

              ? `
                <br>

                Pre-order:
                <b>
                  ${esc(
                    new Date(
                      prebookValidation.value
                    ).toLocaleString(
                      'en-BD',
                      {
                        dateStyle:
                          'medium',
                        timeStyle:
                          'short'
                      }
                    )
                  )}
                </b>
              `

              : ''
          }

        </p>

      `;

    }

    /*
      Clear cart.
    */

    cart = [];

    save();

    button.disabled =
      true;

    button.textContent =
      'Order Placed';

  } catch (e) {

    console.error(e);

    alert(
      e.message ||
      'Unable to place order. Please try again.'
    );

    button.disabled =
      false;

    button.textContent =
      oldText;

  }

}

/* =========================================================
   BACKWARD COMPATIBILITY
========================================================= */

/*
  Some old HTML versions may call placeOrder()
  instead of place().
*/

async function placeOrder(e) {

  if (e) {
    e.preventDefault();
  }

  return place();

}

/*
  Some old HTML versions may call gpsLocation().
*/

function gpsLocation() {
  return gps();
}

/* =========================================================
   SEARCH
========================================================= */

document.addEventListener(
  'input',
  e => {

    if (
      e.target &&
      e.target.id === 'search'
    ) {

      render();

    }

  }
);

/* =========================================================
   KEYBOARD SUPPORT
========================================================= */

document.addEventListener(
  'keydown',
  e => {

    if (
      e.key === 'Escape' &&
      $('#modal')?.classList.contains(
        'open'
      )
    ) {

      closeCheckout();

    }

    if (
      e.key === 'Escape' &&
      $('#cart')?.classList.contains(
        'open'
      )
    ) {

      closeCart();

    }

  }
);

/* =========================================================
   CHECKOUT FORM SAFETY
========================================================= */

document.addEventListener(
  'submit',
  e => {

    const form =
      e.target;

    if (
      form &&
      (
        form.id === 'checkoutForm' ||
        form.id === 'checkout'
      )
    ) {

      e.preventDefault();

      place(e);

    }

  }
);

/* =========================================================
   AUTO UPDATE DELIVERY SLOTS
========================================================= */

setInterval(
  () => {

    if (
      $('#modal')?.classList.contains(
        'open'
      )
    ) {

      /*
        Rebuild normal delivery slots
        from current admin-configured hours.
      */

      if (
        $('#time') &&
        $('#time').tagName === 'SELECT'
      ) {

        const current =
          $('#time').value;

        buildDeliveryTimeSlots();

        /*
          Keep current selection if
          it is still available.
        */

        if (
          current &&
          [...$('#time').options]
            .some(
              o => o.value === current
            )
        ) {

          $('#time').value =
            current;

        }

      }

    }

  },
  60000
);

/* =========================================================
   END OF APP.JS
========================================================= */
