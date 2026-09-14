const SETTINGS = {
  whatsapp: '8801792494275',
  payment: '01792494275',
  facebook: 'https://web.facebook.com/ChefSifatsKitchen'
};

/* =========================================================
   DELIVERY LOCATION SETTINGS
========================================================= */

const BASE_LOCATION = {
  lat: 23.3022494,
  lng: 90.9187528,
  name: 'Kahalthuri Hamidia High School'
};

/*
  DELIVERY RULE

  0–1 km:
  COD Available
  Delivery Charge = ৳0

  Above 1 km and up to 4 km:
  COD Not Available
  Online payment required
  Delivery Charge = ৳10 per started km

  Above 4 km:
  Order unavailable
*/

const COD_RADIUS_KM = 1.0;
const MAX_DELIVERY_RADIUS_KM = 4.0;
const DELIVERY_RATE_PER_KM = 10;

/* =========================================================
   SHOP HOURS
========================================================= */

const SHOP_HOURS = {
  normal: {
    open: 11,
    close: 19
  },

  friday: {
    open: 15,
    close: 21
  }
};

/* =========================================================
   DEFAULT MENU
========================================================= */

const DEFAULT_MENU = [

  {
    name: 'BBQ Chicken Pizza',
    cat: 'pizza',
    image: 'assets/bbq-chicken-pizza.jpg',
    prices: {
      '6″': 300,
      '8″': 380,
      '10″': 480,
      '12″': 580
    }
  },

  {
    name: 'Meat Pizza',
    cat: 'pizza',
    image: 'assets/meat-pizza.jpg',
    prices: {
      '6″': 350,
      '8″': 450,
      '10″': 550,
      '12″': 650
    }
  },

  {
    name: 'Flaming Chicken Pizza',
    cat: 'pizza',
    image: 'assets/flaming-chicken-pizza.jpg',
    prices: {
      '6″': 300,
      '8″': 350,
      '10″': 450,
      '12″': 550
    }
  },

  {
    name: '6 Season Pizza',
    cat: 'pizza',
    image: 'assets/6-season-pizza.jpg',
    prices: {
      '6″': 350,
      '8″': 420,
      '10″': 500,
      '12″': 600
    }
  },

  {
    name: 'Margherita Pizza',
    cat: 'pizza',
    image: 'assets/margherita-pizza.jpg',
    prices: {
      '6″': 280,
      '8″': 350,
      '10″': 420,
      '12″': 500
    }
  },

  {
    name: 'Neapolitan BBQ Chicken Pizza',
    cat: 'pizza',
    image: 'assets/neapolitan-bbq-chicken-pizza.jpg',
    prices: {
      '8″': 450,
      '10″': 600,
      '12″': 750
    }
  },

  {
    name: 'Neapolitan Meat Pizza',
    cat: 'pizza',
    image: 'assets/neapolitan-meat-pizza.jpg',
    prices: {
      '8″': 500,
      '10″': 650,
      '12″': 800
    }
  },

  {
    name: 'Neapolitan Margherita Pizza',
    cat: 'pizza',
    image: 'assets/neapolitan-margherita-pizza.jpg',
    prices: {
      '6″': 350,
      '8″': 450,
      '10″': 550,
      '12″': 650
    }
  },

  {
    name: 'Emergency BBQ Chicken Pizza',
    cat: 'pizza',
    image: 'assets/emergency-bbq-chicken-pizza.jpg',
    prices: {
      '8″': 400,
      '10″': 550,
      '12″': 700
    }
  },

  {
    name: 'Emergency Meat Pizza',
    cat: 'pizza',
    image: 'assets/emergency-meat-pizza.jpg',
    prices: {
      '8″': 450,
      '10″': 600,
      '12″': 750
    }
  },

  {
    name: 'Emergency Margherita Pizza',
    cat: 'pizza',
    image: 'assets/emergency-margherita-pizza.jpg',
    prices: {
      '6″': 300,
      '8″': 400,
      '10″': 500,
      '12″': 600
    }
  },

  /* ================= MOMO ================= */

  {
    name: 'Chicken Momo',
    cat: 'momo',
    image: 'assets/chicken-momo.jpg',
    prices: {
      '6 pcs': 120,
      '10 pcs': 200
    }
  },

  {
    name: 'Vegetable Momo',
    cat: 'momo',
    image: 'assets/vegetable-momo.jpg',
    prices: {
      '6 pcs': 100,
      '10 pcs': 160
    }
  },

  {
    name: 'BBQ Chicken Momo',
    cat: 'momo',
    image: 'assets/bbq-chicken-momo.jpg',
    prices: {
      '6 pcs': 160,
      '10 pcs': 250
    }
  },

  {
    name: 'Cheese Chicken Momo',
    cat: 'momo',
    image: 'assets/cheese-chicken-momo.jpg',
    prices: {
      '6 pcs': 180,
      '10 pcs': 300
    }
  },

  /* ================= CONTINENTAL ================= */

  {
    name: 'Prawns Cocktail',
    cat: 'continental',
    image: 'assets/prawns-cocktail.png',
    prices: {
      '5–6 pcs / 1 person': 350,
      '10–12 pcs / 2 persons': 700
    }
  },

  {
    name: 'Grilled Fish with Special Fried Potato',
    cat: 'continental',
    image: 'assets/grilled-fish.png',
    prices: {
      '1 person': 380,
      '2 persons': 700
    }
  },

  {
    name: 'Coleslaw Salad',
    cat: 'continental',
    image: 'assets/coleslaw.png',
    prices: {
      '1 serving': 80
    }
  },

  /* ================= KACCHI ================= */

  {
    name: 'Authentic Kacchi Biryani (Full)',
    cat: 'kacchi',
    image: 'assets/authentic-kacchi.jpg',
    prices: {
      '1 person': 399
    },
    minQty: 2,
    maxQty: 20,
    note: 'Minimum order: 2 persons • Pre-booking required'
  },

  {
    name: 'Beef Kacchi Biryani',
    cat: 'kacchi',
    image: 'assets/beef-kacchi.jpg',
    prices: {
      '1 person': 349
    },
    minQty: 2,
    maxQty: 20,
    note: 'Minimum order: 2 persons • Pre-booking required'
  }

];

