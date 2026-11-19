import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { canvasTexture, seededRandom } from '../utils/textures.js';

function flowerTexture(type) {
  const random=seededRandom(type*30+33);
  return canvasTexture(256,512,(ctx)=>{
    const stem=(x,y,baseX=128,baseY=510)=>{ctx.strokeStyle='#6e883a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(baseX,baseY);ctx.quadraticCurveTo(x-10,(y+baseY)/2,x,y);ctx.stroke();};
    const leaf=(x,y,dir)=>{ctx.fillStyle='#658337';ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+dir*55,y-45,x+dir*60,y-65);ctx.quadraticCurveTo(x+dir*3,y-55,x,y);ctx.fill();};
    const bloom=(x,y,r,color,petals=11)=>{
      ctx.save();ctx.translate(x,y);ctx.scale(1,.67);
      for(let j=0;j<petals;j++) {ctx.save();ctx.rotate(j/petals*Math.PI*2);const g=ctx.createLinearGradient(0,-r,0,-r*.2);g.addColorStop(0,color);g.addColorStop(1,type===2?'#473da3':'#cb8b43');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,-r*.55,r*.19,r*.6,0,0,Math.PI*2);ctx.fill();ctx.restore();}
      ctx.fillStyle=type===2?'#dfc16a':'#90632a';ctx.beginPath();ctx.arc(0,0,r*.2,0,Math.PI*2);ctx.fill();ctx.restore();
    };
    if(type===0){
      for(let s=0;s<3;s++){const x=70+s*62,y=45+s*30;stem(x,y);leaf(110,390,s%2?1:-1);for(let j=0;j<23;j++){const yy=y+j*12,ww=4+j*.6;for(let k=0;k<3;k++){ctx.fillStyle=['#8b73d5','#b494df','#7252bb','#b187db'][(j+k+s)%4];ctx.beginPath();ctx.ellipse(x+(k-1)*ww,yy,6+j*.13,7, (k-1)*.6,0,Math.PI*2);ctx.fill();}}}
    }else{
      for(let s=0;s<4;s++){const x=45+s*53+(random()-.5)*25,y=95+random()*170;stem(x,y);leaf(100+s*9,370,s%2?1:-1);bloom(x,y,25+random()*16,type===1?'#f8c52d':type===2?'#6488ee':'#ed92c6',type===3?8:12);}
    }
  });
}

