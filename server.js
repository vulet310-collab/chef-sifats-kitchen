'use strict';
/*
=========================================================
 CHEF SIFAT'S KITCHEN
 Full Server
=========================================================

Includes:
- Express server
- Helmet security
- Rate limiting
- Admin JWT authentication
- Customer registration/login
- Customer forgot password / reset password
- Customer order history
- Login-required ordering
- Delivery location validation
- COD radius validation
- Delivery charge calculation
- bKash / Nagad payment validation
- Pre-booking validation
- Menu management
- Image upload
- Reviews
- Admin settings
=========================================================
*/

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const app = express();

/* =======================================================
   PATHS
======================================================= */

const DATA = path.join(__dirname, 'data');
const PUBLIC = path.join(__dirname, 'public');
const ASSETS = path.join(PUBLIC, 'assets');

if (!fs.existsSync(DATA)) {
  fs.mkdirSync(DATA, { recursive: true });
}

if (!fs.existsSync(PUBLIC)) {
  fs.mkdirSync(PUBLIC, { recursive: true });
}

if (!fs.existsSync(ASSETS)) {
  fs.mkdirSync(ASSETS, { recursive: true });
}

/* =======================================================
   DATA FILES
======================================================= */

const SETTINGS_FILE = path.join(DATA, 'settings.json');
const MENU_FILE = path.join(DATA, 'menu.json');
const ORDERS_FILE = path.join(DATA, 'orders.json');
const REVIEWS_FILE = path.join(DATA, 'reviews.json');
const CUSTOMERS_FILE = path.join(DATA, 'customers.json');

/* =======================================================
   INITIAL FILES
======================================================= */

function ensureJsonFile(file, fallback) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      JSON.stringify(fallback, null, 2),
      'utf8'
    );
  }
}

ensureJsonFile(SETTINGS_FILE, {});
ensureJsonFile(MENU_FILE, []);
ensureJsonFile(ORDERS_FILE, []);
ensureJsonFile(REVIEWS_FILE, []);
ensureJsonFile(CUSTOMERS_FILE, []);

/* =======================================================
   JSON HELPERS
======================================================= */

function read(file, fallback) {
  try {
    if (!fs.existsSync(file)) {
      return fallback;
    }

    const raw = fs.readFileSync(file, 'utf8');

    if (!raw.trim()) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error('READ ERROR:', file, error.message);
    return fallback;
  }
}

function write(file, data) {
  fs.writeFileSync(
    file,
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

/* =======================================================
   DEFAULT SETTINGS
======================================================= */

function defaultSettings() {
  return {
    delivery: {
      baseLat: 23.3022494,
      baseLng: 90.9187528,
      baseName: 'Kahalthuri Hamidia High School',

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
      enabled: true,
      minHours: 5,
      maxHours: 12
    }
  };
}

/* =======================================================
   SETTINGS MERGE
======================================================= */

function getSettings() {
  const defaults = defaultSettings();
  const saved = read(SETTINGS_FILE, {});

  return {
    ...defaults,
    ...saved,

    delivery: {
      ...defaults.delivery,
      ...(saved.delivery || {})
    },

    payment: {
      ...defaults.payment,
      ...(saved.payment || {})
    },

    hours: {
      ...defaults.hours,
      ...(saved.hours || {}),

      normal: {
        ...defaults.hours.normal,
        ...((saved.hours || {}).normal || {})
      },

      friday: {
        ...defaults.hours.friday,
        ...((saved.hours || {}).friday || {})
      }
    },

    prebook: {
      ...defaults.prebook,
      ...(saved.prebook || {})
    }
  };
}

/* =======================================================
   ENVIRONMENT
======================================================= */

const PORT = process.env.PORT || 10000;

const SECRET =
  process.env.JWT_SECRET ||
  'CHANGE_THIS_JWT_SECRET_IN_RENDER';

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME ||
  'admin';

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ||
  '';

/* =======================================================
   MIDDLEWARE
======================================================= */

app.disable('x-powered-by');

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

/* =======================================================
   RATE LIMITERS
======================================================= */

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    ok: false,
    message: 'Too many requests. Please try again later.'
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    ok: false,
    message: 'Too many login attempts. Please try again later.'
  }
});

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    ok: false,
    message: 'Too many password reset attempts. Please try again later.'
  }
});

app.use(generalLimiter);

/* =======================================================
   STATIC FILES
======================================================= */

app.use(
  '/assets',
  express.static(ASSETS)
);

app.use(
  express.static(PUBLIC)
);

/* =======================================================
   BASIC HELPERS
======================================================= */

function cleanString(value, max = 500) {
  return String(value || '')
    .trim()
    .slice(0, max);
}

function makeId(prefix = 'id') {
  return (
    prefix +
    '_' +
    Date.now().toString(36) +
    '_' +
    crypto.randomBytes(5).toString('hex')
  );
}

/* =======================================================
   PHONE VALIDATION
======================================================= */

function normalizePhone(phone) {
  let value = cleanString(phone, 30)
    .replace(/[\s-]/g, '');

  if (value.startsWith('+880')) {
    value = '0' + value.slice(4);
  } else if (value.startsWith('880')) {
    value = '0' + value.slice(3);
  }

  return value;
}

function validBangladeshPhone(phone) {
  return /^01\d{9}$/.test(
    normalizePhone(phone)
  );
}

/* =======================================================
   EMAIL VALIDATION
======================================================= */

function normalizeEmail(email) {
  return cleanString(email, 200).toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    normalizeEmail(email)
  );
}

/* =======================================================
   PASSWORD HELPERS
======================================================= */

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');

  const hash = crypto
    .scryptSync(
      String(password),
      salt,
      64
    )
    .toString('hex');

  return {
    salt,
    hash
  };
}

function verifyPassword(password, storedHash, salt) {
  try {
    const hash = crypto
      .scryptSync(
        String(password),
        String(salt),
        64
      )
      .toString('hex');

    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch (error) {
    return false;
  }
}

/* =======================================================
   CUSTOMER SAFE DATA
======================================================= */

function customerSafeData(customer) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    createdAt: customer.createdAt
  };
}

/* =======================================================
   CUSTOMER JWT
======================================================= */