/* =========================================================
   STORAGE
========================================================= */

let MENU =
  JSON.parse(
    localStorage.getItem('chefSifatMenu') || 'null'
  ) || DEFAULT_MENU;

let activeFilter = 'all';

let cart =
  JSON.parse(
    localStorage.getItem('chefSifatCart5') || '[]'
  );

/* =========================================================
   LEAFLET VARIABLES
========================================================= */

let deliveryMap = null;
let deliveryMarker = null;
let selectedLocation = null;
let reverseGeocodeTimer = null;

/* =========================================================
   HELPERS
========================================================= */

const money = n =>
  '৳' + Number(n || 0).toLocaleString('en-BD');

const isPrebook = cat =>
  ['continental', 'kacchi'].includes(cat);

function saveMenu() {
  localStorage.setItem(
    'chefSifatMenu',
    JSON.stringify(MENU)
  );
}

function saveCart() {
  localStorage.setItem(
    'chefSifatCart5',
    JSON.stringify(cart)
  );

  updateCount();
  renderCart();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setLocationStatus(message, type = '') {
  const status =
    document.getElementById('locationStatus');

  if (!status) return;

  status.className =
    'location-status' +
    (type ? ' ' + type : '');

  status.innerHTML = message;
}

/* =========================================================
   MENU
========================================================= */

function renderMenu() {
  const searchInput =
    document.getElementById('search');

  const grid =
    document.getElementById('menuGrid');

  if (!grid) return;

  const q =
    (searchInput?.value || '')
      .toLowerCase()
      .trim();

  const list = MENU.filter(item => {
    const categoryOK =
      activeFilter === 'all' ||
      item.cat === activeFilter;

    const searchOK =
      !q ||
      item.name.toLowerCase().includes(q);

    return categoryOK && searchOK;
  });

  if (!list.length) {
    grid.innerHTML =
      '<div class="empty">No dishes found. Try another search.</div>';
    return;
  }

  grid.innerHTML = list.map((p, i) => {
    const choices =
      Object.entries(p.prices);

    const menuIndex =
      MENU.indexOf(p);

    return `
      <article class="food-card">

        <div class="food-photo">

          <img
            src="${escapeHtml(p.image)}"
            alt="${escapeHtml(p.name)}"
            loading="lazy"
          >

          <span class="tag">
            ${escapeHtml(p.cat.toUpperCase())}
          </span>

        </div>

        <div class="food-body">

          <h3>
            ${escapeHtml(p.name)}
          </h3>

          <p>
            ${escapeHtml(
              p.note ||
              'Chef-crafted with quality ingredients and prepared fresh to order.'
            )}
          </p>

          <div class="price-list">

            ${choices.map(([key, value]) => `
              <span class="price-pill">
                ${escapeHtml(key)}
                <b>${money(value)}</b>
              </span>
            `).join('')}

          </div>

          <div class="add-row">

            <select
              class="select-size"
              id="size-${i}"
            >
              ${choices.map(([key, value]) => `
                <option value="${escapeHtml(key)}">
                  ${escapeHtml(key)} — ${money(value)}
                </option>
              `).join('')}
            </select>

            <button
              class="add"
              onclick="
                addToCart(
                  ${menuIndex},
                  document.getElementById('size-${i}').value
                )
              "
            >
              Add
            </button>

          </div>

        </div>

      </article>
    `;
  }).join('');
}

/* =========================================================
   CART
========================================================= */

function addToCart(index, choice) {
  const product = MENU[index];

  if (!product || !product.prices[choice]) {
    return;
  }

  const key =
    product.name + '|' + choice;

  let found =
    cart.find(item => item.key === key);

  if (found) {
    found.qty++;
  } else {
    cart.push({
      key,
      name: product.name,
      cat: product.cat,
      choice,
      price: product.prices[choice],
      qty: 1,
      minQty: product.minQty || 1,
      maxQty: product.maxQty || 99
    });
  }

  saveCart();

  toast('Added to cart ✓');

  openCart();
}

function updateCount() {
  const el =
    document.getElementById('cartCount');

  if (!el) return;

  el.textContent =
    cart.reduce(
      (sum, item) => sum + item.qty,
      0
    );
}

function openCart() {
  document
    .getElementById('cart')
    ?.classList.remove('hidden');

  renderCart();
}

function closeCart() {
  document
    .getElementById('cart')
    ?.classList.add('hidden');
}

function renderCart() {
  const box =
    document.getElementById('cartItems');

  const subtotalBox =
    document.getElementById('subtotal');

  if (!box) return;

  if (!cart.length) {
    box.innerHTML = `
      <div class="empty">
        Your cart is empty.<br>
        <span class="muted">
          Choose something delicious from the menu.
        </span>
      </div>
    `;

    if (subtotalBox) {
      subtotalBox.textContent = '৳0';
    }

    return;
  }

  box.innerHTML = `
    <div class="cart-lines">

      ${cart.map((item, index) => `
        <div class="cart-line">

          <div>
            <h4>
              ${escapeHtml(item.name)}
            </h4>

            <small>
              ${escapeHtml(item.choice)}
              • ${money(item.price)} each
              ${
                isPrebook(item.cat)
                  ? ' • Pre-booking'
                  : ''
              }
            </small>
          </div>

          <div class="qty">

            <button
              onclick="changeQty(${index}, -1)"
            >
              −
            </button>

            <b>${item.qty}</b>

            <button
              onclick="changeQty(${index}, 1)"
            >
              +
            </button>

          </div>

          <button
            class="remove"
            onclick="removeItem(${index})"
          >
            Remove
          </button>

        </div>
      `).join('')}

    </div>
  `;

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum + item.price * item.qty,
      0
    );

  if (subtotalBox) {
    subtotalBox.textContent =
      money(subtotal);
  }
}

