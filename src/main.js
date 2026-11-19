import './styles.css';
import * as THREE from 'three';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {birthdayConfig as config} from './data/birthdayConfig.js';
import {SoundManager} from './audio/SoundManager.js';
import {InteractionManager} from './interaction/InteractionManager.js';
import {memoryArtwork} from './utils/textures.js';
import {referenceView} from './scene/referenceLook.js';

gsap.registerPlugin(ScrollTrigger);
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sound=new SoundManager();
const lenis=new Lenis({lerp:.075,smoothWheel:!reducedMotion,syncTouch:false});
lenis.on('scroll',ScrollTrigger.update);
const state={progress:0,x:referenceView.x,y:referenceView.y,z:referenceView.z,lx:referenceView.x,ly:referenceView.y,lz:0};
let world,interaction,focused=false,activeView='overview',inspectedMemory=null,toastTimer,disposed=false,lastTime=0,firstCrossing=false,micRequest=0,fallbackCandlesLit=true;
const pollen=document.createElement('div');pollen.className='hero-pollen';pollen.setAttribute('aria-hidden','true');
for(let i=0;i<22;i++){const mote=document.createElement('i');mote.style.cssText=`left:${(i*37.7)%100}%;top:${35+(i*17.3)%62}%;--delay:-${i*.83}s;--duration:${8+(i%5)*2}s;--size:${i%3===0?3:2}px`;pollen.appendChild(mote);}document.body.appendChild(pollen);
const found=new Set();const possibleDiscoveries=new Set([...config.gifts.map(g=>g.id),...config.hiddenEasterEggs.map(g=>g.id)]);
const dialog=$('#keepsake-dialog');const content=$('#dialog-content');
const chapterTitles=[['01 — The invitation','Follow the golden light.','Every beautiful story begins with a little curiosity.'],['02 — The flower path','Somewhere, something lovely awaits.','Take the long way. Let the flowers brush past you.'],['03 — The threshold','Leave the ordinary behind.','A little courage. A little curiosity. One step into the light.'],['04 — The celebration','All of this, just for you.','A gathering of favourite moments, and wishes still to come.'],['05 — Your sanctuary','Make yourself a memory.','Stay as long as you like. This little world is yours.']];

$('#recipient-name').textContent=`${config.recipientName}.`;
if('scrollRestoration' in history)history.scrollRestoration='manual';
window.scrollTo(0,0);

function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}

function discover(id){
  if(!possibleDiscoveries.has(id)||found.has(id))return;
  found.add(id);$('#discovery-count').textContent=found.size;
  const item=config.hiddenEasterEggs.find(e=>e.id===id)||config.gifts.find(e=>e.id===id);
  toast(`✧ ${item?.label||'A little wonder found'} · ${found.size} of 12 discovered`);
  if(found.size===12){setTimeout(()=>{toast('All twelve little wonders. You brought this world to life.');sound.chime();fireworks();},1800);}
}

function maxScroll(){return Math.max(1,document.documentElement.scrollHeight-innerHeight);}
function goTo(progress,duration=2.8){
  closeDialog();backToSanctuary(false);lenis.start();
  lenis.scrollTo(maxScroll()*progress,{duration:reducedMotion?.01:duration,easing:t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,force:true});
}

const master=gsap.timeline({scrollTrigger:{trigger:'.scroll-track',start:'top top',end:'bottom bottom',scrub:reducedMotion?true:1.5},onUpdate:updateJourney});
master.to(state,{progress:.15,duration:.15,ease:'none'})
  .to(state,{progress:.45,z:4.5,y:1.5,ly:2.05,duration:.3,ease:'none'})
  .to(state,{progress:.7,z:-1.2,y:1.7,lz:-6.8,ly:1.8,duration:.25,ease:'none'})
  .to(state,{progress:.82,x:-.4,y:2.1,z:-1.8,lx:-2.4,ly:1.8,lz:-7,duration:.12,ease:'none'})
  .to(state,{progress:.9,x:1.35,y:2.65,z:-2.2,lx:-.8,ly:2.1,lz:-7.6,duration:.08,ease:'none'})
  .to(state,{progress:1,duration:.1,ease:'none'});

