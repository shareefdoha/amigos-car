import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
let seeded = false;
export async function ensureSeed() {
  if (seeded) return;
  await query(`INSERT INTO services(slug,title_en,summary_en,details_en,image_path,sort_order) VALUES
  ('periodic-maintenance','Periodic Maintenance','Routine care that keeps your vehicle dependable.','["Engine oil and filter change","Routine vehicle servicing","Fluid replacement and inspection","Preventive maintenance"]','/assets/oil-change-web.jpg',1),
  ('advanced-inspection','Advanced Vehicle Inspection','A detailed view of your vehicle’s condition and health.','["Expert physical vehicle inspection","Advanced computer diagnostics","Paint condition and thickness checks","Engine health testing"]','/assets/diagnostics-web.jpg',2),
  ('brake-services','Brake Services','Confident stopping starts with a careful brake check.','["Brake pad and disc replacement","Brake system inspection","Brake troubleshooting and repair"]','/assets/brake-service-web.jpg',3),
  ('electrical-diagnosis','Electrical Diagnosis & Repair','Find and fix electrical faults with precision.','["Electrical system diagnosis","Wiring and sensor repair","Starting and charging systems"]','/assets/electrical-ac-web.jpg',4),
  ('car-ac','Car AC Services','Stay cool through Qatar’s hottest days.','["AC system diagnosis","Cooling problem troubleshooting","Leak inspection and gas recharge","AC component repair"]','/assets/ac-service-web.jpg',5),
  ('engine-repair','Engine Repair','Engine diagnosis and repair for performance concerns, unusual noise, leaks and warning lights.','["Engine diagnostics and repair","Performance and warning-light diagnosis","Repair recommendations"]','/assets/engine-diagnostics-web.jpg',6),
  ('transmission-repair','Transmission Repair','Transmission diagnosis and repair for shifting problems, unusual noise and fluid leaks.','["Transmission diagnosis and repair","Gear shifting troubleshooting","Fluid leak inspection"]','/assets/transmission-web.jpg',7),
  ('denting-painting','Denting and Painting','Restore your vehicle’s finish with careful bodywork.','["Dent removal and bodywork","Scratch repair","Full and partial painting","Accident damage restoration"]','/assets/denting-painting-drive.png',8)
  ON CONFLICT(slug) DO NOTHING`);
  await query(`WITH migration AS (
    INSERT INTO app_migrations(migration_id) VALUES ('20261026_restore_service_image_mapping_v1')
    ON CONFLICT(migration_id) DO NOTHING RETURNING migration_id
  )
  UPDATE services SET
    image_path=CASE slug
      WHEN 'periodic-maintenance' THEN '/assets/mechanics-web.jpg'
      WHEN 'advanced-inspection' THEN '/assets/diagnostics-web.jpg'
      WHEN 'brake-services' THEN '/assets/brake-service-web.jpg'
      WHEN 'electrical-diagnosis' THEN '/assets/electrical-ac-web.jpg'
      WHEN 'car-ac' THEN '/assets/ac-service-web.jpg'
      WHEN 'engine-repair' THEN '/assets/engine-diagnostics-web.jpg'
      WHEN 'transmission-repair' THEN '/assets/transmission-web.jpg'
      WHEN 'denting-painting' THEN '/assets/denting-painting-drive.png'
    END,
    sort_order=CASE slug
      WHEN 'periodic-maintenance' THEN 1 WHEN 'advanced-inspection' THEN 2
      WHEN 'brake-services' THEN 3 WHEN 'electrical-diagnosis' THEN 4
      WHEN 'car-ac' THEN 5 WHEN 'engine-repair' THEN 6
      WHEN 'transmission-repair' THEN 7 WHEN 'denting-painting' THEN 8
    END,
    updated_at=now()
  WHERE slug IN ('periodic-maintenance','advanced-inspection','brake-services','electrical-diagnosis','car-ac','engine-repair','transmission-repair','denting-painting')
    AND EXISTS (SELECT 1 FROM migration)`);
  await query(`WITH migration AS (
    INSERT INTO app_migrations(migration_id) VALUES ('20261026_restore_oil_change_service_photo_v2')
    ON CONFLICT(migration_id) DO NOTHING RETURNING migration_id
  )
  UPDATE services SET image_path=CASE slug
      WHEN 'periodic-maintenance' THEN '/assets/oil-change-web.jpg'
      WHEN 'engine-repair' THEN '/assets/engine-diagnostics-web.jpg'
    END,
    updated_at=now()
  WHERE slug IN ('periodic-maintenance','engine-repair')
    AND EXISTS (SELECT 1 FROM migration)`);  await query("UPDATE services SET active=false WHERE slug='engine-transmission'");
  await query(`WITH migration AS (
    INSERT INTO app_migrations(migration_id) VALUES ('20261026_add_service_photo_galleries_v1')
    ON CONFLICT(migration_id) DO NOTHING RETURNING migration_id
  )
  UPDATE services SET
    image_path=CASE WHEN slug='engine-repair' THEN '/assets/engine-repair-drive.png' ELSE image_path END,
    gallery_images=CASE WHEN slug='periodic-maintenance' THEN '["/assets/periodic-maintenance-drive.jpg"]'::jsonb ELSE gallery_images END,
    updated_at=now()
  WHERE slug IN ('periodic-maintenance','engine-repair')
    AND EXISTS (SELECT 1 FROM migration)`);
  await query(`INSERT INTO branches(slug,name_en,address_en,phone,map_url,image_path,sort_order) VALUES
  ('b-ring','B-Ring Branch','B-Ring Road, Doha, Qatar','+974 7778 9303','https://maps.app.goo.gl/KSdkPuSMBDpsAnjb7?g_st=ic','/assets/branch-doha-web.jpg',1),
  ('industrial-area','Industrial Area','Industrial Area, Doha, Qatar','+974 6697 2786','https://maps.app.goo.gl/yygJsF6qdyqH35YZ9','/assets/branch-industrial-web.jpg',2),
  ('ezdan-wukair','Ezdan Oasis (Al Wukair)','Ezdan Oasis, Al Wukair, Qatar','+974 7737 6786','https://maps.app.goo.gl/3fGj8tNDxece6XhF7?g_st=ic','/assets/branch-wukair-web.jpg',3)
  ON CONFLICT(slug) DO NOTHING`);
  await query("UPDATE branches SET phone='+974 7778 9303',map_url='https://maps.app.goo.gl/KSdkPuSMBDpsAnjb7?g_st=ic' WHERE slug='b-ring' AND phone='+974 4444 0000'");
  await query("UPDATE branches SET phone='+974 6697 2786' WHERE slug='industrial-area' AND phone='+974 4466 0000'");
  await query("UPDATE branches SET phone='+974 7737 6786',map_url='https://maps.app.goo.gl/3fGj8tNDxece6XhF7?g_st=ic' WHERE slug='ezdan-wukair' AND phone='+974 4477 0000'");
  const username = process.env.ADMIN_INITIAL_USERNAME; const email = process.env.ADMIN_INITIAL_EMAIL; const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (username && email && password && password !== 'SET_A_NEW_UNIQUE_PASSWORD_HERE') {
    const existing = await query('SELECT id FROM admins WHERE username=$1', [username]);
    if (!existing.rows.length) await query('INSERT INTO admins(username,email,password_hash,role) VALUES($1,$2,$3,$4)', [username,email,await bcrypt.hash(password,12),'super_admin']);
  }
  seeded = true;
}
