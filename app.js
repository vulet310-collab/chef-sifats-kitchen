const SETTINGS = {
  whatsapp: '8801792494275',
  payment: '01792494275',
  facebook: 'https://web.facebook.com/ChefSifatsKitchen'
};

/* =========================
   DELIVERY LOCATION SETTINGS
========================= */

const BASE_LOCATION = {
  lat: 23.3022494,
  lng: 90.9187528,
  name: 'Kahalthuri Hamidia High School'
};

const COD_RADIUS_KM = 1.0;
const MAX_DELIVERY_RADIUS_KM = 4.0;
const DELIVERY_RATE_PER_KM = 10;


/* =========================
   MENU
========================= */

const DEFAULT_MENU = [

  {
    name:'BBQ Chicken Pizza',
    cat:'pizza',
    image:'assets/bbq-chicken-pizza.jpg',
    prices:{
      '6″':300,
      '8″':380,
      '10″':480,
      '12″':580
    }
  },

  {
    name:'Meat Pizza',
    cat:'pizza',
    image:'assets/meat-pizza.jpg',
    prices:{
      '6″':350,
      '8″':450,
      '10″':550,
      '12″':650
    }
  },

  {
    name:'Flaming Chicken Pizza',
    cat:'pizza',
    image:'assets/flaming-chicken-pizza.jpg',
    prices:{
      '6″':300,
      '8″':350,
      '10″':450,
      '12″':550
    }
  },

  {
    name:'6 Season Pizza',
    cat:'pizza',
    image:'assets/6-season-pizza.jpg',
    prices:{
      '6″':350,
      '8″':420,
      '10″':500,
      '12″':600
    }
  },

  {
    name:'Margherita Pizza',
    cat:'pizza',
    image:'assets/margherita-pizza.jpg',
    prices:{
      '6″':280,
      '8″':350,
      '10″':420,
      '12″':500
    }
  },

  {
    name:'Neapolitan BBQ Chicken Pizza',
    cat:'pizza',
    image:'assets/neapolitan-bbq-chicken-pizza.jpg',
    prices:{
      '8″':450,
      '10″':600,
      '12″':750
    }
  },

  {
    name:'Neapolitan Meat Pizza',
    cat:'pizza',
    image:'assets/neapolitan-meat-pizza.jpg',
    prices:{
      '8″':500,
      '10″':650,
      '12″':800
    }
  },

  {
    name:'Neapolitan Margherita Pizza',
    cat:'pizza',
    image:'assets/neapolitan-margherita-pizza.jpg',
    prices:{
      '6″':350,
      '8″':450,
      '10″':550,
      '12″':650
    }
  },

  {
    name:'Emergency BBQ Chicken Pizza',
    cat:'pizza',
    image:'assets/emergency-bbq-chicken-pizza.jpg',
    prices:{
      '8″':400,
      '10″':550,
      '12″':700
    }
  },

  {
    name:'Emergency Meat Pizza',
    cat:'pizza',
    image:'assets/emergency-meat-pizza.jpg',
    prices:{
      '8″':450,
      '10″':600,
      '12″':750
    }
  },

  {
    name:'Emergency Margherita Pizza',
    cat:'pizza',
    image:'assets/emergency-margherita-pizza.jpg',
    prices:{
      '6″':300,
      '8″':400,
      '10″':500,
      '12″':600
    }
  },

  {
    name:'Chicken Momo',
    cat:'momo',
    image:'assets/chicken-momo.jpg',
    prices:{
      '6 pcs':120,
      '10 pcs':200
    }
  },

  {
    name:'Vegetable Momo',
    cat:'momo',
    image:'assets/vegetable-momo.jpg',
    prices:{
      '6 pcs':100,
      '10 pcs':160
    }
  },

  {
    name:'BBQ Chicken Momo',
    cat:'momo',
    image:'assets/bbq-chicken-momo.jpg',
    prices:{
      '6 pcs':160,
      '10 pcs':250
    }
  },

  {
    name:'Cheese Chicken Momo',
    cat:'momo',
    image:'assets/cheese-chicken-momo.jpg',
    prices:{
      '6 pcs':180,
      '10 pcs':300
    }
  },

  {
    name:'Prawns Cocktail',
    cat:'continental',
    image:'assets/prawns-cocktail.png',
    prices:{
      '5–6 pcs / 1 person':350,
      '10–12 pcs / 2 persons':700
    }
  },

  {
    name:'Grilled Fish with Special Fried Potato',
    cat:'continental',
    image:'assets/grilled-fish.png',
    prices:{
      '1 person':380,
      '2 persons':700
    }
  },

  {
    name:'Coleslaw Salad',
    cat:'continental',
    image:'assets/coleslaw.png',
    prices:{
      '1 serving':80
    }
  },

  {
    name:'Authentic Kacchi Biryani (Full)',
    cat:'kacchi',
    image:'assets/authentic-kacchi.jpg',
    prices:{
      '1 person':399
    },
    minQty:2,
    maxQty:20,
    note:'Minimum order: 2 persons • Pre-booking required'
  },

  {
    name:'Beef Kacchi Biryani',
    cat:'kacchi',
    image:'assets/beef-kacchi.jpg',
    prices:{
      '1 person':349
    },
    minQty:2,
    maxQty:20,
    note:'Minimum order: 2 persons • Pre-booking required'
  }

];

