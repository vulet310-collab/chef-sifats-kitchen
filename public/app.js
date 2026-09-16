/* =========================================================
   CHEF SIFAT'S KITCHEN
   FINAL CLEAN APP.JS
========================================================= */

'use strict';


/* =========================================================
   GLOBAL STATE
========================================================= */

let C = null;

let cart = [];

try {
  cart = JSON.parse(
    localStorage.getItem('cskCart') || '[]'
  );

  if (!Array.isArray(cart)) {
    cart = [];
  }
} catch (_) {
  cart = [];
}

let cat = 'All';

let map = null;
let marker = null;
let loc = null;


/* =========================================================
   HELPERS
========================================================= */

const $ = selector =>
  document.querySelector(selector);


const money = value =>
  '৳' +
  (Number(value) || 0).toLocaleString('en-BD');


const esc = value =>
  String(value ?? '').replace(
    /[&<>"']/g,
    char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char])
  );


/* =========================================================
   CUSTOMER AUTH HELPERS
   Compatible with customer-auth.js
========================================================= */

function customerToken() {

  try {

    if (
      typeof window.getCustomerToken ===
      'function'
    ) {
      return (
        window.getCustomerToken() ||
        ''
      );
    }

  } catch (_) {}

  return (
    localStorage.getItem(
      'csk_customer_token'
    ) || ''
  );

}


function customerData() {

  try {

    if (
      typeof window.getCustomerData ===
      'function'
    ) {
      return (
        window.getCustomerData() ||
        null
      );
    }

  } catch (_) {}

  try {

    return JSON.parse(
      localStorage.getItem(
        'csk_customer_data'
      ) || 'null'
    );

  } catch (_) {

    return null;

  }

}


function customerLoggedIn() {

  return !!customerToken();

}


function openCustomerLogin(
  mode = 'login'
) {

  try {

    if (
      typeof window.openAuthModal ===
      'function'
    ) {

      window.openAuthModal(mode);

      return;

    }

  } catch (error) {

    console.error(
      'openAuthModal error:',
      error
    );

  }


  try {

    if (
      typeof window.openCustomerAuth ===
      'function'
    ) {

      window.openCustomerAuth(mode);

      return;

    }

  } catch (error) {

    console.error(
      'openCustomerAuth error:',
      error
    );

  }


  console.error(
    'Customer authentication system is not loaded.'
  );

  alert(
    'Login system is loading. Please refresh the page and try again.'
  );

}


function requireCustomerLogin() {

  if (customerLoggedIn()) {
    return true;
  }

  openCustomerLogin('login');

  return false;

}


/* =========================================================
   LOAD CONFIG + MENU
========================================================= */