function createCustomerToken(customer) {
  return jwt.sign(
    {
      id: customer.id,
      role: 'customer'
    },
    SECRET,
    {
      expiresIn: '30d'
    }
  );
}

/* =======================================================
   ADMIN JWT
======================================================= */

function createAdminToken(username) {
  return jwt.sign(
    {
      username,
      role: 'admin'
    },
    SECRET,
    {
      expiresIn: '8h'
    }
  );
}

/* =======================================================
   ADMIN AUTH
======================================================= */

function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        message: 'Admin authentication required.'
      });
    }

    const token = header.slice(7);

    const payload = jwt.verify(
      token,
      SECRET
    );

    if (
      !payload ||
      payload.role !== 'admin'
    ) {
      return res.status(403).json({
        ok: false,
        message: 'Admin access required.'
      });
    }

    req.admin = payload;

    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Invalid or expired admin token.'
    });
  }
}

/* =======================================================
   CUSTOMER AUTH
======================================================= */

function customerAuth(req, res, next) {
  try {
    const header =
      req.headers.authorization || '';

    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        message: 'Please login before placing an order.'
      });
    }

    const token = header.slice(7);

    const payload = jwt.verify(
      token,
      SECRET
    );

    if (
      !payload ||
      payload.role !== 'customer' ||
      !payload.id
    ) {
      return res.status(403).json({
        ok: false,
        message: 'Customer login required.'
      });
    }

    const customers =
      read(CUSTOMERS_FILE, []);

    const customer =
      customers.find(
        item => item.id === payload.id
      );

    if (!customer) {
      return res.status(401).json({
        ok: false,
        message: 'Customer account not found.'
      });
    }

    req.customer = customer;

    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Customer login expired. Please login again.'
    });
  }
}

/* =======================================================
   HAVERSINE DISTANCE
======================================================= */