let MENU =
  JSON.parse(localStorage.getItem('chefSifatMenu') || 'null')
  || DEFAULT_MENU;

let activeFilter = 'all';

let cart =
  JSON.parse(localStorage.getItem('chefSifatCart5') || '[]');

let map = null;
let deliveryMarker = null;
let selectedLocation = null;


/* =========================
   HELPERS
========================= */

const money = n =>
  '৳' + Number(n).toLocaleString('en-BD');

const isPrebook = cat =>
  ['continental','kacchi'].includes(cat);

function saveMenu(){
  localStorage.setItem(
    'chefSifatMenu',
    JSON.stringify(MENU)
  );
}


/* =========================
   MENU
========================= */

function renderMenu(){

  const searchInput = document.getElementById('search');

  const q =
    (searchInput?.value || '')
    .toLowerCase()
    .trim();

  const grid =
    document.getElementById('menuGrid');

  const list = MENU.filter(x =>

    (activeFilter === 'all' || x.cat === activeFilter)

    &&

    (!q || x.name.toLowerCase().includes(q))

  );

  if(!list.length){

    grid.innerHTML =
      '<div class="empty">No dishes found. Try another search.</div>';

    return;
  }

  grid.innerHTML = list.map((p,i) => {

    const choices =
      Object.entries(p.prices);

    const menuIndex =
      MENU.indexOf(p);

    return `
      <article class="food-card">

        <div class="food-photo">

          <img
            src="${p.image}"
            alt="${p.name}"
            loading="lazy"
          >

          <span class="tag">
            ${p.cat.toUpperCase()}
          </span>

        </div>

        <div class="food-body">

          <h3>${p.name}</h3>

          <p>
            ${
              p.note ||
              'Chef-crafted with quality ingredients and prepared fresh to order.'
            }
          </p>

          <div class="price-list">

            ${
              choices.map(([k,v]) => `
                <span class="price-pill">
                  ${k}
                  <b>${money(v)}</b>
                </span>
              `).join('')
            }

          </div>

          <div class="add-row">

            <select
              class="select-size"
              id="size-${i}"
            >

              ${
                choices.map(([k,v]) => `
                  <option value="${k}">
                    ${k} — ${money(v)}
                  </option>
                `).join('')
              }

            </select>

            <button
              class="add"
              onclick="addToCart(
                ${menuIndex},
                document.getElementById('size-${i}').value
              )"
            >
              Add
            </button>

          </div>

        </div>

      </article>
    `;

  }).join('');
}


/* =========================
   CART
========================= */

function addToCart(index, choice){

  const p = MENU[index];

  const price = p.prices[choice];

  const key =
    p.name + '|' + choice;

  let found =
    cart.find(x => x.key === key);

  if(found){

    found.qty++;

  }else{

    cart.push({
      key,
      name:p.name,
      cat:p.cat,
      choice,
      price,
      qty:1,
      minQty:p.minQty || 1,
      maxQty:p.maxQty || 99
    });

  }

  saveCart();

  toast('Added to cart ✓');

  openCart();
}