function updateJourney(){
  const p=state.progress,heroOpacity=1-THREE.MathUtils.smoothstep(p,.015,.13),artOpacity=document.body.classList.contains('static-world')||!world?.isReady?1:1-THREE.MathUtils.smoothstep(p,.012,.075);
  $('#intro').style.opacity=heroOpacity;$('#intro').style.transform=`translateY(${-p*160}px)`;$('#intro').style.pointerEvents=p<.09?'auto':'none';$('#intro').inert=p>.1;
  $('#door-hint').style.opacity=heroOpacity;$('#artwork').style.opacity=artOpacity;$('#artwork').style.visibility=artOpacity>.001?'visible':'hidden';
  pollen.style.opacity=artOpacity;$('#portal-hotspot').hidden=p>.1;
  $('#artwork').style.transform='none';
  $('.atmosphere').style.opacity=1-THREE.MathUtils.smoothstep(p,.06,.27)*.62;
  const chapter=p<.15?0:p<.45?1:p<.7?2:p<.9?3:4;
  const captionOpacity=THREE.MathUtils.smoothstep(p,.14,.2)*(1-THREE.MathUtils.smoothstep(p,.75,.86));
  $('#chapter-caption').style.opacity=captionOpacity;$('#chapter-caption').style.transform=`translateY(${(1-captionOpacity)*15}px)`;
  $('#chapter-eyebrow').textContent=chapterTitles[chapter][0];$('#chapter-title').textContent=chapterTitles[chapter][1];$('#chapter-description').textContent=chapterTitles[chapter][2];
  $('#rail-number').textContent=String(chapter+1).padStart(2,'0');$('#rail-progress').style.height=`${p*100}%`;
  document.querySelectorAll('.chapter-dot').forEach((dot,i)=>{dot.classList.toggle('current',i===chapter);dot.setAttribute('aria-current',i===chapter?'step':'false');});
  const exploring=p>.88;
  $('#explore').classList.toggle('visible',exploring);$('#explore').inert=!exploring;
  $('#discovery').style.display=exploring?'flex':'none';
  $('#footer').style.opacity=1-THREE.MathUtils.smoothstep(p,.75,.88);$('#footer').style.pointerEvents=p>.8?'none':'auto';$('#footer').inert=p>.8;
  $('#sanctuary-heading').style.opacity=focused?0:THREE.MathUtils.smoothstep(p,.82,.94);
  document.querySelectorAll('.header-nav .nav-link').forEach((el,i)=>el.classList.toggle('active',i===(exploring?1:0)));
  if(p>.64&&!firstCrossing){firstCrossing=true;sound.chime();if(world)world.effects.burst(new THREE.Vector3(0,1.8,-1),'#ffdb9d');}
  if(p<.3)firstCrossing=false;
  $('#portal-flash').style.opacity=reducedMotion?0:Math.sin(THREE.MathUtils.smoothstep(p,.58,.7)*Math.PI)*.24;
}

$('#begin-button').addEventListener('click',()=>goTo(.98,10));
$('#portal-hotspot').addEventListener('click',()=>goTo(.98,10));
$('#discovery').addEventListener('click',showWonders);
$('#scroll-cue').addEventListener('click',()=>goTo(.32,3));
$('.wordmark').addEventListener('click',e=>{e.preventDefault();goTo(0,2);});
document.querySelectorAll('[data-journey]').forEach(button=>button.addEventListener('click',()=>goTo(button.dataset.journey==='start'?0:.98,3.5)));
document.querySelectorAll('[data-progress]').forEach(button=>button.addEventListener('click',()=>goTo(Number(button.dataset.progress),2.6)));
$('#sound-button').addEventListener('click',async()=>{try{const enabled=await sound.toggle();$('#sound-button').setAttribute('aria-pressed',enabled);$('#sound-button').setAttribute('aria-label',`Turn ambient sound ${enabled?'off':'on'}`);$('#sound-label').textContent=`Sound ${enabled?'on':'off'}`;}catch(error){toast(error.message);}});

