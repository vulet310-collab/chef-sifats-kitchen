/* =========================================================
   CHEF SIFAT'S KITCHEN
   COMPLETE CORRECTED SERVER.JS
   ========================================================= */

'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

/* =========================================================
   APP
   ========================================================= */

const app = express();

const PORT = Number(process.env.PORT || 10000);

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'chef-sifats-kitchen-change-this-secret';

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME ||
  'admin';

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ||
  '';

const SHOP_TIME_ZONE = 'Asia/Dhaka';

/* =========================================================
   PATHS
   ========================================================= */

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');

const DATA_DIR = path.join(ROOT, 'data');

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');

/* =========================================================
   CREATE DIRECTORIES / FILES
   ========================================================= */

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function ensureFile(file, fallback) {
  ensureDir(path.dirname(file));

  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      JSON.stringify(fallback, null, 2),
      'utf8'
    );
  }
}

ensureDir(PUBLIC_DIR);
ensureDir(ASSETS_DIR);
ensureDir(DATA_DIR);

/* =========================================================
   DEFAULT SETTINGS
   ========================================================= */

const DEFAULT_SETTINGS = {
  delivery: {
    baseName: 'Kahalthuri Hamidia High School',
    baseLat: 23.3022494,
    baseLng: 90.9187528,

    codRadiusKm: 1,
    maxRadiusKm: 4,

    ratePerKm: 10,
    codCharge: 0
  },

  payment: {
    bkash: '01792494275',
    nagad: '01792494275',
    method: 'Send Money Only'
  },

  hours: {
    normal: {
      open: 11,
      close: 19
    },

    friday: {
      open: 15,
      close: 21
    }
  },

  prebook: {
    enabled: true
  },

  restaurant: {
    name: "Chef Sifat's Kitchen",
    address: 'Kahalthuri, Shahedapur-3630, Kachua, Chandpur',
    phone: '01792494275',
    phone2: '01815905178',
    email: 'chefsifatskitchen@gmail.com',
    facebook: 'https://web.facebook.com/ChefSifatsKitchen'
  }
};

ensureFile(SETTINGS_FILE, DEFAULT_SETTINGS);
ensureFile(MENU_FILE, []);
ensureFile(ORDERS_FILE, []);
ensureFile(REVIEWS_FILE, []);
ensureFile(CUSTOMERS_FILE, []);

/* =========================================================
   JSON HELPERS
   ========================================================= */

function readJSON(file, fallback) {
  try {
    const raw = fs.readFileSync(file, 'utf8');

    if (!raw.trim()) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch (err) {
    console.error('JSON READ ERROR:', file, err.message);
    return fallback;
  }
}

function writeJSON(file, data) {
  const tempFile =
    `${file}.${process.pid}.${Date.now()}.tmp`;

  fs.writeFileSync(
    tempFile,
    JSON.stringify(data, null, 2),
    'utf8'
  );

  fs.renameSync(tempFile, file);
}

/* =========================================================
   SETTINGS
   ========================================================= */

function deepMerge(base, extra) {
  if (
    !extra ||
    typeof extra !== 'object' ||
    Array.isArray(extra)
  ) {
    return base;
  }

  const output = {
    ...base
  };

  for (const key of Object.keys(extra)) {
    if (
      extra[key] &&
      typeof extra[key] === 'object' &&
      !Array.isArray(extra[key]) &&
      base[key] &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      output[key] = deepMerge(
        base[key],
        extra[key]
      );
    } else {
      output[key] = extra[key];
    }
  }

  return output;
}

function getSettings() {
  const saved =
    readJSON(SETTINGS_FILE, {});

  return deepMerge(
    DEFAULT_SETTINGS,
    saved
  );
}

function saveSettings(settings) {
  writeJSON(
    SETTINGS_FILE,
    deepMerge(DEFAULT_SETTINGS, settings)
  );
}

/* =========================================================
   NORMALIZE SETTINGS
   ========================================================= */

function normalizeSettings() {
  const s = getSettings();

  s.delivery.baseLat =
    Number(s.delivery.baseLat) ||
    DEFAULT_SETTINGS.delivery.baseLat;

  s.delivery.baseLng =
    Number(s.delivery.baseLng) ||
    DEFAULT_SETTINGS.delivery.baseLng;

  s.delivery.codRadiusKm =
    Number(s.delivery.codRadiusKm);

  if (!Number.isFinite(s.delivery.codRadiusKm)) {
    s.delivery.codRadiusKm = 1;
  }

  s.delivery.maxRadiusKm =
    Number(s.delivery.maxRadiusKm);

  if (!Number.isFinite(s.delivery.maxRadiusKm)) {
    s.delivery.maxRadiusKm = 4;
  }

  s.delivery.ratePerKm =
    Number(s.delivery.ratePerKm);

  if (!Number.isFinite(s.delivery.ratePerKm)) {
    s.delivery.ratePerKm = 10;
  }

  s.delivery.codCharge =
    Number(s.delivery.codCharge);

  if (!Number.isFinite(s.delivery.codCharge)) {
    s.delivery.codCharge = 0;
  }

  s.hours.normal.open =
    Number(s.hours.normal.open);

  s.hours.normal.close =
    Number(s.hours.normal.close);

  s.hours.friday.open =
    Number(s.hours.friday.open);

  s.hours.friday.close =
    Number(s.hours.friday.close);

  if (
    !Number.isFinite(s.hours.normal.open) ||
    !Number.isFinite(s.hours.normal.close)
  ) {
    s.hours.normal = {
      open: 11,
      close: 19
    };
  }

  if (
    !Number.isFinite(s.hours.friday.open) ||
    !Number.isFinite(s.hours.friday.close)
  ) {
    s.hours.friday = {
      open: 15,
      close: 21
    };
  }

  return s;
}

/* =========================================================
   MENU
   ========================================================= */

function normalizeSize(size) {
  if (Array.isArray(size)) {
    return [
      String(size[0] ?? ''),
      Number(size[1]) || 0
    ];
  }

  if (
    size &&
    typeof size === 'object'
  ) {
    return {
      label: String(
        size.label ??
        size.name ??
        ''
      ),

      price:
        Number(size.price) || 0
    };
  }

  return null;
}

function normalizeProduct(product, index = 0) {
  const p = {
    ...product
  };

  p.id =
    String(
      p.id ||
      p._id ||
      `item-${index + 1}`
    );

  p.name =
    String(
      p.name ||
      'Unnamed Item'
    );

  p.cat =
    String(
      p.cat ||
      p.category ||
      'Other'
    ).trim().toLowerCase();

  p.image =
    String(
      p.image ||
      ''
    );

  p.description =
    String(
      p.description ||
      ''
    );

  p.choice =
    String(
      p.choice ||
      ''
    );

  p.active =
    p.active !== false;

  /* -----------------------------------------
     SIZE / PRICE
     ----------------------------------------- */

  if (Array.isArray(p.sizes)) {
    p.sizes =
      p.sizes
        .map(normalizeSize)
        .filter(Boolean);
  } else {
    p.sizes = [];
  }

  if (p.sizes.length) {
    const first = p.sizes[0];

    if (Array.isArray(first)) {
      p.price =
        Number(first[1]) || 0;
    } else {
      p.price =
        Number(first.price) || 0;
    }
  } else {
    p.price =
      Number(p.price) || 0;
  }

  /* -----------------------------------------
     PRE-BOOKING
     ----------------------------------------- */

  p.prebook =
    p.prebook === true;

  /*
    Pizza and Momo can never become
    pre-booking items accidentally.
  */

  if (
    p.cat === 'pizza' ||
    p.cat === 'momo'
  ) {
    p.prebook = false;
  }

  /*
    Only Continental/Kacchi can be
    pre-booked.
  */

  if (
    p.prebook &&
    p.cat !== 'continental' &&
    p.cat !== 'kacchi'
  ) {
    p.prebook = false;
  }

  /* -----------------------------------------
     QUANTITY
     ----------------------------------------- */

  if (
    p.minQty !== undefined &&
    p.minQty !== null
  ) {
    p.minQty =
      Number(p.minQty) || 1;
  }

  if (
    p.maxQty !== undefined &&
    p.maxQty !== null
  ) {
    p.maxQty =
      Number(p.maxQty) || 20;
  }

  return p;
}

function getMenu() {
  const raw =
    readJSON(
      MENU_FILE,
      []
    );

  let list = [];

  if (Array.isArray(raw)) {
    list = raw;
  } else if (
    raw &&
    Array.isArray(raw.menu)
  ) {
    list = raw.menu;
  } else if (
    raw &&
    Array.isArray(raw.items)
  ) {
    list = raw.items;
  }

  return list.map(
    normalizeProduct
  );
}

function saveMenu(menu) {
  writeJSON(
    MENU_FILE,
    menu.map(
      normalizeProduct
    )
  );
}

/* =========================================================
   CUSTOMER DATA
   ========================================================= */

function getCustomers() {
  const raw =
    readJSON(
      CUSTOMERS_FILE,
      []
    );

  if (Array.isArray(raw)) {
    return raw;
  }

  if (
    raw &&
    Array.isArray(raw.customers)
  ) {
    return raw.customers;
  }

  return [];
}

function saveCustomers(customers) {
  writeJSON(
    CUSTOMERS_FILE,
    customers
  );
}

function sanitizeCustomer(customer) {
  if (!customer) {
    return null;
  }

  return {
    id: customer.id,
    name: customer.name,
    mobile: customer.mobile,
    email: customer.email,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt
  };
}

/* =========================================================
   ORDERS
   ========================================================= */

function getOrders() {
  const raw =
    readJSON(
      ORDERS_FILE,
      []
    );

  if (Array.isArray(raw)) {
    return raw;
  }

  if (
    raw &&
    Array.isArray(raw.orders)
  ) {
    return raw.orders;
  }

  return [];
}

function saveOrders(orders) {
  writeJSON(
    ORDERS_FILE,
    orders
  );
}

/* =========================================================
   REVIEWS
   ========================================================= */

function getReviews() {
  const raw =
    readJSON(
      REVIEWS_FILE,
      []
    );

  if (Array.isArray(raw)) {
    return raw;
  }

  if (
    raw &&
    Array.isArray(raw.reviews)
  ) {
    return raw.reviews;
  }

  return [];
}

function saveReviews(reviews) {
  writeJSON(
    REVIEWS_FILE,
    reviews
  );
}

/* =========================================================
   EXPRESS MIDDLEWARE
   ========================================================= */

app.set(
  'trust proxy',
  1
);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

app.use(
  express.json({
    limit: '2mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '2mb'
  })
);

/* =========================================================
   RATE LIMITING
   ========================================================= */

const generalLimiter =
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false
  });

