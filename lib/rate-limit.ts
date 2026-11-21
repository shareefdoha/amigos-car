// In-memory limits are a secondary safeguard; enforce distributed limits at the trusted edge.
const buckets=new Map<string,{from:number;hits:number}>();
export function rateLimit(req:Request,key:string,limit:number,windowMs:number){
 const now=Date.now();
 if(buckets.size>=10000){for(const [id,bucket] of buckets)if(now-bucket.from>900000)buckets.delete(id);if(buckets.size>=10000)buckets.delete(buckets.keys().next().value!)}
 const forwarded=(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local').slice(0,100);
 const id=key+':'+forwarded;const current=buckets.get(id);
 if(!current||now-current.from>windowMs){buckets.set(id,{from:now,hits:1});return true}
 if(current.hits>=limit)return false;current.hits++;return true;
}