function overviewPosition(){return innerWidth<700?[2,2.9,-2.2]:[1.35,2.65,-2.2];}
function cameraTo(position,target,duration=1.8){
  if(!world)return;gsap.killTweensOf(world.camera.position);gsap.killTweensOf(world.lookAt);
  gsap.to(world.camera.position,{x:position[0],y:position[1],z:position[2],duration:reducedMotion?0:duration,ease:'power2.inOut'});
  gsap.to(world.lookAt,{x:target[0],y:target[1],z:target[2],duration:reducedMotion?0:duration,ease:'power2.inOut'});
}

function setView(view){
  focused=true;activeView=view;lenis.stop();$('#back-button').hidden=false;$('#sanctuary-heading').style.opacity=0;
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===view));
  const mobile=innerWidth<700;
  if(view==='memories')cameraTo(mobile?[-3.4,2.2,-3.6]:[-2.3,2.1,-3.7],[-4.1,1.9,-7]);
  else if(view==='cake')cameraTo(mobile?[1,2.8,-5.1]:[1.15,2.6,-5.3],[0,2,-7.7]);
  else if(view==='gifts')cameraTo([3,2.6,-4.8],[1.4,1.5,-7.3]);
  else cameraTo(overviewPosition(),[-.8,2.1,-7.6]);
}

function backToSanctuary(animate=true){
  if(animate&&state.progress<.88){goTo(.98,1.4);return;}
  restoreMemory();focused=false;activeView='overview';$('#back-button').hidden=true;
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view==='overview'));
  if(animate){focused=true;cameraTo(overviewPosition(),[-.8,2.1,-7.6],1.4);gsap.delayedCall(reducedMotion?0:1.45,()=>{if(activeView==='overview'){focused=false;lenis.start();updateJourney();}});}else lenis.start();
}
$('#back-button').addEventListener('click',()=>{closeDialog();backToSanctuary();});

function openDialog(html,{memory=false}={}){
  sound.stopMicrophone();micRequest++;content.innerHTML=html;dialog.classList.toggle('memory-inspection',memory);
  lenis.stop();if(!dialog.open)dialog.showModal();else $('#dialog-close').focus({preventScroll:true});if(interaction)interaction.enabled=false;
}
function closeDialog(){sound.stopMicrophone();micRequest++;if(dialog.open)dialog.close();}
dialog.addEventListener('close',()=>{sound.stopMicrophone();micRequest++;restoreMemory();if(!focused)lenis.start();});
dialog.addEventListener('cancel',()=>{sound.stopMicrophone();micRequest++;});
$('#dialog-close').addEventListener('click',closeDialog);
dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeDialog();}});

function heading(eyebrow,title,message='',star='✧'){
  return `<div class="dialog-eyebrow">${esc(eyebrow)}</div><div class="dialog-star">${star}</div><h2 id="dialog-title" class="dialog-title">${esc(title)}</h2>${message?`<p class="dialog-message">${esc(message)}</p>`:''}`;
}

function showMemories(){
  restoreMemory();openDialog(heading('A collection of us','The moments we keep.','Little pieces of a life beautifully lived. Pick a memory to turn it over.')+`<div class="memory-grid">${config.polaroidMemories.map((m,i)=>`<button class="memory-card" data-memory="${i}" aria-label="Open memory: ${esc(m.caption)}"><img src="${esc(m.previewUrl)}" alt="Illustrated memory: ${esc(m.caption)}" /><span>${esc(m.caption)}</span></button>`).join('')}</div>`);
}

