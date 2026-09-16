'use strict';



/* =========================================================
   SETTINGS
========================================================= */

const SETTINGS = {

  baseLat: 23.3022494,

  baseLng: 90.9187528,

  baseName:
    'Kahalthuri Hamidia High School',

  codRadiusKm: 1,

  maxRadiusKm: 4,

  deliveryRatePerKm: 10,

  codCharge: 0

};



/* =========================================================
   APP STATE
========================================================= */

let menuData = [];

let cartData = [];

let currentCategory = 'All';

let map = null;

let marker = null;

let selectedLocation = null;

let deliveryInfo = null;

let configData = null;



try {

  cartData =
    JSON.parse(
      localStorage.getItem(
        'chefSifatCart5'
      ) || '[]'
    );

  if (!Array.isArray(cartData)) {
    cartData = [];
  }

} catch {

  cartData = [];

}



/* =========================================================
   HELPERS
========================================================= */

function money(value) {

  return '৳' +
    Number(value || 0)
      .toLocaleString('en-BD', {
        maximumFractionDigits: 0
      });

}



function esc(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}



function saveCart() {

  localStorage.setItem(
    'chefSifatCart5',
    JSON.stringify(cartData)
  );

  updateCartCount();

}



function getToken() {

  if (
    typeof window.getCustomerToken ===
    'function'
  ) {

    return window.getCustomerToken() || '';

  }

  return '';

}



function getCustomer() {

  if (
    typeof window.getCustomerData ===
    'function'
  ) {

    return window.getCustomerData() || null;

  }

  return null;

}



function loggedIn() {

  if (
    typeof window.isCustomerLoggedIn ===
    'function'
  ) {

    return !!window.isCustomerLoggedIn();

  }

  return !!getToken();

}



function requireLogin() {

  if (loggedIn()) {
    return true;
  }


  if (
    typeof window.openAuthModal ===
    'function'
  ) {

    window.openAuthModal('login');

  } else {

    alert(
      'Please login before ordering.'
    );

  }


  return false;

}



/* =========================================================
   MOBILE NAV
========================================================= */

function toggleMobileMenu() {

  const nav =
    document.getElementById(
      'mainNav'
    );

  const button =
    document.getElementById(
      'mobileMenuBtn'
    );


  if (!nav) return;


  nav.classList.toggle(
    'mobile-open'
  );


  if (button) {

    button.setAttribute(
      'aria-expanded',
      nav.classList.contains(
        'mobile-open'
      )
    );

  }

}



document.addEventListener(
  'click',
  function (event) {

    const nav =
      document.getElementById(
        'mainNav'
      );

    const button =
      document.getElementById(
        'mobileMenuBtn'
      );


    if (
      !nav ||
      !button
    ) return;


    if (
      nav.contains(event.target) ||
      button.contains(event.target)
    ) return;


    nav.classList.remove(
      'mobile-open'
    );

  }
);



/* =========================================================
   CATEGORY
========================================================= */

function setCategory(category) {

  currentCategory =
    category || 'All';


  document
    .querySelectorAll(
      '#categoryButtons button'
    )
    .forEach(function (button) {

      button.classList.toggle(
        'active',
        button.textContent
          .trim()
          .toLowerCase() ===
        currentCategory
          .toLowerCase()
      );

    });


  render();

}



/* =========================================================
   MENU
========================================================= */

async function loadMenu() {

  const loading =
    document.getElementById(
      'menuLoading'
    );


  if (loading) {
    loading.style.display =
      'block';
  }


  try {

    let response =
      await fetch('/api/menu');


    if (!response.ok) {

      response =
        await fetch('/api/config');

    }


    const data =
      await response.json();


    let items =
      data.menu ||
      data.items ||
      [];


    if (!items.length) {

      if (Array.isArray(data)) {
        items = data;
      }

    }


    menuData =
      Array.isArray(items)
        ? items.filter(
            item =>
              item.active !== false
          )
        : [];


    render();


  } catch (error) {

    console.error(
      'Menu loading error:',
      error
    );


    menuData = [];

    render();

  } finally {

    if (loading) {
      loading.style.display =
        'none';
    }

  }

}



function normalizeSizes(product) {

  if (
    !Array.isArray(
      product.sizes
    )
  ) {

    return [];

  }


  return product.sizes
    .map(function (size) {

      if (Array.isArray(size)) {

        return {
          label:
            String(
              size[0] ?? ''
            ),

          price:
            Number(
              size[1]
            ) || 0
        };

      }


      return {

        label:
          String(
            size?.label ??
            size?.name ??
            ''
          ),

        price:
          Number(
            size?.price
          ) || 0

      };

    })
    .filter(
      size =>
        size.price >= 0
    );

}