function changeQty(index, amount) {
  const item = cart[index];

  if (!item) return;

  const next =
    item.qty + amount;

  if (next < 0) return;

  if (next === 0) {
    cart.splice(index, 1);
    saveCart();
    return;
  }

  if (
    item.cat === 'kacchi' &&
    next < 2
  ) {
    toast(
      'Kacchi minimum order is 2 persons.'
    );
    return;
  }

  if (
    next > (item.maxQty || 99)
  ) {
    toast(
      `Maximum quantity is ${item.maxQty || 99}.`
    );
    return;
  }

  item.qty = next;

  saveCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
}

/* =========================================================
   CHECKOUT
========================================================= */

function checkout() {
  if (!cart.length) {
    toast('Add an item first.');
    return;
  }

  const badKacchi =
    cart.find(
      item =>
        item.cat === 'kacchi' &&
        item.qty < 2
    );

  if (badKacchi) {
    toast(
      'Kacchi minimum order is 2 persons.'
    );
    return;
  }

  closeCart();

  document
    .getElementById('checkout')
    ?.classList.remove('hidden');

  resetLocation();

  buildCheckoutSummary();
  buildSlots();
  buildPaymentBlock();
}

function closeCheckout() {
  document
    .getElementById('checkout')
    ?.classList.add('hidden');
}

/* =========================================================
   CHECKOUT SUMMARY
========================================================= */

function buildCheckoutSummary() {
  const box =
    document.getElementById(
      'checkoutSummary'
    );

  if (!box) return;

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum + item.price * item.qty,
      0
    );

  box.innerHTML = `
    <div class="total">
      <span>Order Subtotal</span>
      <b>${money(subtotal)}</b>
    </div>
  `;
}

/* =========================================================
   PAYMENT
========================================================= */

function buildPaymentBlock() {
  const box =
    document.getElementById(
      'paymentBlock'
    );

  if (!box) return;

  const hasPre =
    cart.some(
      item => isPrebook(item.cat)
    );

  if (hasPre) {
    box.innerHTML = `
      <label>
        Payment method

        <select id="cPayment">

          <option value="Full Payment — bKash Personal — 01792494275">
            Full Payment — bKash Personal 01792494275
          </option>

          <option value="Full Payment — Nagad Personal — 01792494275">
            Full Payment — Nagad Personal 01792494275
          </option>

        </select>
      </label>

      <div class="payment-note">
        Pre-booking orders require
        <b>full payment</b>.
        Cash on Delivery is not available
        for pre-booking.
      </div>
    `;
  } else {
    box.innerHTML = `
      <label>
        Payment method

        <select id="cPayment">

          <option value="Select location first">
            Select location first
          </option>

          <option value="bKash Personal — 01792494275">
            bKash Personal — 01792494275
          </option>

          <option value="Nagad Personal — 01792494275">
            Nagad Personal — 01792494275
          </option>

        </select>
      </label>
    `;
  }

  document
    .getElementById('cPayment')
    ?.addEventListener(
      'change',
      updateTransactionField
    );

  updateTransactionField();
}