function inspectMemory(index,object){
  restoreMemory();const data=config.polaroidMemories[index];discover('memories');
  if(object&&world){
    const original={parent:object.parent,position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()};
    world.scene.attach(object);object.userData.inspecting=true;inspectedMemory={object,original,flipped:false};
    const target=world.camera.localToWorld(new THREE.Vector3(-.65,.02,-1.85));
    gsap.to(object.position,{x:target.x,y:target.y,z:target.z,duration:reducedMotion?0:.9,ease:'power2.inOut'});
    const q=world.camera.quaternion;gsap.to(object.quaternion,{x:q.x,y:q.y,z:q.z,w:q.w,duration:reducedMotion?0:.9});gsap.to(object.scale,{x:1,y:1,z:1,duration:reducedMotion?0:.9});
  }
  openDialog(heading(data.date,data.caption)+`<div class="memory-detail"><div class="polaroid-flipper" id="polaroid-flipper"><img src="${esc(data.previewUrl)}" alt="${esc(data.caption)}" /><div class="polaroid-back"><span>${esc(data.backHandwrittenNote)}</span><small>with love, always ♡</small></div></div></div><div class="dialog-actions"><button class="paper-button primary" data-action="flip">Turn the memory over ↻</button><button class="paper-button" data-action="memories">All memories</button></div>`,{memory:true});
}

function restoreMemory(){
  if(!inspectedMemory)return;const {object,original}=inspectedMemory;
  gsap.killTweensOf(object.position);gsap.killTweensOf(object.quaternion);gsap.killTweensOf(object.scale);
  original.parent.add(object);object.position.copy(original.position);object.quaternion.copy(original.quaternion);object.scale.copy(original.scale);object.userData.inspecting=false;inspectedMemory=null;
}
function flipMemory(){
  const flip=$('#polaroid-flipper');if(!flip)return;flip.classList.toggle('flipped');const flipped=flip.classList.contains('flipped');
  const button=content.querySelector('[data-action="flip"]');button.textContent=flipped?'Back to the photograph ↻':'Turn the memory over ↻';
  if(inspectedMemory&&world){inspectedMemory.flipped=flipped;const q=world.camera.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),flipped?Math.PI:0));gsap.to(inspectedMemory.object.quaternion,{x:q.x,y:q.y,z:q.z,w:q.w,duration:reducedMotion?0:.8,ease:'power2.inOut'});}
  sound.note(79,.05);
}

function showNote(data){discover('note');openDialog(heading('A note, tucked away',data.title)+`<p class="dialog-message handwritten">${esc(data.message)}</p><p class="dialog-message handwritten">— ${esc(data.author)}</p><div class="dialog-actions"><button class="paper-button" data-action="close">Keep it close ♡</button></div>`);}

function showCake(){
  const lit=world?.sanctuary.table.candlesLit??fallbackCandlesLit;
  openDialog(heading('One more trip around the sun',lit?'A little wish. A little magic.':'Some wishes deserve an encore.',lit?'Close your eyes. Think of something wonderful. The universe is listening.':'Your wish is out there, finding its way. You can light the candles and wish again.','♧')+`<div class="birthday-motif" aria-hidden="true">✧ <span>♧</span> ✧</div><div class="dialog-actions">${lit?'<button class="paper-button primary" data-action="blow">Make a wish & blow out the candles</button><button class="paper-button" data-action="microphone">Use my microphone</button>':'<button class="paper-button primary" data-action="relight">Relight the candles</button>'}</div><p class="mic-status" id="mic-status">${lit?'Microphone is optional, stays on your device, and stops when you close this card.':'A little more candlelight, a little more wonder.'}</p>`);
}

function fireworks(){
  if(!world)return;const origins=[[-3,4.5,-12],[3.5,5.5,-12],[0,6,-15],[-1,4,-9]];
  origins.forEach((p,i)=>gsap.delayedCall(reducedMotion?0:i*.5,()=>world.effects.burst(new THREE.Vector3(...p),['#f3c87f','#d4acdc','#a9c9c0','#ef9d9f'][i],true)));
}

