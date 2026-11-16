import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, createHmac } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { createDatabase } from './database.mjs';

const url = process.env.TEST_DATABASE_URL;
if (!url || !/^amigos_test_[a-z0-9_]+$/.test(new URL(url).pathname.slice(1))) throw new Error('Use a disposable amigos_test_* database.');
const port = process.env.TEST_PORT || '3101';
const origin = `http://127.0.0.1:${port}`;
const password = randomBytes(24).toString('base64url');
const authSecret = randomBytes(48).toString('hex');
const child = spawn(process.execPath, ['scripts/run-next.mjs', '--dev'], {
  cwd: process.cwd(), windowsHide: true,
  env: {...process.env, NODE_ENV:'development',PORT:port,DATABASE_URL:url,DATABASE_SSL:'false',ADMIN_INITIAL_USERNAME:'http-test-admin',ADMIN_INITIAL_EMAIL:'http-test@example.com',ADMIN_INITIAL_PASSWORD:password,AUTH_SECRET:authSecret,MAIL_MODE:'console',MFA_DISABLED_FOR_LOCAL_TEST:'false',SMTP_HOST:''},
  stdio:['ignore','pipe','pipe'],
});
let output = '';
child.stdout.on('data', chunk => { output += chunk; });
child.stderr.on('data', chunk => { output += chunk; });
const waitFor = async predicate => {
  const deadline = Date.now()+60000;
  while (!predicate()) {
    if (child.exitCode !== null) throw new Error('Test app exited before verification.');
    if (Date.now()>deadline) throw new Error('Timed out waiting for test app.');
    await new Promise(resolve => setTimeout(resolve,100));
  }
};
let cookie = '';
const request = async (endpoint, {method='GET',body,status=200}={}) => {
  const headers = cookie ? {cookie} : {};
  if (body && !(body instanceof FormData)) { headers['Content-Type']='application/json';body=JSON.stringify(body); }
  const response = await fetch(origin+endpoint,{method,headers,body,signal:AbortSignal.timeout(30000)});
  const value = await response.json();
  assert.equal(response.status,status,`${method} ${endpoint}: ${JSON.stringify(value)}`);
  if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
  return value;
};
const db = await createDatabase({DATABASE_URL:url,DATABASE_SSL:'false'});
const attachments = [];
try {
  await waitFor(() => output.includes('Amigos platform ready'));
  await request('/api/health');
  const site = await request('/api/public/site');
  assert.equal(site.services.length,8); assert.equal(site.branches.length,3);
  assert.ok(Array.isArray(site.services[0].details_en));
  assert.deepEqual(site.services.find(service=>service.slug==='periodic-maintenance').gallery_images,['/assets/periodic-maintenance-drive.jpg']);
  assert.equal((await request('/api/public/site')).services.length,8);
  await request('/api/admin/services',{status:401});
  const challenge = await request('/api/auth/login',{method:'POST',body:{username:'http-test-admin',password}});
  await waitFor(()=> /\[LOCAL MFA\] http-test@example.com: (\d{6})/.test(output));
  const code = output.match(/\[LOCAL MFA\] http-test@example.com: (\d{6})/)[1];
  await request('/api/auth/verify',{method:'POST',body:{challengeId:challenge.challengeId,code}});
  assert.ok(cookie.includes('amigos_admin_session='));
  const adminSession = await request('/api/auth/session');
  assert.ok(JSON.stringify(adminSession).includes('http-test-admin'));
  for (const [collection,body] of [
    ['services',{slug:'http-service',title_en:'HTTP service',summary_en:'Service test',details_en:['اختبار'],image_path:'/assets/oil-change-web.jpg',active:false}],
    ['branches',{slug:'http-branch',name_en:'HTTP branch',address_en:'Doha Qatar'}],
    ['offers',{title_en:'HTTP offer',description_en:'Offer test',starts_at:'2026-01-01T00:00:00Z',ends_at:null,status:'published'}],
  ]) {
    const created=await request(`/api/admin/${collection}`,{method:'POST',body,status:201});
    const changed=await request(`/api/admin/${collection}`,{method:'PUT',body:{id:created.id,...(collection==='branches'?{name_en:'Updated branch'}:{title_en:'Updated item'})}});
    assert.equal(changed.id,created.id);
    assert.ok((await request(`/api/admin/${collection}`)).some(item=>item.id===created.id));
    if(collection==='services'){assert.equal(changed.active,false);assert.deepEqual(changed.details_en,['اختبار']);}
    if(collection==='offers')assert.ok((await request('/api/public/site')).offers.some(item=>item.id===created.id));
    await request(`/api/admin/${collection}?id=${created.id}`,{method:'DELETE'});
  }
  const settings=await request('/api/admin/site');
  await request('/api/admin/site',{method:'PUT',body:{...settings,business_name:'MySQL Test Workshop'}});
  assert.equal((await request('/api/public/site')).settings.business_name,'MySQL Test Workshop');
  const booking=await request('/api/public/enquiries',{method:'POST',status:201,body:{kind:'booking',contact_name:'HTTP test',email:'test@example.com',message:'Please book an oil change.'}});
  assert.match(booking.reference,/^[a-f0-9-]{36}$/);
  const business=new FormData();
  for(const [key,value] of Object.entries({company:'Test company',type:'Fleet',name:'Test contact',email:'test@example.com',phone:'+97412345678',subject:'Business enquiry',message:'This is a test business enquiry message.',consent:'yes'}))business.set(key,value);
  await request('/api/public/business',{method:'POST',body:business,status:201});
  const career=new FormData();
  for(const [key,value] of Object.entries({name:'Test applicant',email:'test@example.com',phone:'+97412345678',role:'Mechanic',experience:'5 years',message:'This is a test application.',consent:'yes'}))career.set(key,value);
  career.set('cv',new Blob(['%PDF-1.4\nTest CV'],{type:'application/pdf'}),'mysql-test-cv.pdf');
  await request('/api/public/careers',{method:'POST',body:career,status:201});
  const inbox=await request('/api/admin/enquiries');
  assert.equal(inbox.length,3);
  const cv=inbox.find(item=>item.kind==='career').metadata.cv;
  attachments.push(path.join(process.cwd(),'data','private-cv',path.basename(cv.fileName)));
  const download=await fetch(origin+`/api/admin/enquiries?attachment=${inbox.find(item=>item.kind==='career').id}`,{headers:{cookie}});
  assert.equal(download.status,200);assert.ok((await download.text()).startsWith('%PDF'));
  await request('/api/public/analytics',{method:'POST',body:{path:'/'},status:202});
  assert.equal((await request('/api/admin/analytics')).today,1);
  await request('/api/auth/logout',{method:'POST'});
  await request('/api/admin/enquiries',{status:401});
  assert.equal(Number((await db.query('SELECT count(*) AS count FROM audit_events')).rows[0].count),10);
  // Expired sessions must not grant CMS access.
  const admin=(await db.query("SELECT id FROM admins WHERE username='http-test-admin'")).rows[0];
  const expiredToken=randomBytes(32).toString('base64url');
  await db.insert('admin_sessions',{admin_id:admin.id,token_hash:createHmac('sha256',authSecret).update(expiredToken).digest('hex'),expires_at:new Date(Date.now()-60000)});
  cookie=`amigos_admin_session=${expiredToken}`;
  await request('/api/admin/services',{status:401});
  const expiredChallenge=await request('/api/auth/login',{method:'POST',body:{username:'http-test-admin',password}});
  await db.query('UPDATE login_challenges SET expires_at=$1 WHERE id=$2',[new Date(Date.now()-60000),expiredChallenge.challengeId]);
  await request('/api/auth/verify',{method:'POST',body:{challengeId:expiredChallenge.challengeId,code:'000000'},status:401});
  console.log('MariaDB HTTP checks passed: seed, MFA login, sessions, CMS CRUD, settings, booking, business, CV upload/download, analytics, logout.');
} finally {
  child.kill('SIGTERM');
  await db.close();
  for(const file of attachments)await unlink(file).catch(()=>{});
}
