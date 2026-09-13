/* =========================================================
   CHEF SIFAT'S KITCHEN
   COMPLETE APP.JS
   ========================================================= */

/* =========================
   SETTINGS
========================= */

const SETTINGS = {
  whatsapp: '8801792494275',
  payment: '01792494275',
  facebook: 'https://web.facebook.com/ChefSifatsKitchen'
};


/* =========================
   DELIVERY SETTINGS
========================= */

const BASE_LOCATION = {
  name: 'Kahalthuri Hamidia High School',
  lat: 23.3022494,
  lng: 90.9187528
};

const COD_RADIUS_KM = 1.0;
const MAX_DELIVERY_RADIUS_KM = 4.0;
const DELIVERY_RATE_PER_KM = 10;


/* =========================
   SHOP HOURS
========================= */

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


/* =========================
   DEFAULT MENU
========================= */

const DEFAULT_MENU = [

  /* =========================
     PIZZA
  ========================= */

  {
    name: 'BBQ Chicken Pizza',
    cat: 'pizza',
    image: 'assets/bbq-chicken-pizza.jpg',
    choices: [
      { label: '6"', price: 300 },
      { label: '8"', price: 380 },
      { label: '10"', price: 480 },
      { label: '12"', price: 580 }
    ]
  },

  {
    name: 'Meat Pizza',
    cat: 'pizza',
    image: 'assets/meat-pizza.jpg',
    choices: [
      { label: '6"', price: 350 },
      { label: '8"', price: 450 },
      { label: '10"', price: 550 },
      { label: '12"', price: 650 }
    ]
  },

  {
    name: 'Flaming Chicken Pizza',
    cat: 'pizza',
    image: 'assets/flaming-chicken-pizza.jpg',
    choices: [
      { label: '6"', price: 300 },
      { label: '8"', price: 350 },
      { label: '10"', price: 450 },
      { label: '12"', price: 550 }
    ]
  },

  {
    name: '6 Season Pizza',
    cat: 'pizza',
    image: 'assets/6-season-pizza.jpg',
    choices: [
      { label: '6"', price: 350 },
      { label: '8"', price: 420 },
      { label: '10"', price: 500 },
      { label: '12"', price: 600 }
    ]
  },

  {
    name: 'Margherita Pizza',
    cat: 'pizza',
    image: 'assets/margherita-pizza.jpg',
    choices: [
      { label: '6"', price: 280 },
      { label: '8"', price: 350 },
      { label: '10"', price: 420 },
      { label: '12"', price: 500 }
    ]
  },

  {
    name: 'Neapolitan BBQ Chicken Pizza',
    cat: 'pizza',
    image: 'assets/neapolitan-bbq-chicken-pizza.jpg',
    choices: [
      { label: '8"', price: 450 },
      { label: '10"', price: 600 },
      { label: '12"', price: 750 }
    ]
  },

  {
    name: 'Neapolitan Meat Pizza',
    cat: 'pizza',
    image: 'assets/neapolitan-meat-pizza.jpg',
    choices: [
      { label: '8"', price: 500 },
      { label: '10"', price: 650 },
      { label: '12"', price: 800 }
    ]
  },

  {
    name: 'Neapolitan Margherita Pizza',
    cat: 'pizza',
    image: 'assets/neapolitan-margherita-pizza.jpg',
    choices: [
      { label: '6"', price: 350 },
      { label: '8"', price: 450 },
      { label: '10"', price: 550 },
      { label: '12"', price: 650 }
    ]
  },

  {
    name: 'Emergency BBQ Chicken Pizza',
    cat: 'pizza',
    image: 'assets/emergency-bbq-chicken-pizza.jpg',
    choices: [
      { label: '8"', price: 400 },
      { label: '10"', price: 550 },
      { label: '12"', price: 700 }
    ]
  },

  {
    name: 'Emergency Meat Pizza',
    cat: 'pizza',
    image: 'assets/emergency-meat-pizza.jpg',
    choices: [
      { label: '8"', price: 450 },
      { label: '10"', price: 600 },
      { label: '12"', price: 750 }
    ]
  },

  {
    name: 'Emergency Margherita Pizza',
    cat: 'pizza',
    image: 'assets/emergency-margherita-pizza.jpg',
    choices: [
      { label: '6"', price: 300 },
      { label: '8"', price: 400 },
      { label: '10"', price: 500 },
      { label: '12"', price: 600 }
    ]
  },


  /* =========================
     MOMO
  ========================= */

  {
    name: 'Chicken Momo',
    cat: 'momo',
    image: 'assets/chicken-momo.jpg',
    choices: [
      { label: '6 pcs', price: 120 },
      { label: '10 pcs', price: 200 }
    ]
  },

  {
    name: 'Vegetable Momo',
    cat: 'momo',
    image: 'assets/vegetable-momo.jpg',
    choices: [
      { label: '6 pcs', price: 100 },
      { label: '10 pcs', price: 160 }
    ]
  },

  {
    name: 'BBQ Chicken Momo',
    cat: 'momo',
    image: 'assets/bbq-chicken-momo.jpg',
    choices: [
      { label: '6 pcs', price: 160 },
      { label: '10 pcs', price: 250 }
    ]
  },

  {
    name: 'Cheese Chicken Momo',
    cat: 'momo',
    image: 'assets/cheese-chicken-momo.jpg',
    choices: [
      { label: '6 pcs', price: 180 },
      { label: '10 pcs', price: 300 }
    ]
  },


  /* =========================
     CONTINENTAL
  ========================= */

  {
    name: 'Prawns Cocktail',
    cat: 'continental',
    image: 'assets/prawns-cocktail.png',
    prebook: true,
    note: 'Pre-booking required • 5–12 hours ahead • Full payment required',
    choices: [
      {
        label: '5–6 pcs / 1 person',
        price: 350
      },
      {
        label: '10–12 pcs / 2 persons',
        price: 700
      }
    ]
  },

  {
    name: 'Grilled Fish with Special Fried Potato',
    cat: 'continental',
    image: 'assets/grilled-fish.png',
    prebook: true,
    note: 'Pre-booking required • 5–12 hours ahead • Full payment required',
    choices: [
      {
        label: '1 person',
        price: 380
      },
      {
        label: '2 persons',
        price: 700
      }
    ]
  },

  {
    name: 'Coleslaw Salad',
    cat: 'continental',
    image: 'assets/coleslaw.png',
    prebook: true,
    note: 'Pre-booking required • 5–12 hours ahead • Full payment required',
    choices: [
      {
        label: '1 serving',
        price: 80
      }
    ]
  },


  /* =========================
     KACCHI
  ========================= */

  {
    name: 'Authentic Kacchi Biryani (Full)',
    cat: 'kacchi',
    image: 'assets/authentic-kacchi.jpg',
    prebook: true,
    minQty: 2,
    maxQty: 20,
    note: 'Minimum order: 2 persons • Pre-booking required',
    choices: [
      {
        label: 'Per person',
        price: 399
      }
    ]
  },

  {
    name: 'Beef Kacchi Biryani',
    cat: 'kacchi',
    image: 'assets/beef-kacchi.jpg',
    prebook: true,
    minQty: 2,
    maxQty: 20,
    note: 'Minimum order: 2 persons • Pre-booking required',
    choices: [
      {
        label: 'Per person',
        price: 349
      }
    ]
  }

];


