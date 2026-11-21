# Deployment security and SEO

## Admin reCAPTCHA

Register a Google reCAPTCHA v2 “I'm not a robot” checkbox key for amigoscarcare.com and www.amigoscarcare.com. In Hostinger's private environment settings add RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY, then set RECAPTCHA_REQUIRED=true and redeploy/restart. Never commit the secret. The server verifies every token with Google and checks its hostname; it rejects logins if required keys are missing or verification fails. Without keys and with RECAPTCHA_REQUIRED unset or false, CAPTCHA is not active. Keep Google domain validation enabled. If the site uses another legitimate hostname, register it in Google and add the exact hostname to RECAPTCHA_ALLOWED_HOSTNAMES.

Browser-origin checks on admin/auth mutations allow https://amigoscarcare.com and https://www.amigoscarcare.com by default. If administering from a separate legitimate HTTPS hostname, set ADMIN_ALLOWED_ORIGINS to a comma-separated list of exact origins including the canonical site. Avoid allowing untrusted origins.

After deployment, confirm a valid admin can sign in with CAPTCHA, an empty/invalid token is rejected, and a wrong password does not authenticate. Google tokens are single-use, so complete a new challenge after a failed attempt. A Google outage or misconfiguration prevents login when CAPTCHA is enabled.

## Operational safeguards

- The built-in rate limiter is local to one Node process and relies on forwarded IP headers; it is not an effective distributed brute-force defense if clients can spoof those headers. Configure Hostinger's trusted proxy/WAF to strip untrusted forwarded headers and apply distributed rate limits on /api/auth/login and public form endpoints. Monitor repeated failures.
- Enforce request-body limits at the proxy, including chunked requests. Attachment extension/header checks are not malware scanning; scan uploaded documents before opening them. Private attachments must remain outside the public web root and should be backed up in protected storage.
- Keep dependencies patched, use HTTPS, restrict database network access and privileges, rotate any exposed passwords and secrets, and maintain tested backups. Rotating AUTH_SECRET invalidates active admin sessions.
- Security checks reduce risk but cannot guarantee immunity. Review hosting settings, access logs and application dependencies regularly, and consider an independent penetration test.

## Search indexing

Public pages include titles, descriptions and canonical URLs. robots.txt excludes admin and private APIs, while allowing public uploaded images. sitemap.xml lists the main public pages. Individual service pages currently share the /service route; service-specific server-rendered metadata and a dynamic sitemap can be added if deeper indexing is needed.
