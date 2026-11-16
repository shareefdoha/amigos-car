import bcrypt from 'bcryptjs';
import { query, insertRow, runMigration } from '@/lib/db';
let seedPromise: Promise<void> | undefined;
export function ensureSeed() {
  return seedPromise ??= seed().catch(error => { seedPromise = undefined; throw error; });
}
async function seed() {
  for (const service of [
  {
    "slug": "periodic-maintenance",
    "title_en": "Periodic Maintenance",
    "summary_en": "Routine care that keeps your vehicle dependable.",
    "details_en": [
      "Engine oil and filter change",
      "Routine vehicle servicing",
      "Fluid replacement and inspection",
      "Preventive maintenance"
    ],
    "image_path": "/assets/oil-change-web.jpg",
    "sort_order": 1
  },
  {
    "slug": "advanced-inspection",
    "title_en": "Advanced Vehicle Inspection",
    "summary_en": "A detailed view of your vehicle’s condition and health.",
    "details_en": [
      "Expert physical vehicle inspection",
      "Advanced computer diagnostics",
      "Paint condition and thickness checks",
      "Engine health testing"
    ],
    "image_path": "/assets/diagnostics-web.jpg",
    "sort_order": 2
  },
  {
    "slug": "brake-services",
    "title_en": "Brake Services",
    "summary_en": "Confident stopping starts with a careful brake check.",
    "details_en": [
      "Brake pad and disc replacement",
      "Brake system inspection",
      "Brake troubleshooting and repair"
    ],
    "image_path": "/assets/brake-service-web.jpg",
    "sort_order": 3
  },
  {
    "slug": "electrical-diagnosis",
    "title_en": "Electrical Diagnosis & Repair",
    "summary_en": "Find and fix electrical faults with precision.",
    "details_en": [
      "Electrical system diagnosis",
      "Wiring and sensor repair",
      "Starting and charging systems"
    ],
    "image_path": "/assets/electrical-ac-web.jpg",
    "sort_order": 4
  },
  {
    "slug": "car-ac",
    "title_en": "Car AC Services",
    "summary_en": "Stay cool through Qatar’s hottest days.",
    "details_en": [
      "AC system diagnosis",
      "Cooling problem troubleshooting",
      "Leak inspection and gas recharge",
      "AC component repair"
    ],
    "image_path": "/assets/ac-service-web.jpg",
    "sort_order": 5
  },
  {
    "slug": "engine-repair",
    "title_en": "Engine Repair",
    "summary_en": "Engine diagnosis and repair for performance concerns, unusual noise, leaks and warning lights.",
    "details_en": [
      "Engine diagnostics and repair",
      "Performance and warning-light diagnosis",
      "Repair recommendations"
    ],
    "image_path": "/assets/engine-diagnostics-web.jpg",
    "sort_order": 6
  },
  {
    "slug": "transmission-repair",
    "title_en": "Transmission Repair",
    "summary_en": "Transmission diagnosis and repair for shifting problems, unusual noise and fluid leaks.",
    "details_en": [
      "Transmission diagnosis and repair",
      "Gear shifting troubleshooting",
      "Fluid leak inspection"
    ],
    "image_path": "/assets/transmission-web.jpg",
    "sort_order": 7
  },
  {
    "slug": "denting-painting",
    "title_en": "Denting and Painting",
    "summary_en": "Restore your vehicle’s finish with careful bodywork.",
    "details_en": [
      "Dent removal and bodywork",
      "Scratch repair",
      "Full and partial painting",
      "Accident damage restoration"
    ],
    "image_path": "/assets/denting-painting-drive.png",
    "sort_order": 8
  }
]) await insertRow('services', service, 'slug');
  await runMigration('20261026_restore_service_image_mapping_v1', [`UPDATE services SET
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
  WHERE slug IN ('periodic-maintenance','advanced-inspection','brake-services','electrical-diagnosis','car-ac','engine-repair','transmission-repair','denting-painting')`]);
  await runMigration('20261026_restore_oil_change_service_photo_v2', [`UPDATE services SET image_path=CASE slug
      WHEN 'periodic-maintenance' THEN '/assets/oil-change-web.jpg'
      WHEN 'engine-repair' THEN '/assets/engine-diagnostics-web.jpg'
    END,
    updated_at=now()
  WHERE slug IN ('periodic-maintenance','engine-repair')`]);  await query("UPDATE services SET active=false WHERE slug='engine-transmission'");
  await runMigration('20261026_add_service_photo_galleries_v1', [
    "UPDATE services SET image_path='/assets/engine-repair-drive.png',updated_at=now() WHERE slug='engine-repair'",
    `UPDATE services SET gallery_images='["/assets/periodic-maintenance-drive.jpg"]',updated_at=now() WHERE slug='periodic-maintenance'`,
  ]);
  for (const branch of [
  {
    "slug": "b-ring",
    "name_en": "B-Ring Branch",
    "address_en": "B-Ring Road, Doha, Qatar",
    "phone": "+974 7778 9303",
    "map_url": "https://maps.app.goo.gl/KSdkPuSMBDpsAnjb7?g_st=ic",
    "image_path": "/assets/branch-doha-web.jpg",
    "sort_order": 1
  },
  {
    "slug": "industrial-area",
    "name_en": "Industrial Area",
    "address_en": "Industrial Area, Doha, Qatar",
    "phone": "+974 6697 2786",
    "map_url": "https://maps.app.goo.gl/yygJsF6qdyqH35YZ9",
    "image_path": "/assets/branch-industrial-web.jpg",
    "sort_order": 2
  },
  {
    "slug": "ezdan-wukair",
    "name_en": "Ezdan Oasis (Al Wukair)",
    "address_en": "Ezdan Oasis, Al Wukair, Qatar",
    "phone": "+974 7737 6786",
    "map_url": "https://maps.app.goo.gl/3fGj8tNDxece6XhF7?g_st=ic",
    "image_path": "/assets/branch-wukair-web.jpg",
    "sort_order": 3
  }
]) await insertRow('branches', branch, 'slug');
  await query("UPDATE branches SET phone='+974 7778 9303',map_url='https://maps.app.goo.gl/KSdkPuSMBDpsAnjb7?g_st=ic' WHERE slug='b-ring' AND phone='+974 4444 0000'");
  await query("UPDATE branches SET phone='+974 6697 2786' WHERE slug='industrial-area' AND phone='+974 4466 0000'");
  await query("UPDATE branches SET phone='+974 7737 6786',map_url='https://maps.app.goo.gl/3fGj8tNDxece6XhF7?g_st=ic' WHERE slug='ezdan-wukair' AND phone='+974 4477 0000'");
  const username = process.env.ADMIN_INITIAL_USERNAME; const email = process.env.ADMIN_INITIAL_EMAIL; const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (username && email && password && password !== 'SET_A_NEW_UNIQUE_PASSWORD_HERE') {
    const existing = await query('SELECT id FROM admins WHERE username=$1 OR email=$2', [username,email]);
    if (!existing.rows.length) await insertRow('admins', { username, email, password_hash: await bcrypt.hash(password,12), role: 'super_admin' });
  }

}