/* =========================================================
   MENU STORAGE
========================================================= */

let savedMenu = [];

try {
  savedMenu = JSON.parse(
    localStorage.getItem('chefSifatMenu') || 'null'
  );
} catch (error) {
  savedMenu = [];
}

const savedMenuList = Array.isArray(savedMenu)
  ? savedMenu
  : [];

const savedByName = new Map(
  savedMenuList
    .filter(item => item && item.name)
    .map(item => [item.name, item])
);

const defaultNames = new Set(
  DEFAULT_MENU.map(item => item.name)
);

let MENU = [
  ...DEFAULT_MENU.map(item =>
    savedByName.get(item.name) || item
  ),

  ...savedMenuList.filter(
    item =>
      item &&
      item.name &&
      !defaultNames.has(item.name)
  )
];

function saveMenu() {
  try {
    localStorage.setItem(
      'chefSifatMenu',
      JSON.stringify(MENU)
    );
  } catch (error) {
    console.warn('Could not save menu:', error);
  }
}

saveMenu();


/* =========================================================
   GLOBAL STATE
========================================================= */

let cart = [];

try {
  const savedCart = JSON.parse(
    localStorage.getItem('chefSifatCart') || '[]'
  );

  if (Array.isArray(savedCart)) {
    cart = savedCart;
  }
} catch (error) {
  cart = [];
}

let currentCategory = 'all';

let deliveryMap = null;
let deliveryMarker = null;
let selectedLocation = null;
let reverseGeocodeTimer = null;


/* =========================================================
   HELPERS
========================================================= */

