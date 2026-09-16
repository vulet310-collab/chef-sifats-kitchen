javascript
/* =========================================================
   CHEF SIFAT'S KITCHEN
   FULL CORRECTED APP.JS
========================================================= */

let C = null;
let cart = JSON.parse(localStorage.getItem('cskCart') || '[]');
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
   CUSTOMER AUTH SAFE HELPERS
   IMPORTANT:
   These functions MUST NOT crash if customer-auth.js
   loads after app.js.
========================================================= */

function customerToken() {

  try {

    if (
      typeof window.getCustomerToken === 'function'
    ) {

      return (
        window.getCustomerToken() || ''
      );

    }

  } catch (_) {}

  try {

    return (
      localStorage.getItem(
        'csk_customer_token'
      ) || ''
    );

  } catch (_) {

    return '';

  }

}


function customerData() {

  try {

    if (
      typeof window.getCustomerData === 'function'
    ) {

      return (
        window.getCustomerData() || null
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

  } catch (e) {

    console.error(
      'openAuthModal error:',
      e
    );

  }

  try {

    if (
      typeof window.openCustomerAuth ===
      'function' &&
      window.openCustomerAuth !==
      openCustomerLogin
    ) {

      window.openCustomerAuth(mode);
      return;

    }

  } catch (e) {

    console.error(
      'openCustomerAuth error:',
      e
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

    } catch (e) {

      console.warn(
        'Config request failed:',
        e
      );

    }


    if (!config) {

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
       FALLBACK /api/menu
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

            menu =
              menuData;

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

      } catch (e) {

        console.warn(
          'Menu request failed:',
          e
        );

      }

    }


    /* -----------------------------------------------------
       NORMALIZED CONFIG
    ----------------------------------------------------- */

    C = {

      ...config,

      menu:
        Array.isArray(menu)
          ? menu
          : [],

      settings:
        config.settings || {}

    };


    /* -----------------------------------------------------
       CLEAN CART
    ----------------------------------------------------- */

    cart =
      cart.filter(item =>
        C.menu.some(p =>
          String(p.id) ===
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
              padding:25px;
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

  } catch (e) {

    console.error(
      'Website initialization error:',
      e
    );

    const grid =
      $('#grid');

    if (grid) {

      grid.innerHTML = `

        <div
          style="
            grid-column:1/-1;
            padding:25px;
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

      return (
        categoryOK &&
        nameOK
      );

    });

  const grid =
    $('#grid');

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
                          this.remo

