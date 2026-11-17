import { z } from 'zod';
import { audit, bad, currentAdmin } from '@/lib/auth';
import { query, insertRow } from '@/lib/db';
import { qatarDateTimeToIso } from '@/lib/offer-dates.mjs';

type Collection = 'services' | 'branches' | 'offers';
const fields: Record<Collection, string[]> = {
  services: ['slug','title_en','title_ar','summary_en','summary_ar','details_en','details_ar','image_path','gallery_images','sort_order','active'],
  branches: ['slug','name_en','name_ar','address_en','address_ar','phone','hours','map_url','image_path','sort_order','active'],
  offers: ['title_en','title_ar','description_en','description_ar','discount','badge','image_path','branch_slug','promo_code','terms_en','terms_ar','starts_at','ends_at','status'],
};
const slug = z.string().min(1).max(100).regex(/^[a-z0-9-]+$/);
const date = z.preprocess((value) => {
  if (value === '' || value === undefined) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    try { return qatarDateTimeToIso(value); } catch { return value; }
  }
  return value;
}, z.string().datetime({ offset: true }).nullable().optional());
const service = z.object({ slug, title_en:z.string().min(2).max(160), title_ar:z.string().max(160).optional(), summary_en:z.string().min(2).max(600), summary_ar:z.string().max(600).optional(), details_en:z.array(z.string().max(500)).optional(), details_ar:z.array(z.string().max(500)).optional(), image_path:z.string().max(300), gallery_images:z.array(z.string().max(300)).max(12).optional(), sort_order:z.number().int().min(0).max(999).optional(), active:z.boolean().optional() });
const branch = z.object({ slug, name_en:z.string().min(2).max(160), name_ar:z.string().max(160).optional(), address_en:z.string().min(2).max(300), address_ar:z.string().max(300).optional(), phone:z.string().max(60).optional(), hours:z.string().max(120).optional(), map_url:z.string().url().max(500).or(z.literal('')).optional(), image_path:z.string().max(300).optional(), sort_order:z.number().int().min(0).max(999).optional(), active:z.boolean().optional() });
const offer = z.object({ title_en:z.string().min(2).max(160), title_ar:z.string().max(160).optional(), description_en:z.string().min(2).max(1500), description_ar:z.string().max(1500).optional(), discount:z.string().max(100).optional(), badge:z.string().max(80).optional(), image_path:z.string().max(300).optional(), branch_slug:z.string().max(100).optional(), promo_code:z.string().max(80).optional(), terms_en:z.string().max(2000).optional(), terms_ar:z.string().max(2000).optional(), starts_at:date, ends_at:date, status:z.enum(['draft','published','paused','archived']).optional() });
const schemas = { services:service, branches:branch, offers:offer };

function cleanInput(collection: Collection, raw: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  for (const key of fields[collection]) if (key in raw) clean[key] = raw[key];
  return clean;
}
function dbValue(value: unknown, key: string) {
  if ((key === 'starts_at' || key === 'ends_at') && typeof value === 'string') return new Date(value);
  return Array.isArray(value) ? JSON.stringify(value) : value;
}

export async function listContent(collection: Collection) {
  if (!await currentAdmin()) return bad('Sign in required.', 401);
  const result = await query(`SELECT * FROM ${collection} ORDER BY ${collection === 'offers' ? 'updated_at DESC' : 'sort_order ASC'}`);
  return Response.json(result.rows);
}
export async function createContent(collection: Collection, req: Request) {
  const admin = await currentAdmin(); if (!admin) return bad('Sign in required.', 401);
  let raw: Record<string, unknown>; try { raw = await req.json(); } catch { return bad('Invalid JSON body.'); }
  const parsed = schemas[collection].safeParse(cleanInput(collection, raw));
  if (!parsed.success) return bad('Please check the required content fields.');
  try {
    const values = Object.fromEntries(Object.entries(parsed.data).map(([key,value]) => [key,dbValue(value,key)]));
    const result = await insertRow<{id:string}>(collection, values);
    await audit(admin.id, 'create', collection, result.id);
    return Response.json(result, { status: 201 });
  } catch (error) { console.error(`Create ${collection} failed`, error); return bad('Could not save this item. Check that its URL slug is unique.', 409); }
}
export async function updateContent(collection: Collection, req: Request) {
  const admin = await currentAdmin(); if (!admin) return bad('Sign in required.', 401);
  let raw: Record<string, unknown>; try { raw = await req.json(); } catch { return bad('Invalid JSON body.'); }
  const id = typeof raw.id === 'string' ? raw.id : ''; if (!id) return bad('Missing content id.');
  const clean = cleanInput(collection, raw); const parsed = schemas[collection].partial().safeParse(clean);
  if (!parsed.success || !Object.keys(parsed.data).length) return bad('Please check the content fields.');
  try {
    const entries = Object.entries(parsed.data); const assignments = entries.map(([key], i) => `${key}=$${i + 1}`).join(',');
    await query(`UPDATE ${collection} SET ${assignments},updated_at=now() WHERE id=$${entries.length + 1}`, [...entries.map(([key, value]) => dbValue(value,key)), id]);
    const result = await query(`SELECT * FROM ${collection} WHERE id=$1`, [id]);
    if (!result.rows.length) return bad('Content not found.', 404);
    await audit(admin.id, 'update', collection, id); return Response.json(result.rows[0]);
  } catch (error) { console.error(`Update ${collection} failed`, error); return bad('Could not update this item. Check values and unique slugs.', 409); }
}
export async function deleteContent(collection: Collection, req: Request) {
  const admin = await currentAdmin(); if (!admin) return bad('Sign in required.', 401);
  const id = new URL(req.url).searchParams.get('id'); if (!id) return bad('Missing content id.');
  await query(`DELETE FROM ${collection} WHERE id=$1`, [id]); await audit(admin.id, 'delete', collection, id);
  return Response.json({ ok: true });
}
