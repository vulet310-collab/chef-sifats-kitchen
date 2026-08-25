# Chef Sifat's Kitchen — Secure online setup

## What this adds
- Server-side admin authentication; admin password is NOT in frontend code.
- bcrypt password verification.
- Rate-limited admin login.
- Helmet security headers.
- Server-side sessions with random 256-bit tokens and expiry.
- Server-side menu/settings/order storage.
- Pre-order validation: configurable minimum/maximum advance hours.
- Delivery/order window validation: default 11:00–19:00.
- Full payment required for pre-orders.
- Customer ratings/reviews with admin approval.

## Before going online
1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Set `ADMIN_PASSWORD` to a unique random password of at least 16 characters.
4. Never upload `.env` to GitHub or share it.
5. Run `npm install` then `npm start`.
6. Deploy behind HTTPS (your hosting provider should provide TLS/SSL).
7. Keep Node and dependencies updated.
8. Back up the `data/` folder.

## Important
No website can honestly be guaranteed 100% unhackable. This package removes the unsafe frontend-only password approach and adds common production protections, but secure hosting, HTTPS, updates, backups, and account hygiene are still required.