function getPricing(product, cartItem) {

  const sizes =
    normalizeSizes(product);


  if (sizes.length) {

    let index =
      Number(
        cartItem?.sizeIndex
      );


    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= sizes.length
    ) {

      index = 0;

    }


    return {

      sizeIndex: index,

      label:
        sizes[index].label,

      price:
        sizes[index].price

    };

  }


  return {

    sizeIndex: null,

    label:
      product.choice ||
      product.unit ||
      '',

    price:
      Number(
        product.price
      ) || 0

  };

}



function findProduct(id) {

  return menuData.find(
    product =>
      String(product.id) ===
      String(id)
  );

}



/* =========================================================
   PRE-ORDER
========================================================= */

function itemIsPrebook(product) {

  if (!product) {
    return false;
  }


  const category =
    String(
      product.cat || ''
    ).toLowerCase();


  /* Pizza and Momo NEVER prebook */

  if (
    category === 'pizza' ||
    category === 'momo'
  ) {

    return false;

  }


  return product.prebook === true;

}



function cartHasPrebook() {

  return cartData.some(
    function (item) {

      const product =
        findProduct(
          item.productId ||
          item.id
        );


      return itemIsPrebook(
        product
      );

    }
  );

}



/* =========================================================
   MENU RENDER
========================================================= */

function render() {

  const grid =
    document.getElementById(
      'grid'
    );

  const empty =
    document.getElementById(
      'menuEmpty'
    );


  if (!grid) return;


  const search =
    (
      document.getElementById(
        'search'
      )?.value ||
      ''
    )
      .trim()
      .toLowerCase();


  const filtered =
    menuData.filter(
      function (product) {

        const categoryMatch =
          currentCategory ===
          'All' ||
          String(
            product.cat || ''
          ).toLowerCase() ===
          currentCategory
            .toLowerCase();


        const text =
          (
            product.name ||
            ''
          ).toLowerCase();


        const searchMatch =
          !search ||
          text.includes(search);


        return (
          categoryMatch &&
          searchMatch
        );

      }
    );


  grid.innerHTML = '';


  if (!filtered.length) {

    if (empty) {
      empty.style.display =
        'block';
    }

    return;

  }


  if (empty) {
    empty.style.display =
      'none';
  }


  filtered.forEach(
    function (product) {

      const sizes =
        normalizeSizes(
          product
        );


      const image =
        product.image ||
        '/assets/food.jpg';


      let sizeHTML = '';


      if (sizes.length) {

        sizeHTML = `

          <select
            class="product-size"
            data-product-id="${esc(
              product.id
            )}"
          >

            ${sizes.map(
              function (size, index) {

                return `

                  <option value="${index}">

                    ${esc(
                      size.label
                    )}
                    — ${money(
                      size.price
                    )}

                  </option>

                `;

              }
            ).join('')}

          </select>

        `;

      } else {

        sizeHTML = `

          <strong>
            ${money(
              product.price
            )}
          </strong>

        `;

      }


      const prebook =
        itemIsPrebook(
          product
        );


      const card =
        document.createElement(
          'article'
        );


      card.className =
        'food-card';


      card.innerHTML = `

        <img
          src="${esc(image)}"
          alt="${esc(
            product.name
          )}"
          loading="lazy"
          onerror="
            this.src='/assets/food.jpg'
          "
        >


        <div class="food-card-body">

          <small>
            ${esc(
              product.cat || ''
            )}
          </small>


          <h3>
            ${esc(
              product.name
            )}
          </h3>


          <p>
            ${esc(
              product.description ||
              ''
            )}
          </p>


          ${
            prebook
              ? `
                <span>
                  📅 Pre-order available
                </span>
              `
              : ''
          }


          <div class="product-bottom">

            ${sizeHTML}


            <button
              type="button"
              class="btn"
              onclick="add('${esc(
                product.id
              )}')"
            >
              🛒 Add
            </button>

          </div>

        </div>

      `;


      grid.appendChild(
        card
      );

    }
  );

}



/* =========================================================
   ADD TO CART
========================================================= */

function add(productId) {

  const product =
    findProduct(
      productId
    );


  if (!product) {

    alert(
      'This item is unavailable.'
    );

    return;

  }


  const sizes =
    normalizeSizes(
      product
    );


  let sizeIndex =
    null;


  if (sizes.length) {

    const select =
      document.querySelector(
        `.product-size[data-product-id="${CSS.escape(
          String(productId)
        )}"]`
      );


    sizeIndex =
      Number(
        select?.value || 0
      );

  }


  const existing =
    cartData.find(
      function (item) {

        return (
          String(
            item.productId
          ) ===
          String(
            productId
          ) &&
          Number(
            item.sizeIndex
          ) ===
          Number(
            sizeIndex
          )

        );

      }
    );


  if (existing) {

    existing.qty =
      Number(
        existing.qty || 0
      ) + 1;

  } else {

    cartData.push({

      productId:
        product.id,

      qty: 1,

      sizeIndex:

        sizeIndex

    });

  }


  saveCart();

  cartUI();

  openCart();

}



