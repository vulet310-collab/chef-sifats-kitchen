অবশ্যই। তুমি যে **পুরো `app.js` code** দিয়েছো, সেটার মধ্যে সব পরিবর্তন করে নিচে **সম্পূর্ণ নতুন code** দিলাম। পুরোনো `app.js` পুরোটা **Ctrl+A → Delete → এই code paste → Commit changes** করবে।

এতে থাকবে:

* **Saturday–Thursday:** 11 AM–7 PM
* **Friday:** 3 PM–9 PM
* প্রতি **30 মিনিটে slot**
* Shop বন্ধ থাকলে আজকের slot দেখাবে না
* **পরের opening time** থেকে slot শুরু হবে
* Pizza / Continental / Kacchi → pre-booking
* Kacchi minimum 2 persons
* bKash/Nagad payment আগের মতো থাকবে
* Transaction ID validation থাকবে
* WhatsApp order-এর সাথে selected delivery time যাবে

# Updated app.js

```javascript
const SETTINGS={
  whatsapp:'8801792494275',
  payment:'01792494275',
  facebook:'https://web.facebook.com/ChefSifatsKitchen'
};

const DEFAULT_MENU=[
{name:'BBQ Chicken Pizza',cat:'pizza',image:'assets/bbq-chicken-pizza.jpg',prices:{'6″':300,'8″':380,'10″':480,'12″':580}},
{name:'Meat Pizza',cat:'pizza',image:'assets/pizza-hero.png',prices:{'6″':350,'8″':450,'10″':550,'12″':650}},
{name:'Flaming Chicken Pizza',cat:'pizza',image:'assets/pizza-hero.png',prices:{'6″':300,'8″':350,'10″':450,'12″':550}},
{name:'6 Season Pizza',cat:'pizza',image:'assets/pizza-hero.png',prices:{'6″':350,'8″':420,'10″':500,'12″':600}},
{name:'Margherita Pizza',cat:'pizza',image:'assets/pizza-hero.png',prices:{'6″':280,'8″':350,'10″':420,'12″':500}},
{name:'Neapolitan BBQ Chicken Pizza',cat:'pizza',image:'assets/pizza-hero.png',prices:{'8″':450,'10″':600,'12″':750}},
{name:'Neapolitan Meat Pizza',cat:'pizza',image:'assets/pizza-hero.png',prices:{'8″':500,'10″':650,'12″':800}},
{name:'Neapolitan Margherita Pizza',cat:'pizza',image:'assets/pizza-hero.png',prices:{'6″':350,'8″':450,'10″':550,'12″':650}},
{name:'Emergency BBQ Chicken Pizza',cat:'pizza',image:'assets/pizza-hero.png',prices:{'8″':400,'10″':550,'12″':700}},
{name:'Emergency Meat Pizza',cat:'pizza',image:'assets/pizza-hero.png',prices:{'8″':450,'10″':600,'12″':750}},
{name:'Emergency Margherita Pizza',cat:'pizza',image:'assets/pizza-hero.png',prices:{'6″':300,'8″':400,'10″':500,'12″':600}},
{name:'Chicken Momo',cat:'momo',image:'assets/bbq-chicken-momo.jpg',prices:{'6 pcs':120,'10 pcs':200}},
{name:'Vegetable Momo',cat:'momo',image:'assets/bbq-chicken-momo.jpg',prices:{'6 pcs':100,'10 pcs':160}},
{name:'BBQ Chicken Momo',cat:'momo',image:'assets/bbq-chicken-momo.jpg',prices:{'6 pcs':160,'10 pcs':250}},
{name:'Cheese Chicken Momo',cat:'momo',image:'assets/bbq-chicken-momo.jpg',prices:{'6 pcs':180,'10 pcs':300}},
{name:'Prawns Cocktail',cat:'continental',image:'assets/prawns-cocktail.png',prices:{'5–6 pcs / 1 person':350,'10–12 pcs / 2 persons':700}},
{name:'Grilled Fish with Special Fried Potato',cat:'continental',image:'assets/grilled-fish.png',prices:{'1 person':380,'2 persons':700}},
{name:'Coleslaw Salad',cat:'continental',image:'assets/coleslaw.png',prices:{'1 serving':80}},
{name:'Authentic Kacchi Biryani (Full)',cat:'kacchi',image:'assets/authentic-kacchi.jpg',prices:{'1 person':399},minQty:2,maxQty:20,note:'Minimum order: 2 persons • Pre-booking required'},
{name:'Beef Kacchi Biryani',cat:'kacchi',image:'assets/beef-kacchi.jpg',prices:{'1 person':349},minQty:2,maxQty:20,note:'Minimum order: 2 persons • Pre-booking required'}
];

let MENU=JSON.parse(localStorage.getItem('chefSifatMenu')||'null')||DEFAULT_MENU;
let activeFilter='all';
let cart=JSON.parse(localStorage.getItem('chefSifatCart5')||'[]');

const money=n=>'৳'+Number(n).toLocaleString('en-BD');

const isPrebook=cat=>['pizza','continental','kachhi'].includes(cat);


/* =========================
   SHOP OPENING SCHEDULE
   =========================

   Saturday - Thursday:
   11:00 AM - 7:00 PM

   Friday:
   3:00 PM - 9:00 PM

   Sunday = 0
   Monday = 1
   Tuesday = 2
   Wednesday = 3
   Thursday = 4
   Friday = 5
   Saturday = 6
*/

function getShopHours(date){
  const day=date.getDay();

  // Friday
  if(day===5){
    return {
      open:15*60,   // 3:00 PM
      close:21*60   // 9:00 PM
    };
  }

  // Saturday - Thursday
  return {
    open:11*60,    // 11:00 AM
    close:19*60    // 7:00 PM
  };
}


/* =========================
   FORMAT DELIVERY SLOT
   ========================= */

function formatSlot(date){
  return date.toLocaleString('en-US',{
    weekday:'short',
    month:'short',
    day:'numeric',
    hour:'numeric',
    minute:'2-digit',
    hour12:true
  });
}


/* =========================
   SAVE MENU
   ========================= */

function saveMenu(){
  localStorage.setItem('chefSifatMenu',JSON.stringify(MENU));
}


/* =========================
   RENDER MENU
   ========================= */

function renderMenu(){
  const q=(document.getElementById('search').value||'').toLowerCase().trim();
  const grid=document.getElementById('menuGrid');

  const list=MENU.filter(x=>
    (activeFilter==='all'||x.cat===activeFilter)&&
    (!q||x.name.toLowerCase().includes(q))
  );

  if(!list.length){
    grid.innerHTML='<div class="empty">No dishes found. Try another search.</div>';
    return;
  }

  grid.innerHTML=list.map((p,i)=>{
    const choices=Object.entries(p.prices);

    return `
      <article class="food-card">
        <div class="food-photo">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          <span class="tag">${p.cat.toUpperCase()}</span>
        </div>

        <div class="food-body">
          <h3>${p.name}</h3>

          <p>
            ${p.note||'Chef-crafted with quality ingredients and prepared fresh to order.'}
          </p>

          <div class="price-list">
            ${choices.map(([k,v])=>`
              <span class="price-pill">
                ${k}<b>${money(v)}</b>
              </span>
            `).join('')}
          </div>

          <div class="add-row">
            <select class="select-size" id="size-${i}">
              ${choices.map(([k,v])=>`
                <option value="${k}">
                  ${k} — ${money(v)}
                </option>
              `).join('')}
            </select>

            <button
              class="add"
              onclick="addToCart(${MENU.indexOf(p)},document.getElementById('size-${i}').value)"
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
   ADD TO CART
   ========================= */

