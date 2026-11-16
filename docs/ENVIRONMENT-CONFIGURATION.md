# Environment Configuration

The application reads environment values at startup. Use `.env.local` only for private local development, or your hosting provider's secret manager in staging and production. Never place real values in the repository, a screenshot, a support ticket, or a shared ZIP.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Keep `DATABASE_URL` empty to use the local PGlite database under `data/local-db/`.
3. Set a unique admin username, private email and strong password. Generate a random auth secret with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"` and replace the placeholder.
5. Start with `pnpm dev`. The server uses port 3000 unless `PORT` is set.

## Production values

Configure these in the host's secret/environment panel. Do not deploy a checked-in `.env.local`.

| Variable | Production guidance |
|---|---|
| `DATABASE_URL` | MySQL/MariaDB (`mysql://USER:PASSWORD@HOST:3306/DATABASE`) or PostgreSQL (`postgresql://...`) connection URL. Percent-encode credentials in URLs. See `HOSTINGER-MYSQL.md`. |
| `LOCAL_DATABASE_PATH` | Optional development-only PGlite directory when `DATABASE_URL` is empty. Defaults to `data/local-db`. Does not migrate or replace an existing database. |
| `DATABASE_SSL` | `true` when the provider requires TLS and its certificate is trusted; otherwise `false`. |
| `PORT` | Let the platform inject its assigned port. The app binds to `0.0.0.0`. |
| `ADMIN_INITIAL_USERNAME` | Initial admin username, unique to this deployment. |
| `ADMIN_INITIAL_EMAIL` | Administrative contact email stored on the admin profile; not used for sign-in codes. |
| `ADMIN_INITIAL_PASSWORD` | New unique bootstrap password; rotate after provisioning and follow your identity policy. |
| `AUTH_SECRET` | Cryptographically random value of at least 32 characters. Store only in the host secret manager. |
| `MAIL_MODE` | `smtp`; console mode is local development only. |
| `SMTP_HOST` | Transactional SMTP server hostname. |
| `SMTP_PORT` | Provider's recommended port. The current transport enables implicit TLS on port 465. |
| `SMTP_USER`, `SMTP_PASS` | SMTP credentials. Rotate if exposed. |
| `SMTP_FROM` | Sender identity on a verified domain, e.g. `Amigos Car Care <no-reply@example.com>`. |

`NODE_ENV` is supplied by Next.js/the host. The current code does not read `NEXT_PUBLIC_SITE_URL` or `SMTP_SECURE`; TLS selection is derived from `SMTP_PORT`, so those settings are not included in the sample.

## Safe sample file

The root `.env.example` contains placeholders only. It is safe to share and should be the starting point for each developer's private `.env.local`. Do not replace the placeholders in the shared sample with real passwords, SMTP credentials, or production database URLs.

## Email delivery behavior

Admin sign-in does not use SMTP or email verification. Business, career and booking notification code also checks SMTP settings and attempts delivery. If an email attempt is missing or fails, the request is still stored in the database and must be reviewed in the CMS enquiry inbox. Set up delivery monitoring and a recovery process before launch.

## Storage configuration is separate

Database configuration does not make file uploads durable. The current app stores CMS images in `public/uploads/` and career CVs in `data/private-cv/` on the application filesystem. Configure persistent private/public object storage and update the storage adapter before deploying to an ephemeral or multi-instance host.