const authLimiter =
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  });

app.use(
  '/api/',
  generalLimiter
);

/* =========================================================
   STATIC FILES
   ========================================================= */

app.use(
  '/assets',
  express.static(
    ASSETS_DIR
  )
);

app.use(
  express.static(
    PUBLIC_DIR
  )
);

/* =========================================================
   UTILITY
   ========================================================= */

function safeString(value) {
  return String(
    value ?? ''
  ).trim();
}

function normalizeMobile(value) {
  let mobile =
    safeString(value)
      .replace(/[\s-]/g, '');

  if (
    mobile.startsWith('+880')
  ) {
    mobile =
      '0' +
      mobile.slice(4);
  }

  if (
    mobile.startsWith('880')
  ) {
    mobile =
      '0' +
      mobile.slice(3);
  }

  return mobile;
}

function isValidBangladeshMobile(
  mobile
) {
  return /^01\d{9}$/.test(
    normalizeMobile(mobile)
  );
}

function normalizeEmail(email) {
  return safeString(
    email
  ).toLowerCase();
}

function generateId(prefix) {
  return (
    prefix +
    '_' +
    Date.now().toString(36) +
    '_' +
    crypto
      .randomBytes(5)
      .toString('hex')
  );
}

/* =========================================================
   JWT
   ========================================================= */

function createCustomerToken(
  customer
) {
  return jwt.sign(
    {
      type: 'customer',
      customerId: customer.id
    },
    JWT_SECRET,
    {
      expiresIn: '30d'
    }
  );
}

function getBearerToken(req) {
  const header =
    req.headers.authorization ||
    '';

  if (
    !header.startsWith(
      'Bearer '
    )
  ) {
    return '';
  }

  return header.slice(7).trim();
}

function customerAuth(
  req,
  res,
  next
) {
  try {
    const token =
      getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        ok: false,
        message:
          'Login required.'
      });
    }

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    if (
      decoded.type !==
      'customer'
    ) {
      return res.status(401).json({
        ok: false,
        message:
          'Invalid customer session.'
      });
    }

    const customers =
      getCustomers();

    const customer =
      customers.find(
        c =>
          c.id ===
          decoded.customerId
      );

    if (!customer) {
      return res.status(401).json({
        ok: false,
        message:
          'Customer account not found.'
      });
    }

    req.customer =
      customer;

    next();
  } catch (err) {
    return res.status(401).json({
      ok: false,
      message:
        'Session expired. Please login again.'
    });
  }
}

/* =========================================================
   ADMIN AUTH
   ========================================================= */

function adminAuth(
  req,
  res,
  next
) {
  try {
    const token =
      getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        ok: false,
        message:
          'Admin login required.'
      });
    }

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    if (
      decoded.type !==
      'admin'
    ) {
      return res.status(401).json({
        ok: false,
        message:
          'Invalid admin session.'
      });
    }

    req.admin =
      decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      ok: false,
      message:
        'Admin session expired.'
    });
  }
}

/* =========================================================
   DISTANCE
   ========================================================= */

function calculateDistanceKm(
  lat1,
  lng1,
  lat2,
  lng2
) {
  const R = 6371;

  const toRad =
    value =>
      value *
      Math.PI /
      180;

  const dLat =
    toRad(
      lat2 - lat1
    );

  const dLng =
    toRad(
      lng2 - lng1
    );

  const a =
    Math.sin(
      dLat / 2
    ) ** 2 +
    Math.cos(
      toRad(lat1)
    ) *
    Math.cos(
      toRad(lat2)
    ) *
    Math.sin(
      dLng / 2
    ) ** 2;

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
  lng
) {
  const s =
    normalizeSettings();

  const distance =
    calculateDistanceKm(
      s.delivery.baseLat,
      s.delivery.baseLng,
      lat,
      lng
    );

  if (
    distance >
    s.delivery.maxRadiusKm
  ) {
    return {
      available: false,
      codAvailable: false,
      distanceKm: distance,
      deliveryCharge: 0,
      paymentRequired: false
    };
  }

  const codAvailable =
    distance <=
    s.delivery.codRadiusKm;

  const deliveryCharge =
    codAvailable
      ? Number(
          s.delivery.codCharge
        ) || 0
      : Math.ceil(distance) *
        Number(
          s.delivery.ratePerKm
        );

  return {
    available: true,
    codAvailable,
    distanceKm: distance,
    deliveryCharge,
    paymentRequired:
      !codAvailable
  };
}