(async function init() {

  try {

    let config = null;


    /* -----------------------------------------------------
       LOAD CONFIG
    ----------------------------------------------------- */

    try {

      const response =
        await fetch(
          '/api/config',
          {
            cache: 'no-store'
          }
        );

      if (response.ok) {

        config =
          await response.json();

      }

    } catch (error) {

      console.warn(
        'Config request failed:',
        error
      );

    }


    if (
      !config ||
      typeof config !== 'object'
    ) {

      config = {};

    }


    /* -----------------------------------------------------
       LOAD MENU FROM CONFIG
    ----------------------------------------------------- */

    let menu =
      Array.isArray(config.menu)
        ? config.menu
        : null;


    /* -----------------------------------------------------
       FALLBACK: LOAD /api/menu
    ----------------------------------------------------- */

    if (!menu) {

      try {

        const menuResponse =
          await fetch(
            '/api/menu',
            {
              cache: 'no-store'
            }
          );


        if (menuResponse.ok) {

          const menuData =
            await menuResponse.json();


          if (
            Array.isArray(menuData)
          ) {

            menu = menuData;

          } else if (
            Array.isArray(
              menuData.menu
            )
          ) {

            menu =
              menuData.menu;

          } else if (
            Array.isArray(
              menuData.items
            )
          ) {

            menu =
              menuData.items;

          }

        }

      } catch (error) {

        console.warn(
          'Menu request failed:',
          error
        );

      }

    }


    /* -----------------------------------------------------
       NORMALIZE CONFIG
    ----------------------------------------------------- */

    C = {

      ...config,

      menu:
        Array.isArray(menu)
          ? menu
          : [],

      settings:
        config.settings &&
        typeof config.settings === 'object'
          ? config.settings
          : {}

    };


    /* -----------------------------------------------------
       CLEAN CART
    ----------------------------------------------------- */

    cart =
      cart.filter(item =>
        C.menu.some(product =>
          String(product.id) ===
          String(item.id)
        )
      );


    localStorage.setItem(
      'cskCart',
      JSON.stringify(cart)
    );


    /* -----------------------------------------------------
       RENDER
    ----------------------------------------------------- */

    render();

    cartUI();


    console.log(
      'Chef Sifat Kitchen loaded:',
      {
        menuItems:
          C.menu.length,

        settings:
          C.settings
      }
    );


    /* -----------------------------------------------------
       EMPTY MENU MESSAGE
    ----------------------------------------------------- */

    if (!C.menu.length) {

      const grid =
        $('#grid');

      if (grid) {

        grid.innerHTML = `

          <div
            style="
              grid-column:1/-1;
              padding:30px;
              text-align:center;
            "
          >

            <h3>
              Menu is temporarily unavailable.
            </h3>

            <p>
              Please refresh the page or try again shortly.
            </p>

          </div>

        `;

      }

    }

  } catch (error) {

    console.error(
      'Website initialization error:',
      error
    );


    const grid =
      $('#grid');

    if (grid) {

      grid.innerHTML = `

        <div
          style="
            grid-column:1/-1;
            padding:30px;
            text-align:center;
          "
        >

          <h3>
            Unable to load menu.
          </h3>

          <p>
            Please refresh the page and try again.
          </p>

        </div>

      `;

    }

  }

})();


/* =========================================================
   MENU
========================================================= */