function money(value) {
  return `৳${Number(value || 0).toLocaleString('en-BD')}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeCategory(cat) {
  return String(cat || '')
    .toLowerCase()
    .trim();
}

function isPrebook(itemOrCategory) {
  if (typeof itemOrCategory === 'object') {
    return !!itemOrCategory.prebook;
  }

  return [
    'kacchi',
    'continental'
  ].includes(
    normalizeCategory(itemOrCategory)
  );
}

function saveCart() {
  try {
    localStorage.setItem(
      'chefSifatCart',
      JSON.stringify(cart)
    );
  } catch (error) {
    console.warn('Could not save cart:', error);
  }
}

function getEl(id) {
  return document.getElementById(id);
}


/* =========================================================
   MENU RENDER
========================================================= */

function renderMenu() {
  const grid = getEl('menuGrid');

  if (!grid) return;

  const searchEl = getEl('search');

  const searchTerm = searchEl
    ? searchEl.value.trim().toLowerCase()
    : '';

  const filtered = MENU.filter(item => {

    const matchesCategory =
      currentCategory === 'all' ||
      normalizeCategory(item.cat) ===
      normalizeCategory(currentCategory);

    const matchesSearch =
      !searchTerm ||
      String(item.name || '')
        .toLowerCase()
        .includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-menu">
        <h3>No items found</h3>
        <p>Try another search or category.</p>
      </div>
    `;

    return;
  }

  grid.innerHTML = filtered.map(item => {

    const choices = Array.isArray(item.choices)
      ? item.choices
      : [];

    const minQty =
      Number(item.minQty || 1);

    const maxQty =
      Number(item.maxQty || 99);

    const choicesHtml = choices.length
      ? `
        <div class="food-options">
          ${choices.map((choice, index) => `
            <label class="food-option">
              <input
                type="radio"
                name="choice-${encodeURIComponent(item.name)}"
                value="${index}"
                ${index === 0 ? 'checked' : ''}
              >
              <span>
                ${escapeHtml(choice.label)}
                — ${money(choice.price)}
              </span>
            </label>
          `).join('')}
        </div>
      `
      : `
        <div class="food-price">
          ${money(item.price)}
        </div>
      `;

    const prebookHtml = isPrebook(item)
      ? `
        <div class="prebook-note">
          ${escapeHtml(
            item.note ||
            'Pre-booking required • 5–12 hours ahead • Full payment required'
          )}
        </div>
      `
      : '';

    return `
      <article class="food-card">

        <div class="food-image-wrap">
          <img
            class="food-image"
            src="${escapeHtml(item.image || '')}"
            alt="${escapeHtml(item.name)}"
            loading="lazy"
            onerror="this.style.display='none'"
          >
        </div>

        <div class="food-card-body">

          <h3 class="food-name">
            ${escapeHtml(item.name)}
          </h3>

          ${choicesHtml}

          ${prebookHtml}

          <div class="food-actions">

            <label class="qty-label">
              Qty
              <input
                class="food-qty"
                type="number"
                min="${minQty}"
                max="${maxQty}"
                value="${minQty}"
                id="qty-${encodeURIComponent(item.name)}"
              >
            </label>

            <button
              type="button"
              class="add-btn"
              onclick="addToCartByName('${encodeURIComponent(item.name)}')"
            >
              Add to Cart
            </button>

          </div>

        </div>

      </article>
    `;
  }).join('');
}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCartByName(encodedName) {
  const name = decodeURIComponent(encodedName);

  const item = MENU.find(
    menuItem => menuItem.name === name
  );

  if (!item) {
    toast('Item not found.');
    return;
  }

  const qtyInput =
    getEl(`qty-${encodeURIComponent(item.name)}`);

  const quantity =
    Math.max(
      Number(item.minQty || 1),
      Number(qtyInput?.value || item.minQty || 1)
    );

  const choices =
    Array.isArray(item.choices)
      ? item.choices
      : [];

  let choiceIndex = 0;

  const radios =
    document.querySelectorAll(
      `input[name="choice-${encodeURIComponent(item.name)}"]`
    );

  radios.forEach(radio => {
    if (radio.checked) {
      choiceIndex = Number(radio.value);
    }
  });

  const selectedChoice =
    choices[choiceIndex];

  const price =
    selectedChoice
      ? Number(selectedChoice.price)
      : Number(item.price || 0);

  const choice =
    selectedChoice
      ? selectedChoice.label
      : '';

  if (quantity > Number(item.maxQty || 99)) {
    toast(
      `Maximum quantity is ${item.maxQty || 99}.`
    );

    return;
  }

  const existing =
    cart.find(
      cartItem =>
        cartItem.name === item.name &&
        cartItem.choice === choice
    );

  if (existing) {
    const newQty =
      Number(existing.qty || 0) + quantity;

    if (newQty > Number(item.maxQty || 99)) {
      toast(
        `Maximum quantity is ${item.maxQty || 99}.`
      );

      return;
    }

    existing.qty = newQty;

  } else {

    cart.push({
      name: item.name,
      cat: item.cat,
      choice: choice,
      price: price,
      qty: quantity,
      image: item.image || '',
      prebook: !!item.prebook
    });
  }

  saveCart();
  updateCount();
  renderCart();

  toast(`${item.name} added to cart.`);
}

function addToCart(item, choiceIndex = 0, qty = 1) {
  const choices =
    Array.isArray(item.choices)
      ? item.choices
      : [];

  const selectedChoice =
    choices[choiceIndex] || choices[0];

  const price =
    selectedChoice
      ? Number(selectedChoice.price)
      : Number(item.price || 0);

  const choice =
    selectedChoice
      ? selectedChoice.label
      : '';

  const quantity =
    Math.max(
      Number(item.minQty || 1),
      Number(qty || 1)
    );

  cart.push({
    name: item.name,
    cat: item.cat,
    choice,
    price,
    qty: quantity,
    image: item.image || '',
    prebook: !!item.prebook
  });

  saveCart();
  updateCount();
  renderCart();
}


/* =========================================================
   CART
========================================================= */

function updateCount() {
  const count =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.qty || 0),
      0
    );

  const cartCount =
    getEl('cartCount');

  if (cartCount) {
    cartCount.textContent = count;
  }
}

function openCart() {
  const cartEl = getEl('cart');

  if (cartEl) {
    cartEl.classList.add('open');
  }

  renderCart();
}

function closeCart() {
  const cartEl = getEl('cart');

  if (cartEl) {
    cartEl.classList.remove('open');
  }
}

function renderCart() {
  const box =
    getEl('cartItems');

  if (!box) return;

  if (!cart.length) {

    box.innerHTML = `
      <div class="empty">
        <h3>Your cart is empty</h3>
        <p>Add delicious food to continue.</p>
      </div>
    `;

    const subtotalEl =
      getEl('subtotal');

    if (subtotalEl) {
      subtotalEl.textContent = money(0);
    }

    return;
  }

  box.innerHTML = cart.map((item, index) => {

    const lineTotal =
      Number(item.price || 0) *
      Number(item.qty || 0);

    return `
      <div class="cart-row">

        <div class="cart-info">

          ${
            item.image
              ? `
                <img
                  class="cart-thumb"
                  src="${escapeHtml(item.image)}"
                  alt="${escapeHtml(item.name)}"
                >
              `
              : ''
          }

          <div>
            <strong>
              ${escapeHtml(item.name)}
            </strong>

            ${
              item.choice
                ? `
                  <div class="cart-choice">
                    ${escapeHtml(item.choice)}
                  </div>
                `
                : ''
            }

            <div class="cart-price">
              ${money(item.price)} × ${item.qty}
            </div>
          </div>

        </div>

        <div class="cart-controls">

          <button
            type="button"
            onclick="changeQty(${index}, -1)"
          >
            −
          </button>

          <span>${item.qty}</span>

          <button
            type="button"
            onclick="changeQty(${index}, 1)"
          >
            +
          </button>

          <button
            type="button"
            class="remove-btn"
            onclick="removeItem(${index})"
          >
            Remove
          </button>

        </div>

        <div class="cart-line-total">
          ${money(lineTotal)}
        </div>

      </div>
    `;
  }).join('');

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.qty || 0),
      0
    );

  const subtotalEl =
    getEl('subtotal');

  if (subtotalEl) {
    subtotalEl.textContent =
      money(subtotal);
  }
}

