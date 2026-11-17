# FDB-Birthday · Barbie Après-Ski

An installable birthday invitation for Pink 30s, 21–22 February 2027, Hotel Vallunga, Campo Tartano. English interface with a pink après-ski design.

## Guest experience

- **Dinner with Barbie:** dinner on 21 February at 8:00 PM.
- **Barbie Sleepover:** dinner and an overnight stay, 21–22 February.
- **Love Note for Barbie:** a named decline; excluded from dinner and overnight totals.
- Only first and last name are requested, plus the chosen RSVP and privacy acknowledgement.
- Cloudflare D1 stores the names, RSVP option, submission timestamp, UUID and retry identifier.
- Retried submissions are idempotent. The same person can still respond from multiple devices; names alone do not uniquely identify guests.

## Admin

Open `/admin` and sign in with the fixed credentials configured as runtime secrets. Includes attendance, dinner, overnight and decline counts; name search; RSVP filters; CSV export; sign-out.

Required runtime secrets (do not put actual values in Git):

```text
ADMIN_USERNAME
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
```

The session secret must be a long random value. Admin sessions use signed, eight-hour cookies with HttpOnly, Secure and SameSite=Strict flags. Login attempts are limited to ten per 15-minute window per hashed client-IP key. Personal records are read only after server-side session validation. No credentials or guest records are committed to this repository.

## PWA

- Web manifest with standalone display, 192/512 px icons, maskable icon and Apple touch icon.
- Install button where the browser offers an installation prompt; installation guidance for other supported browsers.
- iPhone/iPad: Safari → Share → Add to Home Screen. Android: browser menu → Install app / Add to Home screen.
- A dedicated offline page keeps the event date, time, venue and dress code available after the service worker has installed successfully online.
- RSVP submissions, the admin guest list and login need the internet. They are never cached or queued by the service worker. An offline screen never confirms a submission.
- The first visit requires a connection. Install support depends on the browser and a secure HTTPS origin (localhost for development).

## Local development

Node 22.13+:

```sh
npm ci
npm run dev
```

Build with `npm run build`. Run the compiled Worker locally with `npm start`.

After the first build, apply each pending local migration, in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_freezing_iron_monger.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_moaning_bill_hollister.sql
```

Use untracked local runtime variables for the admin secrets. Do not replay migrations already applied to a local database. Generate future schema migrations with `npm run db:generate`.

## Checks

```sh
npx tsc --noEmit
node --experimental-strip-types --test tests/admin-session.test.mjs tests/pwa.test.mjs
npm run build
```

## Production

`.openai/hosting.json` retains the existing Sites project and logical D1 binding `DB`. Sites provisions the binding and applies committed Drizzle migrations during publication. Runtime secrets are configured separately from the source. The source is also mirrored to `main` in the FDB GitHub repository; pushing GitHub alone does not change the Sites deployment or move the database.

The existing Sites audience remains private. The organiser can change it in Sites settings when ready to invite guests. On another Cloudflare deployment, configure the actual D1 database binding and runtime secrets separately; those resources and their data are not transferred by cloning this repository.

## Organiser notes

Pricing and room arrangements are communicated by the organiser. No payments or room availability guarantees are implemented. Changes and deletion requests are handled by the organiser; clear guest data when it is no longer needed. The original supplied invitation image is preserved.

## External Cloudflare deployment

Set the Cloudflare build command to `npm run build` and the deploy command to `npm run deploy`. The deploy command first checks the production `DB` binding, creates missing RSVP/admin tables, adds `guest_key` only if absent, and verifies the unique indexes. Existing reservations are preserved. A schema failure stops deployment. This repairs databases initialized before migration 0002 as well as empty databases.

To repair the existing live database from an authenticated checkout after building, run `npm run db:prepare:production`. This requires Cloudflare D1 write access. No admin session secret is needed to submit an RSVP.
