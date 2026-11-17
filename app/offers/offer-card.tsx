'use client';
import {useState} from 'react';
import UiIcon from '../ui-icon';
import {formatQatarDateTime} from '@/lib/offer-dates.mjs';
export type Offer={id:string;title_en:string;description_en:string;discount:string;badge:string;image_path:string;branch_slug:string;promo_code:string;terms_en:string;starts_at:string|null;ends_at:string|null};
const branches:Record<string,string>={'b-ring':'B-Ring · Doha','industrial-area':'Industrial Area','ezdan-wukair':'Ezdan Oasis · Al Wukair'};
export default function OfferCard({offer:o,detail=false}:{offer:Offer;detail?:boolean}){
 const [notice,setNotice]=useState('');
 const url='https://amigoscarcare.com/offers/'+encodeURIComponent(o.id);
 const numeric=Number(String(o.discount||'').replace('%','').trim());
 const discount=o.discount&&Number.isFinite(numeric)&&numeric>=0&&numeric<=100?numeric+'%':o.discount;
 async function copy(value:string,message:string){try{await navigator.clipboard.writeText(value);setNotice(message)}catch{setNotice('Unable to copy. Please copy the link from your browser.')}}
 async function share(){try{if(navigator.share)await navigator.share({title:o.title_en,text:o.description_en,url});else await copy(url,'Offer link copied.')}catch(error){if(!(error instanceof Error&&error.name==='AbortError'))setNotice('Unable to share. Please use Facebook or copy the link.')}}
 return <article className={'offer-card offer-card-new'+(detail?' offer-card-detail':'')}>
 <a className="offer-art" href={"/offers/"+encodeURIComponent(o.id)} aria-label={'View '+o.title_en}><img src={o.image_path||'/assets/workshop-modern-web.jpg'} alt={o.title_en}/>{discount&&<span className="offer-saving"><strong>{discount}</strong><span>OFF</span></span>}</a>
 <div className="offer-content"><div className="offer-meta"><span className="eyebrow orange">{o.badge||'AMIGOS OFFER'}</span><span>{branches[o.branch_slug]||'All branches'}</span></div>
 <h2>{detail?o.title_en:<a href={"/offers/"+encodeURIComponent(o.id)}>{o.title_en}</a>}</h2><p>{o.description_en}</p>
 {o.ends_at&&<p className="offer-validity">Valid until {formatQatarDateTime(o.ends_at)} · Qatar time</p>}
 {o.promo_code&&<button type="button" className="promo-code" onClick={()=>copy(o.promo_code,'Promo code copied.')}><span>Promo code</span><b>{o.promo_code}</b><span>Copy</span></button>}
 {o.terms_en&&<details><summary>Offer terms</summary><p>{o.terms_en}</p></details>}
 <a className="button navy" href="/#book">Book this offer <UiIcon name="arrow-up-right"/></a>
 <div className="offer-sharing"><span>Share offer</span><a href={'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)} target="_blank" rel="noopener noreferrer" aria-label={'Share '+o.title_en+' on Facebook'}>Facebook</a><button type="button" onClick={share}>Share</button><button type="button" onClick={()=>copy(url,'Offer link copied.')}>Copy link</button></div><p className="offer-notice" role="status">{notice}</p>
 </div></article>
}