function changeQty(index, delta) {
  const item = cart[index];

  if (!item) return;

  const minQty =
    Number(
      MENU.find(menuItem =>
        menuItem.name === item.name
      )?.minQty || 1
    );

  const maxQty =
    Number(
      MENU.find(menuItem =>
        menuItem.name === item.name
      )?.maxQty || 99
    );

  const newQty =
    Number(item.qty || 0) + delta;

  if (newQty < minQty) {
    removeItem(index);
    return;
  }

  if (newQty > maxQty) {
    toast(
      `Maximum quantity is ${maxQty}.`
    );

    return;
  }

  item.qty = newQty;

  saveCart();
  updateCount();
  renderCart();
}

function removeItem(index) {
  if (!cart[index]) return;

  cart.splice(index, 1);

  saveCart();
  updateCount();
  renderCart();
}


/* =========================================================
   CHECKOUT
========================================================= */

function checkout() {

  if (!cart.length) {
    toast('Your cart is empty.');
    return;
  }

  const checkoutEl =
    getEl('checkout');

  if (checkoutEl) {
    checkoutEl.classList.add('open');
  }

  buildCheckoutSummary();
  buildPaymentBlock();
  buildSlots();

  setTimeout(() => {
    initializeDeliveryMap();
  }, 100);
}

function closeCheckout() {

  const checkoutEl =
    getEl('checkout');

  if (checkoutEl) {
    checkoutEl.classList.remove('open');
  }
}

function buildCheckoutSummary() {

  const box =
    getEl('checkoutSummary');

  if (!box) return;

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.qty || 0),
      0
    );

  box.innerHTML = `
    <div class="checkout-items">

      ${cart.map(item => `
        <div class="checkout-item">

          <span>
            ${escapeHtml(item.name)}

            ${
              item.choice
                ? ` (${escapeHtml(item.choice)})`
                : ''
            }

            × ${item.qty}
          </span>

          <strong>
            ${money(
              Number(item.price || 0) *
              Number(item.qty || 0)
            )}
          </strong>

        </div>
      `).join('')}

    </div>

    <div class="checkout-total">
      <span>Food subtotal</span>
      <strong>${money(subtotal)}</strong>
    </div>
  `;
}


/* =========================================================
   PAYMENT
========================================================= */

function buildPaymentBlock() {

  const box =
    getEl('paymentBlock');

  if (!box) return;

  const hasPre =
    cart.some(item => isPrebook(item));

  if (hasPre) {

    box.innerHTML = `
      <div class="payment-title">
        Payment method
      </div>

      <div class="payment-required">
        Pre-booking items require full payment.
      </div>

      <label class="payment-card">
        <input
          type="radio"
          name="fpPayment"
          value="bKash Personal"
          checked
        >

        <span>
          <strong>bKash Personal</strong>
          <small>${SETTINGS.payment}</small>
        </span>
      </label>

      <label class="payment-card">
        <input
          type="radio"
          name="fpPayment"
          value="Nagad Personal"
        >

        <span>
          <strong>Nagad Personal</strong>
          <small>${SETTINGS.payment}</small>
        </span>
      </label>

      <div class="payment-instruction">
        Send the full payment to the selected number,
        then enter the transaction ID / last 5 digits below.
      </div>

      <div id="fpTransactionBox">
        <label>
          Transaction ID / Last 5 digits
          <input
            id="cTx"
            type="text"
            placeholder="Enter transaction ID or last 5 digits"
          >
        </label>
      </div>
    `;

    return;
  }

  box.innerHTML = `
    <div class="payment-title">
      Payment method
    </div>

    <div id="paymentOptions">

      <label class="payment-card">
        <input
          type="radio"
          name="fpPayment"
          value="Cash on Delivery"
        >

        <span>
          <strong>Cash on Delivery</strong>
          <small>Available based on delivery location</small>
        </span>
      </label>

      <label class="payment-card">
        <input
          type="radio"
          name="fpPayment"
          value="bKash Personal"
          checked
        >

        <span>
          <strong>bKash Personal</strong>
          <small>${SETTINGS.payment}</small>
        </span>
      </label>

      <label class="payment-card">
        <input
          type="radio"
          name="fpPayment"
          value="Nagad Personal"
        >

        <span>
          <strong>Nagad Personal</strong>
          <small>${SETTINGS.payment}</small>
        </span>
      </label>

    </div>

    <div class="payment-instruction">
      For bKash/Nagad, send payment to
      <strong>${SETTINGS.payment}</strong>
      and enter the transaction ID / last 5 digits.
    </div>

    <div id="fpTransactionBox">
      <label>
        Transaction ID / Last 5 digits
        <input
          id="cTx"
          type="text"
          placeholder="Enter transaction ID or last 5 digits"
        >
      </label>
    </div>
  `;

  updatePaymentOptions(
    selectedLocation
      ? calculateDelivery(
          selectedLocation.lat,
          selectedLocation.lng,
          false
        )
      : null
  );
}

function updatePaymentOptions(codAvailable) {

  const options =
    document.querySelectorAll(
      'input[name="fpPayment"]'
    );

  if (!options.length) return;

  const hasPre =
    cart.some(item => isPrebook(item));

  if (hasPre) {
    options.forEach(input => {
      if (
        input.value ===
        'Cash on Delivery'
      ) {
        input.checked = false;
        input.disabled = true;
      }
    });

    const firstOnline =
      Array.from(options).find(
        input =>
          input.value !==
          'Cash on Delivery'
      );

    if (firstOnline && !firstOnline.checked) {
      firstOnline.checked = true;
    }

    syncFoodpandaPayment();

    return;
  }

  options.forEach(input => {

    if (
      input.value ===
      'Cash on Delivery'
    ) {
      input.disabled =
        codAvailable !== true;

      if (!codAvailable) {
        input.checked = false;
      }
    }
  });

  const checked =
    document.querySelector(
      'input[name="fpPayment"]:checked'
    );

  if (!checked) {

    const online =
      document.querySelector(
        'input[name="fpPayment"]:not([value="Cash on Delivery"])'
      );

    if (online) {
      online.checked = true;
    }
  }

  syncFoodpandaPayment();
}