/* =========================================================
   CART
========================================================= */

function updateCartCount() {

  const count =
    document.getElementById(
      'count'
    );


  if (!count) return;


  count.textContent =
    cartData.reduce(
      function (sum, item) {

        return (
          sum +
          Number(
            item.qty || 0
          )
        );

      },
      0
    );

}



function getCartItemsDetailed() {

  return cartData
    .map(function (item) {

      const product =
        findProduct(
          item.productId
        );


      if (!product) {
        return null;
      }


      const pricing =
        getPricing(
          product,
          item
        );


      return {

        item,

        product,

        pricing

      };

    })
    .filter(Boolean);

}



function getSubtotal() {

  return getCartItemsDetailed()
    .reduce(
      function (
        total,
        row
      ) {

        return (
          total +
          row.pricing.price *
          Number(
            row.item.qty || 0
          )
        );

      },
      0
    );

}



function cartUI() {

  const box =
    document.getElementById(
      'cartItems'
    );


  const subtotal =
    document.getElementById(
      'subtotal'
    );


  if (!box) return;


  const rows =
    getCartItemsDetailed();


  box.innerHTML = '';


  if (!rows.length) {

    box.innerHTML =
      '<p>Your cart is empty.</p>';

  }


  rows.forEach(
    function (row) {

      const qty =
        Number(
          row.item.qty || 1
        );


      const total =
        row.pricing.price *
        qty;


      const div =
        document.createElement(
          'div'
        );


      div.className =
        'cart-row';


      div.innerHTML = `

        <strong>
          ${esc(
            row.product.name
          )}
        </strong>


        ${
          row.pricing.label
            ? `<small>
                ${esc(
                  row.pricing.label
                )}
              </small>`
            : ''
        }


        <span>
          ${money(
            row.pricing.price
          )}
          × ${qty}
          =
          ${money(total)}
        </span>


        <div>

          <button
            type="button"
            onclick="changeQty(
              '${esc(
                row.product.id
              )}',
              ${row.pricing.sizeIndex},
              -1
            )"
          >
            −
          </button>


          <button
            type="button"
            onclick="changeQty(
              '${esc(
                row.product.id
              )}',
              ${row.pricing.sizeIndex},
              1
            )"
          >
            +
          </button>


          <button
            type="button"
            onclick="removeCartItem(
              '${esc(
                row.product.id
              )}',
              ${row.pricing.sizeIndex}
            )"
          >
            Remove
          </button>

        </div>

      `;


      box.appendChild(
        div
      );

    }
  );


  if (subtotal) {

    subtotal.textContent =
      money(
        getSubtotal()
      );

  }


  updateCartCount();

}



function changeQty(
  productId,
  sizeIndex,
  amount
) {

  const item =
    cartData.find(
      function (row) {

        return (
          String(
            row.productId
          ) ===
          String(productId) &&
          Number(
            row.sizeIndex
          ) ===
          Number(sizeIndex)
        );

      }
    );


  if (!item) return;


  item.qty =
    Number(
      item.qty || 0
    ) + amount;


  if (item.qty <= 0) {

    cartData =
      cartData.filter(
        row =>
          !(
            String(
              row.productId
            ) ===
            String(productId) &&
            Number(
              row.sizeIndex
            ) ===
            Number(sizeIndex)
          )
      );

  }


  saveCart();

  cartUI();

}



function removeCartItem(
  productId,
  sizeIndex
) {

  cartData =
    cartData.filter(
      function (item) {

        return !(
          String(
            item.productId
          ) ===
          String(productId) &&
          Number(
            item.sizeIndex
          ) ===
          Number(sizeIndex)
        );

      }
    );


  saveCart();

  cartUI();

}



function openCart() {

  const cart =
    document.getElementById(
      'cart'
    );

  const shade =
    document.getElementById(
      'shade'
    );


  cartUI();


  if (cart) {
    cart.classList.add(
      'open'
    );
  }


  if (shade) {
    shade.classList.add(
      'open'
    );
  }

}



function closeCart() {

  const cart =
    document.getElementById(
      'cart'
    );

  const shade =
    document.getElementById(
      'shade'
    );


  if (cart) {
    cart.classList.remove(
      'open'
    );
  }


  if (shade) {
    shade.classList.remove(
      'open'
    );
  }

}



/* =========================================================
   CONFIG
========================================================= */

