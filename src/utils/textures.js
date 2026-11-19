import * as THREE from 'three';

export function seededRandom(seed = 42) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function woodTexture() {
  const random = seededRandom(96);
  return canvasTexture(512, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#918978'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2700; i++) {
      const x = random() * w, y = random() * h;
      ctx.strokeStyle = `rgba(${random() > .48 ? '38,28,22' : '224,220,199'},${random() * .24})`;
      ctx.lineWidth = random() * 2 + .3; ctx.beginPath(); ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + random() * 9, y + 80, x - random() * 8, y + 170, x + random() * 5, y + 300); ctx.stroke();
    }
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = 'rgba(23,23,17,.5)'; ctx.fillRect(i * w / 6, 0, 2, h);
      ctx.fillStyle = 'rgba(228,220,196,.2)'; ctx.fillRect(i * w / 6 + 3, 0, 2, h);
    }
    for (let i = 0; i < 65; i++) {
      ctx.fillStyle = `rgba(49,41,31,${random() * .35})`;
      ctx.fillRect(random() * w, random() * h, random() * 8 + 1, random() * 110);
    }
  });
}

export function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  let line = ''; let row = 0;
  for (const word of text.split(' ')) {
    if (ctx.measureText(line + word).width > maxWidth && line) { ctx.fillText(line.trim(), x, y + row * lineHeight); row++; line = ''; }
    line += word + ' ';
  }
  ctx.fillText(line.trim(), x, y + row * lineHeight);
}

export function memoryArtwork(memory, index = 0) {
  return canvasTexture(512, 560, (ctx, w) => {
    const random = seededRandom(index * 100 + 2);
    ctx.fillStyle = '#faf4e9'; ctx.fillRect(0, 0, w, 560);
    ctx.save(); ctx.beginPath(); ctx.rect(25, 25, 462, 420); ctx.clip();
    const palettes = [['#657e94', '#e7b79c'], ['#99a6aa', '#f0cfaa'], ['#bb9b7e', '#eee0c0'], ['#222c4d', '#b48f9e'], ['#739585', '#e1ca99'], ['#e6bba5', '#9baf91'], ['#a1859f', '#f2be7c'], ['#91b5bc', '#f0d9b1']];
    const [top, bottom] = palettes[index % 8];
    const gradient = ctx.createLinearGradient(0, 25, 0, 445); gradient.addColorStop(0, top); gradient.addColorStop(1, bottom);
    ctx.fillStyle = gradient; ctx.fillRect(25, 25, 462, 420);
    const circle = (x,y,r,c) => { ctx.fillStyle=c; ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill(); };
    if (['mountains', 'forest', 'stars', 'coast', 'sunset'].includes(memory.scene)) {
      circle(340, 133, 34, memory.scene === 'stars' ? '#f7e6ba' : '#ffe4a3');
      for (let layer = 0; layer < 4; layer++) {
        ctx.fillStyle = ['#747d7e', '#576d70', '#475d5c', '#344c45'][layer];
        ctx.beginPath(); ctx.moveTo(0, 450);
        for (let x = 0; x <= 520; x += 35) ctx.lineTo(x, 235 + layer * 45 + Math.sin(x * .016 + layer * 4) * 44 - random() * 32);
        ctx.lineTo(520, 450); ctx.fill();
      }
      if (memory.scene === 'coast') {
        ctx.fillStyle = '#94b6af';ctx.fillRect(25, 300,462,145);
        for(let i=0;i<30;i++){ctx.fillStyle='rgba(244,224,175,.4)';ctx.fillRect(random()*460,320+random()*120,random()*90,2);}
      }
      if (memory.scene === 'stars') for (let i=0;i<90;i++) circle(random()*512,random()*245,random()*1.5,'#f4e6c9');
      if (memory.scene === 'forest') for(let i=0;i<18;i++) { const x=random()*512;ctx.fillStyle='#2c4e40';ctx.beginPath();ctx.moveTo(x,120+random()*70);ctx.lineTo(x-27,390);ctx.lineTo(x+27,390);ctx.fill(); }
    } else if(memory.scene === 'coffee') {
      ctx.fillStyle='#8b6350';ctx.fillRect(25,320,462,125);
      for(const x of [170,335]) { circle(x,300,62,'#e9d7b8');circle(x,292,48,'#f4e5ca');circle(x,292,37,'#6b4734');ctx.strokeStyle='#eee3c8';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,292,18,0,Math.PI*1.6);ctx.stroke(); }
      ctx.fillStyle='#e2d1b0';ctx.save();ctx.translate(110,380);ctx.rotate(-.14);ctx.fillRect(0,0,145,70);ctx.restore();
    } else if (memory.scene === 'flowers') {
      for(let i=0;i<45;i++){const x=random()*512,y=90+random()*350;ctx.strokeStyle='#5d7752';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,460);ctx.lineTo(x,y);ctx.stroke();for(let p=0;p<7;p++)circle(x+Math.cos(p)*13,y+Math.sin(p)*13,9,['#d88d9a','#ead8b2','#e0b751'][i%3]);circle(x,y,6,'#a07833');}
    } else {
      for(let i=0;i<12;i++){const x=65+random()*390,y=90+random()*220;ctx.strokeStyle='#867c71';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-25,460);ctx.stroke();ctx.save();ctx.translate(x,y);ctx.scale(.8,1);circle(0,0,30,['#cf9293','#e5c886','#92a7a6'][i%3]);ctx.restore();}
    }
    for(let i=0;i<4500;i++){ctx.fillStyle=`rgba(246,220,184,${random()*.08})`;ctx.fillRect(random()*512,random()*450,1.5,1.5);}
    ctx.restore();ctx.fillStyle='#5a4b45';ctx.font='32px Caveat, cursive';ctx.textAlign='center';ctx.fillText(memory.caption,256,494);ctx.font='10px sans-serif';ctx.letterSpacing='3px';ctx.fillStyle='#978a78';ctx.fillText(memory.date,256,533);
  });
}

export function noteTexture(note) {
  return canvasTexture(512, 560, ctx => {
    ctx.fillStyle = note.paperColor || '#f3e5ca'; ctx.fillRect(0,0,512,560);
    ctx.fillStyle = '#6b5144';ctx.font='40px Caveat, cursive';ctx.fillText(note.title || 'A moment to keep',40,80);
    ctx.font='30px Caveat, cursive';wrapText(ctx,note.message || note.backHandwrittenNote,40,145,430,42);
    ctx.font='25px Caveat, cursive';ctx.fillText(note.author || 'with love, always',40,510);
  });
}

export function labelTexture(text, { color='#6a5141', background='#f1dfbd', width=512, height=256, font='70px Cormorant Garamond' }={}) {
  return canvasTexture(width, height, (ctx,w,h) => { ctx.fillStyle=background;ctx.fillRect(0,0,w,h);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=font;ctx.fillText(text,w/2,h/2,w*.88); });
}

export function glowTexture() {
  return canvasTexture(64,64,(ctx)=>{const g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#ffffff');g.addColorStop(.12,'#fff1b0');g.addColorStop(.35,'rgba(255,190,80,.35)');g.addColorStop(1,'rgba(255,150,35,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);});
}

export function box(w,h,d,material,x=0,y=0,z=0) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}

export function tube(points, radius=.012, color='#725f47') {
  const curve=new THREE.CatmullRomCurve3(points);
  return new THREE.Mesh(new THREE.TubeGeometry(curve,40,radius,5,false),new THREE.MeshStandardMaterial({color,roughness:.85}));
}
