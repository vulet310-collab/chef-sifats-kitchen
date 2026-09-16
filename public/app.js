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
                ${p.prebook ? ' • PRE-BOOK' : ''}
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

function save() {
  localStorage.cskCart =
    JSON.stringify(cart);

  cartUI();
}

function cartUI() {
  if (!C) return;

  let subtotal = 0;
  let count = 0;

  cart = cart.filter(x =>
    C.menu.some(p => p.id === x.id)
  );

  cart.forEach(x => {
    count += Number(x.qty) || 0;
  });

  $('#count').textContent = count;

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

  $('#subtotal').textContent =
    money(subtotal);
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

    $('#pay').innerHTML = '';
    $('#sum').innerHTML = '';
  }
}

/* =========================
   PRE-BOOK
========================= */

function pre() {
  if (!C) return false;

  return cart.some(x => {
    const p =
      C.menu.find(p => p.id === x.id);

    return !!p?.prebook;
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
      p.enabled !== false,

    minHours:
      Number(
        p.minHours ??
        p.min ??
        5
      ),

    maxHours:
      Number(
        p.maxHours ??
        p.max ??
        12
      )
  };
}

function isPrebookAllowed() {

  const p =
    getPrebookSettings();

  return p.enabled;
}

/* =========================
   PAYMENT
========================= */

function pay() {

  const box = $('#pay');

  if (!box) return;

  if (!loc?.allowed) {

    box.innerHTML =
      '<b>Select a delivery point inside the service area.</b>';

    return;
  }

  const hasPrebook = pre();

  if (
    hasPrebook &&
    !isPrebookAllowed()
  ) {

    box.innerHTML = `
      <b>Pre-booking is currently unavailable.</b>
      <p>Please remove the pre-book item or try again later.</p>
    `;

    return;
  }

  const onlineRequired =
    hasPrebook || !loc.cod;

  if (onlineRequired) {

    const payment =
      C.settings.payment || {};

    const bkash =
      payment.bkash ||
      'Not configured';

    const nagad =
      payment.nagad ||
      'Not configured';

    box.innerHTML = `
      <b>Online payment required</b>

      <div class="payment">
        bKash Personal — Send Money Only:
        <b>${esc(bkash)}</b>
      </div>

      <div class="payment">
        Nagad Personal — Send Money Only:
        <b>${esc(nagad)}</b>
      </div>

      <input
        id="tx"
        placeholder="Transaction ID / last 5 digits *"
      >

      ${
        hasPrebook
          ? `
            <small>
              Pre-book items require full online payment.
              Cash on Delivery is not available.
            </small>
          `
          : `
            <small>
              Cash on Delivery is unavailable at this location.
              Please pay online.
            </small>
          `
      }
    `;

  } else {

    box.innerHTML = `
      <b>Cash on Delivery available</b>
      <small>
        Your selected location is inside the COD zone.
      </small>
    `;
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
   SHOP HOURS
========================= */

function getShopHours(date = new Date()) {

  const settings =
    C?.settings || {};

  const hours =
    settings.hours || {};

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
   DELIVERY TIME
========================= */

function validateDeliveryTime() {

  const input =
    $('#time')?.value.trim();

  /*
    Empty / ASAP is allowed.
    Server will still validate order.
  */

  if (!input ||
      input.toUpperCase() === 'ASAP') {
    return {
      ok: true,
      value: 'ASAP'
    };
  }

  /*
    Basic time parsing:
    6:30 PM
    18:30
    6 PM
  */

  const value =
    input.toUpperCase();

  let h = null;
  let m = 0;

  let match =
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

  if (!pre()) {
    return {
      ok: true
    };
  }

  const settings =
    getPrebookSettings();

  if (!settings.enabled) {

    return {
      ok: false,
      message:
        'Pre-booking is currently disabled.'
    };
  }

  /*
    Pre-book timing is primarily
    enforced by server settings.
    This frontend also shows the
    configured requirement.
  */

  return {
    ok: true,
    minHours:
      settings.minHours,
    maxHours:
      settings.maxHours
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

  const deliveryTime =
    validateDeliveryTime();

  if (!deliveryTime.ok) {
    alert(deliveryTime.message);
    return;
  }

  const prebookTime =
    validatePrebookTime();

  if (!prebookTime.ok) {
    alert(prebookTime.message);
    return;
  }

  const hasPrebook =
    pre();

  const onlineRequired =
    hasPrebook || !loc.cod;

  const tx =
    $('#tx')?.value.trim() || '';

  if (
    onlineRequired &&
    !tx
  ) {

    alert(
      'Please enter your bKash/Nagad transaction ID or last 5 digits.'
    );

    $('#tx')?.focus();

    return;
  }

  const position =
    marker.getLatLng();

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

  const paymentMethod =
    onlineRequired
      ? 'bKash/Nagad'
      : 'COD';

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

    deliveryTime:
      deliveryTime.value,

    note:
      $('#note').value.trim(),

    transactionId:
      tx,

    paymentMethod,

    items:
      cart.map(x => ({
        id: x.id,
        sizeIndex:
          Number(x.sizeIndex || 0),
        qty:
          Number(x.qty || 1)
      }))
  };

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
      </p>
    `;

    cart = [];

    save();

    /*
      Keep the confirmation visible.
      Disable placing another order from
      the same checkout screen.
    */

    button.disabled = true;

    /*
      Do not immediately close modal,
      so customer can see order ID.
    */

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