/* =========================================================
   BANGLADESH TIMEZONE HELPERS
   ========================================================= */

function getDhakaParts(
  date
) {
  const parts =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone:
          SHOP_TIME_ZONE,

        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',

        weekday: 'long',

        hourCycle: 'h23'
      }
    ).formatToParts(
      date
    );

  const map = {};

  for (const part of parts) {
    map[part.type] =
      part.value;
  }

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
      Number(map.second),

    weekday:
      map.weekday
  };
}

function getDhakaDateKey(
  date
) {
  const p =
    getDhakaParts(date);

  return [
    p.year,
    String(p.month).padStart(2, '0'),
    String(p.day).padStart(2, '0')
  ].join('-');
}

function getShopHoursForDate(
  date
) {
  const s =
    normalizeSettings();

  const p =
    getDhakaParts(date);

  if (
    p.weekday ===
    'Friday'
  ) {
    return {
      open:
        Number(
          s.hours.friday.open
        ),
      close:
        Number(
          s.hours.friday.close
        )
    };
  }

  return {
    open:
      Number(
        s.hours.normal.open
      ),
    close:
      Number(
        s.hours.normal.close
      )
  };
}

/*
  FINAL CUSTOMER ORDER WINDOW:

  Shop opening + 1 hour
  through
  Shop closing - 1 hour

  Example:
  Normal 11 AM–7 PM
  => 12 PM–6 PM

  Friday 3 PM–9 PM
  => 4 PM–8 PM
*/

function getAllowedOrderWindow(
  date
) {
  const hours =
    getShopHoursForDate(
      date
    );

  return {
    startMinutes:
      hours.open * 60 + 60,

    endMinutes:
      hours.close * 60 - 60
  };
}

function isThirtyMinuteSlot(
  minute
) {
  return (
    Number(minute) % 30 === 0
  );
}

/* =========================================================
   DELIVERY TIME VALIDATION
   ========================================================= */

function validateDeliveryTime(
  deliveryTime,
  options = {}
) {
  if (
    !deliveryTime
  ) {
    return {
      valid: false,
      message:
        'Delivery time is required.'
    };
  }

  const selected =
    new Date(
      deliveryTime
    );

  if (
    Number.isNaN(
      selected.getTime()
    )
  ) {
    return {
      valid: false,
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
      valid: false,
      message:
        'Delivery time must be in the future.'
    };
  }

  const selectedDhaka =
    getDhakaParts(
      selected
    );

  const nowDhaka =
    getDhakaParts(
      now
    );

  const selectedDate =
    getDhakaDateKey(
      selected
    );

  const todayDate =
    getDhakaDateKey(
      now
    );

  const isPrebook =
    options.prebook === true;

  /*
    Normal order:
    only today's date.
  */

  if (
    !isPrebook &&
    selectedDate !==
      todayDate
  ) {
    return {
      valid: false,
      message:
        'Regular orders must use today\'s delivery date.'
    };
  }

  /*
    Pre-booking can use future dates,
    but only if admin enabled it.
  */

  if (
    isPrebook
  ) {
    const s =
      normalizeSettings();

    if (
      s.prebook.enabled !==
      true
    ) {
      return {
        valid: false,
        message:
          'Pre-booking is currently disabled.'
      };
    }
  }

  const minutes =
    selectedDhaka.hour *
      60 +
    selectedDhaka.minute;

  if (
    !isThirtyMinuteSlot(
      selectedDhaka.minute
    )
  ) {
    return {
      valid: false,
      message:
        'Delivery time must be on a 30-minute slot.'
    };
  }

  const window =
    getAllowedOrderWindow(
      selected
    );

  if (
    minutes <
      window.startMinutes ||
    minutes >
      window.endMinutes
  ) {
    const startHour =
      Math.floor(
        window.startMinutes /
          60
      );

    const startMinute =
      window.startMinutes %
      60;

    const endHour =
      Math.floor(
        window.endMinutes /
          60
      );

    const endMinute =
      window.endMinutes %
      60;

    return {
      valid: false,
      message:
        `Delivery time must be between ${format12Hour(startHour, startMinute)} and ${format12Hour(endHour, endMinute)}.`
    };
  }

  /*
    For today's date, prevent a slot
    that has already passed.
  */

  if (
    selectedDate ===
    todayDate
  ) {
    if (
      selected.getTime() <=
      now.getTime()
    ) {
      return {
        valid: false,
        message:
          'Please select a future delivery slot.'
      };
    }
  }

  return {
    valid: true,
    date:
      selectedDate,

    time:
      `${String(
        selectedDhaka.hour
      ).padStart(2, '0')}:${String(
        selectedDhaka.minute
      ).padStart(2, '0')}`,

    iso:
      selected.toISOString()
  };
}

function format12Hour(
  hour,
  minute
) {
  const suffix =
    hour >= 12
      ? 'PM'
      : 'AM';

  const h =
    hour % 12 ||
    12;

  return (
    `${h}:` +
    `${String(
      minute
    ).padStart(2, '0')} ` +
    suffix
  );
}

/* =========================================================
   PAYMENT VALIDATION
   ========================================================= */

function normalizePayment(
  payment
) {
  const value =
    safeString(
      payment
    ).toLowerCase();

  if (
    value.includes(
      'cash'
    ) ||
    value.includes(
      'cod'
    )
  ) {
    return 'COD';
  }

  if (
    value.includes(
      'bkash'
    )
  ) {
    return 'bKash';
  }

  if (
    value.includes(
      'nagad'
    )
  ) {
    return 'Nagad';
  }

  return '';
}

function isValidTransactionId(
  tx
) {
  const value =
    safeString(tx);

  /*
    Allow 5–50 numeric digits.
  */

  return /^\d{5,50}$/.test(
    value
  );
}

/* =========================================================
   ITEM PREBOOKING
   ========================================================= */

function isProductPrebook(
  product
) {
  if (!product) {
    return false;
  }

  const cat =
    String(
      product.cat ||
      ''
    ).toLowerCase();

  /*
    Pizza/Momo ALWAYS OFF.
  */

  if (
    cat === 'pizza' ||
    cat === 'momo'
  ) {
    return false;
  }

  /*
    Only explicit admin ON.
  */

  return (
    product.prebook ===
    true
  );
}

/* =========================================================
   SERVER-SIDE ITEM PRICE
   ========================================================= */

function resolveProductPrice(
  product,
  requestedItem
) {
  if (!product) {
    return {
      valid: false,
      message:
        'Product not found.'
    };
  }

  const sizes =
    Array.isArray(
      product.sizes
    )
      ? product.sizes
      : [];

  /*
    Products with size options.
  */

  if (
    sizes.length
  ) {
    const rawIndex =
      requestedItem &&
      requestedItem.sizeIndex;

    const sizeIndex =
      Number(
        rawIndex
      );

    if (
      !Number.isInteger(
        sizeIndex
      ) ||
      sizeIndex < 0 ||
      sizeIndex >=
        sizes.length
    ) {
      return {
        valid: false,
        message:
          `Please select a valid size for ${product.name}.`
      };
    }

    const selected =
      sizes[sizeIndex];

    let label = '';
    let price = 0;

    if (
      Array.isArray(
        selected
      )
    ) {
      label =
        String(
          selected[0] ??
          ''
        );

      price =
        Number(
          selected[1]
        ) || 0;
    } else {
      label =
        String(
          selected.label ??
          selected.name ??
          ''
        );

      price =
        Number(
          selected.price
        ) || 0;
    }

    if (
      price <= 0
    ) {
      return {
        valid: false,
        message:
          `Invalid price configured for ${product.name}.`
      };
    }

    return {
      valid: true,
      sizeIndex,
      choice: label,
      price
    };
  }

  /*
    Products without sizes.
  */

  const price =
    Number(
      product.price
    ) || 0;

  if (
    price <= 0
  ) {
    return {
      valid: false,
      message:
        `No valid price configured for ${product.name}.`
    };
  }

  return {
    valid: true,
    sizeIndex: null,
    choice:
      String(
        requestedItem?.choice ||
        product.choice ||
        ''
      ),
    price
  };
}