function saveCart(){

  localStorage.setItem(
    'chefSifatCart5',
    JSON.stringify(cart)
  );

  updateCount();

  renderCart();
}


function updateCount(){

  const count =
    cart.reduce(
      (sum,x) => sum + x.qty,
      0
    );

  const el =
    document.getElementById('cartCount');

  if(el){
    el.textContent = count;
  }
}


function openCart(){

  document
    .getElementById('cart')
    .classList.remove('hidden');

  renderCart();
}


function closeCart(){

  document
    .getElementById('cart')
    .classList.add('hidden');
}


function renderCart(){

  const box =
    document.getElementById('cartItems');

  if(!cart.length){

    box.innerHTML = `
      <div class="empty">
        Your cart is empty.
        <br>
        <span class="muted">
          Choose something delicious from the menu.
        </span>
      </div>
    `;

    document.getElementById('subtotal').textContent =
      '৳0';

    return;
  }

  box.innerHTML = `
    <div class="cart-lines">

      ${
        cart.map((x,i) => `

          <div class="cart-line">

            <div>

              <h4>${x.name}</h4>

              <small>
                ${x.choice} • ${money(x.price)} each
                ${
                  isPrebook(x.cat)
                    ? ' • Pre-booking'
                    : ''
                }
              </small>

            </div>

            <div class="qty">

              <button
                onclick="changeQty(${i},-1)"
              >
                −
              </button>

              <b>${x.qty}</b>

              <button
                onclick="changeQty(${i},1)"
              >
                +
              </button>

            </div>

            <button
              class="remove"
              onclick="removeItem(${i})"
            >
              Remove
            </button>

          </div>

        `).join('')
      }

    </div>
  `;

  const subtotal =
    cart.reduce(
      (sum,x) => sum + x.price * x.qty,
      0
    );

  document.getElementById('subtotal').textContent =
    money(subtotal);
}


function changeQty(i,n){

  const x = cart[i];

  const next =
    x.qty + n;

  if(next < 0) return;

  if(next === 0){

    cart.splice(i,1);

    saveCart();

    return;
  }

  if(x.cat === 'kacchi' && next < 2){

    toast(
      'Kacchi minimum order is 2 persons.'
    );

    return;
  }

  if(next > (x.maxQty || 99)){

    toast(
      `Maximum quantity is ${x.maxQty || 99}.`
    );

    return;
  }

  x.qty = next;

  saveCart();
}


function removeItem(i){

  cart.splice(i,1);

  saveCart();
}


/* =========================
   CHECKOUT
========================= */

function checkout(){

  if(!cart.length){

    toast('Add an item first.');

    return;
  }

  const badKacchi =
    cart.find(
      x => x.cat === 'kacchi' && x.qty < 2
    );

  if(badKacchi){

    toast(
      'Kacchi minimum order is 2 persons.'
    );

    return;
  }

  closeCart();

  document
    .getElementById('checkout')
    .classList.remove('hidden');

  resetLocation();

  buildCheckoutSummary();

  buildSlots();

  buildPaymentBlock();
}


function closeCheckout(){

  document
    .getElementById('checkout')
    .classList.add('hidden');
}


/* =========================
   CHECKOUT SUMMARY
========================= */

function buildCheckoutSummary(){

  const box =
    document.getElementById('checkoutSummary');

  const subtotal =
    cart.reduce(
      (sum,x) => sum + x.price * x.qty,
      0
    );

  box.innerHTML = `
    <div class="total">

      <span>Order Subtotal</span>

      <b>${money(subtotal)}</b>

    </div>
  `;
}


/* =========================
   PAYMENT
========================= */