export class MeadowPathway {
  constructor(scene, mobile=false) {
    this.time={value:0};this.reveal={value:0};this.meshes=[];const random=seededRandom(125);this.noise=createNoise2D(seededRandom(34));
    const terrain=new THREE.PlaneGeometry(230,230,160,160);terrain.rotateX(-Math.PI/2);this.terrain=terrain;
    const pos=terrain.attributes.position;const colors=[];
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,this.height(x,z));
      const path=Math.abs(x-this.pathX(z))<.95 && z>-3;
      const color=new THREE.Color(path?'#756746':'#2c411c');color.multiplyScalar(.8+random()*.4);colors.push(color.r,color.g,color.b);
    }
    terrain.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrain.computeVertexNormals();
    const ground=new THREE.Mesh(terrain,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.receiveShadow=true;ground.visible=false;scene.add(ground);
    const grassGeometry=new THREE.BufferGeometry();
    grassGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.016,0,0,.016,0,0,-.012,.25,.015,.012,.25,.015,0,.58,.09],3));
    grassGeometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,.5,1,.5,.5,1],2));grassGeometry.setIndex([0,1,2,1,3,2,2,3,4]);grassGeometry.computeVertexNormals();
    const grassMaterial=new THREE.MeshStandardMaterial({color:'#7e913c',side:THREE.DoubleSide,roughness:.92});
    grassMaterial.onBeforeCompile=shader=>{this.revealShader(shader);shader.uniforms.uTime=this.time;shader.vertexShader='uniform float uTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 root=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
      transformed.x+=sin(uTime*1.2+root.x*.4+root.z*.3)*pow(uv.y,2.)*.16;
      transformed.z+=cos(uTime*.8+root.x*.2)*uv.y*.08;`);};
    const count=55000;const grass=new THREE.InstancedMesh(grassGeometry,grassMaterial,count);const dummy=new THREE.Object3D();const color=new THREE.Color();
    for(let i=0;i<count;i++){
      let x=(random()-.5)*78,z=(random()-.5)*64-8;
      if(i<40000){x=(random()-.5)*32;z=random()*38-19;}
      if(Math.abs(x-this.pathX(z))<.65&&z>-3)x+=Math.sign(x||1)*.8;
      const rugDistance=Math.hypot(x,z+7.7);if(rugDistance<3.85){const a=Math.atan2(z+7.7,x);x=Math.cos(a)*3.85;z=-7.7+Math.sin(a)*3.85;}
      dummy.position.set(x,this.height(x,z),z);dummy.rotation.y=random()*Math.PI;dummy.scale.set(.6+random()*.6,.55+random()*.65,1);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);color.setHSL(.19+random()*.065,.38+random()*.3,.13+random()*.13);grass.setColorAt(i,color);
    }
    grass.instanceMatrix.needsUpdate=true;grass.frustumCulled=false;scene.add(grass);this.grass=grass;this.meshes.push(grass);
    for(let type=0;type<4;type++){
      const map=flowerTexture(type);
      const mat=new THREE.MeshStandardMaterial({map,alphaTest:.3,alphaToCoverage:true,side:THREE.DoubleSide,roughness:.86,emissive:'#663e18',emissiveIntensity:.07});
      mat.onBeforeCompile=shader=>{this.revealShader(shader);shader.uniforms.uTime=this.time;shader.vertexShader='uniform float uTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        vec3 root=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
        transformed.x+=sin(uTime+root.x*.4+root.z*.5)*uv.y*uv.y*.09;`);};
      const geo=new THREE.PlaneGeometry(type===0?.42:.58,type===0?1.18:.85,1,5);geo.translate(0,type===0?.59:.425,0);
      const flowers=new THREE.InstancedMesh(geo,mat,type===0?(mobile?600:1000):(mobile?1400:2600));
      for(let i=0;i<flowers.count;i++){
        let z=random()*54-28;let x=(random()-.5)*66;
        if(i<flowers.count*.72)x=(random()>.5?1:-1)*(.95+random()*11);
        if(type===0)x=(x<0?-1:1)*(2.8+Math.abs(x)*.8);
        if(Math.abs(x-this.pathX(z))<.7&&z>-3)x+=Math.sign(x||1)*1.1;
        const rugDistance=Math.hypot(x,z+7.7);if(rugDistance<4.0){const a=Math.atan2(z+7.7,x);x=Math.cos(a)*4;z=-7.7+Math.sin(a)*4;}
        dummy.position.set(x,this.height(x,z),z);dummy.rotation.y=random()*Math.PI;dummy.scale.setScalar(.55+random()*.7);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);
      }
      flowers.frustumCulled=false;scene.add(flowers);this.meshes.push(flowers);
    }
  }
  pathX(z){return Math.sin(z*.22)*.45*Math.min(1,Math.max(0,z*.14));}
  height(x,z){const distance=Math.max(0,Math.hypot(x,z)-14);return this.noise(x*.035,z*.035)*Math.min(.55,distance*.025)-.08;}
  revealShader(shader){shader.uniforms.uReveal=this.reveal;shader.vertexShader='uniform float uReveal;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vec3 seedPosition=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
    float seed=fract(sin(dot(seedPosition.xz,vec2(12.9898,78.233)))*43758.5453)*.7;
    float growth=smoothstep(seed,seed+.3,uReveal);
    transformed*=growth;`);}
  update(time,progress){this.time.value=time;this.reveal.value=THREE.MathUtils.smoothstep(progress,.14,.48);this.meshes.forEach(mesh=>mesh.visible=this.reveal.value>0);}
}