/* =========================================================
   CONFIG API
   ========================================================= */

app.get(
  '/api/config',
  (req, res) => {
    const s =
      normalizeSettings();

    res.json({
      ok: true,

      restaurant:
        s.restaurant,

      delivery: {
        baseName:
          s.delivery.baseName,

        baseLat:
          s.delivery.baseLat,

        baseLng:
          s.delivery.baseLng,

        codRadiusKm:
          s.delivery.codRadiusKm,

        maxRadiusKm:
          s.delivery.maxRadiusKm,

        ratePerKm:
          s.delivery.ratePerKm,

        codCharge:
          s.delivery.codCharge
      },

      payment: {
        bkash:
          s.payment.bkash,

        nagad:
          s.payment.nagad,

        method:
          s.payment.method
      },

      hours:
        s.hours,

      prebook:
        s.prebook
    });
  }
);

/* =========================================================
   PUBLIC MENU
   ========================================================= */

app.get(
  '/api/menu',
  (req, res) => {
    const menu =
      getMenu()
        .filter(
          item =>
            item.active !==
            false
        );

    res.json({
      ok: true,
      menu
    });
  }
);

/* =========================================================
   LOCATION CHECK
   ========================================================= */

app.post(
  '/api/location/check',
  (req, res) => {
    const lat =
      Number(
        req.body.lat
      );

    const lng =
      Number(
        req.body.lng
      );

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return res.status(400).json({
        ok: false,
        message:
          'Valid latitude and longitude are required.'
      });
    }

    const result =
      calculateDelivery(
        lat,
        lng
      );

    res.json({
      ok: true,

      available:
        result.available,

      codAvailable:
        result.codAvailable,

      distanceKm:
        Number(
          result.distanceKm.toFixed(3)
        ),

      deliveryCharge:
        result.deliveryCharge,

      paymentRequired:
        result.paymentRequired
    });
  }
);

/* =========================================================
   CUSTOMER REGISTER
   ========================================================= */

app.post(
  '/api/customer/register',
  authLimiter,
  async (req, res) => {
    try {
      const name =
        safeString(
          req.body.name
        );

      const mobile =
        normalizeMobile(
          req.body.mobile ||
          req.body.phone
        );

      const email =
        normalizeEmail(
          req.body.email
        );

      const password =
        String(
          req.body.password ||
          ''
        );

      if (
        name.length <
        2
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Please enter your name.'
        });
      }

      if (
        !isValidBangladeshMobile(
          mobile
        )
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Please enter a valid Bangladesh mobile number.'
        });
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        )
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Please enter a valid email address.'
        });
      }

      if (
        password.length <
        6
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Password must be at least 6 characters.'
        });
      }

      const customers =
        getCustomers();

      const duplicateMobile =
        customers.some(
          c =>
            normalizeMobile(
              c.mobile
            ) === mobile
        );

      if (
        duplicateMobile
      ) {
        return res.status(409).json({
          ok: false,
          message:
            'This mobile number is already registered.'
        });
      }

      const duplicateEmail =
        customers.some(
          c =>
            normalizeEmail(
              c.email
            ) === email
        );

      if (
        duplicateEmail
      ) {
        return res.status(409).json({
          ok: false,
          message:
            'This email address is already registered.'
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      const customer = {
        id:
          generateId(
            'cus'
          ),

        name,

        mobile,

        email,

        passwordHash,

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString()
      };

      customers.push(
        customer
      );

      saveCustomers(
        customers
      );

      const token =
        createCustomerToken(
          customer
        );

      res.status(201).json({
        ok: true,

        message:
          'Registration successful.',

        token,

        customer:
          sanitizeCustomer(
            customer
          )
      });
    } catch (err) {
      console.error(
        'REGISTER ERROR:',
        err
      );

      res.status(500).json({
        ok: false,
        message:
          'Registration failed.'
      });
    }
  }
);

/* =========================================================
   CUSTOMER LOGIN
   ========================================================= */

app.post(
  '/api/customer/login',
  authLimiter,
  async (req, res) => {
    try {
      const identifier =
        safeString(
          req.body.identifier ||
          req.body.email ||
          req.body.mobile ||
          req.body.phone
        );

      const password =
        String(
          req.body.password ||
          ''
        );

      if (
        !identifier ||
        !password
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Email/mobile and password are required.'
        });
      }

      const customers =
        getCustomers();

      const normalizedIdentifier =
        normalizeEmail(
          identifier
        );

      const normalizedMobile =
        normalizeMobile(
          identifier
        );

      const customer =
        customers.find(
          c =>
            normalizeEmail(
              c.email
            ) ===
              normalizedIdentifier ||
            normalizeMobile(
              c.mobile
            ) ===
              normalizedMobile
        );

      if (!customer) {
        return res.status(401).json({
          ok: false,
          message:
            'Invalid login details.'
        });
      }

      const valid =
        await bcrypt.compare(
          password,
          customer.passwordHash ||
          ''
        );

      if (!valid) {
        return res.status(401).json({
          ok: false,
          message:
            'Invalid login details.'
        });
      }

      const token =
        createCustomerToken(
          customer
        );

      res.json({
        ok: true,

        message:
          'Login successful.',

        token,

        customer:
          sanitizeCustomer(
            customer
          )
      });
    } catch (err) {
      console.error(
        'LOGIN ERROR:',
        err
      );

      res.status(500).json({
        ok: false,
        message:
          'Login failed.'
      });
    }
  }
);

/* =========================================================
   CUSTOMER ME
   ========================================================= */

app.get(
  '/api/customer/me',
  customerAuth,
  (req, res) => {
    res.json({
      ok: true,

      customer:
        sanitizeCustomer(
          req.customer
        )
    });
  }
);

/* =========================================================
   CUSTOMER LOGOUT
   ========================================================= */

app.post(
  '/api/customer/logout',
  customerAuth,
  (req, res) => {
    /*
      JWT is stateless.
      Client removes token.
    */

    res.json({
      ok: true,
      message:
        'Logged out successfully.'
    });
  }
);

/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

app.post(
  '/api/customer/forgot-password',
  authLimiter,
  (req, res) => {
    const email =
      normalizeEmail(
        req.body.email
      );

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return res.status(400).json({
        ok: false,
        message:
          'Please enter a valid email.'
      });
    }

    const customers =
      getCustomers();

    const customer =
      customers.find(
        c =>
          normalizeEmail(
            c.email
          ) === email
      );

    /*
      Do not reveal whether
      email exists.
    */

    if (!customer) {
      return res.json({
        ok: true,
        message:
          'If this email is registered, a reset code will be available.'
      });
    }

    const code =
      String(
        crypto.randomInt(
          100000,
          1000000
        )
      );

    customer.resetCode =
      code;

    customer.resetCodeExpiresAt =
      Date.now() +
      10 * 60 * 1000;

    saveCustomers(
      customers
    );

    /*
      Email provider is not configured
      in this server.

      For production, connect an email
      provider and send the code there.

      Never expose reset codes publicly.
    */

    console.log(
      `Password reset requested for ${email}.`
    );

    res.json({
      ok: true,
      message:
        'If this email is registered, a reset code has been generated.'
    });
  }
);

