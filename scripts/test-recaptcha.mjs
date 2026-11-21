import assert from 'node:assert/strict';
import {verifyRecaptcha} from '../lib/recaptcha.ts';
const env=process.env;const originalFetch=globalThis.fetch;
try{
 env.RECAPTCHA_SITE_KEY='';env.RECAPTCHA_SECRET_KEY='';env.RECAPTCHA_REQUIRED='false';assert.equal(await verifyRecaptcha(''),'ok');
 env.RECAPTCHA_REQUIRED='true';assert.equal(await verifyRecaptcha(''),'unavailable');
 env.RECAPTCHA_SITE_KEY='test-site';env.RECAPTCHA_SECRET_KEY='test-secret';assert.equal(await verifyRecaptcha(''),'invalid');
 env.RECAPTCHA_ALLOWED_HOSTNAMES='amigoscarcare.com';
 let payload;globalThis.fetch=async(url,options)=>{assert.equal(url,'https://www.google.com/recaptcha/api/siteverify');payload=options.body;return new Response(JSON.stringify({success:true,hostname:'amigoscarcare.com'}),{status:200})};
 assert.equal(await verifyRecaptcha('valid-token'),'ok');assert.equal(payload.get('response'),'valid-token');assert.equal(payload.get('secret'),'test-secret');
 globalThis.fetch=async()=>new Response(JSON.stringify({success:true,hostname:'attacker.example'}),{status:200});assert.equal(await verifyRecaptcha('token'),'invalid');
 globalThis.fetch=async()=>new Response(JSON.stringify({success:false}),{status:200});assert.equal(await verifyRecaptcha('token'),'invalid');
 globalThis.fetch=async()=>{throw Error('offline')};assert.equal(await verifyRecaptcha('token'),'unavailable');
 console.log('reCAPTCHA checks passed: required keys, tokens, hostname and fail-closed handling.');
}finally{globalThis.fetch=originalFetch}