function syncFoodpandaPayment() {

  const selected =
    document.querySelector(
      'input[name="fpPayment"]:checked'
    );

  const txBox =
    getEl('fpTransactionBox');

  if (!txBox) return;

  if (
    selected &&
    selected.value ===
    'Cash on Delivery'
  ) {
    txBox.style.display = 'none';
  } else {
    txBox.style.display = '';
  }
}

function getSelectedPayment() {

  const selected =
    document.querySelector(
      'input[name="fpPayment"]:checked'
    );

  return selected
    ? selected.value
    : '';
}

function disablePaymentForUnavailable() {

  const options =
    document.querySelectorAll(
      'input[name="fpPayment"]'
    );

  options.forEach(input => {
    input.disabled = true;
    input.checked = false;
  });

  const txBox =
    getEl('fpTransactionBox');

  if (txBox) {
    txBox.style.display = 'none';
  }
}

function getOrderPayment() {

  const selected =
    getSelectedPayment();

  if (selected) {
    return selected;
  }

  return '';
}


/* =========================================================
   SHOP TIME
========================================================= */

function getShopHours(date = new Date()) {

  const day =
    date.getDay();

  if (day === 5) {
    return SHOP_HOURS.friday;
  }

  return SHOP_HOURS.normal;
}

function isWithinShopHours(date = new Date()) {

  const hours =
    getShopHours(date);

  const currentMinutes =
    date.getHours() * 60 +
    date.getMinutes();

  const openMinutes =
    hours.open * 60;

  const closeMinutes =
    hours.close * 60;

  return (
    currentMinutes >= openMinutes &&
    currentMinutes <= closeMinutes
  );
}

function nextHalfHour(date = new Date()) {

  const result =
    new Date(date);

  result.setSeconds(0);
  result.setMilliseconds(0);

  if (result.getMinutes() < 30) {
    result.setMinutes(30);
  } else {
    result.setMinutes(0);
    result.setHours(
      result.getHours() + 1
    );
  }

  return result;
}

function formatDateTime(date) {

  return date.toLocaleString(
    'en-BD',
    {
      dateStyle: 'medium',
      timeStyle: 'short'
    }
  );
}

