import {query} from '@/lib/db';
export const runtime='nodejs';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return new Response('Image not found',{status:404});
 const result=await query<{mime_type:string;image_base64:string}>('SELECT mime_type,image_base64 FROM uploaded_images WHERE id=$1',[id]);
 const image=result.rows[0];if(!image)return new Response('Image not found',{status:404});
 return new Response(Buffer.from(image.image_base64,'base64'),{headers:{'Content-Type':image.mime_type,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
}
