import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';

const output='deliverables';
await mkdir(`${output}/recording`,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:1440,height:810},deviceScaleFactor:1,recordVideo:{dir:`${output}/recording`,size:{width:960,height:540}}});
  const videoStart=performance.now();
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(process.env.APP_URL||'http://localhost:4173',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__siyaverse?.ready,{timeout:60000});
  await page.waitForTimeout(1000);
  assert.equal(await page.title(),'SiyaVerse — A little world, just for you');
  assert.equal(await page.locator('.wordmark').innerText(),'SiyaVerse');
  assert.equal(await page.locator('.brand-mark').count(),1);
  await page.screenshot({path:`${output}/SiyaVerse-cover.png`});
  const captureStart=performance.now();
  await page.waitForTimeout(1400);
  await page.locator('#begin-button').click();
  await page.waitForFunction(()=>window.__siyaverse.progress>.975,{timeout:45000});
  await page.waitForTimeout(2500);
  await page.screenshot({path:`${output}/SiyaVerse-sanctuary.png`});
  const captureEnd=performance.now();
  const rawVideo=await page.video().path();
  const metrics=await page.evaluate(()=>({progress:window.__siyaverse.progress,render:window.__siyaverse.renderInfo,overflow:document.documentElement.scrollWidth>innerWidth}));
  assert.equal(metrics.overflow,false);assert.deepEqual(errors,[]);
  await context.close();
  const metadata={rawVideo,trimStartSeconds:(captureStart-videoStart)/1000,durationSeconds:(captureEnd-captureStart)/1000,metrics,errors};
  await writeFile(`${output}/recording/metadata.json`,JSON.stringify(metadata,null,2));
  console.log(JSON.stringify(metadata,null,2));
}finally{await browser.close();}