function blowCandles(){
  micRequest++;sound.stopMicrophone();fallbackCandlesLit=false;discover('wish');
  if(world){world.sanctuary.table.setCandles(false,world.effects);world.effects.burst(new THREE.Vector3(0,2.4,-7.7),'#f2c88e',true);gsap.to(world.hemisphere,{intensity:.75,duration:3});gsap.to(world.sun,{intensity:1.3,duration:3});}
  sound.chime();fireworks();
  openDialog(heading('Your wish has wings now',`Happy birthday, ${config.recipientName}.`,config.birthdayWish,'✶')+`<p class="dialog-message handwritten">Here’s to the beautiful things still on their way.</p><div class="dialog-actions"><button class="paper-button primary" data-action="close">Keep exploring the magic ↗</button><button class="paper-button" data-action="relight">Make another wish</button></div>`);
}

function showGifts(){openDialog(heading('Four little things, wrapped with love','Good things come in little boxes.','Choose one. There is no wrong place to start.')+`<div class="gift-list">${config.gifts.map((g,i)=>`<button class="gift-card" data-gift="${i}" style="--gift-color:${esc(g.boxColor)}"><span>♢</span><b>${esc(g.label)}</b><small>${found.has(g.id)?'OPEN AGAIN ↗':'UNTIE THE RIBBON ↗'}</small></button>`).join('')}</div>`);}

function giftSurprise(data,index){
  discover(data.id);if(data.surpriseType==='music'){if(sound.enabled)sound.birthday();}
  let extra='';
  if(data.surpriseType==='photos')extra=`<div class="memory-grid">${config.polaroidMemories.slice(0,4).map((m,i)=>`<button class="memory-card" data-memory="${i}"><img src="${esc(m.previewUrl)}" alt="${esc(m.caption)}" /></button>`).join('')}</div>`;
  if(data.surpriseType==='voucher')extra='<div class="voucher"><small>A LITTLE BIRTHDAY PROMISE</small>One beautiful adventure<small>VALID FOR: YOU & YOUR FAVOURITE PERSON</small><small>EXPIRY DATE: NEVER</small></div>';
  if(data.surpriseType==='music')extra=`<div class="dialog-actions"><button class="paper-button primary" data-action="melody">${sound.enabled?'Play the melody again ♫':'Turn sound on & play ♫'}</button></div>`;
  if(data.mediaUrl){const url=esc(data.mediaUrl);if(data.surpriseType==='video')extra=`<video class="dialog-media" controls playsinline src="${url}"></video>`;else if(data.surpriseType==='audio')extra=`<audio class="dialog-media" controls src="${url}"></audio>`;else extra+=`<img class="dialog-media" src="${url}" alt="${esc(data.title)}" />`;}
  openDialog(heading(`Gift ${String(index+1).padStart(2,'0')} — Wrapped with love`,data.title,data.message,'◇')+extra+`<div class="dialog-actions"><button class="paper-button" data-action="gifts">The other little gifts →</button></div>`);
}

function openGift(index,object){
  closeDialog();setView('gifts');const data=config.gifts[index];const gift=object||world?.sanctuary.table.gifts[index];
  const reveal=()=>{if(world){const position=new THREE.Vector3();gift.getWorldPosition(position);position.y+=.6;world.effects.burst(position,data.confettiColor);}sound.chime();giftSurprise(data,index);};
  if(gift&&world&&!reducedMotion)world.sanctuary.table.unwrap(gift,reveal);else reveal();
}

function showWonders(){
  const items=[...config.hiddenEasterEggs,...config.gifts];
  openDialog(heading('For the beautifully curious',`${found.size} of 12 little wonders.`,found.size===12?'Every secret found. Every little corner loved. This world is a little brighter because you explored it.':'A melody in the bunting. A wish in a lantern. A secret in a flower. Follow your curiosity.')+`<div class="wonder-list">${items.map(item=>`<button class="wonder-item ${found.has(item.id)?'found':''}" data-wonder="${esc(item.id)}"><span>${found.has(item.id)?'✦':'✧'}</span>${esc(item.label)}</button>`).join('')}</div>`);
}

