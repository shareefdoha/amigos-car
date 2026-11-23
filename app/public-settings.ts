'use client';
import {useEffect,useState} from 'react';
type PublicSettings={business_name?:string;public_email?:string};
export function usePublicSettings(){const [settings,setSettings]=useState<PublicSettings>({});useEffect(()=>{fetch('/api/public/site',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>setSettings(data.settings||{})).catch(()=>{})},[]);return settings}