async function loadConfig() {

  try {

    const response =
      await fetch(
        '/api/config'
      );


    const data =
      await response.json();


    configData =
      data || {};


    if (data.delivery) {

      Object.assign(
        SETTINGS,
        {

          baseLat:
            Number(
              data.delivery.baseLat ??
              data.delivery.latitude ??
              SETTINGS.baseLat
            ),

          baseLng:
            Number(
              data.delivery.baseLng ??
              data.delivery.longitude ??
              SETTINGS.baseLng
            ),

          codRadiusKm:
            Number(
              data.delivery.codRadiusKm ??
              data.delivery.codRadius ??
              SETTINGS.codRadiusKm
            ),

          maxRadiusKm:
            Number(
              data.delivery.maxRadiusKm ??
              data.delivery.maxRadius ??
              SETTINGS.maxRadiusKm
            ),

          deliveryRatePerKm:
            Number(
              data.delivery.ratePerKm ??
              SETTINGS.deliveryRatePerKm
            )

        }
      );

    }


  } catch (error) {

    console.error(
      'Config error:',
      error
    );

  }

}



/* =========================================================
   DISTANCE
========================================================= */

function haversine(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const R =
    6371;


  const dLat =
    (
      lat2 - lat1
    ) *
    Math.PI / 180;


  const dLon =
    (
      lon2 - lon1
    ) *
    Math.PI / 180;


  const a =
    Math.sin(
      dLat / 2
    ) ** 2 +

    Math.cos(
      lat1 *
      Math.PI / 180
    ) *

    Math.cos(
      lat2 *
      Math.PI / 180
    ) *

    Math.sin(
      dLon / 2
    ) ** 2;


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
   MAP
========================================================= */

function initMap() {

  const mapBox =
    document.getElementById(
      'map'
    );


  if (!mapBox) return;


  if (map) {

    setTimeout(
      () =>
        map.invalidateSize(),
      100
    );

    return;

  }


  map =
    L.map(
      mapBox
    ).setView(
      [
        SETTINGS.baseLat,
        SETTINGS.baseLng
      ],
      14
    );


  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution:
        '&copy; OpenStreetMap'
    }
  ).addTo(map);


  marker =
    L.marker(
      [
        SETTINGS.baseLat,
        SETTINGS.baseLng
      ],
      {
        draggable: true
      }
    ).addTo(map);


  marker.on(
    'dragend',
    function () {

      const position =
        marker.getLatLng();


      setLocation(
        position.lat,
        position.lng
      );

    }
  );


  setTimeout(
    () =>
      map.invalidateSize(),
    200
  );

}



function setLocation(
  lat,
  lng
) {

  selectedLocation = {

    lat:
      Number(lat),

    lng:
      Number(lng)

  };


  if (marker) {

    marker.setLatLng(
      [
        lat,
        lng
      ]
    );

  }


  if (map) {

    map.panTo(
      [
        lat,
        lng
      ]
    );

  }


  checkLocation();

}



function base() {

  initMap();


  setTimeout(
    function () {

      setLocation(
        SETTINGS.baseLat,
        SETTINGS.baseLng
      );

    },
    100
  );

}