function updatePaymentOptions(codAvailable) {
  const payment =
    document.getElementById('cPayment');

  if (!payment) return;

  const hasPre =
    cart.some(
      item => isPrebook(item.cat)
    );

  if (hasPre) {
    updateTransactionField();
    return;
  }

  if (codAvailable) {
    payment.innerHTML = `
      <option value="Cash on Delivery">
        Cash on Delivery
      </option>

      <option value="bKash Personal — 01792494275">
        bKash Personal — 01792494275
      </option>

      <option value="Nagad Personal — 01792494275">
        Nagad Personal — 01792494275
      </option>
    `;

    payment.value =
      'Cash on Delivery';
  } else {
    payment.innerHTML = `
      <option value="bKash Personal — 01792494275">
        bKash Personal — 01792494275
      </option>

      <option value="Nagad Personal — 01792494275">
        Nagad Personal — 01792494275
      </option>
    `;

    payment.value =
      'bKash Personal — 01792494275';
  }

  payment.onchange =
    updateTransactionField;

  updateTransactionField();
}

function disablePaymentForUnavailable() {
  const payment =
    document.getElementById('cPayment');

  if (!payment) return;

  payment.innerHTML = `
    <option value="Delivery unavailable">
      Delivery unavailable
    </option>
  `;

  payment.value =
    'Delivery unavailable';

  updateTransactionField();
}

/* =========================================================
   TRANSACTION FIELD
========================================================= */

function updateTransactionField() {
  const payment =
    document.getElementById('cPayment');

  const wrap =
    document.getElementById('cTxWrap');

  const tx =
    document.getElementById('cTx');

  if (!payment || !wrap || !tx) {
    return;
  }

  const value =
    payment.value || '';

  const required =
    value.startsWith('bKash') ||
    value.startsWith('Nagad') ||
    value.startsWith('Full Payment');

  if (required) {
    wrap.style.display = 'block';
    tx.required = true;
  } else {
    wrap.style.display = 'none';
    tx.required = false;
    tx.value = '';
  }
}

/* =========================================================
   SHOP TIME
========================================================= */

function getShopHours(date) {
  return date.getDay() === 5
    ? SHOP_HOURS.friday
    : SHOP_HOURS.normal;
}

function isWithinShopHours(date) {
  const hours =
    getShopHours(date);

  const minutes =
    date.getHours() * 60 +
    date.getMinutes();

  return (
    minutes >= hours.open * 60 &&
    minutes < hours.close * 60
  );
}

function nextHalfHour(date) {
  const d =
    new Date(date);

  d.setSeconds(0, 0);

  const minutes =
    d.getMinutes();

  const add =
    minutes === 0
      ? 0
      : 30 - (minutes % 30);

  d.setMinutes(
    minutes + add
  );

  if (d <= date) {
    d.setMinutes(
      d.getMinutes() + 30
    );
  }

  return d;
}

/* =========================================================
   PRE-BOOKING SLOTS
========================================================= */

function buildSlots() {
  const box =
    document.getElementById(
      'slotBlock'
    );

  if (!box) return;

  const needs =
    cart.some(
      item => isPrebook(item.cat)
    );

  if (!needs) {
    box.innerHTML = '';
    return;
  }

  const now =
    new Date();

  const start =
    new Date(
      now.getTime() +
      5 * 60 * 60 * 1000
    );

  const end =
    new Date(
      now.getTime() +
      12 * 60 * 60 * 1000
    );

  let current =
    nextHalfHour(start);

  const slots = [];

  while (current <= end) {
    if (isWithinShopHours(current)) {
      slots.push(
        new Date(current)
      );
    }

    current =
      new Date(
        current.getTime() +
        30 * 60 * 1000
      );
  }

  if (!slots.length) {
    box.innerHTML = `
      <div class="payment-note">
        No pre-booking slot is currently
        available within the required
        5–12 hour window.
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <label>
      Pre-booking date & time

      <select
        id="prebookSlot"
        required
      >

        ${slots.map((slot, index) => `
          <option
            value="${slot.toISOString()}"
            ${index === 0 ? 'selected' : ''}
          >
            ${slot.toLocaleString(
              'en-BD',
              {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              }
            )}
          </option>
        `).join('')}

      </select>
    </label>
  `;
}

/* =========================================================
   LEAFLET MAP
========================================================= */

function openLocationMap() {
  const mapBox =
    document.getElementById(
      'deliveryMap'
    );

  if (!mapBox) return;

  if (typeof L === 'undefined') {
    setLocationStatus(
      '❌ Map library could not load. Please refresh the page and try again.',
      'bad'
    );
    return;
  }

  mapBox.classList.add('active');

  if (deliveryMap) {
    setTimeout(() => {
      deliveryMap.invalidateSize();

      if (selectedLocation) {
        deliveryMap.setView(
          [
            selectedLocation.lat,
            selectedLocation.lng
          ],
          17
        );
      }
    }, 150);

    return;
  }

  deliveryMap =
    L.map(
      mapBox,
      {
        center: [
          BASE_LOCATION.lat,
          BASE_LOCATION.lng
        ],
        zoom: 15,
        zoomControl: true
      }
    );

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution:
        '&copy; OpenStreetMap contributors'
    }
  ).addTo(deliveryMap);

  const baseMarker =
    L.marker([
      BASE_LOCATION.lat,
      BASE_LOCATION.lng
    ]).addTo(deliveryMap);

  baseMarker.bindPopup(
    `<b>${escapeHtml(BASE_LOCATION.name)}</b><br>Chef Sifat's Kitchen delivery base`
  );

  deliveryMap.on(
    'click',
    event => {
      if (!event.latlng) return;

      setDeliveryLocation(
        event.latlng.lat,
        event.latlng.lng,
        true
      );
    }
  );

  if (selectedLocation) {
    createOrMoveMarker(
      selectedLocation.lat,
      selectedLocation.lng
    );
  }

  setTimeout(() => {
    if (deliveryMap) {
      deliveryMap.invalidateSize();
    }
  }, 250);
}

