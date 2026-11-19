import {mergeStaticMeshes} from '../../utils/mergeStaticMeshes.js';
import * as THREE from 'three';
import gsap from 'gsap';
import {box,labelTexture,tube,seededRandom} from '../../utils/textures.js';

export class CelebrationTable {
  constructor(parent,wood,config){
    this.group=new THREE.Group();this.group.position.set(0,0,-7.7);parent.add(this.group);this.candlesLit=true;this.flames=[];this.candleLights=[];this.gifts=[];
    const cream=new THREE.MeshStandardMaterial({color:'#f6e3ca',roughness:.82});
    const gold=new THREE.MeshStandardMaterial({color:'#d7b56b',metalness:.6,roughness:.35});
    const rose=new THREE.MeshStandardMaterial({color:'#c88f8c',roughness:.82});
    const green=new THREE.MeshStandardMaterial({color:'#657d42',roughness:.9});
    const rug=new THREE.Mesh(new THREE.CircleGeometry(3.7,64),new THREE.MeshStandardMaterial({color:'#b5a47d',roughness:1}));rug.rotation.x=-Math.PI/2;rug.position.y=-.055;this.group.add(rug);
    const rugRing=new THREE.Mesh(new THREE.RingGeometry(3.3,3.4,64),new THREE.MeshStandardMaterial({color:'#877454',side:THREE.DoubleSide}));rugRing.rotation.x=-Math.PI/2;rugRing.position.y=-.05;this.group.add(rugRing);
    this.group.add(box(4.8,.15,1.65,wood,0,1.15,0));
    for(const x of [-2,2])for(const z of [-.55,.55])this.group.add(box(.12,1.1,.12,wood,x,.55,z));
    this.group.add(box(4.45,.08,.08,wood,0,.3,0));
    const runner=box(.98,.018,1.72,new THREE.MeshStandardMaterial({color:'#e9d8b6',roughness:1}),0,1.24,0);this.group.add(runner);
    this.cake=new THREE.Group();this.cake.position.set(0,1.26,0);this.cake.userData.interaction={type:'cake',id:'wish',label:'Make a birthday wish'};this.group.add(this.cake);
    const cylinder=(r1,r2,h,mat,y)=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,48),mat);mesh.position.y=y;mesh.castShadow=true;mesh.receiveShadow=true;return mesh;};
    this.cake.add(cylinder(.5,.5,.05,gold,.13),cylinder(.09,.18,.18,gold,.05),cylinder(.57,.57,.065,cream,.23),cylinder(.52,.52,.41,cream,.46),cylinder(.36,.36,.32,rose,.82));
    for(const [r,y] of [[.51,.66],[.35,.99]]){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.028,8,60),cream);ring.rotation.x=Math.PI/2;ring.position.y=y;this.cake.add(ring);
      for(let i=0;i<22;i++){const a=i/22*Math.PI*2;const pearl=new THREE.Mesh(new THREE.SphereGeometry(.026,7,5),cream);pearl.position.set(Math.cos(a)*r,y-.06,Math.sin(a)*r);this.cake.add(pearl);}
    }
    for(let i=0;i<7;i++){
      const a=i/7*Math.PI*2;const candle=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.25,8),i%2?cream:gold);candle.position.set(Math.cos(a)*.24,1.1,Math.sin(a)*.24);this.cake.add(candle);
      const flame=new THREE.Mesh(new THREE.SphereGeometry(.035,10,10),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uSeed:{value:i}},vertexShader:'uniform float uTime;uniform float uSeed;varying vec3 vP;void main(){vP=position;vec3 p=position;p.x+=sin(uTime*8.+uSeed)*.007*(position.y+.04)*10.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'varying vec3 vP;void main(){gl_FragColor=vec4(mix(vec3(1.,.35,.04),vec3(1.,.97,.63),smoothstep(.03,-.03,vP.y))*1.7,.92);}'}));flame.scale.set(.65,1.8,.65);flame.position.copy(candle.position);flame.position.y+=.18;this.cake.add(flame);this.flames.push(flame);
    }
    const candleLight=new THREE.PointLight('#ffbe65',2,3,2);candleLight.position.set(0,1.3,0);this.cake.add(candleLight);this.candleLights.push(candleLight);
    const starShape=new THREE.Shape();for(let i=0;i<10;i++){const a=i/10*Math.PI*2+Math.PI/2,r=i%2?.055:.13;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?starShape.lineTo(x,y):starShape.moveTo(x,y);}starShape.closePath();
    this.topper=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape,{depth:.025,bevelEnabled:false}),gold);this.topper.position.set(0,1.52,0);this.topper.userData.interaction={type:'secret',id:'topper',label:'The brightest little star'};this.cake.add(this.topper);this.cake.add(box(.012,.32,.012,gold,0,1.3,0));
    const plaque=new THREE.Mesh(new THREE.PlaneGeometry(.5,.2),new THREE.MeshBasicMaterial({map:labelTexture('make a wish',{font:'60px Caveat',background:'#f1e2c3'})}));plaque.position.set(0,.47,.526);this.cake.add(plaque);
    // Strawberry clusters along the lower tier.
    const strawberryMat=new THREE.MeshStandardMaterial({color:'#ac4d43',roughness:.5});
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2,s=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),strawberryMat);s.scale.y=1.3;s.position.set(Math.cos(a)*.45,.71,Math.sin(a)*.45);this.cake.add(s);}
    this.bouquet=new THREE.Group();this.bouquet.position.set(-1.5,1.25,-.08);this.bouquet.userData.interaction={type:'butterflies',id:'butterflies',label:'A flutter of wonder'};this.group.add(this.bouquet);
    const vase=new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(.12,0),new THREE.Vector2(.2,.08),new THREE.Vector2(.22,.3),new THREE.Vector2(.13,.45)],24),new THREE.MeshStandardMaterial({color:'#ded2b3',roughness:.7}));this.bouquet.add(vase);
    const random=seededRandom(28);const petals=[rose,new THREE.MeshStandardMaterial({color:'#e2c366',side:THREE.DoubleSide}),new THREE.MeshStandardMaterial({color:'#a898d1',side:THREE.DoubleSide}),cream];
    for(let i=0;i<19;i++){
      const x=(random()-.5)*.65,z=(random()-.5)*.5,y=.65+random()*.35;
      this.bouquet.add(tube([new THREE.Vector3(0,.15,0),new THREE.Vector3(x*.5,.5,z*.5),new THREE.Vector3(x,y,z)],.006,'#688244'));
      const flower=new THREE.Group();flower.position.set(x,y,z);flower.rotation.x=(random()-.5)*.8;flower.rotation.z=(random()-.5)*.8;
      for(let j=0;j<7;j++){const a=j/7*Math.PI*2,p=new THREE.Mesh(new THREE.SphereGeometry(.052,8,5),petals[i%4]);p.scale.set(.6,.25,1);p.position.set(Math.cos(a)*.065,0,Math.sin(a)*.065);p.rotation.y=-a+Math.PI/2;flower.add(p);}
      const center=new THREE.Mesh(new THREE.SphereGeometry(.025,7,5),gold);flower.add(center);this.bouquet.add(flower);
      const leaf=new THREE.Mesh(new THREE.SphereGeometry(.05,6,4),green);leaf.scale.set(.4,1.5,.2);leaf.position.set(x*.5,.5,z*.5);leaf.rotation.z=.7;this.bouquet.add(leaf);
    }
    const spots=[[1.35,1.25,.2],[1.95,1.25,-.13],[2.45,.02,.2],[-2.2,.02,.8]];
    config.gifts.forEach((data,i)=>{
      const g=this.makeGift(data,i);g.position.set(...spots[i]);g.rotation.y=[-.15,.12,.2,-.18][i];this.group.add(g);this.gifts.push(g);
    });
    mergeStaticMeshes(this.bouquet);mergeStaticMeshes(this.cake);
  }
  makeGift(data,index){
    const group=new THREE.Group(),size=index===2?.65:.46,h=index===1?.62:.44;
    const mat=new THREE.MeshStandardMaterial({color:data.boxColor,roughness:.7}),ribbonMat=new THREE.MeshStandardMaterial({color:data.ribbonColor,roughness:.35,metalness:.15});
    group.add(box(size,h,size,mat,0,h/2,0));
    const lid=new THREE.Group();lid.position.y=h+.035;lid.add(box(size+.035,.075,size+.035,mat));group.add(lid);
    const ribbons=new THREE.Group();ribbons.add(box(.07,h+.07,size+.02,ribbonMat,0,h/2,0),box(size+.02,h+.07,.07,ribbonMat,0,h/2,0));group.add(ribbons);
    for(const side of [-1,1]){const bow=new THREE.Mesh(new THREE.TorusGeometry(.075,.013,7,18),ribbonMat);bow.scale.set(1.3,.6,1);bow.rotation.x=-.45;bow.rotation.y=side*.5;bow.position.set(side*.065,.07,0);lid.add(bow);}
    group.userData.interaction={type:'gift',id:data.id,label:data.label,data,index};group.userData.lid=lid;group.userData.ribbons=ribbons;group.userData.lidY=lid.position.y;
    return group;
  }
  unwrap(gift,onComplete){
    if(gift.userData.opened){onComplete();return;}
    gift.userData.opened=true;const y=gift.position.y;
    gsap.timeline({onComplete}).to(gift.rotation,{z:.045,duration:.1,repeat:5,yoyo:true}).to(gift.userData.ribbons.scale,{x:1.8,z:1.8,y:.05,duration:.4}).to(gift.userData.lid.position,{y:gift.userData.lidY+.8,x:.2,duration:.7,ease:'back.out(1.5)'},'<').to(gift.userData.lid.rotation,{z:-.3,y:.3,duration:.6},'<').to(gift.position,{y:y+.04,duration:.2,yoyo:true,repeat:1},'<');
  }
  setCandles(lit,effects){
    this.candlesLit=lit;this.flames.forEach(f=>{f.visible=lit;if(!lit&&effects){const origin=new THREE.Vector3();f.getWorldPosition(origin);effects.smokeAt(origin);}});this.candleLights.forEach(l=>l.intensity=lit?2:0);
  }
  update(time){this.flames.forEach((f,i)=>{f.material.uniforms.uTime.value=time;f.scale.y=1.7+Math.sin(time*9+i)*.15;});if(this.candlesLit)this.candleLights.forEach(l=>l.intensity=1.8+Math.sin(time*7)*.2);}
}