function buildSlots() {

  const box =
    getEl('slotBlock');

  if (!box) return;

  const hasPre =
    cart.some(item => isPrebook(item));

  if (!hasPre) {

    box.innerHTML = `
      <div class="slot-normal">
        <strong>Delivery time</strong>
        <p>
          Regular orders are accepted during shop hours.
        </p>
      </div>
    `;

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

  let cursor =
    nextHalfHour(start);

  const slots = [];

  while (cursor <= end) {

    if (isWithinShopHours(cursor)) {
      slots.push(
        new Date(cursor)
      );
    }

    cursor =
      new Date(
        cursor.getTime() +
        30 * 60 * 1000
      );
  }

  if (!slots.length) {

    box.innerHTML = `
      <div class="slot-error">
        No pre-booking slots are currently available.
        Please try again later.
      </div>
    `;

    return;
  }

  box.innerHTML = `
    <label>
      Pre-booking / delivery time

      <select id="cSlot">

        <option value="">
          Select a time
        </option>

        ${slots.map(slot => `
          <option value="${slot.toISOString()}">
            ${escapeHtml(
              formatDateTime(slot)
            )}
          </option>
        `).join('')}

      </select>

    </label>

    <div class="slot-note">
      Pre-booking must be made 5–12 hours ahead.
    </div>
  `;
}


/* =========================================================
   LEAFLET MAP
========================================================= */

function initializeDeliveryMap() {

  const mapElement =
    getEl('deliveryMap');

  if (!mapElement) return;

  if (
    typeof L === 'undefined'
  ) {
    const status =
      getEl('locationStatus');

    if (status) {
      status.innerHTML = `
        <div class="location-error">
          Map library is not loaded.
          Please make sure Leaflet CSS/JS is included
          in index.html.
        </div>
      `;
    }

    return;
  }

  if (deliveryMap) {
    setTimeout(() => {
      deliveryMap.invalidateSize();
    }, 200);

    return;
  }

  deliveryMap =
    L.map(
      mapElement,
      {
        zoomControl: true
      }
    ).setView(
      [
        BASE_LOCATION.lat,
        BASE_LOCATION.lng
      ],
      14
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
    L.marker(
      [
        BASE_LOCATION.lat,
        BASE_LOCATION.lng
      ]
    ).addTo(deliveryMap);

  baseMarker.bindPopup(
    `<b>${escapeHtml(BASE_LOCATION.name)}</b><br>Chef Sifat's Kitchen delivery base`
  );

  deliveryMap.on(
    'click',
    event => {

      createOrMoveMarker(
        event.latlng.lat,
        event.latlng.lng,
        true
      );

    }
  );

  if (
    selectedLocation &&
    selectedLocation.lat &&
    selectedLocation.lng
  ) {

    createOrMoveMarker(
      selectedLocation.lat,
      selectedLocation.lng,
      false
    );
  }
}

function openLocationMap() {

  initializeDeliveryMap();

  const mapElement =
    getEl('deliveryMap');

  if (mapElement) {
    mapElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
}

function createOrMoveMarker(
  lat,
  lng,
  shouldReverseGeocode = true
) {

  if (!deliveryMap) {
    initializeDeliveryMap();
  }

  if (!deliveryMap) return;

  if (!deliveryMarker) {

    deliveryMarker =
      L.marker(
        [lat, lng],
        {
          draggable: true
        }
      ).addTo(deliveryMap);

    deliveryMarker.on(
      'dragend',
      event => {

        const position =
          event.target.getLatLng();

        setDeliveryLocation(
          position.lat,
          position.lng,
          true
        );
      }
    );

  } else {

    deliveryMarker.setLatLng(
      [lat, lng]
    );
  }

  deliveryMap.setView(
    [lat, lng],
    Math.max(
      deliveryMap.getZoom(),
      16
    )
  );

  setDeliveryLocation(
    lat,
    lng,
    shouldReverseGeocode
  );
}


/* =========================================================
   CURRENT LOCATION
========================================================= */

function useCurrentLocation() {

  const status =
    getEl('locationStatus');

  if (!navigator.geolocation) {

    if (status) {
      status.innerHTML = `
        <div class="location-error">
          Your browser does not support GPS location.
          Please select your location on the map.
        </div>
      `;
    }

    return;
  }

  if (status) {
    status.innerHTML = `
      <div class="location-loading">
        Detecting your current location...
      </div>
    `;
  }

  navigator.geolocation.getCurrentPosition(

    position => {

      const lat =
        Number(position.coords.latitude);

      const lng =
        Number(position.coords.longitude);

      const accuracy =
        Number(position.coords.accuracy || 0);

      initializeDeliveryMap();

      createOrMoveMarker(
        lat,
        lng,
        true
      );

      if (status) {

        let message =
          `Location detected successfully.`;

        if (accuracy > 100) {
          message +=
            ` GPS accuracy is approximately ${Math.round(accuracy)} metres. You can move the pin if needed.`;
        }

        status.innerHTML = `
          <div class="location-success">
            ${escapeHtml(message)}
          </div>
        `;
      }

    },

    error => {

      let message =
        'Unable to detect your location.';

      if (error.code === 1) {
        message =
          'Location permission was denied. Please allow location access or select your location on the map.';
      } else if (error.code === 2) {
        message =
          'Your location could not be determined. Please select your location on the map.';
      } else if (error.code === 3) {
        message =
          'Location detection timed out. Please try again or select your location on the map.';
      }

      if (status) {
        status.innerHTML = `
          <div class="location-error">
            ${escapeHtml(message)}
          </div>
        `;
      }
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}


/* =========================================================
   SET DELIVERY LOCATION
========================================================= */

function setDeliveryLocation(
  lat,
  lng,
  reverse = true
) {

  lat =
    Number(lat);

  lng =
    Number(lng);

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

  const latInput =
    getEl('cLat');

  const lngInput =
    getEl('cLng');

  if (latInput) {
    latInput.value =
      lat.toFixed(6);
  }

  if (lngInput) {
    lngInput.value =
      lng.toFixed(6);
  }

  calculateDelivery(
    lat,
    lng,
    true
  );

  if (reverse) {
    reverseGeocode(
      lat,
      lng
    );
  }
}


/* =========================================================
   DISTANCE CALCULATION
========================================================= */

function calculateDistance(
  lat1,
  lng1,
  lat2,
  lng2
) {

  const R =
    6371;

  const dLat =
    (
      (lat2 - lat1) *
      Math.PI
    ) / 180;

  const dLng =
    (
      (lng2 - lng1) *
      Math.PI
    ) / 180;

  const a =
    Math.sin(dLat / 2) *
    Math.sin(dLat / 2) +

    Math.cos(
      lat1 * Math.PI / 180
    ) *
    Math.cos(
      lat2 * Math.PI / 180
    ) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}


/* =========================================================
   DELIVERY CALCULATION
========================================================= */

function calculateDelivery(
  lat,
  lng,
  updateUI = true
) {

  const distance =
    calculateDistance(
      BASE_LOCATION.lat,
      BASE_LOCATION.lng,
      lat,
      lng
    );

  const codAvailable =
    distance <= COD_RADIUS_KM;

  const deliverable =
    distance <= MAX_DELIVERY_RADIUS_KM;

  let deliveryCharge = 0;

  if (distance > COD_RADIUS_KM) {
    deliveryCharge =
      Math.ceil(distance) *
      DELIVERY_RATE_PER_KM;
  }

  if (distance > MAX_DELIVERY_RADIUS_KM) {
    deliveryCharge = 0;
  }

  if (updateUI) {

    const distanceEl =
      getEl('locationDistance');

    if (distanceEl) {
      distanceEl.textContent =
        `${distance.toFixed(2)} km`;
    }

    const result =
      getEl('deliveryResult');

    if (!deliverable) {

      if (result) {
        result.innerHTML = `
          <div class="delivery-unavailable">
            <strong>Delivery unavailable</strong>

            <p>
              Your location is
              ${distance.toFixed(2)} km
              from our delivery base.
            </p>

            <p>
              We currently deliver only within
              ${MAX_DELIVERY_RADIUS_KM} km
              of ${escapeHtml(BASE_LOCATION.name)}.
            </p>

            <strong>
              This order cannot proceed.
            </strong>
          </div>
        `;
      }

      disablePaymentForUnavailable();

    } else {

      if (result) {

        if (codAvailable) {

          result.innerHTML = `
            <div class="delivery-success">
              <strong>COD Available</strong>

              <p>
                Distance:
                ${distance.toFixed(2)} km
              </p>

              <p>
                Delivery charge:
                <strong>${money(0)}</strong>
              </p>
            </div>
          `;

        } else {

          result.innerHTML = `
            <div class="delivery-online">
              <strong>Online payment required</strong>

              <p>
                Distance:
                ${distance.toFixed(2)} km
              </p>

              <p>
                Delivery charge:
                <strong>${money(deliveryCharge)}</strong>
              </p>

              <p>
                COD is available only within
                ${COD_RADIUS_KM} km
                of the delivery base.
              </p>
            </div>
          `;
        }
      }

      updatePaymentOptions(
        codAvailable
      );
    }
  }

  return {
    distance,
    codAvailable,
    deliverable,
    deliveryCharge
  };
}


/* =========================================================
   REVERSE GEOCODING
========================================================= */

function reverseGeocode(
  lat,
  lng
) {

  const addressBox =
    getEl('cMapAddress');

  if (!addressBox) return;

  clearTimeout(
    reverseGeocodeTimer
  );

  addressBox.value =
    `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  reverseGeocodeTimer =
    setTimeout(async () => {

      try {

        const url =
          'https://nominatim.openstreetmap.org/reverse' +
          `?format=jsonv2&lat=${encodeURIComponent(lat)}` +
          `&lon=${encodeURIComponent(lng)}`;

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

  const latInput =
    getEl('cLat');

  const lngInput =
    getEl('cLng');

  const addressBox =
    getEl('cMapAddress');

  const distanceEl =
    getEl('locationDistance');

  const result =
    getEl('deliveryResult');

  const status =
    getEl('locationStatus');

  if (latInput) {
    latInput.value = '';
  }

  if (lngInput) {
    lngInput.value = '';
  }

  if (addressBox) {
    addressBox.value = '';
  }

  if (distanceEl) {
    distanceEl.textContent = '';
  }

  if (result) {
    result.innerHTML = '';
  }

  if (status) {
    status.innerHTML = `
      <div class="location-info">
        Please use your current location or select
        your delivery point on the map.
      </div>
    `;
  }

  if (deliveryMarker) {

    deliveryMap.removeLayer(
      deliveryMarker
    );

    deliveryMarker = null;
  }

  buildPaymentBlock();
}


/* =========================================================
   PLACE ORDER
========================================================= */

function placeOrder(event) {

  if (event) {
    event.preventDefault();
  }

  if (!cart.length) {
    toast('Your cart is empty.');
    return false;
  }


  /* -------------------------
     CUSTOMER INFO
  ------------------------- */

  const name =
    getEl('cName')?.value.trim() || '';

  const phone =
    getEl('cPhone')?.value.trim() || '';

  const house =
    getEl('cHouse')?.value.trim() || '';

  const road =
    getEl('cRoad')?.value.trim() || '';

  const note =
    getEl('cNote')?.value.trim() || '';

  const lat =
    Number(
      getEl('cLat')?.value || 0
    );

  const lng =
    Number(
      getEl('cLng')?.value || 0
    );

  const mapAddress =
    getEl('cMapAddress')?.value.trim() || '';


  if (!name) {
    toast('Please enter your name.');
    return false;
  }

  if (!phone) {
    toast('Please enter your phone number.');
    return false;
  }

  if (!house) {
    toast('Please enter House / Building.');
    return false;
  }

  if (!road) {
    toast('Please enter Road / Area.');
    return false;
  }

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !lat ||
    !lng
  ) {
    toast(
      'Please select your delivery location on the map.'
    );

    return false;
  }


  /* -------------------------
     DELIVERY CHECK
  ------------------------- */

  const delivery =
    calculateDelivery(
      lat,
      lng,
      true
    );

  if (!delivery.deliverable) {

    toast(
      'Sorry, your location is outside our 4 km delivery area.'
    );

    return false;
  }


  /* -------------------------
     SHOP HOURS
  ------------------------- */

  const hasPre =
    cart.some(item =>
      isPrebook(item)
    );

  const now =
    new Date();

  if (!hasPre) {

    if (!isWithinShopHours(now)) {

      const hours =
        getShopHours(now);

      const day =
        now.getDay();

      const hoursText =
        day === 5
          ? 'Friday: 3 PM – 9 PM'
          : 'Regular days: 11 AM – 7 PM';

      toast(
        `Regular orders are currently closed. ${hoursText}`
      );

      return false;
    }
  }


  /* -------------------------
     PAYMENT
  ------------------------- */

  const payment =
    getOrderPayment();

  if (!payment) {

    toast(
      'Please select a payment method.'
    );

    return false;
  }

  const tx =
    getEl('cTx')?.value.trim() || '';

  if (
    payment !==
    'Cash on Delivery'
  ) {

    if (!tx) {

      toast(
        'Please enter the transaction ID or last 5 digits.'
      );

      return false;
    }
  }

  if (
    payment ===
    'Cash on Delivery' &&
    !delivery.codAvailable
  ) {

    toast(
      'Cash on Delivery is not available for this location.'
    );

    return false;
  }


  /* -------------------------
     PRE-BOOKING
  ------------------------- */

  let selectedSlot = '';

  if (hasPre) {

    const slotEl =
      getEl('cSlot');

    selectedSlot =
      slotEl?.value || '';

    if (!selectedSlot) {

      toast(
        'Please select a pre-booking time.'
      );

      return false;
    }

    const selectedDate =
      new Date(
        selectedSlot
      );

    const diffHours =
      (
        selectedDate.getTime() -
        Date.now()
      ) /
      (1000 * 60 * 60);

    if (
      diffHours < 5 ||
      diffHours > 12
    ) {

      toast(
        'Pre-booking time must be 5–12 hours ahead.'
      );

      buildSlots();

      return false;
    }

    if (
      !isWithinShopHours(
        selectedDate
      )
    ) {

      toast(
        'The selected time is outside shop hours.'
      );

      return false;
    }
  }


  /* -------------------------
     SUBTOTAL
  ------------------------- */

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.qty || 0),
      0
    );

  const total =
    subtotal +
    Number(
      delivery.deliveryCharge || 0
    );


  /* -------------------------
     MAP URL
  ------------------------- */

  const mapUrl =
    `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;


  /* -------------------------
     WHATSAPP ORDER MESSAGE
  ------------------------- */

  let text =
    `*NEW ORDER — CHEF SIFAT'S KITCHEN*\n\n`;

  text +=
    `*Customer Information*\n`;

  text +=
    `Name: ${name}\n`;

  text +=
    `Phone: ${phone}\n`;

  text +=
    `House/Building: ${house}\n`;

  text +=
    `Road/Area: ${road}\n`;

  if (mapAddress) {
    text +=
      `Selected Address: ${mapAddress}\n`;
  }

  text +=
    `Location: ${mapUrl}\n`;

  text +=
    `Distance: ${delivery.distance.toFixed(2)} km\n`;

  text +=
    `COD Available: ${
      delivery.codAvailable
        ? 'YES'
        : 'NO'
    }\n\n`;


  /* -------------------------
     ORDER ITEMS
  ------------------------- */

  text +=
    `*Order Items*\n`;

  cart.forEach(item => {

    text +=
      `• ${item.name}`;

    if (item.choice) {
      text +=
        ` — ${item.choice}`;
    }

    text +=
      ` × ${item.qty} = ${money(
        Number(item.price || 0) *
        Number(item.qty || 0)
      )}\n`;
  });


  /* -------------------------
     TOTALS
  ------------------------- */

  text +=
    `\n*Payment & Delivery*\n`;

  text +=
    `Food subtotal: ${money(subtotal)}\n`;

  text +=
    `Delivery charge: ${money(
      delivery.deliveryCharge
    )}\n`;

  text +=
    `Total: ${money(total)}\n`;

  text +=
    `Payment method: ${payment}\n`;

  if (tx) {
    text +=
      `Transaction ID / Last 5 digits: ${tx}\n`;
  }

  if (selectedSlot) {

    const slotDate =
      new Date(
        selectedSlot
      );

    text +=
      `Pre-booking time: ${formatDateTime(
        slotDate
      )}\n`;
  }

  if (note) {

    text +=
      `\nCustomer note: ${note}\n`;
  }

  text +=
    `\nThank you for ordering from Chef Sifat's Kitchen.`;


  /* -------------------------
     WHATSAPP
  ------------------------- */

  const whatsappUrl =
    `https://wa.me/${SETTINGS.whatsapp}?text=` +
    encodeURIComponent(text);

  try {

    window.open(
      whatsappUrl,
      '_blank'
    );

  } catch (error) {

    window.location.href =
      whatsappUrl;
  }


  /* -------------------------
     CLEAR CART
  ------------------------- */

  cart = [];

  saveCart();
  updateCount();
  renderCart();

  closeCheckout();

  toast(
    'Order details prepared successfully.'
  );

  return true;
}


/* =========================================================
   TOAST
========================================================= */

function toast(message) {

  let toastEl =
    getEl('toast');

  if (!toastEl) {

    toastEl =
      document.createElement(
        'div'
      );

    toastEl.id =
      'toast';

    toastEl.className =
      'toast';

    document.body.appendChild(
      toastEl
    );
  }

  toastEl.textContent =
    message;

  toastEl.classList.add(
    'show'
  );

  clearTimeout(
    toastEl._timer
  );

  toastEl._timer =
    setTimeout(() => {

      toastEl.classList.remove(
        'show'
      );

    }, 3000);
}


/* =========================================================
   CATEGORY TABS
========================================================= */

function setupCategoryTabs() {

  const tabs =
    document.querySelectorAll(
      '[data-category]'
    );

  tabs.forEach(tab => {

    tab.addEventListener(
      'click',
      () => {

        currentCategory =
          tab.dataset.category ||
          'all';

        tabs.forEach(
          other =>
            other.classList.remove(
              'active'
            )
        );

        tab.classList.add(
          'active'
        );

        renderMenu();
      }
    );
  });
}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

  const search =
    getEl('search');

  if (!search) return;

  search.addEventListener(
    'input',
    () => {
      renderMenu();
    }
  );
}


/* =========================================================
   PAYMENT EVENT LISTENER
========================================================= */

document.addEventListener(
  'change',
  event => {

    if (
      event.target &&
      event.target.name ===
      'fpPayment'
    ) {
      syncFoodpandaPayment();
    }
  }
);


/* =========================================================
   YEAR
========================================================= */

function updateYear() {

  const year =
    getEl('year');

  if (year) {
    year.textContent =
      new Date().getFullYear();
  }
}


/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    renderMenu();

    updateCount();

    renderCart();

    setupCategoryTabs();

    setupSearch();

    updateYear();

  }
);


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.renderMenu =
  renderMenu;

window.addToCart =
  addToCart;

window.addToCartByName =
  addToCartByName;

window.updateCount =
  updateCount;

window.openCart =
  openCart;

window.closeCart =
  closeCart;

window.renderCart =
  renderCart;

window.changeQty =
  changeQty;

window.removeItem =
  removeItem;

window.checkout =
  checkout;

window.closeCheckout =
  closeCheckout;

window.buildPaymentBlock =
  buildPaymentBlock;

window.updatePaymentOptions =
  updatePaymentOptions;

window.useCurrentLocation =
  useCurrentLocation;

window.openLocationMap =
  openLocationMap;

window.resetLocation =
  resetLocation;

window.createOrMoveMarker =
  createOrMoveMarker;

window.setDeliveryLocation =
  setDeliveryLocation;

window.calculateDistance =
  calculateDistance;

window.calculateDelivery =
  calculateDelivery;

window.reverseGeocode =
  reverseGeocode;

window.placeOrder =
  placeOrder;

window.toast =
  toast;


/* =========================================================
   END
========================================================= */