function gps() {

  if (
    !navigator.geolocation
  ) {

    alert(
      'GPS is not supported by this browser.'
    );

    return;

  }


  const status =
    document.getElementById(
      'status'
    );


  if (status) {

    status.textContent =
      '📍 Detecting your location...';

  }


  navigator.geolocation.getCurrentPosition(

    function (position) {

      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;


      initMap();


      setTimeout(
        function () {

          if (map) {

            map.setView(
              [
                lat,
                lng
              ],
              16
            );

          }


          setLocation(
            lat,
            lng
          );

        },
        100
      );

    },

    function (error) {

      console.error(
        error
      );


      if (status) {

        status.textContent =
          'GPS permission denied or unavailable.';

      }

      alert(
        'Please allow location permission and try again.'
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

async function checkLocation() {

  if (!selectedLocation) {
    return;
  }


  const lat =
    selectedLocation.lat;

  const lng =
    selectedLocation.lng;


  try {

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


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        'Location unavailable.'
      );

    }


    const distance =
      Number(
        data.distance ??
        haversine(
          SETTINGS.baseLat,
          SETTINGS.baseLng,
          lat,
          lng
        )
      );


    const available =
      data.available ??
      data.allowed ??
      (
        distance <=
        SETTINGS.maxRadiusKm
      );


    const cod =
      data.codAvailable ??
      data.cod ??
      (
        distance <=
        SETTINGS.codRadiusKm
      );


    const charge =
      Number(
        data.deliveryCharge ??
        data.charge ??
        (
          distance <=
          SETTINGS.codRadiusKm
            ? 0
            : Math.ceil(
                distance
              ) *
              SETTINGS.deliveryRatePerKm
        )
      );


    deliveryInfo = {

      available,

      cod,

      distance,

      charge,

      paymentRequired:
        !cod

    };


    const status =
      document.getElementById(
        'status'
      );


    if (!available) {

      if (status) {

        status.innerHTML = `
          ❌ Delivery unavailable.
          <br>
          Distance:
          <strong>
            ${distance.toFixed(2)} km
          </strong>
          <br>
          Maximum delivery distance is
          ${SETTINGS.maxRadiusKm} km.
        `;

      }


    } else if (cod) {

      if (status) {

        status.innerHTML = `
          ✅ Delivery available
          <br>
          Distance:
          <strong>
            ${distance.toFixed(2)} km
          </strong>
          <br>
          💵 COD Available
          <br>
          🚚 Delivery Charge:
          <strong>৳0</strong>
        `;

      }


    } else {

      if (status) {

        status.innerHTML = `
          ✅ Delivery available
          <br>
          Distance:
          <strong>
            ${distance.toFixed(2)} km
          </strong>
          <br>
          💳 Online Payment Required
          <br>
          🚚 Delivery Charge:
          <strong>
            ${money(charge)}
          </strong>
        `;

      }

    }


    buildPayment();

    buildSummary();


  } catch (error) {

    console.error(
      error
    );


    const distance =
      haversine(
        SETTINGS.baseLat,
        SETTINGS.baseLng,
        lat,
        lng
      );


    const available =
      distance <=
      SETTINGS.maxRadiusKm;


    const cod =
      distance <=
      SETTINGS.codRadiusKm;


    const charge =
      cod
        ? 0
        : Math.ceil(
            distance
          ) *
          SETTINGS.deliveryRatePerKm;


    deliveryInfo = {

      available,

      cod,

      distance,

      charge,

      paymentRequired:
        !cod

    };


    buildPayment();

    buildSummary();

  }

}



/* =========================================================
   SHOP TIME
========================================================= */

function getShopHours(
  date
) {

  const day =
    date.getDay();


  if (day === 5) {

    return {

      open: 15,

      close: 21

    };

  }


  return {

    open: 11,

    close: 19

  };

}



function getOrderWindow(
  date
) {

  const hours =
    getShopHours(
      date
    );


  return {

    start:
      hours.open * 60 + 60,

    end:
      hours.close * 60 - 60

  };

}



function formatTime(
  totalMinutes
) {

  let hour =
    Math.floor(
      totalMinutes / 60
    );


  const minute =
    totalMinutes % 60;


  const suffix =
    hour >= 12
      ? 'PM'
      : 'AM';


  hour =
    hour % 12;


  if (hour === 0) {
    hour = 12;
  }


  return (
    hour +
    ':' +
    String(
      minute
    ).padStart(
      2,
      '0'
    ) +
    ' ' +
    suffix
  );

}



function sameDate(
  a,
  b
) {

  return (
    a.getFullYear() ===
      b.getFullYear() &&

    a.getMonth() ===
      b.getMonth() &&

    a.getDate() ===
      b.getDate()
  );

}



function buildTimeOptions(
  date
) {

  const now =
    new Date();


  const window =
    getOrderWindow(
      date
    );


  const options = [];


  for (
    let minutes =
      window.start;

    minutes <=
      window.end;

    minutes += 30
  ) {

    const slot =
      new Date(
        date
      );


    slot.setHours(
      Math.floor(
        minutes / 60
      ),
      minutes % 60,
      0,
      0
    );


    if (
      sameDate(
        date,
        now
      ) &&
      slot.getTime() <=
      now.getTime()
    ) {

      continue;

    }


    options.push({

      value:
        slot.toISOString(),

      label:
        formatTime(
          minutes
        )

    });

  }


  return options;

}



/* =========================================================
   DELIVERY TIME UI
========================================================= */

function setupDeliveryTimeUI() {

  const select =
    document.getElementById(
      'time'
    );


  if (!select) return;


  select.innerHTML = `

    <option value="">
      Select delivery time
    </option>

  `;


  const now =
    new Date();


  const options =
    buildTimeOptions(
      now
    );


  options.forEach(
    function (option) {

      const el =
        document.createElement(
          'option'
        );


      el.value =
        option.value;

      el.textContent =
        option.label;


      select.appendChild(
        el
      );

    }
  );


  if (!options.length) {

    select.innerHTML = `

      <option value="">
        No delivery slots available today
      </option>

    `;

  }


  select.onchange =
    buildSummary;

}



/* =========================================================
   PREBOOK
========================================================= */

function buildPrebookUI() {

  const box =
    document.getElementById(
      'prebookBox'
    );


  const timeBox =
    document.getElementById(
      'timeBox'
    );


  if (!box) return;


  if (!cartHasPrebook()) {

    box.style.display =
      'none';

    if (timeBox) {
      timeBox.style.display =
        'block';
    }

    return;

  }


  if (timeBox) {

    timeBox.style.display =
      'none';

  }


  box.style.display =
    'block';


  const tomorrow =
    new Date();


  tomorrow.setDate(
    tomorrow.getDate() + 1
  );


  const minDate =
    tomorrow
      .toISOString()
      .slice(
        0,
        10
      );


  box.innerHTML = `

    <div
      style="
        padding:15px;
        border:1px solid #ddd;
        border-radius:12px;
      "
    >

      <strong>
        📅 Pre-order
      </strong>

      <p>
        This cart contains a pre-order item.
        Online payment is required.
      </p>


      <label>
        Pre-order Date
      </label>


      <input
        id="prebookDate"
        type="date"
        min="${minDate}"
      >


      <label>
        Pre-order Time
      </label>


      <select id="prebookTime">

        <option value="">
          Select time
        </option>

      </select>

    </div>

  `;


  const date =
    document.getElementById(
      'prebookDate'
    );


  const time =
    document.getElementById(
      'prebookTime'
    );


  function refresh() {

    if (!date || !time) return;


    time.innerHTML = `

      <option value="">
        Select time
      </option>

    `;


    if (!date.value) {
      buildSummary();
      return;
    }


    const selected =
      new Date(
        date.value +
        'T12:00:00'
      );


    buildTimeOptions(
      selected
    ).forEach(
      function (option) {

        const el =
          document.createElement(
            'option'
          );


        el.value =
          option.value;

        el.textContent =
          option.label;


        time.appendChild(
          el
        );

      }
    );


    buildSummary();

  }


  date.onchange =
    refresh;

  time.onchange =
    buildSummary;

}



/* =========================================================
   PAYMENT
========================================================= */

function getPaymentSettings() {

  const payment =
    configData?.payment ||
    {};


  return {

    number:
      payment.number ||
      payment.bkash ||
      payment.nagad ||
      '01792494275',

    bkash:
      payment.bkash ||
      payment.number ||
      '01792494275',

    nagad:
      payment.nagad ||
      payment.number ||
      '01792494275'

  };

}



function buildPayment() {

  const box =
    document.getElementById(
      'pay'
    );


  if (!box) return;


  const hasPrebook =
    cartHasPrebook();


  const codAllowed =
    !!(
      deliveryInfo &&
      deliveryInfo.available &&
      deliveryInfo.cod &&
      !hasPrebook
    );


  const payment =
    getPaymentSettings();


  let html = `

    <div>

      <p>
        Select payment method
      </p>

  `;


  if (codAllowed) {

    html += `

      <label>
        <input
          type="radio"
          name="cPayment"
          value="cod"
          checked
        >
        💵 Cash on Delivery
      </label>

    `;

  }


  html += `

      <label>
        <input
          type="radio"
          name="cPayment"
          value="bkash"
          ${codAllowed ? '' : 'checked'}
        >
        📱 bKash — Send Money
      </label>


      <label>
        <input
          type="radio"
          name="cPayment"
          value="nagad"
        >
        📱 Nagad — Send Money
      </label>


      <div
        id="paymentInstructions"
        style="margin-top:12px"
      ></div>

    </div>

  `;


  box.innerHTML =
    html;


  box
    .querySelectorAll(
      'input[name="cPayment"]'
    )
    .forEach(
      function (radio) {

        radio.addEventListener(
          'change',
          updatePaymentInstructions
        );

      }
    );


  updatePaymentInstructions();

}



function updatePaymentInstructions() {

  const method =
    document.querySelector(
      'input[name="cPayment"]:checked'
    )?.value;


  const box =
    document.getElementById(
      'paymentInstructions'
    );


  if (!box) return;


  const payment =
    getPaymentSettings();


  if (method === 'cod') {

    box.innerHTML = `

      <div>
        💵 Cash on Delivery
      </div>

    `;

    return;

  }


  const number =
    method === 'nagad'
      ? payment.nagad
      : payment.bkash;


  box.innerHTML = `

    <div>

      <strong>
        ${method === 'nagad'
          ? 'Nagad'
          : 'bKash'}
        — Send Money Only
      </strong>

      <br>

      Number:
      <strong>
        ${esc(number)}
      </strong>


      <input
        id="transactionId"
        type="text"
        inputmode="numeric"
        placeholder="Transaction ID / Last 5 digits *"
        style="width:100%;margin-top:8px;padding:10px"
      >

    </div>

  `;

}



/* =========================================================
   SUMMARY
========================================================= */

function buildSummary() {

  const box =
    document.getElementById(
      'sum'
    );


  if (!box) return;


  const subtotal =
    getSubtotal();


  const delivery =
    deliveryInfo?.available
      ? Number(
          deliveryInfo.charge ||
          0
        )
      : 0;


  const total =
    subtotal +
    delivery;


  box.innerHTML = `

    <div
      style="
        margin-top:15px;
        padding:15px;
        border:1px solid #ddd;
        border-radius:12px;
      "
    >

      <div>
        Subtotal:
        <strong>
          ${money(subtotal)}
        </strong>
      </div>


      <div>
        Delivery:
        <strong>
          ${
            deliveryInfo
              ? money(delivery)
              : 'Select location'
          }
        </strong>
      </div>


      <hr>


      <div>
        <strong>
          Total:
          ${money(total)}
        </strong>
      </div>

    </div>

  `;

}



/* =========================================================
   CHECKOUT
========================================================= */

function checkout() {

  if (!cartData.length) {

    alert(
      'Your cart is empty.'
    );

    return;

  }


  if (!requireLogin()) {

    return;

  }


  closeCart();


  const modal =
    document.getElementById(
      'modal'
    );


  if (!modal) return;


  modal.style.display =
    'block';


  modal.setAttribute(
    'aria-hidden',
    'false'
  );


  const customer =
    getCustomer();


  if (customer) {

    const name =
      document.getElementById(
        'name'
      );

    const phone =
      document.getElementById(
        'phone'
      );

    const email =
      document.getElementById(
        'email'
      );


    if (name) {
      name.value =
        customer.name ||
        '';
    }


    if (phone) {
      phone.value =
        customer.mobile ||
        customer.phone ||
        '';
    }


    if (email) {
      email.value =
        customer.email ||
        '';
    }

  }


  initMap();

  setupDeliveryTimeUI();

  buildPrebookUI();

  buildPayment();

  buildSummary();

}



function closeCheckout() {

  const modal =
    document.getElementById(
      'modal'
    );


  if (!modal) return;


  modal.style.display =
    'none';


  modal.setAttribute(
    'aria-hidden',
    'true'
  );

}



/* =========================================================
   VALIDATE DELIVERY TIME
========================================================= */

function validateDeliveryTime() {

  if (
    cartHasPrebook()
  ) {

    const date =
      document.getElementById(
        'prebookDate'
      )?.value;

    const time =
      document.getElementById(
        'prebookTime'
      )?.value;


    if (!date || !time) {

      return {
        ok: false,
        message:
          'Please select pre-order date and time.'
      };

    }


    const value =
      new Date(time);


    if (
      Number.isNaN(
        value.getTime()
      )
    ) {

      return {
        ok: false,
        message:
          'Invalid pre-order time.'
      };

    }


    if (
      value.getTime() <=
      Date.now()
    ) {

      return {
        ok: false,
        message:
          'Pre-order time must be in the future.'
      };

    }


    const minutes =
      value.getHours() *
      60 +
      value.getMinutes();


    if (
      minutes % 30 !== 0
    ) {

      return {
        ok: false,
        message:
          'Please select a 30-minute slot.'
      };

    }


    const window =
      getOrderWindow(
        value
      );


    if (
      minutes <
        window.start ||
      minutes >
        window.end
    ) {

      return {
        ok: false,
        message:
          'Selected time is outside shop delivery hours.'
      };

    }


    return {

      ok: true,

      value:
        value.toISOString()

    };

  }


  const select =
    document.getElementById(
      'time'
    );


  const value =
    select?.value;


  if (!value) {

    return {

      ok: false,

      message:
        'Please select delivery time.'

    };

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return {

      ok: false,

      message:
        'Invalid delivery time.'

    };

  }


  if (
    date.getTime() <=
    Date.now()
  ) {

    return {

      ok: false,

      message:
        'Please select a future delivery slot.'

    };

  }


  const minutes =
    date.getHours() *
    60 +
    date.getMinutes();


  if (
    minutes % 30 !== 0
  ) {

    return {

      ok: false,

      message:
        'Delivery time must be a 30-minute slot.'

    };

  }


  const window =
    getOrderWindow(
      date
    );


  if (
    minutes <
      window.start ||
    minutes >
      window.end
  ) {

    return {

      ok: false,

      message:
        'Selected delivery time is outside allowed hours.'

    };

  }


  return {

    ok: true,

    value:
      date.toISOString()

  };

}



/* =========================================================
   PLACE ORDER
========================================================= */

async function place() {

  if (!requireLogin()) {
    return;
  }


  if (!cartData.length) {

    alert(
      'Your cart is empty.'
    );

    return;

  }


  if (
    !selectedLocation
  ) {

    alert(
      'Please select your delivery location.'
    );

    return;

  }


  if (
    !deliveryInfo
  ) {

    await checkLocation();

  }


  if (
    !deliveryInfo?.available
  ) {

    alert(
      'Your delivery location is outside the 4 km delivery area.'
    );

    return;

  }


  const customer =
    getCustomer() || {};


  const name =
    document.getElementById(
      'name'
    )?.value.trim();


  const phone =
    document.getElementById(
      'phone'
    )?.value.trim();


  const house =
    document.getElementById(
      'house'
    )?.value.trim();


  const road =
    document.getElementById(
      'road'
    )?.value.trim();


  const note =
    document.getElementById(
      'note'
    )?.value.trim();


  if (!name || !phone) {

    alert(
      'Customer name and phone are required.'
    );

    return;

  }


  const accountPhone =
    String(
      customer.mobile ||
      customer.phone ||
      ''
    ).replace(
      /\D/g,
      ''
    );


  const enteredPhone =
    String(
      phone
    ).replace(
      /\D/g,
      ''
    );


  if (
    accountPhone &&
    enteredPhone !==
    accountPhone
  ) {

    alert(
      'Please use the mobile number linked to your customer account.'
    );

    return;

  }


  const timeResult =
    validateDeliveryTime();


  if (!timeResult.ok) {

    alert(
      timeResult.message
    );

    return;

  }


  const paymentMethod =
    document.querySelector(
      'input[name="cPayment"]:checked'
    )?.value;


  const hasPrebook =
    cartHasPrebook();


  if (!paymentMethod) {

    alert(
      'Please select a payment method.'
    );

    return;

  }


  if (
    hasPrebook &&
    paymentMethod === 'cod'
  ) {

    alert(
      'Pre-order items require online payment.'
    );

    return;

  }


  if (
    !deliveryInfo.cod &&
    paymentMethod === 'cod'
  ) {

    alert(
      'COD is not available at this location.'
    );

    return;

  }


  let transactionId = '';


  if (
    paymentMethod ===
      'bkash' ||
    paymentMethod ===
      'nagad'
  ) {

    transactionId =
      document
        .getElementById(
          'transactionId'
        )
        ?.value
        .trim() || '';


    if (
      !transactionId
    ) {

      alert(
        'Please enter your transaction ID / last 5 digits.'
      );

      return;

    }


    if (
      !/^\d{5,50}$/.test(
        transactionId
      )
    ) {

      alert(
        'Transaction ID must contain 5–50 digits.'
      );

      return;

    }

  }


  const items =
    getCartItemsDetailed()
      .map(
        function (row) {

          return {

            productId:
              row.product.id,

            id:
              row.product.id,

            name:
              row.product.name,

            qty:
              Number(
                row.item.qty || 1
              ),

            sizeIndex:
              row.pricing.sizeIndex,

            choice:
              row.pricing.label,

            price:
              row.pricing.price

          };

        }
      );


  const payload = {

    customer: {

      name,

      phone,

      email:
        customer.email || ''

    },


    items,


    lat:
      selectedLocation.lat,

    lng:
      selectedLocation.lng,


    deliveryLocation: {

      lat:
        selectedLocation.lat,

      lng:
        selectedLocation.lng,

      house,

      road

    },


    deliveryTime:
      timeResult.value,


    paymentMethod,


    transactionId,


    note

  };


  const button =
    document.getElementById(
      'place'
    );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      'Placing Order...';

  }


  try {

    const response =
      await fetch(
        '/api/orders',
        {

          method: 'POST',

          headers: {

            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${getToken()}`

          },

          body:
            JSON.stringify(
              payload
            )

        }
      );


    const data =
      await response.json();


    if (
      response.status ===
      401
    ) {

      if (
        typeof window.openAuthModal ===
        'function'
      ) {

        window.openAuthModal(
          'login'
        );

      }

      throw new Error(
        'Your login session has expired.'
      );

    }


    if (
      !response.ok ||
      !data.ok
    ) {

      throw new Error(
        data.message ||
        'Order could not be placed.'
      );

    }


    cartData = [];

    saveCart();


    const result =
      document.getElementById(
        'result'
      );


    if (result) {

      result.innerHTML = `

        <div
          style="
            padding:15px;
            margin-top:15px;
            border-radius:12px;
            border:1px solid #ccc;
          "
        >

          <h3>
            ✅ Order Placed Successfully
          </h3>

          <p>
            Order ID:
            <strong>
              ${esc(
                data.order?.id ||
                data.orderId ||
                ''
              )}
            </strong>
          </p>

          <p>
            Delivery Time:
            <strong>
              ${new Date(
                timeResult.value
              ).toLocaleString(
                'en-BD',
                {
                  dateStyle:
                    'medium',

                  timeStyle:
                    'short'
                }
              )}
            </strong>
          </p>

        </div>

      `;

    }


    setTimeout(
      function () {

        closeCheckout();

        window.location.reload();

      },
      2500
    );


  } catch (error) {

    alert(
      error.message ||
      'Order failed.'
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        'Place Order';

    }

  }

}



/* =========================================================
   SEARCH
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  function () {

    const search =
      document.getElementById(
        'search'
      );


    if (search) {

      search.addEventListener(
        'input',
        render
      );

    }

  }
);



/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  async function () {

    cartUI();

    updateCartCount();

    await loadConfig();

    await loadMenu();

  }
);



/* =========================================================
   EXPORTS
   IMPORTANT:
   NO CUSTOMER AUTH VARIABLES ARE OVERWRITTEN.
========================================================= */

window.toggleMobileMenu =
  toggleMobileMenu;

window.setCategory =
  setCategory;

window.render =
  render;

window.add =
  add;

window.openCart =
  openCart;

window.closeCart =
  closeCart;

window.changeQty =
  changeQty;

window.removeCartItem =
  removeCartItem;

window.checkout =
  checkout;

window.closeCheckout =
  closeCheckout;

window.gps =
  gps;

window.base =
  base;

window.place =
  place;
