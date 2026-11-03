# Phase 24 — Demo Data / Marketplace Simulation

Phase 24 adds a repeatable Ghana-focused demo dataset for realistic end-to-end testing.

## What it creates

- 48 login-capable demo users
- 18 approved sellers / businesses
- 5 pending seller applications
- 3 rejected seller applications
- roughly 190–210 products across Food, Fashion, Electronics, Beauty, Books, Accessories, Services and Other
- featured businesses and products
- active, inactive, hidden and out-of-stock products
- wishlists
- active carts
- 120 historical orders
- multi-seller orders
- pickup and seller-delivery fulfilment
- seller orders across pending, accepted, preparing, ready, out-for-delivery, completed, rejected and cancelled states
- realistic order timelines
- verified product and business reviews linked to completed purchases
- notifications
- pending/reviewed/dismissed moderation reports
- realistic Ghanaian names, stores, locations and GHS prices

## Demo login

All generated demo users share this password:

```
DemoPass!2026
```

Example accounts are printed at the end of the seed command.

Generated emails follow:

```
demo.user01@demo.studentmarket.local
demo.user02@demo.studentmarket.local
...
```

The first 18 demo users are sellers. Remaining demo users are customers.

## Run

From the server folder:

```bash
npm run seed:demo
```

The script uses the existing server `.env` values:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

It deletes and recreates only users under the dedicated demo email domain and their associated demo marketplace records.

## Production safety

The seed refuses to run when:

```
NODE_ENV=production
```

unless this explicit override is present:

```
ALLOW_DEMO_SEED=YES
```

Do not enable that override on a real production marketplace.

## Images

Phase 24A intentionally does not seed fake storage objects. Product and business cards use the application's existing image-empty states instead of broken image URLs. Real demo imagery can be added separately after the relational simulation is verified.

## Verification

After seeding:

```bash
npm run dev
```

Then verify:

- marketplace homepage has populated sections
- product and business discovery is full
- admin dashboard metrics are meaningful
- seller dashboards show order activity
- customer histories contain realistic orders
- review aggregates appear
- moderation queues contain data
- notifications are populated
- filters/search have enough data to exercise properly