/* =========================================================
   RESET PASSWORD
   ========================================================= */

app.post(
  '/api/customer/reset-password',
  authLimiter,
  async (req, res) => {
    const email =
      normalizeEmail(
        req.body.email
      );

    const code =
      safeString(
        req.body.code
      );

    const newPassword =
      String(
        req.body.password ||
        req.body.newPassword ||
        ''
      );

    if (
      !email ||
      !/^\d{6}$/.test(
        code
      ) ||
      newPassword.length <
        6
    ) {
      return res.status(400).json({
        ok: false,
        message:
          'Valid email, 6-digit code and new password are required.'
      });
    }

    const customers =
      getCustomers();

    const customer =
      customers.find(
        c =>
          normalizeEmail(
            c.email
          ) === email
      );

    if (
      !customer ||
      customer.resetCode !==
        code ||
      !customer.resetCodeExpiresAt ||
      Date.now() >
        Number(
          customer.resetCodeExpiresAt
        )
    ) {
      return res.status(400).json({
        ok: false,
        message:
          'Invalid or expired reset code.'
      });
    }

    customer.passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    delete customer.resetCode;
    delete customer.resetCodeExpiresAt;

    customer.updatedAt =
      new Date().toISOString();

    saveCustomers(
      customers
    );

    res.json({
      ok: true,
      message:
        'Password reset successful.'
    });
  }
);

/* =========================================================
   CUSTOMER ORDERS
   ========================================================= */

app.get(
  '/api/customer/orders',
  customerAuth,
  (req, res) => {
    const orders =
      getOrders()
        .filter(
          order =>
            order.customerId ===
            req.customer.id
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        );

    res.json({
      ok: true,
      orders
    });
  }
);

/*
  Compatibility endpoint.
*/

app.get(
  '/api/orders/my',
  customerAuth,
  (req, res) => {
    const orders =
      getOrders()
        .filter(
          order =>
            order.customerId ===
            req.customer.id
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
        );

    res.json({
      ok: true,
      orders
    });
  }
);

/* =========================================================
   CREATE ORDER
   ========================================================= */

app.post(
  '/api/orders',
  customerAuth,
  async (req, res) => {
    try {
      const body =
        req.body || {};

      /*
        LOGIN REQUIRED:
        customerAuth already handled this.
      */

      const rawItems =
        Array.isArray(
          body.items
        )
          ? body.items
          : [];

      if (
        !rawItems.length
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Your cart is empty.'
        });
      }

      /* -----------------------------------------
         CUSTOMER DETAILS
         ----------------------------------------- */

      const name =
        safeString(
          body.name ||
          req.customer.name
        );

      const phone =
        normalizeMobile(
          body.phone ||
          body.mobile ||
          req.customer.mobile
        );

      const email =
        normalizeEmail(
          body.email ||
          req.customer.email
        );

      const house =
        safeString(
          body.house ||
          body.houseBuilding
        );

      const road =
        safeString(
          body.road ||
          body.area ||
          body.roadArea
        );

      const mapAddress =
        safeString(
          body.mapAddress ||
          body.address
        );

      const note =
        safeString(
          body.note
        );

      if (
        !name ||
        !house ||
        !road
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Name, house/building and road/area are required.'
        });
      }

      if (
        !isValidBangladeshMobile(
          phone
        )
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Please enter a valid Bangladesh mobile number.'
        });
      }

      /*
        Account mobile must match order phone.
      */

      if (
        normalizeMobile(
          req.customer.mobile
        ) !== phone
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Order phone number must match your registered account mobile number.'
        });
      }

      /* -----------------------------------------
         LOCATION
         ----------------------------------------- */

      const lat =
        Number(
          body.lat ??
          body.latitude
        );

      const lng =
        Number(
          body.lng ??
          body.longitude
        );

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Please select your delivery location on the map.'
        });
      }

      const delivery =
        calculateDelivery(
          lat,
          lng
        );

      if (
        !delivery.available
      ) {
        return res.status(400).json({
          ok: false,
          code:
            'OUTSIDE_DELIVERY_AREA',
          message:
            'Sorry. Your delivery location is outside our 4 km delivery area.',
          distanceKm:
            Number(
              delivery.distanceKm.toFixed(
                3
              )
            )
        });
      }

      /* -----------------------------------------
         MENU / PRICE VALIDATION
         ----------------------------------------- */

      const menu =
        getMenu();

      const orderItems =
        [];

      let subtotal = 0;

      let hasPrebook =
        false;

      for (
        const requested
        of rawItems
      ) {
        const productId =
          safeString(
            requested.id ||
            requested.productId
          );

        const product =
          menu.find(
            p =>
              String(p.id) ===
              productId
          );

        if (
          !product
        ) {
          return res.status(400).json({
            ok: false,
            message:
              `Product not found: ${productId}`
          });
        }

        if (
          product.active ===
          false
        ) {
          return res.status(400).json({
            ok: false,
            message:
              `${product.name} is currently unavailable.`
          });
        }

        const qty =
          Number(
            requested.qty
          );

        if (
          !Number.isInteger(
            qty
          ) ||
          qty < 1 ||
          qty > 100
        ) {
          return res.status(400).json({
            ok: false,
            message:
              `Invalid quantity for ${product.name}.`
          });
        }

        if (
          product.minQty !==
            undefined &&
          qty <
            Number(
              product.minQty
            )
        ) {
          return res.status(400).json({
            ok: false,
            message:
              `${product.name} requires minimum quantity ${product.minQty}.`
          });
        }

        if (
          product.maxQty !==
            undefined &&
          qty >
            Number(
              product.maxQty
            )
        ) {
          return res.status(400).json({
            ok: false,
            message:
              `${product.name} allows maximum quantity ${product.maxQty}.`
          });
        }

        /*
          SERVER decides price.
          Browser price is NEVER trusted.
        */

        const pricing =
          resolveProductPrice(
            product,
            requested
          );

        if (
          !pricing.valid
        ) {
          return res.status(400).json({
            ok: false,
            message:
              pricing.message
          });
        }

        const itemPrebook =
          isProductPrebook(
            product
          );

        if (
          itemPrebook
        ) {
          hasPrebook =
            true;
        }

        const lineTotal =
          pricing.price *
          qty;

        subtotal +=
          lineTotal;

        orderItems.push({
          id:
            product.id,

          name:
            product.name,

          cat:
            product.cat,

          choice:
            pricing.choice,

          sizeIndex:
            pricing.sizeIndex,

          qty,

          price:
            pricing.price,

          lineTotal,

          prebook:
            itemPrebook
        });
      }

      /* -----------------------------------------
         DELIVERY TIME
         ----------------------------------------- */

      const deliveryTime =
        safeString(
          body.deliveryTime ||
          body.prebookSlot ||
          body.slot
        );

      if (
        !deliveryTime
      ) {
        return res.status(400).json({
          ok: false,
          code:
            'DELIVERY_TIME_REQUIRED',
          message:
            'Please select a delivery time.'
        });
      }

      const timeValidation =
        validateDeliveryTime(
          deliveryTime,
          {
            prebook:
              hasPrebook
          }
        );

      if (
        !timeValidation.valid
      ) {
        return res.status(400).json({
          ok: false,
          code:
            'INVALID_DELIVERY_TIME',
          message:
            timeValidation.message
        });
      }

      /* -----------------------------------------
         PAYMENT
         ----------------------------------------- */

      const paymentRaw =
        body.payment ||
        body.paymentMethod ||
        '';

      const payment =
        normalizePayment(
          paymentRaw
        );

      const tx =
        safeString(
          body.transactionId ||
          body.tx ||
          body.transaction ||
          body.last5
        );

      /*
        Pre-booking:
        ONLINE ONLY.
      */

      if (
        hasPrebook
      ) {
        if (
          payment !==
            'bKash' &&
          payment !==
            'Nagad'
        ) {
          return res.status(400).json({
            ok: false,
            message:
              'Pre-booking orders require full bKash or Nagad payment.'
          });
        }

        if (
          !isValidTransactionId(
            tx
          )
        ) {
          return res.status(400).json({
            ok: false,
            message:
              'Please enter a valid bKash/Nagad transaction ID or last digits.'
          });
        }
      } else {
        /*
          Within COD radius:
          COD OR online payment.
        */

        if (
          delivery.codAvailable
        ) {
          if (
            payment ===
            'COD'
          ) {
            /*
              No transaction ID required.
            */
          } else if (
            payment ===
              'bKash' ||
            payment ===
              'Nagad'
          ) {
            if (
              !isValidTransactionId(
                tx
              )
            ) {
              return res.status(400).json({
                ok: false,
                message:
                  'Please enter a valid bKash/Nagad transaction ID or last digits.'
              });
            }
          } else {
            return res.status(400).json({
              ok: false,
              message:
                'Please select a valid payment method.'
            });
          }
        } else {
          /*
            1–4 km:
            COD NOT AVAILABLE.
            Online payment REQUIRED.
          */

          if (
            payment !==
              'bKash' &&
            payment !==
              'Nagad'
          ) {
            return res.status(400).json({
              ok: false,
              message:
                'COD is not available for this location. Please use bKash or Nagad.'
            });
          }

          if (
            !isValidTransactionId(
              tx
            )
          ) {
            return res.status(400).json({
              ok: false,
              message:
                'Online payment transaction ID is required.'
            });
          }
        }
      }

      /* -----------------------------------------
         TOTAL
         ----------------------------------------- */

      const deliveryCharge =
        delivery.deliveryCharge;

      const total =
        subtotal +
        deliveryCharge;

      /* -----------------------------------------
         ORDER OBJECT
         ----------------------------------------- */

      const orders =
        getOrders();

      const order = {
        id:
          generateId(
            'ORD'
          ),

        customerId:
          req.customer.id,

        customer: {
          id:
            req.customer.id,

          name,

          mobile:
            phone,

          email
        },

        items:
          orderItems,

        subtotal,

        deliveryCharge,

        total,

        delivery: {
          lat,

          lng,

          address:
            mapAddress,

          house,

          road,

          distanceKm:
            Number(
              delivery.distanceKm.toFixed(
                3
              )
            ),

          codAvailable:
            delivery.codAvailable
        },

        payment: {
          method:
            payment,

          transactionId:
            tx ||
            '',

          status:
            payment ===
            'COD'
              ? 'pending'
              : 'submitted'
        },

        deliveryTime:
          timeValidation.iso,

        deliveryDate:
          timeValidation.date,

        deliveryTimeLocal:
          timeValidation.time,

        isPrebook:
          hasPrebook,

        note,

        status:
          'pending',

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString()
      };

      orders.push(
        order
      );

      saveOrders(
        orders
      );

      res.status(201).json({
        ok: true,

        message:
          'Order placed successfully.',

        order
      });
    } catch (err) {
      console.error(
        'CREATE ORDER ERROR:',
        err
      );

      res.status(500).json({
        ok: false,
        message:
          'Unable to place order.'
      });
    }
  }
);