/* =========================================================
   DELIVERY MARKER
========================================================= */

function createOrMoveMarker(lat, lng) {
  if (!deliveryMap) return;

  const position = [
    Number(lat),
    Number(lng)
  ];

  if (deliveryMarker) {
    deliveryMarker.setLatLng(position);
    return;
  }

  deliveryMarker =
    L.marker(
      position,
      {
        draggable: true,
        title:
          'Drag this pin to your exact delivery location'
      }
    ).addTo(deliveryMap);

  deliveryMarker.bindTooltip(
    'Drag this pin to your exact delivery location',
    {
      direction: 'top',
      offset: [0, -10]
    }
  );

  deliveryMarker.on(
    'dragend',
    event => {
      const marker =
        event.target;

      const position =
        marker.getLatLng();

      setDeliveryLocation(
        position.lat,
        position.lng,
        false
      );
    }
  );
}

/* =========================================================
   SET DELIVERY LOCATION
========================================================= */

function setDeliveryLocation(
  lat,
  lng,
  centerMap = true
) {
  lat = Number(lat);
  lng = Number(lng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return;
  }

  selectedLocation = {
    lat,
    lng
  };

  const latEl =
    document.getElementById('cLat');

  const lngEl =
    document.getElementById('cLng');

  if (latEl) {
    latEl.value =
      lat.toFixed(7);
  }

  if (lngEl) {
    lngEl.value =
      lng.toFixed(7);
  }

  openLocationMap();

  setTimeout(() => {
    if (!deliveryMap) return;

    createOrMoveMarker(
      lat,
      lng
    );

    if (centerMap) {
      deliveryMap.setView(
        [lat, lng],
        17
      );
    }
  }, 50);

  calculateDelivery(
    lat,
    lng
  );

  reverseGeocode(
    lat,
    lng
  );
}

/* =========================================================
   CURRENT GPS LOCATION
========================================================= */

