# Amigos Car Care platform

Full-stack Amigos Car Care Qatar website with a responsive public site, CMS, backend APIs, password-based administrator sign-in, image upload, business and career enquiry intake, booking, offers, and MySQL/MariaDB or PostgreSQL persistence.

## Amigos Assist chatbot

The public chat currently uses a client-side guided automotive knowledge flow. It is not connected to a generative AI provider and does not send chat text to a model. Its safety guidance, diagnostic boundaries, service routing, and Qatar-specific guidance are based on `docs/AMIGOS-AUTOMOTIVE-ASSISTANT-SYSTEM-PROMPT.md`. To enable model-backed answers, implement a server-side provider endpoint that uses that system prompt, protects provider credentials, and applies the documented safety and privacy rules.

## Local setup

1. Install Node.js 20.9 or newer.
2. Copy `.env.example` to `.env.local` and set a new, unique `ADMIN_INITIAL_PASSWORD`, a private admin email address and a random `AUTH_SECRET`.
3. Admin sign-in uses username and password. SMTP is optional and is used only for enquiry notifications.
4. Run `pnpm install`, then `pnpm dev`, and open `http://localhost:3000`.

Without `DATABASE_URL`, local development uses an embedded PGlite PostgreSQL-compatible database stored under `data/local-db`. For Hostinger MySQL/MariaDB, set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` separately. Use the original password without URL encoding. MySQL 8.0.16+, MariaDB 10.6+, and managed PostgreSQL 16+ are supported. Legacy `DATABASE_URL` configurations also remain supported. MySQL/MariaDB URLs start with `mysql://` (or `mariadb://`), and PostgreSQL URLs start with `postgresql://`. Set `DATABASE_SSL=true` only when the provider requires TLS and its certificate chain is trusted. Database tables are created on first API request. Seeded service and branch records are inserted idempotently.

For Hostinger, follow [the MySQL setup guide](docs/HOSTINGER-MYSQL.md) and import **`data/schema.mysql.sql`** in phpMyAdmin. `data/schema.sql` is for PostgreSQL/PGlite only. The separate MySQL settings (or a legacy connection URL) select the matching adapter and schema automatically.

## Admin CMS

Open `/admin`. Initial administrator creation is bootstrapped from the environment on the first sign-in attempt. A valid username and password create the admin session immediately; no email code is required. SMTP is optional for enquiry notifications: configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, and `MAIL_MODE=smtp` when using those emails. The initial username/email/password are environment setup secrets; rotate the password after first login and keep secrets out of the repository.

The CMS edits website settings, service cards, branches and offers. Offers must have status `published` to appear publicly. The public site footer links to Instagram, Facebook and LinkedIn. The homepage includes the moving three-at-a-time service flow, category filters, searchable full list, language toggle, branch cards, image slider, FAQ and mechanic-assistance chat. Appointment requests open a prefilled WhatsApp chat for the selected branch using its CMS phone number. Customers review the message and tap Send in WhatsApp; email is optional in the form. Business and Careers are separate pages. Uploads are limited to raster images up to 8 MB and are written to `public/uploads` in this starter; production should replace local media storage with managed object storage/CDN and configure backup/retention.

## API surface

- `GET /api/health`
- `GET /api/public/site`
- `POST /api/public/enquiries` (booking and general enquiries)
- `POST /api/public/business` (multipart business enquiry and optional attachment)
- `POST /api/public/careers` (multipart application with required CV)
- `POST /api/auth/login`, `/api/auth/verify`, `/api/auth/logout`, `GET /api/auth/session`
- `/api/admin/site`, `/api/admin/services`, `/api/admin/branches`, `/api/admin/offers`, `/api/admin/enquiries`, `GET /api/admin/enquiries?attachment=<id>`, `POST /api/admin/upload`

Admin sessions use an opaque HttpOnly, SameSite cookie; only the SHA-256 token digest is stored in the database. Passwords are stored as bcrypt hashes. Admin mutations are audit logged. Do not put secrets or credentials in frontend code.

## Important production work

The local PGlite file database and local upload directory are for development only. Business, career, and direct API enquiry submissions persist in the database; configured SMTP sends notifications to `info@amigoscarcare.com`. The protected CMS includes the enquiry inbox and authenticated private-attachment download. Before public launch, configure managed PostgreSQL, private object storage, verified SMTP, HTTPS, backups, monitoring, and a deployment platform. Public forms use server validation and rate limits; add CAPTCHA/abuse monitoring if launch traffic requires it. Aggregate analytics reports page views only and does not infer age, gender, or visitor identity.

## Developer handoff

See `docs/DEVELOPER-HANDOVER.md` for the visual architecture, file map, local and production SOPs, security boundaries, and release checklist. The editable Word and PDF versions are in the same folder. See `docs/ENVIRONMENT-CONFIGURATION.md` for every environment setting. `TECHNICAL-SPECIFICATION.md` describes the technical architecture, data model, APIs, and production target. The ZIP intentionally excludes `.env.local`, local database files, private CV uploads, generated build output and dependencies. Each developer should create their own `.env.local` from `.env.example`; never share credentials in the source archive. This package delivers the web app and CMS. Native iOS/Android apps are not included.

The existing static site remains in `outputs/amigos-car-care` as the reference version.

## Branch WhatsApp appointments

The homepage appointment form uses `lib/booking-whatsapp.mjs` to build the selected branch's `https://wa.me/` link. It does not POST a booking or send email. Existing API booking records remain in the CMS for history and integrations. Keep each branch's phone set to its WhatsApp-enabled number in the CMS. Test routing with `node scripts/test-booking-whatsapp.mjs`.