/* =========================================================
   REVIEWS - PUBLIC
   ========================================================= */

app.get(
  '/api/reviews',
  (req, res) => {
    const reviews =
      getReviews()
        .filter(
          r =>
            r.approved !==
            false
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt ||
              0
            ) -
            new Date(
              a.createdAt ||
              0
            )
        );

    res.json({
      ok: true,
      reviews
    });
  }
);

/* =========================================================
   CREATE REVIEW
   ========================================================= */

app.post(
  '/api/reviews',
  customerAuth,
  (req, res) => {
    const rating =
      Number(
        req.body.rating
      );

    const text =
      safeString(
        req.body.text ||
        req.body.comment ||
        req.body.review
      );

    if (
      !Number.isInteger(
        rating
      ) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        ok: false,
        message:
          'Rating must be between 1 and 5.'
      });
    }

    if (
      text.length <
      3
    ) {
      return res.status(400).json({
        ok: false,
        message:
          'Please write a review.'
      });
    }

    const reviews =
      getReviews();

    const review = {
      id:
        generateId(
          'rev'
        ),

      customerId:
        req.customer.id,

      customerName:
        req.customer.name,

      rating,

      text,

      approved:
        false,

      createdAt:
        new Date().toISOString()
    };

    reviews.push(
      review
    );

    saveReviews(
      reviews
    );

    res.status(201).json({
      ok: true,
      message:
        'Review submitted for approval.',
      review
    });
  }
);

/* =========================================================
   ADMIN LOGIN
   ========================================================= */

app.post(
  '/api/admin/login',
  authLimiter,
  async (req, res) => {
    const username =
      safeString(
        req.body.username
      );

    const password =
      String(
        req.body.password ||
        ''
      );

    if (
      !ADMIN_PASSWORD
    ) {
      return res.status(503).json({
        ok: false,
        message:
          'Admin password is not configured on the server.'
      });
    }

    if (
      username !==
      ADMIN_USERNAME ||
      password !==
      ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        ok: false,
        message:
          'Invalid admin login details.'
      });
    }

    const token =
      jwt.sign(
        {
          type: 'admin',
          username
        },
        JWT_SECRET,
        {
          expiresIn:
            '12h'
        }
      );

    res.json({
      ok: true,
      token,

      admin: {
        username
      }
    });
  }
);

/* =========================================================
   ADMIN ME
   ========================================================= */

app.get(
  '/api/admin/me',
  adminAuth,
  (req, res) => {
    res.json({
      ok: true,

      admin: {
        username:
          req.admin.username
      }
    });
  }
);

/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

app.get(
  '/api/admin/dashboard',
  adminAuth,
  (req, res) => {
    const orders =
      getOrders();

    const menu =
      getMenu();

    const reviews =
      getReviews();

    const customers =
      getCustomers();

    const totalRevenue =
      orders.reduce(
        (sum, order) =>
          sum +
          Number(
            order.total
          || 0
          ),
        0
      );

    const pendingOrders =
      orders.filter(
        o =>
          o.status ===
          'pending'
      ).length;

    res.json({
      ok: true,

      stats: {
        orders:
          orders.length,

        pendingOrders,

        customers:
          customers.length,

        menuItems:
          menu.length,

        reviews:
          reviews.length,

        revenue:
          totalRevenue
      }
    });
  }
);

/* =========================================================
   ADMIN ORDERS
   ========================================================= */