function render() {

  if (!C) {
    return;
  }


  const search =
    (
      $('#search')?.value ||
      ''
    )
      .trim()
      .toLowerCase();


  const items =
    C.menu.filter(product => {

      const categoryOK =
        cat === 'All' ||
        String(product.cat || '') ===
        String(cat);


      const nameOK =
        String(product.name || '')
          .toLowerCase()
          .includes(search);


      return (
        categoryOK &&
        nameOK
      );

    });


  const grid =
    $('#grid');

  if (!grid) {
    return;
  }


  if (!items.length) {

    grid.innerHTML =
      '<p>No food found.</p>';

    return;

  }


  grid.innerHTML =
    items.map(product => {

      const sizes =
        Array.isArray(product.sizes)
          ? product.sizes
          : [];


      const minQty =
        Number(product.minQty) || 1;


      const maxQty =
        Number(product.maxQty) || 20;


      const prebook =
        itemIsPrebook(product);


      return `

        <article class="food">

          <div class="pic">

            ${
              product.image

                ? `

                  <img
                    src="${esc(product.image)}"
                    alt="${esc(product.name)}"
                    loading="lazy"
                    onerror="
                      this.remove();
                      this.parentElement.textContent='Food image';
                    "
                  >

                `

                : 'Food image'
            }

          </div>


          <div class="foodbody">

            <small>

              ${esc(product.cat || '')}

              ${
                prebook
                  ? ' • PRE-BOOK'
                  : ''
              }

            </small>


            <h3>
              ${esc(product.name)}
            </h3>


            ${
              sizes.length

                ? `

                  <select
                    id="s-${esc(product.id)}"
                  >

                    ${sizes
                      .map(
                        (size, index) => `

                          <option value="${index}">

                            ${esc(size[0])}
                            —
                            ${money(size[1])}

                          </option>

                        `
                      )
                      .join('')}

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
                id="q-${esc(product.id)}"
                type="number"
                min="${minQty}"
                max="${maxQty}"
                value="${minQty}"
              >


              <button
                class="btn"
                type="button"
                onclick="add('${esc(product.id)}')"
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
   ITEM PRE-ORDER RULE
========================================================= */

function itemIsPrebook(product) {

  if (!product) {
    return false;
  }


  const category =
    String(product.cat || '')
      .trim()
      .toLowerCase();


  /*
    Pizza = NEVER PRE-ORDER
    Momo  = NEVER PRE-ORDER
  */

  if (
    category === 'pizza' ||
    category === 'momo'
  ) {

    return false;

  }


  /*
    Explicit admin setting
  */

  if (
    typeof product.prebook ===
    'boolean'
  ) {

    return product.prebook;

  }


  /*
    Backward compatibility
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

    alert(
      'Menu is still loading. Please try again.'
    );

    return;

  }


  const product =
    C.menu.find(item =>
      String(item.id) ===
      String(id)
    );


  if (!product) {

    alert(
      'Food item not found.'
    );

    return;

  }


  const sizeIndex =
    Number(
      $('#s-' + id)?.value || 0
    );


  const enteredQty =
    Number(
      $('#q-' + id)?.value || 1
    );


  const minQty =
    Number(product.minQty) || 1;


  const maxQty =
    Number(product.maxQty) || 20;


  const qty =
    Math.max(
      minQty,
      Math.min(
        maxQty,
        enteredQty
      )
    );


  cart.push({

    id:
      product.id,

    sizeIndex:
      sizeIndex,

    qty:
      qty

  });


  save();

  openCart();

}


function save() {

  localStorage.setItem(
    'cskCart',
    JSON.stringify(cart)
  );

  cartUI();

}


function cartUI() {

  if (!C) {
    return;
  }


  let subtotal = 0;

  let count = 0;


  cart =
    cart.filter(item =>
      C.menu.some(product =>
        String(product.id) ===
        String(item.id)
      )
    );


  cart.forEach(item => {

    count +=
      Number(item.qty) || 0;

  });


  if ($('#count')) {

    $('#count').textContent =
      count;

  }


  if ($('#cartItems')) {

    $('#cartItems').innerHTML =

      cart
        .map(
          (item, index) => {

            const product =
              C.menu.find(product =>
                String(product.id) ===
                String(item.id)
              );


            if (!product) {
              return '';
            }


            const sizes =
              Array.isArray(product.sizes)
                ? product.sizes
                : [];


            const size =
              sizes[item.sizeIndex] ||
              sizes[0];


            if (!size) {
              return '';
            }


            const lineTotal =
              Number(size[1]) *
              Number(item.qty);


            subtotal +=
              lineTotal;


            return `

              <div class="cartline">

                <b>
                  ${esc(product.name)}
                </b>

                <br>

                ${esc(size[0])}

                × ${item.qty}

                —
                ${money(lineTotal)}


                <button
                  type="button"
                  onclick="removeCart(${index})"
                >
                  Remove
                </button>

              </div>

            `;

          }
        )
        .join('') ||

      '<p>Your cart is empty.</p>';

  }


  if ($('#subtotal')) {

    $('#subtotal').textContent =
      money(subtotal);

  }

}


function removeCart(index) {

  cart.splice(
    index,
    1
  );

  save();

}


function openCart() {

  $('#cart')?.classList.add(
    'open'
  );

  $('#shade')?.classList.add(
    'open'
  );

}


function closeCart() {

  $('#cart')?.classList.remove(
    'open'
  );

  $('#shade')?.classList.remove(
    'open'
  );

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


  if (!requireCustomerLogin()) {
    return;
  }


  if (!C) {

    alert(
      'Website is still loading. Please try again.'
    );

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


  modal.classList.add(
    'open'
  );


  fillCustomerFields();


  /* -------------------------------------------------------
     CREATE MAP
  ------------------------------------------------------- */

  if (!map) {

    if (
      typeof L ===
      'undefined'
    ) {

      alert(
        'Map service is not loaded. Please refresh the page.'
      );

      return;

    }


    const baseLocation =
      C.settings.base || {

        lat:
          23.3022494,

        lng:
          90.9187528

      };


    const baseLat =
      Number(
        baseLocation.lat
      );


    const baseLng =
      Number(
        baseLocation.lng
      );


    map =
      L.map('map')
        .setView(
          [
            baseLat,
            baseLng
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
          baseLat,
          baseLng
        ],
        {
          draggable:
            true
        }
      ).addTo(map);


    marker.on(
      'dragend',
      () => {

        const position =
          marker.getLatLng();


        point(
          position.lat,
          position.lng
        );

      }
    );

  }


  setupDeliveryTimeUI();


  /*
    Start from restaurant location.
  */

  base();


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
   CUSTOMER FIELD AUTO-FILL
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
      data.phone ||
      data.mobile ||
      '';

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
   RESTAURANT BASE LOCATION
========================================================= */

function base() {

  if (
    !C ||
    !map ||
    !marker
  ) {

    return;

  }


  const baseLocation =
    C.settings.base || {

      lat:
        23.3022494,

      lng:
        90.9187528

    };


  const lat =
    Number(
      baseLocation.lat
    );


  const lng =
    Number(
      baseLocation.lng
    );


  map.setView(
    [
      lat,
      lng
    ],
    15
  );


  marker.setLatLng(
    [
      lat,
      lng
    ]
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

  if (
    !navigator.geolocation
  ) {

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

    position => {

      const lat =
        Number(
          position.coords.latitude
        );


      const lng =
        Number(
          position.coords.longitude
        );


      if (map) {

        map.setView(
          [
            lat,
            lng
          ],
          16
        );

      }


      if (marker) {

        marker.setLatLng(
          [
            lat,
            lng
          ]
        );

      }


      point(
        lat,
        lng
      );

    },


    error => {

      console.error(
        'GPS error:',
        error
      );


      if (status) {

        status.textContent =
          'GPS failed. Please allow location access or drag the pin manually.';

      }


      alert(
        'Could not detect your location. Please allow GPS permission or move the map pin manually.'
      );

    },


    {

      enableHighAccuracy:
        true,

      timeout:
        15000,

      maximumAge:
        0

    }

  );

}


/* =========================================================
   LOCATION CHECK
========================================================= */

async function point(
  lat,
  lng
) {

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


    let result = {};

    try {

      result =
        await response.json();

    } catch (_) {

      result = {};

    }


    if (!response.ok) {

      throw new Error(
        result.error ||
        'Location check failed.'
      );

    }


    loc =
      result;


    if (result.allowed) {

      if (status) {

        status.textContent =
          (
            result.message ||
            'Delivery available.'
          ) +

          ' Distance: ' +

          Number(
            result.distanceKm || 0
          ).toFixed(2) +

          ' km • Delivery: ' +

          money(
            result.charge
          );


        status.style.borderColor =
          '#475';

      }

    } else {

      if (status) {

        status.textContent =
          result.message ||
          'Delivery is unavailable at this location.';


        status.style.borderColor =
          '#a44';

      }

    }


    pay();

    sum();

  } catch (error) {

    console.error(
      'Location check error:',
      error
    );


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
   CHECK IF CART HAS PRE-ORDER ITEM
========================================================= */

function pre() {

  if (!C) {
    return false;
  }


  return cart.some(item => {

    const product =
      C.menu.find(product =>
        String(product.id) ===
        String(item.id)
      );


    return itemIsPrebook(
      product
    );

  });

}


/* =========================================================
   PRE-ORDER SETTINGS
========================================================= */

function getPrebookSettings() {

  const settings =
    C?.settings || {};


  const prebook =
    settings.prebook ||
    settings.preorder ||
    {};


  return {

    enabled:
      prebook.enabled !== false

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

        open:
          15,

        close:
          21

      }
    );

  }


  /*
    Normal days
  */

  return (
    hours.normal || {

      open:
        11,

      close:
        19

    }
  );

}


/* =========================================================
   FINAL ORDER WINDOW
   Opening + 1 hour
   Closing - 1 hour
========================================================= */

function getOrderWindow(
  date
) {

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

function dateKey(
  date
) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );


  return (
    year +
    '-' +
    month +
    '-' +
    day
  );

}


function dateFromKey(
  key
) {

  const parts =
    String(key || '')
      .split('-');


  if (
    parts.length !== 3
  ) {

    return null;

  }


  const year =
    Number(parts[0]);


  const month =
    Number(parts[1]) - 1;


  const day =
    Number(parts[2]);


  const date =
    new Date(
      year,
      month,
      day
    );


  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {

    return null;

  }


  return date;

}


function formatDateLabel(
  date
) {

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


function formatTime(
  minutes
) {

  const total =
    Number(minutes);


  const hour =
    Math.floor(
      total / 60
    );


  const minute =
    total % 60;


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
      .padStart(
        2,
        '0'
      ) +
    ' ' +
    suffix
  );

}


/* =========================================================
   BUILD NORMAL DELIVERY TIME OPTIONS
========================================================= */

function buildTimeOptions(
  date = new Date()
) {

  const orderWindow =
    getOrderWindow(date);


  const slots = [];


  for (
    let minutes =
      orderWindow.start;

    minutes <=
      orderWindow.end;

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


  select.innerHTML = `

    <option value="">
      Select delivery time
    </option>

    ${slots
      .map(slot => `

        <option
          value="${esc(slot.value)}"
        >
          ${esc(slot.label)}
        </option>

      `)
      .join('')}

  `;


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

function getPrebookWindow(
  date
) {

  return getOrderWindow(
    date
  );

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

        <small
          style="
            display:block;
            margin-top:5px;
          "
        >
          Please remove the pre-order item or try again later.
        </small>

      </div>

    `;

  }


  const options = [];


  const today =
    new Date();


  /*
    Next 14 days
  */

  for (
    let i = 1;
    i <= 14;
    i++
  ) {

    const date =
      new Date(today);


    date.setHours(
      0,
      0,
      0,
      0
    );


    date.setDate(
      date.getDate() + i
    );


    options.push(`

      <option
        value="${dateKey(date)}"
      >

        ${esc(
          formatDateLabel(date)
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


  const orderWindow =
    getPrebookWindow(date);


  const slots = [];


  for (
    let minutes =
      orderWindow.start;

    minutes <=
      orderWindow.end;

    minutes += 30
  ) {

    slots.push(`

      <option
        value="${minutes}"
      >

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
    hidden.value = '';
  }


  if (hint) {

    hint.textContent =
      slots.length

        ? (
            'Available: ' +
            formatTime(
              orderWindow.start
            ) +
            ' – ' +
            formatTime(
              orderWindow.end
            ) +
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


  if (
    dateSelect.dataset.bound ===
    '1'
  ) {

    return;

  }


  dateSelect.dataset.bound =
    '1';


  dateSelect.addEventListener(
    'change',
    () => {

      buildPrebookTimes();

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
        !timeSelect.value ||
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

        if (hidden) {
          hidden.value = '';
        }

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
        !isValidPrebookDateTime(
          date
        )
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

function isValidPrebookDateTime(
  date
) {

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


  const minute =
    date.getMinutes();


  if (
    minute !== 0 &&
    minute !== 30
  ) {

    return false;

  }


  const orderWindow =
    getPrebookWindow(
      date
    );


  const requested =
    date.getHours() * 60 +
    date.getMinutes();


  return (
    requested >=
      orderWindow.start &&
    requested <=
      orderWindow.end
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


  if (!key) {

    return {

      ok:
        false,

      message:
        'Please select a pre-order date.'

    };

  }


  if (!timeSelect.value) {

    return {

      ok:
        false,

      message:
        'Please select a pre-order time.'

    };

  }


  const selectedMinutes =
    Number(
      timeSelect.value
    );


  if (
    !Number.isFinite(
      selectedMinutes
    )
  ) {

    return {

      ok:
        false,

      message:
        'Please select a valid pre-order time.'

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
    !isValidPrebookDateTime(
      date
    )
  ) {

    const orderWindow =
      getPrebookWindow(
        date
      );


    return {

      ok:
        false,

      message:
        'Selected time is outside the allowed pre-order window. Available: ' +
        formatTime(
          orderWindow.start
        ) +
        ' – ' +
        formatTime(
          orderWindow.end
        ) +
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


  if (!loc?.allowed) {

    box.innerHTML = `

      <b>
        Select a delivery point inside the service area.
      </b>

    `;

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
        Please remove the pre-order item or try again later.
      </p>

    `;

    return;

  }


  const payment =
    getPaymentNumbers();


  /* -------------------------------------------------------
     PRE-ORDER
     ONLINE PAYMENT ONLY
  ------------------------------------------------------- */

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


    /* -----------------------------------------------------
       NORMAL ORDER
    ----------------------------------------------------- */

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


  if (
    select.dataset.bound ===
    '1'
  ) {

    return;

  }


  select.dataset.bound =
    '1';


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

  let subtotal = 0;


  if (!C) {
    return 0;
  }


  cart.forEach(item => {

    const product =
      C.menu.find(product =>
        String(product.id) ===
        String(item.id)
      );


    if (!product) {
      return;
    }


    const sizes =
      Array.isArray(product.sizes)
        ? product.sizes
        : [];


    const size =
      sizes[item.sizeIndex] ||
      sizes[0];


    if (!size) {
      return;
    }


    subtotal +=
      Number(size[1]) *
      Number(item.qty);

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


  const box =
    $('#sum');


  if (!box) {
    return;
  }


  box.innerHTML = `

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

  const value =
    $('#time')?.value.trim();


  if (!value) {

    return {

      ok:
        false,

      message:
        'Please select a delivery time.'

    };

  }


  const today =
    new Date();


  const orderWindow =
    getOrderWindow(
      today
    );


  const match =
    value.match(
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


  const period =
    String(
      match[3]
    ).toUpperCase();


  if (
    period === 'PM' &&
    hour < 12
  ) {

    hour += 12;

  }


  if (
    period === 'AM' &&
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
      orderWindow.start ||
    requested >
      orderWindow.end
  ) {

    return {

      ok:
        false,

      message:
        'Selected delivery time is outside the available order window. Available today: ' +
        formatTime(
          orderWindow.start
        ) +
        ' – ' +
        formatTime(
          orderWindow.end
        ) +
        '.'

    };

  }


  return {

    ok:
      true,

    value:
      value

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


  /* -------------------------------------------------------
     LOGIN REQUIRED
  ------------------------------------------------------- */

  if (!requireCustomerLogin()) {
    return;
  }


  const token =
    customerToken();


  if (!token) {

    alert(
      'Your customer login session has expired. Please login again.'
    );


    openCustomerLogin(
      'login'
    );


    return;

  }


  /* -------------------------------------------------------
     LOCATION
  ------------------------------------------------------- */

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
    Number(
      position.lat
    );


  const lng =
    Number(
      position.lng
    );


  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {

    alert(
      'Invalid delivery location.'
    );

    return;

  }


  /* -------------------------------------------------------
     CUSTOMER INFORMATION
  ------------------------------------------------------- */

  const name =
    $('#name')?.value.trim() ||
    '';


  const phone =
    $('#phone')?.value.trim() ||
    '';


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


  /* -------------------------------------------------------
     PHONE MUST MATCH ACCOUNT
  ------------------------------------------------------- */

  const data =
    customerData();


  const accountPhone =
    data?.phone ||
    data?.mobile ||
    '';


  if (
    accountPhone &&
    String(accountPhone).trim() !==
      String(phone).trim()
  ) {

    alert(
      'The phone number must match your logged-in customer account.'
    );

    $('#phone')?.focus();

    return;

  }


  /* -------------------------------------------------------
     PRE-ORDER
  ------------------------------------------------------- */

  const hasPrebook =
    pre();


  const prebookValidation =
    validatePrebookTime();


  if (
    !prebookValidation.ok
  ) {

    alert(
      prebookValidation.message
    );

    return;

  }


  /* -------------------------------------------------------
     PAYMENT
  ------------------------------------------------------- */

  const paymentSelect =
    $('#paymentMethod');


  const paymentMethod =
    paymentSelect?.value ||
    '';


  if (!paymentMethod) {

    alert(
      'Please select a payment method.'
    );

    paymentSelect?.focus();

    return;

  }


  /* -------------------------------------------------------
     PRE-ORDER = ONLINE ONLY
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     COD ONLY INSIDE COD ZONE
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     TRANSACTION ID
  ------------------------------------------------------- */

  const online =
    paymentMethod === 'bKash' ||
    paymentMethod === 'Nagad';


  const tx =
    $('#tx')?.value.trim() ||
    '';


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


  /* -------------------------------------------------------
     DELIVERY TIME
  ------------------------------------------------------- */

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


    if (
      !deliveryValidation.ok
    ) {

      alert(
        deliveryValidation.message
      );

      return;

    }


    deliveryTime =
      deliveryValidation.value;

  }


  /* -------------------------------------------------------
     ADDRESS
  ------------------------------------------------------- */

  const house =
    $('#house')?.value.trim() ||
    '';


  const road =
    $('#road')?.value.trim() ||
    '';


  const address =
    [
      house,
      road
    ]
      .filter(Boolean)
      .join(', ');


  const note =
    $('#note')?.value.trim() ||
    '';


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
        address &&
        mapAddress
          ? ', '
          : ''
      );


  /* -------------------------------------------------------
     ORDER OBJECT
  ------------------------------------------------------- */

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
      cart.map(item => ({

        id:
          item.id,

        sizeIndex:
          Number(
            item.sizeIndex || 0
          ),

        qty:
          Number(
            item.qty || 1
          )

      }))

  };


  /* -------------------------------------------------------
     PLACE ORDER BUTTON
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     SEND ORDER TO BACKEND
  ------------------------------------------------------- */

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


    /* -----------------------------------------------------
       SESSION EXPIRED
    ----------------------------------------------------- */

    if (
      response.status === 401 ||
      response.status === 403
    ) {

      try {

        if (
          typeof window.clearCustomerSession ===
          'function'
        ) {

          window.clearCustomerSession();

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


      openCustomerLogin(
        'login'
      );


      return;

    }


    /* -----------------------------------------------------
       BACKEND ERROR
    ----------------------------------------------------- */

    if (
      !response.ok ||
      result.error
    ) {

      throw new Error(
        result.error ||
        'Unable to place order.'
      );

    }


    /* -----------------------------------------------------
       SUCCESS
    ----------------------------------------------------- */

    const orderResult =
      result.order || {};


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

          Order placed successfully!

          <br>

          Order ID:

          <b>
            ${esc(
              orderResult.id ||
              'Confirmed'
            )}
          </b>


          <br>

          Total:

          <b>
            ${money(
              orderResult.total
            )}
          </b>


          <br>

          Payment:

          <b>
            ${esc(
              orderResult.paymentMethod ||
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


    /* -----------------------------------------------------
       CLEAR CART
    ----------------------------------------------------- */

    cart = [];


    save();


    button.disabled =
      true;


    button.textContent =
      'Order Placed';


  } catch (error) {

    console.error(
      'Place order error:',
      error
    );


    alert(
      error.message ||
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

async function placeOrder(
  event
) {

  if (event) {

    event.preventDefault();

  }

  return place();

}


function gpsLocation() {

  return gps();

}


/* =========================================================
   SEARCH
========================================================= */

document.addEventListener(
  'input',
  event => {

    if (
      event.target &&
      event.target.id ===
      'search'
    ) {

      render();

    }

  }
);


/* =========================================================
   CATEGORY BUTTON SUPPORT
========================================================= */

document.addEventListener(
  'click',
  event => {

    const button =
      event.target.closest(
        '[data-cat]'
      );


    if (!button) {
      return;
    }


    cat =
      button.dataset.cat ||
      'All';


    render();

  }
);


/* =========================================================
   CHECKOUT FORM SAFETY
========================================================= */

document.addEventListener(
  'submit',
  event => {

    const form =
      event.target;


    if (
      form &&
      (
        form.id ===
          'checkoutForm' ||

        form.id ===
          'checkout'
      )
    ) {

      event.preventDefault();

      place(event);

    }

  }
);


/* =========================================================
   KEYBOARD SUPPORT
========================================================= */

document.addEventListener(
  'keydown',
  event => {

    if (
      event.key !==
      'Escape'
    ) {

      return;

    }


    try {

      closeCart();

    } catch (_) {}


    try {

      closeCheckout();

    } catch (_) {}


    try {

      if (
        typeof window.closeAuthModal ===
        'function'
      ) {

        window.closeAuthModal();

      }

    } catch (_) {}

  }
);


/* =========================================================
   AUTO UPDATE DELIVERY SLOTS
========================================================= */

setInterval(
  () => {

    try {

      if (
        !$('#modal')?.classList.contains(
          'open'
        )
      ) {

        return;

      }


      const time =
        $('#time');


      if (
        time &&
        time.tagName ===
        'SELECT'
      ) {

        const current =
          time.value;


        buildDeliveryTimeSlots();


        if (
          current &&
          [...time.options].some(
            option =>
              option.value ===
              current
          )
        ) {

          time.value =
            current;

        }

      }

    } catch (error) {

      console.error(
        'Delivery slot refresh error:',
        error
      );

    }

  },
  60000
);


/* =========================================================
   CUSTOMER AUTH COMPATIBILITY
========================================================= */

if (
  typeof window.openCustomerAuth !==
  'function'
) {

  window.openCustomerAuth =
    function (
      mode = 'login'
    ) {

      if (
        typeof window.openAuthModal ===
        'function'
      ) {

        window.openAuthModal(
          mode
        );

        return;

      }


      console.error(
        'Customer authentication system is not loaded.'
      );


      alert(
        'Login system is loading. Please refresh the page and try again.'
      );

    };

}


/* =========================================================
   GLOBAL FUNCTIONS
   Required by index.html onclick=""
========================================================= */

window.customerToken =
  customerToken;


window.customerData =
  customerData;


window.customerLoggedIn =
  customerLoggedIn;


window.requireCustomerLogin =
  requireCustomerLogin;


window.openCustomerLogin =
  openCustomerLogin;


window.checkout =
  checkout;


window.openCart =
  openCart;


window.closeCart =
  closeCart;


window.closeCheckout =
  closeCheckout;


window.place =
  place;


window.placeOrder =
  placeOrder;


window.gps =
  gps;


window.gpsLocation =
  gpsLocation;


window.base =
  base;


window.add =
  add;


window.removeCart =
  removeCart;


window.render =
  render;


window.cartUI =
  cartUI;


/* =========================================================
   END OF APP.JS
========================================================= */
