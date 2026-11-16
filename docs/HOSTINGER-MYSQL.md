# Hostinger MySQL / MariaDB setup

The app now supports MySQL 8.0.16+ and MariaDB 10.6+ via `mysql2`. Hostinger Web/Cloud databases use MariaDB. Existing PostgreSQL and local PGlite configurations remain supported. This adds a new connection path, not an automatic copy of local or PostgreSQL data.

## 1. Database import

Create a database and user in Hostinger and open that database in phpMyAdmin. Import **`data/schema.mysql.sql`**. Do not import `data/schema.sql`, which is the PostgreSQL schema. The MySQL file creates tables and indexes without dropping data. If an earlier PostgreSQL import created partial tables with different columns, use a new empty database rather than dropping existing tables blindly.

Importing SQL alone does not create the admin account. The app creates default content and the configured initial admin on the first public-site or login request. `pnpm db:init` and `pnpm db:seed` can also initialize the schema and provision the admin from environment settings.

## 2. Environment variables

Set these in the Node.js application's hosting environment, using the actual host, database name, username and password shown by Hostinger:

```dotenv
NODE_ENV=production
DATABASE_URL=mysql://DATABASE_USER:URL_ENCODED_PASSWORD@DATABASE_HOST:3306/DATABASE_NAME
DATABASE_SSL=false
ADMIN_INITIAL_USERNAME=YOUR_PRIVATE_ADMIN_USERNAME
ADMIN_INITIAL_EMAIL=YOUR_MONITORED_EMAIL_ADDRESS
ADMIN_INITIAL_PASSWORD=YOUR_NEW_STRONG_PASSWORD
AUTH_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
MAIL_MODE=smtp
SMTP_HOST=YOUR_SMTP_HOST
SMTP_PORT=465
SMTP_USER=YOUR_MAILBOX_ADDRESS
SMTP_PASS=YOUR_MAILBOX_PASSWORD
SMTP_FROM="Amigos Car Care <YOUR_MAILBOX_ADDRESS>"
```

Percent-encode special characters in the username/password part of `DATABASE_URL`. For example, `@` becomes `%40`, `#` becomes `%23`, and `/` becomes `%2F`. Keep the raw mailbox password in `SMTP_PASS`, not the encoded database password. Enable `DATABASE_SSL=true` only when the database endpoint supports/requires TLS with a trusted certificate. Use the hostname supplied for your deployment; do not assume `localhost` when the Node.js app and database run on different hosts. External connections may require Hostinger remote-database access configuration.

Leave `PORT` to the hosting platform. The start script listens on its assigned port and all interfaces. Keep `.env.hostinger` private and out of Git. Next.js does not load that filename automatically: copy the values into hosting environment settings or a private production `.env` file. Do not upload your local `.env.local`, because it can override production values and contains local-only settings.

## 3. Build and start

Use a Node.js-capable deployment (not static file hosting). Install using the committed lockfile, build with `pnpm build`, and start with `pnpm start`. For hosts using npm, use the corresponding install/build/start commands, preserving a reproducible dependency workflow.

After deployment, visit `/api/health`, the homepage, and `/admin`. Sign in using the production admin username and password. Changing `ADMIN_INITIAL_PASSWORD` after an account has been created does not reset the stored account password.

The application creates missing tables on connection. No existing local data is uploaded automatically. Uploads and private CVs still use filesystem storage, so configure persistent storage before relying on them across deployments.

## Verification

Run `pnpm check`, `pnpm build`, and `pnpm test:db` for type/build checks and disposable PGlite integration coverage. To test a real MySQL/MariaDB server, create a new disposable database named `amigos_test_*`, set `TEST_DATABASE_URL` to its URL, and run `node scripts/test-database.mjs`. Use a separate fresh test database with `node scripts/test-mysql-http.mjs` for full HTTP/password-sign-in/CMS/form coverage. Stop the normal development server before the HTTP test because Next.js uses one development build directory. These test scripts refuse database names outside `amigos_test_*` and do not read your production environment file.

## Official references

- [Hostinger database engine](https://www.hostinger.com/support/1583226-which-database-management-system-is-used-at-hostinger/)
- [Find Hostinger database connection details](https://www.hostinger.com/support/1583552-how-to-find-your-mysql-database-details-in-hostinger/)
