'use client';
import {useEffect,useState} from 'react';
import {formatQatarDateTime} from '@/lib/offer-dates.mjs';
export type Offer={id:string;title_en:string;title_ar:string;description_en:string;description_ar:string;discount:string;badge:string;image_path:string;branch_slug:string;promo_code:string;terms_en:string;terms_ar:string;starts_at:string|null;ends_at:string|null};
const branches:Record<string,string>={'b-ring':'B-Ring · Doha','industrial-area':'Industrial Area','ezdan-wukair':'Ezdan Oasis · Al Wukair'};
export default function OfferCard({offer:o,detail=false}:{offer:Offer;detail?:boolean}){
 const [notice,setNotice]=useState('');
 const [ar,setAr]=useState(false);
 useEffect(()=>{const sync=()=>setAr(document.documentElement.lang==='ar');sync();window.addEventListener('amigos-language-change',sync);return()=>window.removeEventListener('amigos-language-change',sync)},[]);
 const title=(ar&&o.title_ar?.trim())||o.title_en;
 const description=(ar&&o.description_ar?.trim())||o.description_en;
 const terms=(ar&&o.terms_ar?.trim())||o.terms_en;
 const branchNames:Record<string,string>=ar?{'b-ring':'فرع الحلقة B','industrial-area':'المنطقة الصناعية','ezdan-wukair':'واحة إزدان · الوكير'}:branches;
 const date=o.ends_at?(ar?new Intl.DateTimeFormat('ar-QA',{timeZone:'Asia/Qatar',day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(o.ends_at)):formatQatarDateTime(o.ends_at)):'';
 const [failedImage,setFailedImage]=useState('');
 const url='https://amigoscarcare.com/offers/'+encodeURIComponent(o.id);
 const numeric=Number(String(o.discount||'').replace('%','').trim());
 const discount=o.discount&&Number.isFinite(numeric)&&numeric>=0&&numeric<=100?numeric+'%':o.discount;
 async function copy(value:string,message:string){try{await navigator.clipboard.writeText(value);setNotice(message)}catch{setNotice('Unable to copy. Please copy the link from your browser.')}}
 async function share(){try{if(navigator.share)await navigator.share({title,text:description,url});else await copy(url,'Offer link copied.')}catch(error){if(!(error instanceof Error&&error.name==='AbortError'))setNotice('Unable to share. Please use Facebook or copy the link.')}}
 return <article data-localized className={'offer-card offer-card-new'+(detail?' offer-card-detail':'')}>
 {o.image_path&&failedImage!==o.image_path&&<a className="offer-art" href={"/offers/"+encodeURIComponent(o.id)} aria-label={(ar?'عرض ':'View ')+title}><img src={o.image_path} alt={title} onError={()=>setFailedImage(o.image_path)}/></a>}
 <div className="offer-content"><div className="offer-meta"><span>{branchNames[o.branch_slug]||(ar?'كل الفروع':'All branches')}</span>{discount&&<strong className="offer-saving">{discount} {ar?'خصم':'off'}</strong>}</div>
 <h2>{detail?title:<a href={"/offers/"+encodeURIComponent(o.id)}>{title}</a>}</h2><p>{description}</p>
 {o.ends_at&&<p className="offer-validity">{ar?'صالح حتى':'Valid until'} {date} · {ar?'بتوقيت قطر':'Qatar time'}</p>}
 {o.promo_code&&<button type="button" className="promo-code" onClick={()=>copy(o.promo_code,'Promo code copied.')}><span>{ar?'رمز العرض':'Promo code'}</span><b>{o.promo_code}</b><span>{ar?'نسخ':'Copy'}</span></button>}
 {terms&&<details><summary>{ar?'شروط العرض':'Offer terms'}</summary><p>{terms}</p></details>}
 <a className="button navy" href="/#book">{ar?'احجز هذا العرض':'Book this offer'}</a>
 <div className="offer-sharing"><span>{ar?'مشاركة العرض':'Share offer'}</span><a href={'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)} target="_blank" rel="noopener noreferrer" aria-label={(ar?'مشاركة ':'Share ')+title+(ar?' على فيسبوك':' on Facebook')}>Facebook</a><button type="button" onClick={share}>{ar?'مشاركة':'Share'}</button><button type="button" onClick={()=>copy(url,'Offer link copied.')}>{ar?'نسخ الرابط':'Copy link'}</button></div><span className="offer-notice" role="status">{notice}</span>
 </div></article>
}
