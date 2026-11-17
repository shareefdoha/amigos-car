import { currentAdmin,bad,audit } from '@/lib/auth';
import {insertRow} from '@/lib/db';
export const runtime='nodejs';
export async function POST(req:Request){
 const a=await currentAdmin();if(!a)return bad('Sign in required.',401);
 const form=await req.formData();const file=form.get('file');
 if(!(file instanceof File)||!file.size)return bad('Choose an image.');
 if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>8*1024*1024)return bad('Use JPG, PNG, WebP or AVIF up to 8 MB.');
 const bytes=Buffer.from(await file.arrayBuffer());
 const valid=file.type==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:file.type==='image/webp'?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP':bytes.toString('ascii',4,8)==='ftyp'&&['avif','avis'].some(brand=>bytes.toString('ascii',8,32).includes(brand));
 if(!valid)return bad('The file does not match a supported image format.');
 const saved=await insertRow<{id:string}>('uploaded_images',{mime_type:file.type,image_base64:bytes.toString('base64')});
 await audit(a.id,'upload','image',saved.id);
 return Response.json({path:'/api/public/images/'+saved.id},{status:201});
}
