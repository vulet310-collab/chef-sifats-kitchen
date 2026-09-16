/* =========================================================
   CHEF SIFAT'S KITCHEN
   MAIN CUSTOMER APP
   ========================================================= */

(() => {
  'use strict';

  /* =======================================================
     CONFIG
  ======================================================= */

  const BASE_LOCATION = {
    name: 'Kahalthuri Hamidia High School',
    lat: 23.3022494,
    lng: 90.9187528
  };

  const COD_RADIUS_KM = 1;
  const MAX_DELIVERY_RADIUS_KM = 4;
  const DELIVERY_RATE_PER_KM = 10;

  const SHOP_HOURS_DEFAULT = {
    normal: {
      open: 11,
      close: 19
    },
    friday: {
      open: 15,
      close: 21
    }
  };


  /* =======================================================
     STATE
  ======================================================= */

  let menuData = [];
  let cart = loadCart();

  let cat = 'All';

  let map = null;
  let marker = null;

  let selectedLocation = null;
  let locationResult = null;

  let config = null;

  let deliveryTimeValue = '';

  let prebookDateValue = '';
  let prebookTimeValue = '';

  let paymentMethodValue = '';

  let mapReady = false;


  /* =======================================================
     DOM HELPER
  ======================================================= */

  function $(id) {
    return document.getElementById(id);
  }


  /* =======================================================
     AUTH HELPERS
     -------------------------------------------------------
     IMPORTANT:
     Do NOT create duplicate customerToken/customerData
     variables here.
  ======================================================= */

  function getCustomerTokenSafe() {

    try {

      if (
        typeof window.getCustomerToken ===
        'function'
      ) {
        return window.getCustomerToken() || '';
      }

    } catch (e) {}

    try {

      return localStorage.getItem(
        'csk_customer_token'
      ) || '';

    } catch (e) {

      return '';
    }
  }


  function getCustomerDataSafe() {

    try {

      if (
        typeof window.getCustomerData ===
        'function'
      ) {
        return window.getCustomerData() || null;
      }

    } catch (e) {}

    try {

      const raw =
        localStorage.getItem(
          'csk_customer_data'
        );

      return raw
        ? JSON.parse(raw)
        : null;

    } catch (e) {

      return null;
    }
  }


  function isCustomerLoggedInSafe() {

    return Boolean(
      getCustomerTokenSafe()
    );
  }


  function openCustomerLoginSafe(
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

    } catch (e) {}

    alert(
      'Login system is loading. Please refresh the page.'
    );
  }


  function requireCustomerLoginSafe() {

    if (
      isCustomerLoggedInSafe()
    ) {
      return true;
    }

    openCustomerLoginSafe('login');

    return false;
  }


  /* =======================================================
     CART STORAGE
  ======================================================= */

  function loadCart() {

    try {

      const raw =
        localStorage.getItem(
          'chefSifatCart5'
        );

      const data =
        raw
          ? JSON.parse(raw)
          : [];

      return Array.isArray(data)
        ? data
        : [];

    } catch (e) {

      return [];
    }
  }


  function saveCart() {

    try {

      localStorage.setItem(
        'chefSifatCart5',
        JSON.stringify(cart)
      );

    } catch (e) {

      console.error(
        'Could not save cart:',
        e
      );
    }

    updateCartCount();
  }


  /* =======================================================
     ESCAPE HTML
  ======================================================= */

  function esc(value) {

    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }


  /* =======================================================
     NUMBER
  ======================================================= */

  function num(value, fallback = 0) {

    const n =
      Number(value);

    return Number.isFinite(n)
      ? n
      : fallback;
  }


  /* =======================================================
     MENU NORMALIZATION
  ======================================================= */

  function normalizeMenuItem(product) {

    if (!product) {
      return null;
    }


    const sizes =
      Array.isArray(product.sizes)
        ? product.sizes
        : [];


    let price =
      num(product.price);


    if (
      sizes.length &&
      Array.isArray(sizes[0])
    ) {
      price =
        num(
          sizes[0][1],
          price
        );
    }


    let category =
      String(
        product.cat ||
        product.category ||
        ''
      ).trim();


    if (!category) {
      category = 'Other';
    }


    /*
      Pizza and Momo are always normal items.
      Continental/Kacchi follow admin prebook flag.
    */

    let prebook =
      product.prebook === true;


    if (
      category.toLowerCase() === 'pizza' ||
      category.toLowerCase() === 'momo'
    ) {
      prebook = false;
    }


    return {
      ...product,

      id:
        String(
          product.id ??
          product._id ??
          ''
        ),

      name:
        String(
          product.name ||
          product.title ||
          'Food Item'
        ),

      cat: category,

      price,

      sizes,

      image:
        product.image ||
        product.photo ||
        '',

      description:
        product.description ||
        '',

      choice:
        product.choice ||
        '',

      prebook,

      active:
        product.active !== false,

      minQty:
        num(product.minQty, 1),

      maxQty:
        num(product.maxQty, 9999)
    };
  }


  /* =======================================================
     LOAD CONFIG
  ======================================================= */

  async function loadConfig() {

    try {

      const response =
        await fetch(
          '/api/config',
          {
            cache: 'no-store'
          }
        );


      if (!response.ok) {
        throw new Error(
          'Config request failed'
        );
      }


      const data =
        await response.json();


      config =
        data?.config ||
        data ||
        {};


      return config;

    } catch (error) {

      console.warn(
        'Config load failed:',
        error
      );


      config = {
        delivery: {
          baseLat:
            BASE_LOCATION.lat,

          baseLng:
            BASE_LOCATION.lng,

          codRadiusKm:
            COD_RADIUS_KM,

          maxRadiusKm:
            MAX_DELIVERY_RADIUS_KM,

          ratePerKm:
            DELIVERY_RATE_PER_KM,

          codCharge: 0
        },

        payment: {
          bkash:
            '01792494275',

          nagad:
            '01792494275',

          method:
            'Send Money Only'
        },

        hours:
          SHOP_HOURS_DEFAULT,

        prebook: {
          enabled: true
        }
      };


      return config;
    }
  }


  /* =======================================================
     LOAD MENU
  ======================================================= */

  async function loadMenu() {

    try {

      const response =
        await fetch(
          '/api/menu',
          {
            cache: 'no-store'
          }
        );


      if (!response.ok) {
        throw new Error(
          'Public menu API unavailable'
        );
      }


      const data =
        await response.json();


      const items =
        Array.isArray(data)
          ? data
          : (
              data?.menu ||
              data?.items ||
              []
            );


      menuData =
        items
          .map(normalizeMenuItem)
          .filter(
            item =>
              item &&
              item.active !== false
          );


      render();

      cartUI();

      return menuData;

    } catch (error) {

      console.error(
        'Menu loading failed:',
        error
      );


      menuData = [];

      render();


      const grid =
        $('grid');

      if (grid) {

        grid.innerHTML = `
          <div class="menu-error">
            <p>
              Unable to load menu.
            </p>

            <button
              class="btn"
              type="button"
              onclick="loadMenu()"
            >
              Retry
            </button>
          </div>
        `;
      }

      return [];
    }
  }


  /* =======================================================
     SET CATEGORY
  ======================================================= */

  function setCategory(value) {

    cat =
      String(value || 'All');

    render();
  }


  /* =======================================================
     PRICE / SIZE HELPER
  ======================================================= */

  function getItemPricing(
    product,
    item = {}
  ) {

    const sizes =
      Array.isArray(product?.sizes)
        ? product.sizes
        : [];


    /*
      Products with size options
    */

    if (sizes.length) {

      let index =
        Number(item.sizeIndex);


      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= sizes.length
      ) {
        index = 0;
      }


      const raw =
        sizes[index];


      if (Array.isArray(raw)) {

        return {
          sizeIndex: index,

          label:
            String(
              raw[0] ?? ''
            ),

          price:
            num(
              raw[1]
            )
        };
      }


      if (
        raw &&
        typeof raw === 'object'
      ) {

        return {
          sizeIndex: index,

          label:
            String(
              raw.label ??
              raw.name ??
              ''
            ),

          price:
            num(
              raw.price
            )
        };
      }
    }


    /*
      Products without size options
    */

    return {
      sizeIndex: null,

      label:
        String(
          item.choice ??
          product.choice ??
          ''
        ),

      price:
        num(
          item.price ??
          product.price
        )
    };
  }


  /* =======================================================
     RENDER MENU
  ======================================================= */

  function render() {

    const grid =
      $('grid');

    if (!grid) return;


    const search =
      String(
        $('search')?.value ||
        ''
      )
        .trim()
        .toLowerCase();


    const filtered =
      menuData.filter(
        product => {

          const categoryMatch =
            cat === 'All' ||
            String(
              product.cat
            ).toLowerCase() ===
              cat.toLowerCase();


          if (!categoryMatch) {
            return false;
          }


          if (!search) {
            return true;
          }


          const text = [
            product.name,
            product.cat,
            product.description,
            product.choice
          ]
            .join(' ')
            .toLowerCase();


          return text.includes(search);
        }
      );


    if (!filtered.length) {

      grid.innerHTML = `
        <div class="empty-menu">
          <p>
            No food item found.
          </p>
        </div>
      `;

      return;
    }


    grid.innerHTML =
      filtered.map(
        product =>
          renderProduct(product)
      ).join('');
  }


  /* =======================================================
     RENDER PRODUCT
  ======================================================= */

  function renderProduct(product) {

    const sizes =
      Array.isArray(product.sizes)
        ? product.sizes
        : [];


    let sizeHTML = '';

    let priceHTML = '';


    if (sizes.length) {

      sizeHTML = `
        <label class="size-label">
          Choose size

          <select
            id="size-${esc(product.id)}"
            class="product-size"
          >
            ${sizes.map(
              (size, index) => {

                const label =
                  Array.isArray(size)
                    ? size[0]
                    : (
                        size?.label ??
                        size?.name ??
                        ''
                      );

                const price =
                  Array.isArray(size)
                    ? size[1]
                    : size?.price;

                return `
                  <option
                    value="${index}"
                  >
                    ${esc(label)}
                    — ৳${num(price)}
                  </option>
                `;
              }
            ).join('')}
          </select>
        </label>
      `;

    } else {

      priceHTML = `
        <div class="product-price">
          ৳${num(product.price)}
        </div>
      `;
    }


    const image =
      product.image
        ? `
          <img
            src="${esc(product.image)}"
            alt="${esc(product.name)}"
            loading="lazy"
            onerror="this.style.display='none'"
          >
        `
        : `
          <div class="food-placeholder">
            🍽️
          </div>
        `;


    return `
      <article
        class="product-card"
        data-product-id="${esc(product.id)}"
      >

        <div class="product-image">
          ${image}
        </div>

        <div class="product-content">

          <small>
            ${esc(product.cat)}
          </small>

          <h3>
            ${esc(product.name)}
          </h3>

          ${
            product.description
              ? `
                <p>
                  ${esc(product.description)}
                </p>
              `
              : ''
          }

          ${priceHTML}

          ${sizeHTML}

          <button
            class="btn full add-to-cart-btn"
            type="button"
            onclick="add('${esc(product.id)}')"
          >
            🛒 Add to Cart
          </button>

        </div>

      </article>
    `;
  }


  /* =======================================================
     FIND PRODUCT
  ======================================================= */

  function findProduct(id) {

    return menuData.find(
      product =>
        String(product.id) ===
        String(id)
    );
  }


  /* =======================================================
     ADD TO CART
  ======================================================= */

  function add(id) {

    const product =
      findProduct(id);


    if (!product) {

      alert(
        'This food item is currently unavailable.'
      );

      return;
    }


    if (
      product.active === false
    ) {

      alert(
        'This food item is currently unavailable.'
      );

      return;
    }


    const sizes =
      Array.isArray(product.sizes)
        ? product.sizes
        : [];


    let sizeIndex = null;

    let pricing;


    if (sizes.length) {

      const select =
        $(`size-${id}`);


      sizeIndex =
        Number(
          select?.value ?? 0
        );


      if (
        !Number.isInteger(sizeIndex) ||
        sizeIndex < 0 ||
        sizeIndex >= sizes.length
      ) {

        sizeIndex = 0;
      }


      pricing =
        getItemPricing(
          product,
          { sizeIndex }
        );

    } else {

      pricing =
        getItemPricing(
          product,
          {}
        );
    }


    if (
      !pricing.price ||
      pricing.price <= 0
    ) {

      alert(
        'Price is not available for this item.'
      );

      return;
    }


    /*
      Same product + same size = same cart line.
    */

    const existing =
      cart.find(
        item =>
          String(item.id) ===
            String(product.id) &&
          (
            item.sizeIndex ?? null
          ) ===
          (
            sizeIndex ?? null
          )
      );


    if (existing) {

      existing.qty =
        num(existing.qty, 0) + 1;

    } else {

      cart.push({

        id:
          String(product.id),

        qty:
          1,

        sizeIndex,

        choice:
          pricing.label,

        price:
          pricing.price,

        name:
          product.name,

        cat:
          product.cat

      });
    }


    saveCart();

    cartUI();

    openCart();

  }


  /* =======================================================
     CHANGE CART QUANTITY
  ======================================================= */

  function changeQty(
    index,
    delta
  ) {

    const item =
      cart[index];

    if (!item) return;


    const product =
      findProduct(item.id);


    const minQty =
      product
        ? Math.max(
            1,
            num(
              product.minQty,
              1
            )
          )
        : 1;


    const maxQty =
      product
        ? Math.max(
            minQty,
            num(
              product.maxQty,
              9999
            )
          )
        : 9999;


    item.qty =
      num(item.qty, 1) +
      Number(delta);


    if (item.qty < minQty) {
      item.qty = minQty;
    }


    if (item.qty > maxQty) {
      item.qty = maxQty;
    }


    saveCart();

    cartUI();

    if ($('modal')?.style.display === 'flex') {
      refreshCheckoutSummary();
    }
  }


  /* =======================================================
     REMOVE CART ITEM
  ======================================================= */

  function removeItem(index) {

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


    saveCart();

    cartUI();

    if ($('modal')?.style.display === 'flex') {
      refreshCheckoutSummary();
    }
  }


  /* =======================================================
     CART SUBTOTAL
  ======================================================= */

  function getSubtotal() {

    return cart.reduce(
      (total, item) => {

        const product =
          findProduct(item.id);


        if (!product) {
          return total;
        }


        const pricing =
          getItemPricing(
            product,
            item
          );


        return (
          total +
          pricing.price *
          num(item.qty, 0)
        );

      },
      0
    );
  }


  /* =======================================================
     CART COUNT
  ======================================================= */

  function updateCartCount() {

    const count =
      $('count');

    if (!count) return;


    const totalQty =
      cart.reduce(
        (sum, item) =>
          sum +
          num(item.qty, 0),
        0
      );


    count.textContent =
      String(totalQty);
  }


  /* =======================================================
     CART UI
  ======================================================= */

  function cartUI() {

    const box =
      $('cartItems');

    const subtotal =
      $('subtotal');


    updateCartCount();


    if (!box) return;


    if (!cart.length) {

      box.innerHTML = `
        <div class="empty-cart">
          <p>
            Your cart is empty.
          </p>

          <a
            href="#menu"
            onclick="closeCart()"
          >
            Browse Menu
          </a>
        </div>
      `;

      if (subtotal) {
        subtotal.textContent =
          '৳0';
      }

      return;
    }


    box.innerHTML =
      cart.map(
        (item, index) => {

          const product =
            findProduct(item.id);


          if (!product) {
            return '';
          }


          const pricing =
            getItemPricing(
              product,
              item
            );


          const lineTotal =
            pricing.price *
            num(item.qty, 0);


          return `
            <div class="cart-item">

              <div>

                <b>
                  ${esc(product.name)}
                </b>

                ${
                  pricing.label
                    ? `
                      <small>
                        ${esc(pricing.label)}
                      </small>
                    `
                    : ''
                }

                <span>
                  ৳${pricing.price}
                  × ${num(item.qty, 1)}
                </span>

              </div>


              <div class="cart-controls">

                <button
                  type="button"
                  onclick="changeQty(${index},-1)"
                >
                  −
                </button>

                <b>
                  ${num(item.qty, 1)}
                </b>

                <button
                  type="button"
                  onclick="changeQty(${index},1)"
                >
                  +
                </button>

                <strong>
                  ৳${lineTotal}
                </strong>

                <button
                  type="button"
                  onclick="removeItem(${index})"
                >
                  ×
                </button>

              </div>

            </div>
          `;
        }
      ).join('');


    if (subtotal) {

      subtotal.textContent =
        `৳${getSubtotal()}`;
    }
  }


  /* =======================================================
     OPEN CART
  ======================================================= */

  function openCart() {

    const cartBox =
      $('cart');

    const shade =
      $('shade');


    cartUI();


    if (cartBox) {

      cartBox.classList.add(
        'open'
      );

      cartBox.setAttribute(
        'aria-hidden',
        'false'
      );
    }


    if (shade) {

      shade.classList.add(
        'open'
      );
    }
  }


  /* =======================================================
     CLOSE CART
  ======================================================= */

  function closeCart() {

    const cartBox =
      $('cart');

    const shade =
      $('shade');


    if (cartBox) {

      cartBox.classList.remove(
        'open'
      );

      cartBox.setAttribute(
        'aria-hidden',
        'true'
      );
    }


    if (shade) {

      shade.classList.remove(
        'open'
      );
    }
  }


  /* =======================================================
     PREBOOK CHECK
  ======================================================= */

  function itemIsPrebook(product) {

    if (!product) {
      return false;
    }


    const category =
      String(
        product.cat || ''
      ).toLowerCase();


    /*
      Pizza NEVER prebook.
      Momo NEVER prebook.
    */

    if (
      category === 'pizza' ||
      category === 'momo'
    ) {
      return false;
    }


    return (
      product.prebook === true
    );
  }


  function cartHasPrebook() {

    return cart.some(
      item => {

        const product =
          findProduct(item.id);

        return itemIsPrebook(
          product
        );
      }
    );
  }


  /* =======================================================
     CHECKOUT
  ======================================================= */

  async function checkout() {

    if (!cart.length) {

      alert(
        'Your cart is empty.'
      );

      return;
    }


    /*
      Login required before checkout.
    */

    if (
      !requireCustomerLoginSafe()
    ) {
      return;
    }


    closeCart();


    const modal =
      $('modal');

    if (!modal) {
      return;
    }


    modal.style.display =
      'flex';

    modal.setAttribute(
      'aria-hidden',
      'false'
    );


    const customer =
      getCustomerDataSafe();


    const name =
      $('name');

    const phone =
      $('phone');


    if (name && !name.value) {

      name.value =
        customer?.name ||
        customer?.fullName ||
        '';
    }


    if (phone && !phone.value) {

      phone.value =
        customer?.phone ||
        customer?.mobile ||
        '';
    }


    await initializeCheckout();

  }


  /* =======================================================
     INITIALIZE CHECKOUT
  ======================================================= */

  async function initializeCheckout() {

    await loadConfig();

    setupMap();

    setupDeliveryTimeUI();

    buildPaymentBlock();

    refreshCheckoutSummary();

    setupPrebookEvents();

    updatePlaceButton();
  }


  /* =======================================================
     CLOSE CHECKOUT
  ======================================================= */

  function closeCheckout() {

    const modal =
      $('modal');

    if (!modal) return;


    modal.style.display =
      'none';

    modal.setAttribute(
      'aria-hidden',
      'true'
    );
  }


  /* =======================================================
     MAP
  ======================================================= */

  function setupMap() {

    const mapBox =
      $('map');

    if (!mapBox) return;


    if (
      typeof L ===
      'undefined'
    ) {

      mapBox.innerHTML =
        '<p>Map could not be loaded.</p>';

      return;
    }


    if (map) {

      setTimeout(
        () => {
          map.invalidateSize();
        },
        200
      );

      return;
    }


    map =
      L.map(
        mapBox
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
    ).addTo(map);


    marker =
      L.marker(
        [
          BASE_LOCATION.lat,
          BASE_LOCATION.lng
        ],
        {
          draggable: true
        }
      ).addTo(map);


    marker.bindPopup(
      'Delivery location'
    );


    marker.on(
      'dragend',
      () => {

        const position =
          marker.getLatLng();


        updateSelectedLocation(
          position.lat,
          position.lng
        );
      }
    );


    updateSelectedLocation(
      BASE_LOCATION.lat,
      BASE_LOCATION.lng
    );


    mapReady = true;


    setTimeout(
      () => {
        map.invalidateSize();
      },
      300
    );
  }


  /* =======================================================
     BASE LOCATION
  ======================================================= */

  function base() {

    setupMap();


    if (!map || !marker) {
      return;
    }


    map.setView(
      [
        BASE_LOCATION.lat,
        BASE_LOCATION.lng
      ],
      15
    );


    marker.setLatLng(
      [
        BASE_LOCATION.lat,
        BASE_LOCATION.lng
      ]
    );


    updateSelectedLocation(
      BASE_LOCATION.lat,
      BASE_LOCATION.lng
    );
  }


  /* =======================================================
     GPS
  ======================================================= */

  function gps() {

    if (
      !navigator.geolocation
    ) {

      alert(
        'Your browser does not support GPS location.'
      );

      return;
    }


    const status =
      $('status');


    if (status) {

      status.textContent =
        '📍 Detecting your current location...';
    }


    navigator.geolocation.getCurrentPosition(
      position => {

        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;


        setupMap();


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


        updateSelectedLocation(
          lat,
          lng
        );

      },

      error => {

        console.warn(
          'GPS error:',
          error
        );


        if (status) {

          status.textContent =
            'Could not detect your location. Please move the map pin manually.';
        }


        alert(
          'Location access was not available. Please allow GPS permission or select your location on the map.'
        );
      },

      {
        enableHighAccuracy: true,

        timeout: 15000,

        maximumAge: 0
      }
    );
  }


  /* =======================================================
     HAVERSINE
  ======================================================= */

  function distanceKm(
    lat1,
    lon1,
    lat2,
    lon2
  ) {

    const R = 6371;

    const dLat =
      (
        lat2 - lat1
      ) *
      Math.PI /
      180;


    const dLon =
      (
        lon2 - lon1
      ) *
      Math.PI /
      180;


    const a =
      Math.sin(
        dLat / 2
      ) ** 2 +

      Math.cos(
        lat1 *
        Math.PI /
        180
      ) *

      Math.cos(
        lat2 *
        Math.PI /
        180
      ) *

      Math.sin(
        dLon / 2
      ) ** 2;


    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );


    return R * c;
  }


  /* =======================================================
     UPDATE LOCATION
  ======================================================= */

  async function updateSelectedLocation(
    lat,
    lng
  ) {

    selectedLocation = {
      lat: Number(lat),
      lng: Number(lng)
    };


    const status =
      $('status');


    if (status) {

      status.textContent =
        'Checking delivery availability...';
    }


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

            body:
              JSON.stringify({
                lat:
                  selectedLocation.lat,

                lng:
                  selectedLocation.lng
              })
          }
        );


      if (!response.ok) {
        throw new Error(
          'Location check failed'
        );
      }


      const data =
        await response.json();


      locationResult = {
        available:
          Boolean(
            data.available ??
            data.allowed
          ),

        cod:
          Boolean(
            data.codAvailable ??
            data.cod
          ),

        distance:
          num(
            data.distanceKm ??
            data.distance ??
            0
          ),

        charge:
          num(
            data.deliveryCharge ??
            data.charge ??
            0
          ),

        paymentRequired:
          Boolean(
            data.paymentRequired
          )
      };


    } catch (error) {

      /*
        Frontend fallback.
      */

      const delivery =
        config?.delivery ||
        {};


      const baseLat =
        num(
          delivery.baseLat,
          BASE_LOCATION.lat
        );


      const baseLng =
        num(
          delivery.baseLng,
          BASE_LOCATION.lng
        );


      const codRadius =
        num(
          delivery.codRadiusKm,
          COD_RADIUS_KM
        );


      const maxRadius =
        num(
          delivery.maxRadiusKm,
          MAX_DELIVERY_RADIUS_KM
        );


      const rate =
        num(
          delivery.ratePerKm,
          DELIVERY_RATE_PER_KM
        );


      const distance =
        distanceKm(
          baseLat,
          baseLng,
          selectedLocation.lat,
          selectedLocation.lng
        );


      const available =
        distance <= maxRadius;


      const cod =
        distance <= codRadius;


      const charge =
        cod
          ? 0
          : Math.ceil(
              distance
            ) * rate;


      locationResult = {
        available,

        cod,

        distance,

        charge,

        paymentRequired:
          !cod
      };
    }


    updateLocationStatus();

    buildPaymentBlock();

    refreshCheckoutSummary();

    updatePlaceButton();
  }


  /* =======================================================
     LOCATION STATUS
  ======================================================= */

  function updateLocationStatus() {

    const status =
      $('status');

    if (!status) return;


    if (!locationResult) {

      status.textContent =
        'Drag the pin to your exact delivery location.';

      return;
    }


    if (
      !locationResult.available
    ) {

      status.innerHTML = `
        <b>
          ❌ Delivery unavailable
        </b>

        <br>

        Distance:
        ${locationResult.distance.toFixed(2)}
        km

        <br>

        Our maximum delivery radius is
        ${MAX_DELIVERY_RADIUS_KM}
        km.
      `;

      return;
    }


    if (
      locationResult.cod
    ) {

      status.innerHTML = `
        <b>
          ✅ COD Available
        </b>

        <br>

        Distance:
        ${locationResult.distance.toFixed(2)}
        km

        <br>

        Delivery Charge:
        ৳0
      `;

    } else {

      status.innerHTML = `
        <b>
          💳 Online Payment Required
        </b>

        <br>

        Distance:
        ${locationResult.distance.toFixed(2)}
        km

        <br>

        Delivery Charge:
        ৳${locationResult.charge}
      `;
    }
  }


  /* =======================================================
     SHOP HOURS
  ======================================================= */

  function getShopHours(
    date = new Date()
  ) {

    const hours =
      config?.hours ||
      SHOP_HOURS_DEFAULT;


    /*
      Use Bangladesh weekday.
    */

    const weekday =
      new Intl.DateTimeFormat(
        'en-US',
        {
          timeZone:
            'Asia/Dhaka',

          weekday:
            'long'
        }
      ).format(date);


    if (
      weekday === 'Friday'
    ) {

      return {
        open:
          num(
            hours?.friday?.open,
            15
          ),

        close:
          num(
            hours?.friday?.close,
            21
          )
      };
    }


    return {
      open:
        num(
          hours?.normal?.open,
          11
        ),

      close:
        num(
          hours?.normal?.close,
          19
        )
    };
  }


  /* =======================================================
     ORDER WINDOW
     -------------------------------------------------------
     Shop opening + 1 hour
     Shop closing - 1 hour
     
     Sun-Thu:
       12 PM - 6 PM
     
     Friday:
       4 PM - 8 PM
  ======================================================= */

  function getOrderWindow(
    date = new Date()
  ) {

    const hours =
      getShopHours(date);


    return {
      start:
        hours.open * 60 + 60,

      end:
        hours.close * 60 - 60
    };
  }


  /* =======================================================
     BANGLADESH DATE PARTS
  ======================================================= */

  function getDhakaParts(
    date = new Date()
  ) {

    const parts =
      new Intl.DateTimeFormat(
        'en-US',
        {
          timeZone:
            'Asia/Dhaka',

          year:
            'numeric',

          month:
            '2-digit',

          day:
            '2-digit',

          hour:
            '2-digit',

          minute:
            '2-digit',

          second:
            '2-digit',

          hourCycle:
            'h23'
        }
      )
        .formatToParts(date);


    const map = {};


    parts.forEach(
      part => {
        map[part.type] =
          part.value;
      }
    );


    return {
      year:
        Number(map.year),

      month:
        Number(map.month),

      day:
        Number(map.day),

      hour:
        Number(map.hour),

      minute:
        Number(map.minute),

      second:
        Number(map.second)
    };
  }


  function dhakaDateKey(
    date = new Date()
  ) {

    const p =
      getDhakaParts(date);


    return [
      p.year,
      String(p.month).padStart(2, '0'),
      String(p.day).padStart(2, '0')
    ].join('-');
  }


  /* =======================================================
     TIME FORMAT
  ======================================================= */

  function formatTime(
    minutes
  ) {

    let hour =
      Math.floor(
        minutes / 60
      );


    const minute =
      minutes % 60;


    const suffix =
      hour >= 12
        ? 'PM'
        : 'AM';


    hour =
      hour % 12;


    if (hour === 0) {
      hour = 12;
    }


    return `${hour}:${String(
      minute
    ).padStart(2, '0')} ${suffix}`;
  }


  /* =======================================================
     DATE FOR SLOT
  ======================================================= */

  function makeSlotDate(
    date,
    minutes
  ) {

    const p =
      getDhakaParts(date);


    /*
      Bangladesh is UTC+6 with no DST.
    */

    return new Date(
      Date.UTC(
        p.year,
        p.month - 1,
        p.day,
        Math.floor(
          minutes / 60
        ) - 6,
        minutes % 60,
        0,
        0
      )
    );
  }


  /* =======================================================
     BUILD NORMAL DELIVERY TIME OPTIONS
  ======================================================= */

  function buildDeliveryTimeSlots(
    date = new Date(),
    filterPast = true
  ) {

    const window =
      getOrderWindow(date);


    const slots = [];


    const todayKey =
      dhakaDateKey(
        new Date()
      );


    const selectedKey =
      dhakaDateKey(date);


    const now =
      new Date();


    for (
      let minutes =
        window.start;

      minutes <=
        window.end;

      minutes += 30
    ) {

      const slotDate =
        makeSlotDate(
          date,
          minutes
        );


      if (
        filterPast &&
        selectedKey ===
          todayKey &&
        slotDate.getTime() <=
          now.getTime()
      ) {
        continue;
      }


      slots.push({
        value:
          slotDate.toISOString(),

        label:
          formatTime(minutes)
      });
    }


    return slots;
  }


  /* =======================================================
     DELIVERY TIME UI
  ======================================================= */

  function setupDeliveryTimeUI() {

    const wrap =
      $('deliveryTimeWrap');

    if (!wrap) return;


    /*
      Prebook carts use their own date/time selector.
      Normal cart uses normal delivery time.
    */

    if (
      cartHasPrebook()
    ) {

      wrap.style.display =
        'none';

      deliveryTimeValue = '';

      return;
    }


    wrap.style.display =
      'block';


    const select =
      $('time');

    if (!select) return;


    const previous =
      select.value ||
      deliveryTimeValue ||
      '';


    const slots =
      buildDeliveryTimeSlots(
        new Date(),
        true
      );


    select.innerHTML = `
      <option value="">
        Select delivery time
      </option>

      ${slots.map(
        slot => `
          <option value="${esc(slot.value)}">
            ${esc(slot.label)}
          </option>
        `
      ).join('')}
    `;


    if (
      slots.some(
        slot =>
          slot.value ===
          previous
      )
    ) {

      select.value =
        previous;
    }


    select.onchange =
      () => {

        deliveryTimeValue =
          select.value;

        updatePlaceButton();
      };


    /*
      If shop is currently closed and no slots are
      available today, show a useful message.
    */

    if (!slots.length) {

      select.innerHTML = `
        <option value="">
          No delivery slots available today
        </option>
      `;
    }
  }


  /* =======================================================
     PAYMENT BLOCK
  ======================================================= */

  function buildPaymentBlock() {

    const box =
      $('pay');

    if (!box) return;


    const prebook =
      cartHasPrebook();


    /*
      If delivery unavailable, payment isn't useful yet.
    */

    if (
      locationResult &&
      !locationResult.available
    ) {

      box.innerHTML = `
        <div class="payment-warning">
          ❌ Delivery is not available at this location.
        </div>
      `;

      return;
    }


    const payment =
      config?.payment ||
      {};


    const bkash =
      payment.bkash ||
      '01792494275';


    const nagad =
      payment.nagad ||
      '01792494275';


    /*
      PREBOOK = ONLINE PAYMENT ONLY
    */

    if (prebook) {

      paymentMethodValue =
        paymentMethodValue ||
        'bkash';


      box.innerHTML = `
        <div class="payment-box">

          <h3>
            💳 Payment
          </h3>

          <p>
            Pre-order items require
            full advance payment.
          </p>


          <label class="payment-option">

            <input
              type="radio"
              name="paymentMethod"
              value="bkash"
              ${
                paymentMethodValue ===
                'bkash'
                  ? 'checked'
                  : ''
              }
            >

            <span>
              bKash — Send Money Only
            </span>

          </label>


          <label class="payment-option">

            <input
              type="radio"
              name="paymentMethod"
              value="nagad"
              ${
                paymentMethodValue ===
                'nagad'
                  ? 'checked'
                  : ''
              }
            >

            <span>
              Nagad — Send Money Only
            </span>

          </label>


          <div class="payment-number">

            <b>
              bKash:
            </b>

            ${esc(bkash)}

            <br>

            <b>
              Nagad:
            </b>

            ${esc(nagad)}

            <br>

            <small>
              Send Money only.
            </small>

          </div>


          <input
            id="tx"
            type="text"
            inputmode="numeric"
            maxlength="50"
            placeholder="Transaction ID / Last 5 digits *"
          >

          <small>
            Enter your transaction ID
            or the last 5 digits of the
            transaction number.
          </small>

        </div>
      `;


    } else {

      /*
        NORMAL ORDER
      */

      if (
        locationResult &&
        locationResult.cod
      ) {

        paymentMethodValue =
          paymentMethodValue ||
          'cod';


        box.innerHTML = `
          <div class="payment-box">

            <h3>
              💳 Payment Method
            </h3>


            <label class="payment-option">

              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                ${
                  paymentMethodValue ===
                  'cod'
                    ? 'checked'
                    : ''
                }
              >

              <span>
                💵 Cash on Delivery
              </span>

            </label>


            <label class="payment-option">

              <input
                type="radio"
                name="paymentMethod"
                value="bkash"
                ${
                  paymentMethodValue ===
                  'bkash'
                    ? 'checked'
                    : ''
                }
              >

              <span>
                bKash — Send Money Only
              </span>

            </label>


            <label class="payment-option">

              <input
                type="radio"
                name="paymentMethod"
                value="nagad"
                ${
                  paymentMethodValue ===
                  'nagad'
                    ? 'checked'
                    : ''
                }
              >

              <span>
                Nagad — Send Money Only
              </span>

            </label>


            <div
              id="onlinePaymentDetails"
              style="display:${
                paymentMethodValue ===
                'cod'
                  ? 'none'
                  : 'block'
              }"
            >

              <div class="payment-number">

                <b>
                  bKash:
                </b>

                ${esc(bkash)}

                <br>

                <b>
                  Nagad:
                </b>

                ${esc(nagad)}

                <br>

                <small>
                  Send Money only.
                </small>

              </div>


              <input
                id="tx"
                type="text"
                inputmode="numeric"
                maxlength="50"
                placeholder="Transaction ID / Last 5 digits *"
              >

            </div>

          </div>
        `;

      } else {

        /*
          1–4 km = ONLINE PAYMENT REQUIRED
        */

        paymentMethodValue =
          paymentMethodValue ===
            'nagad'
            ? 'nagad'
            : 'bkash';


        box.innerHTML = `
          <div class="payment-box">

            <h3>
              💳 Online Payment Required
            </h3>

            <p>
              COD is not available
              for this delivery location.
            </p>


            <label class="payment-option">

              <input
                type="radio"
                name="paymentMethod"
                value="bkash"
                ${
                  paymentMethodValue ===
                  'bkash'
                    ? 'checked'
                    : ''
                }
              >

              <span>
                bKash — Send Money Only
              </span>

            </label>


            <label class="payment-option">

              <input
                type="radio"
                name="paymentMethod"
                value="nagad"
                ${
                  paymentMethodValue ===
                  'nagad'
                    ? 'checked'
                    : ''
                }
              >

              <span>
                Nagad — Send Money Only
              </span>

            </label>


            <div class="payment-number">

              <b>
                bKash:
              </b>

              ${esc(bkash)}

              <br>

              <b>
                Nagad:
              </b>

              ${esc(nagad)}

              <br>

              <small>
                Send Money only.
              </small>

            </div>


            <input
              id="tx"
              type="text"
              inputmode="numeric"
              maxlength="50"
              placeholder="Transaction ID / Last 5 digits *"
            >

          </div>
        `;
      }
    }


    setupPaymentEvents();

    updatePlaceButton();
  }


  /* =======================================================
     PAYMENT EVENTS
  ======================================================= */

  function setupPaymentEvents() {

    document
      .querySelectorAll(
        'input[name="paymentMethod"]'
      )
      .forEach(
        radio => {

          radio.addEventListener(
            'change',
            () => {

              paymentMethodValue =
                radio.value;


              if (
                !cartHasPrebook() &&
                locationResult?.cod
              ) {

                const online =
                  $('onlinePaymentDetails');


                if (online) {

                  online.style.display =
                    radio.value === 'cod'
                      ? 'none'
                      : 'block';
                }
              }


              updatePlaceButton();
            }
          );
        }
      );


    const tx =
      $('tx');

    if (tx) {

      tx.addEventListener(
        'input',
        () => {
          updatePlaceButton();
        }
      );
    }
  }


  /* =======================================================
     PREBOOK SECTION
  ======================================================= */

  function buildPrebookSection() {

    const existing =
      $('prebookSection');

    if (existing) {
      existing.remove();
    }


    if (
      !cartHasPrebook()
    ) {
      return;
    }


    const pay =
      $('pay');

    if (!pay) return;


    const section =
      document.createElement(
        'div'
      );


    section.id =
      'prebookSection';


    section.className =
      'prebook-section';


    section.innerHTML = `
      <h3>
        🕐 Pre-order Date & Time
      </h3>

      <p>
        Your cart contains a pre-order item.
        Please select a future delivery date and time.
      </p>

      <label>
        Delivery Date

        <input
          id="prebookDate"
          type="date"
        >
      </label>


      <label>
        Delivery Time

        <select id="prebookTime">
          <option value="">
            Select time
          </option>
        </select>
      </label>
    `;


    pay.parentNode.insertBefore(
      section,
      pay
    );


    setupPrebookDateTime();
  }


  /* =======================================================
     PREBOOK DATE/TIME
  ======================================================= */

  function setupPrebookDateTime() {

    const dateInput =
      $('prebookDate');

    const timeSelect =
      $('prebookTime');


    if (
      !dateInput ||
      !timeSelect
    ) {
      return;
    }


    /*
      Tomorrow minimum.
    */

    const tomorrow =
      new Date();

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );


    const minDate =
      dhakaDateKey(
        tomorrow
      );


    dateInput.min =
      minDate;


    if (
      prebookDateValue &&
      prebookDateValue >= minDate
    ) {

      dateInput.value =
        prebookDateValue;

    } else {

      dateInput.value =
        minDate;

      prebookDateValue =
        minDate;
    }


    buildPrebookTimeOptions();


    dateInput.addEventListener(
      'change',
      () => {

        prebookDateValue =
          dateInput.value;

        prebookTimeValue =
          '';

        buildPrebookTimeOptions();

        updatePlaceButton();
      }
    );


    timeSelect.addEventListener(
      'change',
      () => {

        prebookTimeValue =
          timeSelect.value;

        updatePlaceButton();
      }
    );
  }


  /* =======================================================
     PREBOOK TIME OPTIONS
  ======================================================= */

  function buildPrebookTimeOptions() {

    const select =
      $('prebookTime');

    const dateInput =
      $('prebookDate');


    if (
      !select ||
      !dateInput?.value
    ) {
      return;
    }


    /*
      Parse selected date safely as Bangladesh date.
    */

    const [year, month, day] =
      dateInput.value
        .split('-')
        .map(Number);


    /*
      Create a UTC representation whose weekday
      can be calculated in Bangladesh.
    */

    const date =
      new Date(
        Date.UTC(
          year,
          month - 1,
          day,
          6,
          0,
          0
        )
      );


    const slots =
      buildDeliveryTimeSlots(
        date,
        false
      );


    select.innerHTML = `
      <option value="">
        Select time
      </option>

      ${slots.map(
        slot => {

          const parsed =
            new Date(
              slot.value
            );


          const p =
            getDhakaParts(
              parsed
            );


          const minutes =
            p.hour * 60 +
            p.minute;


          return `
            <option
              value="${esc(slot.value)}"
              ${
                slot.value ===
                prebookTimeValue
                  ? 'selected'
                  : ''
              }
            >
              ${esc(
                formatTime(minutes)
              )}
            </option>
          `;
        }
      ).join('')}
    `;
  }


  function setupPrebookEvents() {

    /*
      Remove stale prebook section first.
    */

    const existing =
      $('prebookSection');

    if (existing) {
      existing.remove();
    }


    buildPrebookSection();
  }


  /* =======================================================
     CHECKOUT SUMMARY
  ======================================================= */

  function refreshCheckoutSummary() {

    const sum =
      $('sum');

    if (!sum) return;


    const subtotal =
      getSubtotal();


    const delivery =
      locationResult?.available
        ? num(
            locationResult.charge
          )
        : 0;


    const total =
      subtotal +
      delivery;


    sum.innerHTML = `
      <div class="checkout-summary">

        <div>
          <span>
            Food Subtotal
          </span>

          <b>
            ৳${subtotal}
          </b>
        </div>


        <div>
          <span>
            Delivery Charge
          </span>

          <b>
            ${
              locationResult
                ? `৳${delivery}`
                : '—'
            }
          </b>
        </div>


        <hr>


        <div>
          <strong>
            Total
          </strong>

          <strong>
            ৳${total}
          </strong>
        </div>

      </div>
    `;
  }


  /* =======================================================
     PREBOOK DATE VALIDATION
  ======================================================= */

  function validatePrebookSelection() {

    if (
      !cartHasPrebook()
    ) {
      return {
        ok: true,
        value: null
      };
    }


    const date =
      $('prebookDate')?.value ||
      prebookDateValue;


    const time =
      $('prebookTime')?.value ||
      prebookTimeValue;


    if (!date) {

      return {
        ok: false,
        message:
          'Please select a pre-order date.'
      };
    }


    if (!time) {

      return {
        ok: false,
        message:
          'Please select a pre-order time.'
      };
    }


    const selected =
      new Date(time);


    if (
      Number.isNaN(
        selected.getTime()
      )
    ) {

      return {
        ok: false,
        message:
          'Invalid pre-order time.'
      };
    }


    const todayKey =
      dhakaDateKey(
        new Date()
      );


    const selectedKey =
      dhakaDateKey(
        selected
      );


    if (
      selectedKey <= todayKey
    ) {

      return {
        ok: false,
        message:
          'Pre-order must be for a future date.'
      };
    }


    const p =
      getDhakaParts(
        selected
      );


    if (
      p.minute % 30 !== 0
    ) {

      return {
        ok: false,
        message:
          'Delivery time must be a 30-minute slot.'
      };
    }


    const window =
      getOrderWindow(
        selected
      );


    const minutes =
      p.hour * 60 +
      p.minute;


    if (
      minutes <
        window.start ||
      minutes >
        window.end
    ) {

      return {
        ok: false,
        message:
          'Selected time is outside the allowed delivery window.'
      };
    }


    return {
      ok: true,
      value:
        selected.toISOString()
    };
  }


  /* =======================================================
     NORMAL DELIVERY TIME VALIDATION
  ======================================================= */

  function validateNormalDeliveryTime() {

    if (
      cartHasPrebook()
    ) {

      return {
        ok: true,
        value: null
      };
    }


    const value =
      $('time')?.value ||
      deliveryTimeValue;


    if (!value) {

      return {
        ok: false,
        message:
          'Please select a delivery time.'
      };
    }


    const selected =
      new Date(value);


    if (
      Number.isNaN(
        selected.getTime()
      )
    ) {

      return {
        ok: false,
        message:
          'Invalid delivery time.'
      };
    }


    const now =
      new Date();


    if (
      selected.getTime() <=
      now.getTime()
    ) {

      return {
        ok: false,
        message:
          'Please select a future delivery time.'
      };
    }


    /*
      Normal order = today only.
    */

    if (
      dhakaDateKey(selected) !==
      dhakaDateKey(now)
    ) {

      return {
        ok: false,
        message:
          'Normal orders are available for today only.'
      };
    }


    const p =
      getDhakaParts(
        selected
      );


    if (
      p.minute % 30 !== 0
    ) {

      return {
        ok: false,
        message:
          'Delivery time must be a 30-minute slot.'
      };
    }


    const window =
      getOrderWindow(
        selected
      );


    const minutes =
      p.hour * 60 +
      p.minute;


    if (
      minutes <
        window.start ||
      minutes >
        window.end
    ) {

      return {
        ok: false,
        message:
          'Selected delivery time is outside the allowed order window.'
      };
    }


    return {
      ok: true,
      value:
        selected.toISOString()
    };
  }


  /* =======================================================
     PAYMENT VALIDATION
  ======================================================= */

  function getSelectedPayment() {

    const selected =
      document.querySelector(
        'input[name="paymentMethod"]:checked'
      );


    return (
      selected?.value ||
      paymentMethodValue ||
      ''
    );
  }


  function getTransactionId() {

    return (
      $('tx')?.value.trim() ||
      ''
    );
  }


  function validatePayment() {

    const prebook =
      cartHasPrebook();


    const payment =
      getSelectedPayment();


    if (prebook) {

      if (
        payment !== 'bkash' &&
        payment !== 'nagad'
      ) {

        return {
          ok: false,

          message:
            'Pre-order requires bKash or Nagad online payment.'
        };
      }
    }


    if (
      !prebook &&
      locationResult?.cod &&
      payment === 'cod'
    ) {

      return {
        ok: true,

        payment
      };
    }


    if (
      payment !== 'bkash' &&
      payment !== 'nagad'
    ) {

      return {
        ok: false,

        message:
          'Please select a payment method.'
      };
    }


    const tx =
      getTransactionId();


    if (
      !tx ||
      !/^\d{5,50}$/.test(tx)
    ) {

      return {
        ok: false,

        message:
          'Please enter a valid transaction ID or at least 5 digits.'
      };
    }


    return {
      ok: true,

      payment,

      transactionId:
        tx
    };
  }


  /* =======================================================
     UPDATE PLACE BUTTON
  ======================================================= */

  function updatePlaceButton() {

    const button =
      $('place');

    if (!button) return;


    let disabled = false;


    if (
      !isCustomerLoggedInSafe()
    ) {
      disabled = true;
    }


    if (
      locationResult &&
      !locationResult.available
    ) {
      disabled = true;
    }


    button.disabled =
      disabled;
  }


  /* =======================================================
     PLACE ORDER
  ======================================================= */

  async function place() {

    /*
      Login check
    */

    if (
      !requireCustomerLoginSafe()
    ) {
      return;
    }


    if (!cart.length) {

      alert(
        'Your cart is empty.'
      );

      return;
    }


    /*
      Location check
    */

    if (
      !selectedLocation
    ) {

      alert(
        'Please select your delivery location.'
      );

      return;
    }


    if (
      !locationResult
    ) {

      alert(
        'Please wait while we check your delivery location.'
      );

      return;
    }


    if (
      !locationResult.available
    ) {

      alert(
        'Sorry, delivery is unavailable at this location.'
      );

      return;
    }


    /*
      Customer fields
    */

    const customer =
      getCustomerDataSafe();


    const name =
      $('name')?.value.trim() ||
      customer?.name ||
      customer?.fullName ||
      '';


    const phone =
      $('phone')?.value.trim() ||
      customer?.phone ||
      customer?.mobile ||
      '';


    const house =
      $('house')?.value.trim() ||
      '';


    const road =
      $('road')?.value.trim() ||
      '';


    const note =
      $('note')?.value.trim() ||
      '';


    if (!name) {

      alert(
        'Please enter your name.'
      );

      return;
    }


    if (!phone) {

      alert(
        'Please enter your phone number.'
      );

      return;
    }


    /*
      Account phone must match checkout phone
      when backend provides account phone.
    */

    const accountPhone =
      String(
        customer?.phone ||
        customer?.mobile ||
        ''
      ).replace(
        /\D/g,
        ''
      );


    const checkoutPhone =
      String(
        phone
      ).replace(
        /\D/g,
        ''
      );


    if (
      accountPhone &&
      checkoutPhone &&
      accountPhone !==
        checkoutPhone
    ) {

      alert(
        'Checkout phone number must match your customer account phone number.'
      );

      return;
    }


    /*
      Delivery time
    */

    let deliveryTimeResult;


    if (
      cartHasPrebook()
    ) {

      deliveryTimeResult =
        validatePrebookSelection();

    } else {

      deliveryTimeResult =
        validateNormalDeliveryTime();
    }


    if (
      !deliveryTimeResult.ok
    ) {

      alert(
        deliveryTimeResult.message
      );

      return;
    }


    /*
      Payment
    */

    const paymentResult =
      validatePayment();


    if (
      !paymentResult.ok
    ) {

      alert(
        paymentResult.message
      );

      return;
    }


    /*
      Build items.
      
      IMPORTANT:
      sizeIndex is sent to backend.
      Backend must calculate price from menu,
      not trust browser price.
    */

    const items =
      cart.map(
        item => {

          const product =
            findProduct(
              item.id
            );


          if (!product) {
            return null;
          }


          const pricing =
            getItemPricing(
              product,
              item
            );


          return {

            id:
              product.id,

            name:
              product.name,

            cat:
              product.cat,

            qty:
              num(
                item.qty,
                1
              ),

            sizeIndex:
              pricing.sizeIndex,

            choice:
              pricing.label,

            /*
              Sent only for display compatibility.
              Backend MUST recalculate.
            */

            price:
              pricing.price
          };
        }
      )
        .filter(Boolean);


    if (!items.length) {

      alert(
        'Your cart contains unavailable items.'
      );

      return;
    }


    /*
      Disable button while submitting.
    */

    const button =
      $('place');


    const oldText =
      button?.textContent ||
      'Place Order';


    if (button) {

      button.disabled = true;

      button.textContent =
        'Placing Order...';
    }


    try {

      const token =
        getCustomerTokenSafe();


      const payload = {

        items,

        customerName:
          name,

        customerPhone:
          phone,

        house,

        road,

        note,


        deliveryLocation: {

          lat:
            selectedLocation.lat,

          lng:
            selectedLocation.lng
        },


        /*
          Backend should calculate this too.
        */

        deliveryTime:
          deliveryTimeResult.value,


        paymentMethod:
          paymentResult.payment,


        transactionId:
          paymentResult.transactionId ||
          '',


        prebook:
          cartHasPrebook()
      };


      const response =
        await fetch(
          '/api/orders',
          {
            method: 'POST',

            headers: {

              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`
            },

            body:
              JSON.stringify(
                payload
              )
          }
        );


      let data = {};

      try {

        data =
          await response.json();

      } catch (e) {}


      if (!response.ok) {

        throw new Error(
          data?.message ||
          data?.error ||
          'Order could not be placed.'
        );
      }


      /*
        Success
      */

      const orderNumber =
        data?.order?.orderNumber ||
        data?.orderNumber ||
        data?.id ||
        '';


      const result =
        $('result');


      if (result) {

        result.innerHTML = `
          <div class="order-success">

            <h3>
              ✅ Order Placed Successfully
            </h3>

            ${
              orderNumber
                ? `
                  <p>
                    Order Number:
                    <b>
                      ${esc(
                        orderNumber
                      )}
                    </b>
                  </p>
                `
                : ''
            }

            <p>
              Thank you for ordering
              from Chef Sifat's Kitchen.
            </p>

            <button
              type="button"
              class="btn"
              onclick="closeCheckout();openMyOrdersSafe()"
            >
              📦 View My Orders
            </button>

          </div>
        `;
      }


      /*
        Clear cart after successful order.
      */

      cart = [];

      saveCart();

      cartUI();


      /*
        Reset location result.
      */

      locationResult =
        null;

      selectedLocation =
        null;


      /*
        Reset payment/time state.
      */

      paymentMethodValue =
        '';

      deliveryTimeValue =
        '';

      prebookDateValue =
        '';

      prebookTimeValue =
        '';


      /*
        Keep success modal open briefly.
      */

    } catch (error) {

      console.error(
        'Order error:',
        error
      );


      alert(
        error.message ||
        'Could not place order. Please try again.'
      );

    } finally {

      if (button) {

        button.disabled =
          false;

        button.textContent =
          oldText;
      }

      updatePlaceButton();
    }
  }


  /* =======================================================
     SAFE MY ORDERS
  ======================================================= */

  function openMyOrdersSafe() {

    if (
      typeof window.openMyOrders ===
      'function'
    ) {

      window.openMyOrders();

      return;
    }


    openCustomerLoginSafe(
      'login'
    );
  }


  /* =======================================================
     INITIAL RENDER
  ======================================================= */

  async function init() {

    updateCartCount();

    cartUI();

    render();


    await Promise.all([
      loadConfig(),
      loadMenu()
    ]);


    updateAccountButtonFallback();
  }


  /* =======================================================
     ACCOUNT BUTTON FALLBACK
  ======================================================= */

  function updateAccountButtonFallback() {

    const button =
      $('customerAccountBtn');

    if (!button) return;


    if (
      isCustomerLoggedInSafe()
    ) {

      const customer =
        getCustomerDataSafe();


      const name =
        customer?.name ||
        customer?.fullName ||
        'Account';


      button.textContent =
        `👤 ${name}`;

    } else {

      button.textContent =
        '👤 Login';
    }
  }


  /* =======================================================
     MOBILE NAV
  ======================================================= */

  function toggleMobileMenu() {

    const nav =
      $('mainNav');

    const button =
      $('mobileMenuBtn');


    if (!nav) return;


    nav.classList.toggle(
      'mobile-open'
    );


    const open =
      nav.classList.contains(
        'mobile-open'
      );


    if (button) {

      button.setAttribute(
        'aria-expanded',
        open
          ? 'true'
          : 'false'
      );
    }
  }


  function closeMobileMenu() {

    const nav =
      $('mainNav');

    const button =
      $('mobileMenuBtn');


    if (nav) {

      nav.classList.remove(
        'mobile-open'
      );
    }


    if (button) {

      button.setAttribute(
        'aria-expanded',
        'false'
      );
    }
  }


  /* =======================================================
     CLOSE MODAL ON OUTSIDE CLICK
  ======================================================= */

  document.addEventListener(
    'click',
    event => {

      const modal =
        $('modal');


      if (
        modal &&
        modal.style.display ===
          'flex' &&
        event.target === modal
      ) {

        closeCheckout();
      }

    }
  );


  /* =======================================================
     ESC KEY
  ======================================================= */

  document.addEventListener(
    'keydown',
    event => {

      if (
        event.key ===
        'Escape'
      ) {

        closeCart();

        closeCheckout();
      }
    }
  );


  /* =======================================================
     PUBLIC APP FUNCTIONS
     
     IMPORTANT:
     We export ONLY app functions.
     We do NOT overwrite customer auth functions.
  ======================================================= */

  window.render =
    render;

  window.setCategory =
    setCategory;

  window.add =
    add;

  window.changeQty =
    changeQty;

  window.removeItem =
    removeItem;

  window.openCart =
    openCart;

  window.closeCart =
    closeCart;

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

  window.loadMenu =
    loadMenu;

  window.toggleMobileMenu =
    toggleMobileMenu;

  window.closeMobileMenu =
    closeMobileMenu;


  /* =======================================================
     START APP
  ======================================================= */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init
    );

  } else {

    init();
  }

})();
