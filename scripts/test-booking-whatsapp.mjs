import assert from 'node:assert/strict';
import { buildBookingWhatsAppUrl, normalizeWhatsAppNumber } from '../lib/booking-whatsapp.mjs';
const service={slug:'engine-repair',title_en:'Engine Repair'};
const details={contact_name:'أحمد & Ali',email:'customer@example.com',phone:'+974 5555 1111',service:service.slug,branch:'b-ring',vehicle_type:'SUV / 4×4',vehicle_details:'Toyota Land Cruiser, 2022',preferred_date:'2026-11-20',preferred_time:'10:00 AM–12:00 PM',message:'AC & engine? #check\nيرجى الاتصال قبل الموعد'};
for(const [slug,name_en,phone,expected] of [
 ['b-ring','B-Ring Branch','+974 7778 9303','97477789303'],
 ['industrial-area','Industrial Area','+974 6697 2786','97466972786'],
 ['ezdan-wukair','Ezdan Oasis (Al Wukair)','+974 7737 6786','97477376786'],
]){
 const url=new URL(buildBookingWhatsAppUrl({...details,branch:slug},{slug,name_en,phone},service));
 assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/'+expected);assert.equal(url.searchParams.size,1);
 const message=url.searchParams.get('text');
 for(const value of [details.contact_name,details.email,details.phone,details.vehicle_type,details.vehicle_details,details.preferred_date,details.preferred_time,details.message,name_en,service.title_en])assert.ok(message.includes(value));
}
const branch={slug:'b-ring',name_en:'B-Ring Branch',phone:'+974 7000 0000'};
assert.equal(new URL(buildBookingWhatsAppUrl(details,branch,service)).pathname,'/97470000000');
assert.equal(normalizeWhatsAppNumber('7778 9303'),'97477789303');
assert.equal(normalizeWhatsAppNumber('00974 7778 9303'),'97477789303');
assert.throws(()=>buildBookingWhatsAppUrl(details,undefined,service),/select a branch/);
assert.throws(()=>buildBookingWhatsAppUrl(details,{...branch,slug:'wrong-branch'},service),/select a branch/);
assert.throws(()=>buildBookingWhatsAppUrl(details,branch,undefined),/select a service/);
for(const phone of ['', '123', '+974 7778 9303 / +974 6697 2786', 'call 77789303'])assert.throws(()=>normalizeWhatsAppNumber(phone),/valid WhatsApp number/);
const optional=new URL(buildBookingWhatsAppUrl({...details,email:'',vehicle_details:'',preferred_time:'',message:''},branch,service)).searchParams.get('text');
assert.ok(!optional.includes('Email:'));assert.ok(!optional.includes('Additional notes:'));assert.ok(optional.includes('Any available time'));
console.log('WhatsApp booking checks passed: all three branches, CMS phone changes, encoded details, optional fields and invalid destinations.');
