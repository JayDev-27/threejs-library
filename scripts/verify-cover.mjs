import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const base=process.env.APP_URL||'http://localhost:5173';
const errors=[],missing=[];
try{
  const page=await browser.newPage({viewport:{width:1672,height:941},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
  await page.goto(base,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__threejsLibrary?.ready);
  await page.waitForTimeout(900);
  assert.match(await page.locator('#artwork').evaluate(el=>getComputedStyle(el).backgroundImage),/closed-door-cover/);
  assert.equal(await page.evaluate(()=>window.__threejsLibrary.doorAngle),0);
  await page.screenshot({path:'test-results/new-cover.png'});
  for(const p of [.04,.085,.15,.3,.45,.65,.98]){
    await page.evaluate(p=>window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*p),p);
    await page.waitForFunction(p=>Math.abs(window.__threejsLibrary.progress-p)<.002,p);
    await page.waitForTimeout(200);
    await page.screenshot({path:`test-results/continuity-${String(Math.round(p*100)).padStart(2,'0')}.png`});
    if(p===.085)assert.equal(await page.evaluate(()=>window.__threejsLibrary.doorAngle),0,'The door stays closed throughout the cover-to-scene handoff.');
  }
  assert((await page.evaluate(()=>window.__threejsLibrary.doorAngle))>1.5);
  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForFunction(()=>window.__threejsLibrary.progress<.001);
  assert.equal(await page.evaluate(()=>window.__threejsLibrary.doorAngle),0,'Reverse scrolling closes the door.');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
  await page.screenshot({path:'test-results/new-cover-mobile.png'});
  await page.evaluate(()=>window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*.15));await page.waitForFunction(()=>Math.abs(window.__threejsLibrary.progress-.15)<.002);
  await page.screenshot({path:'test-results/continuity-mobile.png'});
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  await writeFile('test-results/cover-verification.json',JSON.stringify({passed:true,closedCover:true,continuousScroll:true,reversible:true,errors,missing},null,2));
  console.log(JSON.stringify({passed:true,closedCover:true,continuousScroll:true,reversible:true,errors,missing}));
}finally{await browser.close();}