app.get(
  '/api/admin/orders',
  adminAuth,
  (req, res) => {
    const orders =
      getOrders()
        .sort(
          (a, b) =>
            new Date(
              b.createdAt ||
              0
            ) -
            new Date(
              a.createdAt ||
              0
            )
        );

    res.json({
      ok: true,
      orders
    });
  }
);

/* =========================================================
   ADMIN SINGLE ORDER
   ========================================================= */

app.get(
  '/api/admin/orders/:id',
  adminAuth,
  (req, res) => {
    const order =
      getOrders().find(
        o =>
          String(o.id) ===
          String(
            req.params.id
          )
      );

    if (!order) {
      return res.status(404).json({
        ok: false,
        message:
          'Order not found.'
      });
    }

    res.json({
      ok: true,
      order
    });
  }
);

/* =========================================================
   ADMIN UPDATE ORDER
   ========================================================= */

app.put(
  '/api/admin/orders/:id',
  adminAuth,
  (req, res) => {
    const orders =
      getOrders();

    const index =
      orders.findIndex(
        o =>
          String(o.id) ===
          String(
            req.params.id
          )
      );

    if (
      index === -1
    ) {
      return res.status(404).json({
        ok: false,
        message:
          'Order not found.'
      });
    }

    const allowedStatuses = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ];

    const newStatus =
      safeString(
        req.body.status
      );

    if (
      newStatus &&
      !allowedStatuses.includes(
        newStatus
      )
    ) {
      return res.status(400).json({
        ok: false,
        message:
          'Invalid order status.'
      });
    }

    if (
      newStatus
    ) {
      orders[index].status =
        newStatus;
    }

    if (
      req.body.paymentStatus
    ) {
      orders[index]
        .payment =
        orders[index]
          .payment || {};

      orders[index]
        .payment.status =
        safeString(
          req.body.paymentStatus
        );
    }

    orders[index].updatedAt =
      new Date().toISOString();

    saveOrders(
      orders
    );

    res.json({
      ok: true,
      order:
        orders[index]
    });
  }
);

/* =========================================================
   ADMIN MENU GET
   ========================================================= */

app.get(
  '/api/admin/menu',
  adminAuth,
  (req, res) => {
    res.json({
      ok: true,
      menu:
        getMenu()
    });
  }
);

/* =========================================================
   ADMIN FULL MENU UPDATE
   ========================================================= */

app.put(
  '/api/admin/menu',
  adminAuth,
  (req, res) => {
    let menu =
      req.body.menu;

    if (
      !Array.isArray(
        menu
      )
    ) {
      return res.status(400).json({
        ok: false,
        message:
          'Menu must be an array.'
      });
    }

    menu =
      menu.map(
        normalizeProduct
      );

    saveMenu(
      menu
    );

    res.json({
      ok: true,
      menu:
        getMenu()
    });
  }
);

/* =========================================================
   ADMIN SINGLE MENU UPDATE
   ========================================================= */

app.put(
  '/api/admin/menu/:id',
  adminAuth,
  (req, res) => {
    const menu =
      getMenu();

    const index =
      menu.findIndex(
        item =>
          String(item.id) ===
          String(
            req.params.id
          )
      );

    if (
      index === -1
    ) {
      return res.status(404).json({
        ok: false,
        message:
          'Menu item not found.'
      });
    }

    const updated =
      normalizeProduct({
        ...menu[index],
        ...req.body,
        id:
          menu[index].id
      });

    menu[index] =
      updated;

    saveMenu(
      menu
    );

    res.json({
      ok: true,
      item:
        updated
    });
  }
);

/* =========================================================
   ADMIN CREATE MENU ITEM
   ========================================================= */

app.post(
  '/api/admin/menu',
  adminAuth,
  (req, res) => {
    const menu =
      getMenu();

    const product =
      normalizeProduct({
        ...req.body,

        id:
          req.body.id ||
          generateId(
            'item'
          )
      });

    if (
      menu.some(
        item =>
          item.id ===
          product.id
      )
    ) {
      return res.status(409).json({
        ok: false,
        message:
          'Menu item ID already exists.'
      });
    }

    menu.push(
      product
    );

    saveMenu(
      menu
    );

    res.status(201).json({
      ok: true,
      item:
        product
    });
  }
);

/* =========================================================
   ADMIN DELETE MENU ITEM
   ========================================================= */

app.delete(
  '/api/admin/menu/:id',
  adminAuth,
  (req, res) => {
    const menu =
      getMenu();

    const newMenu =
      menu.filter(
        item =>
          String(item.id) !==
          String(
            req.params.id
          )
      );

    if (
      newMenu.length ===
      menu.length
    ) {
      return res.status(404).json({
        ok: false,
        message:
          'Menu item not found.'
      });
    }

    saveMenu(
      newMenu
    );

    res.json({
      ok: true,
      menu:
        newMenu
    });
  }
);

/* =========================================================
   ADMIN REVIEWS
   ========================================================= */

app.get(
  '/api/admin/reviews',
  adminAuth,
  (req, res) => {
    res.json({
      ok: true,
      reviews:
        getReviews()
    });
  }
);

/* =========================================================
   ADMIN UPDATE REVIEW
   ========================================================= */

app.put(
  '/api/admin/reviews/:id',
  adminAuth,
  (req, res) => {
    const reviews =
      getReviews();

    const index =
      reviews.findIndex(
        r =>
          String(r.id) ===
          String(
            req.params.id
          )
      );

    if (
      index === -1
    ) {
      return res.status(404).json({
        ok: false,
        message:
          'Review not found.'
      });
    }

    if (
      req.body.approved !==
      undefined
    ) {
      reviews[index]
        .approved =
        Boolean(
          req.body.approved
        );
    }

    if (
      req.body.rating !==
      undefined
    ) {
      const rating =
        Number(
          req.body.rating
        );

      if (
        rating < 1 ||
        rating > 5
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Rating must be 1–5.'
        });
      }

      reviews[index]
        .rating =
        rating;
    }

    reviews[index]
      .updatedAt =
      new Date().toISOString();

    saveReviews(
      reviews
    );

    res.json({
      ok: true,
      review:
        reviews[index]
    });
  }
);

/* =========================================================
   ADMIN CUSTOMERS
   ========================================================= */

app.get(
  '/api/admin/customers',
  adminAuth,
  (req, res) => {
    const customers =
      getCustomers();

    const orders =
      getOrders();

    const output =
      customers.map(
        customer => {
          const customerOrders =
            orders.filter(
              o =>
                o.customerId ===
                customer.id
            );

          const totalSpent =
            customerOrders.reduce(
              (sum, o) =>
                sum +
                Number(
                  o.total || 0
                ),
              0
            );

          return {
            ...sanitizeCustomer(
              customer
            ),

            orderCount:
              customerOrders.length,

            totalSpent
          };
        }
      );

    res.json({
      ok: true,
      customers:
        output
    });
  }
);

/* =========================================================
   ADMIN CUSTOMER DETAILS
   ========================================================= */

app.get(
  '/api/admin/customers/:id',
  adminAuth,
  (req, res) => {
    const customer =
      getCustomers().find(
        c =>
          String(c.id) ===
          String(
            req.params.id
          )
      );

    if (!customer) {
      return res.status(404).json({
        ok: false,
        message:
          'Customer not found.'
      });
    }

    const orders =
      getOrders().filter(
        o =>
          o.customerId ===
          customer.id
      );

    res.json({
      ok: true,

      customer:
        sanitizeCustomer(
          customer
        ),

      orders
    });
  }
);

/* =========================================================
   ADMIN SETTINGS GET
   ========================================================= */