function onSelect(data,object){
  if(data.type==='memory'){setView('memories');gsap.delayedCall(reducedMotion?0:1.1,()=>inspectMemory(data.index,object));}
  else if(data.type==='note')showNote(data.data);
  else if(data.type==='cake'){setView('cake');showCake();}
  else if(data.type==='gift')openGift(data.index,object);
  else if(data.type==='banner'){
    discover('banner');sound.note([67,67,69,67,72,71,67,67,69,67,74,72,79][data.index%13]);if(!sound.enabled)toast('A birthday song in the wind. Turn sound on to hear it.');
    if(object){gsap.fromTo(object.rotation,{z:-.18},{z:0,duration:.8,ease:'elastic.out(1,.25)'});}
  }else if(data.type==='lantern'){
    discover('lantern');if(object)world.sanctuary.launch(object);sound.note(84,.07,3);toast('A wish, taking flight. May it find its way.');
  }else if(data.type==='butterflies'){
    discover(data.id);if(world){const origin=new THREE.Vector3();object?.getWorldPosition(origin);if(!object)origin.set(1,1.5,-6);world.effects.butterfliesAt(origin);}sound.chime();
  }else if(data.type==='secret'){
    discover(data.id);const secret=config.hiddenEasterEggs.find(e=>e.id===data.id);openDialog(heading('A small secret, just for you',secret.label,secret.message,'✶'));sound.chime();
  }
}

document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
  closeDialog();const view=button.dataset.view;
  if(view==='overview'){backToSanctuary();return;}
  if(view==='wonders'){showWonders();return;}
  setView(view);
  if(view==='memories')showMemories();else if(view==='cake')showCake();else if(view==='gifts')showGifts();
}));

content.addEventListener('click',async e=>{
  const memory=e.target.closest('[data-memory]'),gift=e.target.closest('[data-gift]'),action=e.target.closest('[data-action]'),wonder=e.target.closest('[data-wonder]');
  if(memory){inspectMemory(Number(memory.dataset.memory),world?.sanctuary.memories.memories[Number(memory.dataset.memory)]);return;}
  if(gift){openGift(Number(gift.dataset.gift));return;}
  if(wonder){
    const id=wonder.dataset.wonder;closeDialog();
    const giftIndex=config.gifts.findIndex(g=>g.id===id);if(giftIndex>=0){openGift(giftIndex);return;}
    if(id==='memories'){setView('memories');showMemories();return;}if(id==='wish'){setView('cake');showCake();return;}if(id==='note'){showNote(config.handwrittenNotes[0]);return;}
    const obj=interaction?.roots.find(o=>o.userData.interaction.id===id);
    const type=id==='lantern'?'lantern':id==='banner'?'banner':id==='topper'?'secret':'butterflies';onSelect({type,id,index:0},obj);return;
  }
  if(!action)return;
  const name=action.dataset.action;
  if(name==='close')closeDialog();else if(name==='memories')showMemories();else if(name==='gifts')showGifts();else if(name==='flip')flipMemory();else if(name==='blow')blowCandles();
  else if(name==='relight'){fallbackCandlesLit=true;world?.sanctuary.table.setCandles(true);if(world){gsap.to(world.hemisphere,{intensity:1.15,duration:1});gsap.to(world.sun,{intensity:2.4,duration:1});}showCake();sound.chime();}
  else if(name==='melody'){
    try{if(!sound.enabled){await sound.toggle();$('#sound-button').setAttribute('aria-pressed','true');$('#sound-label').textContent='Sound on';$('#sound-button').setAttribute('aria-label','Turn ambient sound off');}sound.birthday();action.textContent='A song, just for you ♫';}catch(error){toast(error.message);}
  }else if(name==='microphone'){
    const request=++micRequest;action.disabled=true;$('#mic-status').textContent='Allow microphone access, then gently blow toward your device…';
    try{await sound.startMicrophone(()=>{if(request===micRequest&&dialog.open)blowCandles();});if(request!==micRequest||!dialog.open){sound.stopMicrophone();return;}$('#mic-status').textContent='Listening… a gentle, steady blow will do. The microphone stops after 15 seconds.';action.disabled=false;action.textContent='Listening for your wish…';}
    catch(error){sound.stopMicrophone();if(request!==micRequest)return;action.disabled=false;$('#mic-status').textContent=error.name==='NotAllowedError'?'Microphone permission was declined. The blow-out button works just as beautifully.':error.message;}
  }
});
window.addEventListener('mic-timeout',()=>{const status=$('#mic-status');if(status)status.textContent='The microphone has stopped. Try again, or use the blow-out button.';const button=content.querySelector('[data-action="microphone"]');if(button){button.disabled=false;button.textContent='Try microphone again';}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.open&&focused)backToSanctuary();});