function addToCart(index,choice){
  const p=MENU[index];
  const price=p.prices[choice];
  const key=p.name+'|'+choice;

  let f=cart.find(x=>x.key===key);

  if(f){
    f.qty++;
  }else{
    cart.push({
      key,
      name:p.name,
      cat:p.cat,
      choice,
      price,
      qty:1,
      minQty:p.minQty||1,
      maxQty:p.maxQty||99
    });
  }

  saveCart();
  toast('Added to cart ✓');
  openCart();
}


/* =========================
   SAVE CART
   ========================= */

function saveCart(){
  localStorage.setItem('chefSifatCart5',JSON.stringify(cart));
  updateCount();
  renderCart();
}


/* =========================
   CART COUNT
   ========================= */

function updateCount(){
  document.getElementById('cartCount').textContent=
    cart.reduce((s,x)=>s+x.qty,0);
}


/* =========================
   OPEN / CLOSE CART
   ========================= */

function openCart(){
  document.getElementById('cart').classList.remove('hidden');
  renderCart();
}

function closeCart(){
  document.getElementById('cart').classList.add('hidden');
}


/* =========================
   RENDER CART
   ========================= */

function renderCart(){
  const box=document.getElementById('cartItems');

  if(!cart.length){
    box.innerHTML=
      '<div class="empty">Your cart is empty.<br><span class="muted">Choose something delicious from the menu.</span></div>';

    document.getElementById('subtotal').textContent='৳0';
    return;
  }

  box.innerHTML=
    '<div class="cart-lines">'+
    cart.map((x,i)=>`
      <div class="cart-line">

        <div>
          <h4>${x.name}</h4>

          <small>
            ${x.choice} • ${money(x.price)} each
            ${isPrebook(x.cat)?' • Pre-booking':''}
          </small>
        </div>

        <div class="qty">
          <button onclick="changeQty(${i},-1)">−</button>
          <b>${x.qty}</b>
          <button onclick="changeQty(${i},1)">+</button>
        </div>

        <button class="remove" onclick="removeItem(${i})">
          Remove
        </button>

      </div>
    `).join('')+
    '</div>';

  document.getElementById('subtotal').textContent=
    money(cart.reduce((s,x)=>s+x.price*x.qty,0));
}


