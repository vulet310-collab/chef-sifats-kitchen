const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const PUBLIC = path.join(ROOT, 'public');
const ASSETS = path.join(PUBLIC, 'assets');

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
if (!fs.existsSync(PUBLIC)) fs.mkdirSync(PUBLIC, { recursive: true });
if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true });

/* =========================================================
   SECURITY / MIDDLEWARE
========================================================= */

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(
  express.json({
    limit: '1mb'
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use('/assets', express.static(ASSETS));
app.use(express.static(PUBLIC));

/* =========================================================
   DATA HELPERS
========================================================= */

function read(file, fallback) {
  try {
    const filePath = path.join(DATA, file);

    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    return JSON.parse(
      fs.readFileSync(filePath, 'utf8')
    );
  } catch (err) {
    console.error('READ ERROR:', file, err.message);
    return fallback;
  }
}

function write(file, data) {
  const filePath = path.join(DATA, file);

  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

/* =========================================================
   DEFAULT SETTINGS
========================================================= */

function defaultSettings() {
  return {
    base: {
      name: 'Kahalthuri Hamidia High School',
      lat: 23.3022494,
      lng: 90.9187528
    },

    delivery: {
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

/* =========================================================
   ENSURE SETTINGS
========================================================= */

function getSettings() {
  const existing = read(
    'settings.json',
    {}
  );

  const defaults = defaultSettings();

  const settings = {
    ...defaults,
    ...existing,

    base: {
      ...defaults.base,
      ...(existing.base || {})
    },

    delivery: {
      ...defaults.delivery,
      ...(existing.delivery || {})
    },

    payment: {
      ...defaults.payment,
      ...(existing.payment || {})
    },

    hours: {
      normal: {
        ...defaults.hours.normal,
        ...((existing.hours || {}).normal || {})
      },

      friday: {
        ...defaults.hours.friday,
        ...((existing.hours || {}).friday || {})
      }
    },

    prebook: {
      ...defaults.prebook,
      ...(existing.prebook || {})
    }
  };

  return settings;
}

/* Create settings file if missing */
if (!fs.existsSync(path.join(DATA, 'settings.json'))) {
  write(
    'settings.json',
    defaultSettings()
  );
}

/* =========================================================
   JWT / ADMIN
========================================================= */

const SECRET =
  process.env.JWT_SECRET || '';

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME || 'admin';

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || '';

function auth(req, res, next) {
  const token = (
    req.headers.authorization || ''
  ).replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  if (!SECRET) {
    return res.status(503).json({
      error: 'JWT_SECRET is not configured.'
    });
  }

  try {
    req.admin = jwt.verify(
      token,
      SECRET
    );

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired authentication token.'
    });
  }
}

/* =========================================================
   DISTANCE
========================================================= */

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;

  const r = Math.PI / 180;

  const dLat =
    (lat2 - lat1) * r;

  const dLng =
    (lng2 - lng1) * r;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * r) *
      Math.cos(lat2 * r) *
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

/* =========================================================
   VALID NUMBER
========================================================= */

function validCoordinate(value) {
  return (
    value !== undefined &&
    value !== null &&
    Number.isFinite(Number(value))
  );
}

/* =========================================================
   PAYMENT HELPERS
========================================================= */

function isValidOnlinePayment(method) {
  return (
    method === 'bKash' ||
    method === 'Nagad'
  );
}

function normalizeTransactionId(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '');
}

/*
  We accept a transaction ID or last 5 digits.
  Minimum 5 numeric characters.
*/
function validTransactionId(value) {
  const tx = normalizeTransactionId(value);

  if (!tx) return false;

  return /^\d{5,}$/.test(tx);
}

/* =========================================================
   SHOP HOURS
========================================================= */

function getBangladeshDate() {
  const now = new Date();

  const bd = new Intl.DateTimeFormat(
    'en-US',
    {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'long'
    }
  ).formatToParts(now);

  const out = {};

  for (const p of bd) {
    out[p.type] = p.value;
  }

  return out;
}

function currentShopWindow(settings) {
  const bd = getBangladeshDate();

  const weekday =
    bd.weekday;

  const hour =
    Number(bd.hour);

  const minute =
    Number(bd.minute);

  const current =
    hour + minute / 60;

  const isFriday =
    weekday === 'Friday';

  const hours =
    isFriday
      ? settings.hours.friday
      : settings.hours.normal;

  return {
    weekday,
    current,
    open: Number(hours.open),
    close: Number(hours.close),
    isFriday
  };
}

function isShopOpenNow(settings) {
  const x =
    currentShopWindow(settings);

  return (
    x.current >= x.open &&
    x.current < x.close
  );
}

/* =========================================================
   DELIVERY TIME PARSER
========================================================= */

function parseDeliveryTime(value) {
  if (!value) {
    return {
      type: 'ASAP',
      date: null,
      dateObj: null
    };
  }

  const text =
    String(value).trim();

  if (
    text.toUpperCase() === 'ASAP'
  ) {
    return {
      type: 'ASAP',
      date: null,
      dateObj: null
    };
  }

  /*
    Accept ISO datetime from future frontend.
    Example:
    2026-09-16T18:30
  */
  const parsed =
    new Date(text);

  if (
    !Number.isNaN(
      parsed.getTime()
    )
  ) {
    return {
      type: 'DATETIME',
      date: text,
      dateObj: parsed
    };
  }

  /*
    Accept simple 12-hour / 24-hour time:
    6:30 PM
    18:30
  */
  const match =
    text.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i
    );

  if (match) {
    let hour =
      Number(match[1]);

    const minute =
      Number(match[2]);

    const ampm =
      match[3]
        ? match[3].toUpperCase()
        : null;

    if (ampm === 'PM' && hour < 12) {
      hour += 12;
    }

    if (ampm === 'AM' && hour === 12) {
      hour = 0;
    }

    if (
      hour >= 0 &&
      hour <= 23 &&
      minute >= 0 &&
      minute <= 59
    ) {
      return {
        type: 'TIME',
        hour,
        minute,
        date: text,
        dateObj: null
      };
    }
  }

  return {
    type: 'INVALID',
    date: null,
    dateObj: null
  };
}

/* =========================================================
   PREBOOK VALIDATION
========================================================= */

function validatePrebookRequest(
  deliveryTime,
  settings
) {
  const pb =
    settings.prebook || {};

  if (pb.enabled === false) {
    return {
      ok: false,
      error:
        'Pre-booking is currently unavailable.'
    };
  }

  const minHours =
    Number(pb.minHours || 5);

  const maxHours =
    Number(pb.maxHours || 12);

  /*
    Pre-book order needs an actual future
    datetime. Current old frontend can still
    send ASAP, but server will reject that for
    pre-book items instead of silently accepting it.
  */

  const parsed =
    parseDeliveryTime(
      deliveryTime
    );

  if (
    parsed.type !== 'DATETIME' ||
    !parsed.dateObj
  ) {
    return {
      ok: false,
      error:
        `Pre-book orders require a delivery date and time between ${minHours} and ${maxHours} hours from now.`
    };
  }

  const now =
    new Date();

  const diffHours =
    (
      parsed.dateObj.getTime() -
      now.getTime()
    ) /
    (1000 * 60 * 60);

  if (
    diffHours < minHours
  ) {
    return {
      ok: false,
      error:
        `Pre-book delivery must be at least ${minHours} hours from now.`
    };
  }

  if (
    diffHours > maxHours
  ) {
    return {
      ok: false,
      error:
        `Pre-book delivery cannot be more than ${maxHours} hours from now.`
    };
  }

  return {
    ok: true,
    deliveryDate:
      parsed.dateObj.toISOString(),
    hoursAhead:
      +diffHours.toFixed(2)
  };
}

/* =========================================================
   DELIVERY TIME VALIDATION
========================================================= */

function validateDeliveryTime(
  deliveryTime,
  settings,
  isPrebook
) {
  if (isPrebook) {
    return validatePrebookRequest(
      deliveryTime,
      settings
    );
  }

  const parsed =
    parseDeliveryTime(
      deliveryTime
    );

  if (parsed.type === 'INVALID') {
    return {
      ok: false,
      error:
        'Invalid delivery time.'
    };
  }

  /*
    ASAP means normal order now.
  */
  if (
    parsed.type === 'ASAP'
  ) {
    if (
      !isShopOpenNow(settings)
    ) {
      const x =
        currentShopWindow(settings);

      return {
        ok: false,
        error:
          `The kitchen is currently closed. Today's order time is ${x.open}:00 to ${x.close}:00 Bangladesh time.`
      };
    }

    return {
      ok: true,
      deliveryDate: null
    };
  }

  /*
    Simple time such as 6:30 PM.
    This is interpreted as today's requested
    delivery time.
  */
  if (
    parsed.type === 'TIME'
  ) {
    const x =
      currentShopWindow(settings);

    if (
      parsed.hour < x.open ||
      parsed.hour >= x.close
    ) {
      return {
        ok: false,
        error:
          `Requested delivery time is outside today's shop hours.`
      };
    }

    return {
      ok: true,
      deliveryDate: null
    };
  }

  /*
    Full datetime
  */
  if (
    parsed.type === 'DATETIME'
  ) {
    const date =
      parsed.dateObj;

    const hours =
      date.getHours();

    const minutes =
      date.getMinutes();

    const requested =
      hours + minutes / 60;

    /*
      Use local requested time.
      For frontend ISO values without timezone,
      browser/server timezone handling can differ.
      Therefore basic shop-hour validation is used.
    */

    const day =
      date.getDay();

    const isFriday =
      day === 5;

    const shopHours =
      isFriday
        ? settings.hours.friday
        : settings.hours.normal;

    if (
      requested <
        Number(shopHours.open) ||
      requested >=
        Number(shopHours.close)
    ) {
      return {
        ok: false,
        error:
          'Requested delivery time is outside shop hours.'
      };
    }

    return {
      ok: true,
      deliveryDate:
        date.toISOString()
    };
  }

  return {
    ok: false,
    error:
      'Invalid delivery time.'
  };
}

/* =========================================================
   MENU HELPERS
========================================================= */

function getMenu() {
  const menu =
    read('menu.json', []);

  return Array.isArray(menu)
    ? menu
    : [];
}

function normalizeProduct(product) {
  const p = {
    ...product
  };

  /*
    Pizza must never become pre-book.
  */
  if (
    String(p.cat || '').toLowerCase()
      === 'pizza'
  ) {
    p.prebook = false;
  }

  return p;
}

/* =========================================================
   CONFIG API
========================================================= */

app.get(
  '/api/config',
  (req, res) => {
    const settings =
      getSettings();

    const menu =
      getMenu().map(
        normalizeProduct
      );

    res.json({
      settings,
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
    try {
      const {
        lat,
        lng
      } = req.body || {};

      if (
        !validCoordinate(lat) ||
        !validCoordinate(lng)
      ) {
        return res.status(400).json({
          error:
            'Valid GPS location is required.'
        });
      }

      const settings =
        getSettings();

      const km =
        distanceKm(
          Number(settings.base.lat),
          Number(settings.base.lng),
          Number(lat),
          Number(lng)
        );

      if (!Number.isFinite(km)) {
        return res.status(400).json({
          error:
            'Unable to calculate delivery distance.'
        });
      }

      const maxRadius =
        Number(
          settings.delivery.maxRadiusKm
        );

      const codRadius =
        Number(
          settings.delivery.codRadiusKm
        );

      const rate =
        Number(
          settings.delivery.ratePerKm
        );

      /*
        Outside delivery area
      */
      if (
        km > maxRadius
      ) {
        return res.json({
          allowed: false,
          cod: false,
          distanceKm:
            +km.toFixed(2),
          charge: null,
          paymentRequired: false,
          message:
            `Delivery unavailable beyond ${maxRadius} km.`
        });
      }

      /*
        COD zone
      */
      if (
        km <= codRadius
      ) {
        return res.json({
          allowed: true,
          cod: true,
          distanceKm:
            +km.toFixed(2),
          charge: 0,
          paymentRequired: false,
          message:
            'COD available in the COD zone.'
        });
      }

      /*
        Outside COD zone but inside delivery zone
      */
      const charge =
        Math.ceil(km) * rate;

      return res.json({
        allowed: true,
        cod: false,
        distanceKm:
          +km.toFixed(2),
        charge,
        paymentRequired: true,
        message:
          'COD unavailable here. Online payment is required.'
      });

    } catch (err) {
      console.error(
        'LOCATION CHECK ERROR:',
        err
      );

      res.status(500).json({
        error:
          'Location check failed.'
      });
    }
  }
);

/* =========================================================
   CREATE ORDER
========================================================= */

app.post(
  '/api/orders',
  (req, res) => {
    try {
      const body =
        req.body || {};

      const settings =
        getSettings();

      const menu =
        getMenu();

      /*
        Basic required fields
      */
      if (
        !body.name ||
        !body.phone ||
        !validCoordinate(body.lat) ||
        !validCoordinate(body.lng) ||
        !Array.isArray(body.items) ||
        !body.items.length
      ) {
        return res.status(400).json({
          error:
            'Name, phone, location and cart are required.'
        });
      }

      /*
        Validate location
      */
      const lat =
        Number(body.lat);

      const lng =
        Number(body.lng);

      const km =
        distanceKm(
          Number(settings.base.lat),
          Number(settings.base.lng),
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

      const rate =
        Number(
          settings.delivery.ratePerKm
        );

      /*
        Outside maximum delivery range
      */
      if (
        km > maxRadius
      ) {
        return res.status(400).json({
          error:
            `Delivery unavailable beyond ${maxRadius} km.`
        });
      }

      /*
        Build order items from SERVER menu.
        Client cannot change price.
      */
      let subtotal = 0;
      let hasPrebook = false;

      const items =
        body.items.map(
          item => {

            const product =
              menu.find(
                p =>
                  p.id === item.id
              );

            if (!product) {
              throw new Error(
                'Invalid menu item.'
              );
            }

            const normalized =
              normalizeProduct(
                product
              );

            const sizeIndex =
              Number.isInteger(
                Number(item.sizeIndex)
              )
                ? Number(item.sizeIndex)
                : 0;

            const size =
              normalized.sizes &&
              normalized.sizes[sizeIndex]
                ? normalized.sizes[sizeIndex]
                : normalized.sizes &&
                  normalized.sizes[0];

            if (
              !size ||
              !Array.isArray(size)
            ) {
              throw new Error(
                `Invalid size for ${normalized.name}.`
              );
            }

            const qty =
              Math.max(
                1,
                Math.min(
                  100,
                  Number(item.qty) || 1
                )
              );

            /*
              Enforce min/max quantity
            */
            const minQty =
              Number(
                normalized.minQty || 1
              );

            const maxQty =
              Number(
                normalized.maxQty || 100
              );

            if (
              qty < minQty
            ) {
              throw new Error(
                `${normalized.name} minimum quantity is ${minQty}.`
              );
            }

            if (
              qty > maxQty
            ) {
              throw new Error(
                `${normalized.name} maximum quantity is ${maxQty}.`
              );
            }

            /*
              Pizza can NEVER be pre-book.
            */
            const productPrebook =
              String(
                normalized.cat || ''
              ).toLowerCase() !== 'pizza' &&
              Boolean(
                normalized.prebook
              );

            if (
              productPrebook
            ) {
              hasPrebook = true;
            }

            const unitPrice =
              Number(size[1]);

            subtotal +=
              unitPrice * qty;

            return {
              id:
                normalized.id,
              name:
                normalized.name,
              cat:
                normalized.cat,
              size:
                size[0],
              unitPrice,
              qty,
              image:
                normalized.image || ''
            };
          }
        );

      /*
        Delivery charge
      */
      const codAvailable =
        km <= codRadius;

      const deliveryCharge =
        codAvailable
          ? 0
          : Math.ceil(km) * rate;

      /*
        Payment method
      */
      const requestedPayment =
        String(
          body.paymentMethod || ''
        ).trim();

      const transactionId =
        normalizeTransactionId(
          body.transactionId
        );

      /*
        Pre-book order
        */
      if (hasPrebook) {
        const prebookValidation =
          validatePrebookRequest(
            body.deliveryTime,
            settings
          );

        if (
          !prebookValidation.ok
        ) {
          return res.status(400).json({
            error:
              prebookValidation.error
          });
        }
      } else {
        /*
          Normal order time validation
        */
        const timeValidation =
          validateDeliveryTime(
            body.deliveryTime,
            settings,
            false
          );

        if (
          !timeValidation.ok
        ) {
          return res.status(400).json({
            error:
              timeValidation.error
          });
        }
      }

      /*
        Determine payment rules
      */

      /*
        COD allowed ONLY inside COD radius
        AND only for non-prebook order.
      */
      if (
        requestedPayment === 'COD'
      ) {
        if (
          !codAvailable
        ) {
          return res.status(400).json({
            error:
              'COD is not available outside the COD zone. Please pay by bKash or Nagad.'
          });
        }

        if (
          hasPrebook
        ) {
          return res.status(400).json({
            error:
              'Pre-book orders require full online payment.'
          });
        }

      } else {
        /*
          Outside COD area or prebook:
          online payment required.
        */

        if (
          !isValidOnlinePayment(
            requestedPayment
          )
        ) {
          return res.status(400).json({
            error:
              'Please select bKash or Nagad for online payment.'
          });
        }

        if (
          !validTransactionId(
            transactionId
          )
        ) {
          return res.status(400).json({
            error:
              'Please enter the transaction ID or last 5 digits of the transaction.'
          });
        }
      }

      /*
        If user selected COD but did not explicitly
        send COD, don't trust client.
      */
      const paymentMethod =
        requestedPayment === 'COD'
          ? 'COD'
          : requestedPayment;

      /*
        Total
      */
      const total =
        subtotal +
        deliveryCharge;

      /*
        Create order
      */
      const order = {
        id:
          'CSK-' +
          Date.now()
            .toString(36)
            .toUpperCase(),

        createdAt:
          new Date().toISOString(),

        status:
          'Pending',

        name:
          String(body.name)
            .trim()
            .slice(0, 100),

        phone:
          String(body.phone)
            .trim()
            .slice(0, 30),

        address:
          String(body.address || '')
            .trim()
            .slice(0, 500),

        lat,

        lng,

        distanceKm:
          +km.toFixed(2),

        deliveryCharge,

        subtotal,

        total,

        paymentMethod,

        paymentType:
          paymentMethod === 'COD'
            ? 'Cash on Delivery'
            : 'Online - Send Money Only',

        transactionId:
          paymentMethod === 'COD'
            ? ''
            : transactionId,

        deliveryTime:
          body.deliveryTime || 'ASAP',

        prebook:
          hasPrebook,

        prebookSettings:
          hasPrebook
            ? {
                minHours:
                  Number(
                    settings.prebook.minHours
                  ),
                maxHours:
                  Number(
                    settings.prebook.maxHours
                  )
              }
            : null,

        items,

        note:
          String(body.note || '')
            .trim()
            .slice(0, 1000)
      };

      /*
        Save
      */
      const orders =
        read(
          'orders.json',
          []
        );

      orders.unshift(order);

      write(
        'orders.json',
        orders
      );

      return res.json({
        ok: true,
        order
      });

    } catch (err) {
      console.error(
        'ORDER ERROR:',
        err
      );

      return res.status(400).json({
        error:
          err.message ||
          'Unable to place order.'
      });
    }
  }
);

/* =========================================================
   REVIEWS
========================================================= */

app.post(
  '/api/reviews',
  (req, res) => {
    try {
      const body =
        req.body || {};

      if (
        !body.name ||
        !body.text
      ) {
        return res.status(400).json({
          error:
            'Name and review are required.'
        });
      }

      const reviews =
        read(
          'reviews.json',
          []
        );

      const rating =
        Math.max(
          1,
          Math.min(
            5,
            Number(body.rating) || 5
          )
        );

      const review = {
        id:
          'R' +
          Date.now(),

        name:
          String(body.name)
            .trim()
            .slice(0, 100),

        rating,

        text:
          String(body.text)
            .trim()
            .slice(0, 1000),

        createdAt:
          new Date().toISOString(),

        approved:
          false
      };

      reviews.unshift(review);

      write(
        'reviews.json',
        reviews
      );

      res.json({
        ok: true
      });

    } catch (err) {
      res.status(500).json({
        error:
          'Unable to submit review.'
      });
    }
  }
);

app.get(
  '/api/reviews',
  (req, res) => {
    const reviews =
      read(
        'reviews.json',
        []
      );

    /*
      Only approved reviews are public.
    */
    res.json(
      reviews.filter(
        r => r.approved
      )
    );
  }
);

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post(
  '/api/admin/login',
  (req, res) => {
    if (!ADMIN_PASSWORD) {
      return res.status(503).json({
        error:
          'ADMIN_PASSWORD is not configured in Render Environment Variables.'
      });
    }

    if (!SECRET) {
      return res.status(503).json({
        error:
          'JWT_SECRET is not configured in Render Environment Variables.'
      });
    }

    const username =
      String(
        req.body.username || ''
      );

    const password =
      String(
        req.body.password || ''
      );

    if (
      username !== ADMIN_USERNAME ||
      password !== ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        error:
          'Invalid admin credentials.'
      });
    }

    const token =
      jwt.sign(
        {
          username:
            ADMIN_USERNAME,

          role:
            'admin'
        },
        SECRET,
        {
          expiresIn:
            '8h'
        }
      );

    res.json({
      token
    });
  }
);

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

app.get(
  '/api/admin/dashboard',
  auth,
  (req, res) => {
    const orders =
      read(
        'orders.json',
        []
      );

    const reviews =
      read(
        'reviews.json',
        []
      );

    const menu =
      getMenu();

    const revenue =
      orders
        .filter(
          o =>
            o.status !==
            'Cancelled'
        )
        .reduce(
          (sum, o) =>
            sum +
            Number(o.total || 0),
          0
        );

    res.json({
      orders:
        orders.length,

      pending:
        orders.filter(
          o =>
            o.status ===
            'Pending'
        ).length,

      delivered:
        orders.filter(
          o =>
            o.status ===
            'Delivered'
        ).length,

      revenue,

      menu:
        menu.length,

      reviews:
        reviews.length
    });
  }
);

/* =========================================================
   ADMIN ORDERS
========================================================= */

app.get(
  '/api/orders',
  auth,
  (req, res) => {
    res.json(
      read(
        'orders.json',
        []
      )
    );
  }
);

app.patch(
  '/api/orders/:id',
  auth,
  (req, res) => {
    const orders =
      read(
        'orders.json',
        []
      );

    const index =
      orders.findIndex(
        o =>
          o.id ===
          req.params.id
      );

    if (index < 0) {
      return res.status(404).json({
        error:
          'Order not found.'
      });
    }

    const allowedStatuses = [
      'Pending',
      'Confirmed',
      'Preparing',
      'Out for delivery',
      'Delivered',
      'Cancelled'
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

    write(
      'orders.json',
      orders
    );

    res.json(
      orders[index]
    );
  }
);

/* =========================================================
   ADMIN REVIEWS
========================================================= */

app.get(
  '/api/admin/reviews',
  auth,
  (req, res) => {
    res.json(
      read(
        'reviews.json',
        []
      )
    );
  }
);

app.patch(
  '/api/admin/reviews/:id',
  auth,
  (req, res) => {
    const reviews =
      read(
        'reviews.json',
        []
      );

    const index =
      reviews.findIndex(
        r =>
          r.id ===
          req.params.id
      );

    if (index < 0) {
      return res.status(404).json({
        error:
          'Review not found.'
      });
    }

    reviews[index].approved =
      Boolean(
        req.body.approved
      );

    write(
      'reviews.json',
      reviews
    );

    res.json(
      reviews[index]
    );
  }
);

/* =========================================================
   ADMIN SETTINGS
========================================================= */

app.put(
  '/api/admin/settings',
  auth,
  (req, res) => {
    try {
      const old =
        getSettings();

      const body =
        req.body || {};

      const next = {
        ...old,
        ...body,

        base: {
          ...old.base,
          ...(body.base || {})
        },

        delivery: {
          ...old.delivery,
          ...(body.delivery || {})
        },

        payment: {
          ...old.payment,
          ...(body.payment || {})
        },

        hours: {
          normal: {
            ...old.hours.normal,
            ...((body.hours || {}).normal || {})
          },

          friday: {
            ...old.hours.friday,
            ...((body.hours || {}).friday || {})
          }
        },

        prebook: {
          ...old.prebook,
          ...(body.prebook || {})
        }
      };

      /*
        Sanitize delivery values
      */
      next.delivery.codRadiusKm =
        Number(
          next.delivery.codRadiusKm
        );

      next.delivery.maxRadiusKm =
        Number(
          next.delivery.maxRadiusKm
        );

      next.delivery.ratePerKm =
        Number(
          next.delivery.ratePerKm
        );

      next.delivery.codCharge = 0;

      /*
        Sanitize coordinates
      */
      next.base.lat =
        Number(
          next.base.lat
        );

      next.base.lng =
        Number(
          next.base.lng
        );

      /*
        Sanitize shop hours
      */
      next.hours.normal.open =
        Number(
          next.hours.normal.open
        );

      next.hours.normal.close =
        Number(
          next.hours.normal.close
        );

      next.hours.friday.open =
        Number(
          next.hours.friday.open
        );

      next.hours.friday.close =
        Number(
          next.hours.friday.close
        );

      /*
        Sanitize prebook
      */
      next.prebook.enabled =
        next.prebook.enabled !== false;

      next.prebook.minHours =
        Number(
          next.prebook.minHours
        );

      next.prebook.maxHours =
        Number(
          next.prebook.maxHours
        );

      if (
        !Number.isFinite(
          next.prebook.minHours
        )
      ) {
        next.prebook.minHours = 5;
      }

      if (
        !Number.isFinite(
          next.prebook.maxHours
        )
      ) {
        next.prebook.maxHours = 12;
      }

      /*
        Keep sensible range
      */
      next.prebook.minHours =
        Math.max(
          1,
          Math.min(
            48,
            next.prebook.minHours
          )
        );

      next.prebook.maxHours =
        Math.max(
          next.prebook.minHours,
          Math.min(
            72,
            next.prebook.maxHours
          )
        );

      /*
        Payment is always Send Money Only
      */
      next.payment.method =
        'Send Money Only';

      write(
        'settings.json',
        next
      );

      res.json(
        next
      );

    } catch (err) {
      console.error(
        'SETTINGS ERROR:',
        err
      );

      res.status(400).json({
        error:
          'Unable to save settings.'
      });
    }
  }
);

/* =========================================================
   ADMIN MENU LIST
========================================================= */

app.get(
  '/api/admin/menu',
  auth,
  (req, res) => {
    res.json(
      getMenu().map(
        normalizeProduct
      )
    );
  }
);

/* =========================================================
   ADMIN MENU UPDATE
========================================================= */

app.put(
  '/api/admin/menu/:id',
  auth,
  (req, res) => {
    try {
      const menu =
        getMenu();

      const index =
        menu.findIndex(
          p =>
            p.id ===
            req.params.id
        );

      if (index < 0) {
        return res.status(404).json({
          error:
            'Menu item not found.'
        });
      }

      const incoming =
        req.body || {};

      const current =
        menu[index];

      const updated = {
        ...current,
        ...incoming
      };

      /*
        Pizza prebook is permanently disabled.
      */
      if (
        String(
          updated.cat || ''
        ).toLowerCase() === 'pizza'
      ) {
        updated.prebook =
          false;
      }

      /*
        Validate sizes
      */
      if (
        incoming.sizes !== undefined &&
        !Array.isArray(
          incoming.sizes
        )
      ) {
        return res.status(400).json({
          error:
            'sizes must be an array.'
        });
      }

      menu[index] =
        updated;

      write(
        'menu.json',
        menu
      );

      res.json(
        normalizeProduct(
          menu[index]
        )
      );

    } catch (err) {
      res.status(400).json({
        error:
          err.message
      });
    }
  }
);

/* =========================================================
   ADMIN MENU CREATE
========================================================= */

app.post(
  '/api/admin/menu',
  auth,
  (req, res) => {
    try {
      const body =
        req.body || {};

      if (
        !body.name ||
        !body.cat ||
        !Array.isArray(
          body.sizes
        ) ||
        !body.sizes.length
      ) {
        return res.status(400).json({
          error:
            'Name, category and at least one size/price are required.'
        });
      }

      const menu =
        getMenu();

      const id =
        body.id ||
        (
          String(
            body.cat
          )
            .toLowerCase()
            .replace(
              /[^a-z0-9]+/g,
              '-'
            )
            .replace(
              /^-|-$/g,
              ''
            ) +
          '-' +
          Date.now()
        );

      const product = {
        id,

        name:
          String(
            body.name
          ).trim(),

        cat:
          String(
            body.cat
          ).trim(),

        prebook:
          String(
            body.cat
          ).toLowerCase() ===
            'pizza'
            ? false
            : Boolean(
                body.prebook
              ),

        sizes:
          body.sizes,

        image:
          String(
            body.image || ''
          ),

        minQty:
          Number(
            body.minQty || 1
          ),

        maxQty:
          Number(
            body.maxQty || 100
          )
      };

      menu.push(
        product
      );

      write(
        'menu.json',
        menu
      );

      res.json({
        ok: true,
        product:
          normalizeProduct(
            product
          )
      });

    } catch (err) {
      res.status(400).json({
        error:
          err.message
      });
    }
  }
);

/* =========================================================
   ADMIN MENU DELETE
========================================================= */

app.delete(
  '/api/admin/menu/:id',
  auth,
  (req, res) => {
    const menu =
      getMenu();

    const next =
      menu.filter(
        p =>
          p.id !==
          req.params.id
      );

    if (
      next.length ===
      menu.length
    ) {
      return res.status(404).json({
        error:
          'Menu item not found.'
      });
    }

    write(
      'menu.json',
      next
    );

    res.json({
      ok: true
    });
  }
);

/* =========================================================
   IMAGE UPLOAD
========================================================= */

const upload =
  multer({
    dest: ASSETS,

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
          cb(null, true);
        } else {
          cb(
            new Error(
              'Only JPG, PNG, WEBP and GIF images are allowed.'
            )
          );
        }
      }
  });

app.post(
  '/api/admin/upload',
  auth,
  upload.single('image'),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error:
            'No image uploaded.'
        });
      }

      const original =
        req.file.originalname;

      let ext =
        path.extname(
          original
        ).toLowerCase();

      const allowedExt = [
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
        '.gif'
      ];

      if (
        !allowedExt.includes(
          ext
        )
      ) {
        ext = '.jpg';
      }

      const filename =
        Date.now() +
        '-' +
        Math.random()
          .toString(36)
          .slice(2, 8) +
        ext;

      const finalPath =
        path.join(
          ASSETS,
          filename
        );

      fs.renameSync(
        req.file.path,
        finalPath
      );

      res.json({
        ok: true,
        url:
          '/assets/' +
          filename
      });

    } catch (err) {
      console.error(
        'UPLOAD ERROR:',
        err
      );

      if (
        req.file &&
        fs.existsSync(
          req.file.path
        )
      ) {
        try {
          fs.unlinkSync(
            req.file.path
          );
        } catch (_) {}
      }

      res.status(400).json({
        error:
          err.message ||
          'Image upload failed.'
      });
    }
  }
);

/* =========================================================
   ADMIN PAGE
========================================================= */

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

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  (err, req, res, next) => {
    console.error(
      'SERVER ERROR:',
      err
    );

    res.status(500).json({
      error:
        'Internal server error.'
    });
  }
);

/* =========================================================
   START
========================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      `Chef Sifat's Kitchen server running on port ${PORT}`
    );
  }
);
