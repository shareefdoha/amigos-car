'use client';
import {useEffect,useRef} from 'react';
declare global { interface Window { grecaptcha?: {ready:(cb:()=>void)=>void;render:(element:HTMLElement,options:Record<string,unknown>)=>number;reset:(id?:number)=>void} } }
export default function Recaptcha({siteKey,onToken,resetCount}:{siteKey:string;onToken:(token:string)=>void;resetCount:number}){
 const container=useRef<HTMLDivElement>(null);const widget=useRef<number|null>(null);const callback=useRef(onToken);callback.current=onToken;
 useEffect(()=>{let live=true;const render=()=>window.grecaptcha?.ready(()=>{if(live&&container.current&&widget.current===null)widget.current=window.grecaptcha!.render(container.current,{sitekey:siteKey,callback:(token:string)=>callback.current(token),'expired-callback':()=>callback.current(''),'error-callback':()=>callback.current('')})});
 let script=document.querySelector<HTMLScriptElement>('script[data-recaptcha-v2]');if(!script){script=document.createElement('script');script.src='https://www.google.com/recaptcha/api.js?render=explicit';script.async=true;script.defer=true;script.dataset.recaptchaV2='true';document.head.appendChild(script)}
 script.addEventListener('load',render);if(window.grecaptcha)render();return()=>{live=false;script?.removeEventListener('load',render)};
 },[siteKey]);
 useEffect(()=>{if(widget.current!==null&&resetCount)window.grecaptcha?.reset(widget.current)},[resetCount]);
 return <div ref={container} aria-label="Security verification"/>;
}