/* =========================
   CHANGE QUANTITY
   ========================= */

function changeQty(i,n){
  let x=cart[i];
  let next=x.qty+n;

  if(next<0)return;

  if(next===0){
    cart.splice(i,1);
    saveCart();
    return;
  }

  if(x.cat==='kacchi'&&next<2){
    toast('Kacchi minimum order is 2 persons.');
    return;
  }

  if(x.maxQty&&next>x.maxQty){
    toast('Maximum order limit reached.');
    return;
  }

  x.qty=next;
  saveCart();
}


/* =========================
   REMOVE ITEM
   ========================= */

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

  const kacchi=cart.some(x=>x.cat==='kacchi');

  if(
    kacchi &&
    cart.find(x=>x.cat==='kacchi'&&x.qty<2)
  ){
    toast('Kacchi minimum order is 2 persons.');
    return;
  }

  closeCart();

  document.getElementById('checkout').classList.remove('hidden');

  /*
    Build delivery slots based on
    current Bangladesh local time.
  */
  buildSlots();

  const hasPre=cart.some(x=>isPrebook(x.cat));

  /* =========================
     PAYMENT SECTION
     ========================= */

  document.getElementById('paymentBlock').innerHTML=
    hasPre

    ? `
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
    `

    : `
      <label>
        Payment method

        <select id="cPayment">

          <option>
            Cash on Delivery — Rahimanagar area
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


  /* =========================
     CHECKOUT SUMMARY
     ========================= */

  document.getElementById('checkoutSummary').innerHTML=

    cart.map(x=>`
      <div>
        <span>
          ${x.name} • ${x.choice} × ${x.qty}
        </span>

        <b>
          ${money(x.price*x.qty)}
        </b>
      </div>
    `).join('')

    +

    `
      <div>
        <span>
          <strong>Subtotal</strong>
        </span>

        <b>
          ${money(
            cart.reduce(
              (s,x)=>s+x.price*x.qty,
              0
            )
          )}
        </b>
      </div>
    `;
}


/* =========================
   BUILD PRE-BOOKING SLOTS
   =========================

   Saturday-Thursday:
   11 AM - 7 PM

   Friday:
   3 PM - 9 PM

   Slots every 30 minutes.

   If shop is closed now,
   today's closed slots are skipped
   and the next opening day/time
   is automatically shown.
*/

function buildSlots(){

  const box=document.getElementById('slotBlock');

  if(!box)return;

  const needs=cart.some(x=>isPrebook(x.cat));

  /*
    Momo-only / normal COD orders
    don't need pre-booking.
  */
  if(!needs){
    box.innerHTML='';
    return;
  }

  const now=new Date();

  const slots=[];

  /*
    Search the next 14 days.
    This makes sure that the system
    can always find the next opening slot.
  */
  for(let dayOffset=0;dayOffset<14;dayOffset++){

    const day=new Date(now);

    day.setHours(0,0,0,0);

    day.setDate(
      day.getDate()+dayOffset
    );

    const hours=getShopHours(day);

    /*
      Generate slots every 30 minutes.
    */
    for(
      let mins=hours.open;
      mins<hours.close;
      mins+=30
    ){

      const slot=new Date(day);

      slot.setHours(
        Math.floor(mins/60),
        mins%60,
        0,
        0
      );

      /*
        Never show a time that has already passed.
      */
      if(slot<=now){
        continue;
      }

      slots.push({
        value:slot.toISOString(),
        label:formatSlot(slot)
      });
    }
  }


  /*
    Safety check.
  */
  if(!slots.length){

    box.innerHTML=`
      <div class="payment-note">
        No delivery slots are currently available.
        Please try again later.
      </div>
    `;

    return;
  }


  /*
    Show delivery time dropdown.
  */
  box.innerHTML=`

    <label>
      Pre-booking date & time

      <select id="prebookSlot" required>

        ${slots.map((slot,index)=>`

          <option
            value="${slot.value}"
            ${index===0?'selected':''}
          >
            ${slot.label}
          </option>

        `).join('')}

      </select>

    </label>

  `;
}


/* =========================
   CLOSE CHECKOUT
   ========================= */

function closeCheckout(){
  document.getElementById('checkout').classList.add('hidden');
}


/* =========================
   PLACE ORDER
   ========================= */

function placeOrder(e){

  e.preventDefault();

  const name=
    document.getElementById('cName').value.trim();

  const phone=
    document.getElementById('cPhone').value.trim();

  const address=
    document.getElementById('cAddress').value.trim();

  const payment=
    document.getElementById('cPayment').value;

  const tx=
    document.getElementById('cTx').value.trim();

  const note=
    document.getElementById('cNote').value.trim();

  const hasPre=
    cart.some(x=>isPrebook(x.cat));


  /* =========================
     PHONE VALIDATION
     ========================= */

  if(
    !/^01\d{9}$/.test(
      phone.replace(/[\s-]/g,'')
    )
  ){

    alert(
      'Please enter a valid Bangladesh mobile number.'
    );

    return;
  }


  /* =========================
     PAYMENT VALIDATION
     ========================= */

  if(hasPre&&!tx){

    alert(
      'Full payment is required. Please enter the bKash/Nagad Transaction ID.'
    );

    return;
  }


  if(
    !hasPre &&
    (
      payment.startsWith('bKash')||
      payment.startsWith('Nagad')
    ) &&
    !tx
  ){

    alert(
      'Please enter the Transaction ID for online payment.'
    );

    return;
  }


  /* =========================
     SUBTOTAL
     ========================= */

  const subtotal=
    cart.reduce(
      (s,x)=>s+x.price*x.qty,
      0
    );


  /* =========================
     SELECTED DELIVERY SLOT
     ========================= */

  const slot=
    hasPre &&
    document.getElementById('prebookSlot')
      ? document.getElementById('prebookSlot').value
      : '';


  /* =========================
     WHATSAPP ORDER MESSAGE
     ========================= */

  let text=
    `*NEW ORDER — CHEF SIFAT'S KITCHEN*\n\n`;


  text+=
    cart.map(x=>
      `• ${x.name} — ${x.choice} × ${x.qty} = ${money(x.price*x.qty)}`
    ).join('\n');


  text+=
    `\n\n*Subtotal:* ${money(subtotal)}`;


  text+=
    `\n*Customer:* ${name}`;


  text+=
    `\n*Phone:* ${phone}`;


  text+=
    `\n*Address:* ${address}`;


  text+=
    `\n*Payment:* ${payment}`;


  text+=
    `\n*Transaction ID:* ${tx||'N/A'}`;


  /*
    Add selected delivery time
    to WhatsApp message.
  */
  if(slot){

    text+=
      `\n*Pre-booking:* ${
        new Date(slot).toLocaleString('en-BD',{
          weekday:'short',
          month:'short',
          day:'numeric',
          hour:'numeric',
          minute:'2-digit',
          hour12:true
        })
      }`;
  }


  text+=
    `\n*Note:* ${note||'None'}`;


  /* =========================
     OPEN WHATSAPP
     ========================= */

  window.open(
    `https://wa.me/${SETTINGS.whatsapp}?text=${encodeURIComponent(text)}`,
    '_blank'
  );


  /* =========================
     CLEAR ORDER
     ========================= */

  closeCheckout();

  cart=[];

  saveCart();

  toast('Order details prepared ✓');
}


/* =========================
   TOAST MESSAGE
   ========================= */

function toast(t){

  const x=document.createElement('div');

  x.textContent=t;

  x.style.cssText=
    'position:fixed;left:50%;bottom:25px;transform:translateX(-50%);z-index:999;background:#e8a323;color:#111;padding:11px 18px;border-radius:999px;font-weight:800;box-shadow:0 10px 30px #000';

  document.body.appendChild(x);

  setTimeout(
    ()=>x.remove(),
    1800
  );
}


/* =========================
   CATEGORY TABS
   ========================= */

document.querySelectorAll('.tab').forEach(b=>

  b.addEventListener('click',()=>{

    document
      .querySelectorAll('.tab')
      .forEach(x=>
        x.classList.remove('active')
      );

    b.classList.add('active');

    activeFilter=b.dataset.filter;

    renderMenu();
  })

);


/* =========================
   INITIAL LOAD
   ========================= */

document.getElementById('year').textContent=
  new Date().getFullYear();

renderMenu();

updateCount();
```
