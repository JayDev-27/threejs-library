import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.APP_URL||'http://localhost:5173';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-fake-device-for-media-stream','--enable-webgl','--ignore-gpu-blocklist']});
try {
  const context=await browser.newContext({viewport:{width:1600,height:1000},reducedMotion:'reduce'});
  await context.grantPermissions(['microphone'],{origin:base});
  await context.addInitScript(()=>{
    const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia=async(...args)=>{const stream=await original(...args);window.__micTracks=stream.getTracks();if(window.__delayMic)await new Promise(resolve=>setTimeout(resolve,window.__delayMic));return stream;};
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__siyaverse?.ready);
  await page.locator('#begin-button').click();await page.waitForFunction(()=>window.__siyaverse.progress>.94);
  await page.mouse.move(950,550);await page.waitForTimeout(400);
  assert.match(await page.locator('#tooltip').textContent(),/Make a birthday wish/,'Hovering the rendered cake should raycast the cake.');
  await page.mouse.click(950,550);await page.locator('[data-action="microphone"]').waitFor();
  await page.locator('[data-action="microphone"]').click();
  await page.waitForFunction(()=>window.__micTracks?.length>0);
  await page.locator('#dialog-close').click();
  await page.waitForFunction(()=>window.__micTracks?.every(track=>track.readyState==='ended'));
  assert.equal(await page.evaluate(()=>window.__micTracks.every(track=>track.readyState==='ended')),true,'Closing the modal should stop every microphone track.');
  await page.evaluate(()=>{window.__delayMic=500;window.__micTracks=null;});
  await page.locator('[data-view="cake"]').click();await page.locator('[data-action="microphone"]').click();
  await page.waitForFunction(()=>window.__micTracks?.length>0);await page.locator('#dialog-close').click();
  await page.waitForFunction(()=>window.__micTracks?.every(track=>track.readyState==='ended'));
  assert.deepEqual(errors,[]);
  const fallback=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'||type==='experimental-webgl'?null:original.call(this,type,...args);};});
  await fallback.goto(base,{waitUntil:'networkidle'});await fallback.waitForSelector('body.static-world');
  await fallback.locator('#begin-button').click();await fallback.waitForFunction(()=>window.__siyaverse.progress>.94);
  assert.equal(await fallback.locator('#artwork').evaluate(el=>getComputedStyle(el).opacity),'1');
  await fallback.locator('[data-view="memories"]').click();assert.equal(await fallback.locator('.memory-card').count(),8);
  await fallback.locator('#dialog-close').click();await fallback.locator('[data-view="cake"]').click();
  await fallback.locator('[data-action="blow"]').click();await fallback.locator('[data-action="relight"]').click();await fallback.locator('[data-action="blow"]').waitFor();
  console.log(JSON.stringify({production:true,raycastClick:true,syntheticMicrophoneCleanup:true,pendingPermissionCleanup:true,webglFallback:true,errors},null,2));
} finally {await browser.close();}
