'use client';import{useEffect}from'react';import{usePathname}from'next/navigation';
export default function PageAnalytics(){const path=usePathname();useEffect(()=>{if(!path||path.startsWith('/admin'))return;void fetch('/api/public/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path})}).catch(()=>{});},[path]);return null;}
