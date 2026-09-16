/* =========================================================
   CHEF SIFAT'S KITCHEN
   FINAL CORRECTED APP.JS
   Compatible with customer-auth.js
========================================================= */

'use strict';


/* =========================================================
   GLOBAL STATE
========================================================= */

let C = null;
let cart = [];
let cat = 'All';

let map = null;
let marker = null;
let loc = null;


/* =========================================================
   CART LOAD
========================================================= */

try {
  const savedCart =
    JSON.parse(
      localStorage.getItem('cskCart') || '[]'
    );

  cart =
    Array.isArray(savedCart)
      ? savedCart
      : [];

} catch (_) {
  cart = [];
}


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


function getNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}


/* =========================================================
   CUSTOMER AUTH COMPATIBILITY
   customer-auth.js is the source of truth
========================================================= */

function getLoggedCustomerToken() {

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


function getLoggedCustomerData() {

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


function isLoggedCustomer() {
  return !!getLoggedCustomerToken();
}


function openCustomerLogin(mode = 'login') {

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


  alert(
    'Login system is loading. Please refresh the page.'
  );

}


function requireLoggedCustomer() {

  if (isLoggedCustomer()) {
    return true;
  }

  openCustomerLogin('login');

  return false;
}


/* =========================================================
   PRODUCT HELPERS
========================================================= */

function getProduct(id) {

  if (!C || !Array.isArray(C.menu)) {
    return null;
  }

  return C.menu.find(
    product =>
      String(product.id) ===
      String(id)
  ) || null;
}


function getProductSizes(product) {

  if (
    product &&
    Array.isArray(product.sizes) &&
    product.sizes.length
  ) {
    return product.sizes;
  }

  return [];
}


function getSizeData(product, sizeIndex = 0) {

  const sizes =
    getProductSizes(product);

  if (!sizes.length) {

    return {
      index: 0,
      label:
        product?.choice ||
        '',
      price:
        getNumber(product?.price, 0)
    };

  }


  let index =
    Number(sizeIndex);

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= sizes.length
  ) {
    index = 0;
  }


  const size =
    sizes[index];


  if (Array.isArray(size)) {

    return {
      index,
      label:
        String(size[0] ?? ''),
      price:
        getNumber(size[1], 0)
    };

  }


  if (
    size &&
    typeof size === 'object'
  ) {

    return {
      index,
      label:
        String(
          size.label ??
          size.name ??
          ''
        ),
      price:
        getNumber(
          size.price,
          0
        )
    };

  }


  return {
    index,
    label: '',
    price: 0
  };

}


/* =========================================================
   PRE-ORDER RULE
========================================================= */

function itemIsPrebook(product) {

  if (!product) {
    return false;
  }


  const category =
    String(
      product.cat || ''
    )
      .trim()
      .toLowerCase();


  /* Pizza and Momo NEVER pre-book */

  if (
    category === 'pizza' ||
    category === 'momo'
  ) {
    return false;
  }


  /* Admin controls other categories */

  if (
    typeof product.prebook ===
    'boolean'
  ) {

    return product.prebook;

  }


  return false;

}


function cartHasPrebook() {

  if (!C) {
    return false;
  }

  return cart.some(item => {

    const product =
      getProduct(item.id);

    return itemIsPrebook(product);

  });

}


/* =========================================================
   CONFIG + MENU
========================================================= */

async function loadConfigAndMenu() {

  let config = {};


  /* -------------------------------------------------------
     CONFIG
  ------------------------------------------------------- */

  try {

    const response =
      await fetch(
        '/api/config',
        {
          cache: 'no-store'
        }
      );


    if (response.ok) {

      const data =
        await response.json();


      if (
        data &&
        typeof data === 'object'
      ) {

        config = data;

      }

    }

  } catch (error) {

    console.warn(
      'Config request failed:',
      error
    );

  }


  /* -------------------------------------------------------
     MENU
  ------------------------------------------------------- */

  let menu = null;


  if (
    Array.isArray(config.menu)
  ) {

    menu =
      config.menu;

  }


  if (!menu) {

    try {

      const response =
        await fetch(
          '/api/menu',
          {
            cache: 'no-store'
          }
        );


      if (response.ok) {

        const data =
          await response.json();


        if (
          Array.isArray(data)
        ) {

          menu = data;

        } else if (
          Array.isArray(data.menu)
        ) {

          menu = data.menu;

        } else if (
          Array.isArray(data.items)
        ) {

          menu = data.items;

        }

      }

    } catch (error) {

      console.warn(
        'Menu request failed:',
        error
      );

    }

  }


  /* -------------------------------------------------------
     SETTINGS
  ------------------------------------------------------- */

  const rawSettings =
    config.settings &&
    typeof config.settings === 'object'
      ? config.settings
      : {};


  const delivery =
    rawSettings.delivery || {};


  const baseSource =
    rawSettings.base ||
    delivery.base ||
    null;


  const baseLocation =
    baseSource || {

      lat:
        delivery.lat ??
        delivery.baseLat ??
        23.3022494,

      lng:
        delivery.lng ??
        delivery.baseLng ??
        90.9187528,

      name:
        delivery.baseName ||
        delivery.name ||
        'Kahalthuri Hamidia High School'

    };


  const normalizedDelivery = {

    ...delivery,

    lat:
      getNumber(
        baseLocation.lat ??
        delivery.lat ??
        delivery.baseLat,
        23.3022494
      ),

    lng:
      getNumber(
        baseLocation.lng ??
        delivery.lng ??
        delivery.baseLng,
        90.9187528
      ),

    baseName:
      baseLocation.name ||
      delivery.baseName ||
      delivery.name ||
      'Kahalthuri Hamidia High School',

    codRadiusKm:
      getNumber(
        delivery.codRadiusKm,
        1
      ),

    maxRadiusKm:
      getNumber(
        delivery.maxRadiusKm,
        4
      ),

    ratePerKm:
      getNumber(
        delivery.ratePerKm,
        10
      ),

    codCharge:
      getNumber(
        delivery.codCharge,
        0
      )

  };


  const normalizedHours =
    rawSettings.hours || {

      normal: {
        open: 11,
        close: 19
      },

      friday: {
        open: 15,
        close: 21
      }

    };


  const normalizedPrebook =
    rawSettings.prebook || {

      enabled: true

    };


  C = {

    ...config,

    menu:
      Array.isArray(menu)
        ? menu
        : [],

    settings: {

      ...rawSettings,

      delivery:
        normalizedDelivery,

      base:
        normalizedDelivery,

      payment:
        rawSettings.payment || {},

      hours:
        normalizedHours,

      prebook:
        normalizedPrebook

    }

  };


  /* -------------------------------------------------------
     FORCE PIZZA PREBOOK OFF
  ------------------------------------------------------- */

  C.menu =
    C.menu.map(product => {

      const category =
        String(
          product.cat || ''
        )
          .trim()
          .toLowerCase();


      if (
        category === 'pizza' ||
        category === 'momo'
      ) {

        return {
          ...product,
          prebook: false
        };

      }


      return product;

    });


  /* -------------------------------------------------------
     CLEAN CART
  ------------------------------------------------------- */

  cart =
    cart.filter(item => {

      const product =
        getProduct(item.id);

      return !!product;

    });


  localStorage.setItem(
    'cskCart',
    JSON.stringify(cart)
  );

}


/* =========================================================
   INITIALIZE
========================================================= */

(async function init() {

  try {

    await loadConfigAndMenu();

    render();
    cartUI();

    console.log(
      'Chef Sifat Kitchen loaded:',
      {
        menuItems:
          C?.menu?.length || 0
      }
    );


    if (
      !C ||
      !Array.isArray(C.menu) ||
      !C.menu.length
    ) {

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
              Please refresh the page and try again.
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
   MENU RENDER
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
        String(product.cat || '')
          .toLowerCase() ===
        String(cat)
          .toLowerCase();


      const nameOK =
        String(product.name || '')
          .toLowerCase()
          .includes(search);


      return (
        categoryOK &&
        nameOK &&
        product.active !== false
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
    items
      .map(product => {

        const sizes =
          getProductSizes(product);


        const minQty =
          Math.max(
            1,
            getNumber(
              product.minQty,
              1
            )
          );


        const maxQty =
          Math.max(
            minQty,
            getNumber(
              product.maxQty,
              20
            )
          );


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
                          (size, index) => {

                            const data =
                              getSizeData(
                                product,
                                index
                              );


                            return `

                              <option
                                value="${index}"
                              >

                                ${esc(data.label)}

                                —
                                ${money(data.price)}

                              </option>

                            `;

                          }
                        )
                        .join('')}

                    </select>

                  `

                  : `

                    <p class="price">

                      ${money(
                        getNumber(
                          product.price,
                          0
                        )
                      )}

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
                  onclick="add(${JSON.stringify(String(product.id))})"
                >
                  Add
                </button>

              </div>

            </div>

          </article>

        `;

      })
      .join('');

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
    getProduct(id);


  if (!product) {

    alert(
      'Food item not found.'
    );

    return;

  }


  const sizes =
    getProductSizes(product);


  let sizeIndex = 0;


  if (sizes.length) {

    const sizeElement =
      document.getElementById(
        's-' + String(id)
      );


    if (sizeElement) {

      sizeIndex =
        Number(
          sizeElement.value
        );


      if (
        !Number.isInteger(sizeIndex) ||
        sizeIndex < 0 ||
        sizeIndex >= sizes.length
      ) {

        sizeIndex = 0;

      }

    }

  }


  const quantityElement =
    document.getElementById(
      'q-' + String(id)
    );


  const enteredQty =
    Number(
      quantityElement?.value || 1
    );


  const minQty =
    Math.max(
      1,
      getNumber(
        product.minQty,
        1
      )
    );


  const maxQty =
    Math.max(
      minQty,
      getNumber(
        product.maxQty,
        20
      )
    );


  if (
    !Number.isFinite(enteredQty)
  ) {

    alert(
      'Please enter a valid quantity.'
    );

    return;

  }


  const qty =
    Math.max(
      minQty,
      Math.min(
        maxQty,
        Math.floor(enteredQty)
      )
    );


  /*
     If same product + same size already exists,
     increase quantity instead of creating duplicate line.
  */

  const existing =
    cart.find(item =>
      String(item.id) ===
        String(product.id) &&
      Number(item.sizeIndex || 0) ===
        Number(sizeIndex)
    );


  if (existing) {

    existing.qty =
      Math.min(
        maxQty,
        Number(existing.qty || 0) +
        qty
      );

  } else {

    cart.push({

      id:
        product.id,

      sizeIndex:
        sizeIndex,

      qty:
        qty

    });

  }


  save();

  openCart();

}


/* =========================================================
   SAVE CART
========================================================= */

function save() {

  localStorage.setItem(
    'cskCart',
    JSON.stringify(cart)
  );


  cartUI();

}


/* =========================================================
   CART UI
========================================================= */

function cartUI() {

  if (!C) {
    return;
  }


  let subtotal = 0;
  let count = 0;


  cart =
    cart.filter(item =>
      !!getProduct(item.id)
    );


  cart.forEach(item => {

    count +=
      Math.max(
        0,
        Number(item.qty) || 0
      );

  });


  const countBox =
    $('#count');


  if (countBox) {

    countBox.textContent =
      String(count);

  }


  const cartItems =
    $('#cartItems');


  if (cartItems) {

    const lines =
      cart
        .map(
          (item, index) => {

            const product =
              getProduct(item.id);


            if (!product) {
              return '';
            }


            const data =
              getSizeData(
                product,
                Number(
                  item.sizeIndex || 0
                )
              );


            const qty =
              Math.max(
                1,
                Number(item.qty) || 1
              );


            const lineTotal =
              data.price *
              qty;


            subtotal +=
              lineTotal;


            return `

              <div class="cartline">

                <b>
                  ${esc(product.name)}
                </b>

                ${
                  data.label
                    ? `
                      <br>
                      ${esc(data.label)}
                    `
                    : ''
                }

                <br>

                × ${qty}

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
        .join('');


    cartItems.innerHTML =
      lines ||
      '<p>Your cart is empty.</p>';

  }


  const subtotalBox =
    $('#subtotal');


  if (subtotalBox) {

    subtotalBox.textContent =
      money(subtotal);

  }

}


function getSubtotal() {

  if (!C) {
    return 0;
  }


  let subtotal = 0;


  cart.forEach(item => {

    const product =
      getProduct(item.id);


    if (!product) {
      return;
    }


    const data =
      getSizeData(
        product,
        Number(
          item.sizeIndex || 0
        )
      );


    const qty =
      Math.max(
        1,
        Number(item.qty) || 1
      );


    subtotal +=
      data.price * qty;

  });


  return subtotal;

}


function removeCart(index) {

  if (
    index < 0 ||
    index >= cart.length
  ) {
    return;
  }


  cart.splice(
    index,
    1
  );


  save();

}


/* =========================================================
   CART OPEN/CLOSE
========================================================= */

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


  if (!requireLoggedCustomer()) {
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
     MAP
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
      C.settings.base ||
      C.settings.delivery || {

        lat:
          23.3022494,

        lng:
          90.9187528

      };


    const baseLat =
      getNumber(
        baseLocation.lat ??
        baseLocation.baseLat,
        23.3022494
      );


    const baseLng =
      getNumber(
        baseLocation.lng ??
        baseLocation.baseLng,
        90.9187528
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


  base();


  pay();


  sum();


  setTimeout(
    () => {

      map?.invalidateSize();

    },
    250
  );

}


/* =========================================================
   CUSTOMER FIELDS
========================================================= */

function fillCustomerFields() {

  const data =
    getLoggedCustomerData();


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
      data.name ||
      data.fullName ||
      '';

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
   BASE LOCATION
========================================================= */

function getBaseLocation() {

  const source =
    C?.settings?.base ||
    C?.settings?.delivery ||
    {};


  return {

    lat:
      getNumber(
        source.lat ??
        source.baseLat,
        23.3022494
      ),

    lng:
      getNumber(
        source.lng ??
        source.baseLng,
        90.9187528
      )

  };

}


function base() {

  if (
    !map ||
    !marker
  ) {
    return;
  }


  const location =
    getBaseLocation();


  map.setView(
    [
      location.lat,
      location.lng
    ],
    15
  );


  marker.setLatLng(
    [
      location.lat,
      location.lng
    ]
  );


  point(
    location.lat,
    location.lng
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
      'GPS is unavailable. Please drag the map pin.'
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


      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {

        alert(
          'Invalid GPS location.'
        );

        return;

      }


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

    } catch (_) {}


    if (!response.ok) {

      throw new Error(
        result.error ||
        result.message ||
        'Location check failed.'
      );

    }


    loc = {

      ...result,

      allowed:
        Boolean(
          result.allowed ??
          result.available
        ),

      cod:
        Boolean(
          result.cod ??
          result.codAvailable
        ),

      charge:
        getNumber(
          result.charge ??
          result.deliveryCharge,
          0
        ),

      distanceKm:
        getNumber(
          result.distanceKm ??
          result.distance,
          0
        )

    };


    if (loc.allowed) {

      if (status) {

        status.textContent =
          (
            loc.message ||
            'Delivery available.'
          ) +
          ' Distance: ' +
          loc.distanceKm.toFixed(2) +
          ' km • Delivery: ' +
          money(loc.charge);


        status.style.borderColor =
          '#475';

      }

    } else {

      if (status) {

        status.textContent =
          loc.message ||
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
   PREBOOK SETTINGS
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


  /*
     Browser date is used only to determine
     current calendar day.
  */

  const day =
    date.getDay();


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
   ORDER WINDOW
   OPEN + 1 HOUR
   CLOSE - 1 HOUR
========================================================= */

function getOrderWindow(
  date = new Date()
) {

  const hours =
    getShopHours(date);


  const open =
    getNumber(
      hours.open,
      11
    );


  const close =
    getNumber(
      hours.close,
      19
    );


  return {

    start:
      (open + 1) * 60,

    end:
      (close - 1) * 60

  };

}


/* =========================================================
   DATE HELPERS
========================================================= */

function dateKey(
  date
) {

  return (

    date.getFullYear() +
    '-' +
    String(
      date.getMonth() + 1
    ).padStart(2, '0') +
    '-' +
    String(
      date.getDate()
    ).padStart(2, '0')

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
          day: '2-digit',
          month: 'short'
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


/* =========================================================
   12-HOUR TIME
========================================================= */

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
      .padStart(2, '0') +
    ' ' +
    suffix
  );

}


/* =========================================================
   BUILD TIME SLOTS
========================================================= */

function buildTimeSlots(
  date = new Date(),
  removePast = false
) {

  const window =
    getOrderWindow(date);


  const slots = [];


  const now =
    new Date();


  const todayKey =
    dateKey(now);


  const targetKey =
    dateKey(date);


  let minimum =
    window.start;


  if (
    removePast &&
    todayKey === targetKey
  ) {

    const currentMinutes =
      now.getHours() * 60 +
      now.getMinutes();


    /*
       Next 30-minute slot
    */

    minimum =
      Math.ceil(
        currentMinutes / 30
      ) * 30;


    minimum =
      Math.max(
        minimum,
        window.start
      );

  }


  for (
    let minutes = minimum;
    minutes <= window.end;
    minutes += 30
  ) {

    slots.push({
      minutes,
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


  let select =
    input;


  if (
    input.tagName !==
    'SELECT'
  ) {

    select =
      document.createElement(
        'select'
      );


    select.id =
      input.id ||
      'time';


    select.name =
      input.name ||
      'time';


    select.className =
      input.className ||
      '';


    select.required =
      true;


    input.replaceWith(
      select
    );

  }


  /*
     If cart has prebook item,
     normal delivery time is not used.
  */

  if (cartHasPrebook()) {

    select.style.display =
      'none';

    select.required =
      false;

    select.innerHTML =
      '';

    return;

  }


  select.style.display =
    '';


  select.required =
    true;


  buildDeliveryTimeSlots();

}


function buildDeliveryTimeSlots() {

  const select =
    $('#time');


  if (!select) {
    return;
  }


  const current =
    select.value;


  const slots =
    buildTimeSlots(
      new Date(),
      true
    );


  select.innerHTML = `

    <option value="">
      Select delivery time
    </option>

    ${slots
      .map(
        slot => `

          <option
            value="${esc(slot.value)}"
          >

            ${esc(slot.label)}

          </option>

        `
      )
      .join('')}

  `;


  if (
    current &&
    slots.some(
      slot =>
        slot.value ===
        current
    )
  ) {

    select.value =
      current;

  }


  select.disabled =
    slots.length === 0;


  if (!slots.length) {

    select.innerHTML = `

      <option value="">
        No delivery slots available today
      </option>

    `;

  }

}


/* =========================================================
   NORMAL TIME → ISO DATETIME
========================================================= */

function deliveryTimeToISO(
  value
) {

  const match =
    String(value || '')
      .match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
      );


  if (!match) {
    return null;
  }


  let hour =
    Number(match[1]);


  const minute =
    Number(match[2]);


  const period =
    String(match[3])
      .toUpperCase();


  if (
    hour < 1 ||
    hour > 12 ||
    minute < 0 ||
    minute > 59
  ) {

    return null;

  }


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


  const date =
    new Date();


  date.setHours(
    hour,
    minute,
    0,
    0
  );


  return date;

}


/* =========================================================
   PREBOOK SECTION
========================================================= */

function buildPrebookSection() {

  if (!cartHasPrebook()) {
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

          Please remove the pre-order item
          or try again later.

        </small>

      </div>

    `;

  }


  const options = [];


  const today =
    new Date();


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


      <small
        id="prebookHint"
        style="
          display:block;
          margin-top:8px;
          opacity:.8;
        "
      >

        Available:
        Opening +1 hour →
        Closing −1 hour.

      </small>

    </div>

  `;

}


/* =========================================================
   PREBOOK TIMES
========================================================= */

function buildPrebookTimes() {

  const dateSelect =
    $('#prebookDate');


  const timeSelect =
    $('#prebookTime');


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


  const slots =
    buildTimeSlots(
      date,
      false
    );


  timeSelect.innerHTML = `

    <option value="">
      Select time
    </option>

    ${slots
      .map(
        slot => `

          <option
            value="${slot.minutes}"
          >

            ${esc(
              slot.label
            )}

          </option>

        `
      )
      .join('')}

  `;


  timeSelect.disabled =
    slots.length === 0;


  const window =
    getOrderWindow(date);


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
   PREBOOK EVENTS
========================================================= */

function setupPrebookEvents() {

  const dateSelect =
    $('#prebookDate');


  const timeSelect =
    $('#prebookTime');


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
    buildPrebookTimes
  );

}


/* =========================================================
   PREBOOK VALIDATION
========================================================= */

function validatePrebookTime() {

  if (!cartHasPrebook()) {

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


  if (
    !dateSelect ||
    !timeSelect
  ) {

    return {

      ok: false,

      message:
        'Please select a pre-order date and time.'

    };

  }


  const key =
    dateSelect.value;


  const minutes =
    Number(
      timeSelect.value
    );


  if (!key) {

    return {

      ok: false,

      message:
        'Please select a pre-order date.'

    };

  }


  if (
    !timeSelect.value ||
    !Number.isFinite(minutes)
  ) {

    return {

      ok: false,

      message:
        'Please select a pre-order time.'

    };

  }


  const date =
    dateFromKey(key);


  if (!date) {

    return {

      ok: false,

      message:
        'Invalid pre-order date.'

    };

  }


  const window =
    getOrderWindow(date);


  if (
    minutes < window.start ||
    minutes > window.end ||
    minutes % 30 !== 0
  ) {

    return {

      ok: false,

      message:
        'Selected time is outside the allowed pre-order window. Available: ' +
        formatTime(window.start) +
        ' – ' +
        formatTime(window.end) +
        '.'

    };

  }


  date.setHours(
    Math.floor(minutes / 60),
    minutes % 60,
    0,
    0
  );


  if (
    date.getTime() <=
    Date.now()
  ) {

    return {

      ok: false,

      message:
        'Please select a future pre-order time.'

    };

  }


  return {

    ok: true,

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
      payment.bkashNumber ||
      'Not configured',

    nagad:
      payment.nagad ||
      payment.nagadNumber ||
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
    cartHasPrebook();


  if (
    hasPrebook &&
    !isPrebookAllowed()
  ) {

    box.innerHTML = `

      <b>
        Pre-booking is currently unavailable.
      </b>

      <p>
        Please remove the pre-order item
        or try again later.
      </p>

    `;

    return;

  }


  const payment =
    getPaymentNumbers();


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
        !hasPrebook && loc.cod
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
      !hasPrebook
        ? `

          <small
            style="
              display:block;
              margin-top:8px;
            "
          >

            ${
              loc.cod
                ? 'Cash on Delivery is available at this location.'
                : 'COD is unavailable at this location. Please pay online.'
            }

          </small>

        `
        : ''
    }


    ${
      hasPrebook
        ? buildPrebookSection()
        : ''
    }

  `;


  setupPaymentEvents();


  if (hasPrebook) {

    setupPrebookEvents();

  }


  updatePaymentUI();


  /*
     Prebook date/time should appear immediately.
  */

  if (hasPrebook) {

    const dateSelect =
      $('#prebookDate');


    if (dateSelect) {

      dateSelect.value =
        '';


      buildPrebookTimes();

    }

  }

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


/* =========================================================
   PAYMENT UI UPDATE
========================================================= */

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

          Send Money to this number and enter
          your transaction ID or last 5 digits below.

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

          Send Money to this number and enter
          your transaction ID or last 5 digits below.

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
   SUMMARY
========================================================= */

function sum() {

  const subtotal =
    getSubtotal();


  const delivery =
    loc?.allowed
      ? getNumber(
          loc.charge,
          0
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

  const select =
    $('#time');


  const value =
    select?.value?.trim() ||
    '';


  if (!value) {

    return {

      ok: false,

      message:
        'Please select a delivery time.'

    };

  }


  const date =
    deliveryTimeToISO(value);


  if (!date) {

    return {

      ok: false,

      message:
        'Please select a valid delivery time.'

    };

  }


  const window =
    getOrderWindow(
      new Date()
    );


  const requested =
    date.getHours() * 60 +
    date.getMinutes();


  if (
    date.getMinutes() !== 0 &&
    date.getMinutes() !== 30
  ) {

    return {

      ok: false,

      message:
        'Delivery time must be a 30-minute slot.'

    };

  }


  if (
    requested < window.start ||
    requested > window.end
  ) {

    return {

      ok: false,

      message:
        'Selected delivery time is outside the available order window. Available today: ' +
        formatTime(window.start) +
        ' – ' +
        formatTime(window.end) +
        '.'

    };

  }


  if (
    date.getTime() <=
    Date.now()
  ) {

    return {

      ok: false,

      message:
        'Please select a future delivery time.'

    };

  }


  return {

    ok: true,

    value:
      date.toISOString(),

    display:
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
     LOGIN
  ------------------------------------------------------- */

  if (!requireLoggedCustomer()) {
    return;
  }


  const token =
    getLoggedCustomerToken();


  if (!token) {

    alert(
      'Your customer login session has expired. Please login again.'
    );


    openCustomerLogin('login');

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


  /* -------------------------------------------------------
     CUSTOMER
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


  const data =
    getLoggedCustomerData();


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
     PREBOOK
  ------------------------------------------------------- */

  const hasPrebook =
    cartHasPrebook();


  let deliveryTime = '';
  let prebookDateTime = null;


  if (hasPrebook) {

    const validation =
      validatePrebookTime();


    if (!validation.ok) {

      alert(
        validation.message
      );

      return;

    }


    deliveryTime =
      validation.value;


    prebookDateTime =
      validation.value;

  } else {

    const validation =
      validateDeliveryTime();


    if (!validation.ok) {

      alert(
        validation.message
      );

      return;

    }


    deliveryTime =
      validation.value;

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


  /* PREBOOK ONLINE ONLY */

  if (
    hasPrebook &&
    paymentMethod !== 'bKash' &&
    paymentMethod !== 'Nagad'
  ) {

    alert(
      'Pre-order items require bKash or Nagad online payment.'
    );

    paymentSelect?.focus();

    return;

  }


  /* COD ONLY INSIDE COD ZONE */

  if (
    paymentMethod === 'COD' &&
    (
      hasPrebook ||
      !loc.cod
    )
  ) {

    alert(
      'Cash on Delivery is not available for this order.'
    );

    return;

  }


  /* -------------------------------------------------------
     TRANSACTION
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
     ADDRESS
  ------------------------------------------------------- */

  const house =
    $('#house')?.value.trim() ||
    '';


  const road =
    $('#road')?.value.trim() ||
    '';


  const note =
    $('#note')?.value.trim() ||
    '';


  const mapAddress =
    $('#mapAddress')?.value.trim() ||
    $('#address')?.value.trim() ||
    '';


  const addressParts = [];


  if (house) {
    addressParts.push(house);
  }


  if (road) {
    addressParts.push(road);
  }


  if (mapAddress) {
    addressParts.push(mapAddress);
  }


  const finalAddress =
    addressParts.join(', ');


  /* -------------------------------------------------------
     ITEMS
  ------------------------------------------------------- */

  const items =
    cart.map(item => {

      return {

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

      };

    });


  /* -------------------------------------------------------
     ORDER OBJECT
  ------------------------------------------------------- */

  const order = {

    name,

    phone,

    address:
      finalAddress,

    lat,

    lng,

    deliveryTime,

    prebook:
      hasPrebook,

    prebookDateTime,

    note,

    transactionId,

    paymentMethod,

    items

  };


  console.log(
    'Submitting order:',
    order
  );


  /* -------------------------------------------------------
     BUTTON
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
     SEND
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

    } catch (_) {}


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
       ERROR
    ----------------------------------------------------- */

    if (
      !response.ok ||
      result.error
    ) {

      throw new Error(
        result.error ||
        result.message ||
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

          <b>
            Order placed successfully!
          </b>

          <br><br>

          Order ID:

          <b>
            ${esc(
              orderResult.id ||
              orderResult.orderId ||
              'Confirmed'
            )}
          </b>

          <br>

          Total:

          <b>
            ${money(
              orderResult.total ||
              orderResult.grandTotal ||
              0
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
            deliveryTime
              ? `

                <br>

                Delivery:

                <b>

                  ${
                    hasPrebook

                      ? esc(
                          new Date(
                            deliveryTime
                          ).toLocaleString(
                            'en-BD',
                            {
                              dateStyle:
                                'medium',

                              timeStyle:
                                'short'
                            }
                          )
                        )

                      : esc(
                          $('#time')?.value ||
                          ''
                        )
                  }

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
   CATEGORY BUTTONS
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
   CHECKOUT FORM
========================================================= */

document.addEventListener(
  'submit',
  event => {

    const form =
      event.target;


    if (
      form &&
      (
        form.id === 'checkoutForm' ||
        form.id === 'checkout'
      )
    ) {

      event.preventDefault();

      place();

    }

  }
);


/* =========================================================
   ESC KEY
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
   AUTO REFRESH DELIVERY SLOTS
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
        'SELECT' &&
        !cartHasPrebook()
      ) {

        buildDeliveryTimeSlots();

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
   GLOBAL FUNCTIONS
========================================================= */

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
   BACKWARD COMPATIBILITY
========================================================= */

if (
  typeof window.openCustomerAuth !==
  'function'
) {

  window.openCustomerAuth =
    function(mode = 'login') {

      openCustomerLogin(mode);

    };

}


/* =========================================================
   END APP.JS
========================================================= */