function useCurrentLocation() {
  setLocationStatus(
    '📍 Detecting your current location…'
  );

  if (!navigator.geolocation) {
    setLocationStatus(
      '❌ Your browser does not support GPS. Please select your location on the map.',
      'bad'
    );

    openLocationMap();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      const accuracy =
        position.coords.accuracy || 0;

      setDeliveryLocation(
        position.coords.latitude,
        position.coords.longitude,
        true
      );

      let message =
        '✅ Current location detected.';

      if (accuracy > 100) {
        message += `
          <br>
          <small>
            GPS accuracy is about
            ${Math.round(accuracy)} m.
            You can drag the pin to your exact gate.
          </small>
        `;
      }

      setLocationStatus(
        message,
        'good'
      );
    },

    error => {
      let message =
        'Unable to get your location.';

      if (error.code === 1) {
        message =
          'Location permission was denied. Please allow location access, then try again.';
      } else if (error.code === 2) {
        message =
          'Your location could not be determined. Please select your location on the map.';
      } else if (error.code === 3) {
        message =
          'Location request timed out. Please try again or select your location on the map.';
      }

      setLocationStatus(
        '❌ ' + message,
        'bad'
      );

      openLocationMap();
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

/* =========================================================
   DISTANCE CALCULATION
========================================================= */

function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const R = 6371;

  const dLat =
    (lat2 - lat1) *
    Math.PI / 180;

  const dLon =
    (lon2 - lon1) *
    Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      lat1 * Math.PI / 180
    ) *
    Math.cos(
      lat2 * Math.PI / 180
    ) *
    Math.sin(dLon / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

/* =========================================================
   DELIVERY CALCULATION
========================================================= */

function calculateDelivery(
  lat,
  lng
) {
  const distance =
    calculateDistance(
      BASE_LOCATION.lat,
      BASE_LOCATION.lng,
      lat,
      lng
    );

  const distanceEl =
    document.getElementById(
      'locationDistance'
    );

  const status =
    document.getElementById(
      'locationStatus'
    );

  const result =
    document.getElementById(
      'deliveryResult'
    );

  const button =
    document.getElementById(
      'placeOrderBtn'
    );

  if (distanceEl) {
    distanceEl.textContent =
      `${distance.toFixed(2)} km`;
  }

  /* =========================
     OUTSIDE 4 KM
  ========================= */

  if (
    distance >
    MAX_DELIVERY_RADIUS_KM
  ) {
    setLocationStatus(
      '🚫 This location is outside our 4 km delivery area.',
      'bad'
    );

    if (result) {
      result.style.display =
        'block';

      result.innerHTML = `
        <div class="line">
          <span>Distance</span>
          <b>${distance.toFixed(2)} km</b>
        </div>

        <div class="line">
          <span>Delivery</span>
          <b>Not available</b>
        </div>

        <div class="line">
          <span>Order</span>
          <b>Cannot proceed</b>
        </div>

        <div class="map-address">
          🚫 Please choose a delivery location within
          4 km of ${escapeHtml(BASE_LOCATION.name)}.
        </div>
      `;
    }

    if (button) {
      button.disabled = true;
      button.classList.add(
        'disabled-order'
      );
    }

    disablePaymentForUnavailable();

    return;
  }

  /* =========================
     COD / DELIVERY CHARGE
  ========================= */

  const codAvailable =
    distance <= COD_RADIUS_KM;

  const deliveryCharge =
    codAvailable
      ? 0
      : Math.ceil(distance) *
        DELIVERY_RATE_PER_KM;

  /* =========================
     STATUS
  ========================= */

  if (status) {
    status.className =
      codAvailable
        ? 'location-status good'
        : 'location-status warning';

    status.innerHTML =
      codAvailable
        ? `
          ✅ <b>COD Available</b>
          — Kahalthuri delivery zone
        `
        : `
          ℹ️ <b>COD Not Available</b>
          — Online payment required
        `;
  }

  /* =========================
     RESULT
  ========================= */

  if (result) {
    result.style.display =
      'block';

    const address =
      document.getElementById(
        'cMapAddress'
      )?.value || '';

    result.innerHTML = `
      <div class="line">
        <span>Distance</span>
        <b>${distance.toFixed(2)} km</b>
      </div>

      <div class="line">
        <span>COD</span>
        <b>
          ${
            codAvailable
              ? 'Available'
              : 'Not Available'
          }
        </b>
      </div>

      <div class="line">
        <span>Delivery charge</span>
        <b>${money(deliveryCharge)}</b>
      </div>

      <div class="line">
        <span>Payment</span>
        <b>
          ${
            codAvailable
              ? 'COD / Online'
              : 'Online only'
          }
        </b>
      </div>

      ${
        address
          ? `
            <div class="map-address">
              📌 ${escapeHtml(address)}
            </div>
          `
          : ''
      }
    `;
  }

  if (button) {
    button.disabled = false;
    button.classList.remove(
      'disabled-order'
    );
  }

  updatePaymentOptions(
    codAvailable
  );
}

/* =========================================================
   REVERSE GEOCODING
========================================================= */

function reverseGeocode(
  lat,
  lng
) {
  const addressBox =
    document.getElementById(
      'cMapAddress'
    );

  if (!addressBox) return;

  addressBox.value =
    `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  if (reverseGeocodeTimer) {
    clearTimeout(
      reverseGeocodeTimer
    );
  }

  reverseGeocodeTimer =
    setTimeout(async () => {
      try {
        const url =
          'https://nominatim.openstreetmap.org/reverse' +
          '?format=jsonv2' +
          '&lat=' +
          encodeURIComponent(lat) +
          '&lon=' +
          encodeURIComponent(lng) +
          '&zoom=18' +
          '&addressdetails=1';

        const response =
          await fetch(
            url,
            {
              headers: {
                'Accept':
                  'application/json'
              }
            }
          );

        if (!response.ok) {
          throw new Error(
            'Reverse geocoding failed'
          );
        }

        const data =
          await response.json();

        const address =
          data.display_name ||
          `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        addressBox.value =
          address;

        const result =
          document.getElementById(
            'deliveryResult'
          );

        if (result) {
          const oldAddress =
            result.querySelector(
              '.map-address'
            );

          if (oldAddress) {
            oldAddress.textContent =
              '📌 ' + address;
          } else {
            const p =
              document.createElement(
                'div'
              );

            p.className =
              'map-address';

            p.textContent =
              '📌 ' + address;

            result.appendChild(p);
          }
        }

      } catch (error) {
        addressBox.value =
          `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    }, 500);
}

/* =========================================================
   RESET LOCATION
========================================================= */

function resetLocation() {
  selectedLocation = null;

  const lat =
    document.getElementById('cLat');

  const lng =
    document.getElementById('cLng');

  const address =
    document.getElementById(
      'cMapAddress'
    );

  const distance =
    document.getElementById(
      'locationDistance'
    );

  const result =
    document.getElementById(
      'deliveryResult'
    );

  const button =
    document.getElementById(
      'placeOrderBtn'
    );

  const mapBox =
    document.getElementById(
      'deliveryMap'
    );

  if (lat) {
    lat.value = '';
  }

  if (lng) {
    lng.value = '';
  }

  if (address) {
    address.value = '';
  }

  if (distance) {
    distance.textContent = '';
  }

  setLocationStatus(
    'Please select your delivery location.'
  );

  if (result) {
    result.style.display =
      'none';

    result.innerHTML = '';
  }

  if (button) {
    button.disabled = false;
    button.classList.remove(
      'disabled-order'
    );
  }

  if (mapBox) {
    mapBox.classList.remove(
      'active'
    );
  }

  if (deliveryMarker) {
    deliveryMarker.remove();
    deliveryMarker = null;
  }

  if (deliveryMap) {
    deliveryMap.remove();
    deliveryMap = null;
  }
}

/* =========================================================
   PLACE ORDER
========================================================= */

function placeOrder(e) {
  e.preventDefault();

  if (!cart.length) {
    alert(
      'Your cart is empty.'
    );
    return;
  }

  /* =========================
     LOCATION CHECK
  ========================= */

  const latValue =
    document.getElementById(
      'cLat'
    )?.value;

  const lngValue =
    document.getElementById(
      'cLng'
    )?.value;

  if (
    !selectedLocation ||
    !latValue ||
    !lngValue
  ) {
    alert(
      'Please select your delivery location first.'
    );
    return;
  }

  const lat =
    Number(latValue);

  const lng =
    Number(lngValue);

  const distance =
    calculateDistance(
      BASE_LOCATION.lat,
      BASE_LOCATION.lng,
      lat,
      lng
    );

  /* =========================
     4 KM LIMIT
  ========================= */

  if (
    distance >
    MAX_DELIVERY_RADIUS_KM
  ) {
    alert(
      'Sorry. Your delivery location is outside our 4 km delivery area.'
    );
    return;
  }

  /* =========================
     CUSTOMER INFO
  ========================= */

  const name =
    document.getElementById(
      'cName'
    ).value.trim();

  const phone =
    document.getElementById(
      'cPhone'
    ).value
      .trim()
      .replace(
        /[\s-]/g,
        ''
      );

  const house =
    document.getElementById(
      'cHouse'
    ).value.trim();

  const road =
    document.getElementById(
      'cRoad'
    ).value.trim();

  const mapAddress =
    document.getElementById(
      'cMapAddress'
    ).value.trim();

  const payment =
    document.getElementById(
      'cPayment'
    )?.value || '';

  const tx =
    document.getElementById(
      'cTx'
    )?.value.trim() || '';

  const note =
    document.getElementById(
      'cNote'
    )?.value.trim() || '';

  /* =========================
     VALIDATION
  ========================= */

  if (
    !name ||
    !house ||
    !road
  ) {
    alert(
      'Please complete your name, house/building and road/area.'
    );
    return;
  }

  if (
    !/^01\d{9}$/.test(phone)
  ) {
    alert(
      'Please enter a valid Bangladesh mobile number.'
    );
    return;
  }

  if (
    !payment ||
    payment === 'Select location first' ||
    payment === 'Delivery unavailable'
  ) {
    alert(
      'Please select a valid payment method.'
    );
    return;
  }

  /* =========================
     PREBOOKING
  ========================= */

  const hasPre =
    cart.some(
      item =>
        isPrebook(item.cat)
    );

  const codAvailable =
    distance <= COD_RADIUS_KM;

  const deliveryCharge =
    codAvailable
      ? 0
      : Math.ceil(distance) *
        DELIVERY_RATE_PER_KM;

  /* =========================
     PAYMENT VALIDATION
  ========================= */

  if (
    hasPre &&
    !tx
  ) {
    alert(
      'Full payment is required for pre-booking orders. Please enter the transaction ID.'
    );
    return;
  }

  if (
    !hasPre &&
    !codAvailable &&
    !tx
  ) {
    alert(
      'This location does not support COD. Please complete bKash/Nagad payment and enter the transaction ID.'
    );
    return;
  }

  if (
    codAvailable &&
    payment === 'Cash on Delivery'
  ) {
    /* COD does not require transaction ID */
  } else if (!tx) {
    alert(
      'Please enter the transaction ID / last 5 digits for online payment.'
    );
    return;
  }

  /* =========================
     TOTAL
  ========================= */

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
        item.qty,
      0
    );

  const total =
    subtotal +
    deliveryCharge;

  /* =========================
     PREBOOK SLOT
  ========================= */

  let slot = '';

  if (hasPre) {
    const slotEl =
      document.getElementById(
        'prebookSlot'
      );

    if (
      !slotEl ||
      !slotEl.value
    ) {
      alert(
        'Please select a pre-booking delivery time.'
      );
      return;
    }

    slot =
      slotEl.value;

    const slotDate =
      new Date(slot);

    const minTime =
      new Date(
        Date.now() +
        5 * 60 * 60 * 1000
      );

    const maxTime =
      new Date(
        Date.now() +
        12 * 60 * 60 * 1000
      );

    if (
      slotDate < minTime ||
      slotDate > maxTime ||
      !isWithinShopHours(slotDate)
    ) {
      alert(
        'Please select a valid pre-booking slot within 5–12 hours and shop hours.'
      );

      buildSlots();
      return;
    }
  } else {

    /* =========================
       REGULAR ORDER SHOP HOURS
    ========================= */

    const now =
      new Date();

    if (
      !isWithinShopHours(now)
    ) {
      alert(
        now.getDay() === 5
          ? 'Friday order time is 3:00 PM–9:00 PM. Please order during shop hours.'
          : 'Regular order time is 11:00 AM–7:00 PM. Pre-booking is available for Continental and Kacchi.'
      );

      return;
    }
  }

  /* =========================
     OPENSTREETMAP LOCATION LINK
  ========================= */

  const mapUrl =
    `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;

  /* =========================
     WHATSAPP ORDER MESSAGE
  ========================= */

  let text =
    `*NEW ORDER — CHEF SIFAT'S KITCHEN*\n\n`;

  text +=
    cart.map(item =>
      `• ${item.name} — ${item.choice} × ${item.qty} = ${money(
        item.price * item.qty
      )}`
    ).join('\n');

  text +=
    `\n\n*Subtotal:* ${money(subtotal)}`;

  text +=
    `\n*Delivery Charge:* ${money(deliveryCharge)}`;

  text +=
    `\n*TOTAL:* ${money(total)}`;

  text +=
    `\n\n*Customer:* ${name}`;

  text +=
    `\n*Phone:* ${phone}`;

  text +=
    `\n*House/Building:* ${house}`;

  text +=
    `\n*Road/Area:* ${road}`;

  text +=
    `\n*Map Address:* ${
      mapAddress ||
      'Selected on map'
    }`;

  text +=
    `\n*Distance:* ${distance.toFixed(2)} km`;

  text +=
    `\n*COD:* ${
      codAvailable
        ? 'Available'
        : 'Not Available'
    }`;

  text +=
    `\n*Payment:* ${payment}`;

  text +=
    `\n*Transaction ID:* ${
      tx || 'N/A'
    }`;

  text +=
    `\n*Location:* ${mapUrl}`;

  if (slot) {
    text +=
      `\n*Pre-booking:* ${
        new Date(slot)
          .toLocaleString('en-BD')
      }`;
  }

  text +=
    `\n*Note:* ${
      note || 'None'
    }`;

  /* =========================
     OPEN WHATSAPP
  ========================= */

  const whatsappUrl =
    `https://wa.me/${SETTINGS.whatsapp}?text=` +
    encodeURIComponent(text);

  window.open(
    whatsappUrl,
    '_blank',
    'noopener'
  );

  /* =========================
     CLEAR CART
  ========================= */

  closeCheckout();

  cart = [];

  saveCart();

  toast(
    'Order details prepared ✓'
  );
}

/* =========================================================
   TOAST
========================================================= */

function toast(message) {
  const x =
    document.createElement(
      'div'
    );

  x.textContent =
    message;

  x.style.cssText = [
    'position:fixed',
    'left:50%',
    'bottom:25px',
    'transform:translateX(-50%)',
    'z-index:99999',
    'background:#e8a323',
    'color:#111',
    'padding:11px 18px',
    'border-radius:999px',
    'font-weight:800',
    'box-shadow:0 10px 30px #000'
  ].join(';');

  document.body.appendChild(x);

  setTimeout(
    () => x.remove(),
    1800
  );
}

/* =========================================================
   CATEGORY TABS
========================================================= */

document
  .querySelectorAll('.tab')
  .forEach(button => {

    button.addEventListener(
      'click',
      () => {

        document
          .querySelectorAll('.tab')
          .forEach(x =>
            x.classList.remove(
              'active'
            )
          );

        button.classList.add(
          'active'
        );

        activeFilter =
          button.dataset.filter;

        renderMenu();
      }
    );

  });

/* =========================================================
   SEARCH
========================================================= */

document
  .getElementById('search')
  ?.addEventListener(
    'input',
    renderMenu
  );

/* =========================================================
   YEAR
========================================================= */

const year =
  document.getElementById(
    'year'
  );

if (year) {
  year.textContent =
    new Date().getFullYear();
}

/* =========================================================
   INITIAL LOAD
========================================================= */

renderMenu();
updateCount();
renderCart();
