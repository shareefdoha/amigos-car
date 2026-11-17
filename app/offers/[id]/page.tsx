import type {Metadata} from 'next';
import {cache} from 'react';
import {notFound} from 'next/navigation';
import {query} from '@/lib/db';
import {ensureSeed} from '@/lib/seed';
import OfferCard,{type Offer} from '../offer-card';
export const dynamic='force-dynamic';
const getOffer=cache(async(id:string)=>{
 if(!/^[a-f0-9-]{36}$/i.test(id))return null;
 await ensureSeed();
 const result=await query<Offer>("SELECT id,title_en,title_ar,description_en,description_ar,discount,badge,image_path,branch_slug,promo_code,terms_en,terms_ar,starts_at,ends_at,(SELECT name_en FROM branches WHERE branches.slug=offers.branch_slug) AS branch_name_en,(SELECT name_ar FROM branches WHERE branches.slug=offers.branch_slug) AS branch_name_ar FROM offers WHERE id=$1 AND status='published' AND (starts_at IS NULL OR starts_at<=now()) AND (ends_at IS NULL OR ends_at>=now())",[id]);
 return result.rows[0]||null;
});
type Props={params:Promise<{id:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const o=await getOffer((await params).id);if(!o)return {title:'Offer unavailable | Amigos Car Care',robots:{index:false,follow:false}};
 const url='https://amigoscarcare.com/offers/'+o.id;
 const image=new URL(o.image_path||'/assets/workshop-modern-web.jpg','https://amigoscarcare.com').href;
 const title=o.title_en+' | Amigos Car Care';const description=o.description_en;
 return {title,description,alternates:{canonical:url},openGraph:{type:'website',url,title,description,siteName:'Amigos Car Care',images:[{url:image,alt:o.title_en}]},twitter:{card:'summary_large_image',title,description,images:[image]}};
}
export default async function OfferPage({params}:Props){const o=await getOffer((await params).id);if(!o)notFound();return <main className="offers-page offer-detail-page"><a className="textlink" href="/offers">← All offers</a><h1>Offers from Amigos Car Care</h1><OfferCard offer={JSON.parse(JSON.stringify(o))} detail/></main>}