async function init(){
  await document.fonts.ready;
  try{
    const {World}=await import('./scene/World.js');world=new World($('#world'),config,reducedMotion);
    await world.ready;
    interaction=new InteractionManager({camera:world.camera,scene:world.scene,canvas:world.renderer.domElement,onSelect});
    world.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();toast('The scene paused. Reload to bring the meadow back.');});
    world.renderer.compile(world.scene,world.camera);world.isReady=true;$('#scene-status').classList.add('loaded');
  }catch(error){
    console.error('Unable to initialize the 3D scene:',error);world?.dispose();world=null;
    config.polaroidMemories.forEach((m,i)=>{m.previewUrl=memoryArtwork(m,i).image.toDataURL('image/webp');});
    $('#scene-status').textContent='A quiet version of the magic. All keepsakes are still here.';
    document.body.classList.add('static-world');
  }
  ScrollTrigger.refresh();updateJourney();
}

function tick(seconds){
  if(disposed)return;const delta=Math.min(seconds-lastTime,.05)||.016;lastTime=seconds;lenis.raf(seconds*1000);
  if(world?.isReady&&!document.hidden){
    if(!focused){
      const bob=reducedMotion||state.progress>.88?0:Math.sin(seconds*3)*.012*THREE.MathUtils.smoothstep(state.progress,.15,.3);
      const mobile=innerWidth<700&&state.progress>.82;
      const m=mobile?THREE.MathUtils.smoothstep(state.progress,.82,.94):0;
      world.camera.position.set(THREE.MathUtils.lerp(state.x,2,m),THREE.MathUtils.lerp(state.y,2.9,m)+bob,state.z);world.lookAt.set(state.lx,state.ly,state.lz);
    }
    if(state.progress>.008)world.update(seconds,delta,state.progress);else world.portal.update(reducedMotion?0:seconds,state.progress);interaction.enabled=state.progress>.25&&!dialog.open;interaction.portalOnly=state.progress<.64;interaction.update();
  }
}
gsap.ticker.add(tick);gsap.ticker.lagSmoothing(0);
document.addEventListener('visibilitychange',()=>{if(document.hidden){sound.stopMicrophone();sound.context?.suspend();}else if(sound.enabled)sound.context?.resume();});
window.addEventListener('pagehide',()=>{sound.stopMicrophone();});
if(import.meta.hot)import.meta.hot.dispose(()=>{disposed=true;gsap.ticker.remove(tick);master.scrollTrigger?.kill();master.kill();lenis.destroy();interaction?.dispose();world?.dispose();sound.dispose();});
init();

// Exposes rendering metrics for the local verification script.
window.__threejsLibrary={get ready(){return !!world?.isReady;},get progress(){return state.progress;},get discoveries(){return [...found];},get doorAngle(){return world?.portal.doorPivot.rotation.y||0;},get renderInfo(){return world?{calls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles}:null;}};
