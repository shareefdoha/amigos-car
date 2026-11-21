// Check the file header as well as its extension; this is not malware scanning.
export async function isSupportedAttachment(file:File,ext:string){
 const bytes=Buffer.from(await file.slice(0,16).arrayBuffer());
 if(ext==='pdf')return bytes.subarray(0,5).toString('ascii')==='%PDF-';
 if(ext==='doc'||ext==='ppt')return bytes.subarray(0,8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]));
 if(ext==='docx'||ext==='pptx')return bytes.length>=4&&bytes[0]===0x50&&bytes[1]===0x4b&&bytes[2]===0x03&&bytes[3]===0x04;
 if(ext==='png')return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(ext==='jpg'||ext==='jpeg')return bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
 return false;
}