function buildPaymentBlock(){

  const box =
    document.getElementById('paymentBlock');

  const hasPre =
    cart.some(
      x => isPrebook(x.cat)
    );

  if(hasPre){

    box.innerHTML = `
      <label>
        Payment method

        <select id="cPayment">

          <option>
            Full Payment — bKash Personal 01792494275
          </option>

          <option>
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

  }else{

    box.innerHTML = `
      <label>
        Payment method

        <select id="cPayment">

          <option id="codOption">
            Select location first
          </option>

          <option>
            bKash Personal — 01792494275
          </option>

          <option>
            Nagad Personal — 01792494275
          </option>

        </select>

      </label>
    `;

  }

  updateTransactionField();
}


function updateTransactionField(){

  const payment =
    document.getElementById('cPayment');

  const wrap =
    document.getElementById('cTxWrap');

  const tx =
    document.getElementById('cTx');

  if(!payment || !wrap || !tx)
    return;

  const value =
    payment.value || '';

  const required =
    value.startsWith('bKash') ||
    value.startsWith('Nagad') ||
    value.startsWith('Full Payment');

  if(required){

    wrap.style.display = 'block';

    tx.required = true;

  }else{

    wrap.style.display = 'none';

    tx.required = false;

    tx.value = '';

  }
}


/* =========================
   DELIVERY TIME
========================= */

function getShopHours(date){

  const day =
    date.getDay();

  // Friday
  if(day === 5){

    return {
      open:15,
      close:21
    };

  }

  return {
    open:11,
    close:19
  };
}


function buildSlots(){

  const box =
    document.getElementById('slotBlock');

  const needs =
    cart.some(
      x => isPrebook(x.cat)
    );

  if(!needs){

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

  let options = '';

  for(
    let d = new Date(start);
    d <= end;
    d.setMinutes(d.getMinutes() + 30)
  ){

    const hours =
      getShopHours(d);

    const hour =
      d.getHours();

    const minute =
      d.getMinutes();

    if(
      hour < hours.open ||
      hour >= hours.close
    ){
      continue;
    }

    const value =
      d.toISOString();

    const label =
      d.toLocaleString(
        'en-BD',
        {
          weekday:'short',
          month:'short',
          day:'numeric',
          hour:'numeric',
          minute:'2-digit'
        }
      );

    options += `
      <option value="${value}">
        ${label}
      </option>
    `;
  }

  if(!options){

    box.innerHTML = `
      <div class="payment-note">
        No pre-booking slot is currently available
        within the required 5–12 hour window.
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
        ${options}
      </select>

    </label>
  `;
}


/* =========================
   MAP
========================= */

function openLocationMap(){

  const mapBox =
    document.getElementById('deliveryMap');

  mapBox.style.display = 'block';

  if(!map){

    map =
      L.map('deliveryMap')
      .setView(
        [BASE_LOCATION.lat,BASE_LOCATION.lng],
        14
      );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom:19,
        attribution:'© OpenStreetMap contributors'
      }
    ).addTo(map);

    map.on('click', function(e){

      setDeliveryLocation(
        e.latlng.lat,
        e.latlng.lng
      );

    });

  }

  setTimeout(
    () => map.invalidateSize(),
    200
  );
}


function setDeliveryLocation(lat,lng){

  selectedLocation = {
    lat,
    lng
  };

  document.getElementById('cLat').value =
    lat.toFixed(7);

  document.getElementById('cLng').value =
    lng.toFixed(7);

  openLocationMap();

  if(deliveryMarker){

    deliveryMarker.setLatLng([lat,lng]);

  }else{

    deliveryMarker =
      L.marker(
        [lat,lng],
        {
          draggable:true
        }
      ).addTo(map);

    deliveryMarker.on(
      'dragend',
      function(e){

        const pos =
          e.target.getLatLng();

        setDeliveryLocation(
          pos.lat,
          pos.lng
        );

      }
    );

  }

  map.setView(
    [lat,lng],
    Math.max(map.getZoom(),15)
  );

  calculateDelivery(lat,lng);
  reverseGeocode(lat,lng);
}


/* =========================
   GPS
========================= */

function useCurrentLocation(){

  const status =
    document.getElementById('locationStatus');

  status.className =
    'location-status';

  status.innerHTML =
    '📍 Detecting your current location…';

  if(!navigator.geolocation){

    status.className =
      'location-status bad';

    status.innerHTML =
      'Your browser does not support GPS location. Please select the location on the map.';

    openLocationMap();

    return;
  }

  navigator.geolocation.getCurrentPosition(

    function(position){

      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;

      setDeliveryLocation(
        lat,
        lng
      );

    },

    function(error){

      status.className =
        'location-status bad';

      let message =
        'Unable to get your location.';

      if(error.code === 1){

        message =
          'Location permission was denied. Please allow location access in your browser, or select your location on the map.';

      }

      status.innerHTML =
        '❌ ' + message;

      openLocationMap();

    },

    {
      enableHighAccuracy:true,
      timeout:15000,
      maximumAge:0
    }

  );
}


/* =========================
   DISTANCE
========================= */

function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
){

  const R = 6371;

  const dLat =
    (lat2-lat1) *
    Math.PI / 180;

  const dLon =
    (lon2-lon1) *
    Math.PI / 180;

  const a =
    Math.sin(dLat/2) *
    Math.sin(dLat/2)

    +

    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *

    Math.sin(dLon/2) *
    Math.sin(dLon/2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1-a)
    );

  return R*c;
}


function calculateDelivery(lat,lng){

  const distance =
    calculateDistance(
      BASE_LOCATION.lat,
      BASE_LOCATION.lng,
      lat,
      lng
    );

  const distanceText =
    distance.toFixed(2) + ' km';

  document.getElementById(
    'locationDistance'
  ).textContent =
    distanceText;

  const status =
    document.getElementById(
      'locationStatus'
    );

  const result =
    document.getElementById(
      'deliveryResult'
    );

  const payment =
    document.getElementById(
      'cPayment'
    );

  const button =
    document.getElementById(
      'placeOrderBtn'
    );

  /* OUTSIDE DELIVERY AREA */

  if(distance > MAX_DELIVERY_RADIUS_KM){

    status.className =
      'location-status bad';

    status.innerHTML = `
      ❌ <b>Delivery unavailable</b><br>
      Your location is ${distanceText}
      from Kahalthuri.<br>
      We currently deliver only within
      ${MAX_DELIVERY_RADIUS_KM} km.
    `;

    result.style.display = 'block';

    result.innerHTML = `
      <div class="line">
        <span>Distance</span>
        <b>${distanceText}</b>
      </div>

      <div class="line">
        <span>Order status</span>
        <b>❌ Not available</b>
      </div>
    `;

    button.disabled = true;
    button.classList.add('disabled-order');

    if(payment){

      payment.value =
        'Select location first';

    }

    return;

  }

  button.disabled = false;
  button.classList.remove('disabled-order');

  /* KAHALTHURI / COD */

  if(distance <= COD_RADIUS_KM){

    status.className =
      'location-status good';

    status.innerHTML = `
      ✅ <b>Delivery available</b><br>
      Kahalthuri zone •
      Cash on Delivery available.
    `;

    result.style.display = 'block';

    result.innerHTML = `
      <div class="line">
        <span>Distance</span>
        <b>${distanceText}</b>
      </div>

      <div class="line">
        <span>Payment</span>
        <b>Cash on Delivery</b>
      </div>

      <div class="line">
        <span>Delivery charge</span>
        <b>৳0</b>
      </div>
    `;

    if(payment){

      payment.innerHTML = `
        <option>
          Cash on Delivery — Kahalthuri
        </option>

        <option>
          bKash Personal — 01792494275
        </option>

        <option>
          Nagad Personal — 01792494275
        </option>
      `;

    }

  }

  /* OUTSIDE KAHALTHURI BUT WITHIN 4 KM */

  else{

    const deliveryCharge =
      Math.ceil(distance) *
      DELIVERY_RATE_PER_KM;

    status.className =
      'location-status warning';

    status.innerHTML = `
      ⚠️ <b>Delivery available</b><br>
      Cash on Delivery is not available
      for this location.<br>
      Online payment is required.
    `;

    result.style.display = 'block';

    result.innerHTML = `
      <div class="line">
        <span>Distance</span>
        <b>${distanceText}</b>
      </div>

      <div class="line">
        <span>Payment</span>
        <b>Online Payment Required</b>
      </div>

      <div class="line">
        <span>Delivery charge</span>
        <b>${money(deliveryCharge)}</b>
      </div>
    `;

    if(payment){

      payment.innerHTML = `
        <option>
          bKash Personal — 01792494275
        </option>

        <option>
          Nagad Personal — 01792494275
        </option>
      `;

    }

  }

  updateTransactionField();

}


/* =========================
   REVERSE GEOCODING
========================= */

async function reverseGeocode(lat,lng){

  const addressBox =
    document.getElementById('cMapAddress');

  const status =
    document.getElementById('locationStatus');

  try{

    const url =
      'https://nominatim.openstreetmap.org/reverse' +
      `?format=jsonv2&lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lng)}` +
      '&zoom=18&addressdetails=1';

    const response =
      await fetch(
        url,
        {
          headers:{
            'Accept':'application/json'
          }
        }
      );

    if(!response.ok)
      throw new Error('Geocoding failed');

    const data =
      await response.json();

    const address =
      data.display_name ||
      `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    addressBox.value =
      address;

    const mapAddress =
      document.querySelector(
        '.map-address'
      );

    if(mapAddress){

      mapAddress.textContent =
        address;

    }else{

      const p =
        document.createElement('div');

      p.className =
        'map-address';

      p.textContent =
        '📌 ' + address;

      document
        .getElementById('locationStatus')
        .appendChild(p);

    }

  }catch(error){

    addressBox.value =
      `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  }

}


/* =========================
   RESET LOCATION
========================= */

function resetLocation(){

  selectedLocation = null;

  document.getElementById('cLat').value = '';
  document.getElementById('cLng').value = '';
  document.getElementById('cMapAddress').value = '';

  document.getElementById(
    'locationDistance'
  ).textContent = '';

  document.getElementById(
    'locationStatus'
  ).className =
    'location-status';

  document.getElementById(
    'locationStatus'
  ).innerHTML =
    'Please select your delivery location.';

  document.getElementById(
    'deliveryResult'
  ).style.display =
    'none';

  const button =
    document.getElementById(
      'placeOrderBtn'
    );

  button.disabled = false;
  button.classList.remove(
    'disabled-order'
  );

  const mapBox =
    document.getElementById(
      'deliveryMap'
    );

  mapBox.style.display =
    'none';

  if(deliveryMarker){

    deliveryMarker.remove();

    deliveryMarker = null;

  }

  if(map){

    map.remove();

    map = null;

  }

}


/* =========================
   PLACE ORDER
========================= */

function placeOrder(e){

  e.preventDefault();

  /* LOCATION REQUIRED */

  if(
    !selectedLocation ||
    !document.getElementById('cLat').value ||
    !document.getElementById('cLng').value
  ){

    alert(
      'Please select your delivery location first.'
    );

    return;
  }

  const lat =
    Number(
      document.getElementById('cLat').value
    );

  const lng =
    Number(
      document.getElementById('cLng').value
    );

  const distance =
    calculateDistance(
      BASE_LOCATION.lat,
      BASE_LOCATION.lng,
      lat,
      lng
    );

  /* OUTSIDE RANGE */

  if(distance > MAX_DELIVERY_RADIUS_KM){

    alert(
      'Sorry. Your delivery location is outside our 4 km delivery area.'
    );

    return;
  }

  const name =
    document
      .getElementById('cName')
      .value
      .trim();

  const phone =
    document
      .getElementById('cPhone')
      .value
      .trim()
      .replace(/[\s-]/g,'');

  const house =
    document
      .getElementById('cHouse')
      .value
      .trim();

  const road =
    document
      .getElementById('cRoad')
      .value
      .trim();

  const mapAddress =
    document
      .getElementById('cMapAddress')
      .value
      .trim();

  const payment =
    document
      .getElementById('cPayment')
      .value;

  const tx =
    document
      .getElementById('cTx')
      .value
      .trim();

  const note =
    document
      .getElementById('cNote')
      .value
      .trim();

  const hasPre =
    cart.some(
      x => isPrebook(x.cat)
    );

  /* PHONE VALIDATION */

  if(!/^01\d{9}$/.test(phone)){

    alert(
      'Please enter a valid Bangladesh mobile number.'
    );

    return;
  }

  /* DELIVERY CHARGE */

  let deliveryCharge = 0;

  let codAvailable = false;

  if(distance <= COD_RADIUS_KM){

    deliveryCharge = 0;

    codAvailable = true;

  }else{

    deliveryCharge =
      Math.ceil(distance) *
      DELIVERY_RATE_PER_KM;

    codAvailable = false;

  }

  /* PAYMENT VALIDATION */

  if(
    !hasPre &&
    !codAvailable &&
    (
      payment.startsWith('bKash') ||
      payment.startsWith('Nagad')
    ) &&
    !tx
  ){

    alert(
      'Online payment is required for this location. Please enter the Transaction ID.'
    );

    return;
  }

  if(
    hasPre &&
    !tx
  ){

    alert(
      'Full payment is required for pre-booking orders. Please enter the Transaction ID.'
    );

    return;
  }

  if(
    codAvailable &&
    payment.startsWith('Cash on Delivery')
  ){

    // No transaction ID required.

  }

  /* SUBTOTAL */

  const subtotal =
    cart.reduce(
      (sum,x) =>
        sum + x.price * x.qty,
      0
    );

  const total =
    subtotal + deliveryCharge;

  /* PREBOOK SLOT */

  let slot = '';

  if(hasPre){

    const slotEl =
      document.getElementById(
        'prebookSlot'
      );

    if(slotEl){

      slot = slotEl.value;

    }

  }

  /* ORDER TEXT */

  let text =
    `*NEW ORDER — CHEF SIFAT'S KITCHEN*\n\n`;

  text +=
    cart.map(x =>
      `• ${x.name} — ${x.choice} × ${x.qty} = ${money(x.price*x.qty)}`
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
    `\n*Map Address:* ${mapAddress || 'Selected on map'}`;

  text +=
    `\n*Distance:* ${distance.toFixed(2)} km`;

  text +=
    `\n*COD:* ${codAvailable ? 'Available' : 'Not Available'}`;

  text +=
    `\n*Payment:* ${payment}`;

  text +=
    `\n*Transaction ID:* ${tx || 'N/A'}`;

  text +=
    `\n*Location:* https://www.google.com/maps?q=${lat},${lng}`;

  if(slot){

    text +=
      `\n*Pre-booking:* ${new Date(slot).toLocaleString('en-BD')}`;

  }

  text +=
    `\n*Note:* ${note || 'None'}`;

  /* OPEN WHATSAPP */

  const whatsappUrl =
    `https://wa.me/${SETTINGS.whatsapp}?text=${encodeURIComponent(text)}`;

  window.open(
    whatsappUrl,
    '_blank',
    'noopener'
  );

  closeCheckout();

  cart = [];

  saveCart();

  toast(
    'Order details prepared ✓'
  );

}


/* =========================
   TOAST
========================= */

function toast(t){

  const x =
    document.createElement('div');

  x.textContent = t;

  x.style.cssText = `
    position:fixed;
    left:50%;
    bottom:25px;
    transform:translateX(-50%);
    z-index:9999;
    background:#e8a323;
    color:#111;
    padding:11px 18px;
    border-radius:999px;
    font-weight:800;
    box-shadow:0 10px 30px #000;
  `;

  document.body.appendChild(x);

  setTimeout(
    () => x.remove(),
    1800
  );
}


/* =========================
   CATEGORY BUTTONS
========================= */

document
  .querySelectorAll('.tab')
  .forEach(button => {

    button.addEventListener(
      'click',
      () => {

        document
          .querySelectorAll('.tab')
          .forEach(x =>
            x.classList.remove('active')
          );

        button.classList.add('active');

        activeFilter =
          button.dataset.filter;

        renderMenu();

      }
    );

  });


/* =========================
   PAYMENT CHANGE
========================= */

document.addEventListener(
  'change',
  function(e){

    if(e.target.id === 'cPayment'){

      updateTransactionField();

    }

  }
);


/* =========================
   INITIALIZE
========================= */

document.getElementById(
  'year'
).textContent =
  new Date().getFullYear();

renderMenu();

updateCount();
