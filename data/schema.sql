CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin','content_editor')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  business_name text NOT NULL DEFAULT 'Amigos Car Care',
  tagline text NOT NULL DEFAULT 'Premium Car Care. Done Right.',
  description text NOT NULL DEFAULT 'Expert car care in Qatar.',
  public_email text NOT NULL DEFAULT 'info@amigoscarcare.com',
  public_phone text NOT NULL DEFAULT '+974 7778 9303',
  hero_image text NOT NULL DEFAULT '/assets/workshop-web.jpg',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES admins(id)
);

CREATE TABLE IF NOT EXISTS app_migrations (
  migration_id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_en text NOT NULL,
  title_ar text NOT NULL DEFAULT '',
  summary_en text NOT NULL,
  summary_ar text NOT NULL DEFAULT '',
  details_en jsonb NOT NULL DEFAULT '[]'::jsonb,
  details_ar jsonb NOT NULL DEFAULT '[]'::jsonb,
  image_path text NOT NULL,
  gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE services ADD COLUMN IF NOT EXISTS gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL DEFAULT '',
  address_en text NOT NULL,
  address_ar text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  hours text NOT NULL DEFAULT '8:00 AM – 10:00 PM',
  map_url text NOT NULL DEFAULT '',
  image_path text NOT NULL DEFAULT '/assets/branch-doha-web.jpg',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL,
  description_ar text NOT NULL DEFAULT '',
  discount text NOT NULL DEFAULT '',
  badge text NOT NULL DEFAULT '',
  image_path text NOT NULL DEFAULT '/assets/workshop-web.jpg',
  branch_slug text NOT NULL DEFAULT 'all',
  promo_code text NOT NULL DEFAULT '',
  terms_en text NOT NULL DEFAULT '',
  terms_ar text NOT NULL DEFAULT '',
  starts_at timestamptz,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','paused','archived')),
  created_by uuid REFERENCES admins(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('business','career','booking')),
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','contacted','closed','spam')),
  notification_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS notification_sent boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admins(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_admin_expiry_idx ON admin_sessions(admin_id, expires_at);
CREATE INDEX IF NOT EXISTS challenges_expiry_idx ON login_challenges(expires_at) WHERE consumed_at IS NULL;
CREATE INDEX IF NOT EXISTS services_active_order_idx ON services(active, sort_order);
CREATE INDEX IF NOT EXISTS offers_public_idx ON offers(status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS enquiries_kind_status_idx ON enquiries(kind, status, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_page_time_idx ON analytics_page_views(created_at DESC, page_path);

CREATE TABLE IF NOT EXISTS uploaded_images (
  id VARCHAR(36) PRIMARY KEY,
  mime_type VARCHAR(40) NOT NULL,
  image_base64 TEXT NOT NULL
);