function distanceKm(
  lat1,
  lng1,
  lat2,
  lng2
) {
  const R = 6371;

  const dLat =
    (lat2 - lat1) *
    Math.PI /
    180;

  const dLng =
    (lng2 - lng1) *
    Math.PI /
    180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      lat1 * Math.PI / 180
    ) *
    Math.cos(
      lat2 * Math.PI / 180
    ) *
    Math.sin(dLng / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

/* =======================================================
   LOCATION VALIDATION
======================================================= */

function validateCoordinates(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/* =======================================================
   PAYMENT HELPERS
======================================================= */

function normalizePayment(value) {
  return cleanString(value, 200);
}

function paymentIsCOD(payment) {
  return /^cash on delivery/i.test(
    normalizePayment(payment)
  );
}

function paymentIsBkash(payment) {
  return /^bKash/i.test(
    normalizePayment(payment)
  );
}

function paymentIsNagad(payment) {
  return /^Nagad/i.test(
    normalizePayment(payment)
  );
}

function validTransactionId(value) {
  const tx = cleanString(value, 50);

  if (!tx) {
    return false;
  }

  /*
    Supports transaction ID or
    last 5 digits.
  */
  return /^\d{5,50}$/.test(tx);
}

/* =======================================================
   MENU
======================================================= */

function getMenu() {
  const menu = read(
    MENU_FILE,
    []
  );

  if (!Array.isArray(menu)) {
    return [];
  }

  return menu.map(normalizeProduct);
}
function normalizeProduct(product) {

  const rawSizes =
    Array.isArray(product.sizes)
      ? product.sizes
      : [];


  const sizes =
    rawSizes
      .map(size => {

        if (Array.isArray(size)) {

          return [
            cleanString(size[0], 100),
            Number(size[1]) || 0
          ];

        }

        if (
          size &&
          typeof size === 'object'
        ) {

          return [
            cleanString(
              size.name ||
              size.label ||
              size.size ||
              '',
              100
            ),

            Number(
              size.price
            ) || 0
          ];

        }

        return ['', 0];

      })
      .filter(
        size =>
          size[0] &&
          size[1] > 0
      );


  const firstPrice =
    sizes.length
      ? Number(sizes[0][1])
      : Number(product.price) || 0;


  const item = {

    id:
      product.id ||
      makeId('item'),


    name:
      cleanString(
        product.name,
        200
      ),


    cat:
      cleanString(
        product.cat,
        50
      ).toLowerCase(),


    price:
      firstPrice,


    sizes,


    image:
      cleanString(
        product.image,
        500
      ),


    description:
      cleanString(
        product.description,
        1000
      ),


    choice:
      cleanString(
        product.choice ||
        (sizes[0] ? sizes[0][0] : ''),
        200
      ),


    options:
      Array.isArray(product.options)
        ? product.options
        : [],


    minQty:
      Number(product.minQty) > 0
        ? Number(product.minQty)
        : 1,


    maxQty:
      Number(product.maxQty) > 0
        ? Number(product.maxQty)
        : 100,


    prebook:
      Boolean(product.prebook),


    active:
      product.active !== false

  };


  /*
    PIZZA IS ALWAYS NON-PREBOOK.
  */

  if (
    item.cat === 'pizza'
  ) {

    item.prebook =
      false;
  }


  return item;
}

/* =======================================================
   PREBOOK CATEGORY
======================================================= */

function isPrebookCategory(
  product
) {
  return Boolean(
    product &&
    product.prebook === true
  );
}

/* =======================================================
   SHOP HOURS
======================================================= */

function getShopHoursForDate(date) {
  const settings =
    getSettings();

  const day =
    date.getDay();

  if (day === 5) {
    return {
      open:
        Number(
          settings.hours.friday.open
        ),
      close:
        Number(
          settings.hours.friday.close
        )
    };
  }

  return {
    open:
      Number(
        settings.hours.normal.open
      ),
    close:
      Number(
        settings.hours.normal.close
      )
  };
}

function isWithinShopHours(date) {
  const hours =
    getShopHoursForDate(date);

  const hour =
    date.getHours();

  return (
    hour >= hours.open &&
    hour < hours.close
  );
}

/* =======================================================
   PREBOOK VALIDATION
======================================================= */

function validatePrebookRequest(
  deliveryTime
) {
  const settings =
    getSettings();

  if (
    !settings.prebook.enabled
  ) {
    return {
      ok: false,
      message:
        'Pre-booking is currently unavailable.'
    };
  }

  const date =
    new Date(deliveryTime);

  if (
    Number.isNaN(date.getTime())
  ) {
    return {
      ok: false,
      message:
        'Invalid pre-booking date/time.'
    };
  }

  const now =
    new Date();

  const min =
    new Date(
      now.getTime() +
      Number(
        settings.prebook.minHours
      ) *
      60 *
      60 *
      1000
    );

  const max =
    new Date(
      now.getTime() +
      Number(
        settings.prebook.maxHours
      ) *
      60 *
      60 *
      1000
    );

  if (
    date < min ||
    date > max
  ) {
    return {
      ok: false,
      message:
        `Pre-booking must be between ${settings.prebook.minHours} and ${settings.prebook.maxHours} hours in advance.`
    };
  }

  if (
    !isWithinShopHours(date)
  ) {
    return {
      ok: false,
      message:
        'Selected delivery time is outside shop hours.'
    };
  }

  return {
    ok: true
  };
}

/* =======================================================
   DELIVERY TIME VALIDATION
======================================================= */

function validateDeliveryTime(
  deliveryTime,
  hasPrebook
) {
  if (!hasPrebook) {
    return {
      ok: true
    };
  }

  return validatePrebookRequest(
    deliveryTime
  );
}

/* =======================================================
   SEND PASSWORD RESET EMAIL
======================================================= */

async function sendPasswordResetEmail(
  email,
  code
) {
  const apiKey =
    process.env.RESEND_API_KEY;

  const fromEmail =
    process.env.FROM_EMAIL ||
    'onboarding@resend.dev';

  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY is not configured.'
    );
  }

  const response =
    await fetch(
      'https://api.resend.com/emails',
      {
        method: 'POST',

        headers: {
          'Authorization':
            `Bearer ${apiKey}`,

          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({
          from:
            `Chef Sifat's Kitchen <${fromEmail}>`,

          to: [email],

          subject:
            'Chef Sifat’s Kitchen — Password Reset Code',

          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
              <h2>Chef Sifat’s Kitchen</h2>

              <p>
                You requested a password reset for your customer account.
              </p>

              <p>Your verification code is:</p>

              <div style="
                font-size:32px;
                font-weight:bold;
                letter-spacing:8px;
                padding:18px;
                background:#f5f5f5;
                text-align:center;
                margin:20px 0;
              ">
                ${code}
              </div>

              <p>
                This code will expire in 15 minutes.
              </p>

              <p>
                If you did not request this, you can safely ignore this email.
              </p>

              <hr>

              <small>
                Chef Sifat’s Kitchen
              </small>
            </div>
          `
        })
      }
    );

  if (!response.ok) {
    const text =
      await response.text();

    throw new Error(
      `Resend API error: ${response.status} ${text}`
    );
  }

  return true;
}

/* =======================================================
   CONFIG
======================================================= */

app.get(
  '/api/config',
  (req, res) => {
    const settings =
      getSettings();

    res.json({
      ok: true,

      delivery: {
        baseLat:
          settings.delivery.baseLat,

        baseLng:
          settings.delivery.baseLng,

        baseName:
          settings.delivery.baseName,

        codRadiusKm:
          settings.delivery.codRadiusKm,

        maxRadiusKm:
          settings.delivery.maxRadiusKm,

        ratePerKm:
          settings.delivery.ratePerKm,

        codCharge:
          settings.delivery.codCharge
      },

      payment: {
        bkash:
          settings.payment.bkash,

        nagad:
          settings.payment.nagad,

        method:
          settings.payment.method
      },

      hours:
        settings.hours,

      prebook:
        settings.prebook
    });
  }
);

/* =======================================================
   LOCATION CHECK
======================================================= */

app.post(
  '/api/location/check',
  (req, res) => {
    try {
      const lat =
        Number(req.body.lat);

      const lng =
        Number(req.body.lng);

      if (
        !validateCoordinates(
          lat,
          lng
        )
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Invalid delivery coordinates.'
        });
      }

      const settings =
        getSettings();

      const distance =
        distanceKm(
          Number(
            settings.delivery.baseLat
          ),
          Number(
            settings.delivery.baseLng
          ),
          lat,
          lng
        );

      const maxRadius =
        Number(
          settings.delivery.maxRadiusKm
        );

      const codRadius =
        Number(
          settings.delivery.codRadiusKm
        );

      if (
        distance > maxRadius
      ) {
        return res.json({
          ok: true,
          available: false,
          codAvailable: false,
          distanceKm:
            Number(
              distance.toFixed(2)
            ),
          deliveryCharge: null,
          message:
            'Sorry. Your delivery location is outside our 4 km delivery area.'
        });
      }

      const codAvailable =
        distance <= codRadius;

      const deliveryCharge =
        codAvailable
          ? Number(
              settings.delivery.codCharge
            )
          : Math.ceil(distance) *
            Number(
              settings.delivery.ratePerKm
            );

      res.json({
        ok: true,
        available: true,

        codAvailable,

        distanceKm:
          Number(
            distance.toFixed(2)
          ),

        deliveryCharge,

        paymentRequired:
          codAvailable
            ? 'COD or Online Payment'
            : 'Online Payment Only'
      });
    } catch (error) {
      console.error(
        'LOCATION CHECK ERROR:',
        error
      );

      res.status(500).json({
        ok: false,
        message:
          'Unable to check delivery location.'
      });
    }
  }
);

/* =======================================================
   CUSTOMER REGISTER
======================================================= */

app.post(
  '/api/customer/register',
  loginLimiter,
  async (req, res) => {
    try {
      const name =
        cleanString(
          req.body.name,
          100
        );

      const phone =
        normalizePhone(
          req.body.phone
        );

      const email =
        normalizeEmail(
          req.body.email
        );

      const password =
        String(
          req.body.password || ''
        );

      const confirmPassword =
        String(
          req.body.confirmPassword ||
          req.body.confirm_password ||
          ''
        );

      if (!name) {
        return res.status(400).json({
          ok: false,
          message:
            'Please enter your name.'
        });
      }

      if (
        !validBangladeshPhone(
          phone
        )
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Please enter a valid Bangladesh mobile number.'
        });
      }

      if (
        !validEmail(email)
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Please enter a valid email address.'
        });
      }

      if (
        password.length < 8
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Password must be at least 8 characters.'
        });
      }

      if (
        password !==
        confirmPassword
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Passwords do not match.'
        });
      }

      const customers =
        read(
          CUSTOMERS_FILE,
          []
        );

      const existingPhone =
        customers.find(
          item =>
            normalizePhone(
              item.phone
            ) === phone
        );

      if (existingPhone) {
        return res.status(409).json({
          ok: false,
          message:
            'An account with this mobile number already exists.'
        });
      }

      const existingEmail =
        customers.find(
          item =>
            normalizeEmail(
              item.email
            ) === email
        );

      if (existingEmail) {
        return res.status(409).json({
          ok: false,
          message:
            'An account with this email already exists.'
        });
      }

      const passwordData =
        hashPassword(password);

      const customer = {
        id:
          makeId('customer'),

        name,

        phone,

        email,

        passwordHash:
          passwordData.hash,

        passwordSalt:
          passwordData.salt,

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString(),

        resetCodeHash: null,

        resetCodeExpiresAt: null
      };

      customers.push(customer);

      write(
        CUSTOMERS_FILE,
        customers
      );

      const token =
        createCustomerToken(
          customer
        );

      res.status(201).json({
        ok: true,

        message:
          'Customer account created successfully.',

        token,

        customer:
          customerSafeData(
            customer
          )
      });
    } catch (error) {
      console.error(
        'CUSTOMER REGISTER ERROR:',
        error
      );

      res.status(500).json({
        ok: false,
        message:
          'Unable to create customer account.'
      });
    }
  }
);

/* =======================================================
   CUSTOMER LOGIN
======================================================= */

app.post(
  '/api/customer/login',
  loginLimiter,
  (req, res) => {
    try {
      const identifier =
        cleanString(
          req.body.identifier ||
          req.body.email ||
          req.body.phone ||
          req.body.login,
          200
        );

      const password =
        String(
          req.body.password || ''
        );

      if (!identifier) {
        return res.status(400).json({
          ok: false,
          message:
            'Please enter your mobile number or email.'
        });
      }

      if (!password) {
        return res.status(400).json({
          ok: false,
          message:
            'Please enter your password.'
        });
      }

      const customers =
        read(
          CUSTOMERS_FILE,
          []
        );

      const normalizedIdentifier =
        identifier.toLowerCase();

      const customer =
        customers.find(
          item => {
            const email =
              normalizeEmail(
                item.email
              );

            const phone =
              normalizePhone(
                item.phone
              );

            const inputPhone =
              normalizePhone(
                identifier
              );

            return (
              email ===
                normalizedIdentifier ||
              phone ===
                inputPhone
            );
          }
        );

      if (!customer) {
        return res.status(401).json({
          ok: false,
          message:
            'Invalid email/mobile or password.'
        });
      }

      const valid =
        verifyPassword(
          password,
          customer.passwordHash,
          customer.passwordSalt
        );

      if (!valid) {
        return res.status(401).json({
          ok: false,
          message:
            'Invalid email/mobile or password.'
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
          customerSafeData(
            customer
          )
      });
    } catch (error) {
      console.error(
        'CUSTOMER LOGIN ERROR:',
        error
      );

      res.status(500).json({
        ok: false,
        message:
          'Unable to login.'
      });
    }
  }
);

/* =======================================================
   CUSTOMER ME
======================================================= */

app.get(
  '/api/customer/me',
  customerAuth,
  (req, res) => {
    res.json({
      ok: true,

      customer:
        customerSafeData(
          req.customer
        )
    });
  }
);

/* =======================================================
   CUSTOMER ORDERS
======================================================= */

app.get(
  '/api/customer/orders',
  customerAuth,
  (req, res) => {
    try {
      const orders =
        read(
          ORDERS_FILE,
          []
        );

      const customerOrders =
        orders
          .filter(
            order =>
              order.customerId ===
              req.customer.id
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt) -
              new Date(a.createdAt)
          );

      res.json({
        ok: true,
        orders:
          customerOrders
      });
    } catch (error) {
      console.error(
        'CUSTOMER ORDERS ERROR:',
        error
      );

      res.status(500).json({
        ok: false,
        message:
          'Unable to load your orders.'
      });
    }
  }
);

/* =======================================================
   FORGOT PASSWORD
======================================================= */

app.post(
  '/api/customer/forgot-password',
  passwordLimiter,
  async (req, res) => {
    const genericMessage =
      'If an account exists with this email, a password reset code has been sent.';

    try {
      const email =
        normalizeEmail(
          req.body.email
        );

      if (
        !validEmail(email)
      ) {
        return res.json({
          ok: true,
          message:
            genericMessage
        });
      }

      const customers =
        read(
          CUSTOMERS_FILE,
          []
        );

      const customer =
        customers.find(
          item =>
            normalizeEmail(
              item.email
            ) === email
        );

      /*
        Do not reveal whether
        an account exists.
      */
      if (!customer) {
        return res.json({
          ok: true,
          message:
            genericMessage
        });
      }

      const code =
        String(
          crypto.randomInt(
            100000,
            1000000
          )
        );

      const codeHash =
        crypto
          .createHash('sha256')
          .update(code)
          .digest('hex');

      customer.resetCodeHash =
        codeHash;

      customer.resetCodeExpiresAt =
        new Date(
          Date.now() +
          15 * 60 * 1000
        ).toISOString();

      customer.updatedAt =
        new Date().toISOString();

      write(
        CUSTOMERS_FILE,
        customers
      );

      try {
        await sendPasswordResetEmail(
          email,
          code
        );
      } catch (mailError) {
        /*
          Remove reset code if
          email could not be sent.
        */
        customer.resetCodeHash = null;
        customer.resetCodeExpiresAt = null;

        write(
          CUSTOMERS_FILE,
          customers
        );

        console.error(
          'PASSWORD RESET EMAIL ERROR:',
          mailError.message
        );

        return res.status(500).json({
          ok: false,
          message:
            'Unable to send password reset email right now. Please try again later.'
        });
      }

      res.json({
        ok: true,
        message:
          genericMessage
      });
    } catch (error) {
      console.error(
        'FORGOT PASSWORD ERROR:',
        error
      );

      res.status(500).json({
        ok: false,
        message:
          'Unable to process password reset.'
      });
    }
  }
);

/* =======================================================
   RESET PASSWORD
======================================================= */

app.post(
  '/api/customer/reset-password',
  passwordLimiter,
  (req, res) => {
    try {
      const email =
        normalizeEmail(
          req.body.email
        );

      const code =
        cleanString(
          req.body.code,
          20
        );

      const newPassword =
        String(
          req.body.newPassword ||
          req.body.password ||
          ''
        );

      if (
        !validEmail(email)
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Invalid email address.'
        });
      }

      if (
        !/^\d{6}$/.test(code)
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Invalid reset code.'
        });
      }

      if (
        newPassword.length < 8
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'New password must be at least 8 characters.'
        });
      }

      const customers =
        read(
          CUSTOMERS_FILE,
          []
        );

      const customer =
        customers.find(
          item =>
            normalizeEmail(
              item.email
            ) === email
        );

      if (!customer) {
        return res.status(400).json({
          ok: false,
          message:
            'Invalid or expired reset code.'
        });
      }

      if (
        !customer.resetCodeHash ||
        !customer.resetCodeExpiresAt
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Invalid or expired reset code.'
        });
      }

      const expires =
        new Date(
          customer.resetCodeExpiresAt
        ).getTime();

      if (
        !Number.isFinite(expires) ||
        Date.now() > expires
      ) {
        customer.resetCodeHash = null;
        customer.resetCodeExpiresAt = null;

        write(
          CUSTOMERS_FILE,
          customers
        );

        return res.status(400).json({
          ok: false,
          message:
            'Reset code has expired. Please request a new code.'
        });
      }

      const incomingHash =
        crypto
          .createHash('sha256')
          .update(code)
          .digest('hex');

      if (
        incomingHash !==
        customer.resetCodeHash
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Invalid or expired reset code.'
        });
      }

      const passwordData =
        hashPassword(
          newPassword
        );

      customer.passwordHash =
        passwordData.hash;

      customer.passwordSalt =
        passwordData.salt;

      customer.resetCodeHash =
        null;

      customer.resetCodeExpiresAt =
        null;

      customer.updatedAt =
        new Date().toISOString();

      write(
        CUSTOMERS_FILE,
        customers
      );

      res.json({
        ok: true,
        message:
          'Password reset successful. Please login with your new password.'
      });
    } catch (error) {
      console.error(
        'RESET PASSWORD ERROR:',
        error
      );

      res.status(500).json({
        ok: false,
        message:
          'Unable to reset password.'
      });
    }
  }
);

/* =======================================================
   CREATE ORDER
   LOGIN REQUIRED
======================================================= */

app.post(
  '/api/orders',
  customerAuth,
  (req, res) => {
    try {
      const body =
        req.body || {};

      const name =
        cleanString(
          body.name,
          100
        );

      const phone =
        normalizePhone(
          body.phone
        );

      const house =
        cleanString(
          body.house,
          300
        );

      const road =
        cleanString(
          body.road,
          300
        );

      const mapAddress =
        cleanString(
          body.mapAddress,
          500
        );

      const note =
        cleanString(
          body.note,
          1000
        );

      const payment =
        normalizePayment(
          body.payment
        );

      const transactionId =
        cleanString(
          body.transactionId ||
          body.tx,
          50
        );

      const lat =
        Number(body.lat);

      const lng =
        Number(body.lng);

      const deliveryTime =
        body.deliveryTime ||
        body.prebookTime ||
        '';

      const requestedItems =
        Array.isArray(body.items)
          ? body.items
          : [];

      /* =================================================
         BASIC VALIDATION
      ================================================= */

      if (!name) {
        return res.status(400).json({
          ok: false,
          message:
            'Customer name is required.'
        });
      }

      if (
        !validBangladeshPhone(
          phone
        )
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Please enter a valid Bangladesh mobile number.'
        });
      }

      if (!house) {
        return res.status(400).json({
          ok: false,
          message:
            'House / Building is required.'
        });
      }

      if (!road) {
        return res.status(400).json({
          ok: false,
          message:
            'Road / Area is required.'
        });
      }

      if (
        !validateCoordinates(
          lat,
          lng
        )
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Please select your delivery location on the map.'
        });
      }

      if (
        !requestedItems.length
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Your cart is empty.'
        });
      }

      /* =================================================
         CUSTOMER IDENTITY
      ================================================= */

      /*
        The logged-in account is the
        actual customer.

        We keep checkout name/phone,
        but prevent changing the account
        phone to another number.
      */

      const customerPhone =
        normalizePhone(
          req.customer.phone
        );

      if (
        phone !==
        customerPhone
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'The checkout phone number must match your logged-in account.'
        });
      }

      /* =================================================
         SERVER MENU
      ================================================= */

      const menu =
        getMenu();

      const cleanItems = [];

      let subtotal = 0;

      let hasPrebook = false;

      for (
        const requested
        of requestedItems
      ) {
        const productId =
          String(
            requested.id ||
            requested.productId ||
            ''
          );

        const product =
          menu.find(
            item =>
              String(item.id) ===
              productId
          );

        if (
          !product ||
          product.active === false
        ) {
          return res.status(400).json({
            ok: false,
            message:
              'One of the selected menu items is no longer available.'
          });
        }

        const qty =
          Number(
            requested.qty
          );

        if (
          !Number.isInteger(qty) ||
          qty < 1
        ) {
          return res.status(400).json({
            ok: false,
            message:
              `Invalid quantity for ${product.name}.`
          });
        }

        const minQty =
          Number(product.minQty) || 1;

        const maxQty =
          Number(product.maxQty) || 100;

        if (
          qty < minQty ||
          qty > maxQty
        ) {
          return res.status(400).json({
            ok: false,
            message:
              `${product.name} quantity must be between ${minQty} and ${maxQty}.`
          });
        }

        /*
          Use SERVER price.
          Never trust price sent
          from browser.
        */

        const unitPrice =
          Number(product.price);

        const lineTotal =
          unitPrice * qty;

        const itemPrebook =
          isPrebookCategory(
            product
          );

        if (
          itemPrebook
        ) {
          hasPrebook = true;
        }

        cleanItems.push({
          id:
            product.id,

          name:
            product.name,

          cat:
            product.cat,

          choice:
            cleanString(
              requested.choice ||
              product.choice,
              200
            ),

          qty,

          price:
            unitPrice,

          total:
            lineTotal,

          prebook:
            itemPrebook,

          image:
            product.image || ''
        });

        subtotal +=
          lineTotal;
      }

      /* =================================================
         DELIVERY DISTANCE
      ================================================= */

      const settings =
        getSettings();

      const distance =
        distanceKm(
          Number(
            settings.delivery.baseLat
          ),
          Number(
            settings.delivery.baseLng
          ),
          lat,
          lng
        );

      const maxRadius =
        Number(
          settings.delivery.maxRadiusKm
        );

      const codRadius =
        Number(
          settings.delivery.codRadiusKm
        );

      if (
        distance >
        maxRadius
      ) {
        return res.status(400).json({
          ok: false,
          code:
            'OUTSIDE_DELIVERY_AREA',

          message:
            `Sorry. Your delivery location is outside our ${maxRadius} km delivery area.`
        });
      }

      const codAvailable =
        distance <= codRadius;

      const deliveryCharge =
        codAvailable
          ? Number(
              settings.delivery.codCharge
            )
          : Math.ceil(
              distance
            ) *
            Number(
              settings.delivery.ratePerKm
            );

      /* =================================================
         PAYMENT
      ================================================= */

      if (!payment) {
        return res.status(400).json({
          ok: false,
          message:
            'Please select a payment method.'
        });
      }

      /*
        Pre-booking:
        Full online payment only.
      */

      if (
        hasPrebook
      ) {
        if (
          paymentIsCOD(
            payment
          )
        ) {
          return res.status(400).json({
            ok: false,
            message:
              'Cash on Delivery is not available for pre-booking orders.'
          });
        }

        if (
          !paymentIsBkash(
            payment
          ) &&
          !paymentIsNagad(
            payment
          )
        ) {
          return res.status(400).json({
            ok: false,
            message:
              'Please select bKash or Nagad for pre-booking.'
          });
        }

        if (
          !validTransactionId(
            transactionId
          )
        ) {
          return res.status(400).json({
            ok: false,
            message:
              'Full payment is required for pre-booking. Please enter the transaction ID / last 5 digits.'
          });
        }
      }

      /*
        Outside COD radius:
        Online payment required.
      */

      if (
        !hasPrebook &&
        !codAvailable
      ) {
        if (
          paymentIsCOD(
            payment
          )
        ) {
          return res.status(400).json({
            ok: false,
            message:
              'Cash on Delivery is not available at this location. Please pay by bKash or Nagad.'
          });
        }

        if (
          !paymentIsBkash(
            payment
          ) &&
          !paymentIsNagad(
            payment
          )
        ) {
          return res.status(400).json({
            ok: false,
            message:
              'Online payment by bKash or Nagad is required for this location.'
          });
        }

        if (
          !validTransactionId(
            transactionId
          )
        ) {
          return res.status(400).json({
            ok: false,
            message:
              'Please enter the online payment transaction ID / last 5 digits.'
          });
        }
      }

      /*
        COD:
        Only inside COD radius.
      */

      if (
        paymentIsCOD(
          payment
        )
      ) {
        if (
          !codAvailable
        ) {
          return res.status(400).json({
            ok: false,
            message:
              'Cash on Delivery is not available at your location.'
          });
        }

        if (
          hasPrebook
        ) {
          return res.status(400).json({
            ok: false,
            message:
              'COD is not available for pre-booking.'
          });
        }
      }

      /*
        Any online payment must have
        transaction ID.
      */

      const isOnlinePayment =
        paymentIsBkash(
          payment
        ) ||
        paymentIsNagad(
          payment
        );

      if (
        isOnlinePayment &&
        !validTransactionId(
          transactionId
        )
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Please enter the transaction ID / last 5 digits.'
        });
      }

      /* =================================================
         DELIVERY TIME
      ================================================= */

      if (
        hasPrebook
      ) {
        if (!deliveryTime) {
          return res.status(400).json({
            ok: false,
            message:
              'Please select a pre-booking delivery time.'
          });
        }

        const timeValidation =
          validateDeliveryTime(
            deliveryTime,
            true
          );

        if (
          !timeValidation.ok
        ) {
          return res.status(400).json({
            ok: false,
            message:
              timeValidation.message
          });
        }
      }

      /* =================================================
         TOTAL
      ================================================= */

      const total =
        subtotal +
        deliveryCharge;

      /* =================================================
         CREATE ORDER
      ================================================= */

      const orders =
        read(
          ORDERS_FILE,
          []
        );

      const order = {
        id:
          makeId('order'),

        createdAt:
          new Date().toISOString(),

        status:
          'pending',

        customerId:
          req.customer.id,

        customerEmail:
          cleanString(
            req.customer.email,
            200
          ),

        name,

        phone,

        email:
          cleanString(
            req.customer.email,
            200
          ),

        address: {
          house,
          road,
          mapAddress
        },

        lat,

        lng,

        distanceKm:
          Number(
            distance.toFixed(3)
          ),

        deliveryCharge,

        subtotal,

        total,

        paymentMethod:
          payment,

        paymentType:
          paymentIsCOD(
            payment
          )
            ? 'COD'
            : 'ONLINE',

        transactionId:
          paymentIsCOD(
            payment
          )
            ? ''
            : transactionId,

        deliveryTime:
          hasPrebook
            ? new Date(
                deliveryTime
              ).toISOString()
            : '',

        prebook:
          hasPrebook,

        prebookSettings:
          hasPrebook
            ? settings.prebook
            : null,

        items:
          cleanItems,

        note
      };

      orders.push(
        order
      );

      write(
        ORDERS_FILE,
        orders
      );

      res.status(201).json({
        ok: true,

        message:
          'Order placed successfully.',

        order
      });
    } catch (error) {
      console.error(
        'CREATE ORDER ERROR:',
        error
      );

      res.status(500).json({
        ok: false,
        message:
          'Unable to place order right now.'
      });
    }
  }
);

/* =======================================================
   PUBLIC REVIEWS
======================================================= */

app.get(
  '/api/reviews',
  (req, res) => {
    const reviews =
      read(
        REVIEWS_FILE,
        []
      );

    const approved =
      Array.isArray(reviews)
        ? reviews.filter(
            item =>
              item.approved !== false
          )
        : [];

    res.json({
      ok: true,
      reviews:
        approved
    });
  }
);

/* =======================================================
   POST REVIEW
======================================================= */

app.post(
  '/api/reviews',
  customerAuth,
  (req, res) => {
    try {
      const rating =
        Number(
          req.body.rating
        );

      const comment =
        cleanString(
          req.body.comment,
          1000
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

      if (!comment) {
        return res.status(400).json({
          ok: false,
          message:
            'Please write a review.'
        });
      }

      const reviews =
        read(
          REVIEWS_FILE,
          []
        );

      const review = {
        id:
          makeId('review'),

        customerId:
          req.customer.id,

        name:
          req.customer.name,

        rating,

        comment,

        approved:
          false,

        createdAt:
          new Date().toISOString()
      };

      reviews.push(
        review
      );

      write(
        REVIEWS_FILE,
        reviews
      );

      res.status(201).json({
        ok: true,
        message:
          'Review submitted for approval.'
      });
    } catch (error) {
      console.error(
        'REVIEW ERROR:',
        error
      );

      res.status(500).json({
        ok: false,
        message:
          'Unable to submit review.'
      });
    }
  }
);

/* =======================================================
   ADMIN LOGIN
======================================================= */

app.post(
  '/api/admin/login',
  loginLimiter,
  (req, res) => {
    const username =
      cleanString(
        req.body.username,
        100
      );

    const password =
      String(
        req.body.password || ''
      );

    if (
      username !==
      ADMIN_USERNAME ||
      !ADMIN_PASSWORD ||
      password !==
      ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        ok: false,
        message:
          'Invalid admin username or password.'
      });
    }

    const token =
      createAdminToken(
        username
      );

    res.json({
      ok: true,
      token,

      user: {
        username,
        role: 'admin'
      }
    });
  }
);

/* =======================================================
   ADMIN DASHBOARD
======================================================= */

app.get(
  '/api/admin/dashboard',
  auth,
  (req, res) => {
    const orders =
      read(
        ORDERS_FILE,
        []
      );

    const reviews =
      read(
        REVIEWS_FILE,
        []
      );

    const menu =
      getMenu();

    const customers =
      read(
        CUSTOMERS_FILE,
        []
      );

    res.json({
      ok: true,

      stats: {
        orders:
          orders.length,

        pendingOrders:
          orders.filter(
            item =>
              item.status ===
              'pending'
          ).length,

        reviews:
          reviews.length,

        customers:
          customers.length,

        menuItems:
          menu.length
      }
    });
  }
);

/* =======================================================
   ADMIN ORDERS
======================================================= */

app.get(
  '/api/admin/orders',
  auth,
  (req, res) => {
    const orders =
      read(
        ORDERS_FILE,
        []
      );

    orders.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

    res.json({
      ok: true,
      orders
    });
  }
);

/* =======================================================
   ADMIN UPDATE ORDER
======================================================= */

app.patch(
  '/api/admin/orders/:id',
  auth,
  (req, res) => {
    const orders =
      read(
        ORDERS_FILE,
        []
      );

    const index =
      orders.findIndex(
        item =>
          item.id ===
          req.params.id
      );

    if (index === -1) {
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
      'out_for_delivery',
      'delivered',
      'cancelled'
    ];

    if (
      req.body.status &&
      allowedStatuses.includes(
        req.body.status
      )
    ) {
      orders[index].status =
        req.body.status;
    }

    if (
      req.body.adminNote !==
      undefined
    ) {
      orders[index].adminNote =
        cleanString(
          req.body.adminNote,
          1000
        );
    }

    orders[index].updatedAt =
      new Date().toISOString();

    write(
      ORDERS_FILE,
      orders
    );

    res.json({
      ok: true,
      order:
        orders[index]
    });
  }
);

/* =======================================================
   ADMIN REVIEWS
======================================================= */

app.get(
  '/api/admin/reviews',
  auth,
  (req, res) => {
    const reviews =
      read(
        REVIEWS_FILE,
        []
      );

    reviews.sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    );

    res.json({
      ok: true,
      reviews
    });
  }
);

/* =======================================================
   ADMIN UPDATE REVIEW
======================================================= */

app.patch(
  '/api/admin/reviews/:id',
  auth,
  (req, res) => {
    const reviews =
      read(
        REVIEWS_FILE,
        []
      );

    const index =
      reviews.findIndex(
        item =>
          item.id ===
          req.params.id
      );

    if (index === -1) {
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
      reviews[index].approved =
        Boolean(
          req.body.approved
        );
    }

    write(
      REVIEWS_FILE,
      reviews
    );

    res.json({
      ok: true,
      review:
        reviews[index]
    });
  }
);

/* =======================================================
   ADMIN SETTINGS GET
======================================================= */

app.get(
  '/api/admin/settings',
  auth,
  (req, res) => {
    res.json({
      ok: true,
      settings:
        getSettings()
    });
  }
);

/* =======================================================
   ADMIN SETTINGS UPDATE
======================================================= */

app.put(
  '/api/admin/settings',
  auth,
  (req, res) => {
    try {
      const current =
        getSettings();

      const incoming =
        req.body || {};

      const next = {
        ...current,

        delivery: {
          ...current.delivery,
          ...(incoming.delivery || {})
        },

        payment: {
          ...current.payment,
          ...(incoming.payment || {})
        },

        hours: {
          ...current.hours,
          ...(incoming.hours || {}),

          normal: {
            ...current.hours.normal,
            ...(
              incoming.hours &&
              incoming.hours.normal
                ? incoming.hours.normal
                : {}
            )
          },

          friday: {
            ...current.hours.friday,
            ...(
              incoming.hours &&
              incoming.hours.friday
                ? incoming.hours.friday
                : {}
            )
          }
        },

        prebook: {
          ...current.prebook,
          ...(incoming.prebook || {})
        }
      };

      write(
        SETTINGS_FILE,
        next
      );

      res.json({
        ok: true,
        settings:
          next
      });
    } catch (error) {
      console.error(
        'SETTINGS UPDATE ERROR:',
        error
      );

      res.status(500).json({
        ok: false,
        message:
          'Unable to update settings.'
      });
    }
  }
);

/* =======================================================
   ADMIN MENU GET
======================================================= */

app.get(
  '/api/admin/menu',
  auth,
  (req, res) => {
    res.json({
      ok: true,
      menu:
        getMenu()
    });
  }
);

/* =======================================================
   ADMIN MENU UPDATE ALL
======================================================= */

app.put(
  '/api/admin/menu',
  auth,
  (req, res) => {
    try {
      if (
        !Array.isArray(
          req.body.menu
        )
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Menu must be an array.'
        });
      }

      const menu =
        req.body.menu.map(
          normalizeProduct
        );

      write(
        MENU_FILE,
        menu
      );

      res.json({
        ok: true,
        menu
      });
    } catch (error) {
      console.error(
        'MENU UPDATE ERROR:',
        error
      );

      res.status(500).json({
        ok: false,
        message:
          'Unable to update menu.'
      });
    }
  }
);

/* =======================================================
   ADMIN MENU CREATE
======================================================= */

app.post(
  '/api/admin/menu',
  auth,
  (req, res) => {
    try {
      const menu =
        getMenu();

      const product =
        normalizeProduct({
          ...req.body,
          id:
            req.body.id ||
            makeId('item')
        });

      if (!product.name) {
        return res.status(400).json({
          ok: false,
          message:
            'Product name is required.'
        });
      }

      if (
        product.price <= 0
      ) {
        return res.status(400).json({
          ok: false,
          message:
            'Product price must be greater than 0.'
        });
      }

      menu.push(
        product
      );

      write(
        MENU_FILE,
        menu
      );

      res.status(201).json({
        ok: true,
        product
      });
    } catch (error) {
      console.error(
        'MENU CREATE ERROR:',
        error
      );

      res.status(500).json({
        ok: false,
        message:
          'Unable to create menu item.'
      });
    }
  }
);

/* =======================================================
   ADMIN MENU DELETE
======================================================= */

app.delete(
  '/api/admin/menu/:id',
  auth,
  (req, res) => {
    const menu =
      getMenu();

    const index =
      menu.findIndex(
        item =>
          String(item.id) ===
          String(req.params.id)
      );

    if (index === -1) {
      return res.status(404).json({
        ok: false,
        message:
          'Menu item not found.'
      });
    }

    const deleted =
      menu.splice(
        index,
        1
      )[0];

    write(
      MENU_FILE,
      menu
    );

    res.json({
      ok: true,
      deleted
    });
  }
);

/* =======================================================
   IMAGE UPLOAD
======================================================= */

const storage =
  multer.diskStorage({
    destination:
      (req, file, cb) => {
        cb(
          null,
          ASSETS
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
          `food-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${safeExt}`
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
              'Only JPG, PNG, WEBP or GIF images are allowed.'
            )
          );
        }
      }
  });

app.post(
  '/api/admin/upload-image',
  auth,
  upload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message:
          'No image uploaded.'
      });
    }

    res.json({
      ok: true,

      filename:
        req.file.filename,

      url:
        `/assets/${req.file.filename}`
    });
  }
);

/* =======================================================
   ADMIN CUSTOMER LIST
======================================================= */

app.get(
  '/api/admin/customers',
  auth,
  (req, res) => {
    const customers =
      read(
        CUSTOMERS_FILE,
        []
      );

    res.json({
      ok: true,

      customers:
        customers.map(
          customer =>
            customerSafeData(
              customer
            )
        )
    });
  }
);

/* =======================================================
   ADMIN CUSTOMER COUNT / DETAILS
======================================================= */

app.get(
  '/api/admin/customers/:id',
  auth,
  (req, res) => {
    const customers =
      read(
        CUSTOMERS_FILE,
        []
      );

    const customer =
      customers.find(
        item =>
          item.id ===
          req.params.id
      );

    if (!customer) {
      return res.status(404).json({
        ok: false,
        message:
          'Customer not found.'
      });
    }

    const orders =
      read(
        ORDERS_FILE,
        []
      );

    const customerOrders =
      orders.filter(
        order =>
          order.customerId ===
          customer.id
      );

    res.json({
      ok: true,

      customer:
        customerSafeData(
          customer
        ),

      orders:
        customerOrders
    });
  }
);

/* =======================================================
   ADMIN PAGE
======================================================= */

app.get(
  '/admin',
  (req, res) => {
    res.sendFile(
      path.join(
        PUBLIC,
        'admin.html'
      )
    );
  }
);

/* =======================================================
   HEALTH CHECK
======================================================= */

app.get(
  '/api/health',
  (req, res) => {
    res.json({
      ok: true,
      service:
        "Chef Sifat's Kitchen",
      time:
        new Date().toISOString()
    });
  }
);

/* =======================================================
   404 API
======================================================= */

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

/* =======================================================
   ERROR HANDLER
======================================================= */

app.use(
  (error, req, res, next) => {
    console.error(
      'SERVER ERROR:',
      error
    );

    if (
      error instanceof
      multer.MulterError
    ) {
      return res.status(400).json({
        ok: false,
        message:
          error.message
      });
    }

    if (
      error &&
      error.message &&
      error.message.includes(
        'Only JPG'
      )
    ) {
      return res.status(400).json({
        ok: false,
        message:
          error.message
      });
    }

    res.status(500).json({
      ok: false,
      message:
        'Internal server error.'
    });
  }
);

/* =======================================================
   START SERVER
======================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      `Chef Sifat's Kitchen server running on port ${PORT}`
    );

    console.log(
      `Admin username: ${ADMIN_USERNAME}`
    );

    console.log(
      'Customer authentication: ENABLED'
    );

    console.log(
      'Customer order login requirement: ENABLED'
    );

    console.log(
      'Delivery base: Kahalthuri Hamidia High School'
    );

    console.log(
      'COD radius: 1 km'
    );

    console.log(
      'Maximum delivery radius: 4 km'
    );
  }
);
