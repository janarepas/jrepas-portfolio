import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContent, siteContentScript } from '../functions/lib/content.js';
import { verifyAccess } from '../functions/lib/access.js';
import { database } from './helpers/database.js';
import { handleAdmin } from '../functions/admin/api/[[path]].js';

const content = text => ({ translations:{'22':{hu:text}}, images:{hero:'https://example.com/hero.webp'} });
function request(action,body,headers={}) { return new Request('https://jrepas.hu/admin/api/'+action,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json',Origin:'https://jrepas.hu','X-Requested-With':'jrepas-admin'}:{}),...headers},body:body?JSON.stringify(body):undefined}); }
const user = async()=>({email:'owner@example.com',sub:'owner'});
function environment(db){return {SITE_DB:db,CF_ACCESS_TEAM_DOMAIN:'admin-tests.cloudflareaccess.com',CF_ACCESS_AUD:'test-audience'};}

test('draft edits do not publish; explicit publication uses a version-checked database write', async()=>{
 const db=database(),env=environment(db);const call=(action,body)=>handleAdmin({env,request:request(action,body)},user);
 let result=await (await call('content')).json();assert.equal(result.draft.revision,0);assert.deepEqual(result.published.content.translations,{});
 assert.equal((await call('draft',{revision:0,content:content('Első piszkozat')})).status,200);
 result=await (await call('content')).json();assert.equal(result.draft.content.translations['22'].hu,'Első piszkozat');assert.deepEqual(result.published.content.translations,{});
 assert.equal((await call('publish',{revision:1})).status,200);
 assert.equal((await call('draft',{revision:0,content:content('Stale write')})).status,409);
 assert.equal((await call('draft',{revision:1,content:content('Második piszkozat')})).status,200);
 assert.equal((await call('publish',{revision:1})).status,409);
 result=await (await call('content')).json();assert.equal(result.published.content.translations['22'].hu,'Első piszkozat');assert.equal(result.draft.content.translations['22'].hu,'Második piszkozat');db.close();
});

test('admin rejects missing bindings, unauthenticated requests and cross-origin mutations', async()=>{
 assert.equal((await handleAdmin({env:{},request:request('content')})).status,503);
 const db=database(),env=environment(db);
 assert.equal((await handleAdmin({env,request:request('content')})).status,401);
 assert.equal((await handleAdmin({env,request:request('draft',{revision:0,content:content('x')},{Origin:'https://attacker.example'})},user)).status,403);
 assert.equal((await handleAdmin({env,request:request('draft',{revision:0,content:content('x')},{'X-Requested-With':''})},user)).status,403);db.close();
});

test('content validation rejects executable image URLs and unknown fields; script embedding cannot break out',()=>{
 for(const url of ['javascript:alert(1)','data:image/svg+xml,x','//attacker.example/x','http://example.com/x','/\\attacker/x']) assert.throws(()=>validateContent({translations:{},images:{hero:url}}));
 assert.throws(()=>validateContent({translations:{unknown:{hu:'x'}},images:{}}));
 assert.throws(()=>validateContent({translations:{'22':{de:'x'}},images:{}}));
 assert.throws(()=>validateContent({...content('x'),settings:{email:'name@example.com\r\nBcc:x'}}));
 assert.throws(()=>validateContent({...content('x'),settings:{upworkUrl:'https://attacker.example/freelancers/name'}}));
 const input=validateContent(content('</script><img src=x onerror=alert(1)>'));
 const html=siteContentScript(input);assert.equal((html.match(/<script/g)||[]).length,1);assert.equal((html.match(/<\/script>/g)||[]).length,1);assert(!html.includes('<img'));
 assert.equal(JSON.parse(html.slice(html.indexOf('>')+1,html.lastIndexOf('</script>'))).translations['22'].hu,input.translations['22'].hu);
});

test('Cloudflare Access JWT signature, expiry, audience and issuer are verified',async()=>{
 const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const publicKey=await crypto.subtle.exportKey('jwk',pair.publicKey);publicKey.kid='test-key';
 const env={CF_ACCESS_TEAM_DOMAIN:'jwt-tests.cloudflareaccess.com',CF_ACCESS_AUD:'aud'};
 const fetcher=async url=>{assert.equal(url,'https://jwt-tests.cloudflareaccess.com/cdn-cgi/access/certs');return Response.json({keys:[publicKey]});};
 const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 async function token(overrides={}){const head=encode({alg:'RS256',kid:'test-key'});const payload=encode({iss:'https://jwt-tests.cloudflareaccess.com',aud:['aud'],sub:'owner',email:'owner@example.com',exp:Date.now()/1000+120,...overrides});const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(head+'.'+payload));return head+'.'+payload+'.'+Buffer.from(signature).toString('base64url');}
 const valid=await token();assert.equal((await verifyAccess(new Request('https://jrepas.hu/admin/',{headers:{'Cf-Access-Jwt-Assertion':valid}}),env,fetcher)).email,'owner@example.com');
 assert.equal((await verifyAccess(new Request('https://jrepas.hu/?admin-preview=1',{headers:{cookie:'CF_Authorization='+valid}}),env,fetcher)).sub,'owner');
 for(const changes of [{exp:0},{aud:['other']},{iss:'https://attacker.example'}])await assert.rejects(()=>token(changes).then(value=>verifyAccess(new Request('https://jrepas.hu/admin/',{headers:{'Cf-Access-Jwt-Assertion':value}}),env,fetcher)));
 const pieces=valid.split('.');pieces[1]=encode({iss:'https://jwt-tests.cloudflareaccess.com',aud:['aud'],sub:'attacker',email:'attacker@example.com',exp:Date.now()/1000+120});await assert.rejects(()=>verifyAccess(new Request('https://jrepas.hu/admin/',{headers:{'Cf-Access-Jwt-Assertion':pieces.join('.')}}),env,fetcher));
});