app.get(
  '/api/admin/settings',
  adminAuth,
  (req, res) => {
    res.json({
      ok: true,

      settings:
        normalizeSettings()
    });
  }
);

/* =========================================================
   ADMIN SETTINGS UPDATE
   ========================================================= */

app.put(
  '/api/admin/settings',
  adminAuth,
  (req, res) => {
    try {
      const current =
        normalizeSettings();

      const incoming =
        req.body.settings ||
        req.body;

      const merged =
        deepMerge(
          current,
          incoming
        );

      /*
        Keep delivery values sane.
      */

      merged.delivery.baseLat =
        Number(
          merged.delivery.baseLat
        );

      merged.delivery.baseLng =
        Number(
          merged.delivery.baseLng
        );

      merged.delivery.codRadiusKm =
        Number(
          merged.delivery.codRadiusKm
        );

      merged.delivery.maxRadiusKm =
        Number(
          merged.delivery.maxRadiusKm
        );

      merged.delivery.ratePerKm =
        Number(
          merged.delivery.ratePerKm
        );

      merged.delivery.codCharge =
        Number(
          merged.delivery.codCharge
        );

      if (
        !Number.isFinite(
          merged.delivery.baseLat
        ) ||
        !Number.isFinite(
          merged.delivery.baseLng
        )
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Invalid delivery base coordinates.'
        });
      }

      if (
        merged.delivery.codRadiusKm <
        0
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'COD radius cannot be negative.'
        });
      }

      if (
        merged.delivery.maxRadiusKm <=
        0
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Maximum delivery radius must be greater than 0.'
        });
      }

      if (
        merged.delivery.codRadiusKm >
        merged.delivery.maxRadiusKm
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'COD radius cannot exceed maximum delivery radius.'
        });
      }

      /*
        Shop hours.
      */

      for (
        const day of [
          'normal',
          'friday'
        ]
      ) {
        const open =
          Number(
            merged.hours[
              day
            ].open
          );

        const close =
          Number(
            merged.hours[
              day
            ].close
          );

        if (
          !Number.isFinite(
            open
          ) ||
          !Number.isFinite(
            close
          ) ||
          open < 0 ||
          close > 24 ||
          close <= open
        ) {
          return res.status(400).json({
            ok: false,
            message:
              `Invalid ${day} shop hours.`
          });
        }
      }

      saveSettings(
        merged
      );

      res.json({
        ok: true,

        settings:
          normalizeSettings()
      });
    } catch (err) {
      console.error(
        'SETTINGS UPDATE ERROR:',
        err
      );

      res.status(500).json({
        ok: false,
        message:
          'Unable to update settings.'
      });
    }
  }
);

/* =========================================================
   ADMIN MENU IMAGE UPLOAD
   ========================================================= */

const storage =
  multer.diskStorage({
    destination:
      (req, file, cb) => {
        cb(
          null,
          ASSETS_DIR
        );
      },

    filename:
      (req, file, cb) => {
        const ext =
          path.extname(
            file.originalname
          ).toLowerCase();

        const safeExt =
          [
            '.jpg',
            '.jpeg',
            '.png',
            '.webp',
            '.gif'
          ].includes(ext)
            ? ext
            : '.jpg';

        cb(
          null,
          `menu-${Date.now()}-${crypto
            .randomBytes(4)
            .toString('hex')}${safeExt}`
        );
      }
  });

const upload =
  multer({
    storage,

    limits: {
      fileSize:
        5 * 1024 * 1024
    },

    fileFilter:
      (req, file, cb) => {
        const allowed = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif'
        ];

        if (
          allowed.includes(
            file.mimetype
          )
        ) {
          cb(
            null,
            true
          );
        } else {
          cb(
            new Error(
              'Only image files are allowed.'
            )
          );
        }
      }
  });

app.post(
  '/api/admin/menu/upload',
  adminAuth,
  upload.single('image'),
  (req, res) => {
    if (
      !req.file
    ) {
      return res.status(400).json({
        ok: false,
        message:
          'No image uploaded.'
      });
    }

    const imageUrl =
      `/assets/${req.file.filename}`;

    res.json({
      ok: true,
      image:
        imageUrl,
      url:
        imageUrl
    });
  }
);

/*
  Compatibility endpoint.
*/

app.post(
  '/api/admin/upload',
  adminAuth,
  upload.single('image'),
  (req, res) => {
    if (
      !req.file
    ) {
      return res.status(400).json({
        ok: false,
        message:
          'No image uploaded.'
      });
    }

    const imageUrl =
      `/assets/${req.file.filename}`;

    res.json({
      ok: true,
      image:
        imageUrl,
      url:
        imageUrl
    });
  }
);

/* =========================================================
   ADMIN HTML
   ========================================================= */

app.get(
  '/admin',
  (req, res) => {
    res.sendFile(
      path.join(
        PUBLIC_DIR,
        'admin.html'
      )
    );
  }
);

/*
  Also support /admin/
*/

app.get(
  '/admin/',
  (req, res) => {
    res.sendFile(
      path.join(
        PUBLIC_DIR,
        'admin.html'
      )
    );
  }
);

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
  '/api/health',
  (req, res) => {
    res.json({
      ok: true,

      service:
        "Chef Sifat's Kitchen",

      time:
        new Date().toISOString(),

      timezone:
        SHOP_TIME_ZONE
    });
  }
);

/* =========================================================
   404 API
   ========================================================= */

app.use(
  '/api',
  (req, res) => {
    res.status(404).json({
      ok: false,
      message:
        'API endpoint not found.'
    });
  }
);

/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use(
  (err, req, res, next) => {
    console.error(
      'SERVER ERROR:',
      err
    );

    if (
      err instanceof
      multer.MulterError
    ) {
      return res.status(400).json({
        ok: false,
        message:
          err.message
      });
    }

    if (
      err &&
      err.message ===
        'Only image files are allowed.'
    ) {
      return res.status(400).json({
        ok: false,
        message:
          err.message
      });
    }

    res.status(500).json({
      ok: false,
      message:
        'Internal server error.'
    });
  }
);

/* =========================================================
   START SERVER
   ========================================================= */

app.listen(
  PORT,
  () => {
    const s =
      normalizeSettings();

    console.log(
      '================================================='
    );

    console.log(
      " Chef Sifat's Kitchen Server"
    );

    console.log(
      '================================================='
    );

    console.log(
      `PORT: ${PORT}`
    );

    console.log(
      `Timezone: ${SHOP_TIME_ZONE}`
    );

    console.log(
      `Base: ${s.delivery.baseName}`
    );

    console.log(
      `Base Coordinates: ${s.delivery.baseLat}, ${s.delivery.baseLng}`
    );

    console.log(
      `COD Radius: ${s.delivery.codRadiusKm} km`
    );

    console.log(
      `Max Delivery Radius: ${s.delivery.maxRadiusKm} km`
    );

    console.log(
      `Delivery Rate: ৳${s.delivery.ratePerKm}/started km`
    );

    console.log(
      `Normal Shop Hours: ${s.hours.normal.open}:00–${s.hours.normal.close}:00`
    );

    console.log(
      `Friday Shop Hours: ${s.hours.friday.open}:00–${s.hours.friday.close}:00`
    );

    console.log(
      'Customer Order Window: Opening + 1 hour → Closing - 1 hour'
    );

    console.log(
      'Delivery Slots: 30 minutes'
    );

    console.log(
      'Pizza Pre-booking: OFF'
    );

    console.log(
      '================================================='
    );
  }
);
