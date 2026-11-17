import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const manifest=JSON.parse(fs.readFileSync(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'));
const source=fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
function runtime(fetch){const handlers={};const writes=[];const fallback=new Response('offline fallback');const context={URL,Request,Response,Set,Promise,Error,fetch,caches:{open:async()=>({put:async(...args)=>writes.push(args)}),keys:async()=>[],delete:async()=>true,match:async()=>fallback},self:{location:{origin:'https://birthday.test'},addEventListener:(name,callback)=>handlers[name]=callback,skipWaiting:async()=>{},clients:{claim:async()=>{}}}};vm.runInNewContext(source,context);return {handlers,writes,fallback}}
function dispatch(handler,request){let response;handler({request,respondWith:value=>{response=value}});return response}
test('manifest has standalone mode, valid scope and correctly sized PNG icons',()=>{
 assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'/');assert.equal(manifest.scope,'/');
 for(const icon of manifest.icons){const png=fs.readFileSync(new URL('../public'+icon.src,import.meta.url));const [width,height]=icon.sizes.split('x').map(Number);assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),height)}
 assert.ok(manifest.icons.some(icon=>icon.purpose==='maskable'));
});
test('offline navigation uses the event fallback without storing personal pages',async()=>{
 const app=runtime(async()=>{throw Error('offline')});const request={url:'https://birthday.test/admin',method:'GET',mode:'navigate'};
 assert.equal(await dispatch(app.handlers.fetch,request),app.fallback);assert.equal(app.writes.length,0);
});
test('API calls, submissions, sign-in and external requests are never intercepted',()=>{
 const app=runtime(async()=>{throw Error('must not fetch')});
 for(const request of [{url:'https://birthday.test/api/admin',method:'GET',mode:'cors'},{url:'https://birthday.test/api/rsvp',method:'POST',mode:'cors'},{url:'https://birthday.test/signin-with-chatgpt',method:'GET',mode:'navigate'},{url:'https://external.test/',method:'GET',mode:'navigate'}])assert.equal(dispatch(app.handlers.fetch,request),undefined);
});
test('online navigation stays fresh and is not cached',async()=>{
 const response=new Response('current page');const app=runtime(async()=>response);
 assert.equal(await dispatch(app.handlers.fetch,{url:'https://birthday.test/',method:'GET',mode:'navigate'}),response);assert.equal(app.writes.length,0);
});
test('installation rejects auth redirects instead of caching a login page',async()=>{
 const app=runtime(async()=>({ok:true,redirected:true,url:'https://birthday.test/signin-with-chatgpt'}));let installed;
 app.handlers.install({waitUntil:promise=>installed=promise});await assert.rejects(installed,/Offline asset unavailable/);assert.equal(app.writes.length,0);
});
