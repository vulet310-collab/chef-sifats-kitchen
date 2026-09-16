let C = null;
let cart = JSON.parse(localStorage.cskCart || '[]');
let cat = 'All';
let map = null;
let marker = null;
let loc = null;

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

/* =========================
   LOAD CONFIG
========================= */

(async function init() {
  try {
    const r = await fetch('/api/config');

    if (!r.ok) {
      throw new Error('Could not load website configuration.');
    }

    C = await r.json();

    if (!C.menu) C.menu = [];
    if (!C.settings) C.settings = {};

    normalizeCart();

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

/* =========================
   MENU
========================= */

function render() {
  if (!C) return;

  const q =
    ($('#search')?.value || '').trim().toLowerCase();

  const items = C.menu.filter(p => {
    const categoryOK =
      cat === 'All' || p.cat === cat;

    const nameOK =
      String(p.name || '')
        .toLowerCase()
        .includes(q);

    return categoryOK && nameOK;
  });

  $('#grid').innerHTML = items.length
    ? items.map(p => {
        const sizes = Array.isArray(p.sizes)
          ? p.sizes
          : [];

        const minQty = Number(p.minQty) || 1;
        const maxQty = Number(p.maxQty) || 20;

        const prebookEnabled =
          itemIsPrebook(p);

        return `
          <article class="food">

            <div class="pic">
              ${
                p.image
                  ? `<img
                      src="${esc(p.image)}"
                      alt="${esc(p.name)}"
                      onerror="this.remove();this.parentElement.textContent='Food image'"
                    >`
                  : 'Food image'
              }
            </div>

            <div class="foodbody">

              <small>
                ${esc(p.cat || '')}
                ${prebookEnabled ? ' • PRE-BOOK' : ''}
              </small>

              <h3>${esc(p.name)}</h3>

              ${
                sizes.length
                  ? `
                    <select id="s-${esc(p.id)}">
                      ${sizes.map((s, i) => `
                        <option value="${i}">
                          ${esc(s[0])} — ${money(s[1])}
                        </option>
                      `).join('')}
                    </select>
                  `
                  : '<p>No price available</p>'
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

/* =========================
   PRE-BOOK ITEM RULE
========================= */

/*
  Item-level pre-book rule.

  Pizza  -> ALWAYS OFF
  Momo   -> normally OFF
  Continental/Kacchi:
    - use admin p.prebook if explicitly boolean
    - otherwise fallback ON for backward compatibility
*/

function itemIsPrebook(p) {
  if (!p) return false;

  const category =
    String(p.cat || '').trim().toLowerCase();

  if (category === 'pizza') {
    return false;
  }

  if (category === 'momo') {
    return false;
  }

  if (typeof p.prebook === 'boolean') {
    return p.prebook;
  }

  return (
    category === 'continental' ||
    category === 'kacchi'
  );
}

/* =========================
   CART
========================= */

function add(id) {
  if (!C) return;

  const p = C.menu.find(x => x.id === id);

  if (!p) {
    alert('Food item not found.');
    return;
  }

  const sizeIndex =
    Number($('#s-' + id)?.value || 0);

  const inputQty =
    Number($('#q-' + id)?.value || 1);

  const minQty =
    Number(p.minQty) || 1;

  const maxQty =
    Number(p.maxQty) || 20;

  const qty = Math.max(
    minQty,
    Math.min(maxQty, inputQty)
  );

  cart.push({
    id: p.id,
    sizeIndex,
    qty
  });

  save();
  openCart();
}

function normalizeCart() {
  if (!Array.isArray(cart)) {
    cart = [];
  }

  cart = cart.filter(x =>
    C?.menu?.some(p => p.id === x.id)
  );
}

function save() {
  localStorage.cskCart =
    JSON.stringify(cart);

  cartUI();
}

function cartUI() {
  if (!C) return;

  let subtotal = 0;
  let count = 0;

  normalizeCart();

  cart.forEach(x => {
    count += Number(x.qty) || 0;
  });

  if ($('#count')) {
    $('#count').textContent = count;
  }

  if ($('#cartItems')) {
    $('#cartItems').innerHTML =
      cart.map((x, i) => {

        const p =
          C.menu.find(p => p.id === x.id);

        if (!p) return '';

        const z =
          p.sizes[x.sizeIndex] ||
          p.sizes[0];

        if (!z) return '';

        const lineTotal =
          Number(z[1]) * Number(x.qty);

        subtotal += lineTotal;

        return `
          <div class="cartline">

            <b>${esc(p.name)}</b>

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
  $('#cart').classList.add('open');
  $('#shade').classList.add('open');
}

function closeCart() {
  $('#cart').classList.remove('open');
  $('#shade').classList.remove('open');
}

/* =========================
   CHECKOUT
========================= */

function checkout() {
  if (!cart.length) {
    alert('Your cart is empty.');
    return;
  }

  closeCart();

  $('#modal').classList.add('open');

  if (!map) {

    const b =
      C.settings.base || {
        lat: 23.3022494,
        lng: 90.9187528
      };

    map = L.map('map')
      .setView([b.lat, b.lng], 14);

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '© OpenStreetMap contributors'
      }
    ).addTo(map);

    marker = L.marker(
      [b.lat, b.lng],
      { draggable: true }
    ).addTo(map);

    marker.on(
      'dragend',
      () => {
        const p = marker.getLatLng();
        point(p.lat, p.lng);
      }
    );
  }

  setTimeout(() => {
    map.invalidateSize();
  }, 200);

  base();

  /*
    Rebuild payment/pre-book UI every time
    checkout opens.
  */
  pay();
}

function closeCheckout() {
  $('#modal').classList.remove('open');
}

/* =========================
   SHOP BASE
========================= */

function base() {
  if (!C || !map || !marker) return;

  const b =
    C.settings.base || {
      lat: 23.3022494,
      lng: 90.9187528
    };

  map.setView(
    [Number(b.lat), Number(b.lng)],
    15
  );

  marker.setLatLng([
    Number(b.lat),
    Number(b.lng)
  ]);

  point(
    Number(b.lat),
    Number(b.lng)
  );
}

/* =========================
   GPS
========================= */

function gps() {

  if (!navigator.geolocation) {
    alert(
      'GPS is unavailable. Please drag the map pin instead.'
    );
    return;
  }

  $('#status').textContent =
    'Detecting your current location…';

  navigator.geolocation.getCurrentPosition(
    p => {

      const lat =
        Number(p.coords.latitude);

      const lng =
        Number(p.coords.longitude);

      map.setView(
        [lat, lng],
        16
      );

      marker.setLatLng([
        lat,
        lng
      ]);

      point(lat, lng);
    },

    () => {

      $('#status').textContent =
        'GPS failed. Please allow location access or drag the pin manually.';
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

/* =========================
   LOCATION CHECK
========================= */

async function point(lat, lng) {

  try {

    $('#status').textContent =
      'Checking delivery availability…';

    const response =
      await fetch(
        '/api/location/check',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify({
            lat,
            lng
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

      $('#status').textContent =
        r.message +
        ' Distance: ' +
        r.distanceKm +
        ' km • Delivery: ' +
        money(r.charge);

      $('#status').style.borderColor =
        '#475';

    } else {

      $('#status').textContent =
        r.message ||
        'Delivery is unavailable at this location.';

      $('#status').style.borderColor =
        '#a44';
    }

    pay();
    sum();

  } catch (e) {

    console.error(e);

    loc = null;

    $('#status').textContent =
      'Unable to check this location. Please try again.';

    if ($('#pay')) {
      $('#pay').innerHTML = '';
    }

    if ($('#sum')) {
      $('#sum').innerHTML = '';
    }
  }
}

/* =========================
   PRE-BOOK CART CHECK
========================= */

function pre() {
  if (!C) return false;

  return cart.some(x => {

    const p =
      C.menu.find(p => p.id === x.id);

    return itemIsPrebook(p);
  });
}

/* =========================
   PRE-BOOK SETTINGS
========================= */

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
  return getPrebookSettings().enabled;
}

/* =========================
   SHOP HOURS
========================= */

function getShopHours(date = new Date()) {

  const settings =
    C?.settings || {};

  const hours =
    settings.hours ||
    settings.shopHours ||
    {};

  const day =
    date.getDay();

  /*
    JavaScript:
    0 = Sunday
    1 = Monday
    ...
    5 = Friday
    6 = Saturday
  */

  if (day === 5) {

    return hours.friday || {
      open: 15,
      close: 21
    };
  }

  return hours.normal || {
    open: 11,
    close: 19
  };
}

/* =========================
   PRE-BOOK WINDOW
========================= */

/*
  FINAL RULE:

  Opening + 1 hour
  through
  Closing - 1 hour

  Example:
  11 AM - 7 PM
  => 12 PM - 6 PM

  Friday:
  3 PM - 9 PM
  => 4 PM - 8 PM
*/

function getPrebookWindow(date) {

  const h =
    getShopHours(date);

  const open =
    Number(h.open);

  const close =
    Number(h.close);

  return {
    startMinutes:
      Math.round((open + 1) * 60),

    endMinutes:
      Math.round((close - 1) * 60)
  };
}

/* =========================
   DATE HELPERS
========================= */

function dateKey(date) {

  const y =
    date.getFullYear();

  const m =
    String(date.getMonth() + 1)
      .padStart(2, '0');

  const d =
    String(date.getDate())
      .padStart(2, '0');

  return `${y}-${m}-${d}`;
}

function dateFromKey(key) {

  const parts =
    String(key || '').split('-');

  if (parts.length !== 3) {
    return null;
  }

  const y =
    Number(parts[0]);

  const m =
    Number(parts[1]) - 1;

  const d =
    Number(parts[2]);

  const date =
    new Date(y, m, d);

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

  today.setHours(0, 0, 0, 0);

  const tomorrow =
    new Date(today);

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  const target =
    new Date(date);

  target.setHours(0, 0, 0, 0);

  if (
    target.getTime() ===
    tomorrow.getTime()
  ) {

    return (
      'Tomorrow, ' +
      target.toLocaleDateString(
        'en-GB',
        {
          day: '2-digit',
          month: 'short'
        }
      )
    );
  }

  return target.toLocaleDateString(
    'en-GB',
    {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    }
  );
}

function formatTime(minutes) {

  const h24 =
    Math.floor(minutes / 60);

  const min =
    minutes % 60;

  const suffix =
    h24 >= 12
      ? 'PM'
      : 'AM';

  let h12 =
    h24 % 12;

  if (h12 === 0) {
    h12 = 12;
  }

  return (
    h12 +
    ':' +
    String(min).padStart(2, '0') +
    ' ' +
    suffix
  );
}

/* =========================
   PRE-BOOK SLOT VALIDATION
========================= */

function isValidPrebookDateTime(date) {

  if (!(date instanceof Date) ||
      Number.isNaN(date.getTime())) {
    return false;
  }

  /*
    Pre-book must be in the future.
  */
  if (date.getTime() <= Date.now()) {
    return false;
  }

  const window =
    getPrebookWindow(date);

  const minutes =
    date.getHours() * 60 +
    date.getMinutes();

  /*
    Only exact 30-minute slots.
  */
  if (date.getMinutes() !== 0 &&
      date.getMinutes() !== 30) {
    return false;
  }

  return (
    minutes >= window.startMinutes &&
    minutes <= window.endMinutes
  );
}

/* =========================
   BUILD PRE-BOOK SECTION
========================= */

function buildPrebookSection() {

  const hasPrebook =
    pre();

  /*
    IMPORTANT:
    Normal item = NO pre-order section.
  */
  if (!hasPrebook) {
    return '';
  }

  if (!isPrebookAllowed()) {

    return `
      <div
        class="payment"
        style="
          margin-top:12px;
          padding:12px;
          border:1px solid #a44;
          border-radius:10px;
        "
      >
        <b>Pre-order is currently unavailable.</b>
        <small>
          Please remove the pre-order item or try again later.
        </small>
      </div>
    `;
  }

  /*
    Generate next 14 days.
    Customer cannot type a date manually.
  */

  const options = [];

  const now =
    new Date();

  for (let i = 1; i <= 14; i++) {

    const d =
      new Date(now);

    d.setHours(
      0,
      0,
      0,
      0
    );

    d.setDate(
      d.getDate() + i
    );

    const key =
      dateKey(d);

    options.push(`
      <option value="${key}">
        ${esc(formatDateLabel(d))}
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

      <b>Pre-order</b>

      <small style="display:block;margin:6px 0 12px;">
        Select your preferred date and time.
        Available time is automatically based on shop hours.
      </small>

      <label
        for="prebookDate"
        style="display:block;margin-bottom:5px;"
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
        Time slots: opening + 1 hour to closing − 1 hour.
      </small>

    </div>
  `;
}

/* =========================
   BUILD PRE-BOOK TIMES
========================= */

function buildPrebookTimes() {

  const dateSelect =
    $('#prebookDate');

  const timeSelect =
    $('#prebookTime');

  const hidden =
    $('#prebookSlot');

  const hint =
    $('#prebookHint');

  if (!dateSelect ||
      !timeSelect) {
    return;
  }

  const key =
    dateSelect.value;

  if (!key) {

    timeSelect.innerHTML =
      '<option value="">Select date first</option>';

    timeSelect.disabled = true;

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

    timeSelect.disabled = true;

    return;
  }

  const window =
    getPrebookWindow(date);

  const slots = [];

  for (
    let minutes = window.startMinutes;
    minutes <= window.endMinutes;
    minutes += 30
  ) {

    slots.push(`
      <option value="${minutes}">
        ${formatTime(minutes)}
      </option>
    `);
  }

  if (!slots.length) {

    timeSelect.innerHTML =
      '<option value="">No available time</option>';

    timeSelect.disabled = true;

    if (hidden) {
      hidden.value = '';
    }

    if (hint) {
      hint.textContent =
        'No pre-order slots are available on this date.';
    }

    return;
  }

  timeSelect.innerHTML = `
    <option value="">
      Select time
    </option>
    ${slots.join('')}
  `;

  timeSelect.disabled = false;

  if (hint) {
    hint.textContent =
      'Available: ' +
      formatTime(window.startMinutes) +
      ' – ' +
      formatTime(window.endMinutes) +
      ' • 30-minute slots';
  }

  if (hidden) {
    hidden.value = '';
  }
}

/* =========================
   PRE-BOOK EVENTS
========================= */

function setupPrebookEvents() {

  const dateSelect =
    $('#prebookDate');

  const timeSelect =
    $('#prebookTime');

  const hidden =
    $('#prebookSlot');

  if (!dateSelect ||
      !timeSelect) {
    return;
  }

  dateSelect.addEventListener(
    'change',
    () => {

      buildPrebookTimes();

      if (hidden) {
        hidden.value = '';
      }
    }
  );

  timeSelect.addEventListener(
    'change',
    () => {

      const key =
        dateSelect.value;

      const minutes =
        Number(timeSelect.value);

      if (!key ||
          !Number.isFinite(minutes)) {

        if (hidden) {
          hidden.value = '';
        }

        return;
      }

      const date =
        dateFromKey(key);

      if (!date) {

        if (hidden) {
          hidden.value = '';
        }

        return;
      }

      date.setHours(
        Math.floor(minutes / 60),
        minutes % 60,
        0,
        0
      );

      if (!isValidPrebookDateTime(date)) {

        alert(
          'Please select a valid pre-order time.'
        );

        timeSelect.value = '';

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

/* =========================
   PAYMENT
========================= */

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

function paymentOptionsHTML() {

  const payment =
    getPaymentNumbers();

  return `
    <option value="">
      Select payment method
    </option>

    <option value="bKash">
      bKash — Send Money
    </option>

    <option value="Nagad">
      Nagad — Send Money
    </option>
  `;
}

function pay() {

  const box = $('#pay');

  if (!box) return;

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
      <b>Pre-booking is currently unavailable.</b>

      <p>
        Please remove the pre-book item or try again later.
      </p>
    `;

    return;
  }

  const payment =
    getPaymentNumbers();

  const onlineRequired =
    hasPrebook || !loc.cod;

  /*
    =========================
    PRE-BOOK
    =========================

    Pre-book = Online only.
    COD is never shown.
  */

  if (hasPrebook) {

    box.innerHTML = `

      <div>

        <b>Payment method</b>

        <select
          id="paymentMethod"
          style="width:100%;margin-top:8px;"
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

      </div>

      <div
        id="paymentInfo"
        style="margin-top:10px;"
      ></div>

      <div
        id="txWrap"
        style="margin-top:10px;"
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
      =========================
      NORMAL ITEM
      =========================

      COD available:
        COD / bKash / Nagad

      COD unavailable:
        bKash / Nagad only
    */

    box.innerHTML = `

      <div>

        <b>Payment method</b>

        <select
          id="paymentMethod"
          style="width:100%;margin-top:8px;"
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

      </div>

      <div
        id="paymentInfo"
        style="margin-top:10px;"
      ></div>

      <div
        id="txWrap"
        style="margin-top:10px;"
      >
        <input
          id="tx"
          placeholder="Transaction ID / last 5 digits *"
        >
      </div>

      ${
        loc.cod
          ? `
            <small style="display:block;margin-top:8px;">
              Cash on Delivery is available at this location.
            </small>
          `
          : `
            <small style="display:block;margin-top:8px;">
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

/* =========================
   PAYMENT UI
========================= */

function setupPaymentEvents() {

  const select =
    $('#paymentMethod');

  if (!select) return;

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

  if (!select) return;

  const method =
    select.value;

  const hasPrebook =
    pre();

  const payment =
    getPaymentNumbers();

  /*
    Transaction ID:
    ONLY online payment.
  */

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
      tx.value = '';
    }
  }

  if (info) {

    if (method === 'bKash') {

      info.innerHTML = `
        <div class="payment">
          <b>bKash Personal — Send Money Only</b>
          <br>
          ${esc(payment.bkash)}
        </div>
      `;

    } else if (method === 'Nagad') {

      info.innerHTML = `
        <div class="payment">
          <b>Nagad Personal — Send Money Only</b>
          <br>
          ${esc(payment.nagad)}
        </div>
      `;

    } else if (method === 'COD') {

      info.innerHTML = `
        <div class="payment">
          <b>Cash on Delivery</b>
          <br>
          Transaction ID is not required.
        </div>
      `;

    } else {

      info.innerHTML = '';
    }

    if (hasPrebook && method === 'COD') {
      select.value = '';
      info.innerHTML = `
        <b>Pre-order items require online payment.</b>
      `;
    }
  }
}

/* =========================
   ORDER SUMMARY
========================= */

function getSubtotal() {

  let subtotal = 0;

  cart.forEach(x => {

    const p =
      C.menu.find(p => p.id === x.id);

    if (!p) return;

    const z =
      p.sizes[x.sizeIndex] ||
      p.sizes[0];

    if (!z) return;

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
      ? Number(loc.charge || 0)
      : 0;

  if (!$('#sum')) return;

  $('#sum').innerHTML = `
    <p>
      Subtotal:
      <b>${money(subtotal)}</b>
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
            ? money(subtotal + delivery)
            : '—'
        }
      </b>
    </p>
  `;
}

/* =========================
   CURRENT SHOP TIME
========================= */

function getCurrentHour() {

  const now =
    new Date();

  return (
    now.getHours() +
    now.getMinutes() / 60
  );
}

function shopIsOpen() {

  const h =
    getShopHours();

  const open =
    Number(h.open);

  const close =
    Number(h.close);

  const current =
    getCurrentHour();

  return current >= open &&
    current <= close;
}

function formatHour(hour) {

  const h =
    Number(hour);

  const hours =
    Math.floor(h);

  const minutes =
    Math.round(
      (h - hours) * 60
    );

  const suffix =
    hours >= 12
      ? 'PM'
      : 'AM';

  let display =
    hours % 12;

  if (display === 0)
    display = 12;

  return (
    display +
    ':' +
    String(minutes).padStart(2, '0') +
    ' ' +
    suffix
  );
}

/* =========================
   NORMAL DELIVERY TIME
========================= */

function validateDeliveryTime() {

  const input =
    $('#time')?.value.trim();

  /*
    Empty / ASAP is allowed.
  */

  if (!input ||
      input.toUpperCase() === 'ASAP') {

    return {
      ok: true,
      value: 'ASAP'
    };
  }

  const value =
    input.toUpperCase();

  let h = null;
  let m = 0;

  const match =
    value.match(
      /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/
    );

  if (!match) {

    return {
      ok: false,
      message:
        'Please enter delivery time like 6:30 PM.'
    };
  }

  h = Number(match[1]);
  m = Number(match[2] || 0);

  const ap =
    match[3];

  if (ap === 'PM' && h < 12)
    h += 12;

  if (ap === 'AM' && h === 12)
    h = 0;

  if (
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {

    return {
      ok: false,
      message:
        'Invalid delivery time.'
    };
  }

  const hours =
    getShopHours();

  const requested =
    h + m / 60;

  if (
    requested < Number(hours.open) ||
    requested > Number(hours.close)
  ) {

    return {
      ok: false,
      message:
        'Selected delivery time is outside shop hours. ' +
        'Today: ' +
        formatHour(hours.open) +
        ' – ' +
        formatHour(hours.close)
    };
  }

  return {
    ok: true,
    value: input
  };
}

/* =========================
   PRE-BOOK TIME VALIDATION
========================= */

function validatePrebookTime() {

  /*
    Normal cart:
    No pre-book validation.
  */

  if (!pre()) {

    return {
      ok: true,
      value: null
    };
  }

  if (!isPrebookAllowed()) {

    return {
      ok: false,
      message:
        'Pre-booking is currently disabled.'
    };
  }

  const dateSelect =
    $('#prebookDate');

  const timeSelect =
    $('#prebookTime');

  if (!dateSelect ||
      !timeSelect) {

    return {
      ok: false,
      message:
        'Please select a pre-order date and time.'
    };
  }

  const dateKeyValue =
    dateSelect.value;

  const timeValue =
    timeSelect.value;

  if (!dateKeyValue) {

    return {
      ok: false,
      message:
        'Please select a pre-order date.'
    };
  }

  if (!timeValue) {

    return {
      ok: false,
      message:
        'Please select a pre-order time.'
    };
  }

  const date =
    dateFromKey(dateKeyValue);

  if (!date) {

    return {
      ok: false,
      message:
        'Invalid pre-order date.'
    };
  }

  const minutes =
    Number(timeValue);

  if (!Number.isFinite(minutes)) {

    return {
      ok: false,
      message:
        'Invalid pre-order time.'
    };
  }

  date.setHours(
    Math.floor(minutes / 60),
    minutes % 60,
    0,
    0
  );

  /*
    FINAL validation:
    - Future date/time
    - Shop hours
    - Opening +1 hour
    - Closing -1 hour
    - 30-minute slot
  */

  if (!isValidPrebookDateTime(date)) {

    const window =
      getPrebookWindow(date);

    return {
      ok: false,
      message:
        'Selected pre-order time is invalid. ' +
        'Available time: ' +
        formatTime(window.startMinutes) +
        ' – ' +
        formatTime(window.endMinutes) +
        '.'
    };
  }

  return {
    ok: true,
    value: date.toISOString(),
    date
  };
}

/* =========================
   PLACE ORDER
========================= */

async function place() {

  if (!C) {
    alert(
      'Website is still loading. Please try again.'
    );
    return;
  }

  if (!cart.length) {
    alert('Your cart is empty.');
    return;
  }

  if (!loc?.allowed) {
    alert(
      'Please select a delivery location inside the service area.'
    );
    return;
  }

  if (!$('#name').value.trim()) {
    alert('Customer name is required.');
    $('#name').focus();
    return;
  }

  if (!$('#phone').value.trim()) {
    alert('Phone number is required.');
    $('#phone').focus();
    return;
  }

  /*
    =========================
    PRE-BOOK VALIDATION
    =========================
  */

  const prebookValidation =
    validatePrebookTime();

  if (!prebookValidation.ok) {

    alert(
      prebookValidation.message
    );

    return;
  }

  /*
    =========================
    PAYMENT VALIDATION
    =========================
  */

  const hasPrebook =
    pre();

  const paymentSelect =
    $('#paymentMethod');

  const paymentMethod =
    paymentSelect?.value || '';

  /*
    Pre-book:
    Online payment ONLY.
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
    Normal item:
    If COD available, COD/bKash/Nagad.
    If COD unavailable, only bKash/Nagad.
  */

  if (!hasPrebook) {

    if (
      paymentMethod !== 'COD' &&
      paymentMethod !== 'bKash' &&
      paymentMethod !== 'Nagad'
    ) {

      alert(
        'Please select a payment method.'
      );

      paymentSelect?.focus();

      return;
    }

    if (
      paymentMethod === 'COD' &&
      !loc.cod
    ) {

      alert(
        'Cash on Delivery is not available at this location. Please select bKash or Nagad.'
      );

      paymentSelect?.focus();

      return;
    }
  }

  /*
    =========================
    TRANSACTION ID
    =========================

    Online:
      REQUIRED

    COD:
      HIDDEN + NOT REQUIRED
  */

  const online =
    paymentMethod === 'bKash' ||
    paymentMethod === 'Nagad';

  const tx =
    $('#tx')?.value.trim() || '';

  if (online && !tx) {

    alert(
      'Please enter your bKash/Nagad transaction ID or last 5 digits.'
    );

    $('#tx')?.focus();

    return;
  }

  /*
    COD must never carry transaction ID.
  */

  const transactionId =
    online
      ? tx
      : '';

  /*
    =========================
    NORMAL DELIVERY TIME
    =========================

    Only used for normal items.

    Pre-book uses the selected
    pre-book date/time instead.
  */

  let deliveryTime = 'ASAP';

  if (hasPrebook) {

    deliveryTime =
      prebookValidation.value;

  } else {

    const normalDeliveryTime =
      validateDeliveryTime();

    if (!normalDeliveryTime.ok) {

      alert(
        normalDeliveryTime.message
      );

      return;
    }

    deliveryTime =
      normalDeliveryTime.value;
  }

  /*
    =========================
    LOCATION
    =========================
  */

  const position =
    marker?.getLatLng();

  if (!position) {
    alert(
      'Please select your delivery location.'
    );
    return;
  }

  const address =
    [
      $('#house').value.trim(),
      $('#road').value.trim()
    ]
      .filter(Boolean)
      .join(', ');

  /*
    =========================
    FINAL PAYMENT METHOD
    =========================
  */

  const finalPaymentMethod =
    paymentMethod;

  /*
    =========================
    ORDER OBJECT
    =========================
  */

  const order = {

    name:
      $('#name').value.trim(),

    phone:
      $('#phone').value.trim(),

    address,

    lat:
      Number(position.lat),

    lng:
      Number(position.lng),

    deliveryTime,

    /*
      Keep explicit pre-order data too.
      This is useful for backend/admin.
    */
    prebook:
      hasPrebook,

    prebookDateTime:
      hasPrebook
        ? prebookValidation.value
        : null,

    note:
      $('#note').value.trim(),

    transactionId,

    paymentMethod:
      finalPaymentMethod,

    items:
      cart.map(x => ({
        id: x.id,
        sizeIndex:
          Number(x.sizeIndex || 0),
        qty:
          Number(x.qty || 1)
      }))
  };

  /*
    =========================
    PLACE ORDER
    =========================
  */

  const button =
    $('#place');

  const oldText =
    button.textContent;

  button.disabled = true;
  button.textContent =
    'Placing order…';

  try {

    const response =
      await fetch(
        '/api/orders',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body:
            JSON.stringify(order)
        }
      );

    const result =
      await response.json();

    if (!response.ok ||
        result.error) {

      throw new Error(
        result.error ||
        'Unable to place order.'
      );
    }

    const o =
      result.order;

    $('#result').innerHTML = `
      <p
        style="
          border:1px solid #475;
          padding:12px;
          border-radius:10px
        "
      >
        Order placed successfully.<br>

        Order ID:
        <b>${esc(o.id)}</b>
        <br>

        Total:
        <b>${money(o.total)}</b>
        <br>

        Payment:
        <b>${esc(o.paymentMethod)}</b>

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
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }
                  )
                )}
              </b>
            `
            : ''
        }
      </p>
    `;

    cart = [];

    save();

    button.disabled = true;

  } catch (e) {

    console.error(e);

    alert(
      e.message ||
      'Unable to place order. Please try again.'
    );

    button.disabled = false;
    button.textContent = oldText;
  }
}

/* =========================
   OPTIONAL KEYBOARD SUPPORT
========================= */

document.addEventListener(
  'keydown',
  e => {

    if (
      e.key === 'Escape' &&
      $('#modal')?.classList.contains('open')
    ) {
      closeCheckout();
    }

    if (
      e.key === 'Escape' &&
      $('#cart')?.classList.contains('open')
    ) {
      closeCart();
    }
  }
);
